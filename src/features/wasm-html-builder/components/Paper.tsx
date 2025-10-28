import React from 'react';
import { Icon } from '@iconify/react';
import { PaperConfig } from '../types/paper';

interface PaperProps {
  paper: PaperConfig;
  isSelected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}

const Paper: React.FC<PaperProps> = ({
  paper,
  isSelected,
  onSelect,
  children,
}) => {
  return (
    <div
      className={`absolute bg-white shadow-lg rounded border transition-all duration-200 cursor-pointer ${isSelected
          ? 'border-primary shadow-primary/20'
          : 'border-border hover:border-border/80 hover:shadow-xl'
        }`}
      data-paper-id={paper.id}
      style={{
        left: paper.x,
        top: paper.y - 30,
        width: paper.width,
        height: paper.height,
        zIndex: 1, // Ensure paper is behind elements
        minWidth: paper.width,
        minHeight: paper.height,
        maxWidth: 'none',
        maxHeight: 'none',
      }}
      onClick={(e) => {
        // Only select paper if clicking on the paper itself, not on elements
        if (e.target === e.currentTarget) {
          onSelect();
        }
      }}
    >
      {/* Paper Header */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-muted/10 border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <Icon
            icon={paper.orientation === 'portrait' ? 'lucide:file-text' : 'lucide:file-horizontal'}
            className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground '}`}
          />
          <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
            {paper.title || `${paper.size} ${paper.orientation}`}
          </span>
        </div>

        {isSelected && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-xs text-primary font-medium">Selected</span>
          </div>
        )}
      </div>

      {/* Paper Content Area */}
      <div
        className="absolute top-8 left-0 right-0 bottom-0 overflow-visible"
        style={{
          zIndex: 2, // Ensure content area is above paper background
          width: '100%',
          height: `calc(100% - 32px)`,
          minHeight: `${paper.height - 32}px`
        }}
      >
        {children}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -inset-1 border-2 border-primary rounded-sm opacity-50"></div>
        </div>
      )}
    </div>
  );
};

export default Paper;
