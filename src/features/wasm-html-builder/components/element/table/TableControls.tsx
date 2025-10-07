import React from 'react';
import { Icon } from '@iconify/react';
import { TableControlsProps } from './types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TableControls: React.FC<TableControlsProps> = ({
  tableData,
  element,
  rowPositions,
  colPositions,
  onRemoveRow,
  onRemoveColumn,
}) => {
  return (
    <>
      {/* Row controls with dynamic positioning */}
      {rowPositions.map((rowTop, rowIndex) => {
        const currentRowHeight = Math.max(tableData.rows[rowIndex]?.height || 32, 32);
        const isDisabled = tableData.rows.length <= 1;

        return (
          <div
            key={`row-control-${rowIndex}`}
            className="absolute flex items-center"
            style={{
              left: element.x - 28,
              top: element.y + rowTop + (currentRowHeight / 2) - 12,
              zIndex: element.z_index + 1002,
            }}
          >
            <Button
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onRemoveRow(rowIndex);
              }}
              disabled={isDisabled}
              className={cn(
                "h-4 w-4 p-0 rounded bg-destructive/80 shadow-none",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              title="ลบแถว"
            >
              <Icon icon="lucide:minus" className="h-3 w-3" />
            </Button>
          </div>
        );
      })}

      {/* Column controls with dynamic positioning */}
      {colPositions.map((colLeft, colIndex) => {
        const currentColumnWidth = Math.max(tableData.column_widths[colIndex] || 80, 80);
        const isDisabled = tableData.column_widths.length <= 1;

        return (
          <div
            key={`col-control-${colIndex}`}
            className="absolute flex flex-col items-center"
            style={{
              left: element.x + colLeft + (currentColumnWidth / 2) - 12,
              top: element.y - 32,
              zIndex: element.z_index + 1002,
            }}
          >
            <Button
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onRemoveColumn(colIndex);
              }}
              disabled={isDisabled}
              className={cn(
                "h-4 w-4 p-0 rounded bg-destructive/80 shadow-none",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              title="ลบคอลัมน์"
            >
              <Icon icon="lucide:minus" className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </>
  );
};

export default TableControls;
