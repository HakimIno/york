import { Element, TableData } from '../../../module/wasm-interface';
import { TableDimensions, TablePositions } from './types';

/**
 * Calculate table dimensions based on content
 */
export const calculateTableDimensions = (
  tableData: TableData | null,
  element: Element
): TableDimensions => {
  if (!tableData) {
    return { width: element.width, height: element.height };
  }

  const minRowHeight = 20;
  const minColumnWidth = 64;
  const padding = 32;

  // Calculate total width from actual column widths
  const totalWidth = tableData.column_widths.reduce(
    (sum, width) => sum + Math.max(width, minColumnWidth),
    0
  );

  // Calculate total height from actual row heights
  const totalHeight = tableData.rows.reduce(
    (sum, row) => sum + Math.max(row.height, minRowHeight),
    0
  );

  // Add padding and ensure minimum dimensions
  const calculatedWidth = Math.max(totalWidth + padding, element.width, 200);
  const calculatedHeight = Math.max(totalHeight + padding, element.height, 100);

  return { width: calculatedWidth, height: calculatedHeight };
};

/**
 * Calculate row and column positions for table layout
 */
export const calculateTablePositions = (
  tableData: TableData | null,
  cacheRef: React.MutableRefObject<Map<string, { rowTop: number; colLeft: number }>>,
  lastTableDataRef: React.MutableRefObject<string>
): TablePositions => {
  if (!tableData || !tableData.rows || !tableData.column_widths) {
    return { rowPositions: [], colPositions: [] };
  }

  // Safety check for empty arrays
  if (tableData.rows.length === 0 || tableData.column_widths.length === 0) {
    return { rowPositions: [], colPositions: [] };
  }

  // Create a more efficient cache key
  const currentTableDataKey = `${tableData.rows.length}-${tableData.column_widths.length}-${tableData.rows.map(r => r?.height || 20).join(',')}-${tableData.column_widths.join(',')}`;

  // Check if cache is still valid
  if (lastTableDataRef.current === currentTableDataKey && cacheRef.current.size > 0) {
    // Extract cached positions more efficiently
    const cachedRowPositions: number[] = [];
    const cachedColPositions: number[] = [];

    for (let i = 0; i < tableData.rows.length; i++) {
      const cached = cacheRef.current.get(`row-${i}`);
      if (cached) cachedRowPositions.push(cached.rowTop);
    }

    for (let i = 0; i < tableData.column_widths.length; i++) {
      const cached = cacheRef.current.get(`col-${i}`);
      if (cached) cachedColPositions.push(cached.colLeft);
    }

    return { rowPositions: cachedRowPositions, colPositions: cachedColPositions };
  }

  // Recalculate and cache positions
  cacheRef.current.clear();
  const rowPositions: number[] = [];
  const colPositions: number[] = [];

  // Calculate row positions with safety checks
  let rowTop = 0;
  for (let i = 0; i < tableData.rows.length; i++) {
    rowPositions.push(rowTop);
    cacheRef.current.set(`row-${i}`, { rowTop, colLeft: 0 });
    const rowHeight = tableData.rows[i]?.height;
    rowTop += Math.max(typeof rowHeight === 'number' ? rowHeight : 20, 20);
  }

  // Calculate column positions with safety checks
  let colLeft = 0;
  for (let i = 0; i < tableData.column_widths.length; i++) {
    colPositions.push(colLeft);
    cacheRef.current.set(`col-${i}`, { rowTop: 0, colLeft });
    const colWidth = tableData.column_widths[i];
    colLeft += Math.max(typeof colWidth === 'number' ? colWidth : 64, 64);
  }

  lastTableDataRef.current = currentTableDataKey;
  return { rowPositions, colPositions };
};

/**
 * Get precise column positions from DOM
 */
export const getColumnPosition = (
  colIndex: number,
  tableRef: React.RefObject<HTMLTableElement | null>,
  tableData: TableData | null
): number => {
  if (!tableRef.current || !tableData) return 0;
  
  const table = tableRef.current;
  const firstRow = table.querySelector('tbody tr:first-child');
  if (!firstRow) return 0;
  
  const cells = firstRow.querySelectorAll('td');
  if (colIndex >= cells.length) return 0;
  
  const cell = cells[colIndex] as HTMLElement;
  const rect = cell.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  
  // Return the right edge position relative to the table
  return rect.right - tableRect.left;
};

/**
 * Get precise row positions from DOM
 */
export const getRowPosition = (
  rowIndex: number,
  tableRef: React.RefObject<HTMLTableElement | null>,
  tableData: TableData | null
): number => {
  if (!tableRef.current || !tableData) return 0;
  
  const table = tableRef.current;
  const rows = table.querySelectorAll('tbody tr');
  if (rowIndex >= rows.length) return 0;
  
  const row = rows[rowIndex] as HTMLElement;
  const rect = row.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  
  // Return the bottom edge position relative to the table
  return rect.bottom - tableRect.top;
};

/**
 * Create debounced resize function
 */
export const createDebouncedResize = (
  resizeTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  calculateTableDimensions: () => TableDimensions,
  element: Element,
  onSizeChange: (elementId: string, width: number, height: number) => void
) => {
  return () => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const { width, height } = calculateTableDimensions();
      // Only update if dimensions actually changed
      if (Math.abs(width - element.width) > 1 || Math.abs(height - element.height) > 1) {
        onSizeChange(element.id, width, height);
      }
      resizeTimeoutRef.current = null;
    }, 100); // Increased delay to reduce frequency of updates
  };
};
