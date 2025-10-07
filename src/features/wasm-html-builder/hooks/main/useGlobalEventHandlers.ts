import { useEffect } from 'react';
import { useWasmBuilderState } from './useWasmBuilderState';

interface UseGlobalEventHandlersProps {
  state: ReturnType<typeof useWasmBuilderState>;
  dragHandlers: any;
}

export const useGlobalEventHandlers = ({
  state,
  dragHandlers,
}: UseGlobalEventHandlersProps) => {
  // Global mouse event handlers
  useEffect(() => {
    const handleGlobalMouseMove = dragHandlers.createGlobalMouseMoveHandler(
      state.isDragging,
      state.dragElementId
    );
    const handleGlobalMouseUp = dragHandlers.createGlobalMouseUpHandler(
      state.isDragging
    );

    if (state.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove, {
        passive: true,
      });
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [state.isDragging, state.dragElementId, dragHandlers]);

  // Global click handler to deselect elements when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isCanvasClick = target.closest('.canvas-container') === target;
      const isElementClick = target.closest('[data-element-id]');
      const isPaperClick = target.closest('[data-paper-id]');
      
      // Deselect elements when clicking on canvas or paper (but not on elements)
      if ((isCanvasClick || isPaperClick) && !isElementClick) {
        state.setSelectedElementId(null);
        state.setEditingElementId(null);
        state.setShowStylePanel(false);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [state.setSelectedElementId, state.setEditingElementId, state.setShowStylePanel]);
};
