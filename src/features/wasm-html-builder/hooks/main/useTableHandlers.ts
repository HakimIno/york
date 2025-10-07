import { useCallback } from 'react';
import { useWasmBuilderState } from './useWasmBuilderState';

interface UseTableHandlersProps {
  wasmEngine: any;
  state: ReturnType<typeof useWasmBuilderState>;
  undoRedo: any;
}

export const useTableHandlers = ({
  wasmEngine,
  state,
  undoRedo,
}: UseTableHandlersProps) => {
  const handleTableCellChange = useCallback(
    (elementId: string, row: number, col: number, content: string) => {
      try {
        const success = wasmEngine.updateTableCell(elementId, row, col, content);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
        }
      } catch (error) {
        console.error('Error updating table cell:', error);
        state.setError('Error updating table cell');
      }
    },
    [wasmEngine, state.setElements, state.setError]
  );

  const handleAddRow = useCallback(
    (elementId: string, atIndex?: number) => {
      try {
        const success = wasmEngine.addTableRow(elementId, atIndex);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
          undoRedo.saveState(allElements, 'add_table_row', `Added row to table`);
        }
      } catch (error) {
        console.error('Error adding table row:', error);
        state.setError('Error adding table row');
      }
    },
    [wasmEngine, state.setElements, state.setError, undoRedo]
  );

  const handleRemoveRow = useCallback(
    (elementId: string, index: number) => {
      try {
        const success = wasmEngine.removeTableRow(elementId, index);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
          undoRedo.saveState(allElements, 'remove_table_row', `Removed row from table`);
        }
      } catch (error) {
        console.error('Error removing table row:', error);
        state.setError('Error removing table row');
      }
    },
    [wasmEngine, state.setElements, state.setError, undoRedo]
  );

  const handleAddColumn = useCallback(
    (elementId: string, atIndex?: number) => {
      try {
        const success = wasmEngine.addTableColumn(elementId, atIndex);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
          undoRedo.saveState(allElements, 'add_table_column', `Added column to table`);
        }
      } catch (error) {
        console.error('Error adding table column:', error);
        state.setError('Error adding table column');
      }
    },
    [wasmEngine, state.setElements, state.setError, undoRedo]
  );

  const handleRemoveColumn = useCallback(
    (elementId: string, index: number) => {
      try {
        const success = wasmEngine.removeTableColumn(elementId, index);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
          undoRedo.saveState(allElements, 'remove_table_column', `Removed column from table`);
        }
      } catch (error) {
        console.error('Error removing table column:', error);
        state.setError('Error removing table column');
      }
    },
    [wasmEngine, state.setElements, state.setError, undoRedo]
  );

  const handleMergeCells = useCallback(
    (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => {
      try {
        const success = wasmEngine.mergeTableCells(elementId, startRow, startCol, endRow, endCol);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
          undoRedo.saveState(allElements, 'merge_table_cells', `Merged table cells`);
        }
      } catch (error) {
        console.error('Error merging table cells:', error);
        state.setError('Error merging table cells');
      }
    },
    [wasmEngine, state.setElements, state.setError, undoRedo]
  );

  const handleUpdateColumnWidth = useCallback(
    (elementId: string, columnIndex: number, width: number) => {
      try {
        const success = wasmEngine.updateTableColumnWidth(elementId, columnIndex, width);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
        }
      } catch (error) {
        console.error('Error updating column width:', error);
        state.setError('Error updating column width');
      }
    },
    [wasmEngine, state.setElements, state.setError]
  );

  const handleUpdateRowHeight = useCallback(
    (elementId: string, rowIndex: number, height: number) => {
      try {
        const success = wasmEngine.updateTableRowHeight(elementId, rowIndex, height);
        if (success) {
          const allElements = wasmEngine.getAllElements();
          state.setElements(allElements);
        }
      } catch (error) {
        console.error('Error updating row height:', error);
        state.setError('Error updating row height');
      }
    },
    [wasmEngine, state.setElements, state.setError]
  );

  return {
    handleTableCellChange,
    handleAddRow,
    handleRemoveRow,
    handleAddColumn,
    handleRemoveColumn,
    handleMergeCells,
    handleUpdateColumnWidth,
    handleUpdateRowHeight,
  };
};
