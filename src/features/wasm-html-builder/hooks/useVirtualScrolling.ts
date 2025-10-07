import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

export interface VirtualScrollingOptions {
  /** Container element to monitor for scroll changes */
  containerRef?: React.RefObject<HTMLElement>;
  /** Height of each virtual item (px) */
  itemHeight: number;
  /** Number of items to render outside viewport */
  overscan?: number;
  /** Enable horizontal virtualization */
  enableHorizontal?: boolean;
  /** Width of each virtual item (px) - for horizontal scrolling */
  itemWidth?: number;
  /** Debounce time for scroll updates (ms) */
  debounceMs?: number;
}

export interface VirtualScrollingReturn<T> {
  /** Items that should be rendered */
  visibleItems: T[];
  /** Start index of visible items */
  startIndex: number;
  /** End index of visible items */
  endIndex: number;
  /** Total height of virtual container */
  totalHeight: number;
  /** Total width of virtual container */
  totalWidth: number;
  /** Offset for positioning visible items */
  offsetY: number;
  /** Offset for horizontal positioning */
  offsetX: number;
  /** Force recalculation */
  recalculate: () => void;
}

/**
 * Hook for virtual scrolling optimization
 * Only renders items that are visible in the viewport
 */
export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollingOptions
): VirtualScrollingReturn<T> {
  const {
    containerRef,
    itemHeight,
    overscan = 5,
    enableHorizontal = false,
    itemWidth = 200,
    debounceMs = 16
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Calculate total dimensions
  const totalHeight = items.length * itemHeight;
  const totalWidth = enableHorizontal ? items.length * itemWidth : 0;

  // Calculate offsets
  const offsetY = visibleRange.startIndex * itemHeight;
  const offsetX = enableHorizontal ? visibleRange.startIndex * itemWidth : 0;

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (containerRef?.current) {
        setScrollTop(containerRef.current.scrollTop);
        if (enableHorizontal) {
          setScrollLeft(containerRef.current.scrollLeft);
        }
      }
    }, debounceMs);
  }, [containerRef, enableHorizontal, debounceMs]);

  // Handle resize events
  const handleResize = useCallback(() => {
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerHeight(rect.height);
      setContainerWidth(rect.width);
    }
  }, [containerRef]);

  // Setup event listeners
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    // Initial setup
    handleResize();
    handleScroll();

    // Add event listeners
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [containerRef, handleScroll, handleResize]);

  // Force recalculation
  const recalculate = useCallback(() => {
    handleResize();
    handleScroll();
  }, [handleResize, handleScroll]);

  return {
    visibleItems,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    totalHeight,
    totalWidth,
    offsetY,
    offsetX,
    recalculate
  };
}

/**
 * Hook for virtual scrolling with element positioning
 * Optimized for canvas-based element rendering
 */
export function useElementVirtualScrolling<T extends { x: number; y: number; width: number; height: number }>(
  elements: T[],
  options: {
    containerRef?: React.RefObject<HTMLElement>;
    cellSize?: number;
    overscan?: number;
    debounceMs?: number;
  } = {}
) {
  const {
    containerRef,
    cellSize = 100,
    overscan = 2,
    debounceMs = 16
  } = options;

  const [viewportBounds, setViewportBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  // Calculate visible elements based on viewport bounds
  const visibleElements = useMemo(() => {
    if (elements.length === 0) return [];

    const { x, y, width, height } = viewportBounds;
    
    // Add overscan margin
    const margin = cellSize * overscan;
    const expandedBounds = {
      x: x - margin,
      y: y - margin,
      width: width + margin * 2,
      height: height + margin * 2
    };

    return elements.filter(element => {
      const elementRight = element.x + element.width;
      const elementBottom = element.y + element.height;
      const boundsRight = expandedBounds.x + expandedBounds.width;
      const boundsBottom = expandedBounds.y + expandedBounds.height;

      return (
        element.x < boundsRight &&
        elementRight > expandedBounds.x &&
        element.y < boundsBottom &&
        elementBottom > expandedBounds.y
      );
    });
  }, [elements, viewportBounds, cellSize, overscan]);

  // Update viewport bounds
  const updateViewportBounds = useCallback(() => {
    if (containerRef?.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      setViewportBounds({
        x: container.scrollLeft,
        y: container.scrollTop,
        width: rect.width,
        height: rect.height
      });
    }
  }, [containerRef]);

  // Handle scroll and resize
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    // Initial setup
    updateViewportBounds();

    // Add event listeners
    const handleScroll = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(updateViewportBounds, debounceMs);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateViewportBounds);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateViewportBounds);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [containerRef, updateViewportBounds, debounceMs]);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return {
    visibleElements,
    viewportBounds,
    updateViewportBounds
  };
}
