import React from 'react';
import { Type } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PerformanceSlider } from './PerformanceSlider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TabProps } from '../types';
import { FONT_FAMILIES, TEXT_ALIGNMENTS, SLIDER_CONFIGS } from '../constants';

const TypographyTab: React.FC<TabProps> = ({
  element,
  localStyle,
  safeStyle,
  onStyleUpdate,
}) => {
  return (
    <div className="space-y-4 mt-4">
      {/* Text Color */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Text Color</Label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={safeStyle.color}
            onChange={e => onStyleUpdate({ color: e.target.value })}
            className="w-8 h-8 rounded border border-input cursor-pointer"
          />
          <Input
            type="text"
            value={safeStyle.color}
            onChange={e => onStyleUpdate({ color: e.target.value })}
            placeholder="#000000"
            className="flex-1 h-8 text-xs font-mono"
          />
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Font Size
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {safeStyle.fontSize}px
          </span>
        </div>
        <PerformanceSlider
          value={[safeStyle.fontSize]}
          onValueChange={value => onStyleUpdate({ fontSize: value[0] })}
          max={SLIDER_CONFIGS.fontSize.max}
          min={SLIDER_CONFIGS.fontSize.min}
          step={SLIDER_CONFIGS.fontSize.step}
          className="w-full"
          debounceMs={100}
        />
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Font Family</Label>
        <Select
          value={safeStyle.fontFamily}
          onValueChange={value => onStyleUpdate({ fontFamily: value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map(font => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Weight & Style */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Weight</Label>
          <Select
            value={safeStyle.fontWeight}
            onValueChange={value =>
              onStyleUpdate({ fontWeight: value as 'normal' | 'bold' })
            }
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
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Style</Label>
          <Select
            value={safeStyle.fontStyle}
            onValueChange={value =>
              onStyleUpdate({ fontStyle: value as 'normal' | 'italic' })
            }
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

      {/* Text Alignment */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Text Alignment</Label>
        <div className="flex space-x-1">
          {TEXT_ALIGNMENTS.map(align => (
            <Button
              key={align}
              variant={safeStyle.textAlign === align ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStyleUpdate({ textAlign: align })}
              className="flex-1 h-8 text-xs"
            >
              {align === 'left' && '⬅️'}
              {align === 'center' && '⬆️'}
              {align === 'right' && '➡️'}
              <span className="ml-1 capitalize">{align}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TypographyTab;
