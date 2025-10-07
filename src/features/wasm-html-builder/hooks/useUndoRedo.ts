'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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

const MAX_HISTORY_SIZE = 30; // Reduced for better performance

export const useUndoRedo = (): UndoRedoHook => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const lastSaveTime = useRef<number>(0);
  const saveThrottleMs = 1000; // Increased throttle for better performance
  const lastElementsHash = useRef<string>(''); // To avoid duplicate saves

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with text editing
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // Undo will be handled by parent component
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        // Redo will be handled by parent component
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveState = useCallback(
    (elements: Element[], action: string, description?: string) => {
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
          ...el,
          style: { ...el.style }, // Deep copy style
        })),
        description: description || action,
      };

      setHistory(prev => {
        // Remove any entries after current index (when undoing then making new changes)
        const newHistory = prev.slice(0, currentIndex + 1);

        // Add new entry
        newHistory.push(newEntry);

        // Limit history size
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
          setCurrentIndex(newHistory.length - 2); // Adjust index when shifting
        } else {
          setCurrentIndex(newHistory.length - 1);
        }

        return newHistory;
      });

      console.log('State saved:', action, description);
    },
    [currentIndex, saveThrottleMs]
  );

  const undo = useCallback((): Element[] | null => {
    if (currentIndex <= 0) {
      return null;
    }

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);

    const targetEntry = history[newIndex];
    console.log('Undo:', targetEntry.description);

    return targetEntry.elements;
  }, [currentIndex, history]);

  const redo = useCallback((): Element[] | null => {
    if (currentIndex >= history.length - 1) {
      return null;
    }

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    const targetEntry = history[newIndex];
    console.log('Redo:', targetEntry.description);

    return targetEntry.elements;
  }, [currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    console.log('History cleared');
  }, []);

  const getHistorySize = useCallback(() => {
    return history.length;
  }, [history.length]);

  const getCurrentHistoryIndex = useCallback(() => {
    return currentIndex;
  }, [currentIndex]);

  return {
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    undo,
    redo,
    saveState,
    clearHistory,
    getHistorySize,
    getCurrentHistoryIndex,
  };
};
