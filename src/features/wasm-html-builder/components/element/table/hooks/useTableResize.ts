import { useCallback, useState } from 'react';
import { TableData } from '../../../../module/wasm-interface';
import { getColumnPosition, getRowPosition } from '../utils';

interface UseTableResizeProps {
  tableData: TableData | null;
  tableRef: React.RefObject<HTMLTableElement | null>;
  element: { id: string; width: number; height: number };
  onSizeChange: (elementId: string, width: number, height: number) => void;
  onUpdateColumnWidth: (elementId: string, columnIndex: number, width: number) => void;
  onUpdateRowHeight: (elementId: string, rowIndex: number, height: number) => void;
}

export const useTableResize = ({
  tableData,
  tableRef,
  element,
  onSizeChange,
  onUpdateColumnWidth,
  onUpdateRowHeight,
}: UseTableResizeProps) => {
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [hoveredColIndex, setHoveredColIndex] = useState<number | null>(null);
  

  const handleRowResize = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!tableData || rowIndex >= tableData.rows.length) return;

      const startY = e.clientY;
      const initialHeight = tableData.rows[rowIndex]?.height || 20;
      const minHeight = 20;
      

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const newHeight = Math.max(initialHeight + deltaY, minHeight);
        

        if (tableData && tableData.rows[rowIndex]) {
          tableData.rows[rowIndex].height = newHeight;

          const totalHeight = tableData.rows.reduce((sum, row) => sum + Math.max(row.height, minHeight), 0) + 32;

          if (Math.abs(totalHeight - element.height) > 1) {
            onSizeChange(element.id, element.width, totalHeight);
          }
        }
      };

      const handleMouseUp = () => {
        if (tableData && tableData.rows[rowIndex]) {
          onUpdateRowHeight(element.id, rowIndex, tableData.rows[rowIndex].height);
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [tableData, element, onSizeChange, onUpdateRowHeight, tableRef]
  );

  const handleColumnResize = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!tableData || colIndex >= tableData.column_widths.length) return;

      const startX = e.clientX;
      const initialWidth = tableData.column_widths[colIndex] || 64;
      const minWidth = 64;
      

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newWidth = Math.max(initialWidth + deltaX, minWidth);
        

        if (tableData && tableData.column_widths[colIndex] !== undefined) {
          tableData.column_widths[colIndex] = newWidth;

          const totalWidth = tableData.column_widths.reduce((sum, w) => sum + Math.max(w, minWidth), 0) + 32;

          if (Math.abs(totalWidth - element.width) > 1) {
            onSizeChange(element.id, totalWidth, element.height);
          }
        }
      };

      const handleMouseUp = () => {
        if (tableData && tableData.column_widths[colIndex] !== undefined) {
          onUpdateColumnWidth(element.id, colIndex, tableData.column_widths[colIndex]);
        }
        
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [tableData, element, onSizeChange, onUpdateColumnWidth, tableRef]
  );

  const getColumnPositionCallback = useCallback(
    (colIndex: number) => getColumnPosition(colIndex, tableRef, tableData),
    [tableRef, tableData]
  );

  const getRowPositionCallback = useCallback(
    (rowIndex: number) => getRowPosition(rowIndex, tableRef, tableData),
    [tableRef, tableData]
  );

  return {
    hoveredRowIndex,
    hoveredColIndex,
    setHoveredRowIndex,
    setHoveredColIndex,
    handleRowResize,
    handleColumnResize,
    getColumnPosition: getColumnPositionCallback,
    getRowPosition: getRowPositionCallback,
  };
};
