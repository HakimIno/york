import { getWasmInstance } from '@/features/wasm-html-builder/module/wasm-interface';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface SelectedCell {
  row: number;
  col: number;
}

export interface TableCellStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: string;
}

interface TableStore {
  selectedCells: SelectedCell[];
  
  selectMultipleCells: (cells: SelectedCell[]) => void;
  selectRangeCells: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  addToSelection: (row: number, col: number) => void;
  removeFromSelection: (row: number, col: number) => void;
  clearSelection: () => void;
  
  updateCellStyle: (elementId: string, row: number, col: number, style: Partial<TableCellStyle>) => Promise<boolean>;
  updateMultipleCellsStyle: (elementId: string, cells: SelectedCell[], style: Partial<TableCellStyle>) => Promise<void>;
  updateSelectedCellsStyle: (elementId: string, style: Partial<TableCellStyle>) => Promise<void>;
  getCellStyle: (elementId: string, row: number, col: number) => Promise<TableCellStyle | null>;
  
  isCellSelected: (row: number, col: number) => boolean;
  getSelectedCellsCount: () => number;
  getSelectedCell: () => SelectedCell | null; 
}

export const useTableStore = create<TableStore>()(
  devtools(
    (set, get) => ({
      selectedCells: [],

      selectMultipleCells: (cells: SelectedCell[]) => {
        set({
          selectedCells: cells,
        });
      },

      selectRangeCells: (startRow: number, startCol: number, endRow: number, endCol: number) => {
        const rangeCells: SelectedCell[] = [];
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            rangeCells.push({ row: r, col: c });
          }
        }
        set({
          selectedCells: rangeCells,
        });
      },

      addToSelection: (row: number, col: number) => {
        const { selectedCells } = get();
        const newCell = { row, col };
        
        const isAlreadySelected = selectedCells.some(
          cell => cell.row === row && cell.col === col
        );
        
        if (!isAlreadySelected) {
          const newSelectedCells = [...selectedCells, newCell];
          set({
            selectedCells: newSelectedCells,
          });
        }
      },

      removeFromSelection: (row: number, col: number) => {
        const { selectedCells } = get();
        const newSelectedCells = selectedCells.filter(
          cell => !(cell.row === row && cell.col === col)
        );
        
        set({
          selectedCells: newSelectedCells,
        });
      },

      clearSelection: () => {
        set({
          selectedCells: [],
        });
      },

      updateCellStyle: async (elementId: string, row: number, col: number, style: Partial<TableCellStyle>) => {
        try {
          const wasm = await getWasmInstance();
          const success = wasm.updateTableCellStyle(elementId, row, col, style);
          return success;
        } catch (error) {
          console.error('Error updating cell style:', error);
          return false;
        }
      },

      updateMultipleCellsStyle: async (elementId: string, cells: SelectedCell[], style: Partial<TableCellStyle>) => {
        const promises = cells.map(cell => 
          get().updateCellStyle(elementId, cell.row, cell.col, style)
        );
        await Promise.all(promises);
      },

      updateSelectedCellsStyle: async (elementId: string, style: Partial<TableCellStyle>) => {
        const { selectedCells } = get();
        if (selectedCells.length > 0) {
          await get().updateMultipleCellsStyle(elementId, selectedCells, style);
        }
      },

      getCellStyle: async (elementId: string, row: number, col: number) => {
        try {
          const wasm = await getWasmInstance();
          const style = wasm.getTableCellStyle(elementId, row, col);
          return style;
        } catch (error) {
          console.error('Error getting cell style:', error);
          return null;
        }
      },

      isCellSelected: (row: number, col: number) => {
        const { selectedCells } = get();
        return selectedCells.some(cell => cell.row === row && cell.col === col);
      },

      getSelectedCellsCount: () => {
        return get().selectedCells.length;
      },

      getSelectedCell: () => {
        const { selectedCells } = get();
        return selectedCells.length > 0 ? selectedCells[0] : null;
      },
    }),
    {
      name: 'table-store', 
    }
  )
);
