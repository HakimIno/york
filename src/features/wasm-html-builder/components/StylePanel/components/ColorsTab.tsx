import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TabProps } from '../types';

const ColorsTab: React.FC<TabProps> = ({
  element,
  localStyle,
  safeStyle,
  onStyleUpdate,
}) => {
  return (
    <div className="space-y-4 mt-4">
      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Background Color</Label>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={safeStyle.backgroundColor}
            onChange={e => onStyleUpdate({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border border-input cursor-pointer"
          />
          <Input
            type="text"
            value={safeStyle.backgroundColor}
            onChange={e => onStyleUpdate({ backgroundColor: e.target.value })}
            placeholder="#ffffff"
            className="flex-1 h-8 text-xs font-mono"
          />
        </div>
      </div>
    </div>
  );
};

export default ColorsTab;
