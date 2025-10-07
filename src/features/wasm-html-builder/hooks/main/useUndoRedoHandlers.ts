import { useCallback } from 'react';
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

  const syncElementsToWasm = useCallback(
    async (elements: Element[]) => {
      try {
        console.log('Starting WASM sync for', elements.length, 'elements');
        wasmEngine.reset();

        const { x: centerX, y: centerY } = centerPosition;
        
        const paper1 = wasmEngine.createPaper("paper-1", "A4", "Portrait", centerX, centerY);
        if (paper1) {
          state.setPapers([paper1]);
        }

        const idMapping = new Map<string, string>();
        const syncedElements: Element[] = [];

        for (const element of elements) {
          const wasmElement = wasmEngine.createElement(
            element.element_type,
            element.x,
            element.y
          );

          if (wasmElement) {
            idMapping.set(element.id, wasmElement.id);
            wasmEngine.updateElementStyle(wasmElement.id, element.style);
            wasmEngine.updateElementContent(wasmElement.id, element.content);
            wasmEngine.updateElementSize(
              wasmElement.id,
              element.width,
              element.height
            );

            const syncedElement: Element = {
              ...element,
              id: wasmElement.id,
            };
            syncedElements.push(syncedElement);
          }
        }

        state.setElements(syncedElements);

        if (state.selectedElementId && idMapping.has(state.selectedElementId)) {
          const newSelectedId = idMapping.get(state.selectedElementId);
          state.setSelectedElementId(newSelectedId || null);
        } else {
          state.setSelectedElementId(null);
        }

        console.log('Successfully synced', syncedElements.length, 'elements to WASM');
      } catch (error) {
        console.error('Error syncing elements to WASM:', error);
        state.setError('Error syncing undo/redo state');
      }
    },
    [
      wasmEngine,
      state.selectedElementId,
      state.setPapers,
      state.setElements,
      state.setSelectedElementId,
      state.setError,
      centerPosition,
    ]
  );

  const handleUndo = useCallback(() => {
    const previousState = undoRedo.undo();
    if (previousState) {
      state.setElements(previousState);
      state.setSelectedElementId(null);
      state.setEditingElementId(null);
      syncElementsToWasm(previousState);
    }
  }, [
    undoRedo,
    syncElementsToWasm,
    state.setElements,
    state.setSelectedElementId,
    state.setEditingElementId,
  ]);

  const handleRedo = useCallback(() => {
    const nextState = undoRedo.redo();
    if (nextState) {
      state.setElements(nextState);
      state.setSelectedElementId(null);
      state.setEditingElementId(null);
      syncElementsToWasm(nextState);
    }
  }, [
    undoRedo,
    syncElementsToWasm,
    state.setElements,
    state.setSelectedElementId,
    state.setEditingElementId,
  ]);

  return {
    handleUndo,
    handleRedo,
    syncElementsToWasm,
  };
};
