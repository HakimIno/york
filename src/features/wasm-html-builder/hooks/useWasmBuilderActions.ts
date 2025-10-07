import { useCallback } from 'react';
import { Element, ElementStyle } from '../module/wasm-interface';

interface UseWasmBuilderActionsProps {
  wasmEngine: any;
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  selectedElementId: string | null;
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingElementId: React.Dispatch<React.SetStateAction<string | null>>;
  setShowStylePanel: React.Dispatch<React.SetStateAction<boolean>>;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  lockedElements: Set<string>;
  styleTemplate: Partial<ElementStyle> | null;
  setStyleTemplate: React.Dispatch<
    React.SetStateAction<Partial<ElementStyle> | null>
  >;
  pendingUpdatesRef: React.MutableRefObject<
    Map<string, { x: number; y: number; width: number; height: number }>
  >;
  contentUpdateTimeoutsRef: React.MutableRefObject<Map<string, NodeJS.Timeout>>;
  undoRedo: any;
  copyPaste: any;
  templateManager: any;
  refreshElements: () => void;
  // Performance optimization: HashMap for O(1) element lookup
  getElementById: (id: string) => Element | undefined;
}

export const useWasmBuilderActions = ({
  wasmEngine,
  elements,
  setElements,
  selectedElementId,
  setSelectedElementId,
  setEditingElementId,
  setShowStylePanel,
  setIsProcessing,
  setError,
  lockedElements,
  styleTemplate,
  setStyleTemplate,
  pendingUpdatesRef,
  contentUpdateTimeoutsRef,
  undoRedo,
  copyPaste,
  templateManager,
  refreshElements,
  getElementById,
}: UseWasmBuilderActionsProps) => {
  // Element creation
  const createElement = useCallback(
    (type: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const element = wasmEngine.createElement(type, centerX, centerY);
        if (element) {
          // Apply style template if available
          if (styleTemplate) {
            element.style = { ...element.style, ...styleTemplate };

            const success = wasmEngine.updateElementStyle(
              element.id,
              styleTemplate
            );
            if (success) {
              // Style template applied successfully
            } else {
              console.warn(
                'Failed to apply style template to WASM for element:',
                element.id
              );
            }
          }

          setElements(prevElements => {
            const newElements = [...prevElements, element];
            setTimeout(() => {
              undoRedo.saveState(
                newElements,
                'create_element',
                `Created ${type}`
              );
            }, 100);
            return newElements;
          });

          setSelectedElementId(element.id);
          setEditingElementId(null);

          if (!styleTemplate) {
            setTimeout(() => {
              refreshElements();
            }, 150);
          }
        } else {
          setError('Failed to create element');
        }
      } catch (error) {
        console.error('Error creating element:', error);
        setError('Error creating element');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      wasmEngine,
      styleTemplate,
      setElements,
      setSelectedElementId,
      setEditingElementId,
      setIsProcessing,
      setError,
      undoRedo,
      refreshElements,
    ]
  );

  // Element deletion
  const deleteElement = useCallback(
    (elementId: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        const success = wasmEngine.deleteElement(elementId);
        if (success) {
          setElements(prevElements => {
            const newElements = prevElements.filter(el => el.id !== elementId);
            setTimeout(() => {
              undoRedo.saveState(
                newElements,
                'delete_element',
                `Deleted element`
              );
            }, 100);
            return newElements;
          });

          if (selectedElementId === elementId) {
            setSelectedElementId(null);
            setShowStylePanel(false);
          }
          // Clear editing state if this element was being edited
          setEditingElementId(null);

          pendingUpdatesRef.current.delete(elementId);

          setTimeout(() => {
            refreshElements();
          }, 100);
        } else {
          setError('Failed to delete element');
        }
      } catch (error) {
        console.error('Error deleting element:', error);
        setError('Error deleting element');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      wasmEngine,
      elements,
      selectedElementId,
      setElements,
      setSelectedElementId,
      setEditingElementId,
      setShowStylePanel,
      setIsProcessing,
      setError,
      pendingUpdatesRef,
      undoRedo,
      refreshElements,
    ]
  );

  // Content change handler
  const handleContentChange = useCallback(
    (elementId: string, content: string) => {
      try {
        setError(null);

        const existingTimeout = contentUpdateTimeoutsRef.current.get(elementId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        setElements(prevElements =>
          prevElements.map(el =>
            el.id === elementId ? { ...el, content } : el
          )
        );

        const timeout = setTimeout(() => {
          try {
            const success = wasmEngine.updateElementContent(elementId, content);
            if (!success) {
              setElements(prevElements =>
                prevElements.map(el =>
                  el.id === elementId ? { ...el, content: el.content } : el
                )
              );
              setError('Failed to update element content');
              console.error(
                'WASM content update failed for element:',
                elementId
              );
            }
          } catch (error) {
            console.error('Error updating content:', error);
            setError('Error updating element content');

            const originalElement = getElementById(elementId);
            if (originalElement) {
              setElements(prevElements =>
                prevElements.map(el =>
                  el.id === elementId
                    ? { ...el, content: originalElement.content }
                    : el
                )
              );
            }
          } finally {
            contentUpdateTimeoutsRef.current.delete(elementId);
          }
        }, 300);

        contentUpdateTimeoutsRef.current.set(elementId, timeout);
      } catch (error) {
        console.error('Error in handleContentChange:', error);
        setError('Error handling content change');
      }
    },
    [wasmEngine, getElementById, setElements, setError, contentUpdateTimeoutsRef]
  );

  // Style change handler
  const handleStyleChange = useCallback(
    (elementId: string, style: Partial<ElementStyle>) => {
      try {
        setError(null);

        // Check if this is a table data refresh request
        const isTableRefresh = (style as any)?.__forceTableRefresh;

        if (isTableRefresh) {
          // For table refresh, get the complete updated element from WASM
          console.log('Forcing table data refresh for element:', elementId);
          try {
            const updatedElement = wasmEngine.getElement(elementId);
            if (updatedElement) {
              console.log('Got updated element from WASM:', updatedElement);
              setElements(prevElements =>
                prevElements.map(el => {
                  if (el.id === elementId) {
                    console.log('Replacing element with updated data:', el.id);
                    // Replace the entire element with updated data from WASM
                    return updatedElement;
                  }
                  return el;
                })
              );
              console.log('Table refresh completed successfully');
              return; // Early return for table refresh
            } else {
              console.warn('Updated element is null from WASM');
            }
          } catch (refreshError) {
            console.error('Failed to get updated element from WASM:', refreshError);
          }
        }

        // Normal style update logic
        setStyleTemplate(prevTemplate => ({
          ...prevTemplate,
          ...style,
        }));

        setElements(prevElements =>
          prevElements.map(el => {
            if (el.id === elementId) {
              const newStyle = { ...el.style };
              
              // Handle nested updates for fill and stroke
              if (style.fill) {
                newStyle.fill = { ...newStyle.fill, ...style.fill };
              }
              if (style.stroke) {
                newStyle.stroke = { ...newStyle.stroke, ...style.stroke };
              }
              
              // Handle other style properties
              Object.keys(style).forEach(key => {
                if (key !== 'fill' && key !== 'stroke' && key !== '__forceTableRefresh') {
                  (newStyle as any)[key] = (style as any)[key];
                }
              });
              
              return { ...el, style: newStyle };
            }
            return el;
          })
        );

        // Only call WASM update for normal style changes, not for table refresh
        if (!isTableRefresh) {
          const success = wasmEngine.updateElementStyle(elementId, style);
          if (!success) {
            // Revert the style change if WASM update failed
            setElements(prevElements =>
              prevElements.map(el => {
                if (el.id === elementId) {
                  // Find the original element to revert to
                  const originalElement = getElementById(elementId);
                  return originalElement ? { ...el, style: originalElement.style } : el;
                }
                return el;
              })
            );
            setError('Failed to update element style');
            console.error('WASM style update failed for element:', elementId);
          }
        }
      } catch (error) {
        console.error('Error updating style:', error);
        setError('Error updating element style');

        const originalElement = getElementById(elementId);
        if (originalElement) {
          setElements(prevElements =>
            prevElements.map(el =>
              el.id === elementId ? { ...el, style: originalElement.style } : el
            )
          );
        }
      }
    },
    [wasmEngine, getElementById, setElements, setStyleTemplate, setError]
  );

  // Size change handler
  const handleSizeChange = useCallback(
    (elementId: string, width: number, height: number) => {
      if (lockedElements.has(elementId)) {
        setError('Element is locked and cannot be resized');
        return;
      }

      try {
        const currentPending = pendingUpdatesRef.current.get(elementId) || {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };
        pendingUpdatesRef.current.set(elementId, {
          ...currentPending,
          width,
          height,
        });

        setElements(prevElements =>
          prevElements.map(el =>
            el.id === elementId ? { ...el, width, height } : el
          )
        );

        requestAnimationFrame(() => {
          try {
            wasmEngine.updateElementSize(elementId, width, height);
            const pending = pendingUpdatesRef.current.get(elementId);
            if (pending) {
              pendingUpdatesRef.current.delete(elementId);
            }
          } catch (error) {
            console.error('Error updating element size:', error);
            setError('Error updating element size');
          }
        });
      } catch (error) {
        console.error('Error in handleSizeChange:', error);
        setError('Error handling size change');
      }
    },
    [wasmEngine, lockedElements, setElements, setError, pendingUpdatesRef]
  );

  // Position change handler
  const handlePositionChange = useCallback(
    (elementId: string, x: number, y: number) => {
      if (lockedElements.has(elementId)) {
        setError('Element is locked and cannot be moved');
        return;
      }

      try {
        const currentPending = pendingUpdatesRef.current.get(elementId) || {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };
        pendingUpdatesRef.current.set(elementId, {
          ...currentPending,
          x,
          y,
        });

        setElements(prevElements =>
          prevElements.map(el => (el.id === elementId ? { ...el, x, y } : el))
        );

        requestAnimationFrame(() => {
          try {
            wasmEngine.updateElementPosition(elementId, x, y);
            const pending = pendingUpdatesRef.current.get(elementId);
            if (pending) {
              pendingUpdatesRef.current.delete(elementId);
            }
          } catch (error) {
            console.error('Error updating element position:', error);
            setError('Error updating element position');
          }
        });
      } catch (error) {
        console.error('Error in handlePositionChange:', error);
        setError('Error handling position change');
      }
    },
    [wasmEngine, lockedElements, setElements, setError, pendingUpdatesRef]
  );

  // Export HTML
  const exportHtml = useCallback(() => {
    try {
      console.log('Starting HTML export...');
      
      const exportResult = wasmEngine.exportHtml({
        include_responsive: true,
        minify_css: false,
        css_framework: 'None',
        export_format: 'Html',
      });

      console.log('Export result:', exportResult);

      if (exportResult) {
        // สร้างชื่อไฟล์ด้วย timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:]/g, '-');
        const filename = `html-builder-export-${timestamp}.html`;
        
        const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Builder Export - ${now.toLocaleDateString('th-TH')}</title>
    <style>
        /* Reset และ Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        /* Export Styles */
${exportResult.css}
        
        /* Print Styles */
        @media print {
            body { 
                margin: 0; 
                background: white; 
            }
            .paper-container { 
                padding: 0; 
                background: white; 
            }
            .a4-paper { 
                width: 100% !important; 
                min-height: 100vh !important; 
                margin: 0 !important; 
                box-shadow: none !important; 
                page-break-after: always;
            }
            .a4-paper:last-child {
                page-break-after: avoid;
            }
        }
        
        /* Export Info Header */
        .export-info {
            background: #fff;
            border-bottom: 1px solid #ddd;
            padding: 10px 20px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        
        @media print {
            .export-info { display: none; }
        }
    </style>
</head>
<body>
    <!-- Export Information (hidden when printing) -->
    <div class="export-info">
        <strong>HTML Builder Export</strong> | 
        สร้างเมื่อ: ${now.toLocaleString('th-TH')} | 
        จำนวนหน้า: ${exportResult.metadata.total_pages} | 
        จำนวน Elements: ${exportResult.metadata.total_elements}
    </div>
    
    <!-- Main Content -->
${exportResult.html}

    <script>
        // Optional: Add some interactivity for buttons
        document.addEventListener('DOMContentLoaded', function() {
            const buttons = document.querySelectorAll('.element-button');
            buttons.forEach(function(button) {
                button.addEventListener('click', function() {
                    alert('ปุ่ม "' + this.textContent + '" ถูกคลิก!');
                });
            });
            
            console.log('HTML Builder Export โหลดเสร็จแล้ว');
            console.log('จำนวนหน้า:', ${exportResult.metadata.total_pages});
            console.log('จำนวน Elements:', ${exportResult.metadata.total_elements});
        });
    </script>
</body>
</html>`;

        // สร้างและดาวน์โหลดไฟล์
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`HTML exported successfully as ${filename}`);
        
        // Show success notification (if available)
        if (typeof window !== 'undefined' && 'alert' in window) {
          alert(`✅ Export สำเร็จ!\n\nไฟล์: ${filename}\nจำนวนหน้า: ${exportResult.metadata.total_pages}\nจำนวน Elements: ${exportResult.metadata.total_elements}`);
        }
      } else {
        console.error('Export result is empty');
        if (typeof window !== 'undefined' && 'alert' in window) {
          alert('❌ เกิดข้อผิดพลาดในการ Export HTML');
        }
      }
    } catch (error) {
      console.error('Error during HTML export:', error);
      if (typeof window !== 'undefined' && 'alert' in window) {
        alert('❌ เกิดข้อผิดพลาดในการ Export HTML: ' + (error as Error).message);
      }
    }
  }, [wasmEngine]);

  // Cell style handlers
  const handleUpdateTableCellStyle = useCallback(
    (elementId: string, row: number, col: number, style: any) => {
      try {
        const success = wasmEngine.updateTableCellStyle(elementId, row, col, style);
        if (success) {
          refreshElements();
        }
        return success;
      } catch (error) {
        console.error('Error updating table cell style:', error);
        setError('Failed to update cell style');
        return false;
      }
    },
    [wasmEngine, refreshElements, setError]
  );

  const handleGetTableCellStyle = useCallback(
    (elementId: string, row: number, col: number) => {
      try {
        return wasmEngine.getTableCellStyle(elementId, row, col);
      } catch (error) {
        console.error('Error getting table cell style:', error);
        return null;
      }
    },
    [wasmEngine]
  );

  const handleGetTableDimensions = useCallback(
    (elementId: string) => {
      try {
        return wasmEngine.getTableDimensions(elementId);
      } catch (error) {
        console.error('Error getting table dimensions:', error);
        return null;
      }
    },
    [wasmEngine]
  );

  return {
    createElement,
    deleteElement,
    handleContentChange,
    handleStyleChange,
    handleSizeChange,
    handlePositionChange,
    exportHtml,
    handleUpdateTableCellStyle,
    handleGetTableCellStyle,
    handleGetTableDimensions,
  };
};
