import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  ViewportBounds, 
  ElementBounds, 
  ScrollPosition,
  filterVisibleElements,
  getNearViewportElements,
  calculateViewportBounds,
  calculateViewportCullingMetrics,
  ViewportCullingMetrics,
  ViewportUpdateDebouncer
} from '../utils/viewportUtils';

export interface UseViewportCullingOptions {
  /** Container element to monitor for viewport changes */
  containerRef?: React.RefObject<HTMLElement>;
  /** Zoom level for viewport calculations */
  zoom?: number;
  /** Extra margin around viewport for pre-rendering */
  margin?: number;
  /** Minimum visibility percentage to render element */
  minVisibilityPercentage?: number;
  /** Enable performance monitoring */
  enableMetrics?: boolean;
  /** Debounce time for viewport updates (ms) */
  debounceMs?: number;
}

export interface UseViewportCullingReturn<T extends ElementBounds> {
  /** Elements that are visible in current viewport */
  visibleElements: T[];
  /** Elements that are near viewport (for pre-loading) */
  nearViewportElements: T[];
  /** Current viewport bounds */
  viewportBounds: ViewportBounds;
  /** Performance metrics */
  metrics: ViewportCullingMetrics | null;
  /** Force viewport recalculation */
  recalculateViewport: () => void;
  /** Update viewport bounds manually */
  updateViewportBounds: (bounds: ViewportBounds) => void;
}

/**
 * Hook for viewport culling optimization
 * Only renders elements that are visible in the current viewport
 */
export function useViewportCulling<T extends ElementBounds>(
  elements: T[],
  options: UseViewportCullingOptions = {}
): UseViewportCullingReturn<T> {
  const {
    containerRef,
    zoom = 1.0,
    margin = 100,
    minVisibilityPercentage = 0,
    enableMetrics = false,
    debounceMs = 16,
  } = options;

  // State
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds>({
    x: 0,
    y: 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [metrics, setMetrics] = useState<ViewportCullingMetrics | null>(null);

  // Refs
  const debouncerRef = useRef<ViewportUpdateDebouncer | null>(null);
  const lastElementsLengthRef = useRef(0);
  const performanceStartRef = useRef(0);

  // Initialize debouncer
  useEffect(() => {
    debouncerRef.current = new ViewportUpdateDebouncer(debounceMs);
    return () => {
      debouncerRef.current?.cancel();
    };
  }, [debounceMs]);

  // Calculate viewport bounds from container
  const calculateViewportFromContainer = useCallback((): ViewportBounds => {
    if (!containerRef?.current) {
      return {
        x: 0,
        y: 0,
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
      };
    }

    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    return calculateViewportBounds(
      containerWidth,
      containerHeight,
      { left: scrollLeft, top: scrollTop },
      zoom,
      margin
    );
  }, [containerRef, zoom, margin]);

  // Update viewport bounds
  const updateViewportBounds = useCallback((bounds: ViewportBounds) => {
    setViewportBounds(bounds);
  }, []);

  // Recalculate viewport
  const recalculateViewport = useCallback(() => {
    const newBounds = calculateViewportFromContainer();
    setViewportBounds(newBounds);
  }, [calculateViewportFromContainer]);

  // Debounced viewport update
  const debouncedUpdateViewport = useCallback(() => {
    debouncerRef.current?.debounce(() => {
      const newBounds = calculateViewportFromContainer();
      setViewportBounds(newBounds);
    });
  }, [calculateViewportFromContainer]);

  // Memoized visible elements calculation
  const visibleElements = useMemo(() => {
    if (enableMetrics) {
      performanceStartRef.current = performance.now();
    }

    const visible = filterVisibleElements(elements, viewportBounds, minVisibilityPercentage);

    if (enableMetrics) {
      const processingTime = performance.now() - performanceStartRef.current;
      const newMetrics = calculateViewportCullingMetrics(elements, viewportBounds, processingTime);
      setMetrics(newMetrics);
    }

    return visible;
  }, [elements, viewportBounds, minVisibilityPercentage, enableMetrics]);

  // Memoized near viewport elements
  const nearViewportElements = useMemo(() => {
    return getNearViewportElements(elements, viewportBounds, margin);
  }, [elements, viewportBounds, margin]);

  // Set up scroll and resize listeners
  useEffect(() => {
    const container = containerRef?.current;
    
    if (!container) {
      // Fallback to window listeners
      const handleScroll = () => debouncedUpdateViewport();
      const handleResize = () => debouncedUpdateViewport();

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }

    // Container-specific listeners
    const handleScroll = () => debouncedUpdateViewport();
    const handleResize = () => debouncedUpdateViewport();

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef, debouncedUpdateViewport]);

  // Initial viewport calculation
  useEffect(() => {
    recalculateViewport();
  }, [recalculateViewport]);

  // Update viewport when zoom changes
  useEffect(() => {
    recalculateViewport();
  }, [zoom, recalculateViewport]);

  // Log performance improvements when element count changes significantly
  useEffect(() => {
    const currentLength = elements.length;
    const lastLength = lastElementsLengthRef.current;
    
    if (Math.abs(currentLength - lastLength) > 100) {
      console.log(`Viewport Culling: ${currentLength} total elements, ${visibleElements.length} visible (${((visibleElements.length / currentLength) * 100).toFixed(1)}%)`);
      lastElementsLengthRef.current = currentLength;
    }
  }, [elements.length, visibleElements.length]);

  return {
    visibleElements,
    nearViewportElements,
    viewportBounds,
    metrics,
    recalculateViewport,
    updateViewportBounds,
  };
}

/**
 * Hook for viewport culling with automatic container detection
 */
export function useAutoViewportCulling<T extends ElementBounds>(
  elements: T[],
  options: Omit<UseViewportCullingOptions, 'containerRef'> = {}
): UseViewportCullingReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLElement>;
  
  return useViewportCulling(elements, {
    ...options,
    containerRef,
  });
}

/**
 * Hook for viewport culling with performance monitoring
 */
export function useViewportCullingWithMetrics<T extends ElementBounds>(
  elements: T[],
  options: UseViewportCullingOptions = {}
): UseViewportCullingReturn<T> & {
  /** Performance metrics history */
  metricsHistory: ViewportCullingMetrics[];
  /** Clear metrics history */
  clearMetricsHistory: () => void;
} {
  const [metricsHistory, setMetricsHistory] = useState<ViewportCullingMetrics[]>([]);
  
  const result = useViewportCulling(elements, {
    ...options,
    enableMetrics: true,
  });

  // Update metrics history
  useEffect(() => {
    if (result.metrics) {
      setMetricsHistory(prev => {
        const newHistory = [...prev, result.metrics!];
        // Keep only last 100 metrics to prevent memory leaks
        return newHistory.slice(-100);
      });
    }
  }, [result.metrics]);

  const clearMetricsHistory = useCallback(() => {
    setMetricsHistory([]);
  }, []);

  return {
    ...result,
    metricsHistory,
    clearMetricsHistory,
  };
}
