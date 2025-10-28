import { Element } from '../module/wasm-interface';

interface DragHandlersProps {
  wasmEngine: any;
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  selectedElementId: string | null;
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
  lockedElements: Set<string>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  setDragElementId: React.Dispatch<React.SetStateAction<string | null>>;
  dragThrottleRef: React.MutableRefObject<number>;
  pendingUpdatesRef: React.MutableRefObject<
    Map<string, { x: number; y: number; width: number; height: number }>
  >;
  undoRedo: any; // Add undoRedo to save state after drag
}

export const createDragHandlers = ({
  wasmEngine,
  elements,
  setElements,
  selectedElementId,
  setSelectedElementId,
  lockedElements,
  setError,
  setIsDragging,
  setDragElementId,
  dragThrottleRef,
  pendingUpdatesRef,
  undoRedo,
}: DragHandlersProps) => {
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();

    // Check if element is locked
    if (lockedElements.has(elementId)) {
      setError('Element is locked and cannot be moved');
      return;
    }

    // Check if element exists in React state
    const element = elements.find(el => el.id === elementId);
    if (!element) {
      console.error('Element not found in React state:', elementId);
      setError('Element not found - please refresh');
      return;
    }

    try {
      setError(null);

      // Verify WASM has the element before starting drag
      const wasmElement = wasmEngine.getElement(elementId);
      if (!wasmElement) {
        console.warn('Element not found in WASM, syncing...');
        // Try to sync this element to WASM
        const newWasmElement = wasmEngine.createElement(
          element.element_type,
          element.x,
          element.y
        );

        if (newWasmElement) {
          // Update React state with new WASM ID
          setElements(prevElements =>
            prevElements.map(el =>
              el.id === elementId ? { ...el, id: newWasmElement.id } : el
            )
          );

          // Update selection
          if (selectedElementId === elementId) {
            setSelectedElementId(newWasmElement.id);
          }

          // Use new ID for drag
          elementId = newWasmElement.id;

          // Apply current properties to WASM
          wasmEngine.updateElementStyle(newWasmElement.id, element.style);
          wasmEngine.updateElementContent(newWasmElement.id, element.content);
          wasmEngine.updateElementSize(
            newWasmElement.id,
            element.width,
            element.height
          );
        } else {
          setError('Failed to sync element to WASM');
          return;
        }
      }

      setIsDragging(true);
      setDragElementId(elementId);

      const success = wasmEngine.startDrag(elementId, e.clientX, e.clientY);
      if (!success) {
        setIsDragging(false);
        setDragElementId(null);
        setError(
          'Failed to start dragging element - element may not exist in WASM'
        );
        console.error('startDrag failed for element:', elementId);
      }
    } catch (error) {
      console.error('Error starting drag:', error);
      setIsDragging(false);
      setDragElementId(null);
      setError('Error starting drag operation: ' + (error as Error).message);
    }
  };

  const createGlobalMouseMoveHandler = (
    isDragging: boolean,
    dragElementId: string | null
  ) => {
    const THROTTLE_MS = 16; // ~60fps

    return (e: MouseEvent) => {
      if (isDragging && dragElementId) {
        const now = performance.now();
        if (now - dragThrottleRef.current < THROTTLE_MS) return;
        dragThrottleRef.current = now;

        try {
          // Store pending update for batching
          pendingUpdatesRef.current.set(dragElementId, {
            x: e.clientX,
            y: e.clientY,
            width: 0, // Not updating width during drag
            height: 0, // Not updating height during drag
          });

          // Batch update using requestAnimationFrame
          requestAnimationFrame(() => {
            try {
              const result = wasmEngine.updateDrag(
                e.clientX,
                e.clientY,
                1.0,
                0,
                0
              );
              if (result && result.is_valid) {
                setElements(prevElements =>
                  prevElements.map(el =>
                    el.id === dragElementId
                      ? {
                          ...el,
                          x: result.new_position.x,
                          y: result.new_position.y,
                        }
                      : el
                  )
                );
                // Clear pending update
                pendingUpdatesRef.current.delete(dragElementId);
              }
            } catch (error) {
              console.error('Error updating drag:', error);
              setError('Error during drag operation');
            }
          });
        } catch (error) {
          console.error('Error in mouse move handler:', error);
          setError('Error during mouse move');
        }
      }
    };
  };

  const createGlobalMouseUpHandler = (isDragging: boolean, dragElementId: string | null) => {
    return () => {
      if (isDragging && dragElementId) {
        try {
          wasmEngine.endDrag();
          setIsDragging(false);
          setDragElementId(null);
          
          // Clear any pending updates
          pendingUpdatesRef.current.clear();
          
          // Save state after drag completes for undo/redo
          // Use setTimeout to ensure React state has updated before saving
          setTimeout(() => {
            console.log('[Drag] Saving state after drag completed');
            // Get latest elements from WASM to ensure position is up-to-date
            const currentElements = wasmEngine.getAllElements();
            undoRedo.saveState(
              currentElements,
              'drag_element',
              `Moved element ${dragElementId}`
            );
          }, 50);
        } catch (error) {
          console.error('Error ending drag:', error);
          setError('Error ending drag operation');
          setIsDragging(false);
          setDragElementId(null);
        }
      }
    };
  };

  return {
    handleMouseDown,
    createGlobalMouseMoveHandler,
    createGlobalMouseUpHandler,
  };
};
