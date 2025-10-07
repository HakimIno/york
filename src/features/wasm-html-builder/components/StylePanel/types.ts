import { Element, ElementStyle } from '../../module/wasm-interface';

export interface StylePanelProps {
  element: Element | null;
  onStyleChange: (elementId: string, style: Partial<ElementStyle>) => void;
  onContentChange: (elementId: string, content: string) => void;
  onClose: () => void;
  styleTemplate?: Partial<ElementStyle> | null;
  // Table-specific props
  onTableCellChange?: (elementId: string, row: number, col: number, content: string) => void;
  onAddRow?: (elementId: string, atIndex?: number) => void;
  onRemoveRow?: (elementId: string, index: number) => void;
  onAddColumn?: (elementId: string, atIndex?: number) => void;
  onRemoveColumn?: (elementId: string, index: number) => void;
  onMergeCells?: (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => void;
  onUpdateColumnWidth?: (elementId: string, columnIndex: number, width: number) => void;
  onUpdateRowHeight?: (elementId: string, rowIndex: number, height: number) => void;
  // Cell selection props moved to Zustand store
}

export interface TabProps {
  element: Element;
  localStyle: ElementStyle;
  safeStyle: ElementStyle;
  onStyleUpdate: (updates: Partial<ElementStyle>) => void;
}

export interface FormFieldTabProps extends TabProps {
  formFieldData: any;
  onContentUpdate: (updates: any) => void;
}

export interface TableTabProps extends TabProps {
  onTableCellChange?: (elementId: string, row: number, col: number, content: string) => void;
  onAddRow?: (elementId: string, atIndex?: number) => void;
  onRemoveRow?: (elementId: string, index: number) => void;
  onAddColumn?: (elementId: string, atIndex?: number) => void;
  onRemoveColumn?: (elementId: string, index: number) => void;
  onMergeCells?: (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => void;
  onUpdateColumnWidth?: (elementId: string, columnIndex: number, width: number) => void;
  onUpdateRowHeight?: (elementId: string, rowIndex: number, height: number) => void;
  onUpdateTableCellStyle?: (elementId: string, row: number, col: number, style: any) => void;
  onGetTableCellStyle?: (elementId: string, row: number, col: number) => any;
  // Cell selection props moved to Zustand store
}

export interface QuickPresetsProps {
  onStyleUpdate: (updates: Partial<ElementStyle>) => void;
}
