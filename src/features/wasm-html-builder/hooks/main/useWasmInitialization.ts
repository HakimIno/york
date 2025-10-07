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

  // Initialize papers - start with 1 A4 paper centered
  useEffect(() => {
    if (wasmEngine.state.isLoaded && wasmEngine.state.engine) {
      const timer = setTimeout(() => {
        try {
          const { x: centerX, y: centerY } = centerPosition;
          const paper1 = wasmEngine.createPaper("paper-1", "A4", "Portrait", centerX, centerY);
          if (paper1) {
            state.setPapers([paper1]);
            console.log('Initial paper created at center:', centerX, centerY);
          }
          wasmEngine.setViewportSize(window.innerWidth, window.innerHeight);
          wasmEngine.fitToViewport(10);
          console.log('WASM engine setup completed');
        } catch (error) {
          console.error('Error setting up WASM engine:', error);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [wasmEngine.state.isLoaded, wasmEngine.state.engine, state.setPapers, centerPosition]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => state.cleanup();
  }, [state.cleanup]);

  // Save state for undo/redo when elements change
  const lastElementsCountRef = React.useRef(0);
  const saveStateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (elementsCount !== lastElementsCountRef.current && elementsCount > 0) {
      lastElementsCountRef.current = elementsCount;

      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }

      saveStateTimeoutRef.current = setTimeout(() => {
        undoRedo.saveState(
          state.elements,
          'elements_changed',
          `Elements count: ${elementsCount}`
        );
      }, 500);
    }

    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }
    };
  }, [elementsCount, state.elements, undoRedo]);

  // Refresh elements - only when WASM engine is loaded
  useEffect(() => {
    if (wasmEngine.state.isLoaded && wasmEngine.state.engine) {
      const timer = setTimeout(() => {
        const allElements = wasmEngine.getAllElements();
        if (state.styleTemplate) {
          state.setElements(prevElements => {
            return allElements.map((wasmElement: Element) => {
              const existingElement = state.getElementById(wasmElement.id);
              if (!existingElement) {
                return {
                  ...wasmElement,
                  style: { ...wasmElement.style, ...state.styleTemplate },
                };
              }
              return existingElement;
            });
          });
        } else {
          state.setElements(allElements);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    wasmEngine.state.isLoaded,
    wasmEngine.state.engine,
    state.styleTemplate,
    state.setElements,
    state.getElementById,
  ]);

  return {
    centerPosition,
    elementsCount,
  };
};
