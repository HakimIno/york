'use client';

import React, {
    useState,
    useRef,
    useCallback,
    useMemo,
    useEffect,
} from 'react';
import ReactDOM from 'react-dom';
import { Element } from '../../module/wasm-interface';
import { useResizable } from '../../hooks/resizable';
import { Icon } from '@iconify/react';
import { TableElement } from './table';
import FormFieldElement from './FormFieldElement';
import CheckboxElement from './CheckboxElement';
import LineElement from './LineElement';

interface ResizableElementProps {
    element: Element;
    isSelected: boolean;
    isEditing: boolean;
    isDragging?: boolean;
    isLocked?: boolean;
    showBorders?: boolean;
    onPositionChange: (elementId: string, x: number, y: number) => void;
    onSizeChange: (elementId: string, width: number, height: number) => void;
    onContentChange: (elementId: string, content: string) => void;
    onStyleChange: (elementId: string, style: any) => void;
    onSelect: (elementId: string) => void;
    onStartEdit: (elementId: string) => void;
    onEndEdit: () => void;
    onDelete: (elementId: string) => void;
    onStartDrag: (e: React.MouseEvent, elementId: string) => void;
    onToggleLock: (elementId: string) => void;
    onCopy?: (elementId: string) => void;
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
}

const ResizableElement: React.FC<ResizableElementProps> = ({
    element,
    isSelected,
    isEditing,
    isDragging = false,
    isLocked = false,
    showBorders = true,
    onPositionChange,
    onSizeChange,
    onContentChange,
    onStyleChange,
    onSelect,
    onStartEdit,
    onEndEdit,
    onDelete,
    onStartDrag,
    onToggleLock,
    onCopy,
    onTableCellChange,
    onAddRow,
    onRemoveRow,
    onAddColumn,
    onRemoveColumn,
    onMergeCells,
    onUpdateColumnWidth,
    onUpdateRowHeight,
    // Cell selection props moved to Zustand store
}) => {
    const [editContent, setEditContent] = useState(element.content);
    const [isHovered, setIsHovered] = useState(false);
    const [isContentDirty, setIsContentDirty] = useState(false);
    const [showTextToolbar, setShowTextToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [showBgColorPicker, setShowBgColorPicker] = useState(false);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const elementRef = useRef<HTMLDivElement>(null);
    const editableRef = useRef<HTMLDivElement>(null);
    const originalContentRef = useRef<string>(element.content);

    // Use the resizable hook
    const {
        isResizing,
        resizeDirection,
        handleResizeStart,
        RESIZE_HANDLES,
        HANDLE_SIZE,
    } = useResizable({
        elementId: element.id,
        elementWidth: element.width,
        elementHeight: element.height,
        elementX: element.x,
        elementY: element.y,
        onSizeChange,
        onPositionChange,
    });

    // Optimized event handlers
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    // Update edit content when element content changes
    useEffect(() => {
        if (!isEditing) {
            setEditContent(element.content);
            originalContentRef.current = element.content;
            setIsContentDirty(false);
        }
    }, [element.content, isEditing]);

    // Sync edit content with editable div when entering edit mode
    useEffect(() => {
        if (isEditing && editableRef.current) {
            // Set innerHTML and place cursor at the end
            if (editableRef.current.innerHTML !== editContent) {
                editableRef.current.innerHTML = editContent;
            }
            // Focus and place cursor at the end
            editableRef.current.focus();
            
            // Place cursor at end of content
            const range = document.createRange();
            const sel = window.getSelection();
            if (editableRef.current.childNodes.length > 0) {
                range.selectNodeContents(editableRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
    }, [isEditing, editContent]);

    // Check active formats
    const checkActiveFormats = useCallback(() => {
        const formats = new Set<string>();
        
        if (document.queryCommandState('bold')) formats.add('bold');
        if (document.queryCommandState('italic')) formats.add('italic');
        if (document.queryCommandState('underline')) formats.add('underline');
        
        setActiveFormats(formats);
    }, []);

    // Detect text selection and show toolbar (optimized with debounce)
    useEffect(() => {
        if (!isEditing) return;

        let timeoutId: NodeJS.Timeout;

        const handleSelectionChange = () => {
            // Debounce for better performance
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.isCollapsed || !editableRef.current) {
                    setShowTextToolbar(false);
                    setShowTextColorPicker(false);
                    setShowBgColorPicker(false);
                    return;
                }

                // Check if selection is within our editable element
                try {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const isInside = editableRef.current.contains(
                        container.nodeType === Node.TEXT_NODE ? container.parentNode : container
                    );

                    if (!isInside) {
                        setShowTextToolbar(false);
                        setShowTextColorPicker(false);
                        setShowBgColorPicker(false);
                        return;
                    }

                    // Calculate toolbar position relative to viewport (for Portal)
                    const rect = range.getBoundingClientRect();
                    setToolbarPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 60, // 60px above selection
                    });
                    setShowTextToolbar(true);
                    checkActiveFormats();
                } catch (e) {
                    // Ignore errors
                    setShowTextToolbar(false);
                    setShowTextColorPicker(false);
                    setShowBgColorPicker(false);
                }
            }, 50); // 50ms debounce
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [isEditing, checkActiveFormats]);

    // Content editing handlers with improved state management
    const handleContentClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!isEditing && !isLocked) {
                onStartEdit(element.id);
                setEditContent(element.content);
                originalContentRef.current = element.content;
                setIsContentDirty(false);
            }
        },
        [isEditing, isLocked, element.id, element.content, onStartEdit]
    );

    const handleContentChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newContent = e.target.value;
            setEditContent(newContent);
            setIsContentDirty(newContent !== originalContentRef.current);
        },
        []
    );

    // Helper function to apply formatting commands (optimized)
    const applyFormatCommand = useCallback((command: string, value?: string) => {
        if (!editableRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        // For color commands, use modern approach with span and inline styles
        if (command === 'foreColor' || command === 'backColor') {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            
            if (command === 'foreColor') {
                span.style.color = value || '#000000';
            } else if (command === 'backColor') {
                span.style.backgroundColor = value || 'transparent';
            }
            
            try {
                range.surroundContents(span);
            } catch (e) {
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
            }

            // Keep selection
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            selection.addRange(newRange);
        } else {
            // For other commands (bold, italic, underline), use execCommand
            document.execCommand(command, false, value);
        }

        // Update content (batch update to reduce re-renders)
        requestAnimationFrame(() => {
            if (editableRef.current) {
                const newHtml = editableRef.current.innerHTML;
                setEditContent(newHtml);
                setIsContentDirty(newHtml !== originalContentRef.current);
            }
        });
    }, []);

    // Apply inline style to selected text (optimized)
    const applyInlineStyle = useCallback((styleKey: string, styleValue: string) => {
        if (!editableRef.current) return;
        
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style[styleKey as any] = styleValue;
        
        try {
            range.surroundContents(span);
        } catch (e) {
            // If surroundContents fails, manually extract and wrap
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
        }

        // Keep selection
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        selection.addRange(newRange);

        // Update content (batch update to reduce re-renders)
        requestAnimationFrame(() => {
            if (editableRef.current) {
                const newHtml = editableRef.current.innerHTML;
                setEditContent(newHtml);
                setIsContentDirty(newHtml !== originalContentRef.current);
            }
        });
    }, []);

    const handleContentKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                // Save content
                if (isContentDirty) {
                    onContentChange(element.id, editContent);
                }
                onEndEdit();
            } else if (e.key === 'Escape') {
                // Revert to original content
                setEditContent(originalContentRef.current);
                setIsContentDirty(false);
                onEndEdit();
            } else if (e.key === 'Delete' && e.ctrlKey) {
                // Allow Delete key to work in textarea, but don't prevent default
                // This allows normal text deletion while editing
                return;
            }
        },
        [element.id, editContent, isContentDirty, onContentChange, onEndEdit]
    );

    const handleContentBlur = useCallback(() => {
        // Save content if it has changed
        if (isContentDirty) {
            onContentChange(element.id, editContent);
            setIsContentDirty(false);
        }
        onEndEdit();
    }, [element.id, editContent, isContentDirty, onContentChange, onEndEdit]);

    // Optimized input handler for contentEditable
    const handleEditableInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        // Store value before requestAnimationFrame to avoid event pooling issues
        const html = e.currentTarget.innerHTML;
        
        // Use requestAnimationFrame to batch updates
        requestAnimationFrame(() => {
            setEditContent(html);
            setIsContentDirty(html !== originalContentRef.current);
        });
    }, []);

    const handleDelete = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(element.id);
        },
        [element.id, onDelete]
    );

    const handleToggleLock = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleLock(element.id);
        },
        [element.id, onToggleLock]
    );

    const handleCopy = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onCopy) {
                onCopy(element.id);
            }
        },
        [element.id, onCopy]
    );

    // Handle keyboard events on the element
    const handleElementKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isSelected || isEditing || isLocked) return;
            
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(element.id);
            }
        },
        [isSelected, isEditing, isLocked, element.id, onDelete]
    );

    // Element styles - เรียบง่าย ตรงไปตรงมา
    const elementStyles = useMemo((): React.CSSProperties => {
        const isButton = element.element_type === 'button';
        const textAlignJustify =
            element.style.textAlign === 'center'
                ? 'center'
                : element.style.textAlign === 'right'
                    ? 'flex-end'
                    : 'flex-start';

        const baseStyles: React.CSSProperties = {
            position: 'absolute',
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            zIndex: element.z_index,
            fontSize: element.style.fontSize,
            fontFamily: element.style.fontFamily,
            fontWeight: element.style.fontWeight as any,
            fontStyle: element.style.fontStyle as any,
            color: element.style.color,
            backgroundColor: element.style.backgroundColor,
            textAlign: element.style.textAlign as any,
            padding: element.style.padding,
            borderRadius: element.style.borderRadius,
            borderWidth: element.style.borderWidth,
            borderStyle: 'solid',
            borderColor: element.style.borderColor,
            cursor: isEditing
                ? 'text'
                : isLocked
                    ? 'not-allowed'
                    : isDragging
                        ? 'grabbing'
                        : 'grab',
            userSelect: isEditing ? 'text' : 'none',
            overflow: 'hidden',
            display: 'flex',
            alignItems: isButton ? 'center' : 'flex-start',
            justifyContent: textAlignJustify,
            transition: 'none',
        };

        // Apply selection styles and border visibility
        if (isSelected) {
            baseStyles.boxShadow = isResizing
                ? '0 0 0 2px #ef4444, 0 4px 12px rgba(239, 68, 68, 0.25)'
                : isLocked
                    ? '0 0 0 2px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.2)'
                    : '0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.2)';
            baseStyles.borderColor = isLocked ? '#f59e0b' : '#3b82f6';
            baseStyles.borderStyle = 'solid';
        } else {
            // Show borders only if showBorders is true
            if (showBorders) {
                baseStyles.borderStyle = 'dashed';
                baseStyles.borderColor = isLocked ? '#f59e0b' : '#d1d5db';
                baseStyles.borderWidth = '1px';
            } else {
                baseStyles.borderStyle = 'none';
                baseStyles.borderWidth = '0px';
            }
            baseStyles.boxShadow = 'none';
        }

        return baseStyles;
    }, [
        element,
        isEditing,
        isDragging,
        isResizing,
        isSelected,
        isLocked,
        showBorders,
    ]);

    // Memoized content styles for textarea
    const textareaStyles = useMemo(
        (): React.CSSProperties => ({
            fontSize: element.style.fontSize,
            fontFamily: element.style.fontFamily,
            fontWeight: element.style.fontWeight as any,
            fontStyle: element.style.fontStyle as any,
            color: element.style.color,
            textAlign: element.style.textAlign as any,
        }),
        [element.style]
    );

    // Shape-specific styles
    const getShapeStyles = useCallback((): React.CSSProperties => {
        const baseStyles: React.CSSProperties = {
            position: 'absolute',
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            zIndex: element.z_index,
            cursor: isEditing
                ? 'text'
                : isLocked
                    ? 'not-allowed'
                    : isDragging
                        ? 'grabbing'
                        : 'grab',
            userSelect: isEditing ? 'text' : 'none',
            overflow: 'visible', // Changed to visible for triangle
            transition: 'none',
        };

        // Apply Fill styles
        if (element.style.fill?.enabled) {
            baseStyles.backgroundColor = element.style.fill.color;
            if (element.style.fill.opacity < 1.0) {
                baseStyles.opacity = element.style.fill.opacity;
            }
        } else {
            baseStyles.backgroundColor = 'transparent';
        }

        // Apply Stroke styles
        if (element.style.stroke?.enabled) {
            baseStyles.border = `${element.style.stroke.width}px ${element.style.stroke.style} ${element.style.stroke.color}`;
            if (element.style.stroke.opacity < 1.0) {
                // For stroke opacity, we need to use a different approach
                baseStyles.borderColor = element.style.stroke.color;
            }
        } else {
            baseStyles.border = 'none';
        }

        // Shape-specific styling
        switch (element.element_type) {
            case 'rectangle':
                baseStyles.borderRadius = element.style.borderRadius;
                break;
            case 'circle':
                baseStyles.borderRadius = '50%';
                break;
            case 'line':
                // Line elements have special styling
                baseStyles.backgroundColor = 'transparent';
                baseStyles.border = 'none';
                baseStyles.borderRadius = '0';
                break;
        }

        // Apply selection styles
        if (isSelected) {
            baseStyles.boxShadow = isResizing
                ? '0 0 0 2px #ef4444, 0 4px 12px rgba(239, 68, 68, 0.25)'
                : isLocked
                    ? '0 0 0 2px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.2)'
                    : '0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.2)';
        } else {
            baseStyles.boxShadow = 'none';
        }

        return baseStyles;
    }, [
        element,
        isEditing,
        isDragging,
        isResizing,
        isSelected,
        isLocked,
    ]);

    // Resize handles - เรียบง่าย ไม่ซับซ้อน
    const resizeHandles = useMemo(() => {
        if (!isSelected || isEditing || isLocked) return null;

        return RESIZE_HANDLES.map(({ direction, cursor, getPosition }) => {
            const position = getPosition(
                element.x,
                element.y,
                element.width,
                element.height
            );

            return (
                <div
                    key={direction}
                    className={`absolute border-2 border-white rounded-sm shadow-md ${isResizing && resizeDirection === direction
                        ? 'bg-red-500'
                        : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    style={{
                        left: position.x,
                        top: position.y,
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        cursor: cursor,
                        zIndex: element.z_index + 1000,
                        // เรียบง่าย ไม่ซับซ้อน
                        transition: 'none',
                        pointerEvents: 'auto',
                    }}
                    onMouseDown={e => handleResizeStart(e, direction)}
                />
            );
        });
    }, [
        isSelected,
        isEditing,
        isLocked,
        element,
        isResizing,
        resizeDirection,
        handleResizeStart,
        RESIZE_HANDLES,
        HANDLE_SIZE,
    ]);

    // If this is a table element, use the TableElement component
    if (element.element_type === 'table') {
        return (
            <TableElement
                element={element}
                isSelected={isSelected}
                isEditing={isEditing}
                isDragging={isDragging}
                isLocked={isLocked}
                showBorders={showBorders}
                onPositionChange={onPositionChange}
                onSizeChange={onSizeChange}
                onContentChange={onContentChange}
                onStyleChange={onStyleChange}
                onSelect={onSelect}
                onStartEdit={onStartEdit}
                onEndEdit={onEndEdit}
                onDelete={onDelete}
                onStartDrag={onStartDrag}
                onToggleLock={onToggleLock}
                onCopy={onCopy}
                onTableCellChange={onTableCellChange || (() => { })}
                onAddRow={onAddRow || (() => { })}
                onRemoveRow={onRemoveRow || (() => { })}
                onAddColumn={onAddColumn || (() => { })}
                onRemoveColumn={onRemoveColumn || (() => { })}
                onMergeCells={onMergeCells || (() => { })}
                onUpdateColumnWidth={onUpdateColumnWidth || (() => { })}
                onUpdateRowHeight={onUpdateRowHeight || (() => { })}
                // Cell selection props moved to Zustand store
            />
        );
    }

    // If this is a form field element, use the FormFieldElement component
    if (element.element_type === 'form_field') {
        return (
            <FormFieldElement
                element={element}
                isSelected={isSelected}
                isEditing={isEditing}
                isDragging={isDragging}
                isLocked={isLocked}
                showBorders={showBorders}
                onPositionChange={onPositionChange}
                onSizeChange={onSizeChange}
                onContentChange={onContentChange}
                onStyleChange={onStyleChange}
                onSelect={onSelect}
                onStartEdit={onStartEdit}
                onEndEdit={onEndEdit}
                onDelete={onDelete}
                onStartDrag={onStartDrag}
                onToggleLock={onToggleLock}
                onCopy={onCopy}
            />
        );
    }

    // If this is a checkbox element, use the CheckboxElement component
    if (element.element_type === 'checkbox') {
        return (
            <CheckboxElement
                element={element}
                isSelected={isSelected}
                isEditing={isEditing}
                isDragging={isDragging}
                isLocked={isLocked}
                showBorders={showBorders}
                onPositionChange={onPositionChange}
                onSizeChange={onSizeChange}
                onContentChange={onContentChange}
                onStyleChange={onStyleChange}
                onSelect={onSelect}
                onStartEdit={onStartEdit}
                onEndEdit={onEndEdit}
                onDelete={onDelete}
                onStartDrag={onStartDrag}
                onToggleLock={onToggleLock}
                onCopy={onCopy}
            />
        );
    }

    // If this is a shape element, render it with shape-specific styling
    if (element.element_type === 'rectangle' || element.element_type === 'circle' || element.element_type === 'line') {
        return (
            <>
                {/* Control buttons - อยู่นอก element หลัก */}
                {isSelected && !isEditing && (
                    <div
                        className="absolute flex flex-col space-y-1"
                        style={{
                            left: element.x + element.width + 6,
                            top: element.y,
                            zIndex: element.z_index + 1001,
                            transition: 'none',
                        }}
                    >
                        {/* Delete button */}
                        <button
                            onClick={handleDelete}
                            className="w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600 shadow-lg"
                            title="ลบ"
                        >
                            <Icon icon="hugeicons:multiplication-sign" className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleToggleLock}
                            className={`w-6 h-6 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg ${isLocked
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-gray-400 hover:bg-gray-500'
                                }`}
                            title={isLocked ? 'ปลดล็อค' : 'ล็อค'}
                        >
                            <Icon
                                icon={
                                    isLocked
                                        ? 'hugeicons:square-lock-02'
                                        : 'hugeicons:square-unlock-02'
                                }
                                className="w-4 h-4"
                            />
                        </button>
                    </div>
                )}

                {/* Shape element */}
                {element.element_type === 'line' ? (
                    <LineElement
                        element={element}
                        isSelected={isSelected}
                        isEditing={isEditing}
                        isLocked={isLocked}
                        onSelect={onSelect}
                        onStartDrag={onStartDrag}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onKeyDown={handleElementKeyDown}
                        editContent={editContent}
                        onContentChange={handleContentChange}
                        onContentKeyDown={handleContentKeyDown}
                        onContentBlur={handleContentBlur}
                        elementRef={elementRef as React.RefObject<HTMLDivElement>}
                        onSizeChange={onSizeChange}
                        onPositionChange={onPositionChange}
                        onLineDataChange={(elementId: string, lineData: any) => {
                            // Convert lineData back to JSON string and update content
                            const contentString = JSON.stringify(lineData);
                            onContentChange(elementId, contentString);
                        }}
                    />
                ) : (
                    <div
                        ref={elementRef}
                        style={getShapeStyles()}
                        data-element-id={element.id}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                onSelect(element.id);
                            }
                        }}
                        onMouseDown={
                            !isEditing && !isResizing && !isLocked
                                ? e => onStartDrag(e, element.id)
                                : undefined
                        }
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onKeyDown={handleElementKeyDown}
                        tabIndex={isSelected ? 0 : -1}
                    >
                        {/* Shape content overlay for editing */}
                        {isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <textarea
                                    value={editContent}
                                    onChange={handleContentChange}
                                    onKeyDown={handleContentKeyDown}
                                    onBlur={handleContentBlur}
                                    className="w-full h-full resize-none bg-transparent border-none outline-none text-center"
                                    style={{
                                        fontSize: element.style.fontSize,
                                        fontFamily: element.style.fontFamily,
                                        fontWeight: element.style.fontWeight as any,
                                        fontStyle: element.style.fontStyle as any,
                                        color: element.style.color,
                                        textAlign: 'center' as any,
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Resize handles */}
                {element.element_type === 'line' ? null : resizeHandles}
            </>
        );
    }

    return (
        <>
            {/* Control buttons - อยู่นอก element หลัก */}
            {isSelected && !isEditing && (
                <div
                    className="absolute flex flex-col space-y-1"
                    style={{
                        left: element.x + element.width + 6,
                        top: element.y,
                        zIndex: element.z_index + 1001,
                        transition: 'none', // ปิด transition เพื่อให้เร็วขึ้น
                    }}
                >
                    {/* Delete button */}
                    <button
                        onClick={handleDelete}
                        className="w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600 shadow-lg"
                        title="ลบ"
                    >
                        <Icon icon="hugeicons:multiplication-sign" className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleToggleLock}
                        className={`w-6 h-6 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg ${isLocked
                            ? 'bg-amber-500 hover:bg-amber-600'
                            : 'bg-gray-400 hover:bg-gray-500'
                            }`}
                        title={isLocked ? 'ปลดล็อค' : 'ล็อค'}
                    >
                        <Icon
                            icon={
                                isLocked
                                    ? 'hugeicons:square-lock-02'
                                    : 'hugeicons:square-unlock-02'
                            }
                            className="w-4 h-4"
                        />
                    </button>
                </div>
            )}

            {/* Main element */}
            <div
                ref={elementRef}
                style={elementStyles}
                data-element-id={element.id}
                onClick={(e) => {
                    // Only select if clicking on the element itself, not on content
                    if (e.target === e.currentTarget) {
                        onSelect(element.id);
                        // Exit edit mode when clicking on element border/background
                        if (isEditing) {
                            onEndEdit();
                        }
                    }
                }}
                onMouseDown={
                    !isEditing && !isResizing && !isLocked
                        ? e => onStartDrag(e, element.id)
                        : undefined
                }
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleElementKeyDown}
                tabIndex={isSelected ? 0 : -1}
            >
                {/* Content */}
                {isEditing ? (
                    <div className="w-full h-full relative">
                        {/* Text Formatting Toolbar - Clean White Theme */}
                        {showTextToolbar && typeof window !== 'undefined' && ReactDOM.createPortal(
                            <div
                                className="fixed bg-white text-gray-900 rounded-xl shadow-lg border border-gray-200 px-1.5 py-1.5 flex items-center gap-0.5 pointer-events-auto"
                                style={{
                                    left: toolbarPosition.x,
                                    top: toolbarPosition.y,
                                    transform: 'translateX(-50%)',
                                    zIndex: 999999,
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                {/* Bold */}
                                <button
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        activeFormats.has('bold')
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                    onClick={() => {
                                        applyFormatCommand('bold');
                                        checkActiveFormats();
                                    }}
                                    title="Bold (Ctrl+B)"
                                >
                                    <Icon icon="mdi:format-bold" className="w-4.5 h-4.5" />
                                </button>

                                {/* Italic */}
                                <button
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        activeFormats.has('italic')
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                    onClick={() => {
                                        applyFormatCommand('italic');
                                        checkActiveFormats();
                                    }}
                                    title="Italic (Ctrl+I)"
                                >
                                    <Icon icon="mdi:format-italic" className="w-4.5 h-4.5" />
                                </button>

                                {/* Underline */}
                                <button
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        activeFormats.has('underline')
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                    onClick={() => {
                                        applyFormatCommand('underline');
                                        checkActiveFormats();
                                    }}
                                    title="Underline (Ctrl+U)"
                                >
                                    <Icon icon="mdi:format-underline" className="w-4.5 h-4.5" />
                                </button>

                                <div className="w-px h-5 bg-gray-300 mx-1.5" />

                                {/* Font Size Increase */}
                                <button
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                    onClick={() => applyInlineStyle('fontSize', '20px')}
                                    title="Larger"
                                >
                                    <Icon icon="mdi:format-font-size-increase" className="w-4.5 h-4.5" />
                                </button>

                                {/* Font Size Decrease */}
                                <button
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                    onClick={() => applyInlineStyle('fontSize', '12px')}
                                    title="Smaller"
                                >
                                    <Icon icon="mdi:format-font-size-decrease" className="w-4.5 h-4.5" />
                                </button>

                                <div className="w-px h-5 bg-gray-300 mx-1.5" />

                                {/* Text Color Picker */}
                                <div className="relative">
                                    <button
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                        onClick={() => {
                                            setShowTextColorPicker(!showTextColorPicker);
                                            setShowBgColorPicker(false);
                                        }}
                                        title="Text Color"
                                    >
                                        <Icon icon="mdi:format-color-text" className="w-4.5 h-4.5" />
                                    </button>
                                    {showTextColorPicker && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                                            <input
                                                type="color"
                                                className="w-32 h-8 rounded cursor-pointer"
                                                onChange={(e) => {
                                                    applyFormatCommand('foreColor', e.target.value);
                                                    setShowTextColorPicker(false);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Background Color Picker */}
                                <div className="relative">
                                    <button
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-600"
                                        onClick={() => {
                                            setShowBgColorPicker(!showBgColorPicker);
                                            setShowTextColorPicker(false);
                                        }}
                                        title="Highlight Color"
                                    >
                                        <Icon icon="mdi:format-color-highlight" className="w-4.5 h-4.5" />
                                    </button>
                                    {showBgColorPicker && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
                                            <input
                                                type="color"
                                                className="w-32 h-8 rounded cursor-pointer"
                                                onChange={(e) => {
                                                    applyFormatCommand('backColor', e.target.value);
                                                    setShowBgColorPicker(false);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>,
                            document.body
                        )}

                        <div
                            ref={editableRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="w-full h-full bg-transparent border-none outline-none"
                            style={textareaStyles}
                            onInput={handleEditableInput}
                            onKeyDown={handleContentKeyDown}
                            onBlur={handleContentBlur}
                        />
                        {/* Edit indicator */}
                        {isContentDirty && (
                            <div
                                className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"
                                title="Unsaved changes"
                            />
                        )}
                    </div>
                ) : (
                    <div
                        className="w-full h-full flex items-center cursor-text"
                        onClick={handleContentClick}
                        style={{
                            alignItems:
                                element.element_type === 'button' ? 'center' : 'flex-start',
                            justifyContent:
                                element.style.textAlign === 'center'
                                    ? 'center'
                                    : element.style.textAlign === 'right'
                                        ? 'flex-end'
                                        : 'flex-start',
                        }}
                    >
                        {element.content ? (
                            <div dangerouslySetInnerHTML={{ __html: element.content }} />
                        ) : (
                            <span className="text-gray-400 italic">Click to edit...</span>
                        )}
                    </div>
                )}
            </div>

            {/* Resize handles */}
            {resizeHandles}
        </>
    );
};

export default ResizableElement;
