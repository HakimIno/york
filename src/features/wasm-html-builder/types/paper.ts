export type PaperSize = 'A4' | 'A5';
export type PaperOrientation = 'portrait' | 'landscape';

export interface PaperConfig {
  id: string;
  size: PaperSize;
  orientation: PaperOrientation;
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
}

export interface PaperDimensions {
  width: number;
  height: number;
}

export const PAPER_DIMENSIONS: Record<PaperSize, Record<PaperOrientation, PaperDimensions>> = {
  A4: {
    portrait: { width: 794, height: 1123 }, // A4 portrait at 96 DPI (standard web size)
    landscape: { width: 1123, height: 794 }, // A4 landscape at 96 DPI (standard web size)
  },
  A5: {
    portrait: { width: 559, height: 794 }, // A5 portrait at 96 DPI (standard web size)
    landscape: { width: 794, height: 559 }, // A5 landscape at 96 DPI (standard web size)
  },
};

export interface PaperManagerState {
  papers: PaperConfig[];
  selectedPaperId: string | null;
  nextPaperPosition: { x: number; y: number };
}

export interface PaperManagerActions {
  addPaper: (size: PaperSize, orientation: PaperOrientation) => PaperConfig;
  removePaper: (paperId: string) => void;
  selectPaper: (paperId: string) => void;
  updatePaperPosition: (paperId: string, x: number, y: number) => void;
  clearAllPapers: () => void;
}
