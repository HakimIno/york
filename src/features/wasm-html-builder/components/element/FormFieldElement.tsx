'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Element } from '../../module/wasm-interface';
import { useResizable } from '../../hooks/resizable';
import { Icon } from '@iconify/react';

interface FormFieldElementProps {
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
}

interface FormFieldData {
  label: string;
  value: string;
  labelWidth: number; // Percentage of total width
  valueWidth: number; // Percentage of total width
  gap: number; // Gap between label and value in pixels
  showLabel: boolean; // Show or hide label
  underlineStyle: 'solid' | 'dashed' | 'dotted' | 'double'; // Underline style
}

const FormFieldElement: React.FC<FormFieldElementProps> = ({
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
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');
  const elementRef = useRef<HTMLDivElement>(null);

  // Parse form field data from element content
  const formFieldData: FormFieldData = useMemo(() => {
    try {
      const parsed = JSON.parse(element.content || '{}');
      return {
        label: parsed.label || 'Label:',
        value: parsed.value || '',
        labelWidth: parsed.labelWidth || 30,
        valueWidth: parsed.valueWidth || 70,
        gap: parsed.gap || 8,
        showLabel: parsed.showLabel !== undefined ? parsed.showLabel : true,
        underlineStyle: parsed.underlineStyle || 'solid',
      };
    } catch {
      return {
        label: 'Label:',
        value: '',
        labelWidth: 30,
        valueWidth: 70,
        gap: 8,
        showLabel: true,
        underlineStyle: 'solid',
      };
    }
  }, [element.content]);

  // Function to get underline style
  const getUnderlineStyle = useCallback((style: string) => {
    switch (style) {
      case 'dashed':
        return {
          borderTop: `1px dashed ${element.style.color}`,
        };
      case 'dotted':
        return {
          borderTop: `1px dotted ${element.style.color}`,
        };
      case 'double':
        return {
          borderTop: `3px double ${element.style.color}`,
        };
      case 'solid':
      default:
        return {
          borderTop: `1px solid ${element.style.color}`,
        };
    }
  }, [element.style.color]);

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

  // Label editing handlers
  const handleLabelClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      if (!isEditing && !isLocked) {
        setIsEditingLabel(true);
        setEditLabel(formFieldData.label);
      }
    },
    [isEditing, isLocked, formFieldData.label]
  );

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditLabel(e.target.value);
    },
    []
  );

  const handleLabelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Save label
        const newData = { ...formFieldData, label: editLabel };
        onContentChange(element.id, JSON.stringify(newData));
        setIsEditingLabel(false);
      } else if (e.key === 'Escape') {
        // Revert
        setEditLabel(formFieldData.label);
        setIsEditingLabel(false);
      } else if (e.key === 'Delete' && e.ctrlKey) {
        // Ctrl+Delete = ออกจากโหมดแก้ไข
        setIsEditingLabel(false);
      }
      // Delete และ Backspace ปกติจะทำงานใน input field (ลบตัวอักษร)
    },
    [element.id, editLabel, formFieldData, onContentChange]
  );

  const handleLabelBlur = useCallback(() => {
    const newData = { ...formFieldData, label: editLabel };
    onContentChange(element.id, JSON.stringify(newData));
    setIsEditingLabel(false);
  }, [element.id, editLabel, formFieldData, onContentChange]);

  // Value editing handlers
  const handleValueClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      if (!isEditing && !isLocked) {
        setIsEditingValue(true);
        setEditValue(formFieldData.value);
      }
    },
    [isEditing, isLocked, formFieldData.value]
  );

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditValue(e.target.value);
    },
    []
  );

  const handleValueKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Save value
        const newData = { ...formFieldData, value: editValue };
        onContentChange(element.id, JSON.stringify(newData));
        setIsEditingValue(false);
      } else if (e.key === 'Escape') {
        // Revert
        setEditValue(formFieldData.value);
        setIsEditingValue(false);
      } else if (e.key === 'Delete' && e.ctrlKey) {
        // Ctrl+Delete = ออกจากโหมดแก้ไข
        setIsEditingValue(false);
      }
      // Delete และ Backspace ปกติจะทำงานใน input field (ลบตัวอักษร)
    },
    [element.id, editValue, formFieldData, onContentChange]
  );

  const handleValueBlur = useCallback(() => {
    const newData = { ...formFieldData, value: editValue };
    onContentChange(element.id, JSON.stringify(newData));
    setIsEditingValue(false);
  }, [element.id, editValue, formFieldData, onContentChange]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      // ถ้าอยู่ในโหมดแก้ไข ให้ออกจากโหมดแก้ไขก่อน
      if (isEditingLabel) {
        setIsEditingLabel(false);
        return;
      }
      if (isEditingValue) {
        setIsEditingValue(false);
        return;
      }
      onDelete(element.id);
    },
    [element.id, onDelete, isEditingLabel, isEditingValue]
  );

  const handleToggleLock = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      onToggleLock(element.id);
    },
    [element.id, onToggleLock]
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      if (onCopy) {
        onCopy(element.id);
      }
    },
    [element.id, onCopy]
  );

  // Handle keyboard events on the element
  const handleElementKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // ถ้าอยู่ในโหมดแก้ไข label หรือ value ไม่ต้องทำอะไร (ให้ input field จัดการเอง)
      if (isEditingLabel || isEditingValue) {
        return;
      }
      
      // Only handle keyboard events when element is selected and not editing
      if (isSelected && !isEditing && !isLocked) {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          onStartEdit(element.id);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          onDelete(element.id);
        }
      }
    },
    [isSelected, isEditing, isLocked, isEditingLabel, isEditingValue, element.id, onDelete, onStartEdit]
  );

  // Element styles
  const elementStyles = useMemo((): React.CSSProperties => {
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
      padding: element.style.padding,
      borderRadius: element.style.borderRadius,
      borderWidth: element.style.borderWidth,
      borderStyle: 'solid',
      borderColor: element.style.borderColor,
      cursor: isLocked
        ? 'not-allowed'
        : isDragging
          ? 'grabbing'
          : 'grab',
      userSelect: 'none',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
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
    isDragging,
    isResizing,
    isSelected,
    isLocked,
    showBorders,
  ]);

  // Resize handles
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
          className={`absolute border-2 border-white rounded-sm shadow-md ${
            isResizing && resizeDirection === direction
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

  return (
    <>
      {/* Control buttons */}
      {isSelected && !isEditing && !isEditingLabel && !isEditingValue && (
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
            className={`w-6 h-6 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg ${
              isLocked
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

      {/* Editing indicator */}
      {(isEditingLabel || isEditingValue) && (
        <div
          className="absolute bg-primary text-white px-2 py-1 rounded text-xs font-medium shadow-lg"
          style={{
            left: element.x + element.width + 6,
            top: element.y,
            zIndex: element.z_index + 1001,
          }}
        >
          {isEditingLabel ? 'แก้ไข Label' : 'แก้ไข Value'}
          <div className="text-xs opacity-75 mt-1">
            Enter: บันทึก • Esc: ยกเลิก
          </div>
        </div>
      )}

      {/* Main element */}
      <div
        ref={elementRef}
        style={elementStyles}
        onClick={(e) => {
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          onSelect(element.id);
        }}
        onMouseDown={
          !isEditing && !isResizing && !isLocked
            ? e => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                onStartDrag(e, element.id);
              }
            : undefined
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleElementKeyDown}
        tabIndex={isSelected ? 0 : -1}
      >
        {/* Form Field Content */}
        <div className="w-full h-full flex items-center" style={{ gap: formFieldData.showLabel ? `${formFieldData.gap}px` : '0px' }}>
          {/* Label Section - แสดงเมื่อ showLabel เป็น true */}
          {formFieldData.showLabel && (
            <div
              style={{
                width: `${formFieldData.labelWidth}%`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {isEditingLabel ? (
                <input
                  type="text"
                  value={editLabel}
                  onChange={handleLabelChange}
                  onKeyDown={handleLabelKeyDown}
                  onBlur={handleLabelBlur}
                  className="w-full bg-transparent border-none outline-none"
                  style={{
                    fontSize: element.style.fontSize,
                    fontFamily: element.style.fontFamily,
                    fontWeight: element.style.fontWeight,
                    color: element.style.color,
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className="cursor-text"
                  onClick={handleLabelClick}
                  style={{
                    fontSize: element.style.fontSize,
                    fontFamily: element.style.fontFamily,
                    fontWeight: element.style.fontWeight,
                    color: element.style.color,
                  }}
                >
                  {formFieldData.label}
                </span>
              )}
            </div>
          )}

          {/* Value Section - ปรับความกว้างตามการแสดง label */}
          <div
            style={{
              width: formFieldData.showLabel ? `${formFieldData.valueWidth}%` : '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {isEditingValue ? (
              <input
                type="text"
                value={editValue}
                onChange={handleValueChange}
                onKeyDown={handleValueKeyDown}
                onBlur={handleValueBlur}
                className="w-full bg-transparent border-none outline-none"
                style={{
                  fontSize: element.style.fontSize,
                  fontFamily: element.style.fontFamily,
                  fontWeight: element.style.fontWeight,
                  color: element.style.color,
                }}
                autoFocus
              />
            ) : (
              <div
                className="w-full cursor-text"
                onClick={handleValueClick}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontSize: element.style.fontSize,
                    fontFamily: element.style.fontFamily,
                    fontWeight: element.style.fontWeight,
                    color: element.style.color,
                    marginBottom: '2px',
                  }}
                >
                  {formFieldData.value || 'Click to edit...'}
                </span>
                <hr
                  style={{
                    width: '95%',
                    border: 'none',
                    margin: 0,
                    ...getUnderlineStyle(formFieldData.underlineStyle),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resize handles */}
      {resizeHandles}
    </>
  );
};

export default FormFieldElement;
