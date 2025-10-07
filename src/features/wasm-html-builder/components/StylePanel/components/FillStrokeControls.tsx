import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus, Palette, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface FillStrokeControlsProps {
  fill: {
    color: string;
    opacity: number;
    enabled: boolean;
  };
  stroke: {
    color: string;
    opacity: number;
    width: number;
    position: string;
    style: string;
    enabled: boolean;
  };
  onFillChange: (updates: Partial<{
    color: string;
    opacity: number;
    enabled: boolean;
  }>) => void;
  onStrokeChange: (updates: Partial<{
    color: string;
    opacity: number;
    width: number;
    position: string;
    style: string;
    enabled: boolean;
  }>) => void;
  elementType?: string;
  onLineDataChange?: (updates: any) => void;
  lineData?: any;
}

const FillStrokeControls: React.FC<FillStrokeControlsProps> = ({
  fill,
  stroke,
  onFillChange,
  onStrokeChange,
  elementType,
  onLineDataChange,
  lineData,
}) => {
  const [fillExpanded, setFillExpanded] = useState(true);
  const [strokeExpanded, setStrokeExpanded] = useState(true);

  // Throttle refs for line data updates
  const lineDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFillColorChange = useCallback((color: string) => {
    onFillChange({ color });
  }, [onFillChange]);

  const handleFillOpacityChange = useCallback((opacity: number) => {
    onFillChange({ opacity });
  }, [onFillChange]);

  const handleFillToggle = useCallback(() => {
    onFillChange({ enabled: !fill.enabled });
  }, [fill.enabled, onFillChange]);

  const handleStrokeColorChange = useCallback((color: string) => {
    onStrokeChange({ color });
  }, [onStrokeChange]);

  const handleStrokeOpacityChange = useCallback((opacity: number) => {
    onStrokeChange({ opacity });
  }, [onStrokeChange]);

  const handleStrokeWidthChange = useCallback((width: number) => {
    onStrokeChange({ width });
  }, [onStrokeChange]);

  const handleStrokePositionChange = useCallback((position: string) => {
    onStrokeChange({ position });
  }, [onStrokeChange]);

  const handleStrokeStyleChange = useCallback((style: string) => {
    onStrokeChange({ style });
  }, [onStrokeChange]);

  // Throttled line data update handler
  const handleThrottledLineDataChange = useCallback((updates: any) => {
    if (!onLineDataChange) return;

    // Clear existing timeout
    if (lineDataTimeoutRef.current) {
      clearTimeout(lineDataTimeoutRef.current);
    }

    // Set new timeout for throttled update
    lineDataTimeoutRef.current = setTimeout(() => {
      onLineDataChange(updates);
    }, 100); // 100ms throttle for line data updates
  }, [onLineDataChange]);

  const handleStrokeToggle = useCallback(() => {
    onStrokeChange({ enabled: !stroke.enabled });
  }, [stroke.enabled, onStrokeChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (lineDataTimeoutRef.current) {
        clearTimeout(lineDataTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Fill Section */}
      {elementType !== 'line' && (
        <div className="border border-border rounded-lg bg-card">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setFillExpanded(!fillExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm text-foreground">Fill</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-5 h-5 border-2 border-border rounded-md shadow-sm"
                  style={{
                    backgroundColor: fill.enabled ? fill.color : 'transparent',
                    opacity: fill.enabled ? fill.opacity : 0.3
                  }}
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {fill.color}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFillToggle();
                }}
              >
                {fill.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              {fillExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {fillExpanded && (
            <div className="px-3 pb-3 space-y-4">
              <Separator />

              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={fill.color}
                    onChange={e => handleFillColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={fill.color}
                    onChange={e => handleFillColorChange(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1 h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Opacity</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {Math.round(fill.opacity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[fill.opacity * 100]}
                  onValueChange={([value]) => handleFillOpacityChange(value / 100)}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stroke Section */}
      {elementType !== 'line' && (
        <div className="border border-border rounded-lg bg-card">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setStrokeExpanded(!strokeExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current rounded-sm" />
                <span className="font-medium text-sm text-foreground">Stroke</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-5 h-5 border-2 border-border rounded-md shadow-sm"
                  style={{
                    backgroundColor: stroke.enabled ? stroke.color : 'transparent',
                    opacity: stroke.enabled ? stroke.opacity : 0.3
                  }}
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {stroke.color}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStrokeToggle();
                }}
              >
                {stroke.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              {strokeExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {strokeExpanded && (
            <div className="px-3 pb-3 space-y-4">
              <Separator />

              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={stroke.color}
                    onChange={e => handleStrokeColorChange(e.target.value)}
                    className="w-8 h-8 rounded border border-input cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={stroke.color}
                    onChange={e => handleStrokeColorChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">Opacity</Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {Math.round(stroke.opacity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[stroke.opacity * 100]}
                  onValueChange={([value]) => handleStrokeOpacityChange(value / 100)}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Stroke Properties */}
              <div className="grid grid-cols-2 gap-3">
                {/* Width */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Width</Label>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 border border-border rounded flex items-center justify-center">
                      <div
                        className="bg-foreground rounded-full"
                        style={{
                          width: Math.max(1, stroke.width * 2),
                          height: Math.max(1, stroke.width * 2)
                        }}
                      />
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={stroke.width}
                      onChange={(e) => handleStrokeWidthChange(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs text-center"
                    />
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Position</Label>
                  <Select value={stroke.position} onValueChange={handleStrokePositionChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inside">Inside</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="outside">Outside</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Style</Label>
                <Select value={stroke.style} onValueChange={handleStrokeStyleChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

      )}

      {/* Line-specific controls */}
      {elementType === 'line' && onLineDataChange && lineData && (
        <div className="space-y-4">
          <Separator />

          {/* Line Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Line Type</Label>
            <Select
              value={lineData.lineType || 'straight'}
              onValueChange={(value) => onLineDataChange({ lineType: value })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="straight">Straight</SelectItem>
                <SelectItem value="curved">Curved</SelectItem>
                <SelectItem value="zigzag">Zigzag</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Arrow Options */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Arrows</Label>
            <div className="flex space-x-2">
              <Button
                variant={lineData.arrowStart ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => onLineDataChange({ arrowStart: !lineData.arrowStart })}
              >
                Start
              </Button>
              <Button
                variant={lineData.arrowEnd ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => onLineDataChange({ arrowEnd: !lineData.arrowEnd })}
              >
                End
              </Button>
            </div>
          </div>

          {/* Line Points */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Line Points</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start X</Label>
                <Input
                  type="number"
                  value={lineData.startX || 0}
                  onChange={(e) => handleThrottledLineDataChange({ startX: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start Y</Label>
                <Input
                  type="number"
                  value={lineData.startY || 0}
                  onChange={(e) => handleThrottledLineDataChange({ startY: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End X</Label>
                <Input
                  type="number"
                  value={lineData.endX || 100}
                  onChange={(e) => handleThrottledLineDataChange({ endX: parseFloat(e.target.value) || 100 })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End Y</Label>
                <Input
                  type="number"
                  value={lineData.endY || 0}
                  onChange={(e) => handleThrottledLineDataChange({ endY: parseFloat(e.target.value) || 0 })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FillStrokeControls;
