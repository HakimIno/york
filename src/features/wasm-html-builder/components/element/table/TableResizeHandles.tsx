import React from 'react';
import { Element, TableData } from '../../../module/wasm-interface';

interface TableResizeHandlesProps {
  tableData: TableData | null;
  element: Element;
  isSelected: boolean;
  isEditing: boolean;
  isLocked: boolean;
  hoveredRowIndex: number | null;
  hoveredColIndex: number | null;
  onRowResize: (rowIndex: number, e: React.MouseEvent) => void;
  onColumnResize: (colIndex: number, e: React.MouseEvent) => void;
  onRowHover: (rowIndex: number | null) => void;
  onColumnHover: (colIndex: number | null) => void;
  getRowPosition: (rowIndex: number) => number;
  getColumnPosition: (colIndex: number) => number;
}

const TableResizeHandles: React.FC<TableResizeHandlesProps> = ({
  tableData,
  element,
  isSelected,
  isEditing,
  isLocked,
  hoveredRowIndex,
  hoveredColIndex,
  onRowResize,
  onColumnResize,
  onRowHover,
  onColumnHover,
  getRowPosition,
  getColumnPosition,
}) => {
  if (!isSelected || isEditing || isLocked || !tableData) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: element.zIndex + 1005 }}>

      {/* Row hover lines - only show when hovering */}
      {tableData.rows.map((row, rowIndex) => {
        const rowTop = getRowPosition(rowIndex);
        const isHovered = hoveredRowIndex === rowIndex;

        
        return (
          <div
            key={`row-hover-${rowIndex}`}
            className={`absolute w-full cursor-row-resize pointer-events-auto transition-all duration-150 ${
              isHovered ? 'bg-blue-500 opacity-80' : 'bg-transparent'
            }`}
            style={{
              top: `${rowTop}px`,
              left: '0px',
              width: '100%',
              height: '1px',
              zIndex: element.zIndex + 1005,
            }}
            onMouseEnter={() => onRowHover(rowIndex)}
            onMouseLeave={() => onRowHover(null)}
            onMouseDown={e => onRowResize(rowIndex, e)}
          />
        );
      })}

      {/* Column hover lines - only show when hovering */}
      {tableData.columnWidths.map((colWidth, colIndex) => {
        const colLeft = getColumnPosition(colIndex);
        const isHovered = hoveredColIndex === colIndex;

        
        return (
          <div
            key={`col-hover-${colIndex}`}
            className={`absolute h-full cursor-col-resize pointer-events-auto ${
              isHovered ? 'bg-blue-500 opacity-80' : 'bg-transparent'
            }`}
            style={{
              left: `${colLeft}px`,
              top: '0px',
              height: '100%',
              width: '1px',
              zIndex: element.zIndex + 1005,
            }}
            onMouseEnter={() => onColumnHover(colIndex)}
            onMouseLeave={() => onColumnHover(null)}
            onMouseDown={e => onColumnResize(colIndex, e)}
          />
        );
      })}
    </div>
  );
};

export default TableResizeHandles;
