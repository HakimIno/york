import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Merge, Split, Settings } from 'lucide-react';
import { TableTabProps } from '../types';
import { useTableStore } from '@/stores/tableStore';

const TableTab: React.FC<TableTabProps> = ({
  element,
  safeStyle,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumnWidth,
  onUpdateRowHeight,
  onGetTableCellStyle,
  // Props moved to Zustand store
}) => {
  // Use Zustand store for cell selection - using only selectedCells to reduce redundancy
  const { 
    selectedCells, 
    getSelectedCellsCount,
    getSelectedCell,
    updateSelectedCellsStyle,
    clearSelection 
  } = useTableStore();

  // Memoize store functions to prevent unnecessary re-renders
  const memoizedGetSelectedCellsCount = useCallback(() => getSelectedCellsCount(), [getSelectedCellsCount]);
  const memoizedGetSelectedCell = useCallback(() => getSelectedCell(), [getSelectedCell]);
  const memoizedClearSelection = useCallback(() => clearSelection(), [clearSelection]);
  const [cellStyle, setCellStyle] = useState<any>(null);
  
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  
  const [rowHeightTimer, setRowHeightTimer] = useState<NodeJS.Timeout | null>(null);
  const [columnWidthTimer, setColumnWidthTimer] = useState<NodeJS.Timeout | null>(null);
  const [styleUpdateTimer, setStyleUpdateTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (element && element.tableData) {
      const heights = element.tableData.rows?.map((row: any) => row.height || 20) || [];
      const widths = element.tableData.columnWidths || [];
      
      setRowHeights(heights);
      setColumnWidths(widths);
    }
  }, [element]);

  // Memoize default style to prevent unnecessary recalculations
  const defaultStyle = useMemo(() => ({
    fontSize: safeStyle.fontSize || 12,
    fontFamily: safeStyle.fontFamily || 'Arial',
    fontWeight: safeStyle.fontWeight || 'normal',
    fontStyle: safeStyle.fontStyle || 'normal',
    color: safeStyle.color || '#000000',
    backgroundColor: safeStyle.backgroundColor || '#ffffff',
    textAlign: safeStyle.textAlign || 'left'
  }), [safeStyle]);

  // Optimize cell style loading with reduced dependencies
  useEffect(() => {
    const selectedCell = memoizedGetSelectedCell();
    if (selectedCell && selectedCell.row >= 0 && selectedCell.col >= 0 && onGetTableCellStyle && element) {
      const style = onGetTableCellStyle(element.id, selectedCell.row, selectedCell.col);
      setCellStyle({ ...defaultStyle, ...style });
    } else {
      setCellStyle(null);
    }
  }, [selectedCells.length, memoizedGetSelectedCell, onGetTableCellStyle, element?.id, defaultStyle]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (rowHeightTimer) {
        clearTimeout(rowHeightTimer);
      }
      if (columnWidthTimer) {
        clearTimeout(columnWidthTimer);
      }
      if (styleUpdateTimer) {
        clearTimeout(styleUpdateTimer);
      }
    };
  }, [rowHeightTimer, columnWidthTimer, styleUpdateTimer]);

  // Debounced style update function
  const debouncedStyleUpdate = useCallback(async (styleUpdate: Partial<any>) => {
    if (styleUpdateTimer) {
      clearTimeout(styleUpdateTimer);
    }
    
    // Update local state immediately for responsive UI
    const newStyle = { ...cellStyle, ...styleUpdate };
    setCellStyle(newStyle);
    
    // Debounce the actual WASM call
    const timer = setTimeout(async () => {
      if (element) {
        await updateSelectedCellsStyle(element.id, newStyle);
      }
    }, 150); // Reduced from immediate to 150ms debounce
    
    setStyleUpdateTimer(timer);
  }, [cellStyle, element, updateSelectedCellsStyle, styleUpdateTimer]);

  // Font size controls
  const handleFontSizeChange = useCallback((value: number[]) => {
    debouncedStyleUpdate({ fontSize: value[0] });
  }, [debouncedStyleUpdate]);

  // Font family controls
  const handleFontFamilyChange = useCallback((value: string) => {
    debouncedStyleUpdate({ fontFamily: value });
  }, [debouncedStyleUpdate]);

  // Font weight controls
  const handleFontWeightChange = useCallback((value: string) => {
    debouncedStyleUpdate({ fontWeight: value });
  }, [debouncedStyleUpdate]);

  // Font style controls
  const handleFontStyleChange = useCallback((value: string) => {
    debouncedStyleUpdate({ fontStyle: value });
  }, [debouncedStyleUpdate]);

  // Text color controls
  const handleTextColorChange = useCallback((value: string) => {
    debouncedStyleUpdate({ color: value });
  }, [debouncedStyleUpdate]);

  // Background color controls
  const handleBackgroundColorChange = useCallback((value: string) => {
    debouncedStyleUpdate({ backgroundColor: value });
  }, [debouncedStyleUpdate]);

  // Text alignment controls
  const handleTextAlignChange = useCallback((value: string) => {
    debouncedStyleUpdate({ textAlign: value });
  }, [debouncedStyleUpdate]);

  // Row height controls with debouncing
  const handleRowHeightChange = useCallback((rowIndex: number, height: number) => {
    // Update local state immediately for responsive UI
    setRowHeights(prev => {
      const newHeights = [...prev];
      newHeights[rowIndex] = height;
      return newHeights;
    });
    
    // Clear existing timer
    if (rowHeightTimer) {
      clearTimeout(rowHeightTimer);
    }
    
    // Set new timer for WASM call
    const timer = setTimeout(() => {
      if (onUpdateRowHeight && element) {
        onUpdateRowHeight(element.id, rowIndex, height);
      }
    }, 300); // 300ms debounce
    
    setRowHeightTimer(timer);
  }, [rowHeightTimer, onUpdateRowHeight, element]);

  // Column width controls with debouncing
  const handleColumnWidthChange = useCallback((colIndex: number, width: number) => {
    // Update local state immediately for responsive UI
    setColumnWidths(prev => {
      const newWidths = [...prev];
      newWidths[colIndex] = width;
      return newWidths;
    });
    
    // Clear existing timer
    if (columnWidthTimer) {
      clearTimeout(columnWidthTimer);
    }
    
    // Set new timer for WASM call
    const timer = setTimeout(() => {
      if (onUpdateColumnWidth && element) {
        onUpdateColumnWidth(element.id, colIndex, width);
      }
    }, 300); // 300ms debounce
    
    setColumnWidthTimer(timer);
  }, [columnWidthTimer, onUpdateColumnWidth, element]);

  // Table structure management with useCallback optimization
  const handleAddRow = useCallback((atIndex?: number) => {
    if (onAddRow && element) {
      onAddRow(element.id, atIndex);
      
      // Update local state - add new row with default height
      setRowHeights(prev => {
        const newHeights = [...prev];
        const defaultHeight = 20;
        if (atIndex !== undefined && atIndex < newHeights.length) {
          newHeights.splice(atIndex, 0, defaultHeight);
        } else {
          newHeights.push(defaultHeight);
        }
        return newHeights;
      });
    }
  }, [onAddRow, element]);

  const handleRemoveRow = useCallback((index: number) => {
    if (onRemoveRow && element) {
      onRemoveRow(element.id, index);
      
      // Update local state - remove row
      setRowHeights(prev => {
        const newHeights = [...prev];
        newHeights.splice(index, 1);
        return newHeights;
      });
    }
  }, [onRemoveRow, element]);

  const handleAddColumn = useCallback((atIndex?: number) => {
    if (onAddColumn && element) {
      onAddColumn(element.id, atIndex);
      
      // Update local state - add new column with default width
      setColumnWidths(prev => {
        const newWidths = [...prev];
        const defaultWidth = 64;
        if (atIndex !== undefined && atIndex < newWidths.length) {
          newWidths.splice(atIndex, 0, defaultWidth);
        } else {
          newWidths.push(defaultWidth);
        }
        return newWidths;
      });
    }
  }, [onAddColumn, element]);

  const handleRemoveColumn = useCallback((index: number) => {
    if (onRemoveColumn && element) {
      onRemoveColumn(element.id, index);
      
      // Update local state - remove column
      setColumnWidths(prev => {
        const newWidths = [...prev];
        newWidths.splice(index, 1);
        return newWidths;
      });
    }
  }, [onRemoveColumn, element]);

  // Memoized table info
  const tableInfo = useMemo(() => {
    return {
      rows: rowHeights.length,
      columns: columnWidths.length,
    };
  }, [rowHeights.length, columnWidths.length]);

  // Memoize selection status and info to prevent unnecessary re-renders
  const hasSelectedCells = useMemo(() => selectedCells.length > 0, [selectedCells.length]);
  const selectedCellsCount = useMemo(() => memoizedGetSelectedCellsCount(), [memoizedGetSelectedCellsCount]);
  const selectedCellInfo = useMemo(() => {
    if (hasSelectedCells) {
      return {
        count: selectedCellsCount,
        isMultiple: selectedCellsCount > 1,
        firstCell: selectedCells[0] ? `Cell (${selectedCells[0].row + 1}, ${selectedCells[0].col + 1}) Selected` : null
      };
    }
    return null;
  }, [hasSelectedCells, selectedCellsCount, selectedCells]);

  // Memoize preset colors to prevent recreation on every render
  const textColorPresets = useMemo(() => 
    ['#000000', '#333333', '#666666', '#999999', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'], []
  );
  
  const backgroundColorPresets = useMemo(() => 
    ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0', '#FFE6E6', '#E6F3FF', '#E6FFE6', '#FFF2E6'], []
  );
  
  const textAlignOptions = useMemo(() => [
    { value: 'left', icon: '↖', label: 'Left' },
    { value: 'center', icon: '↑', label: 'Center' },
    { value: 'right', icon: '↗', label: 'Right' }
  ], []);

  return (
    <div className="space-y-4 mt-4">
      {/* Cell Selection Status */}
      {!hasSelectedCells && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
          💡 <strong>How to style cells:</strong><br/>
          1. <strong>Click on any cell</strong> in the table above<br/>
          2. <strong>Hold Cmd</strong> (Mac) or <strong>Ctrl</strong> (Windows) + Click multiple cells for multi-selection<br/>
          3. <strong>Hold Shift</strong> + Click for range selection<br/>
          4. Style controls will appear below when cells are selected
        </div>
      )}

      {hasSelectedCells && selectedCellInfo && (
        <div className="flex items-center justify-between p-2 bg-primary/10 rounded border">
          <div className="text-sm font-medium text-primary">
            {selectedCellInfo.isMultiple 
              ? `${selectedCellInfo.count} Cells Selected`
              : selectedCellInfo.firstCell
            }
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={memoizedClearSelection}
            className="h-6 px-2 text-xs"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {hasSelectedCells && <Separator />}

      {/* Font Styling Section - Only show when cell is selected */}
      {hasSelectedCells && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <div className="text-sm font-medium">Font Styling</div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              Cell Mode
            </span>
          </div>
        
        {/* Font Size */}
        <div className="space-y-2">
          <Label className="text-xs">
            Font Size: {cellStyle ? cellStyle.fontSize : 12}px
          </Label>
          <Slider
            value={[cellStyle ? cellStyle.fontSize : 12]}
            onValueChange={handleFontSizeChange}
            min={8}
            max={48}
            step={1}
            className="w-full"
          />
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label className="text-xs">Font Family</Label>
          <Select
            value={cellStyle ? cellStyle.fontFamily : 'Arial'}
            onValueChange={handleFontFamilyChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Weight */}
        <div className="space-y-2">
          <Label className="text-xs">Font Weight</Label>
          <Select
            value={cellStyle ? cellStyle.fontWeight : 'normal'}
            onValueChange={handleFontWeightChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Style */}
        <div className="space-y-2">
          <Label className="text-xs">Font Style</Label>
          <Select
            value={cellStyle ? cellStyle.fontStyle : 'normal'}
            onValueChange={handleFontStyleChange}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="italic">Italic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        </div>
      )}

      {/* Color Styling Section - Only show when cell is selected */}
      {hasSelectedCells && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: cellStyle?.color || '#000000' }}></div>
            <div className="text-sm font-medium">Color Styling</div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              Cell Mode
            </span>
          </div>
        
        {/* Text Color */}
        <div className="space-y-2">
          <Label className="text-xs">Text Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={cellStyle?.color || '#000000'}
              onChange={(e) => handleTextColorChange(e.target.value)}
              className="h-8 w-16 p-1 border rounded"
            />
            <Input
              type="text"
              value={cellStyle?.color || '#000000'}
              onChange={(e) => handleTextColorChange(e.target.value)}
              className="h-8 text-xs flex-1"
              placeholder="#000000"
            />
          </div>
          {/* Preset text colors */}
          <div className="flex gap-1">
            {textColorPresets.map(color => (
              <button
                key={color}
                onClick={() => handleTextColorChange(color)}
                className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <Label className="text-xs">Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={cellStyle?.backgroundColor || '#ffffff'}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="h-8 w-16 p-1 border rounded"
            />
            <Input
              type="text"
              value={cellStyle?.backgroundColor || '#ffffff'}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="h-8 text-xs flex-1"
              placeholder="#ffffff"
            />
          </div>
          {/* Preset background colors */}
          <div className="flex gap-1">
            {backgroundColorPresets.map(color => (
              <button
                key={color}
                onClick={() => handleBackgroundColorChange(color)}
                className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-xs">Text Alignment</Label>
          <div className="flex gap-1">
            {textAlignOptions.map(align => (
              <button
                key={align.value}
                onClick={() => handleTextAlignChange(align.value)}
                className={`flex items-center justify-center w-8 h-8 rounded border text-sm ${
                  cellStyle?.textAlign === align.value 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background hover:bg-muted border-border'
                }`}
                title={align.label}
              >
                {align.icon}
              </button>
            ))}
          </div>
        </div>
        </div>
      )}

      <Separator />

      {/* Cell Sizing Section */}
      <div className="space-y-4">
        <div className="text-sm font-medium">Cell Sizing</div>
        
        {/* Row Heights */}
        {rowHeights.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Row Heights</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {rowHeights.map((height: number, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Label className="text-xs w-12">Row {index + 1}:</Label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => handleRowHeightChange(index, Number(e.target.value))}
                    className="h-6 text-xs"
                    min="15"
                    max="100"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Column Widths */}
        {columnWidths.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Column Widths</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {columnWidths.map((width: number, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Label className="text-xs w-12">Col {index + 1}:</Label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => handleColumnWidthChange(index, Number(e.target.value))}
                    className="h-6 text-xs"
                    min="30"
                    max="300"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Table Structure Management */}
      <div className="space-y-4">
        <div className="text-sm font-medium">Table Structure</div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Row Management */}
          <div className="space-y-2">
            <Label className="text-xs">Rows ({tableInfo.rows})</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddRow()}
                className="h-6 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemoveRow(tableInfo.rows - 1)}
                disabled={tableInfo.rows <= 1}
                className="h-6 px-2"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Column Management */}
          <div className="space-y-2">
            <Label className="text-xs">Columns ({tableInfo.columns})</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddColumn()}
                className="h-6 px-2"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemoveColumn(tableInfo.columns - 1)}
                disabled={tableInfo.columns <= 1}
                className="h-6 px-2"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableTab;
