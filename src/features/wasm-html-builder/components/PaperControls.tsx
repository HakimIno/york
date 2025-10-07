import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { PaperConfig, PaperSize, PaperOrientation, PAPER_DIMENSIONS } from '../types/paper';
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

interface PaperControlsProps {
  papers: PaperConfig[];
  selectedPaperId: string | null;
  onAddPaper: (size: PaperSize, orientation: PaperOrientation) => void;
  onSelectPaper: (paperId: string) => void;
  onRemovePaper: (paperId: string) => void;
  onClearAllPapers: () => void;
}

const PaperControls: React.FC<PaperControlsProps> = ({
  papers,
  selectedPaperId,
  onAddPaper,
  onSelectPaper,
  onRemovePaper,
  onClearAllPapers,
}) => {
  const getPaperDisplayName = (paper: PaperConfig): string => {
    return `${paper.size} ${paper.orientation}`;
  };

  const getPaperDimensions = (size: PaperSize, orientation: PaperOrientation): string => {
    const dims = PAPER_DIMENSIONS[size][orientation];
    return `${dims.width} × ${dims.height}px (144 DPI)`;
  };

  return (
    <div className="border-b bg-background dark:bg-neutral-950 px-4 w-full">
      <div className=" flex h-10 items-center justify-between w-full">
        {/* Paper List */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-muted-foreground">
            Papers ({papers.length})
          </span>
          
          <Separator orientation="vertical" className="h-4" />
          
          {/* Paper Tabs */}
          <div className="flex space-x-1">
            {papers.map((paper) => (
              <Button
                key={paper.id}
                variant={selectedPaperId === paper.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSelectPaper(paper.id)}
                className="h-7 px-2 text-xs"
              >
                <Icon 
                  icon={paper.orientation === 'portrait' ? 'lucide:file-text' : 'lucide:file-horizontal'} 
                  className="h-3 w-3 mr-1" 
                />
                <span className="hidden sm:inline">{getPaperDisplayName(paper)}</span>
                <span className="sm:hidden">{paper.size}</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePaper(paper.id);
                  }}
                  className="ml-1 h-4 w-4 p-0 text-muted-foreground hover:text-destructive cursor-pointer flex items-center justify-center rounded-sm hover:bg-destructive/10 transition-colors"
                  title="ลบกระดาษ"
                >
                  <Icon icon="lucide:x" className="h-3 w-3" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Add Paper Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-7">
              <Icon icon="lucide:plus" className="h-3 w-3 mr-1" />
              Add Paper
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Paper Size</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* A4 Options */}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              A4 (210 × 297 mm)
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onAddPaper('A4', 'portrait')}
              className="flex items-center space-x-2"
            >
              <Icon icon="lucide:file-text" className="h-4 w-4" />
              <div>
                <div className="text-sm">A4 Portrait</div>
                <div className="text-xs text-muted-foreground">794 × 1123px</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => onAddPaper('A4', 'landscape')}
              className="flex items-center space-x-2"
            >
              <Icon icon="lucide:file-horizontal" className="h-4 w-4" />
              <div>
                <div className="text-sm">A4 Landscape</div>
                <div className="text-xs text-muted-foreground">1123 × 794px</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            {/* A5 Options */}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              A5 (148 × 210 mm)
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onAddPaper('A5', 'portrait')}
              className="flex items-center space-x-2"
            >
              <Icon icon="lucide:file-text" className="h-4 w-4" />
              <div>
                <div className="text-sm">A5 Portrait</div>
                <div className="text-xs text-muted-foreground">559 × 794px</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => onAddPaper('A5', 'landscape')}
              className="flex items-center space-x-2"
            >
              <Icon icon="lucide:file-horizontal" className="h-4 w-4" />
              <div>
                <div className="text-sm">A5 Landscape</div>
                <div className="text-xs text-muted-foreground">794 × 559px</div>
              </div>
            </DropdownMenuItem>

            {/* Clear All Button */}
            {papers.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onClearAllPapers}
                  className="text-destructive focus:text-destructive"
                >
                  <Icon icon="lucide:trash-2" className="h-4 w-4 mr-2" />
                  Clear All Papers
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default PaperControls;
