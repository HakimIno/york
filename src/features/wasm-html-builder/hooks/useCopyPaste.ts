'use client';

import { useState, useCallback, useEffect } from 'react';
import { Element } from '../module/wasm-interface';

export interface CopyPasteHook {
  copiedElement: Element | null;
  copyElement: (element: Element) => void;
  pasteElement: (offsetX?: number, offsetY?: number) => Element | null;
  clearClipboard: () => void;
  hasCopiedElement: boolean;
}

export const useCopyPaste = (): CopyPasteHook => {
  const [copiedElement, setCopiedElement] = useState<Element | null>(null);

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

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Copy is handled by the parent component
        // This is just for reference
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Paste is handled by the parent component
        // This is just for reference
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const copyElement = useCallback((element: Element) => {
    // Create a deep copy of the element
    const elementCopy: Element = {
      ...element,
      style: { ...element.style },
      // Don't copy the ID - it will be generated when pasted
      id: '',
    };

    setCopiedElement(elementCopy);

    // Also copy to system clipboard as JSON for cross-session copying
    try {
      const clipboardData = {
        type: 'wasm-html-builder-element',
        element: elementCopy,
        timestamp: Date.now(),
      };

      // Try to use the Clipboard API if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(JSON.stringify(clipboardData));
      }
    } catch (error) {
      console.warn('Could not copy to system clipboard:', error);
    }

    console.log('Element copied:', element.id);
  }, []);

  const pasteElement = useCallback(
    (offsetX: number = 20, offsetY: number = 20): Element | null => {
      if (!copiedElement) {
        return null;
      }

      // Generate new unique ID
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      const newId = `element-${timestamp}-${random}`;

      // Create the pasted element with offset position
      const pastedElement: Element = {
        ...copiedElement,
        id: newId,
        x: copiedElement.x + offsetX,
        y: copiedElement.y + offsetY,
      };

      console.log('Element pasted:', newId);
      return pastedElement;
    },
    [copiedElement]
  );

  const clearClipboard = useCallback(() => {
    setCopiedElement(null);
  }, []);

  return {
    copiedElement,
    copyElement,
    pasteElement,
    clearClipboard,
    hasCopiedElement: !!copiedElement,
  };
};
