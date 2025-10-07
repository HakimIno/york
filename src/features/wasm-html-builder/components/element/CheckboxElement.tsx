import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Element } from '../../module/wasm-interface';
import { useResizable } from '../../hooks/resizable';

interface CheckboxData {
    label: string;
    checked: boolean;
    showLabel: boolean;
    labelPosition: 'left' | 'right';
    checkboxStyle: 'square' | 'circle' | 'rounded';
    boxSize: number;
    fontSize: number;
    labelGap: number;
}

interface CheckboxElementProps {
    element: Element;
    isSelected: boolean;
    isEditing: boolean;
    isDragging: boolean;
    isLocked: boolean;
    showBorders: boolean;
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
}

const CheckboxElement: React.FC<CheckboxElementProps> = ({
    element,
    isSelected,
    isEditing,
    isDragging,
    isLocked,
    showBorders,
    onContentChange,
    onSelect,
    onStartEdit,
    onEndEdit,
    onDelete,
    onStartDrag,
    onToggleLock,
    onCopy,
    onPositionChange,
    onSizeChange,
}) => {
    // Resizable functionality
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

    // Parse checkbox data
    const checkboxData = useMemo((): CheckboxData => {
        try {
            const parsed = JSON.parse(element.content || '{}');
            return {
                label: parsed.label ?? 'Checkbox',
                checked: parsed.checked || false,
                showLabel: parsed.showLabel !== false,
                labelPosition: parsed.labelPosition || 'right',
                checkboxStyle: parsed.checkboxStyle || 'square',
                boxSize: parsed.boxSize || 15,
                fontSize: parsed.fontSize || 12,
                labelGap: parsed.labelGap || 4,
            };
        } catch {
            return {
                label: 'Checkbox',
                checked: false,
                showLabel: true,
                labelPosition: 'right',
                checkboxStyle: 'square',
                boxSize: 15,
                fontSize: 12,
                labelGap: 4,
            };
        }
    }, [element.content]);

    // Handle checkbox toggle
    const handleCheckboxToggle = useCallback(() => {
        if (isLocked) return;

        const updatedData = {
            ...checkboxData,
            checked: !checkboxData.checked,
        };
        onContentChange(element.id, JSON.stringify(updatedData));
    }, [checkboxData, element.id, onContentChange, isLocked]);

    // Handle label edit
    const handleLabelChange = useCallback((newLabel: string) => {
        const updatedData = {
            ...checkboxData,
            label: newLabel, // Allow empty string
        };
        onContentChange(element.id, JSON.stringify(updatedData));
    }, [checkboxData, element.id, onContentChange]);

    // Handle double click to edit label
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLocked) {
            onStartEdit(element.id);
        }
    }, [isLocked, onStartEdit, element.id]);

    // Handle delete
    const handleDelete = useCallback(() => {
        onDelete(element.id);
    }, [onDelete, element.id]);

    // Handle copy
    const handleCopy = useCallback(() => {
        onCopy?.(element.id);
    }, [onCopy, element.id]);

    // Element styles
    const elementStyles = useMemo((): React.CSSProperties => {
        return {
            position: 'absolute',
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            zIndex: element.z_index,
            fontSize: element.style.fontSize,
            fontFamily: element.style.fontFamily,
            fontWeight: element.style.fontWeight,
            fontStyle: element.style.fontStyle,
            color: element.style.color,
            backgroundColor: element.style.backgroundColor,
            padding: element.style.padding,
            borderRadius: element.style.borderRadius,
            display: 'flex',
            alignItems: 'center',
            cursor: isLocked ? 'default' : 'pointer',
            border: showBorders ? '1px dashed #ccc' : 'none',
            outline: isSelected ? '2px solid #007bff' : 'none',
            transition: (isDragging || isResizing) ? 'none' : 'all 0.1s ease',
        };
    }, [element, isSelected, isDragging, isResizing, isLocked, showBorders]);

    // Checkbox styles
    const checkboxStyles = useMemo((): React.CSSProperties => {
        let borderRadius = '2px'; // square
        if (checkboxData.checkboxStyle === 'circle') {
            borderRadius = '50%';
        } else if (checkboxData.checkboxStyle === 'rounded') {
            borderRadius = '4px';
        }

        return {
            display: 'inline-block',
            width: `${checkboxData.boxSize}px`,
            height: `${checkboxData.boxSize}px`,
            border: '1px solid #222',
            textAlign: 'center',
            lineHeight: `${checkboxData.boxSize}px`,
            borderRadius,
            cursor: isLocked ? 'default' : 'pointer',
            fontSize: `${checkboxData.fontSize}px`,
        };
    }, [checkboxData.checkboxStyle, checkboxData.boxSize, checkboxData.fontSize, checkboxData.labelGap, isLocked]);

     // Label styles
     const labelStyles = useMemo((): React.CSSProperties => ({
         fontSize: element.style.fontSize || 'inherit',
         fontFamily: element.style.fontFamily || 'inherit',
         fontWeight: element.style.fontWeight || 'inherit',
         fontStyle: element.style.fontStyle || 'inherit',
         color: element.style.color || 'inherit',
         backgroundColor: element.style.backgroundColor || 'transparent',
         padding: element.style.padding || '0',
         borderRadius: element.style.borderRadius || '0',
         margin: checkboxData.labelPosition === 'left' ? `0 ${checkboxData.labelGap}px 0 0` : '0',
         cursor: isLocked ? 'default' : 'pointer',
         userSelect: 'none',
     }), [element.style, checkboxData.labelPosition, checkboxData.labelGap, isLocked]);

    return (
        <>
            {/* Control buttons */}
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
                    <button
                        onClick={handleDelete}
                        className="w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600 shadow-lg"
                        title="ลบ"
                    >
                        <Icon icon="hugeicons:multiplication-sign" className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => onToggleLock(element.id)}
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

            {/* Checkbox element */}
            <div
                style={elementStyles}
                onClick={() => onSelect(element.id)}
                onMouseDown={!isLocked ? (e) => onStartDrag(e, element.id) : undefined}
                onDoubleClick={handleDoubleClick}
                className='flex items-center gap-2'
            >
                {/* Label on left */}
                {checkboxData.showLabel && checkboxData.labelPosition === 'left' && (
                    <label style={labelStyles}>
                        {isEditing ? (
                            <input
                                type="text"
                                value={checkboxData.label}
                                onChange={(e) => handleLabelChange(e.target.value)}
                                onBlur={onEndEdit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onEndEdit();
                                    }
                                }}
                                 style={{
                                     background: 'transparent',
                                     border: '1px solid #007bff',
                                     borderRadius: '2px',
                                     padding: '2px 4px',
                                     fontSize: element.style.fontSize || 'inherit',
                                     fontFamily: element.style.fontFamily || 'inherit',
                                     fontWeight: element.style.fontWeight || 'inherit',
                                     fontStyle: element.style.fontStyle || 'inherit',
                                     color: element.style.color || 'inherit',
                                     outline: 'none',
                                 }}
                                autoFocus
                            />
                        ) : (
                            checkboxData.label || ''
                        )}
                    </label>
                )}

                {/* Checkbox span */}
                <div className="">
                    <span
                        style={checkboxStyles}
                        onClick={handleCheckboxToggle}
                    >
                        {checkboxData.checked && '✓'}
                    </span>
                </div>

                {/* Label on right */}
                {checkboxData.showLabel && checkboxData.labelPosition === 'right' && (
                    <label style={labelStyles}>
                        {isEditing ? (
                            <input
                                type="text"
                                value={checkboxData.label}
                                onChange={(e) => handleLabelChange(e.target.value)}
                                onBlur={onEndEdit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onEndEdit();
                                    }
                                }}
                                 style={{
                                     background: 'transparent',
                                     borderRadius: '2px',
                                     fontSize: element.style.fontSize || 'inherit',
                                     fontFamily: element.style.fontFamily || 'inherit',
                                     fontWeight: element.style.fontWeight || 'inherit',
                                     fontStyle: element.style.fontStyle || 'inherit',
                                     color: element.style.color || 'inherit',
                                     outline: 'none',
                                 }}
                                autoFocus
                            />
                        ) : (
                            checkboxData.label || ''
                        )}
                    </label>
                )}
            </div>

            {/* Resize handles */}
            {isSelected && !isEditing && !isLocked && (
                <>
                    {RESIZE_HANDLES.map((handle) => {
                        const position = handle.getPosition(element.x, element.y, element.width, element.height);
                        return (
                            <div
                                key={handle.direction}
                                className={`absolute border-2 border-white rounded-sm shadow-md ${isResizing && resizeDirection === handle.direction
                                    ? 'bg-red-500'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                style={{
                                    position: 'absolute',
                                    left: position.x,
                                    top: position.y,
                                    width: HANDLE_SIZE,
                                    height: HANDLE_SIZE,
                                    cursor: handle.cursor,
                                    zIndex: element.z_index + 1000,
                                    pointerEvents: 'auto',
                                }}
                                onMouseDown={(e) => handleResizeStart(e, handle.direction)}
                            />
                        );
                    })}
                </>
            )}
        </>
    );
};

export default CheckboxElement;
