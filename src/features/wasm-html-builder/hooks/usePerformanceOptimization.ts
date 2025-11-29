import { useState, useEffect, useCallback, useRef } from 'react';
import { useWasmEngine } from './useWasmEngine';
import { useElementPooling } from './useElementPooling';
import { useBatchOperations } from './useElementPooling';
import { useLazyLoading } from './useElementPooling';
import { Element } from '../module/wasm-interface';

export interface PerformanceOptimizationOptions {
  /** Enable virtual scrolling */
  enableVirtualScrolling?: boolean;
  /** Enable element pooling */
  enableElementPooling?: boolean;
  /** Enable batch operations */
  enableBatchOperations?: boolean;
  /** Enable lazy loading */
  enableLazyLoading?: boolean;
  /** Enable auto-optimization */
  enableAutoOptimization?: boolean;
  /** Performance monitoring interval (ms) */
  monitoringInterval?: number;
  /** Auto-optimization threshold */
  optimizationThreshold?: {
    maxElementsPerCell?: number;
    maxMemoryUsage?: number;
    minFPS?: number;
  };
}

export interface PerformanceOptimizationReturn {
  /** Current performance metrics */
  metrics: {
    elementsRendered: number;
    totalElements: number;
    memoryUsage: number;
    fps: number;
    spatialIndexOptimized: boolean;
  };
  /** Force optimization */
  optimize: () => void;
  /** Check if optimization is needed */
  needsOptimization: boolean;
  /** Auto-optimization status */
  autoOptimizationEnabled: boolean;
}

/**
 * Hook for comprehensive performance optimization
 * Combines multiple optimization strategies for handling large datasets
 */
export function usePerformanceOptimization(
  elements: Element[],
  options: PerformanceOptimizationOptions = {}
): PerformanceOptimizationReturn {
  const {
    enableVirtualScrolling = true,
    enableElementPooling = true,
    enableBatchOperations = true,
    enableLazyLoading = true,
    enableAutoOptimization = true,
    monitoringInterval = 2000,
    optimizationThreshold = {
      maxElementsPerCell: 50,
      maxMemoryUsage: 80,
      minFPS: 30
    }
  } = options;

  const wasmEngine = useWasmEngine();
  const [metrics, setMetrics] = useState({
    elementsRendered: 0,
    totalElements: 0,
    memoryUsage: 0,
    fps: 60,
    spatialIndexOptimized: false
  });

  const [needsOptimization, setNeedsOptimization] = useState(false);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(enableAutoOptimization);
  const lastOptimizationRef = useRef<number>(0);

  // Element pooling
  const elementPool = useElementPooling({
    initialSize: 100,
    maxSize: 1000,
    createElement: () => ({
      id: '',
      component_id: '',
      element_type: 'text',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      z_index: 0,
      visible: true,
      content: '',
      style: {
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        color: '#000000',
        backgroundColor: 'transparent',
        textAlign: 'left' as const,
        padding: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000'
      }
    } as Element),
    resetElement: (element: Element) => {
      element.id = '';
      element.componentId = '';
      element.content = '';
      element.style = {
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'normal' as const,
        fontStyle: 'normal' as const,
        color: '#000000',
        backgroundColor: 'transparent',
        textAlign: 'left' as const,
        padding: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000'
      };
    }
  });

  // Batch operations
  const batchOps = useBatchOperations<Element>();

  // Lazy loading
  const lazyLoading = useLazyLoading<Element>({
    batchSize: 50,
    loadDelay: 100,
    preloadDistance: 200
  });

  // Performance monitoring - only for large datasets
  useEffect(() => {
    if (!enableAutoOptimization || elements.length < 1000) return;

    const interval = setInterval(() => {
      try {
        // Get spatial index stats
        const spatialStats = wasmEngine.getSpatialIndexStats();
        if (spatialStats) {
          const currentMetrics = {
            elementsRendered: elements.length,
            totalElements: elements.length,
            memoryUsage: spatialStats.memory_usage_bytes / (1024 * 1024), // Convert to MB
            fps: 60, // This would come from performance monitor
            spatialIndexOptimized: spatialStats.average_elements_per_cell <= optimizationThreshold.maxElementsPerCell!
          };

          setMetrics(currentMetrics);

          // Check if optimization is needed
          const needsOpt = 
            spatialStats.average_elements_per_cell > optimizationThreshold.maxElementsPerCell! ||
            spatialStats.max_elements_per_cell > optimizationThreshold.maxElementsPerCell! * 2 ||
            currentMetrics.memoryUsage > optimizationThreshold.maxMemoryUsage!;

          setNeedsOptimization(needsOpt);

          // Auto-optimize if needed and enough time has passed
          if (needsOpt && autoOptimizationEnabled) {
            const now = Date.now();
            if (now - lastOptimizationRef.current > 10000) { // 10 second cooldown (increased)
              optimize();
              lastOptimizationRef.current = now;
            }
          }
        }
      } catch (error) {
        console.error('Error monitoring performance:', error);
      }
    }, Math.max(monitoringInterval, 5000)); // Minimum 5 second interval

    return () => clearInterval(interval);
  }, [
    enableAutoOptimization,
    elements.length,
    monitoringInterval,
    optimizationThreshold,
    autoOptimizationEnabled,
    wasmEngine
  ]);

  // Optimization function
  const optimize = useCallback(() => {
    try {
      console.log('Starting performance optimization...');

      // 1. Auto-optimize spatial index
      const spatialOptimized = wasmEngine.autoOptimizeSpatialIndex();
      if (spatialOptimized) {
        console.log('Spatial index auto-optimized');
      }

      // 2. Rebuild spatial index with optimal cell size
      wasmEngine.rebuildSpatialIndex(0); // 0 triggers auto-calculation

      // 3. Clear element pool if memory usage is high
      if (metrics.memoryUsage > optimizationThreshold.maxMemoryUsage!) {
        elementPool.clear();
        console.log('Element pool cleared due to high memory usage');
      }

      // 4. Clear lazy loading cache if needed
      if (elements.length > 10000) {
        lazyLoading.clearLoaded();
        console.log('Lazy loading cache cleared');
      }

      console.log('Performance optimization completed');
    } catch (error) {
      console.error('Error during optimization:', error);
    }
  }, [
    wasmEngine,
    metrics.memoryUsage,
    optimizationThreshold.maxMemoryUsage,
    elementPool,
    lazyLoading,
    elements.length
  ]);

  return {
    metrics,
    optimize,
    needsOptimization,
    autoOptimizationEnabled
  };
}

/**
 * Hook for performance optimization with element management
 */
export function useOptimizedElementManagement(
  elements: Element[],
  options: PerformanceOptimizationOptions = {}
) {
  const performanceOpt = usePerformanceOptimization(elements, options);
  const batchOps = useBatchOperations<Element>();

  // Optimized element operations
  const addElement = useCallback((element: Element) => {
    if (options.enableBatchOperations) {
      batchOps.addToBatch(element);
    } else {
      // Direct add
      console.log('Adding element:', element.id);
    }
  }, [batchOps, options.enableBatchOperations]);

  const updateElement = useCallback((element: Element) => {
    if (options.enableBatchOperations) {
      batchOps.updateInBatch(element);
    } else {
      // Direct update
      console.log('Updating element:', element.id);
    }
  }, [batchOps, options.enableBatchOperations]);

  const removeElement = useCallback((elementId: string) => {
    if (options.enableBatchOperations) {
      batchOps.removeFromBatch(elementId);
    } else {
      // Direct remove
      console.log('Removing element:', elementId);
    }
  }, [batchOps, options.enableBatchOperations]);

  // Execute batch operations
  const executeBatch = useCallback((
    onAdd: (elements: Element[]) => void,
    onUpdate: (elements: Element[]) => void,
    onRemove: (elementIds: string[]) => void
  ) => {
    batchOps.executeBatch(onAdd, onUpdate, onRemove);
  }, [batchOps]);

  return {
    ...performanceOpt,
    addElement,
    updateElement,
    removeElement,
    executeBatch,
    batchStats: batchOps.getBatchStats()
  };
}
