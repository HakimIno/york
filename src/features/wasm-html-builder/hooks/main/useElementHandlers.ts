import { useCallback } from 'react';
import { Element } from '../module/wasm-interface';
import { useWasmBuilderState } from './useWasmBuilderState';
import { useWasmBuilderActions } from './useWasmBuilderActions';

interface UseElementHandlersProps {
  wasmEngine: any;
  state: ReturnType<typeof useWasmBuilderState>;
  actions: ReturnType<typeof useWasmBuilderActions>;
  copyPaste: any;
  undoRedo: any;
}

export const useElementHandlers = ({
  wasmEngine,
  state,
  actions,
  copyPaste,
  undoRedo,
}: UseElementHandlersProps) => {
  const handleElementSelect = useCallback(
    (elementId: string) => {
      state.setSelectedElementId(elementId);
      state.setEditingElementId(null);
    },
    [state.setSelectedElementId, state.setEditingElementId]
  );

  const handleToggleLock = useCallback(
    (elementId: string) => {
      state.setLockedElements(prev => {
        const newSet = new Set(prev);
        if (newSet.has(elementId)) {
          newSet.delete(elementId);
        } else {
          newSet.add(elementId);
        }
        return newSet;
      });
    },
    [state.setLockedElements]
  );

  const handleStartEdit = useCallback(
    (elementId: string) => {
      if (state.lockedElements.has(elementId)) {
        state.setError('Element is locked and cannot be edited');
        return;
      }
      state.setEditingElementId(elementId);
      state.setSelectedElementId(elementId);
    },
    [
      state.lockedElements,
      state.setEditingElementId,
      state.setSelectedElementId,
      state.setError,
    ]
  );

  const handleEndEdit = useCallback(() => {
    state.setEditingElementId(null);
  }, [state.setEditingElementId]);

  const handleMouseUp = useCallback(() => {
    if (state.isDragging) {
      wasmEngine.endDrag();
      state.setIsDragging(false);
      state.setDragElementId(null);
    }
  }, [
    state.isDragging,
    wasmEngine,
    state.setIsDragging,
    state.setDragElementId,
  ]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        state.setSelectedElementId(null);
        state.setEditingElementId(null);
        state.setShowStylePanel(false);
      }
    },
    [
      state.setSelectedElementId,
      state.setEditingElementId,
      state.setShowStylePanel,
    ]
  );

  const handlePasteElement = useCallback(() => {
    if (!copyPaste.hasCopiedElement) return;

    const pastedElement = copyPaste.pasteElement();
    if (pastedElement) {
      const wasmElement = wasmEngine.createElement(
        pastedElement.elementType,
        pastedElement.x,
        pastedElement.y
      );

      if (wasmElement) {
        wasmEngine.updateElementStyle(wasmElement.id, pastedElement.style);
        wasmEngine.updateElementContent(wasmElement.id, pastedElement.content);
        wasmEngine.updateElementSize(
          wasmElement.id,
          pastedElement.width,
          pastedElement.height
        );

        const finalElement: Element = {
          ...wasmElement,
          style: { ...pastedElement.style },
          content: pastedElement.content,
          width: pastedElement.width,
          height: pastedElement.height,
        };

        state.setElements(prevElements => [...prevElements, finalElement]);
        state.setSelectedElementId(finalElement.id);
        undoRedo.saveState(
          [...state.elements, finalElement],
          'paste_element',
          `Pasted ${pastedElement.elementType}`
        );
      }
    }
  }, [
    copyPaste,
    wasmEngine,
    state.elements,
    state.setElements,
    state.setSelectedElementId,
    undoRedo,
  ]);

  const handleCopyElement = useCallback(() => {
    if (state.selectedElementId) {
      const element = state.getElementById(state.selectedElementId);
      if (element) {
        copyPaste.copyElement(element);
      }
    }
  }, [state.selectedElementId, state.getElementById, copyPaste]);

  const handleCopyElementFromId = useCallback((elementId: string) => {
    const element = state.getElementById(elementId);
    if (element) {
      copyPaste.copyElement(element);
    }
  }, [state.getElementById, copyPaste]);

  const handleDebug = useCallback(() => {
    console.log('=== DEBUG INFO ===');
    console.log('React Elements:', state.elements.length, state.elements);
    console.log('WASM Elements:', wasmEngine.getAllElements());
    console.log('Selected Element ID:', state.selectedElementId);
    console.log('Locked Elements:', Array.from(state.lockedElements));
    console.log('Style Template:', state.styleTemplate);
    console.log('Undo/Redo History:', undoRedo.getHistorySize());
  }, [state.elements, state.selectedElementId, state.lockedElements, state.styleTemplate, wasmEngine, undoRedo]);

  return {
    handleElementSelect,
    handleToggleLock,
    handleStartEdit,
    handleEndEdit,
    handleMouseUp,
    handleCanvasClick,
    handlePasteElement,
    handleCopyElement,
    handleCopyElementFromId,
    handleDebug,
  };
};
