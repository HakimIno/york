import React from 'react';
import { Layout } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PerformanceSlider } from './PerformanceSlider';
import { TabProps } from '../types';
import { SLIDER_CONFIGS } from '../constants';

const LayoutTab: React.FC<TabProps> = ({
  element,
  localStyle,
  safeStyle,
  onStyleUpdate,
}) => {
  return (
    <div className="space-y-4 mt-4">
      {/* Padding */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Padding
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {safeStyle.padding}px
          </span>
        </div>
        <PerformanceSlider
          value={[safeStyle.padding]}
          onValueChange={value => onStyleUpdate({ padding: value[0] })}
          max={SLIDER_CONFIGS.padding.max}
          min={SLIDER_CONFIGS.padding.min}
          step={SLIDER_CONFIGS.padding.step}
          className="w-full"
          debounceMs={100}
        />
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Border Radius
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {safeStyle.borderRadius}px
          </span>
        </div>
        <PerformanceSlider
          value={[safeStyle.borderRadius]}
          onValueChange={value => onStyleUpdate({ borderRadius: value[0] })}
          max={SLIDER_CONFIGS.borderRadius.max}
          min={SLIDER_CONFIGS.borderRadius.min}
          step={SLIDER_CONFIGS.borderRadius.step}
          className="w-full"
          debounceMs={100}
        />
      </div>

      {/* Border Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Border Width
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {safeStyle.borderWidth}px
          </span>
        </div>
        <PerformanceSlider
          value={[safeStyle.borderWidth]}
          onValueChange={value => onStyleUpdate({ borderWidth: value[0] })}
          max={SLIDER_CONFIGS.borderWidth.max}
          min={SLIDER_CONFIGS.borderWidth.min}
          step={SLIDER_CONFIGS.borderWidth.step}
          className="w-full"
          debounceMs={100}
        />
      </div>

      {/* Border Color */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Border Color</Label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={safeStyle.borderColor}
            onChange={e => onStyleUpdate({ borderColor: e.target.value })}
            className="w-8 h-8 rounded border border-input cursor-pointer"
          />
          <Input
            type="text"
            value={safeStyle.borderColor}
            onChange={e => onStyleUpdate({ borderColor: e.target.value })}
            placeholder="#cccccc"
            className="flex-1 h-8 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
};

export default LayoutTab;
