import { useState, useRef, useCallback, useMemo } from 'react';
import { Element, A4Paper, ElementStyle } from '../module/wasm-interface';

export const useWasmBuilderState = () => {
  // Core state
  const [elements, setElements] = useState<Element[]>([]);
  const [papers, setPapers] = useState<A4Paper[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragElementId, setDragElementId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedElements, setLockedElements] = useState<Set<string>>(new Set());
  const [styleTemplate, setStyleTemplate] =
    useState<Partial<ElementStyle> | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showElementBorders, setShowElementBorders] = useState(true);
  const [showRuler, setShowRuler] = useState(true);
  const [rulerUnit, setRulerUnit] = useState<'px' | 'mm' | 'cm' | 'in'>('px');
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  // Cell selection state moved to Zustand store

  // Performance optimization: HashMap for O(1) element lookup
  const elementsMap = useMemo(() => {
    const map = new Map<string, Element>();
    elements.forEach(element => {
      map.set(element.id, element);
    });
    return map;
  }, [elements]);

  // Performance optimization: HashMap for O(1) paper lookup
  const papersMap = useMemo(() => {
    const map = new Map<string, A4Paper>();
    papers.forEach(paper => {
      map.set(paper.id, paper);
    });
    return map;
  }, [papers]);

  // Refs for performance optimization
  const dragThrottleRef = useRef(0);
  const pendingUpdatesRef = useRef<
    Map<string, { x: number; y: number; width: number; height: number }>
  >(new Map());
  const contentUpdateTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map()
  );

  // State management functions
  const clearError = useCallback(() => setError(null), []);

  const toggleStylePanel = useCallback(() => {
    setShowStylePanel(prev => !prev);
  }, []);

  const toggleTemplateManager = useCallback(() => {
    setShowTemplateManager(prev => !prev);
  }, []);

  const toggleBorders = useCallback(() => {
    setShowElementBorders(prev => !prev);
  }, []);

  const toggleRuler = useCallback(() => {
    setShowRuler(prev => !prev);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setSnapToGrid(prev => !prev);
  }, []);

  const clearTemplate = useCallback(() => {
    setStyleTemplate(null);
  }, []);

  const resetState = useCallback(() => {
    setElements([]);
    setPapers([]);
    setSelectedElementId(null);
    setEditingElementId(null);
    setShowStylePanel(false);
    setShowTemplateManager(false);
    setLockedElements(new Set());
    setStyleTemplate(null);
    setError(null);
    setIsProcessing(false);
    setIsDragging(false);
    setDragElementId(null);
    setShowRuler(true);
    setRulerUnit('px');
    setShowGrid(false);
    setSnapToGrid(false);
    setGridSize(20);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    contentUpdateTimeoutsRef.current.forEach(timeout => {
      clearTimeout(timeout);
    });
    contentUpdateTimeoutsRef.current.clear();
  }, []);

  // Helper functions for O(1) lookups
  const getElementById = useCallback((id: string): Element | undefined => {
    return elementsMap.get(id);
  }, [elementsMap]);

  const getPaperById = useCallback((id: string): A4Paper | undefined => {
    return papersMap.get(id);
  }, [papersMap]);

  const hasElement = useCallback((id: string): boolean => {
    return elementsMap.has(id);
  }, [elementsMap]);

  const hasPaper = useCallback((id: string): boolean => {
    return papersMap.has(id);
  }, [papersMap]);

  // Cell selection handlers moved to Zustand store

  return {
    // State
    elements,
    papers,
    isDragging,
    dragElementId,
    selectedElementId,
    editingElementId,
    showStylePanel,
    isProcessing,
    error,
    lockedElements,
    styleTemplate,
    showTemplateManager,
    showElementBorders,
    showRuler,
    rulerUnit,
    showGrid,
    snapToGrid,
    gridSize,

    // Performance optimized lookups
    elementsMap,
    papersMap,
    getElementById,
    getPaperById,
    hasElement,
    hasPaper,

    // Refs
    dragThrottleRef,
    pendingUpdatesRef,
    contentUpdateTimeoutsRef,

    // State setters
    setElements,
    setPapers,
    setIsDragging,
    setDragElementId,
    setSelectedElementId,
    setEditingElementId,
    setIsProcessing,
    setError,
    setLockedElements,
    setStyleTemplate,
    setShowStylePanel,
    setShowTemplateManager,
    setShowRuler,
    setRulerUnit,
    setShowGrid,
    setSnapToGrid,
    setGridSize,

    // Cell selection state moved to Zustand store

    // State management functions
    clearError,
    toggleStylePanel,
    toggleTemplateManager,
    toggleBorders,
    toggleRuler,
    toggleGrid,
    toggleSnapToGrid,
    clearTemplate,
    resetState,
    cleanup,
  };
};
