import React from 'react';
import { Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { QuickPresetsProps } from '../types';
import { STYLE_PRESETS } from '../constants';

const QuickPresets: React.FC<QuickPresetsProps> = ({ onStyleUpdate }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Zap className="h-3 w-3 text-amber-500" />
        <Label className="text-xs font-medium text-muted-foreground">Quick Presets</Label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STYLE_PRESETS.map(preset => (
          <Button
            key={preset.name}
            variant="outline"
            size="sm"
            onClick={() => onStyleUpdate(preset.style)}
            className="h-auto py-2 px-3 text-left"
          >
            <div className="text-xs">
              <div className="font-medium">{preset.name}</div>
              <div className="text-muted-foreground">
                {preset.style.fontSize}px • {preset.style.fontWeight}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickPresets;
