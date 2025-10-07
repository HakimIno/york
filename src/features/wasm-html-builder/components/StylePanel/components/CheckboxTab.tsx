import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CheckboxData {
  label: string;
  checked: boolean;
  showLabel: boolean;
  labelPosition: 'left' | 'right';
  checkboxStyle: 'square' | 'circle' | 'rounded';
  boxSize: number;
  fontSize: number;
  labelGap: number;
}

interface CheckboxTabProps {
  checkboxData: CheckboxData | null;
  onContentUpdate: (updates: Partial<CheckboxData>) => void;
}

const CheckboxTab: React.FC<CheckboxTabProps> = ({
  checkboxData,
  onContentUpdate,
}) => {
  if (!checkboxData) return null;

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-4">
        <div className="text-xs font-medium text-muted-foreground">
          Checkbox Controls
        </div>
      
        {/* Checkbox State */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Checkbox State
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={checkboxData.checked ?? false}
              onChange={(e) => {
                onContentUpdate({ checked: e.target.checked });
              }}
              className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">
              {checkboxData.checked ? 'Checked' : 'Unchecked'}
            </span>
          </div>
        </div>

        {/* Label Text */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Label Text
          </Label>
          <Input
            value={checkboxData.label ?? ''}
            onChange={(e) => {
              onContentUpdate({ label: e.target.value });
            }}
            className="h-7 text-xs"
            placeholder="Enter label text..."
          />
        </div>

        {/* Show Label Toggle */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Show Label
          </Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={checkboxData.showLabel}
              onChange={(e) => {
                onContentUpdate({ showLabel: e.target.checked });
              }}
              className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary"
            />
            <span className="text-xs text-muted-foreground">
              {checkboxData.showLabel ? 'แสดง Label' : 'ซ่อน Label'}
            </span>
          </div>
        </div>

        {/* Label Position */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Label Position
          </Label>
          <Select
            value={checkboxData.labelPosition ?? 'right'}
            onValueChange={(value: 'left' | 'right') => {
              onContentUpdate({ labelPosition: value });
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Checkbox Style */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Checkbox Style
          </Label>
          <Select
            value={checkboxData.checkboxStyle || 'square'}
            onValueChange={(value: 'square' | 'circle' | 'rounded') => {
              onContentUpdate({ checkboxStyle: value });
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="rounded">Rounded</SelectItem>
              <SelectItem value="circle">Circle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Box Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Box Size: {checkboxData.boxSize || 15}px
          </Label>
          <Slider
            value={[checkboxData.boxSize || 15]}
            onValueChange={(value) => {
              onContentUpdate({ boxSize: value[0] });
            }}
            min={10}
            max={30}
            step={1}
            className="w-full"
          />
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Font Size: {checkboxData.fontSize || 12}px
          </Label>
          <Slider
            value={[checkboxData.fontSize || 12]}
            onValueChange={(value) => {
              onContentUpdate({ fontSize: value[0] });
            }}
            min={8}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Label Gap */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Label Gap: {checkboxData.labelGap || 4}px
          </Label>
          <Slider
            value={[checkboxData.labelGap ?? 4]}
            onValueChange={(value) => {
              onContentUpdate({ labelGap: value[0] });
            }}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
        </div>

        {/* Style Preview */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Preview
          </Label>
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded border">
            {checkboxData.showLabel && checkboxData.labelPosition === 'left' && (
              <span className="text-sm">{checkboxData.label || ''}</span>
            )}
            <span
              className="border border-gray-600 inline-block text-center"
              style={{
                width: `${checkboxData.boxSize || 15}px`,
                height: `${checkboxData.boxSize || 15}px`,
                border: '1px solid #222',
                textAlign: 'center',
                lineHeight: `${checkboxData.boxSize || 15}px`,
                marginRight: `${checkboxData.labelGap || 4}px`,
                borderRadius: 
                  checkboxData.checkboxStyle === 'circle' ? '50%' :
                  checkboxData.checkboxStyle === 'rounded' ? '4px' : '2px',
                fontSize: `${checkboxData.fontSize || 12}px`
              }}
            >
              {checkboxData.checked && '✓'}
            </span>
            {checkboxData.showLabel && checkboxData.labelPosition === 'right' && (
              <span className="text-sm">{checkboxData.label || ''}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckboxTab;
