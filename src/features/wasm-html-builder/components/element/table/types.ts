import { Element, TableData, TableCell } from '../../../module/wasm-interface';

export interface TableElementProps {
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
  onTableCellChange: (elementId: string, row: number, col: number, content: string) => void;
  onAddRow: (elementId: string, atIndex?: number) => void;
  onRemoveRow: (elementId: string, index: number) => void;
  onAddColumn: (elementId: string, atIndex?: number) => void;
  onRemoveColumn: (elementId: string, index: number) => void;
  onMergeCells: (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => void;
  onUpdateColumnWidth: (elementId: string, columnIndex: number, width: number) => void;
  onUpdateRowHeight: (elementId: string, rowIndex: number, height: number) => void;
  onAutoFitColumns?: (elementId: string) => void;
  // Cell selection handlers moved to Zustand store
}

export interface EditingCell {
  row: number;
  col: number;
}

export interface SelectedCell {
  row: number;
  col: number;
}

export interface TableDimensions {
  width: number;
  height: number;
}

export interface TablePositions {
  rowPositions: number[];
  colPositions: number[];
}

export interface CellStyleProps {
  cell: TableCell;
  row: number;
  col: number;
  isSelected: boolean;
  isEditing: boolean;
  isHeader: boolean;
  isRowHovered: boolean;
  isColHovered: boolean;
  isLocked: boolean;
  tableData: TableData;
  selectedCells?: SelectedCell[];
}

export interface TableControlsProps {
  tableData: TableData;
  element: Element;
  rowPositions: number[];
  colPositions: number[];
  onRemoveRow: (index: number) => void;
  onRemoveColumn: (index: number) => void;
}

export interface TableCellProps {
  cell: TableCell;
  row: number;
  col: number;
  isSelected: boolean;
  isEditing: boolean;
  editingContent: string;
  onCellClick: (row: number, col: number, e: React.MouseEvent) => void;
  onCellDoubleClick?: (row: number, col: number) => void;
  onContentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentSave: () => void;
  onContentCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onMouseDown?: (row: number, col: number, e: React.MouseEvent) => void;
  onMouseEnter?: (row: number, col: number) => void;
  getCellStyles: (cell: TableCell, row: number, col: number) => React.CSSProperties;
}
