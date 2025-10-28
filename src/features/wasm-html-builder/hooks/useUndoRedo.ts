'use client';

import { useState, useCallback, useRef } from 'react';
import { Element } from '../module/wasm-interface';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  elements: Element[];
  description: string;
}

export interface UndoRedoHook {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Element[] | null;
  redo: () => Element[] | null;
  saveState: (
    elements: Element[],
    action: string,
    description?: string
  ) => void;
  clearHistory: () => void;
  getHistorySize: () => number;
  getCurrentHistoryIndex: () => number;
}

const MAX_HISTORY_SIZE = 50; // Increased for better history tracking

export const useUndoRedo = (): UndoRedoHook => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const historyRef = useRef<HistoryEntry[]>([]);
  const currentIndexRef = useRef(-1);
  const lastSaveTime = useRef<number>(0);
  const saveThrottleMs = 500; // Reduced throttle for more responsive undo/redo
  const lastElementsHash = useRef<string>(''); // To avoid duplicate saves
  const isUndoRedoInProgress = useRef(false); // Flag to prevent saveState during undo/redo
  
  // Sync refs with state
  historyRef.current = history;
  currentIndexRef.current = currentIndex;

  const saveState = useCallback(
    (elements: Element[], action: string, description?: string) => {
      // Don't save state during undo/redo operations
      if (isUndoRedoInProgress.current) {
        console.log('[Undo/Redo] Skipping saveState during undo/redo operation');
        return;
      }

      const now = Date.now();

      const elementsHash = JSON.stringify(
        elements.map(el => ({
          id: el.id,
          x: Math.round(el.x),
          y: Math.round(el.y),
          width: Math.round(el.width),
          height: Math.round(el.height),
          content: el.content,
          style: el.style,
        }))
      );

      if (elementsHash === lastElementsHash.current) {
        return;
      }

      if (
        now - lastSaveTime.current < saveThrottleMs &&
        action === 'elements_changed'
      ) {
        return;
      }

      lastSaveTime.current = now;
      lastElementsHash.current = elementsHash;

      const newEntry: HistoryEntry = {
        id: `history-${now}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        action,
        elements: elements.map(el => ({
          id: el.id,
          element_type: el.element_type,
          component_id: el.component_id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          z_index: el.z_index,
          visible: el.visible,
          content: el.content,
          style: { ...el.style }, // Deep copy style
        })),
        description: description || action,
      };

      // Remove any entries after current index (when undoing then making new changes)
      const newHistory = historyRef.current.slice(0, currentIndexRef.current + 1);

      // Add new entry
      newHistory.push(newEntry);

      // Limit history size
      let newIndex: number;
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        newIndex = newHistory.length - 1;
      } else {
        newIndex = newHistory.length - 1;
      }

      setHistory(newHistory);
      setCurrentIndex(newIndex);

      console.log(`[History] State saved: ${action} | Index: ${newIndex + 1}/${newHistory.length} | Can undo: true | Can redo: ${newIndex < newHistory.length - 1}`);
    },
    [saveThrottleMs]
  );

  const undo = useCallback((): Element[] | null => {
    if (currentIndexRef.current < 0 || historyRef.current.length === 0) {
      console.log('[Undo] Cannot undo: no history available');
      return null;
    }

    // If at index 0, return empty array (no more states to go back to)
    if (currentIndexRef.current === 0) {
      console.log('[Undo] At first state, returning to empty state');
      // Set flag to prevent saveState during undo
      isUndoRedoInProgress.current = true;
      setCurrentIndex(-1);
      
      // Clear flag in next tick
      Promise.resolve().then(() => {
        isUndoRedoInProgress.current = false;
      });
      
      return [];
    }

    const newIndex = currentIndexRef.current - 1;
    const targetEntry = historyRef.current[newIndex];
    
    // Set flag to prevent saveState during undo
    isUndoRedoInProgress.current = true;
    
    setCurrentIndex(newIndex);
    
    console.log('[Undo] Restoring state:', targetEntry.description, `(${newIndex + 1}/${historyRef.current.length})`);

    // Return elements and clear flag in next tick
    Promise.resolve().then(() => {
      isUndoRedoInProgress.current = false;
    });

    return targetEntry.elements;
  }, []);

  const redo = useCallback((): Element[] | null => {
    // Can't redo if we're already at the latest state
    if (currentIndexRef.current >= historyRef.current.length - 1) {
      console.log('[Redo] Cannot redo: at the end of history');
      return null;
    }

    // Can't redo if there's no history
    if (historyRef.current.length === 0) {
      console.log('[Redo] Cannot redo: no history available');
      return null;
    }

    const newIndex = currentIndexRef.current + 1;
    const targetEntry = historyRef.current[newIndex];
    
    // Set flag to prevent saveState during redo
    isUndoRedoInProgress.current = true;
    
    setCurrentIndex(newIndex);
    
    console.log('[Redo] Restoring state:', targetEntry.description, `(${newIndex + 1}/${historyRef.current.length})`);

    // Return elements and clear flag in next tick
    Promise.resolve().then(() => {
      isUndoRedoInProgress.current = false;
    });

    return targetEntry.elements;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    lastElementsHash.current = '';
    console.log('History cleared');
  }, []);

  const getHistorySize = useCallback(() => {
    return historyRef.current.length;
  }, []);

  const getCurrentHistoryIndex = useCallback(() => {
    return currentIndex;
  }, [currentIndex]);

  return {
    // canUndo is true when we have at least one state in history
    canUndo: currentIndex >= 0 && history.length > 0,
    // canRedo is true when we're not at the latest state (or at empty state with history available)
    canRedo: currentIndex < history.length - 1 && history.length > 0,
    undo,
    redo,
    saveState,
    clearHistory,
    getHistorySize,
    getCurrentHistoryIndex,
  };
};
