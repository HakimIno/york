import React from 'react';
import { Element, TableData, TableCell } from '../../../module/wasm-interface';
import { CellStyleProps } from './types';

/**
 * Generate element styles for the table container
 */
export const getElementStyles = (
  element: Element,
  isSelected: boolean,
  isEditing: boolean,
  isDragging: boolean,
  isLocked: boolean,
  showBorders: boolean
): React.CSSProperties => {
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
    padding: 0,
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
    flexDirection: 'column',
    transition: 'none',
  };

  // Apply selection styles
  if (isSelected) {
    baseStyles.boxShadow = isLocked
      ? '0 0 0 2px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.2)'
      : '0 0 0 2px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.2)';
    baseStyles.borderColor = isLocked ? '#f59e0b' : '#3b82f6';
  } else {
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
};

/**
 * Generate table styles with Excel-like layout
 */
export const getTableStyles = (tableData: TableData | null): React.CSSProperties => {
  if (!tableData) return {};

  return {
    width: '100%',
    height: '100%',
    borderCollapse: 'collapse', // Excel uses collapsed borders
    borderSpacing: '0',
    fontSize: '13px', // Excel standard font size
    tableLayout: 'fixed', // Fixed layout for consistent column widths
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    border: '1px solid #d0d7de',
  };
};

/**
 * Generate cell styles with Excel-like appearance
 */
export const getCellStyles = (
  props: CellStyleProps
): React.CSSProperties => {
  const {
    cell,
    row,
    col,
    isSelected,
    isEditing,
    isHeader,
    isRowHovered,
    isColHovered,
    isLocked,
    tableData,
  } = props;

  // Check if cell is at table edges
  const isFirstRow = row === 0;
  const isLastRow = row === (tableData?.rows.length || 1) - 1;
  const isFirstCol = col === 0;
  const isLastCol = col === (tableData?.column_widths.length || 1) - 1;


  // Convert WASM snake_case to camelCase for style properties
  const getStyleProperty = (obj: any, camelKey: string, snakeKey: string, defaultValue: any) => {
    return obj?.[camelKey] ?? obj?.[snakeKey] ?? defaultValue;
  };

  const baseCellStyle: React.CSSProperties = {
    padding: '1px 2px', // Reduced padding for smaller cells
    border: '0.5px solid #d0d7de',
    fontSize: `${getStyleProperty(cell.style, 'fontSize', 'font_size', 12)}px`,
    fontFamily: getStyleProperty(cell.style, 'fontFamily', 'font_family', 'Arial'),
    fontWeight: getStyleProperty(cell.style, 'fontWeight', 'font_weight', 'normal'),
    fontStyle: getStyleProperty(cell.style, 'fontStyle', 'font_style', 'normal'),
    color: getStyleProperty(cell.style, 'color', 'color', '#000000'),
    backgroundColor: getStyleProperty(cell.style, 'backgroundColor', 'background_color', '#ffffff'),
    textAlign: getStyleProperty(cell.style, 'textAlign', 'text_align', 'left') as any,
    position: 'relative',
    cursor: isLocked ? 'not-allowed' : 'text',
    transition: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    outline: 'none',
    userSelect: 'text',
    verticalAlign: 'middle',
    lineHeight: '1.2', // Tighter line height for smaller cells
    minHeight: '14px', // Minimum height for better readability
  };

  // Determine border styles based on selection and position
  const getBorderStyle = (isEdge: boolean, isSelected: boolean) => {
    if (isSelected) {
      return isEdge ? 'none' : '2px solid #1976d2';
    }
    return '1px solid #d0d7de';
  };

  const getTextColor = () => {
    const cellColor = getStyleProperty(cell.style, 'color', 'color', '#000000');
    if (cellColor && cellColor !== '#000000') {
      return cellColor;
    }
    if (isSelected) {
      return '#1976d2'; // Blue text for selected cells
    }
    return '#24292f'; // Dark text for normal cells
  };

  // Determine background color based on state - prioritize cell-specific background
  const getFinalBackgroundColor = () => {
    const cellBgColor = getStyleProperty(cell.style, 'backgroundColor', 'background_color', '#ffffff');
    // Use cell-specific background color first, then fallback to selection state
    if (cellBgColor && cellBgColor !== '#ffffff') {
      return cellBgColor;
    }
    if (isSelected) {
      return '#e3f2fd'; // Light blue for selected cells
    }
    if (isEditing) {
      return '#ffffff'; // White for editing
    }
    if (isHeader) {
      return '#f6f8fa'; // Light gray for headers
    }
    return '#ffffff'; // White for normal cells
  };

  return {
    ...baseCellStyle,
    backgroundColor: getFinalBackgroundColor(),
    color: getTextColor(),
    minWidth: Math.max(tableData?.column_widths[col] || 64, 30), // Minimum 30px width
    width: tableData?.column_widths[col] || 64,
    height: Math.max(tableData?.rows[row]?.height || 20, 15), // Minimum 15px height
    borderTop: getBorderStyle(isFirstRow, isSelected),
    borderLeft: getBorderStyle(isFirstCol, isSelected),
    borderRight: getBorderStyle(isLastCol, isSelected),
    borderBottom: getBorderStyle(isLastRow, isSelected),
    position: 'relative',
    zIndex: isSelected ? 10 : 1,
  };
};

/**
 * Create a memoized cell style function
 */
export const createCellStyleFunction = (
  selectedCells: { row: number; col: number }[],
  editingCell: { row: number; col: number } | null,
  isLocked: boolean,
  tableData: TableData | null,
  hoveredRowIndex: number | null,
  hoveredColIndex: number | null
) => {
  return (cell: TableCell, row: number, col: number): React.CSSProperties => {
    const isSelected = selectedCells.some(c => c.row === row && c.col === col);
    const isEditing = editingCell?.row === row && editingCell?.col === col;
    const isHeader = row === 0;
    const isRowHovered = hoveredRowIndex === row + 1;
    const isColHovered = hoveredColIndex === col + 1;

    return getCellStyles({
      cell,
      row,
      col,
      isSelected,
      isEditing,
      isHeader,
      isRowHovered,
      isColHovered,
      isLocked,
      tableData: tableData!,
    });
  };
};
