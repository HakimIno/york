import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { TableData } from '../../../../module/wasm-interface';
import { EditingCell, SelectedCell } from '../types';
import { useTableStore } from '@/stores/tableStore';
interface UseTableEditingProps {
  tableData: TableData | null;
  isLocked: boolean;
  onTableCellChange: (elementId: string, row: number, col: number, content: string) => void;
  onMergeCells?: (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => void;
  elementId: string;
  onDeselectElement?: () => void;
  onCellSelect?: (row: number, col: number) => void;
  onSelectedCellsChange?: (cells: SelectedCell[]) => void;
}

export const useTableEditing = ({
  tableData,
  isLocked,
  onTableCellChange,
  onMergeCells,
  elementId,
  onDeselectElement,
  onCellSelect,
  onSelectedCellsChange,
}: UseTableEditingProps) => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<SelectedCell | null>(null);
  
  // Throttling mechanism for performance
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSelectionRef = useRef<{row: number, col: number} | null>(null);
  
  // Auto-scroll mechanism
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollingRef = useRef(false);
  
  const { 
    selectedCells, 
    selectMultipleCells, 
    selectRangeCells,
    addToSelection, 
    clearSelection,
    removeFromSelection
  } = useTableStore();

  useEffect(() => {
    if (onSelectedCellsChange) {
      onSelectedCellsChange(selectedCells);
    }
  }, [selectedCells, onSelectedCellsChange]);

  // Auto-scroll function for better drag selection experience
  const handleAutoScroll = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !tableData) return;
    
    const container = e.currentTarget as HTMLElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scrollThreshold = 50;
    const scrollSpeed = 10;
    
    // Clear existing auto-scroll timeout
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    
    // Auto-scroll logic
    if (mouseX < scrollThreshold) {
      // Scroll left
      container.scrollLeft = Math.max(0, container.scrollLeft - scrollSpeed);
    } else if (mouseX > rect.width - scrollThreshold) {
      // Scroll right
      container.scrollLeft += scrollSpeed;
    }
    
    if (mouseY < scrollThreshold) {
      // Scroll up
      container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
    } else if (mouseY > rect.height - scrollThreshold) {
      // Scroll down
      container.scrollTop += scrollSpeed;
    }
    
    // Continue auto-scrolling if mouse is still in scroll zone
    if (mouseX < scrollThreshold || mouseX > rect.width - scrollThreshold ||
        mouseY < scrollThreshold || mouseY > rect.height - scrollThreshold) {
      autoScrollTimeoutRef.current = setTimeout(() => {
        if (isSelecting) {
          handleAutoScroll(e);
        }
      }, 16); // ~60fps
    }
  }, [isSelecting, tableData]);

  const handleCellClick = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLocked) return;

      if (editingCell) {
        onTableCellChange(elementId, editingCell.row, editingCell.col, editingContent);
      }

      const isMultiSelect = e.ctrlKey || e.metaKey;
      const isRangeSelect = e.shiftKey;
      const cellKey = `${row}-${col}`;
      const isAlreadySelected = selectedCells.some(c => `${c.row}-${c.col}` === cellKey);

      if (isMultiSelect) {
        if (isAlreadySelected) {
          removeFromSelection(row, col);
        } else {
          addToSelection(row, col);
        }
        setEditingCell(null);
        setEditingContent('');
      } else if (isRangeSelect && selectedCells.length > 0) {
        const lastSelected = selectedCells[selectedCells.length - 1];
        const startRow = Math.min(lastSelected.row, row);
        const endRow = Math.max(lastSelected.row, row);
        const startCol = Math.min(lastSelected.col, col);
        const endCol = Math.max(lastSelected.col, col);
        
        // Use the optimized selectRangeCells function
        selectRangeCells(startRow, startCol, endRow, endCol);
        setEditingCell(null);
        setEditingContent('');
      } else {
        // Simple click - select single cell
        clearSelection();
        addToSelection(row, col);
        setSelectionStart(null);
        setIsSelecting(false);
        
        if (onCellSelect) {
          onCellSelect(row, col);
        }
        
        setEditingCell(null);
        setEditingContent('');
      }
    },
    [isLocked, tableData, selectedCells, editingCell, editingContent, elementId, onTableCellChange, onCellSelect, addToSelection, removeFromSelection, selectRangeCells, clearSelection]
  );

  const handleCellContentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingContent(e.target.value);
    },
    []
  );

  const handleCellContentSave = useCallback(() => {
    if (editingCell) {
      onTableCellChange(elementId, editingCell.row, editingCell.col, editingContent);
      setEditingCell(null);
      setEditingContent('');
    }
  }, [editingCell, editingContent, elementId, onTableCellChange]);

  const handleCellContentCancel = useCallback(() => {
    setEditingCell(null);
    setEditingContent('');
  }, []);

  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      if (isLocked) return;
      
      addToSelection(row, col);
      setSelectionStart({ row, col });
      setIsSelecting(false);
      
      if (tableData && row < tableData.rows.length && col < tableData.rows[row].cells.length) {
        const cell = tableData.rows[row].cells[col];
        setEditingCell({ row, col });
        setEditingContent(cell.content);
      }
    },
    [isLocked, tableData, addToSelection]
  );

  

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCellContentSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (editingCell) {
          handleCellContentCancel();
        } else {
          clearSelection();
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (!editingCell && selectedCells.length > 0 && tableData) {
          e.preventDefault();
          
          const currentCell = selectedCells[selectedCells.length - 1];
          let newRow = currentCell.row;
          let newCol = currentCell.col;
          
          switch (e.key) {
            case 'ArrowUp':
              newRow = Math.max(0, currentCell.row - 1);
              break;
            case 'ArrowDown':
              newRow = Math.min(tableData.rows.length - 1, currentCell.row + 1);
              break;
            case 'ArrowLeft':
              newCol = Math.max(0, currentCell.col - 1);
              break;
            case 'ArrowRight':
              newCol = Math.min(tableData.column_widths.length - 1, currentCell.col + 1);
              break;
          }
          
          addToSelection(newRow, newCol);
          
          if (tableData.rows[newRow] && tableData.rows[newRow].cells[newCol]) {
            const cell = tableData.rows[newRow].cells[newCol];
            setEditingCell({ row: newRow, col: newCol });
            setEditingContent(cell.content);
          }
        }
      }
    },
    [handleCellContentSave, handleCellContentCancel, editingCell, clearSelection, selectedCells, tableData]
  );

  const handleMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (isLocked) return;
      
      if (e.button === 0) { 
        const isMultiSelect = e.ctrlKey || e.metaKey;
        
        if (isMultiSelect) {
          return;
        }
        
        if (editingCell) {
          onTableCellChange(elementId, editingCell.row, editingCell.col, editingContent);
          setEditingCell(null);
          setEditingContent('');
        }
        
        // Store the initial click position for potential drag selection
        setSelectionStart({ row, col });
        
        // Don't start drag selection immediately - wait for mouse movement
        // This allows for single clicks to work normally
      }
    },
    [isLocked, editingCell, editingContent, elementId, onTableCellChange]
  );

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      // Start drag selection if we have a selection start point and mouse is moving
      if (selectionStart && !isSelecting) {
        // Check if mouse has moved from the initial click position
        if (selectionStart.row !== row || selectionStart.col !== col) {
          setIsSelecting(true);
          // Clear existing selection and start new range selection
          clearSelection();
          addToSelection(selectionStart.row, selectionStart.col);
        }
      }
      
      if (isSelecting && selectionStart) {
        // Check if this is the same cell as last time to avoid unnecessary updates
        const lastSelection = lastSelectionRef.current;
        if (lastSelection && lastSelection.row === row && lastSelection.col === col) {
          return;
        }
        
        lastSelectionRef.current = { row, col };
        
        // Clear existing timeout
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current);
        }
        
        // Calculate selection range from start point to current cell
        const startRow = Math.min(selectionStart.row, row);
        const endRow = Math.max(selectionStart.row, row);
        const startCol = Math.min(selectionStart.col, col);
        const endCol = Math.max(selectionStart.col, col);
        
        // Use the optimized selectRangeCells function immediately for smooth drag
        selectRangeCells(startRow, startCol, endRow, endCol);
      }
    },
    [isSelecting, selectionStart, selectRangeCells, clearSelection, addToSelection]
  );

  const handleMouseUp = useCallback(() => {
    // Clear any pending throttled updates
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }
    
    // Clear auto-scroll timeout
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
    lastSelectionRef.current = null;
    isAutoScrollingRef.current = false;
  }, []);

  // Handle mouse move for drag selection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectionStart && !isSelecting) {
      // Check if mouse has moved significantly to start drag selection
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Start drag selection if mouse has moved more than 3 pixels
      if (Math.abs(mouseX - (e.target as HTMLElement).getBoundingClientRect().left) > 3 ||
          Math.abs(mouseY - (e.target as HTMLElement).getBoundingClientRect().top) > 3) {
        setIsSelecting(true);
        clearSelection();
        addToSelection(selectionStart.row, selectionStart.col);
      }
    }
    
    // Handle auto-scroll
    handleAutoScroll(e);
  }, [selectionStart, isSelecting, clearSelection, addToSelection, handleAutoScroll]);

  const handleClickOutside = useCallback((e: React.MouseEvent) => {
    // Only clear selection if clicking on the table container itself (not on cells)
    if (e.target === e.currentTarget) {
      clearSelection();
      onDeselectElement?.();
    }
  }, [clearSelection, onDeselectElement]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Check if clicking on table container (not cells or other elements)
    const target = e.target as HTMLElement;
    const isTableContainer = target.tagName === 'DIV' && 
      target.getAttribute('data-element-id') === elementId;
    
    if (isTableContainer) {
      clearSelection();
      onDeselectElement?.();
    }
  }, [clearSelection, onDeselectElement, elementId]);

  const handleMergeCells = useCallback(() => {
    if (selectedCells.length < 2 || !onMergeCells) return;
    
    const rows = selectedCells.map(c => c.row);
    const cols = selectedCells.map(c => c.col);
    
    const startRow = Math.min(...rows);
    const endRow = Math.max(...rows);
    const startCol = Math.min(...cols);
    const endCol = Math.max(...cols);
    
    onMergeCells(elementId, startRow, startCol, endRow, endCol);
    clearSelection();
  }, [selectedCells, onMergeCells, elementId]);


  const selectionBounds = useMemo(() => {
    if (selectedCells.length === 0) return null;
    
    const rows = selectedCells.map(c => c.row);
    const cols = selectedCells.map(c => c.col);
    
    return {
      startRow: Math.min(...rows),
      endRow: Math.max(...rows),
      startCol: Math.min(...cols),
      endCol: Math.max(...cols),
    };
  }, [selectedCells]);

  const getSelectionBounds = useCallback(() => {
    return selectionBounds;
  }, [selectionBounds]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Escape key to clear selection or cancel editing
      if (e.key === 'Escape') {
        if (editingCell) {
          // If editing, cancel editing first
          setEditingCell(null);
          setEditingContent('');
        } else if (selectedCells.length > 0) {
          // If not editing but has selection, clear selection
          clearSelection();
        }
      }
      
      // Ctrl/Cmd + A to select all cells (if table is focused)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && tableData) {
        e.preventDefault();
        const allCells: SelectedCell[] = [];
        for (let r = 0; r < tableData.rows.length; r++) {
          for (let c = 0; c < tableData.column_widths.length; c++) {
            allCells.push({ row: r, col: c });
          }
        }
        selectMultipleCells(allCells);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedCells.length, editingCell, clearSelection, tableData, selectMultipleCells]);

  // Cleanup effect for throttling and auto-scroll
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    editingCell,
    editingContent,
    selectedCells,
    isSelecting,
    selectionStart,
    handleCellClick,
    handleCellDoubleClick,
    handleCellContentChange,
    handleCellContentSave,
    handleCellContentCancel,
    handleCellKeyDown,
    handleMouseDown,
    handleMouseEnter,
    handleMouseMove,
    handleMouseUp,
    handleAutoScroll,
    handleClickOutside,
    handleContainerClick,
    handleMergeCells,
    clearSelection,
    getSelectionBounds,
  };
};
