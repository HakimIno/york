import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Element, A4Paper } from '../module/wasm-interface';
import { PaperConfig } from '../types/paper';
import { useViewportCulling } from '../hooks/useViewportCulling';
import { useElementVirtualScrolling } from '../hooks/useVirtualScrolling';
import { useConditionalOptimization } from '../hooks/useLightweightOptimization';
import { useThrottledGridLines } from '../hooks/useThrottledGridLines';
import ResizableElement from './element';
import Paper from './Paper';
import Ruler from './Ruler';
import Guidelines from './Guidelines';
import SpacingGuides from './SpacingGuides';
import { useGuidelines } from '../hooks/useGuidelines';

interface CanvasProps {
  papers: A4Paper[];
  paperConfigs?: PaperConfig[];
  selectedPaperId?: string | null;
  elements: Element[];
  selectedElementId: string | null;
  editingElementId: string | null;
  isDragging: boolean;
  dragElementId: string | null;
  lockedElements: Set<string>;
  showElementBorders: boolean;
  spatialStats?: any;
  showRuler?: boolean;
  rulerUnit?: 'px' | 'mm' | 'cm' | 'in';
  showGrid?: boolean;
  snapToGrid?: boolean;
  showSpacingGuides?: boolean;
  gridSize?: number;
  onMouseUp: () => void;
  onCanvasClick: (e: React.MouseEvent) => void;
  onPositionChange: (elementId: string, x: number, y: number) => void;
  onSizeChange: (elementId: string, width: number, height: number) => void;
  onContentChange: (elementId: string, content: string) => void;
  onStyleChange: (elementId: string, style: any) => void;
  onElementSelect: (elementId: string) => void;
  onStartEdit: (elementId: string) => void;
  onEndEdit: () => void;
  onDeleteElement: (elementId: string) => void;
  onStartDrag: (e: React.MouseEvent, elementId: string) => void;
  onToggleLock: (elementId: string) => void;
  onCopyElement: (elementId: string) => void;
  onPaperSelect?: (paperId: string) => void;
  // Zoom handlers
  onZoom?: (zoom: number) => void;
  onZoomToPoint?: (screenX: number, screenY: number, zoomDelta: number) => void;
  currentZoom?: number;
  // Table-specific handlers
  onTableCellChange?: (elementId: string, row: number, col: number, content: string) => void;
  onAddRow?: (elementId: string, atIndex?: number) => void;
  onRemoveRow?: (elementId: string, index: number) => void;
  onAddColumn?: (elementId: string, atIndex?: number) => void;
  onRemoveColumn?: (elementId: string, index: number) => void;
  onMergeCells?: (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => void;
  onUpdateColumnWidth?: (elementId: string, columnIndex: number, width: number) => void;
  onUpdateRowHeight?: (elementId: string, rowIndex: number, height: number) => void;
  // Cell selection handlers moved to Zustand store
  // Spatial indexing methods
  onSpatialQuery?: (x: number, y: number, width: number, height: number) => Element[];
  onSpatialFindAtPoint?: (x: number, y: number) => Element[];
  onSpatialFindNearest?: (x: number, y: number, maxDistance?: number) => Element | null;
  onSpatialDetectCollisions?: (elementId: string) => Element[];
}

const Canvas: React.FC<CanvasProps> = React.memo(({
  papers,
  paperConfigs = [],
  selectedPaperId,
  elements,
  selectedElementId,
  editingElementId,
  isDragging,
  dragElementId,
  lockedElements,
  showElementBorders,
  spatialStats,
  showRuler = true,
  rulerUnit = 'px',
  showGrid = false,
  snapToGrid = false,
  gridSize = 20,
  showSpacingGuides = true,
  onMouseUp,
  onCanvasClick,
  onPositionChange,
  onSizeChange,
  onContentChange,
  onStyleChange,
  onElementSelect,
  onStartEdit,
  onEndEdit,
  onDeleteElement,
  onStartDrag,
  onToggleLock,
  onCopyElement,
  onPaperSelect,
  onZoom,
  onZoomToPoint,
  currentZoom = 1.0,
  onTableCellChange,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onMergeCells,
  onUpdateColumnWidth,
  onUpdateRowHeight,
  onSpatialQuery,
}) => {
  // Guidelines system
  const { guidelines, addGuideline, removeGuideline, config: guidelineConfig } = useGuidelines({
    showGuidelines: true,
    snapToGuidelines: true,
    guidelineColor: '#007AFF',
  });

  // Viewport culling for performance optimization
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const {
    visibleElements,
    metrics: viewportMetrics,
    recalculateViewport
  } = useViewportCulling(elements, {
    containerRef: canvasContainerRef as React.RefObject<HTMLElement>,
    zoom: currentZoom,
    margin: 200, // Pre-render elements 200px outside viewport
    minVisibilityPercentage: 0,
    enableMetrics: false,
    debounceMs: 16, // ~60fps
  });

  // Smart optimization based on dataset size
  const { optimizationConfig } = useConditionalOptimization(elements, {
    viewportCullingThreshold: 500,
    virtualScrollingThreshold: 10000,
    spatialIndexingThreshold: 1000
  });

  // Only use virtual scrolling when really needed
  const { visibleElements: virtualElements } = useElementVirtualScrolling(
    optimizationConfig.virtualScrolling ? elements : [],
    {
      containerRef: canvasContainerRef as React.RefObject<HTMLElement>,
      cellSize: 100,
      overscan: 2,
      debounceMs: 16
    }
  );

  // Use appropriate optimization based on dataset size
  const optimizedElements = optimizationConfig.virtualScrolling ? virtualElements : visibleElements;

  // Spatial indexing using WASM (stats passed from parent)

  // Track ruler drag state
  const [rulerDragState, setRulerDragState] = useState<{
    isDragging: boolean;
    position: number | null;
    orientation: 'horizontal' | 'vertical' | null;
  }>({
    isDragging: false,
    position: null,
    orientation: null,
  });

  // Handle guideline creation from ruler
  const handleGuidelineCreate = useCallback((position: number, orientation: 'horizontal' | 'vertical') => {
    addGuideline(position, orientation);
    setRulerDragState({
      isDragging: false,
      position: null,
      orientation: null,
    });
  }, [addGuideline]);

  // Handle ruler drag state changes
  const handleRulerDragStateChange = useCallback((isDragging: boolean, position: number | null, orientation: 'horizontal' | 'vertical') => {
    setRulerDragState({
      isDragging,
      position,
      orientation,
    });
  }, []);

  // Canvas state
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scrollSize, setScrollSize] = useState({ width: 0, height: 0 }); // Track full scrollable size
  const [localRulerUnit, setLocalRulerUnit] = useState<'px' | 'mm' | 'cm' | 'in'>(rulerUnit); // Local unit state

  // Sync local unit with prop if it changes
  useEffect(() => {
    setLocalRulerUnit(rulerUnit);
  }, [rulerUnit]);

  const theme = 'dark';
  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom delta based on wheel direction
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;

      // Call zoom handler if provided
      if (onZoomToPoint) {
        onZoomToPoint(mouseX, mouseY, zoomDelta);
      }
    }
  };

  // Update canvas size and scroll position
  useEffect(() => {
    const updateCanvasInfo = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
        setScrollSize({
          width: canvasContainerRef.current.scrollWidth,
          height: canvasContainerRef.current.scrollHeight
        });
        setScrollPosition({
          left: canvasContainerRef.current.scrollLeft,
          top: canvasContainerRef.current.scrollTop
        });
      }
    };

    updateCanvasInfo();

    const handleScroll = () => {
      if (canvasContainerRef.current) {
        setScrollPosition({
          left: canvasContainerRef.current.scrollLeft,
          top: canvasContainerRef.current.scrollTop
        });
      }
    };

    const handleResize = () => updateCanvasInfo();

    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);

      const resizeObserver = new ResizeObserver(updateCanvasInfo);
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
        resizeObserver.disconnect();
      };
    }
  }, [elements, paperConfigs]); // Re-run when content changes to update scrollSize

  // Recalculate viewport when zoom changes
  useEffect(() => {
    recalculateViewport();
  }, [currentZoom, recalculateViewport]);

  // Update spatial index bounds when canvas size changes (using WASM)
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      // Update WASM spatial index bounds
      const timeoutId = setTimeout(() => {
        if (onSpatialQuery) {
          // Trigger WASM spatial index update through parent component
          // Spatial index bounds updated silently
        }
      }, 100); // Debounce the update

      return () => clearTimeout(timeoutId);
    }
  }, [canvasSize.width, canvasSize.height, onSpatialQuery]);

  // Spatial index stats are now passed from parent component

  // Convert pixels to current unit for grid
  const convertToUnit = useMemo(() => {
    const dpi = 96;
    const mmPerInch = 25.4;
    const cmPerInch = 2.54;

    switch (localRulerUnit) {
      case 'mm':
        return (px: number) => (px / dpi) * mmPerInch;
      case 'cm':
        return (px: number) => (px / dpi) * cmPerInch;
      case 'in':
        return (px: number) => px / dpi;
      case 'px':
      default:
        return (px: number) => px;
    }
  }, [localRulerUnit]);

  // Convert unit to pixels for grid
  const convertFromUnit = useMemo(() => {
    const dpi = 96;
    const mmPerInch = 25.4;
    const cmPerInch = 2.54;

    switch (localRulerUnit) {
      case 'mm':
        return (value: number) => (value / mmPerInch) * dpi;
      case 'cm':
        return (value: number) => (value / cmPerInch) * dpi;
      case 'in':
        return (value: number) => value * dpi;
      case 'px':
      default:
        return (value: number) => value;
    }
  }, [localRulerUnit]);

  // OPTIMIZED: Throttled grid line generation (prevents recalculation on every scroll/resize)
  const gridLines = useThrottledGridLines({
    showGrid,
    gridSize,
    canvasSize,
    scrollPosition,
    convertFromUnit,
    throttleMs: 100, // 100ms throttle for smooth performance
  });



  // Memoize expensive computations with viewport culling
  // OPTIMIZED: Only recalculate when paperConfigs or optimizedElements change
  const elementsByPaper = useMemo(() => {
    if (paperConfigs.length === 0) return {};

    const result: Record<string, Element[]> = {};

    // Use optimized elements (virtual scrolling for large datasets, viewport culling for smaller ones)
    const elementsToProcess = optimizedElements.length > 0 ? optimizedElements : elements;

    paperConfigs.forEach(paperConfig => {
      result[paperConfig.id] = elementsToProcess.filter(element => {
        // More flexible containment check - element should at least partially overlap with paper
        // Account for paper header height (32px)
        const paperContentY = paperConfig.y + 32;
        const paperContentHeight = paperConfig.height - 32;

        // Check if element overlaps with paper bounds (not strict containment)
        const elementRight = element.x + element.width;
        const elementBottom = element.y + element.height;
        const paperRight = paperConfig.x + paperConfig.width;
        const paperBottom = paperContentY + paperContentHeight;

        return (
          element.x < paperRight &&
          elementRight > paperConfig.x &&
          element.y < paperBottom &&
          elementBottom > paperContentY
        );
      });
    });

    return result;
  }, [paperConfigs, optimizedElements, elements]);

  // OPTIMIZED: Only recalculate when paperConfigs or optimizedElements change
  const orphanedElements = useMemo(() => {
    if (paperConfigs.length === 0) return [];

    // Use optimized elements for better performance
    const elementsToProcess = optimizedElements.length > 0 ? optimizedElements : elements;

    return elementsToProcess.filter(element => {
      return !paperConfigs.some(paperConfig => {
        const paperContentY = paperConfig.y + 32;
        const paperContentHeight = paperConfig.height - 32;
        const elementRight = element.x + element.width;
        const elementBottom = element.y + element.height;
        const paperRight = paperConfig.x + paperConfig.width;
        const paperBottom = paperContentY + paperContentHeight;

        return (
          element.x < paperRight &&
          elementRight > paperConfig.x &&
          element.y < paperBottom &&
          elementBottom > paperContentY
        );
      });
    });
  }, [paperConfigs, optimizedElements, elements]);

  // OPTIMIZED: Only recalculate when optimizedElements change
  const uniqueElements = useMemo(() => {
    // Use optimized elements for better performance
    const elementsToProcess = optimizedElements.length > 0 ? optimizedElements : elements;

    return elementsToProcess.filter((element, index, arr) => {
      // Filter out duplicate IDs, keep only the first occurrence
      const firstIndex = arr.findIndex(el => el.id === element.id);
      if (firstIndex !== index) {
        console.warn(
          `Duplicate element ID found: ${element.id}, removing duplicate`
        );
        return false;
      }
      return true;
    });
  }, [optimizedElements, elements]);

  // Handle unit change
  const handleUnitChange = useCallback(() => {
    setLocalRulerUnit(prev => {
      const units: ('px' | 'mm' | 'cm' | 'in')[] = ['px', 'mm', 'cm', 'in'];
      const currentIndex = units.indexOf(prev);
      const nextIndex = (currentIndex + 1) % units.length;
      return units[nextIndex];
    });
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Rulers */}
      {showRuler && (
        <>
          {/* Ruler Corner */}
          <div
            className="ruler-corner cursor-pointer hover:bg-white/10 transition-colors"
            onClick={handleUnitChange}
            title={`Current unit: ${localRulerUnit}. Click to change.`}
          />

          {/* Horizontal Ruler */}
          <div className="relative h-5 ml-5">
            <Ruler
              width={canvasSize.width}
              height={20}
              scrollLeft={scrollPosition.left}
              scrollTop={0}
              zoom={1}
              unit={localRulerUnit}
              showRuler={showRuler}
              orientation="horizontal"
              className="absolute top-0 left-0"
              onGuidelineCreate={handleGuidelineCreate}
              onDragStateChange={handleRulerDragStateChange}
            />
          </div>

          {/* Vertical Ruler */}
          <div className="absolute top-5 left-0 w-5 h-full z-10">
            <Ruler
              width={20}
              height={canvasSize.height}
              scrollLeft={0}
              scrollTop={scrollPosition.top}
              zoom={1}
              unit={localRulerUnit}
              showRuler={showRuler}
              orientation="vertical"
              className="absolute top-0 left-0"
              onGuidelineCreate={handleGuidelineCreate}
              onDragStateChange={handleRulerDragStateChange}
            />
          </div>
        </>
      )}
      {/* Grid Overlay - Positioned within canvas container */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none z-50">
          <svg className="w-full h-full">
            {/* Horizontal grid lines */}
            {gridLines.horizontal.map((y, index) => (
              <line
                key={`h-${index}`}
                x1="0"
                y1={y}
                x2="100%"
                y2={y}
                className="grid-line"
                stroke={theme !== 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                strokeWidth="1"
              />
            ))}
            {/* Vertical grid lines */}
            {gridLines.vertical.map((x, index) => (
              <line
                key={`v-${index}`}
                x1={x}
                y1="0"
                x2={x}
                y2="100%"
                className="grid-line"
                stroke={theme !== 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                strokeWidth="1"
              />
            ))}
          </svg>
        </div>
      )}
      {/* Canvas Container */}
      <div
        ref={canvasContainerRef}
        className={`relative w-full ${showRuler ? 'h-[calc(100%-1.25rem)]' : 'h-full'} bg-muted/20 overflow-auto canvas-container scrollbar-hide ${showRuler ? 'canvas-with-ruler' : ''}`}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onCanvasClick}
        onWheel={handleWheel}
      >
        {/* Guidelines */}
        <Guidelines
          guidelines={guidelines}
          canvasWidth={Math.max(canvasSize.width, scrollSize.width)}
          canvasHeight={Math.max(canvasSize.height, scrollSize.height)}
          scrollLeft={scrollPosition.left}
          scrollTop={scrollPosition.top}
          showGuidelines={guidelineConfig.showGuidelines}
          onGuidelineClick={(guideline) => console.log('Guideline clicked:', guideline)}
          onGuidelineDoubleClick={(guideline) => removeGuideline(guideline.id)}
          isDragging={rulerDragState.isDragging}
          dragPosition={rulerDragState.position}
          dragOrientation={rulerDragState.orientation || undefined}
        />

        {/* Smart Spacing Guides - Auto-measure distances between elements */}
        <SpacingGuides
          elements={elements}
          selectedElementId={selectedElementId}
          showSpacingGuides={showSpacingGuides}
          zoom={currentZoom}
          scrollPosition={scrollPosition}
        />

        {/* Papers */}
        {paperConfigs.length > 0 ? (
          // Use new Paper components with enhanced functionality
          paperConfigs.map((paperConfig) => {
            const paperElements = elementsByPaper[paperConfig.id] || [];

            return (
              <div
                key={paperConfig.id}
                style={{
                  transform: `scale(${currentZoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <Paper
                  paper={paperConfig}
                  isSelected={selectedPaperId === paperConfig.id}
                  onSelect={() => onPaperSelect?.(paperConfig.id)}
                >
                  {/* Render elements within this paper */}
                  {paperElements.map((element) => {
                    const relativeElement = {
                      ...element,
                      x: element.x - paperConfig.x,
                      y: element.y - paperConfig.y - 32, // Account for paper header height
                    };

                    return (
                      <ResizableElement
                        key={element.id}
                        element={relativeElement}
                        isSelected={selectedElementId === element.id}
                        isEditing={editingElementId === element.id}
                        isDragging={isDragging && dragElementId === element.id}
                        isLocked={lockedElements.has(element.id)}
                        showBorders={showElementBorders}
                        onPositionChange={(elementId, newX, newY) => {
                          // Convert relative coordinates back to global coordinates
                          // Allow elements to move freely without constraints
                          onPositionChange(elementId, newX + paperConfig.x, newY + paperConfig.y + 32);
                        }}
                        onSizeChange={onSizeChange}
                        onContentChange={onContentChange}
                        onStyleChange={onStyleChange}
                        onSelect={onElementSelect}
                        onStartEdit={onStartEdit}
                        onEndEdit={onEndEdit}
                        onDelete={onDeleteElement}
                        onStartDrag={onStartDrag}
                        onToggleLock={onToggleLock}
                        onCopy={onCopyElement}
                        // Table-specific handlers
                        onTableCellChange={onTableCellChange}
                        onAddRow={onAddRow}
                        onRemoveRow={onRemoveRow}
                        onAddColumn={onAddColumn}
                        onRemoveColumn={onRemoveColumn}
                        onMergeCells={onMergeCells}
                        onUpdateColumnWidth={onUpdateColumnWidth}
                        onUpdateRowHeight={onUpdateRowHeight}
                      // Cell selection props moved to Zustand store
                      />
                    );
                  })}
                </Paper>
              </div>
            );
          })
        ) : papers.length > 0 && (
          papers.map((paper, index) => (
            <div
              key={paper.id}
              style={{
                transform: `scale(${currentZoom})`,
                transformOrigin: 'top left',
              }}
            >
              <div
                className="absolute bg-white shadow-lg border border-gray-200"
                style={{
                  left: paper.x,
                  top: paper.y,
                  width: paper.width,
                  height: paper.height,
                }}
              >
                <div className="absolute top-2 left-2 text-xs text-gray-400">
                  A4 Paper {index + 1}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Elements that don't belong to any paper (orphaned elements) */}
        {paperConfigs.length > 0 && orphanedElements.map((element) => (
          <div
            key={element.id}
            style={{
              transform: `scale(${currentZoom})`,
              transformOrigin: 'top left',
            }}
          >
            <ResizableElement
              element={element}
              isSelected={selectedElementId === element.id}
              isEditing={editingElementId === element.id}
              isDragging={isDragging && dragElementId === element.id}
              isLocked={lockedElements.has(element.id)}
              showBorders={showElementBorders}
              onPositionChange={onPositionChange}
              onSizeChange={onSizeChange}
              onContentChange={onContentChange}
              onStyleChange={onStyleChange}
              onSelect={onElementSelect}
              onStartEdit={onStartEdit}
              onEndEdit={onEndEdit}
              onDelete={onDeleteElement}
              onStartDrag={onStartDrag}
              onToggleLock={onToggleLock}
              onCopy={onCopyElement}
              // Table-specific handlers
              onTableCellChange={onTableCellChange}
              onAddRow={onAddRow}
              onRemoveRow={onRemoveRow}
              onAddColumn={onAddColumn}
              onRemoveColumn={onRemoveColumn}
              onMergeCells={onMergeCells}
              onUpdateColumnWidth={onUpdateColumnWidth}
              onUpdateRowHeight={onUpdateRowHeight}
            // Cell selection props moved to Zustand store
            />
          </div>
        ))}

        {/* Legacy Elements (only shown when using legacy papers) */}
        {paperConfigs.length === 0 && uniqueElements.map(element => (
          <div
            key={element.id}
            style={{
              transform: `scale(${currentZoom})`,
              transformOrigin: 'top left',
            }}
          >
            <ResizableElement
              element={element}
              isSelected={selectedElementId === element.id}
              isEditing={editingElementId === element.id}
              isDragging={isDragging && dragElementId === element.id}
              isLocked={lockedElements.has(element.id)}
              showBorders={showElementBorders}
              onPositionChange={onPositionChange}
              onSizeChange={onSizeChange}
              onContentChange={onContentChange}
              onStyleChange={onStyleChange}
              onSelect={onElementSelect}
              onStartEdit={onStartEdit}
              onEndEdit={onEndEdit}
              onDelete={onDeleteElement}
              onStartDrag={onStartDrag}
              onToggleLock={onToggleLock}
              onCopy={onCopyElement}
              // Table-specific handlers
              onTableCellChange={onTableCellChange}
              onAddRow={onAddRow}
              onRemoveRow={onRemoveRow}
              onAddColumn={onAddColumn}
              onRemoveColumn={onRemoveColumn}
              onMergeCells={onMergeCells}
              onUpdateColumnWidth={onUpdateColumnWidth}
              onUpdateRowHeight={onUpdateRowHeight}
            />
          </div>
        ))}


      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
