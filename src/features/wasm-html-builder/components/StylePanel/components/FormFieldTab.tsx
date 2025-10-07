import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormFieldTabProps } from '../types';
import { UNDERLINE_STYLES, SLIDER_CONFIGS } from '../constants';

const FormFieldTab: React.FC<FormFieldTabProps> = ({
  element,
  localStyle,
  safeStyle,
  onStyleUpdate,
  formFieldData,
  onContentUpdate,
}) => {
  if (!formFieldData) return null;

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground">
          Form Field Controls
        </div>
      
        {/* Show Label Toggle */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Show Label
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formFieldData.showLabel ?? true}
              onChange={(e) => {
                onContentUpdate({ showLabel: e.target.checked });
              }}
              className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">
              {formFieldData.showLabel ? 'แสดง Label' : 'ซ่อน Label'}
            </span>
          </div>
        </div>

        {/* Gap Control - แสดงเมื่อมี label */}
        {formFieldData.showLabel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                Gap between Label and Value
              </Label>
              <span className="text-xs text-muted-foreground font-mono">
                {formFieldData.gap}px
              </span>
            </div>
            <Slider
              value={[formFieldData.gap]}
              onValueChange={([value]) => {
                onContentUpdate({ gap: value });
              }}
              min={SLIDER_CONFIGS.gap.min}
              max={SLIDER_CONFIGS.gap.max}
              step={SLIDER_CONFIGS.gap.step}
              className="w-full"
            />
          </div>
        )}

        {/* Label Width Control - แสดงเมื่อมี label */}
        {formFieldData.showLabel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">
                Label Width (%)
              </Label>
              <span className="text-xs text-muted-foreground font-mono">
                {formFieldData.labelWidth}%
              </span>
            </div>
            <Slider
              value={[formFieldData.labelWidth]}
              onValueChange={([value]) => {
                onContentUpdate({ labelWidth: value });
              }}
              min={SLIDER_CONFIGS.labelWidth.min}
              max={SLIDER_CONFIGS.labelWidth.max}
              step={SLIDER_CONFIGS.labelWidth.step}
              className="w-full"
            />
          </div>
        )}

        {/* Value Width Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              {formFieldData.showLabel ? 'Value Width (%)' : 'Field Width (%)'}
            </Label>
            <span className="text-xs text-muted-foreground font-mono">
              {formFieldData.valueWidth ?? 70}%
            </span>
          </div>
          <Slider
            value={[formFieldData.valueWidth ?? 70]}
            onValueChange={([value]) => {
              onContentUpdate({ valueWidth: value });
            }}
            min={SLIDER_CONFIGS.valueWidth.min}
            max={SLIDER_CONFIGS.valueWidth.max}
            step={SLIDER_CONFIGS.valueWidth.step}
            className="w-full"
          />
        </div>

        {/* Underline Style Control */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Underline Style
          </Label>
          <Select
            value={formFieldData.underlineStyle ?? 'solid'}
            onValueChange={(value) => {
              onContentUpdate({ underlineStyle: value });
            }}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select underline style" />
            </SelectTrigger>
            <SelectContent>
              {UNDERLINE_STYLES.map(style => (
                <SelectItem key={style.value} value={style.value}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">{style.label}</span>
                    <span className="text-xs opacity-75">{style.preview}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FormFieldTab;
