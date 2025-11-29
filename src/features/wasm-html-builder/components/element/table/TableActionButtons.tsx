import React, { useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Element } from '../../../module/wasm-interface';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TableActionButtonsProps {
  element: Element;
  isLocked: boolean;
  selectedCellsCount: number;
  onDelete: (elementId: string) => void;
  onToggleLock: (elementId: string) => void;
  onAddRow: () => void;
  onAddColumn: () => void;
  onAutoFitColumns?: () => void;
  onMergeCells?: () => void;
  onMergeRow?: () => void;
  onMergeColumn?: () => void;
}

const TableActionButtons: React.FC<TableActionButtonsProps> = ({
  element,
  isLocked,
  selectedCellsCount,
  onDelete,
  onToggleLock,
  onAddRow,
  onAddColumn,
  onAutoFitColumns,
  onMergeCells,
  onMergeRow,
  onMergeColumn,
}) => {
  // Prevent event bubbling to avoid conflicts with table selection
  const handleButtonClick = useCallback((e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    action();
  }, []);

  return (
    <div
      className="absolute flex flex-col gap-1 p-1 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg"
      style={{
        left: element.x + element.width + 8,
        top: element.y,
        zIndex: element.zIndex + 1001,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      {/* Delete button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={(e: React.MouseEvent) => handleButtonClick(e, () => onDelete(element.id))}
        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        title="ลบตาราง"
      >
        <Icon icon="lucide:x" className="h-3.5 w-3.5" />
      </Button>

      {/* Lock/Unlock button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={(e: React.MouseEvent) => handleButtonClick(e, () => onToggleLock(element.id))}
        className={cn(
          "h-7 w-7 p-0",
          isLocked
            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        title={isLocked ? 'ปลดล็อค' : 'ล็อค'}
      >
        <Icon
          icon={isLocked ? "lucide:lock" : "lucide:unlock"}
          className="h-3.5 w-3.5"
        />
      </Button>

      {/* Add row button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={(e: React.MouseEvent) => handleButtonClick(e, onAddRow)}
        className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 hover:dark:bg-green-950"
        title="เพิ่มแถว"
      >
        <Icon icon="majesticons:add-row" className="h-3.5 w-3.5" />
      </Button>

      {/* Add column button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={(e: React.MouseEvent) => handleButtonClick(e, onAddColumn)}
        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:dark:bg-blue-950"
        title="เพิ่มคอลัมน์"
      >
        <Icon icon="majesticons:add-column" className="h-3.5 w-3.5" />
      </Button>

      {/* Auto-fit columns button */}
      {onAutoFitColumns && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e: React.MouseEvent) => handleButtonClick(e, onAutoFitColumns)}
          className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:dark:bg-purple-950"
          title="Auto-fit คอลัมน์"
        >
          <Icon icon="hugeicons:maximize-02" className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Merge cells buttons - only show when multiple cells are selected */}
      {selectedCellsCount > 1 && (
        <>
          {/* Merge all selected cells */}
          {onMergeCells && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e: React.MouseEvent) => handleButtonClick(e, onMergeCells)}
              className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 hover:dark:bg-orange-950"
              title={`Merge ${selectedCellsCount} cells`}
            >
              <Icon icon="mdi:table-merge-cells" className="w-4 h-4" />
            </Button>
          )}

          {/* Merge row */}
          {onMergeRow && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e: React.MouseEvent) => handleButtonClick(e, onMergeRow)}
              className="h-7 w-7 p-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50 hover:dark:bg-teal-950"
              title="Merge แถว"
            >
              <Icon icon="mdi:table-row" className="w-4 h-4" />
            </Button>
          )}

          {/* Merge column */}
          {onMergeColumn && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e: React.MouseEvent) => handleButtonClick(e, onMergeColumn)}
              className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 hover:dark:bg-indigo-950"
              title="Merge คอลัมน์"
            >
              <Icon icon="mdi:table-column" className="w-4 h-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default TableActionButtons;
