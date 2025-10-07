import { useCallback, useRef } from 'react';
import { useWasmEngine } from './useWasmEngine';
import { Element, ElementStyle } from '../module/wasm-interface';

/**
 * Optimized WASM actions with aggressive batching and debouncing
 * to prevent FPS drops when using StylePanel
 */
export const useOptimizedWasmActions = () => {
  const wasmEngine = useWasmEngine();
  
  // Batch updates to reduce WASM calls
  const styleUpdateBatch = useRef<Map<string, Partial<ElementStyle>>>(new Map());
  const contentUpdateBatch = useRef<Map<string, string>>(new Map());
  
  // Debounce timers
  const styleUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  const contentUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Batch processing flags
  const isProcessingStyleBatch = useRef(false);
  const isProcessingContentBatch = useRef(false);

  /**
   * Optimized style change handler with batching
   */
  const handleStyleChange = useCallback(
    (elementId: string, style: Partial<ElementStyle>) => {
      // Add to batch
      const existingBatch = styleUpdateBatch.current.get(elementId) || {};
      styleUpdateBatch.current.set(elementId, { ...existingBatch, ...style });

      // Clear existing timer
      if (styleUpdateTimer.current) {
        clearTimeout(styleUpdateTimer.current);
      }

      // Process batch after debounce
      styleUpdateTimer.current = setTimeout(async () => {
        if (isProcessingStyleBatch.current) return;
        isProcessingStyleBatch.current = true;

        try {
          const batch = new Map(styleUpdateBatch.current);
          styleUpdateBatch.current.clear();

          // Process all updates in a single WASM call if possible
          for (const [id, updates] of batch) {
            if (wasmEngine.updateElementStyle) {
              await wasmEngine.updateElementStyle(id, updates);
            }
          }
        } catch (error) {
          console.error('Error processing style batch:', error);
        } finally {
          isProcessingStyleBatch.current = false;
        }
      }, 200); // Increased debounce for better batching
    },
    [wasmEngine]
  );

  /**
   * Optimized content change handler with batching
   */
  const handleContentChange = useCallback(
    (elementId: string, content: string) => {
      // Add to batch
      contentUpdateBatch.current.set(elementId, content);

      // Clear existing timer
      if (contentUpdateTimer.current) {
        clearTimeout(contentUpdateTimer.current);
      }

      // Process batch after debounce
      contentUpdateTimer.current = setTimeout(async () => {
        if (isProcessingContentBatch.current) return;
        isProcessingContentBatch.current = true;

        try {
          const batch = new Map(contentUpdateBatch.current);
          contentUpdateBatch.current.clear();

          // Process all updates in a single WASM call if possible
          for (const [id, content] of batch) {
            if (wasmEngine.updateElementContent) {
              await wasmEngine.updateElementContent(id, content);
            }
          }
        } catch (error) {
          console.error('Error processing content batch:', error);
        } finally {
          isProcessingContentBatch.current = false;
        }
      }, 300); // Longer debounce for content updates
    },
    [wasmEngine]
  );

  /**
   * Force process all pending batches (useful for cleanup)
   */
  const flushBatches = useCallback(async () => {
    // Clear timers
    if (styleUpdateTimer.current) {
      clearTimeout(styleUpdateTimer.current);
      styleUpdateTimer.current = null;
    }
    if (contentUpdateTimer.current) {
      clearTimeout(contentUpdateTimer.current);
      contentUpdateTimer.current = null;
    }

    // Process style batch
    if (styleUpdateBatch.current.size > 0 && !isProcessingStyleBatch.current) {
      isProcessingStyleBatch.current = true;
      try {
        const batch = new Map(styleUpdateBatch.current);
        styleUpdateBatch.current.clear();

        for (const [id, updates] of batch) {
          if (wasmEngine.updateElementStyle) {
            await wasmEngine.updateElementStyle(id, updates);
          }
        }
      } catch (error) {
        console.error('Error flushing style batch:', error);
      } finally {
        isProcessingStyleBatch.current = false;
      }
    }

    // Process content batch
    if (contentUpdateBatch.current.size > 0 && !isProcessingContentBatch.current) {
      isProcessingContentBatch.current = true;
      try {
        const batch = new Map(contentUpdateBatch.current);
        contentUpdateBatch.current.clear();

        for (const [id, content] of batch) {
          if (wasmEngine.updateElementContent) {
            await wasmEngine.updateElementContent(id, content);
          }
        }
      } catch (error) {
        console.error('Error flushing content batch:', error);
      } finally {
        isProcessingContentBatch.current = false;
      }
    }
  }, [wasmEngine]);

  /**
   * Get current batch status for debugging
   */
  const getBatchStatus = useCallback(() => ({
    styleBatchSize: styleUpdateBatch.current.size,
    contentBatchSize: contentUpdateBatch.current.size,
    isProcessingStyle: isProcessingStyleBatch.current,
    isProcessingContent: isProcessingContentBatch.current,
  }), []);

  return {
    handleStyleChange,
    handleContentChange,
    flushBatches,
    getBatchStatus,
  };
};
