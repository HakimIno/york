import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

export interface RulerConfig {
  showRuler: boolean;
  unit: 'px' | 'mm' | 'cm' | 'in';
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
}

export interface RulerPosition {
  x: number;
  y: number;
  unit: string;
  pixelX: number;
  pixelY: number;
}

const DEFAULT_RULER_CONFIG: RulerConfig = {
  showRuler: true,
  unit: 'px',
  zoom: 1,
  snapToGrid: false,
  gridSize: 20,
  showGrid: false,
};

export const useRuler = (initialConfig?: Partial<RulerConfig>) => {
  const [config, setConfig] = useState<RulerConfig>({
    ...DEFAULT_RULER_CONFIG,
    ...initialConfig,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 });

  // Update canvas size when container changes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update scroll position
  const handleScroll = useCallback((scrollLeft: number, scrollTop: number) => {
    setScrollPosition({ left: scrollLeft, top: scrollTop });
  }, []);

  // Convert pixels to current unit
  const convertToUnit = useCallback((pixels: number): number => {
    const dpi = 96; // Standard web DPI
    const mmPerInch = 25.4;
    const cmPerInch = 2.54;
    
    switch (config.unit) {
      case 'mm':
        return (pixels / dpi) * mmPerInch;
      case 'cm':
        return (pixels / dpi) * cmPerInch;
      case 'in':
        return pixels / dpi;
      case 'px':
      default:
        return pixels;
    }
  }, [config.unit]);

  // Convert unit to pixels
  const convertFromUnit = useCallback((value: number): number => {
    const dpi = 96;
    const mmPerInch = 25.4;
    const cmPerInch = 2.54;
    
    switch (config.unit) {
      case 'mm':
        return (value / mmPerInch) * dpi;
      case 'cm':
        return (value / cmPerInch) * dpi;
      case 'in':
        return value * dpi;
      case 'px':
      default:
        return value;
    }
  }, [config.unit]);

  // Get position info for a given pixel coordinate
  const getPositionInfo = useCallback((pixelX: number, pixelY: number): RulerPosition => {
    return {
      x: convertToUnit(pixelX),
      y: convertToUnit(pixelY),
      unit: config.unit,
      pixelX,
      pixelY,
    };
  }, [convertToUnit, config.unit]);

  // Snap position to grid if enabled
  const snapToGrid = useCallback((pixelX: number, pixelY: number): { x: number; y: number } => {
    if (!config.snapToGrid) {
      return { x: pixelX, y: pixelY };
    }

    const gridSizePx = convertFromUnit(config.gridSize);
    return {
      x: Math.round(pixelX / gridSizePx) * gridSizePx,
      y: Math.round(pixelY / gridSizePx) * gridSizePx,
    };
  }, [config.snapToGrid, config.gridSize, convertFromUnit]);

  // Update ruler configuration
  const updateConfig = useCallback((updates: Partial<RulerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle ruler visibility
  const toggleRuler = useCallback(() => {
    setConfig(prev => ({ ...prev, showRuler: !prev.showRuler }));
  }, []);

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
    setConfig(prev => ({ ...prev, showGrid: !prev.showGrid }));
  }, []);

  // Toggle snap to grid
  const toggleSnapToGrid = useCallback(() => {
    setConfig(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  }, []);

  // Set unit
  const setUnit = useCallback((unit: RulerConfig['unit']) => {
    setConfig(prev => ({ ...prev, unit }));
  }, []);

  // Set zoom level
  const setZoom = useCallback((zoom: number) => {
    setConfig(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(5, zoom)) }));
  }, []);

  // Set grid size
  const setGridSize = useCallback((gridSize: number) => {
    setConfig(prev => ({ ...prev, gridSize: Math.max(1, gridSize) }));
  }, []);

  // Generate grid lines for canvas
  const generateGridLines = useMemo(() => {
    if (!config.showGrid) return { horizontal: [], vertical: [] };

    const gridSizePx = convertFromUnit(config.gridSize);
    const horizontal: number[] = [];
    const vertical: number[] = [];

    // Generate horizontal lines
    for (let y = 0; y <= canvasSize.height; y += gridSizePx) {
      horizontal.push(y);
    }

    // Generate vertical lines
    for (let x = 0; x <= canvasSize.width; x += gridSizePx) {
      vertical.push(x);
    }

    return { horizontal, vertical };
  }, [config.showGrid, config.gridSize, canvasSize, convertFromUnit]);

  // Reset to default configuration
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_RULER_CONFIG);
  }, []);

  return {
    // Configuration
    config,
    canvasSize,
    scrollPosition,
    
    // Refs
    canvasRef,
    
    // Actions
    updateConfig,
    toggleRuler,
    toggleGrid,
    toggleSnapToGrid,
    setUnit,
    setZoom,
    setGridSize,
    resetConfig,
    handleScroll,
    
    // Utilities
    convertToUnit,
    convertFromUnit,
    getPositionInfo,
    snapToGrid,
    generateGridLines,
  };
};
