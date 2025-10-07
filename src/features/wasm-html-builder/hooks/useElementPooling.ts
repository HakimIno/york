import { useRef, useCallback, useMemo } from 'react';
import { Element } from '../module/wasm-interface';

export interface ElementPoolOptions {
  /** Initial pool size */
  initialSize?: number;
  /** Maximum pool size */
  maxSize?: number;
  /** Element factory function */
  createElement: () => Element;
  /** Element reset function */
  resetElement: (element: Element) => void;
}

export interface ElementPoolReturn<T> {
  /** Get element from pool */
  getElement: () => T;
  /** Return element to pool */
  returnElement: (element: T) => void;
  /** Get pool statistics */
  getStats: () => {
    available: number;
    inUse: number;
    total: number;
  };
  /** Clear pool */
  clear: () => void;
}

/**
 * Hook for element pooling to reduce memory allocation/deallocation
 * Reuses element objects to improve performance with large datasets
 */
export function useElementPooling<T extends Element>(
  options: ElementPoolOptions
): ElementPoolReturn<T> {
  const {
    initialSize = 100,
    maxSize = 1000,
    createElement,
    resetElement
  } = options;

  const poolRef = useRef<T[]>([]);
  const inUseRef = useRef<Set<T>>(new Set());

  // Initialize pool
  useMemo(() => {
    if (poolRef.current.length === 0) {
      for (let i = 0; i < initialSize; i++) {
        poolRef.current.push(createElement() as T);
      }
    }
  }, [initialSize, createElement]);

  // Get element from pool
  const getElement = useCallback((): T => {
    let element: T;

    if (poolRef.current.length > 0) {
      // Reuse existing element
      element = poolRef.current.pop()!;
    } else {
      // Create new element if pool is empty
      element = createElement() as T;
    }

    // Reset element state
    resetElement(element);
    
    // Mark as in use
    inUseRef.current.add(element);

    return element;
  }, [createElement, resetElement]);

  // Return element to pool
  const returnElement = useCallback((element: T) => {
    if (inUseRef.current.has(element)) {
      // Remove from in-use set
      inUseRef.current.delete(element);

      // Reset element
      resetElement(element);

      // Return to pool if not at max size
      if (poolRef.current.length < maxSize) {
        poolRef.current.push(element);
      }
    }
  }, [resetElement, maxSize]);

  // Get pool statistics
  const getStats = useCallback(() => {
    return {
      available: poolRef.current.length,
      inUse: inUseRef.current.size,
      total: poolRef.current.length + inUseRef.current.size
    };
  }, []);

  // Clear pool
  const clear = useCallback(() => {
    poolRef.current = [];
    inUseRef.current.clear();
  }, []);

  return {
    getElement,
    returnElement,
    getStats,
    clear
  };
}

/**
 * Hook for batch element operations
 * Groups multiple element updates into single operations
 */
export function useBatchOperations<T extends Element>() {
  const batchRef = useRef<{
    adds: T[];
    updates: T[];
    removes: string[];
    timestamp: number;
  }>({
    adds: [],
    updates: [],
    removes: [],
    timestamp: 0
  });

  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add element to batch
  const addToBatch = useCallback((element: T) => {
    batchRef.current.adds.push(element);
    batchRef.current.timestamp = Date.now();
  }, []);

  // Update element in batch
  const updateInBatch = useCallback((element: T) => {
    batchRef.current.updates.push(element);
    batchRef.current.timestamp = Date.now();
  }, []);

  // Remove element from batch
  const removeFromBatch = useCallback((elementId: string) => {
    batchRef.current.removes.push(elementId);
    batchRef.current.timestamp = Date.now();
  }, []);

  // Execute batch operations
  const executeBatch = useCallback((
    onAdd: (elements: T[]) => void,
    onUpdate: (elements: T[]) => void,
    onRemove: (elementIds: string[]) => void
  ) => {
    const batch = batchRef.current;
    
    if (batch.adds.length > 0) {
      onAdd(batch.adds);
      batch.adds = [];
    }
    
    if (batch.updates.length > 0) {
      onUpdate(batch.updates);
      batch.updates = [];
    }
    
    if (batch.removes.length > 0) {
      onRemove(batch.removes);
      batch.removes = [];
    }
    
    batch.timestamp = 0;
  }, []);

  // Auto-execute batch after delay
  const scheduleBatchExecution = useCallback((
    onAdd: (elements: T[]) => void,
    onUpdate: (elements: T[]) => void,
    onRemove: (elementIds: string[]) => void,
    delay: number = 16 // ~60fps
  ) => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      executeBatch(onAdd, onUpdate, onRemove);
    }, delay);
  }, [executeBatch]);

  // Clear batch
  const clearBatch = useCallback(() => {
    batchRef.current = {
      adds: [],
      updates: [],
      removes: [],
      timestamp: 0
    };
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
  }, []);

  return {
    addToBatch,
    updateInBatch,
    removeFromBatch,
    executeBatch,
    scheduleBatchExecution,
    clearBatch,
    getBatchStats: () => ({
      adds: batchRef.current.adds.length,
      updates: batchRef.current.updates.length,
      removes: batchRef.current.removes.length,
      timestamp: batchRef.current.timestamp
    })
  };
}

/**
 * Hook for lazy loading elements
 * Loads elements on demand to reduce initial load time
 */
export function useLazyLoading<T extends Element>(
  options: {
    batchSize?: number;
    loadDelay?: number;
    preloadDistance?: number;
  } = {}
) {
  const {
    batchSize = 50,
    loadDelay = 100,
    preloadDistance = 200
  } = options;

  const loadedElementsRef = useRef<Set<string>>(new Set());
  const loadingQueueRef = useRef<string[]>([]);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load elements in batches
  const loadElements = useCallback((
    elementIds: string[],
    onLoad: (elementIds: string[]) => Promise<T[]>
  ) => {
    const unloadedIds = elementIds.filter(id => !loadedElementsRef.current.has(id));
    
    if (unloadedIds.length === 0) return Promise.resolve([]);

    return onLoad(unloadedIds).then(elements => {
      unloadedIds.forEach(id => loadedElementsRef.current.add(id));
      return elements;
    });
  }, []);

  // Schedule lazy loading
  const scheduleLazyLoad = useCallback((
    elementIds: string[],
    onLoad: (elementIds: string[]) => Promise<T[]>
  ) => {
    const newIds = elementIds.filter(id => 
      !loadedElementsRef.current.has(id) && 
      !loadingQueueRef.current.includes(id)
    );

    if (newIds.length === 0) return;

    loadingQueueRef.current.push(...newIds);

    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    loadingTimeoutRef.current = setTimeout(() => {
      const batch = loadingQueueRef.current.splice(0, batchSize);
      if (batch.length > 0) {
        loadElements(batch, onLoad);
      }
    }, loadDelay);
  }, [batchSize, loadDelay, loadElements]);

  // Check if element is loaded
  const isLoaded = useCallback((elementId: string) => {
    return loadedElementsRef.current.has(elementId);
  }, []);

  // Clear loaded elements
  const clearLoaded = useCallback(() => {
    loadedElementsRef.current.clear();
    loadingQueueRef.current = [];
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  }, []);

  return {
    loadElements,
    scheduleLazyLoad,
    isLoaded,
    clearLoaded,
    getStats: () => ({
      loaded: loadedElementsRef.current.size,
      queued: loadingQueueRef.current.length
    })
  };
}
