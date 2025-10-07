import { useState, useCallback, useRef } from 'react';
import { 
  PaperConfig, 
  PaperSize, 
  PaperOrientation, 
  PaperManagerState, 
  PaperManagerActions,
  PAPER_DIMENSIONS 
} from '../types/paper';
import { calculateCenterPosition } from '../utils/paperPosition';

const PAPER_SPACING = 50; // ระยะห่างระหว่างกระดาษ

const INITIAL_POSITION = calculateCenterPosition();
const INITIAL_PAPER_X = INITIAL_POSITION.x;
const INITIAL_PAPER_Y = INITIAL_POSITION.y;

export const usePaperManager = (initialPapers: PaperConfig[] = []) => {
  const [state, setState] = useState<PaperManagerState>(() => {
    // คำนวณตำแหน่งกระดาษถัดไป
    let nextY = INITIAL_PAPER_Y;
    if (initialPapers.length > 0) {
      const lastPaper = initialPapers[initialPapers.length - 1];
      nextY = lastPaper.y + lastPaper.height + PAPER_SPACING;
    }

    return {
      papers: initialPapers,
      selectedPaperId: initialPapers.length > 0 ? initialPapers[0].id : null,
      nextPaperPosition: { x: INITIAL_PAPER_X, y: nextY },
    };
  });

  const paperCounterRef = useRef(initialPapers.length);

  const addPaper = useCallback((size: PaperSize, orientation: PaperOrientation) => {
    const dimensions = PAPER_DIMENSIONS[size][orientation];
    const paperId = `paper-${++paperCounterRef.current}`;
    
    const newPaper: PaperConfig = {
      id: paperId,
      size,
      orientation,
      x: state.nextPaperPosition.x,
      y: state.nextPaperPosition.y,
      width: dimensions.width,
      height: dimensions.height,
      title: `${size} ${orientation}`,
    };

    setState(prevState => {
      const newPapers = [...prevState.papers, newPaper];
      const nextY = newPaper.y + newPaper.height + PAPER_SPACING;
      
      return {
        papers: newPapers,
        selectedPaperId: paperId,
        nextPaperPosition: { x: prevState.nextPaperPosition.x, y: nextY },
      };
    });

    return newPaper;
  }, [state.nextPaperPosition]);

  const removePaper = useCallback((paperId: string) => {
    setState(prevState => {
      const newPapers = prevState.papers.filter(paper => paper.id !== paperId);
      
      // คำนวณตำแหน่งใหม่สำหรับกระดาษที่เหลือ
      let currentY = INITIAL_PAPER_Y;
      const repositionedPapers = newPapers.map(paper => {
        const repositionedPaper = {
          ...paper,
          y: currentY,
        };
        currentY += paper.height + PAPER_SPACING;
        return repositionedPaper;
      });

      const nextY = repositionedPapers.length > 0 
        ? repositionedPapers[repositionedPapers.length - 1].y + 
          repositionedPapers[repositionedPapers.length - 1].height + PAPER_SPACING
        : INITIAL_PAPER_Y;

      return {
        papers: repositionedPapers,
        selectedPaperId: prevState.selectedPaperId === paperId 
          ? (repositionedPapers.length > 0 ? repositionedPapers[0].id : null)
          : prevState.selectedPaperId,
        nextPaperPosition: { x: INITIAL_PAPER_X, y: nextY },
      };
    });
  }, []);

  const selectPaper = useCallback((paperId: string) => {
    setState(prevState => ({
      ...prevState,
      selectedPaperId: paperId,
    }));
  }, []);

  const updatePaperPosition = useCallback((paperId: string, x: number, y: number) => {
    setState(prevState => ({
      ...prevState,
      papers: prevState.papers.map(paper =>
        paper.id === paperId ? { ...paper, x, y } : paper
      ),
    }));
  }, []);

  const clearAllPapers = useCallback(() => {
    setState({
      papers: [],
      selectedPaperId: null,
      nextPaperPosition: { x: INITIAL_PAPER_X, y: INITIAL_PAPER_Y },
    });
    paperCounterRef.current = 0;
  }, []);

  const getSelectedPaper = useCallback((): PaperConfig | null => {
    return state.papers.find(paper => paper.id === state.selectedPaperId) || null;
  }, [state.papers, state.selectedPaperId]);

  const getPaperById = useCallback((paperId: string): PaperConfig | null => {
    return state.papers.find(paper => paper.id === paperId) || null;
  }, [state.papers]);

  const actions: PaperManagerActions = {
    addPaper,
    removePaper,
    selectPaper,
    updatePaperPosition,
    clearAllPapers,
  };

  return {
    state,
    actions,
    getSelectedPaper,
    getPaperById,
  };
};
