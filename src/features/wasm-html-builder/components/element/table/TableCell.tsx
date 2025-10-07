import React from 'react';
import { TableCellProps } from './types';
import { useTableStore } from '@/stores/tableStore';

const TableCell: React.FC<TableCellProps> = React.memo(({
  cell,
  row,
  col,
  isSelected: propIsSelected,
  isEditing,
  editingContent,
  onCellClick,
  onCellDoubleClick,
  onContentChange,
  onContentSave,
  onContentCancel,
  onKeyDown,
  onMouseDown,
  onMouseEnter,
  getCellStyles,
}) => {
  // Use Zustand store for cell selection
  const { isCellSelected } = useTableStore();
  const storeIsSelected = isCellSelected(row, col);
  
  // Use store selection if available, fallback to prop
  const isSelected = storeIsSelected || propIsSelected;
  const getStyleProperty = (obj: any, camelKey: string, snakeKey: string, defaultValue: any) => {
    return obj?.[camelKey] ?? obj?.[snakeKey] ?? defaultValue;
  };

  const cellStyles = getCellStyles(cell, row, col);

  const finalStyles: React.CSSProperties = {
    ...cellStyles,
    position: 'relative',
    backgroundColor: getStyleProperty(cell.style, 'backgroundColor', 'background_color', '#ffffff'),
    transition: 'all 0.1s ease-in-out',
    ...(isSelected && {
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
      transform: 'scale(1.02)',
    }),
    ...(isEditing && {
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.6), 0 4px 6px rgba(0, 0, 0, 0.1)',
      transform: 'scale(1.02)',
    }),
  };

  return (
    <td
      key={`${row}-${col}`}
      style={finalStyles}
      rowSpan={cell.rowspan}
      colSpan={cell.colspan}
      onClick={e => onCellClick(row, col, e)}
      onDoubleClick={() => onCellDoubleClick?.(row, col)}
      onMouseDown={onMouseDown ? e => onMouseDown(row, col, e) : undefined}
      onMouseEnter={onMouseEnter ? () => onMouseEnter(row, col) : undefined}
      onMouseLeave={(e) => {
        // Add subtle hover effect
        const target = e.target as HTMLElement;
        if (!isSelected && !isEditing) {
          target.style.backgroundColor = getStyleProperty(cell.style, 'backgroundColor', 'background_color', '#ffffff');
        }
      }}
      onMouseOver={(e) => {
        // Add subtle hover effect
        const target = e.target as HTMLElement;
        if (!isSelected && !isEditing) {
          target.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        }
      }}
    >
      {isEditing ? (
        <input
          type="text"
          value={editingContent}
          onChange={onContentChange}
          onKeyDown={onKeyDown}
          onBlur={onContentSave}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: getStyleProperty(cell.style, 'backgroundColor', 'background_color', '#ffffff'),
            fontSize: `${getStyleProperty(cell.style, 'fontSize', 'font_size', 12)}px`,
            fontFamily: getStyleProperty(cell.style, 'fontFamily', 'font_family', 'Arial'),
            fontWeight: getStyleProperty(cell.style, 'fontWeight', 'font_weight', 'normal'),
            fontStyle: getStyleProperty(cell.style, 'fontStyle', 'font_style', 'normal'),
            color: getStyleProperty(cell.style, 'color', 'color', '#000000'),
            textAlign: getStyleProperty(cell.style, 'textAlign', 'text_align', 'left'),
          }}
          autoFocus
        />
      ) : (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center',
          backgroundColor: getStyleProperty(cell.style, 'backgroundColor', 'background_color', '#ffffff'),
        }}>
          <span 
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: `${getStyleProperty(cell.style, 'fontSize', 'font_size', 12)}px`,
              fontFamily: getStyleProperty(cell.style, 'fontFamily', 'font_family', 'Arial'),
              fontWeight: getStyleProperty(cell.style, 'fontWeight', 'font_weight', 'normal'),
              fontStyle: getStyleProperty(cell.style, 'fontStyle', 'font_style', 'normal'),
              color: getStyleProperty(cell.style, 'color', 'color', cell.content ? '#000000' : '#666666'),
              textAlign: getStyleProperty(cell.style, 'textAlign', 'text_align', 'left'),
            }}
          >
            {cell.content || "Click to edit"}
          </span>
        </div>
      )}
    </td>
  );
});

TableCell.displayName = 'TableCell';

export default TableCell;
