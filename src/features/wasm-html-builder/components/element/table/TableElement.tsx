'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useResizable } from '../../../hooks/resizable';
import { useTableEditing, useTableResize } from './hooks';
import { calculateTableDimensions, calculateTablePositions, createDebouncedResize } from './utils';
import { getElementStyles, getTableStyles, createCellStyleFunction } from './styles';
import { TableElementProps } from './types';
import TableCell from './TableCell';
import TableControls from './TableControls';
import TableActionButtons from './TableActionButtons';
import TableResizeHandles from './TableResizeHandles';

const TableElement: React.FC<TableElementProps> = ({
  element,
  isSelected,
  isEditing,
  isDragging = false,
  isLocked = false,
  showBorders = true,
  onPositionChange,
  onSizeChange,
  onContentChange,
  onStyleChange,
  onSelect,
  onStartEdit,
  onEndEdit,
  onDelete,
  onStartDrag,
  onToggleLock,
  onCopy,
  onTableCellChange,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onMergeCells,
  onUpdateColumnWidth,
  onUpdateRowHeight,
  onAutoFitColumns,
  // Cell selection props moved to Zustand store
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const tableData = element.table_data || null;

  // Performance optimizations
  const positionCacheRef = useRef<Map<string, { rowTop: number; colLeft: number }>>(new Map());
  const lastTableDataRef = useRef<string>('');
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use table editing hook
  const {
    editingCell,
    editingContent,
    selectedCells,
    isSelecting,
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
  } = useTableEditing({
    tableData,
    isLocked,
    onTableCellChange,
    onMergeCells,
    elementId: element.id,
    onDeselectElement: () => {
      // Deselect the table element when clicking outside
      onSelect('');
      // Also exit edit mode when clicking outside table
      onEndEdit();
    },
  });

  // Use table resize hook
  const {
    hoveredRowIndex,
    hoveredColIndex,
    setHoveredRowIndex,
    setHoveredColIndex,
    handleRowResize,
    handleColumnResize,
    getColumnPosition,
    getRowPosition,
  } = useTableResize({
    tableData,
    tableRef,
    element,
    onSizeChange,
    onUpdateColumnWidth,
    onUpdateRowHeight,
  });

  // Performance: Optimized position calculations with better caching
  const { rowPositions, colPositions } = useMemo(() => {
    return calculateTablePositions(tableData, positionCacheRef, lastTableDataRef);
  }, [tableData?.rows, tableData?.column_widths]);

  // Performance: Memoized table dimensions calculation
  const calculateTableDimensionsCallback = useMemo(() => {
    return () => calculateTableDimensions(tableData, element);
  }, [tableData?.column_widths, tableData?.rows, element.width, element.height]);

  // Performance: Optimized debounced resize function
  const debouncedResize = useMemo(() => {
    return createDebouncedResize(
      resizeTimeoutRef,
      calculateTableDimensionsCallback,
      element,
      onSizeChange
    );
  }, [element.id, element.width, element.height, calculateTableDimensionsCallback, onSizeChange]);

  // Use the resizable hook for table
  const {
    isResizing: isTableResizing,
    resizeDirection,
    handleResizeStart,
    RESIZE_HANDLES,
    HANDLE_SIZE,
  } = useResizable({
    elementId: element.id,
    elementWidth: element.width,
    elementHeight: element.height,
    elementX: element.x,
    elementY: element.y,
    onSizeChange: (elementId, width, height) => {
      // Update table size and redistribute column widths
      onSizeChange(elementId, width, height);

      // Update column widths proportionally
      if (tableData && width > 0) {
        const totalCurrentWidth = tableData.column_widths.reduce((sum, w) => sum + w, 0);
        const availableWidth = width - 32; // Subtract padding
        const scaleFactor = availableWidth / totalCurrentWidth;

        tableData.column_widths = tableData.column_widths.map(w =>
          Math.max(w * scaleFactor, 80) // Minimum 80px width
        );
      }
    },
    onPositionChange,
  });

  // Handle row operations with optimized auto-resize
  const handleAddRow = useCallback(
    (atIndex?: number) => {
      onAddRow(element.id, atIndex);
      debouncedResize();
    },
    [element.id, onAddRow, debouncedResize]
  );

  const handleRemoveRow = useCallback(
    (index: number) => {
      onRemoveRow(element.id, index);
      debouncedResize();
    },
    [element.id, onRemoveRow, debouncedResize]
  );

  const handleAddColumn = useCallback(
    (atIndex?: number) => {
      onAddColumn(element.id, atIndex);
      debouncedResize();
    },
    [element.id, onAddColumn, debouncedResize]
  );

  const handleRemoveColumn = useCallback(
    (index: number) => {
      onRemoveColumn(element.id, index);
      debouncedResize();
    },
    [element.id, onRemoveColumn, debouncedResize]
  );

  // Merge functions
  const handleMergeAllCells = useCallback(() => {
    handleMergeCells();
  }, [handleMergeCells]);

  const handleMergeRow = useCallback(() => {
    if (selectedCells.length < 2 || !onMergeCells) return;
    
    const bounds = getSelectionBounds();
    if (!bounds) return;
    
    // Merge all cells in the same row
    onMergeCells(element.id, bounds.startRow, bounds.startCol, bounds.startRow, bounds.endCol);
    clearSelection();
  }, [selectedCells, onMergeCells, element.id, getSelectionBounds, clearSelection]);

  const handleMergeColumn = useCallback(() => {
    if (selectedCells.length < 2 || !onMergeCells) return;
    
    const bounds = getSelectionBounds();
    if (!bounds) return;
    
    // Merge all cells in the same column
    onMergeCells(element.id, bounds.startRow, bounds.startCol, bounds.endRow, bounds.startCol);
    clearSelection();
  }, [selectedCells, onMergeCells, element.id, getSelectionBounds, clearSelection]);

  // Element styles
  const elementStyles = useMemo(() => {
    return getElementStyles(element, isSelected, isEditing, isDragging, isLocked, showBorders);
  }, [element, isEditing, isDragging, isSelected, isLocked, showBorders]);

  // Table styles with Excel-like layout
  const tableStyles = useMemo(() => {
    return getTableStyles(tableData);
  }, [tableData, element.style]);

  // Performance: Memoized cell styles with better optimization
  const getCellStyles = useMemo(() => {
    return createCellStyleFunction(
      selectedCells,
      editingCell,
      isLocked,
      tableData,
      hoveredRowIndex,
      hoveredColIndex
    );
  }, [selectedCells, editingCell, isLocked, tableData, hoveredRowIndex, hoveredColIndex]);

  // Performance: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  if (!tableData) {
    return (
      <div
        style={elementStyles}
        onClick={() => onSelect(element.id)}
        onMouseDown={!isEditing && !isLocked ? e => onStartDrag(e, element.id) : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <Icon icon="lucide:table" className="w-6 h-6 mr-2" />
          <span className="text-sm font-medium">Table</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Control buttons */}
      {isSelected && !isEditing && (
        <TableActionButtons
          element={element}
          isLocked={isLocked}
          selectedCellsCount={selectedCells.length}
          onDelete={onDelete}
          onToggleLock={onToggleLock}
          onAddRow={handleAddRow}
          onAddColumn={handleAddColumn}
          onAutoFitColumns={onAutoFitColumns ? () => onAutoFitColumns(element.id) : undefined}
          onMergeCells={selectedCells.length > 1 ? handleMergeAllCells : undefined}
          onMergeRow={selectedCells.length > 1 ? handleMergeRow : undefined}
          onMergeColumn={selectedCells.length > 1 ? handleMergeColumn : undefined}
        />
      )}

      {/* Main table element with scroll container */}
      <div
        style={{
          ...elementStyles,
          cursor: isSelecting ? 'crosshair' : elementStyles.cursor,
          userSelect: isSelecting ? 'none' : elementStyles.userSelect,
        }}
        data-element-id={element.id}
        onClick={handleContainerClick}
        onMouseDown={!isEditing && !isLocked ? e => onStartDrag(e, element.id) : undefined}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: 'hsl(var(--background))',
            border: 'none',
            position: 'relative',
          }}
          onClick={(e) => {
            // Click on empty space within table container
            if (e.target === e.currentTarget) {
              clearSelection();
            }
          }}
        >
          <table ref={tableRef} style={tableStyles}>
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ height: Math.max(row.height, 32) }}>
                  {row.cells.map((cell, colIndex) => {
                    // Skip merged cells that are marked as merged (rowspan=0 and colspan=0)
                    if (cell.rowspan === 0 && cell.colspan === 0) {
                      return null;
                    }

                    return (
                      <TableCell
                        key={`${rowIndex}-${colIndex}`}
                        cell={cell}
                        row={rowIndex}
                        col={colIndex}
                        isSelected={selectedCells.some(c => c.row === rowIndex && c.col === colIndex)}
                        isEditing={editingCell?.row === rowIndex && editingCell?.col === colIndex}
                        editingContent={editingContent}
                        onCellClick={(row, col, e) => {
                          // Select the table element when clicking on a cell
                          onSelect(element.id);
                          
                          handleCellClick(row, col, e);
                        }}
                        onCellDoubleClick={(row, col) => {
                          handleCellDoubleClick(row, col);
                        }}
                        onContentChange={handleCellContentChange}
                        onContentSave={handleCellContentSave}
                        onContentCancel={handleCellContentCancel}
                        onKeyDown={handleCellKeyDown}
                        onMouseDown={handleMouseDown}
                        onMouseEnter={handleMouseEnter}
                        getCellStyles={getCellStyles}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Resize handles */}
          <TableResizeHandles
            tableData={tableData}
            element={element}
            isSelected={isSelected}
            isEditing={isEditing}
            isLocked={isLocked}
            hoveredRowIndex={hoveredRowIndex}
            hoveredColIndex={hoveredColIndex}
            onRowResize={handleRowResize}
            onColumnResize={handleColumnResize}
            onRowHover={setHoveredRowIndex}
            onColumnHover={setHoveredColIndex}
            getRowPosition={getRowPosition}
            getColumnPosition={getColumnPosition}
          />
        </div>
      </div>

      {/* Resize handles for table */}
      {isSelected && !isEditing && !isLocked && (
        <>
          {RESIZE_HANDLES.map(({ direction, cursor, getPosition }) => {
            const position = getPosition(
              element.x,
              element.y,
              element.width,
              element.height
            );

            return (
              <div
                key={`table-resize-${direction}`}
                className={`absolute border border-border rounded shadow-sm ${
                  isTableResizing && resizeDirection === direction
                    ? 'bg-primary'
                    : 'bg-blue-600 hover:bg-blue-600/80'
                }`}
                style={{
                  left: position.x,
                  top: position.y,
                  width: HANDLE_SIZE ,
                  height: HANDLE_SIZE ,
                  cursor: cursor,
                  zIndex: element.z_index + 1003,
                  transition: 'background-color 0.15s ease-in-out',
                  pointerEvents: 'auto',
                }}
                onMouseDown={e => handleResizeStart(e, direction)}
              />
            );
          })}
        </>
      )}

      {/* Performance: Row/Column controls with simplified positioning */}
      {isSelected && !isEditing && tableData && (
        <TableControls
          tableData={tableData}
          element={element}
          rowPositions={rowPositions}
          colPositions={colPositions}
          onRemoveRow={handleRemoveRow}
          onRemoveColumn={handleRemoveColumn}
        />
      )}
    </>
  );
};

export default TableElement;
