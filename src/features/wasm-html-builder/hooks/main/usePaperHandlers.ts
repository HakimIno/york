import { useCallback, useState, useRef, useEffect } from 'react';
import { useWasmBuilderState } from '../useWasmBuilderState';
import { calculateCenterPosition } from '../../utils/paperPosition';

interface UsePaperHandlersProps {
  wasmEngine: any;
  state: ReturnType<typeof useWasmBuilderState>;
}

export const usePaperHandlers = ({
  wasmEngine,
  state,
}: UsePaperHandlersProps) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const centerPosition = calculateCenterPosition();
  const papersRef = useRef(state.papers);
  
  // Keep ref in sync
  useEffect(() => {
    papersRef.current = state.papers;
  }, [state.papers]);

  const handleAddPaper = useCallback(
    (size: 'A4' | 'A5', orientation: 'portrait' | 'landscape') => {
      if (!wasmEngine.state?.isLoaded) {
        console.warn('WASM not loaded yet');
        return;
      }
      
      try {
        const paperId = `${size.toLowerCase()}-paper-${Date.now()}`;
        const currentPapers = papersRef.current;
        const paperSpacing = 50;
        const { x: centerX, y: centerY } = centerPosition;
        
        let newY = centerY;
        if (currentPapers.length > 0) {
          const maxY = Math.max(...currentPapers.map(p => p.y + p.height));
          newY = maxY + paperSpacing;
        }
        
        console.log(`Creating paper at position:`, { x: centerX, y: newY });
        const wasmPaper = wasmEngine.createPaper(paperId, size, orientation.charAt(0).toUpperCase() + orientation.slice(1), centerX, newY);
        
        if (wasmPaper) {
          const allPapers = wasmEngine.getA4Papers();
          state.setPapers(allPapers);
          console.log(`Created ${size} ${orientation} paper:`, paperId, 'Total papers:', allPapers.length);
        } else {
          console.error('Failed to create paper in WASM');
        }
      } catch (error) {
        console.error('Error adding paper:', error);
        state.setError('Error adding paper');
      }
    },
    [wasmEngine, state.setPapers, state.setError, centerPosition]
  );

  const handleRemovePaper = useCallback(
    (paperId: string) => {
      try {
        const success = wasmEngine.removePaper(paperId);
        
        if (success) {
          const allPapers = wasmEngine.getA4Papers();
          state.setPapers(allPapers);
          console.log('Removed paper:', paperId);
        }
      } catch (error) {
        console.error('Error removing paper:', error);
        state.setError('Error removing paper');
      }
    },
    [wasmEngine, state.setPapers, state.setError]
  );

  const handleSelectPaper = useCallback(
    (paperId: string) => {
      setSelectedPaperId(paperId);
    },
    []
  );

  const handleClearAllPapers = useCallback(() => {
    try {
      wasmEngine.reset();
      state.setPapers([]);
      setSelectedPaperId(null);
      console.log('Cleared all papers');
    } catch (error) {
      console.error('Error clearing papers:', error);
      state.setError('Error clearing papers');
    }
  }, [wasmEngine, state.setPapers, state.setError]);

  return {
    selectedPaperId,
    setSelectedPaperId,
    handleAddPaper,
    handleRemovePaper,
    handleSelectPaper,
    handleClearAllPapers,
  };
};
