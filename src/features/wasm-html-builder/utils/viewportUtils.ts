/**
 * Viewport utilities for performance optimization
 * Reduces DOM nodes by only rendering elements within the visible viewport
 */

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScrollPosition {
  left: number;
  top: number;
}

/**
 * Calculate viewport bounds including scroll position and zoom
 */
export const calculateViewportBounds = (
  containerWidth: number,
  containerHeight: number,
  scrollPosition: ScrollPosition,
  zoom: number = 1.0,
  margin: number = 100 // Extra margin to pre-render elements slightly outside viewport
): ViewportBounds => {
  return {
    x: (scrollPosition.left - margin) / zoom,
    y: (scrollPosition.top - margin) / zoom,
    width: (containerWidth + margin * 2) / zoom,
    height: (containerHeight + margin * 2) / zoom,
  };
};

/**
 * Check if element is within viewport bounds
 */
export const isElementInViewport = (
  element: ElementBounds,
  viewport: ViewportBounds
): boolean => {
  const elementRight = element.x + element.width;
  const elementBottom = element.y + element.height;
  const viewportRight = viewport.x + viewport.width;
  const viewportBottom = viewport.y + viewport.height;

  return (
    element.x < viewportRight &&
    elementRight > viewport.x &&
    element.y < viewportBottom &&
    elementBottom > viewport.y
  );
};

/**
 * Check if element is partially visible in viewport
 */
export const isElementPartiallyVisible = (
  element: ElementBounds,
  viewport: ViewportBounds
): boolean => {
  const elementRight = element.x + element.width;
  const elementBottom = element.y + element.height;
  const viewportRight = viewport.x + viewport.width;
  const viewportBottom = viewport.y + viewport.height;

  // Element is partially visible if any part overlaps with viewport
  return (
    element.x < viewportRight &&
    elementRight > viewport.x &&
    element.y < viewportBottom &&
    elementBottom > viewport.y
  );
};

/**
 * Calculate intersection area between element and viewport
 */
export const calculateIntersectionArea = (
  element: ElementBounds,
  viewport: ViewportBounds
): number => {
  const left = Math.max(element.x, viewport.x);
  const top = Math.max(element.y, viewport.y);
  const right = Math.min(element.x + element.width, viewport.x + viewport.width);
  const bottom = Math.min(element.y + element.height, viewport.y + viewport.height);

  if (left >= right || top >= bottom) {
    return 0;
  }

  return (right - left) * (bottom - top);
};

/**
 * Calculate visibility percentage of element in viewport
 */
export const calculateVisibilityPercentage = (
  element: ElementBounds,
  viewport: ViewportBounds
): number => {
  const intersectionArea = calculateIntersectionArea(element, viewport);
  const elementArea = element.width * element.height;
  
  if (elementArea === 0) return 0;
  
  return Math.min(100, (intersectionArea / elementArea) * 100);
};

/**
 * Filter elements that are visible in viewport
 */
export const filterVisibleElements = <T extends ElementBounds>(
  elements: T[],
  viewport: ViewportBounds,
  minVisibilityPercentage: number = 0
): T[] => {
  return elements.filter(element => {
    if (minVisibilityPercentage === 0) {
      return isElementInViewport(element, viewport);
    }
    
    const visibilityPercentage = calculateVisibilityPercentage(element, viewport);
    return visibilityPercentage >= minVisibilityPercentage;
  });
};

/**
 * Get elements that are near viewport (for pre-loading)
 */
export const getNearViewportElements = <T extends ElementBounds>(
  elements: T[],
  viewport: ViewportBounds,
  preloadMargin: number = 200
): T[] => {
  const extendedViewport: ViewportBounds = {
    x: viewport.x - preloadMargin,
    y: viewport.y - preloadMargin,
    width: viewport.width + preloadMargin * 2,
    height: viewport.height + preloadMargin * 2,
  };

  return filterVisibleElements(elements, extendedViewport);
};

/**
 * Calculate optimal grid size for spatial partitioning
 */
export const calculateOptimalGridSize = (
  viewport: ViewportBounds,
  elementCount: number
): number => {
  // Base grid size on viewport dimensions and element density
  const viewportArea = viewport.width * viewport.height;
  const elementDensity = elementCount / viewportArea;
  
  // Optimal grid size: balance between memory usage and query performance
  if (elementDensity < 0.001) return 1000; // Sparse elements
  if (elementDensity < 0.01) return 500;   // Medium density
  if (elementDensity < 0.1) return 200;    // High density
  return 100; // Very high density
};

/**
 * Performance metrics for viewport culling
 */
export interface ViewportCullingMetrics {
  totalElements: number;
  visibleElements: number;
  culledElements: number;
  cullingPercentage: number;
  averageVisibilityPercentage: number;
  processingTimeMs: number;
}

/**
 * Calculate viewport culling performance metrics
 */
export const calculateViewportCullingMetrics = <T extends ElementBounds>(
  elements: T[],
  viewport: ViewportBounds,
  processingTimeMs: number
): ViewportCullingMetrics => {
  const visibleElements = filterVisibleElements(elements, viewport);
  const culledElements = elements.length - visibleElements.length;
  const cullingPercentage = elements.length > 0 ? (culledElements / elements.length) * 100 : 0;
  
  const averageVisibilityPercentage = visibleElements.length > 0
    ? visibleElements.reduce((sum, element) => 
        sum + calculateVisibilityPercentage(element, viewport), 0
      ) / visibleElements.length
    : 0;

  return {
    totalElements: elements.length,
    visibleElements: visibleElements.length,
    culledElements,
    cullingPercentage,
    averageVisibilityPercentage,
    processingTimeMs,
  };
};

/**
 * Debounced viewport update to prevent excessive recalculations
 */
export class ViewportUpdateDebouncer {
  private timeoutId: NodeJS.Timeout | null = null;
  private lastUpdateTime = 0;
  private readonly debounceMs: number;

  constructor(debounceMs: number = 16) { // ~60fps
    this.debounceMs = debounceMs;
  }

  public debounce(callback: () => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    if (timeSinceLastUpdate >= this.debounceMs) {
      // Execute immediately if enough time has passed
      this.lastUpdateTime = now;
      callback();
    } else {
      // Debounce the update
      this.timeoutId = setTimeout(() => {
        this.lastUpdateTime = Date.now();
        callback();
      }, this.debounceMs - timeSinceLastUpdate);
    }
  }

  public cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
