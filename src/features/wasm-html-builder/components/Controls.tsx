import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Element, ElementStyle } from '../module/wasm-interface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ControlsProps {
  enableDetailedPerformance?: boolean;
  onToggleDetailedPerformance?: (enabled: boolean) => void;
  isProcessing: boolean;
  selectedElementId: string | null;
  elements: Element[];
  styleTemplate: Partial<ElementStyle> | null;
  showStylePanel: boolean;
  showTemplateManager: boolean;
  showElementBorders: boolean;
  showRuler: boolean;
  rulerUnit: 'px' | 'mm' | 'cm' | 'in';
  showGrid: boolean;
  snapToGrid: boolean;
  copyPaste: {
    hasCopiedElement: boolean;
    copyElement: (element: Element) => void;
  };
  undoRedo: {
    canUndo: boolean;
    canRedo: boolean;
    getCurrentHistoryIndex: () => number;
    getHistorySize: () => number;
  };
  onCreateElement: (type: string) => void;
  onToggleStylePanel: () => void;
  onToggleTemplateManager: () => void;
  onToggleBorders: () => void;
  onToggleRuler: () => void;
  onToggleGrid: () => void;
  onToggleSnapToGrid: () => void;
  onSetRulerUnit: (unit: 'px' | 'mm' | 'cm' | 'in') => void;
  onClearTemplate: () => void;
  onExportHtml: () => void;
  onReset: () => void;
  onCopyElement: () => void;
  onPasteElement: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDebug: () => void;
  // Zoom controls
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onZoomReset?: () => void;
  currentZoom?: number;
  isWasmLoaded?: boolean;
}

const Controls: React.FC<ControlsProps> = React.memo(({
  enableDetailedPerformance = false,
  onToggleDetailedPerformance,
  isProcessing,
  selectedElementId,
  elements,
  styleTemplate,
  showStylePanel,
  showTemplateManager,
  showElementBorders,
  showRuler,
  rulerUnit,
  showGrid,
  snapToGrid,
  copyPaste,
  undoRedo,
  onCreateElement,
  onToggleStylePanel,
  onToggleTemplateManager,
  onToggleBorders,
  onToggleRuler,
  onToggleGrid,
  onToggleSnapToGrid,
  onSetRulerUnit,
  onClearTemplate,
  onExportHtml,
  onReset,
  onCopyElement,
  onPasteElement,
  onUndo,
  onRedo,
  onDebug,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomReset,
  currentZoom = 1,
  isWasmLoaded = false,
}) => {
  // Memoize expensive computations
  const hasElements = useMemo(() => 
    elements.length > 0,
    [elements.length]
  );

  const historyInfo = useMemo(() => ({
    currentIndex: undoRedo.getCurrentHistoryIndex(),
    totalSize: undoRedo.getHistorySize(),
  }), [undoRedo]);

  const hasCopiedElement = useMemo(() => 
    copyPaste.hasCopiedElement,
    [copyPaste.hasCopiedElement]
  );

  return (
    <div className="border-b bg-background dark:bg-neutral-950 px-4">
      <div className="flex h-10 items-center justify-between">
        {/* Left: Element Creation */}
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-7">
                <Icon icon="lucide:plus" className="h-3 w-3 mr-1" />
                Add Element
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Add Element</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onCreateElement('heading')}>
                <Icon icon="lucide:type" className="h-4 w-4 mr-2" />
                Heading
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('paragraph')}>
                <Icon icon="lucide:align-left" className="h-4 w-4 mr-2" />
                Paragraph
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('button')}>
                <Icon icon="lucide:mouse-pointer-click" className="h-4 w-4 mr-2" />
                Button
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('image')}>
                <Icon icon="lucide:image" className="h-4 w-4 mr-2" />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('table')}>
                <Icon icon="lucide:table" className="h-4 w-4 mr-2" />
                Table
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('form_field')}>
                <Icon icon="lucide:edit-3" className="h-4 w-4 mr-2" />
                Form Field
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('checkbox')}>
                <Icon icon="lucide:check-square" className="h-4 w-4 mr-2" />
                Checkbox
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onCreateElement('rectangle')}>
                <Icon icon="lucide:square" className="h-4 w-4 mr-2" />
                Rectangle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('circle')}>
                <Icon icon="lucide:circle" className="h-4 w-4 mr-2" />
                Circle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateElement('line')}>
                <Icon icon="lucide:minus" className="h-4 w-4 mr-2" />
                Line
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-4" />

          {/* Quick Actions */}
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
          onClick={onUndo}
          disabled={!undoRedo.canUndo}
              className="h-7 w-7 p-0"
          title="Undo (Ctrl+Z)"
        >
              <Icon icon="lucide:undo" className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
          onClick={onRedo}
          disabled={!undoRedo.canRedo}
              className="h-7 w-7 p-0"
          title="Redo (Ctrl+Y)"
        >
              <Icon icon="lucide:redo" className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCopyElement}
              disabled={!selectedElementId}
              className="h-7 w-7 p-0"
              title="Copy (Ctrl+C)"
            >
              <Icon icon="lucide:copy" className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onPasteElement}
              disabled={!hasCopiedElement}
              className="h-7 w-7 p-0"
              title="Paste (Ctrl+V)"
            >
              <Icon icon="lucide:clipboard" className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Center: View Controls */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={showElementBorders ? "secondary" : "ghost"}
          onClick={onToggleBorders}
            className="h-7 px-2"
        >
          <Icon
              icon={showElementBorders ? "lucide:eye-off" : "lucide:eye"} 
              className="h-3 w-3 mr-1" 
            />
            <span className="hidden sm:inline">Borders</span>
          </Button>

          <Button
            size="sm"
            variant={showRuler ? "secondary" : "ghost"}
            onClick={onToggleRuler}
            className="h-7 px-2"
          >
            <Icon icon="lucide:ruler" className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Ruler</span>
          </Button>

          <Button
            size="sm"
            variant={showGrid ? "secondary" : "ghost"}
            onClick={onToggleGrid}
            className="h-7 px-2"
          >
            <Icon icon="lucide:grid-3x3" className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Grid</span>
          </Button>

          <Button
            size="sm"
            variant={snapToGrid ? "secondary" : "ghost"}
            onClick={onToggleSnapToGrid}
            className="h-7 px-2"
            title="Snap to Grid"
          >
            <Icon icon="lucide:magnet" className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Snap</span>
          </Button>

          {/* Unit Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 px-2">
                <span className="text-xs font-mono">{rulerUnit}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>หน่วยวัด</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSetRulerUnit('px')}>
                <span className="font-mono mr-2">px</span>
                Pixels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRulerUnit('mm')}>
                <span className="font-mono mr-2">mm</span>
                Millimeters
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRulerUnit('cm')}>
                <span className="font-mono mr-2">cm</span>
                Centimeters
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSetRulerUnit('in')}>
                <span className="font-mono mr-2">in</span>
                Inches
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border-l border-gray-200 pl-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onZoomOut}
              disabled={!isWasmLoaded}
              className="h-7 w-7 p-0"
              title={isWasmLoaded ? "Zoom Out (Ctrl + Scroll)" : "WASM not loaded"}
            >
              <Icon icon="lucide:zoom-out" className="h-3 w-3" />
            </Button>
            
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={onZoomReset}
                disabled={!isWasmLoaded}
                className="h-7 px-2 text-xs"
                title={isWasmLoaded ? "Reset Zoom" : "WASM not loaded"}
              >
                {isWasmLoaded ? `${Math.round(currentZoom * 100)}%` : "Loading..."}
              </Button>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onZoomIn}
              disabled={!isWasmLoaded}
              className="h-7 w-7 p-0"
              title={isWasmLoaded ? "Zoom In (Ctrl + Scroll)" : "WASM not loaded"}
            >
              <Icon icon="lucide:zoom-in" className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={onZoomFit}
              disabled={!isWasmLoaded}
              className="h-7 w-7 p-0"
              title={isWasmLoaded ? "Fit to Screen" : "WASM not loaded"}
            >
              <Icon icon="lucide:maximize" className="h-3 w-3" />
            </Button>
          </div>
          
          <Button
            size="sm"
            variant={showStylePanel ? "secondary" : "ghost"}
            onClick={onToggleStylePanel}
            disabled={!selectedElementId}
            className="h-7 px-2"
          >
            <Icon icon="lucide:palette" className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Style</span>
          </Button>

          <Button
            size="sm"
            variant={showTemplateManager ? "secondary" : "ghost"}
            onClick={onToggleTemplateManager}
            className="h-7 px-2"
          >
            <Icon icon="lucide:bookmark" className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Templates</span>
          </Button>
      </div>

        {/* Right: Actions & Status */}
        <div className="flex items-center space-x-2">
          {/* History Status */}
          <Badge variant="outline" className="text-xs">
            {historyInfo.currentIndex + 1}/{historyInfo.totalSize}
          </Badge>
          
          {hasCopiedElement && (
            <Badge variant="secondary" className="text-xs">
              Clipboard
            </Badge>
          )}

          <Separator orientation="vertical" className="h-4" />

          {/* Action Buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={onExportHtml}
            disabled={isProcessing || !hasElements}
            className="h-7 px-2 bg-green-50 dark:bg-green-950 hover:dark:bg-green-800 hover:bg-green-100 border-green-200 dark:border-green-900 text-green-700"
            title="Export เป็นไฟล์ HTML และดาวน์โหลดลงเครื่อง"
          >
            <Icon icon="lucide:download" className="h-3 w-3 mr-1 dark:text-green-400 text-green-700" />
            <span className="hidden sm:inline dark:text-green-400 text-green-700">Export HTML</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
          onClick={onReset}
            className="h-7 px-2"
        >
            <Icon icon="lucide:refresh-cw" className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

        {/* Performance Monitor Toggle */}
        <Button
          size="sm"
          variant={enableDetailedPerformance ? "default" : "ghost"}
          onClick={() => onToggleDetailedPerformance?.(!enableDetailedPerformance)}
          className="h-7 w-7 p-0"
          title={enableDetailedPerformance ? "Disable Detailed Performance Monitor" : "Enable Detailed Performance Monitor"}
        >
          <Icon icon="lucide:activity" className="h-3 w-3" />
        </Button>

        {/* Debug Button */}
          <Button
            size="sm"
            variant="ghost"
          onClick={onDebug}
            className="h-7 w-7 p-0"
            title="Debug Info"
          >
            <Icon icon="lucide:bug" className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

Controls.displayName = 'Controls';

export default Controls;
