import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HtmlBuilderWasm,
  getWasmInstance,
  WasmEngineState,
  Element,
  A4Paper,
  Point,
  DragUpdateResult,
  ExportResult,
  ExportOptions,
  PerformanceStats,
  ElementStyle,
} from '../../wasm-html-builder/module/wasm-interface';

// Hook options
export interface UseWasmEngineOptions {
  enablePerformanceMonitoring?: boolean;
  fallbackToJS?: boolean;
  autoInitialize?: boolean;
  onError?: (error: Error) => void;
  onInitialized?: () => void;
}

// Hook return type
export interface UseWasmEngineReturn {
  // State
  state: WasmEngineState;

  // A4 Paper Management
  createA4Paper: (x: number, y: number) => A4Paper | null;
  getA4Papers: () => A4Paper[];

  // Enhanced Paper Management
  createPaper: (id: string, size: string, orientation: string, x: number, y: number) => A4Paper | null;
  removePaper: (paperId: string) => boolean;
  updatePaperPosition: (paperId: string, x: number, y: number) => boolean;
  getPaperCount: () => number;
  getPaperById: (paperId: string) => A4Paper | null;

  // Viewport Management
  setViewportSize: (width: number, height: number) => void;
  fitToViewport: (marginPercent?: number) => void;

  // Zoom Management
  getZoom: () => number;
  setZoom: (zoom: number) => number;
  fitA4PapersToViewport: (papers: any[], marginPercent?: number) => void;

  // Element Management
  createElement: (
    componentType: string,
    x: number,
    y: number
  ) => Element | null;
  updateElementPosition: (elementId: string, x: number, y: number) => boolean;
  updateElementSize: (
    elementId: string,
    width: number,
    height: number
  ) => boolean;
  updateElementContent: (elementId: string, content: string) => boolean;
  updateElementStyle: (
    elementId: string,
    style: Partial<ElementStyle>
  ) => boolean;
  deleteElement: (elementId: string) => boolean;
  getElement: (elementId: string) => Element | null;
  getAllElements: () => Element[];
  getElementCount: () => number;

  // Drag Operations
  startDrag: (elementId: string, mouseX: number, mouseY: number) => boolean;
  updateDrag: (
    mouseX: number,
    mouseY: number,
    zoom: number,
    panX: number,
    panY: number
  ) => DragUpdateResult | null;
  endDrag: () => boolean;

  // Transform Operations
  screenToCanvas: (screenX: number, screenY: number) => Point | null;
  canvasToScreen: (canvasX: number, canvasY: number) => Point | null;
  setTransform: (
    zoom: number,
    panX: number,
    panY: number
  ) => { zoom: number; pan_x: number; pan_y: number } | null;
  zoomToPoint: (screenX: number, screenY: number, zoomDelta: number) => number;

  // Spatial Queries
  getElementsInRegion: (
    x: number,
    y: number,
    width: number,
    height: number
  ) => Element[];

  // HTML Export
  exportHtml: (options?: Partial<ExportOptions>) => ExportResult | null;

  // Performance
  getPerformanceStats: () => PerformanceStats | null;

  // Table-specific methods
  addTableRow: (elementId: string, atIndex?: number) => boolean;
  removeTableRow: (elementId: string, index: number) => boolean;
  addTableColumn: (elementId: string, atIndex?: number) => boolean;
  removeTableColumn: (elementId: string, index: number) => boolean;
  updateTableCell: (elementId: string, row: number, col: number, content: string) => boolean;
  mergeTableCells: (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => boolean;
  getTableData: (elementId: string) => any;
  updateTableColumnWidth: (elementId: string, columnIndex: number, width: number) => boolean;
  updateTableRowHeight: (elementId: string, rowIndex: number, height: number) => boolean;

  // Excel-like calculation functions
  calculateColumnSum: (elementId: string, colIndex: number) => number;
  calculateRowSum: (elementId: string, rowIndex: number) => number;
  calculateAverage: (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => number;
  autoFitColumns: (elementId: string) => boolean;

  // Performance optimization methods for StylePanel
  parseFormFieldData: (elementId: string) => any;
  calculateSafeStyle: (elementId: string) => ElementStyle | null;
  getElementTypeFlags: (elementId: string) => { isTable: boolean; isFormField: boolean; elementType: string };
  batchUpdateFormField: (elementId: string, updates: any) => boolean;
  getElementForStylePanel: (elementId: string) => Element | null;
  validateStyleUpdate: (style: Partial<ElementStyle>) => Partial<ElementStyle>;
  getElementsSummary: () => { total: number; by_type: Record<string, number> };

  // Utility
  reset: () => void;
  calculateDropPosition: (
    mouseX: number,
    mouseY: number,
    elementWidth: number,
    elementHeight: number,
    zoom: number,
    panX: number,
    panY: number
  ) => Point | null;

  // Table Cell Operations
  updateTableCellStyle: (elementId: string, row: number, col: number, style: any) => boolean;
  getTableCellStyle: (elementId: string, row: number, col: number) => any;
  getTableDimensions: (elementId: string) => any;

  // Spatial Indexing methods
  queryElementsInRegion: (x: number, y: number, width: number, height: number) => Element[];
  findElementsAtPoint: (x: number, y: number) => Element[];
  findNearestElement: (x: number, y: number, maxDistance?: number) => Element | null;
  detectElementCollisions: (elementId: string) => Element[];
  getSpatialIndexStats: () => any;
  updateSpatialIndexBounds: (x: number, y: number, width: number, height: number) => void;
  rebuildSpatialIndex: (cellSize?: number) => void;
  autoOptimizeSpatialIndex: () => boolean;
}

// Main hook
export const useWasmEngine = (
  options: UseWasmEngineOptions = {}
): UseWasmEngineReturn => {
  const {
    enablePerformanceMonitoring = false,
    fallbackToJS = true,
    autoInitialize = true,
    onError,
    onInitialized,
  } = options;

  // State
  const [state, setState] = useState<WasmEngineState>({
    isLoaded: false,
    isLoading: false,
    error: null,
    engine: null,
  });

  // Refs
  const engineRef = useRef<HtmlBuilderWasm | null>(null);
  const performanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WASM engine
  const initialize = useCallback(async () => {
    if (state.isLoading || state.isLoaded) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Starting WASM initialization...');
      const engine = await getWasmInstance();
      engineRef.current = engine;

      // Wait a bit to ensure engine is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));

      setState({
        isLoaded: true,
        isLoading: false,
        error: null,
        engine,
      });

      console.log('WASM Engine fully initialized and ready');
      onInitialized?.();

      // Start performance monitoring if enabled
      if (enablePerformanceMonitoring) {
        performanceIntervalRef.current = setInterval(() => {
          try {
            if (engineRef.current) {
              const stats = engineRef.current.getPerformanceStats();
              console.log('WASM Performance Stats:', stats);
            }
          } catch (error) {
            console.warn('Failed to get performance stats:', error);
          }
        }, 5000); // Every 5 seconds
      }
    } catch (error) {
      console.error('WASM initialization failed:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      setState({
        isLoaded: false,
        isLoading: false,
        error: err.message,
        engine: null,
      });
      onError?.(err);
    }
  }, [
    state.isLoading,
    state.isLoaded,
    enablePerformanceMonitoring,
    onError,
    onInitialized,
  ]);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }

    // Cleanup on unmount
    return () => {
      if (performanceIntervalRef.current) {
        clearInterval(performanceIntervalRef.current);
      }
    };
  }, [autoInitialize, initialize]);

  // Helper function to safely call engine methods
  const safeCall = useCallback(
    <T>(fn: () => T, fallback?: T): T | null => {
      try {
        if (!state.isLoaded || !engineRef.current) {
          console.warn(
            'WASM engine not ready, isLoaded:',
            state.isLoaded,
            'engineRef:',
            !!engineRef.current
          );
          if (fallbackToJS && fallback !== undefined) {
            return fallback;
          }
          return null;
        }
        return fn();
      } catch (error) {
        console.error('WASM engine error:', error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
        return fallbackToJS && fallback !== undefined ? fallback : null;
      }
    },
    [state.isLoaded, fallbackToJS, onError]
  );

  // A4 Paper Management
  const createA4Paper = useCallback(
    (x: number, y: number): A4Paper | null => {
      return safeCall(() => engineRef.current!.createA4Paper(x, y));
    },
    [safeCall]
  );

  const getA4Papers = useCallback((): A4Paper[] => {
    return safeCall(() => engineRef.current!.getA4Papers(), []) || [];
  }, [safeCall]);

  // Enhanced Paper Management
  const createPaper = useCallback(
    (id: string, size: string, orientation: string, x: number, y: number): A4Paper | null => {
      return safeCall(() => engineRef.current!.createPaper(id, size, orientation, x, y));
    },
    [safeCall]
  );

  const removePaper = useCallback(
    (paperId: string): boolean => {
      return safeCall(() => engineRef.current!.removePaper(paperId), false) || false;
    },
    [safeCall]
  );

  const updatePaperPosition = useCallback(
    (paperId: string, x: number, y: number): boolean => {
      return safeCall(() => engineRef.current!.updatePaperPosition(paperId, x, y), false) || false;
    },
    [safeCall]
  );

  const getPaperCount = useCallback((): number => {
    return safeCall(() => engineRef.current!.getPaperCount(), 0) || 0;
  }, [safeCall]);

  const getPaperById = useCallback(
    (paperId: string): A4Paper | null => {
      return safeCall(() => engineRef.current!.getPaperById(paperId));
    },
    [safeCall]
  );

  // Viewport Management
  const setViewportSize = useCallback(
    (width: number, height: number): void => {
      safeCall(() => engineRef.current!.setViewportSize(width, height));
    },
    [safeCall]
  );

  const fitToViewport = useCallback(
    (marginPercent: number = 10): void => {
      safeCall(() => engineRef.current!.fitToViewport(marginPercent));
    },
    [safeCall]
  );

  // Element Management
  const createElement = useCallback(
    (componentType: string, x: number, y: number): Element | null => {
      return safeCall(() =>
        engineRef.current!.createElement(componentType, x, y)
      );
    },
    [safeCall]
  );

  const updateElementPosition = useCallback(
    (elementId: string, x: number, y: number): boolean => {
      return (
        safeCall(
          () => engineRef.current!.updateElementPosition(elementId, x, y),
          false
        ) || false
      );
    },
    [safeCall]
  );

  const updateElementSize = useCallback(
    (elementId: string, width: number, height: number): boolean => {
      return (
        safeCall(
          () => engineRef.current!.updateElementSize(elementId, width, height),
          false
        ) || false
      );
    },
    [safeCall]
  );

  const updateElementContent = useCallback(
    (elementId: string, content: string): boolean => {
      return (
        safeCall(
          () => engineRef.current!.updateElementContent(elementId, content),
          false
        ) || false
      );
    },
    [safeCall]
  );

  const updateElementStyle = useCallback(
    (elementId: string, style: Partial<ElementStyle>): boolean => {
      return (
        safeCall(
          () => engineRef.current!.updateElementStyle(elementId, style),
          false
        ) || false
      );
    },
    [safeCall]
  );

  const deleteElement = useCallback(
    (elementId: string): boolean => {
      return (
        safeCall(() => engineRef.current!.deleteElement(elementId), false) ||
        false
      );
    },
    [safeCall]
  );

  const getElement = useCallback(
    (elementId: string): Element | null => {
      return safeCall(() => engineRef.current!.getElement(elementId));
    },
    [safeCall]
  );

  const getAllElements = useCallback((): Element[] => {
    return safeCall(() => engineRef.current!.getAllElements(), []) || [];
  }, [safeCall]);

  const getElementCount = useCallback((): number => {
    return safeCall(() => engineRef.current!.getElementCount(), 0) || 0;
  }, [safeCall]);

  // Drag Operations
  const startDrag = useCallback(
    (elementId: string, mouseX: number, mouseY: number): boolean => {
      return (
        safeCall(
          () => engineRef.current!.startDrag(elementId, mouseX, mouseY),
          false
        ) || false
      );
    },
    [safeCall]
  );

  const updateDrag = useCallback(
    (
      mouseX: number,
      mouseY: number,
      zoom: number,
      panX: number,
      panY: number
    ): DragUpdateResult | null => {
      return safeCall(() =>
        engineRef.current!.updateDrag(mouseX, mouseY, zoom, panX, panY)
      );
    },
    [safeCall]
  );

  const endDrag = useCallback((): boolean => {
    return safeCall(() => engineRef.current!.endDrag(), false) || false;
  }, [safeCall]);

  // Transform Operations
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point | null => {
      return safeCall(() =>
        engineRef.current!.screenToCanvas(screenX, screenY)
      );
    },
    [safeCall]
  );

  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number): Point | null => {
      return safeCall(() =>
        engineRef.current!.canvasToScreen(canvasX, canvasY)
      );
    },
    [safeCall]
  );

  const setTransform = useCallback(
    (
      zoom: number,
      panX: number,
      panY: number
    ): { zoom: number; pan_x: number; pan_y: number } | null => {
      return safeCall(() => engineRef.current!.setTransform(zoom, panX, panY));
    },
    [safeCall]
  );

  const zoomToPoint = useCallback(
    (screenX: number, screenY: number, zoomDelta: number): number => {
      return (
        safeCall(
          () => engineRef.current!.zoomToPoint(screenX, screenY, zoomDelta),
          1.0
        ) || 1.0
      );
    },
    [safeCall]
  );

  // Spatial Queries
  const getElementsInRegion = useCallback(
    (x: number, y: number, width: number, height: number): Element[] => {
      const result = safeCall(() =>
        engineRef.current!.getElementsInRegion(x, y, width, height)
      );
      return result?.elements || [];
    },
    [safeCall]
  );

  // HTML Export
  const exportHtml = useCallback(
    (options?: Partial<ExportOptions>): ExportResult | null => {
      return safeCall(() => engineRef.current!.exportHtml(options));
    },
    [safeCall]
  );

  // Performance
  const getPerformanceStats = useCallback((): PerformanceStats | null => {
    return safeCall(() => engineRef.current!.getPerformanceStats());
  }, [safeCall]);

  // Utility
  const reset = useCallback((): void => {
    safeCall(() => engineRef.current!.reset());
  }, [safeCall]);

  const calculateDropPosition = useCallback(
    (
      mouseX: number,
      mouseY: number,
      elementWidth: number,
      elementHeight: number,
      zoom: number,
      panX: number,
      panY: number
    ): Point | null => {
      return safeCall(() =>
        engineRef.current!.calculateDropPosition(
          mouseX,
          mouseY,
          elementWidth,
          elementHeight,
          zoom,
          panX,
          panY
        )
      );
    },
    [safeCall]
  );

  return {
    state,

    // A4 Paper Management
    createA4Paper,
    getA4Papers,

    // Enhanced Paper Management
    createPaper,
    removePaper,
    updatePaperPosition,
    getPaperCount,
    getPaperById,

    // Viewport Management
    setViewportSize,
    fitToViewport,

    // Element Management
    createElement,
    updateElementPosition,
    updateElementSize,
    updateElementContent,
    updateElementStyle,
    deleteElement,
    getElement,
    getAllElements,
    getElementCount,

    // Drag Operations
    startDrag,
    updateDrag,
    endDrag,

    // Transform Operations
    screenToCanvas,
    canvasToScreen,
    setTransform,
    zoomToPoint,

    // Spatial Queries
    getElementsInRegion,

    // HTML Export
    exportHtml,

    // Performance
    getPerformanceStats,

    // Table-specific methods
    addTableRow: useCallback(
      (elementId: string, atIndex?: number): boolean => {
        return (
          safeCall(
            () => engineRef.current!.addTableRow(elementId, atIndex),
            false
          ) || false
        );
      },
      [safeCall]
    ),
    removeTableRow: useCallback(
      (elementId: string, index: number): boolean => {
        return (
          safeCall(
            () => engineRef.current!.removeTableRow(elementId, index),
            false
          ) || false
        );
      },
      [safeCall]
    ),
    addTableColumn: useCallback(
      (elementId: string, atIndex?: number): boolean => {
        return (
          safeCall(
            () => engineRef.current!.addTableColumn(elementId, atIndex),
            false
          ) || false
        );
      },
      [safeCall]
    ),
    removeTableColumn: useCallback(
      (elementId: string, index: number): boolean => {
        return (
          safeCall(
            () => engineRef.current!.removeTableColumn(elementId, index),
            false
          ) || false
        );
      },
      [safeCall]
    ),
    updateTableCell: useCallback(
      (elementId: string, row: number, col: number, content: string): boolean => {
        return (
          safeCall(
            () => engineRef.current!.updateTableCell(elementId, row, col, content),
            false
          ) || false
        );
      },
      [safeCall]
    ),
    mergeTableCells: useCallback(
      (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number): boolean => {
        return (
          safeCall(
            () => engineRef.current!.mergeTableCells(elementId, startRow, startCol, endRow, endCol),
            false
          ) || false
        );
      },
      [safeCall]
    ),
    getTableData: useCallback(
      (elementId: string): any => {
        return safeCall(() => engineRef.current!.getTableData(elementId));
      },
      [safeCall]
    ),
    updateTableColumnWidth: useCallback(
      (elementId: string, columnIndex: number, width: number): boolean => {
        return (
          safeCall(
            () => engineRef.current!.updateTableColumnWidth(elementId, columnIndex, width),
            false
          ) || false
        );
      },
      [safeCall]
    ),
  updateTableRowHeight: useCallback(
    (elementId: string, rowIndex: number, height: number): boolean => {
      return (
        safeCall(
          () => engineRef.current!.updateTableRowHeight(elementId, rowIndex, height),
          false
        ) || false
      );
    },
    [safeCall]
  ),

  // Excel-like calculation functions
  calculateColumnSum: useCallback(
    (elementId: string, colIndex: number): number => {
      return (
        safeCall(
          () => engineRef.current!.calculateColumnSum(elementId, colIndex),
          0
        ) || 0
      );
    },
    [safeCall]
  ),

  calculateRowSum: useCallback(
    (elementId: string, rowIndex: number): number => {
      return (
        safeCall(
          () => engineRef.current!.calculateRowSum(elementId, rowIndex),
          0
        ) || 0
      );
    },
    [safeCall]
  ),

  calculateAverage: useCallback(
    (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number): number => {
      return (
        safeCall(
          () => engineRef.current!.calculateAverage(elementId, startRow, startCol, endRow, endCol),
          0
        ) || 0
      );
    },
    [safeCall]
  ),

  autoFitColumns: useCallback(
    (elementId: string): boolean => {
      return (
        safeCall(
          () => engineRef.current!.autoFitColumns(elementId),
          false
        ) || false
      );
    },
    [safeCall]
  ),

    // Performance optimization methods for StylePanel
    parseFormFieldData: useCallback(
      (elementId: string): any => {
        return safeCall(() => engineRef.current!.parseFormFieldData(elementId), {
          showLabel: true,
          gap: 8,
          labelWidth: 30,
          valueWidth: 70,
          underlineStyle: 'solid'
        });
      },
      [safeCall]
    ),

    calculateSafeStyle: useCallback(
      (elementId: string): ElementStyle | null => {
        return safeCall(() => engineRef.current!.calculateSafeStyle(elementId));
      },
      [safeCall]
    ),

    getElementTypeFlags: useCallback(
      (elementId: string): { isTable: boolean; isFormField: boolean; elementType: string } => {
        return safeCall(() => engineRef.current!.getElementTypeFlags(elementId), {
          isTable: false,
          isFormField: false,
          elementType: 'unknown'
        }) || { isTable: false, isFormField: false, elementType: 'unknown' };
      },
      [safeCall]
    ),

    batchUpdateFormField: useCallback(
      (elementId: string, updates: any): boolean => {
        return safeCall(() => engineRef.current!.batchUpdateFormField(elementId, updates), false) || false;
      },
      [safeCall]
    ),

    getElementForStylePanel: useCallback(
      (elementId: string): Element | null => {
        return safeCall(() => engineRef.current!.getElementForStylePanel(elementId));
      },
      [safeCall]
    ),

    validateStyleUpdate: useCallback(
      (style: Partial<ElementStyle>): Partial<ElementStyle> => {
        return safeCall(() => engineRef.current!.validateStyleUpdate(style), {}) || {};
      },
      [safeCall]
    ),

    getElementsSummary: useCallback(
      (): { total: number; by_type: Record<string, number> } => {
        return safeCall(() => engineRef.current!.getElementsSummary(), { total: 0, by_type: {} }) || { total: 0, by_type: {} };
      },
      [safeCall]
    ),

    // Table Cell Operations
    updateTableCellStyle: useCallback(
      (elementId: string, row: number, col: number, style: any): boolean => {
        return safeCall(() => engineRef.current!.updateTableCellStyle(elementId, row, col, style), false) || false;
      },
      [safeCall]
    ),

    getTableCellStyle: useCallback(
      (elementId: string, row: number, col: number): any => {
        return safeCall(() => engineRef.current!.getTableCellStyle(elementId, row, col), null);
      },
      [safeCall]
    ),

    getTableDimensions: useCallback(
      (elementId: string): any => {
        return safeCall(() => engineRef.current!.getTableDimensions(elementId), null);
      },
      [safeCall]
    ),

    // Zoom methods
    getZoom: useCallback(
      (): number => {
        const result = safeCall(() => engineRef.current!.getZoom(), 1.0);
        return result || 1.0;
      },
      [safeCall]
    ),

    setZoom: useCallback(
      (zoom: number): number => {
        const result = safeCall(() => engineRef.current!.setZoom(zoom), 1.0);
        return result || 1.0;
      },
      [safeCall]
    ),

    fitA4PapersToViewport: useCallback(
      (papers: any[], marginPercent: number = 0.9): void => {
        safeCall(() => engineRef.current!.fitA4PapersToViewport(papers, marginPercent));
      },
      [safeCall]
    ),

    // Utility
    reset,
    calculateDropPosition,

    // Spatial Indexing methods
    queryElementsInRegion: useCallback(
      (x: number, y: number, width: number, height: number): Element[] => {
        return safeCall(() => engineRef.current!.queryElementsInRegion(x, y, width, height), []) || [];
      },
      [safeCall]
    ),

    findElementsAtPoint: useCallback(
      (x: number, y: number): Element[] => {
        return safeCall(() => engineRef.current!.findElementsAtPoint(x, y), []) || [];
      },
      [safeCall]
    ),

    findNearestElement: useCallback(
      (x: number, y: number, maxDistance: number = 100): Element | null => {
        return safeCall(() => engineRef.current!.findNearestElement(x, y, maxDistance), null);
      },
      [safeCall]
    ),

    detectElementCollisions: useCallback(
      (elementId: string): Element[] => {
        return safeCall(() => engineRef.current!.detectElementCollisions(elementId), []) || [];
      },
      [safeCall]
    ),

    getSpatialIndexStats: useCallback(
      (): any => {
        return safeCall(() => engineRef.current!.getSpatialIndexStats(), null);
      },
      [safeCall]
    ),

    updateSpatialIndexBounds: useCallback(
      (x: number, y: number, width: number, height: number): void => {
        safeCall(() => engineRef.current!.updateSpatialIndexBounds(x, y, width, height));
      },
      [safeCall]
    ),

    rebuildSpatialIndex: useCallback(
      (cellSize: number = 100): void => {
        safeCall(() => engineRef.current!.rebuildSpatialIndex(cellSize));
      },
      [safeCall]
    ),
    autoOptimizeSpatialIndex: useCallback(
      (): boolean => {
        return safeCall(() => engineRef.current!.autoOptimizeSpatialIndex(), false) || false;
      },
      [safeCall]
    ),
  };
};

// Hook for performance monitoring
export const useWasmPerformanceMonitor = (
  engine: UseWasmEngineReturn,
  interval: number = 1000
) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);

  useEffect(() => {
    if (!engine.state.isLoaded) return;

    const intervalId = setInterval(() => {
      const currentStats = engine.getPerformanceStats();
      if (currentStats) {
        setStats(currentStats);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [engine, interval]);

  return stats;
};

// Hook for element management with optimistic updates
export const useWasmElements = (engine: UseWasmEngineReturn) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh elements from WASM
  const refreshElements = useCallback(async () => {
    if (!engine.state.isLoaded) return;

    setIsLoading(true);
    try {
      const allElements = engine.getAllElements();
      setElements(allElements);
    } catch (error) {
      console.error('Failed to refresh elements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  // Create element with optimistic update
  const createElementOptimistic = useCallback(
    (componentType: string, x: number, y: number) => {
      if (!engine.state.isLoaded) return null;

      const newElement = engine.createElement(componentType, x, y);
      if (newElement) {
        setElements(prev => [...prev, newElement]);
        return newElement;
      }
      return null;
    },
    [engine]
  );

  // Update element position with optimistic update
  const updateElementPositionOptimistic = useCallback(
    (elementId: string, x: number, y: number) => {
      // Optimistic update
      setElements(prev =>
        prev.map(el => (el.id === elementId ? { ...el, x, y } : el))
      );

      // Actual WASM update
      const success = engine.updateElementPosition(elementId, x, y);
      if (!success) {
        // Revert on failure
        refreshElements();
      }
      return success;
    },
    [engine, refreshElements]
  );

  // Delete element with optimistic update
  const deleteElementOptimistic = useCallback(
    (elementId: string) => {
      // Optimistic update
      setElements(prev => prev.filter(el => el.id !== elementId));

      // Actual WASM update
      const success = engine.deleteElement(elementId);
      if (!success) {
        // Revert on failure
        refreshElements();
      }
      return success;
    },
    [engine, refreshElements]
  );

  // Initial load and engine state changes
  useEffect(() => {
    if (engine.state.isLoaded) {
      refreshElements();
    }
  }, [engine.state.isLoaded, refreshElements]);

  // Table-specific methods
  const addTableRow = useCallback(
    (elementId: string, atIndex?: number) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.addTableRow(elementId, atIndex);
    },
    [engine]
  );

  const removeTableRow = useCallback(
    (elementId: string, index: number) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.removeTableRow(elementId, index);
    },
    [engine]
  );

  const addTableColumn = useCallback(
    (elementId: string, atIndex?: number) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.addTableColumn(elementId, atIndex);
    },
    [engine]
  );

  const removeTableColumn = useCallback(
    (elementId: string, index: number) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.removeTableColumn(elementId, index);
    },
    [engine]
  );

  const updateTableCell = useCallback(
    (elementId: string, row: number, col: number, content: string) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.updateTableCell(elementId, row, col, content);
    },
    [engine]
  );

  const mergeTableCells = useCallback(
    (elementId: string, startRow: number, startCol: number, endRow: number, endCol: number) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.mergeTableCells(elementId, startRow, startCol, endRow, endCol);
    },
    [engine]
  );

  const getTableData = useCallback(
    (elementId: string) => {
      if (!engine.state.isLoaded || !engine.state.engine) return null;
      return engine.state.engine.getTableData(elementId);
    },
    [engine]
  );

  const updateTableColumnWidth = useCallback(
    (elementId: string, columnIndex: number, width: number) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.updateTableColumnWidth(elementId, columnIndex, width);
    },
    [engine]
  );

  const updateTableRowHeight = useCallback(
    (elementId: string, rowIndex: number, height: number) => {
      if (!engine.state.isLoaded || !engine.state.engine) return false;
      return engine.state.engine.updateTableRowHeight(elementId, rowIndex, height);
    },
    [engine]
  );

  return {
    elements,
    isLoading,
    refreshElements,
    createElement: createElementOptimistic,
    updateElementPosition: updateElementPositionOptimistic,
    deleteElement: deleteElementOptimistic,
    // Table-specific methods
    addTableRow,
    removeTableRow,
    addTableColumn,
    removeTableColumn,
    updateTableCell,
    mergeTableCells,
    getTableData,
    updateTableColumnWidth,
    updateTableRowHeight,
  };
};

export default useWasmEngine;
