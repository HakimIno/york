"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import {
  useWasmEngine,
  useTemplateManager,
  useCopyPaste,
  useUndoRedo,
  useElementHandlers,
  useTableHandlers,
  usePaperHandlers,
  useTemplateHandlers,
  useUndoRedoHandlers,
  useGlobalEventHandlers,
  useWasmInitialization,
} from "./hooks";
import { useWasmBuilderState } from "./hooks/useWasmBuilderState";
import { useWasmBuilderActions } from "./hooks/useWasmBuilderActions";
import { createKeyboardHandlers } from "./utils/keyboardHandlers";
import { createDragHandlers } from "./utils/dragHandlers";
import { Element, A4Paper, ElementStyle } from "./module/wasm-interface";
import { PaperConfig } from "./types/paper";
import Controls from "./components/Controls";
import Canvas from "./components/Canvas";
import StylePanel from "./components/StylePanel";
import TemplateManager from "./components/TemplateManager";
import PaperControls from "./components/PaperControls";
import ErrorBoundary from "./components/ErrorBoundary";

// Helper function to convert A4Paper to PaperConfig
const convertA4PaperToPaperConfig = (a4Paper: A4Paper): PaperConfig => ({
  id: a4Paper.id,
  size: a4Paper.size,
  orientation: a4Paper.orientation.toLowerCase() as "portrait" | "landscape",
  x: a4Paper.x,
  y: a4Paper.y,
  width: a4Paper.width,
  height: a4Paper.height,
  title: a4Paper.title || undefined,
});

interface WasmHtmlBuilderProps {
  enableDetailedPerformance?: boolean;
}

const WasmHtmlBuilder: React.FC<WasmHtmlBuilderProps> = ({
  enableDetailedPerformance: initialEnableDetailedPerformance = false,
}) => {
  // Initialize WASM engine
  const wasmEngine = useWasmEngine({
    enablePerformanceMonitoring: true,
    autoInitialize: true,
    onError: (error) => console.error("WASM Error:", error),
    onInitialized: () => console.log("WASM Engine initialized!"),
  });

  // Initialize state management
  const state = useWasmBuilderState();
  const [enableDetailedPerformance, setEnableDetailedPerformance] =
    React.useState(initialEnableDetailedPerformance);

  // Performance monitoring toggle handler
  const handleToggleDetailedPerformance = useCallback((enabled: boolean) => {
    setEnableDetailedPerformance(enabled);
  }, []);

  // Memoize expensive computations
  const paperConfigs = useMemo(
    () => state.papers.map(convertA4PaperToPaperConfig),
    [state.papers],
  );

  const selectedElement = useMemo(
    () =>
      state.selectedElementId
        ? state.getElementById(state.selectedElementId) || null
        : null,
    [state.selectedElementId, state.getElementById],
  );

  // Initialize feature hooks
  const templateManager = useTemplateManager();
  const copyPaste = useCopyPaste();
  const undoRedo = useUndoRedo();

  // Initialize WASM and get computed values
  const { centerPosition, elementsCount } = useWasmInitialization({
    wasmEngine,
    state,
    undoRedo,
  });

  // State for current zoom level
  const [currentZoom, setCurrentZoom] = React.useState(1.0);

  // Spatial indexing stats monitoring
  const [spatialStats, setSpatialStats] = React.useState<any>(null);

  React.useEffect(() => {
    if (!enableDetailedPerformance || !wasmEngine.state.isLoaded) return;

    const interval = setInterval(() => {
      try {
        const stats = wasmEngine.getSpatialIndexStats();
        if (stats) {
          console.log("Spatial Index Stats:", stats);
          setSpatialStats(stats);
        } else {
          console.log("No spatial index stats available");
        }
      } catch (error) {
        console.error("Error getting spatial index stats:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [enableDetailedPerformance, wasmEngine.state.isLoaded, wasmEngine]);

  // Update zoom state when WASM engine changes
  React.useEffect(() => {
    if (wasmEngine.state.isLoaded) {
      const updateZoom = () => {
        const zoom = wasmEngine.getZoom();
        setCurrentZoom(zoom);
      };

      updateZoom();

      // Update zoom periodically to reflect changes
      const interval = setInterval(updateZoom, 100);
      return () => clearInterval(interval);
    }
  }, [wasmEngine.state.isLoaded, wasmEngine]);

  // Initialize actions
  const actions = useWasmBuilderActions({
    wasmEngine,
    elements: state.elements,
    setElements: state.setElements,
    selectedElementId: state.selectedElementId,
    setSelectedElementId: state.setSelectedElementId,
    setEditingElementId: state.setEditingElementId,
    setShowStylePanel: state.setShowStylePanel,
    setIsProcessing: state.setIsProcessing,
    setError: state.setError,
    lockedElements: state.lockedElements,
    styleTemplate: state.styleTemplate,
    setStyleTemplate: state.setStyleTemplate,
    pendingUpdatesRef: state.pendingUpdatesRef,
    contentUpdateTimeoutsRef: state.contentUpdateTimeoutsRef,
    undoRedo,
    copyPaste,
    templateManager,
    getElementById: state.getElementById,
    papers: state.papers,
    refreshElements: () => {
      if (wasmEngine.state.isLoaded) {
        const allElements = wasmEngine.getAllElements();
        if (state.styleTemplate) {
          state.setElements((prevElements) => {
            return allElements.map((wasmElement) => {
              const existingElement = state.getElementById(wasmElement.id);
              if (!existingElement) {
                return {
                  ...wasmElement,
                  style: { ...wasmElement.style, ...state.styleTemplate },
                };
              }
              return existingElement;
            });
          });
        } else {
          state.setElements(allElements);
        }
      }
    },
  });

  // Initialize specialized handlers
  const elementHandlers = useElementHandlers({
    wasmEngine,
    state,
    actions,
    copyPaste,
    undoRedo,
  });

  const tableHandlers = useTableHandlers({
    wasmEngine,
    state,
    undoRedo,
  });

  const paperHandlers = usePaperHandlers({
    wasmEngine,
    state,
  });

  const templateHandlers = useTemplateHandlers({
    templateManager,
    state,
  });

  const undoRedoHandlers = useUndoRedoHandlers({
    wasmEngine,
    state,
    undoRedo,
  });

  // Initialize drag handlers
  const dragHandlers = createDragHandlers({
    wasmEngine,
    elements: state.elements,
    setElements: state.setElements,
    selectedElementId: state.selectedElementId,
    setSelectedElementId: state.setSelectedElementId,
    lockedElements: state.lockedElements,
    setError: state.setError,
    setIsDragging: state.setIsDragging,
    setDragElementId: state.setDragElementId,
    dragThrottleRef: state.dragThrottleRef,
    pendingUpdatesRef: state.pendingUpdatesRef,
    undoRedo, // Add undoRedo to save state after drag
  });

  // Initialize global event handlers
  useGlobalEventHandlers({
    state,
    dragHandlers,
  });

  // Keyboard event handlers - use refs to avoid re-creating handler on every element change
  const elementsRef = React.useRef(state.elements);
  const selectedElementIdRef = React.useRef(state.selectedElementId);
  const canUndoRef = React.useRef(undoRedo.canUndo);
  const canRedoRef = React.useRef(undoRedo.canRedo);
  
  React.useEffect(() => {
    elementsRef.current = state.elements;
    selectedElementIdRef.current = state.selectedElementId;
    canUndoRef.current = undoRedo.canUndo;
    canRedoRef.current = undoRedo.canRedo;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Don't interfere with text editing in inputs, textareas, or contentEditable elements
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      // Check if user has selected text on the page (they want to copy text, not elements)
      const selection = window.getSelection();
      const hasTextSelection = selection && selection.toString().length > 0;

      // Copy element (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementIdRef.current && !hasTextSelection) {
        e.preventDefault();
        const element = elementsRef.current.find(el => el.id === selectedElementIdRef.current);
        if (element) {
          copyPaste.copyElement(element);
        }
      }

      // Paste element (Ctrl+V)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'v' &&
        copyPaste.hasCopiedElement &&
        !hasTextSelection
      ) {
        e.preventDefault();
        elementHandlers.handlePasteElement();
      }

      // Undo (Cmd+Z)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'z' &&
        !e.shiftKey
      ) {
        e.preventDefault();
        console.log('[Keyboard] Undo shortcut pressed | canUndo:', canUndoRef.current);
        if (canUndoRef.current) {
          undoRedoHandlers.handleUndo();
        } else {
          console.log('[Keyboard] Cannot undo - no more history');
        }
      }

      // Redo (Cmd+Shift+Z or Cmd+Y)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        const isShiftZ = e.key === 'z' && e.shiftKey;
        console.log(`[Keyboard] Redo shortcut pressed (${isShiftZ ? 'Cmd+Shift+Z' : 'Cmd+Y'}) | canRedo:`, canRedoRef.current);
        if (canRedoRef.current) {
          undoRedoHandlers.handleRedo();
        } else {
          console.log('[Keyboard] Cannot redo - no more history');
        }
      }

      // Delete element (Delete or Backspace key)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIdRef.current) {
        e.preventDefault();
        actions.deleteElement(selectedElementIdRef.current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    copyPaste,
    elementHandlers.handlePasteElement,
    undoRedoHandlers.handleUndo,
    undoRedoHandlers.handleRedo,
    actions.deleteElement,
  ]);

  // Memoize loading and error states
  const { isLoading, error: hasError } = wasmEngine.state;

  return (
    <ErrorBoundary>
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm">
              กำลังโหลด WASM Engine...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center text-red-600">
            <p className="text-xl font-bold">เกิดข้อผิดพลาด!</p>
            <p className="mt-2">{hasError}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !hasError && (
        <div className="w-full h-screen bg-gray-100 dark:bg-neutral-900 overflow-hidden flex flex-col pb-4">
          {/* Paper Controls */}
          <PaperControls
            papers={paperConfigs}
            selectedPaperId={paperHandlers.selectedPaperId}
            onAddPaper={paperHandlers.handleAddPaper}
            onSelectPaper={paperHandlers.handleSelectPaper}
            onRemovePaper={paperHandlers.handleRemovePaper}
            onClearAllPapers={paperHandlers.handleClearAllPapers}
          />

          {/* Controls */}
          <Controls
            enableDetailedPerformance={enableDetailedPerformance}
            onToggleDetailedPerformance={handleToggleDetailedPerformance}
            isProcessing={state.isProcessing}
            selectedElementId={state.selectedElementId}
            elements={state.elements}
            styleTemplate={state.styleTemplate}
            showStylePanel={state.showStylePanel}
            showTemplateManager={state.showTemplateManager}
            showElementBorders={state.showElementBorders}
            showRuler={state.showRuler}
            rulerUnit={state.rulerUnit}
            showGrid={state.showGrid}
            snapToGrid={state.snapToGrid}
            copyPaste={copyPaste}
            undoRedo={undoRedo}
            onCreateElement={actions.createElement}
            onToggleStylePanel={state.toggleStylePanel}
            onToggleTemplateManager={state.toggleTemplateManager}
            onToggleBorders={state.toggleBorders}
            onToggleRuler={state.toggleRuler}
            onToggleGrid={state.toggleGrid}
            onToggleSnapToGrid={state.toggleSnapToGrid}
            onSetRulerUnit={state.setRulerUnit}
            onClearTemplate={templateHandlers.handleClearTemplate}
            onExportHtml={actions.exportHtml}
            onExportPdf={actions.exportPdf}
            onReset={() => {
              wasmEngine.reset();
              state.resetState();
              templateManager.clearCurrentTemplate();
              copyPaste.clearClipboard();
              undoRedo.clearHistory();
              paperHandlers.setSelectedPaperId(null);
              setTimeout(() => {
                const { x: centerX, y: centerY } = centerPosition;
                const paper1 = wasmEngine.createPaper(
                  "paper-1",
                  "A4",
                  "Portrait",
                  centerX,
                  centerY,
                );
                if (paper1) {
                  state.setPapers([paper1]);
                }
              }, 100);
            }}
            onCopyElement={elementHandlers.handleCopyElement}
            onPasteElement={elementHandlers.handlePasteElement}
            onUndo={undoRedoHandlers.handleUndo}
            onRedo={undoRedoHandlers.handleRedo}
            onDebug={elementHandlers.handleDebug}
            // Zoom controls
            onZoomIn={() => {
              if (wasmEngine.state.isLoaded) {
                const newZoom = wasmEngine.setZoom(currentZoom * 1.2);
                setCurrentZoom(newZoom);
              }
            }}
            onZoomOut={() => {
              if (wasmEngine.state.isLoaded) {
                const newZoom = wasmEngine.setZoom(currentZoom * 0.8);
                setCurrentZoom(newZoom);
              }
            }}
            onZoomFit={() => {
              if (wasmEngine.state.isLoaded && paperConfigs.length > 0) {
                wasmEngine.fitA4PapersToViewport(paperConfigs, 0.9);
                setCurrentZoom(wasmEngine.getZoom());
              }
            }}
            onZoomReset={() => {
              if (wasmEngine.state.isLoaded) {
                const newZoom = wasmEngine.setZoom(1.0);
                setCurrentZoom(newZoom);
              }
            }}
            currentZoom={currentZoom}
            isWasmLoaded={wasmEngine.state.isLoaded}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 overflow-hidden">
              <Canvas
                papers={state.papers}
                paperConfigs={paperConfigs}
                selectedPaperId={paperHandlers.selectedPaperId}
                elements={state.elements}
                selectedElementId={state.selectedElementId}
                editingElementId={state.editingElementId}
                isDragging={state.isDragging}
                dragElementId={state.dragElementId}
                lockedElements={state.lockedElements}
                showElementBorders={state.showElementBorders}
                spatialStats={spatialStats}
                showRuler={state.showRuler}
                rulerUnit={state.rulerUnit}
                showGrid={state.showGrid}
                snapToGrid={state.snapToGrid}
                gridSize={state.gridSize}
                onMouseUp={elementHandlers.handleMouseUp}
                onCanvasClick={elementHandlers.handleCanvasClick}
                onPositionChange={actions.handlePositionChange}
                onSizeChange={actions.handleSizeChange}
                onContentChange={actions.handleContentChange}
                onStyleChange={actions.handleStyleChange}
                onElementSelect={elementHandlers.handleElementSelect}
                onStartEdit={elementHandlers.handleStartEdit}
                onEndEdit={elementHandlers.handleEndEdit}
                onDeleteElement={actions.deleteElement}
                onStartDrag={dragHandlers.handleMouseDown}
                onToggleLock={elementHandlers.handleToggleLock}
                onCopyElement={elementHandlers.handleCopyElementFromId}
                onPaperSelect={paperHandlers.handleSelectPaper}
                // Zoom handlers
                onZoom={(zoom) => {
                  if (wasmEngine.state.isLoaded) {
                    wasmEngine.setZoom(zoom);
                  }
                }}
                onZoomToPoint={(screenX, screenY, zoomDelta) => {
                  if (wasmEngine.state.isLoaded) {
                    const newZoom = wasmEngine.zoomToPoint(
                      screenX,
                      screenY,
                      zoomDelta,
                    );
                    setCurrentZoom(newZoom);
                  }
                }}
                currentZoom={currentZoom}
                // Table-specific handlers
                onTableCellChange={tableHandlers.handleTableCellChange}
                onAddRow={tableHandlers.handleAddRow}
                onRemoveRow={tableHandlers.handleRemoveRow}
                onAddColumn={tableHandlers.handleAddColumn}
                onRemoveColumn={tableHandlers.handleRemoveColumn}
                onMergeCells={tableHandlers.handleMergeCells}
                onUpdateColumnWidth={tableHandlers.handleUpdateColumnWidth}
                onUpdateRowHeight={tableHandlers.handleUpdateRowHeight}
                // Cell selection props moved to Zustand store
                // Spatial indexing methods
                onSpatialQuery={(x, y, width, height) => {
                  if (wasmEngine.state.isLoaded) {
                    try {
                      console.log("Spatial Query:", { x, y, width, height });
                      const result = wasmEngine.queryElementsInRegion(
                        x,
                        y,
                        width,
                        height,
                      );
                      console.log("Spatial Query Result:", result);
                      if (result) {
                        return result;
                      }
                    } catch (error) {
                      console.error(
                        "Error querying elements in region:",
                        error,
                      );
                    }
                  }
                  return [];
                }}
                onSpatialFindAtPoint={(x, y) => {
                  if (wasmEngine.state.isLoaded) {
                    try {
                      const result = wasmEngine.findElementsAtPoint(x, y);
                      if (result) {
                        return result;
                      }
                    } catch (error) {
                      console.error("Error finding elements at point:", error);
                    }
                  }
                  return [];
                }}
                onSpatialFindNearest={(x, y, maxDistance) => {
                  if (wasmEngine.state.isLoaded) {
                    try {
                      const result = wasmEngine.findNearestElement(
                        x,
                        y,
                        maxDistance || 100,
                      );
                      if (result) {
                        return result;
                      }
                    } catch (error) {
                      console.error("Error finding nearest element:", error);
                    }
                  }
                  return null;
                }}
                onSpatialDetectCollisions={(elementId) => {
                  if (wasmEngine.state.isLoaded) {
                    try {
                      const result =
                        wasmEngine.detectElementCollisions(elementId);
                      if (result) {
                        return result;
                      }
                    } catch (error) {
                      console.error(
                        "Error detecting element collisions:",
                        error,
                      );
                    }
                  }
                  return [];
                }}
              />
            </div>

            {/* Style Panel - Desktop Sidebar */}
            {state.showStylePanel && state.selectedElementId && (
              <div className="hidden md:flex w-72 border-l border-border bg-background flex-shrink-0">
                <StylePanel
                  element={selectedElement}
                  onStyleChange={actions.handleStyleChange}
                  onContentChange={actions.handleContentChange}
                  onClose={() => state.setShowStylePanel(false)}
                  styleTemplate={state.styleTemplate}
                  // Table-specific handlers
                  onTableCellChange={tableHandlers.handleTableCellChange}
                  onAddRow={tableHandlers.handleAddRow}
                  onRemoveRow={tableHandlers.handleRemoveRow}
                  onAddColumn={tableHandlers.handleAddColumn}
                  onRemoveColumn={tableHandlers.handleRemoveColumn}
                  onMergeCells={tableHandlers.handleMergeCells}
                  onUpdateColumnWidth={tableHandlers.handleUpdateColumnWidth}
                  onUpdateRowHeight={tableHandlers.handleUpdateRowHeight}
                  // Cell selection props moved to Zustand store
                />
              </div>
            )}
          </div>

          {/* Style Panel - Mobile Overlay */}
          {state.showStylePanel && state.selectedElementId && (
            <div
              className="md:hidden fixed inset-0 z-50 bg-black/50"
              onClick={() => state.setShowStylePanel(false)}
            >
              <div
                className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <StylePanel
                  element={selectedElement}
                  onStyleChange={actions.handleStyleChange}
                  onContentChange={actions.handleContentChange}
                  onClose={() => state.setShowStylePanel(false)}
                  styleTemplate={state.styleTemplate}
                  // Table-specific handlers
                  onTableCellChange={tableHandlers.handleTableCellChange}
                  onAddRow={tableHandlers.handleAddRow}
                  onRemoveRow={tableHandlers.handleRemoveRow}
                  onAddColumn={tableHandlers.handleAddColumn}
                  onRemoveColumn={tableHandlers.handleRemoveColumn}
                  onMergeCells={tableHandlers.handleMergeCells}
                  onUpdateColumnWidth={tableHandlers.handleUpdateColumnWidth}
                  onUpdateRowHeight={tableHandlers.handleUpdateRowHeight}
                  // Cell selection props moved to Zustand store
                />
              </div>
            </div>
          )}

          {/* Template Manager */}
          {state.showTemplateManager && (
            <TemplateManager
              templates={templateManager.templates}
              currentTemplate={templateManager.currentTemplate}
              onSaveTemplate={templateHandlers.handleSaveTemplate}
              onLoadTemplate={templateHandlers.handleLoadTemplate}
              onDeleteTemplate={templateManager.deleteTemplate}
              onClearTemplate={templateHandlers.handleClearTemplate}
              onExportTemplates={templateManager.exportTemplates}
              onImportTemplates={templateManager.importTemplates}
              currentStyle={
                state.selectedElementId
                  ? state.getElementById(state.selectedElementId)?.style
                  : undefined
              }
              onClose={() => state.setShowTemplateManager(false)}
            />
          )}
        </div>
      )}
    </ErrorBoundary>
  );
};

export default WasmHtmlBuilder;
