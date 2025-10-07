'use client';

import React, { useState } from 'react';
import { Button } from './button';


interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
  resetToDefault: () => void;
}

const predefinedColors = [
  '#2563eb', // blue (น้ำเงินเข้ม)
  '#3b82f6', // blue (น้ำเงินอ่อน)
  '#6b7280', // gray (เทาเข้ม)
  '#ea580c', // orange (ส้ม)
  '#dc2626', // red (แดง)
  '#16a34a', // green (เขียว)
  '#7c3aed', // violet (ม่วง)
  '#db2777', // pink (ชมพู)
];

export function ColorPicker({
  value,
  onChange,
  label,
  className = '',
  resetToDefault,
}: ColorPickerProps) {
  const handleColorSelect = (color: string) => {
    onChange(color);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetToDefault()}
            className="text-xs text-zinc-600 dark:text-zinc-400 shadow-none cursor-pointer"
          >
            รีเซ็ต
          </Button>
        </div>
      )}

      {/* Color Palette - แถบสีแนวนอน */}
      <div className="space-y-3">
        <div className="flex gap-1">
          {predefinedColors.map(color => (
            <button
              key={color}
              className={`w-14 h-14 rounded-md  cursor-pointer ${
                value === color
                  ? 'border-2 border-black dark:border-white '
                  : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              title={color}
            />
          ))}
        </div>

        {/* Custom Color Input */}
      </div>
    </div>
  );
}

export default ColorPicker;
