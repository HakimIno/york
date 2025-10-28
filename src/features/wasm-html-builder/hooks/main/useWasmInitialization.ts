import React, { useEffect, useMemo } from 'react';
import { useWasmBuilderState } from '../useWasmBuilderState';
import { calculateCenterPosition } from '../../utils/paperPosition';
import { Element } from '../../module/wasm-interface';

interface UseWasmInitializationProps {
  wasmEngine: any;
  state: ReturnType<typeof useWasmBuilderState>;
  undoRedo: any;
}

export const useWasmInitialization = ({
  wasmEngine,
  state,
  undoRedo,
}: UseWasmInitializationProps) => {
  const centerPosition = useMemo(() => calculateCenterPosition(), []);
  const elementsCount = useMemo(() => state.elements.length, [state.elements.length]);

  // Initialize papers - start with 1 A4 paper centered (ONLY ONCE)
  const hasInitializedPaperRef = React.useRef(false);
  
  useEffect(() => {
    if (wasmEngine.state.isLoaded && wasmEngine.state.engine && !hasInitializedPaperRef.current) {
      console.log('[INIT] Starting WASM initialization...');
      hasInitializedPaperRef.current = true;
      
      const timer = setTimeout(() => {
        try {
          // Check if papers already exist (might be from restore/undo)
          const existingPapers = wasmEngine.getA4Papers();
          if (existingPapers && existingPapers.length > 0) {
            console.log('[INIT] Papers already exist, using existing papers:', existingPapers.length);
            state.setPapers(existingPapers);
            return;
          }
          
          const { x: centerX, y: centerY } = centerPosition;
          const paper1 = wasmEngine.createPaper("paper-1", "A4", "Portrait", centerX, centerY);
          if (paper1) {
            state.setPapers([paper1]);
            console.log('[INIT] ✓ Initial paper created:', paper1.id);
          }
          wasmEngine.setViewportSize(window.innerWidth, window.innerHeight);
          wasmEngine.fitToViewport(10);
          
          // Save initial empty state for undo/redo
          undoRedo.saveState([], 'initial_state', 'Initial empty canvas');
          
          console.log('[INIT] ✓ WASM engine setup completed');
        } catch (error) {
          console.error('[INIT] ✗ Error setting up WASM engine:', error);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [wasmEngine.state.isLoaded, wasmEngine.state.engine]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      state.cleanup();
      // Don't reset initialization flag on cleanup to prevent re-initialization
    };
  }, [state.cleanup]);

  // NOTE: Auto-save removed - state is now saved manually on each user action
  // This prevents conflicts during undo/redo operations

  // Refresh elements - ONLY ONCE when WASM engine is first loaded
  const hasInitializedRef = React.useRef(false);
  
  useEffect(() => {
    if (wasmEngine.state.isLoaded && wasmEngine.state.engine && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      const timer = setTimeout(() => {
        const allElements = wasmEngine.getAllElements();
        if (allElements.length > 0) {
          if (state.styleTemplate) {
            state.setElements(
              allElements.map((wasmElement: Element) => ({
                ...wasmElement,
                style: { ...wasmElement.style, ...state.styleTemplate },
              }))
            );
          } else {
            state.setElements(allElements);
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [wasmEngine.state.isLoaded, wasmEngine.state.engine]);

  return {
    centerPosition,
    elementsCount,
  };
};
