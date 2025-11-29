import React, { useCallback } from 'react';
import { Element } from '../../module/wasm-interface';
import { useWasmBuilderState } from '../useWasmBuilderState';
import { calculateCenterPosition } from '../../utils/paperPosition';

interface UseUndoRedoHandlersProps {
  wasmEngine: any;
  state: ReturnType<typeof useWasmBuilderState>;
  undoRedo: any;
}

export const useUndoRedoHandlers = ({
  wasmEngine,
  state,
  undoRedo,
}: UseUndoRedoHandlersProps) => {
  const centerPosition = calculateCenterPosition();
  const isRestoringState = React.useRef(false);

  const syncElementsToWasm = useCallback(
    (elements: Element[]) => {
      if (!wasmEngine.state.isLoaded) {
        console.warn('WASM not loaded, skipping sync');
        return;
      }

      try {
        console.log('Syncing', elements.length, 'elements to WASM');

        // Get current WASM elements
        const wasmElements = wasmEngine.getAllElements();
        const wasmElementIds = new Set(wasmElements.map((el: Element) => el.id));
        const targetElementIds = new Set(elements.map(el => el.id));

        // 1. Delete elements that don't exist in target state
        for (const wasmEl of wasmElements) {
          if (!targetElementIds.has(wasmEl.id)) {
            wasmEngine.deleteElement(wasmEl.id);
          }
        }

        // 2. Add or update elements
        for (const element of elements) {
          if (wasmElementIds.has(element.id)) {
            // Update existing element
            wasmEngine.updateElementPosition(element.id, element.x, element.y);
            wasmEngine.updateElementSize(element.id, element.width, element.height);
            wasmEngine.updateElementStyle(element.id, element.style);
            wasmEngine.updateElementContent(element.id, element.content);
          } else {
            // Create new element with the same ID
            const wasmElement = wasmEngine.createElement(
              element.elementType,
              element.x,
              element.y
            );

            if (wasmElement) {
              // If IDs don't match, we need to recreate with correct ID
              if (wasmElement.id !== element.id) {
                wasmEngine.deleteElement(wasmElement.id);
                // For now, just use the new ID since we can't force a specific ID
                // This is a limitation we'll work around by using the element data
              } else {
                wasmEngine.updateElementStyle(wasmElement.id, element.style);
                wasmEngine.updateElementContent(wasmElement.id, element.content);
                wasmEngine.updateElementSize(wasmElement.id, element.width, element.height);
              }
            }
          }
        }

        console.log('WASM sync completed');
      } catch (error) {
        console.error('Error syncing elements to WASM:', error);
        state.setError('Error syncing undo/redo state');
      }
    },
    [wasmEngine, state.setError]
  );

  const handleUndo = useCallback(() => {
    console.log('[Handler] handleUndo called | canUndo:', undoRedo.canUndo);
    
    if (!undoRedo.canUndo || isRestoringState.current) {
      console.log('[Handler] Cannot undo: no more history or already restoring');
      return;
    }

    isRestoringState.current = true;

    try {
      const previousState = undoRedo.undo();
      if (previousState) {
        console.log('[Handler] ✓ Restoring previous state with', previousState.length, 'elements');
        
        // Sync to WASM first
        syncElementsToWasm(previousState);
        
        // Then update React state
        state.setElements(previousState);
        
        // Clear selection if the selected element no longer exists
        if (state.selectedElementId) {
          const stillExists = previousState.some((el: Element) => el.id === state.selectedElementId);
          if (!stillExists) {
            state.setSelectedElementId(null);
            state.setEditingElementId(null);
          }
        }
        
        console.log('[Handler] ✓ Undo completed | canUndo:', undoRedo.canUndo, '| canRedo:', undoRedo.canRedo);
      } else {
        console.error('[Handler] ✗ Undo failed - no previous state returned');
      }
    } finally {
      // Clear flag after state update completes
      Promise.resolve().then(() => {
        isRestoringState.current = false;
      });
    }
  }, [
    undoRedo,
    syncElementsToWasm,
    state,
  ]);

  const handleRedo = useCallback(() => {
    console.log('[Handler] handleRedo called | canRedo:', undoRedo.canRedo);
    
    if (!undoRedo.canRedo || isRestoringState.current) {
      console.log('[Handler] Cannot redo: no more history or already restoring');
      return;
    }

    isRestoringState.current = true;

    try {
      const nextState = undoRedo.redo();
      if (nextState) {
        console.log('[Handler] ✓ Restoring next state with', nextState.length, 'elements');
        
        // Sync to WASM first
        syncElementsToWasm(nextState);
        
        // Then update React state
        state.setElements(nextState);
        
        // Clear selection if the selected element no longer exists
        if (state.selectedElementId) {
          const stillExists = nextState.some((el: Element) => el.id === state.selectedElementId);
          if (!stillExists) {
            state.setSelectedElementId(null);
            state.setEditingElementId(null);
          }
        }
        
        console.log('[Handler] ✓ Redo completed | canUndo:', undoRedo.canUndo, '| canRedo:', undoRedo.canRedo);
      } else {
        console.error('[Handler] ✗ Redo failed - no next state returned');
      }
    } finally {
      // Clear flag after state update completes
      Promise.resolve().then(() => {
        isRestoringState.current = false;
      });
    }
  }, [
    undoRedo,
    syncElementsToWasm,
    state,
  ]);

  return {
    handleUndo,
    handleRedo,
    syncElementsToWasm,
  };
};
