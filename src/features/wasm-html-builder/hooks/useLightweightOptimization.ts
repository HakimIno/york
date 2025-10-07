import { useMemo, useCallback } from 'react';
import { Element } from '../module/wasm-interface';

export interface LightweightOptimizationOptions {
  /** Enable optimizations only for large datasets */
  enableForLargeDatasets?: boolean;
  /** Threshold for considering dataset as large */
  largeDatasetThreshold?: number;
  /** Enable memoization */
  enableMemoization?: boolean;
}

export interface LightweightOptimizationReturn {
  /** Optimized elements for rendering */
  optimizedElements: Element[];
  /** Check if optimizations are active */
  isOptimized: boolean;
  /** Performance metrics */
  metrics: {
    totalElements: number;
    renderedElements: number;
    optimizationActive: boolean;
  };
}

/**
 * Lightweight performance optimization hook
 * Only applies optimizations when needed to avoid overhead for small datasets
 */
export function useLightweightOptimization(
  elements: Element[],
  options: LightweightOptimizationOptions = {}
): LightweightOptimizationReturn {
  const {
    enableForLargeDatasets = true,
    largeDatasetThreshold = 1000,
    enableMemoization = true
  } = options;

  // Check if we should apply optimizations
  const shouldOptimize = enableForLargeDatasets && elements.length > largeDatasetThreshold;

  // Memoize elements processing only when needed
  const optimizedElements = useMemo(() => {
    if (!shouldOptimize || !enableMemoization) {
      return elements;
    }

    // For large datasets, apply basic optimizations
    return elements.filter(element => {
      // Basic validation
      return element.id && element.x >= 0 && element.y >= 0;
    });
  }, [elements, shouldOptimize, enableMemoization]);

  // Performance metrics
  const metrics = useMemo(() => ({
    totalElements: elements.length,
    renderedElements: optimizedElements.length,
    optimizationActive: shouldOptimize
  }), [elements.length, optimizedElements.length, shouldOptimize]);

  return {
    optimizedElements,
    isOptimized: shouldOptimize,
    metrics
  };
}

/**
 * Hook for conditional performance optimizations
 * Only enables heavy optimizations when really needed
 */
export function useConditionalOptimization(
  elements: Element[],
  options: {
    viewportCullingThreshold?: number;
    virtualScrollingThreshold?: number;
    spatialIndexingThreshold?: number;
  } = {}
) {
  const {
    viewportCullingThreshold = 500,
    virtualScrollingThreshold = 10000,
    spatialIndexingThreshold = 1000
  } = options;

  const shouldUseViewportCulling = elements.length > viewportCullingThreshold;
  const shouldUseVirtualScrolling = elements.length > virtualScrollingThreshold;
  const shouldUseSpatialIndexing = elements.length > spatialIndexingThreshold;

  const optimizationConfig = useMemo(() => ({
    viewportCulling: shouldUseViewportCulling,
    virtualScrolling: shouldUseVirtualScrolling,
    spatialIndexing: shouldUseSpatialIndexing,
    performanceMonitoring: elements.length > 1000
  }), [
    shouldUseViewportCulling,
    shouldUseVirtualScrolling,
    shouldUseSpatialIndexing,
    elements.length
  ]);

  return {
    optimizationConfig,
    metrics: {
      totalElements: elements.length,
      activeOptimizations: Object.values(optimizationConfig).filter(Boolean).length,
      overhead: elements.length < 1000 ? 'minimal' : 'moderate'
    }
  };
}

/**
 * Hook for smart performance monitoring
 * Only monitors when necessary to reduce overhead
 */
export function useSmartPerformanceMonitoring(
  elements: Element[],
  options: {
    monitoringThreshold?: number;
    updateInterval?: number;
  } = {}
) {
  const {
    monitoringThreshold = 1000,
    updateInterval = 5000
  } = options;

  const shouldMonitor = elements.length > monitoringThreshold;

  const monitoringConfig = useMemo(() => ({
    enabled: shouldMonitor,
    interval: shouldMonitor ? updateInterval : 30000, // Much slower when not needed
    metrics: {
      elements: shouldMonitor,
      memory: shouldMonitor && elements.length > 5000,
      fps: shouldMonitor && elements.length > 2000,
      spatial: shouldMonitor && elements.length > 1000
    }
  }), [shouldMonitor, updateInterval, elements.length]);

  return {
    monitoringConfig,
    isMonitoring: shouldMonitor
  };
}
