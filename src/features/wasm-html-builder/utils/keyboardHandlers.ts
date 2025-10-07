import { Element } from '../module/wasm-interface';

interface KeyboardHandlersProps {
  selectedElementId: string | null;
  elements: Element[];
  copyPaste: any;
  undoRedo: any;
  onPasteElement: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteElement: (elementId: string) => void;
}

export const createKeyboardHandlers = ({
  selectedElementId,
  elements,
  copyPaste,
  undoRedo,
  onPasteElement,
  onUndo,
  onRedo,
  onDeleteElement,
}: KeyboardHandlersProps) => {
  return (e: KeyboardEvent) => {
    // Don't interfere with text editing
    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLInputElement
    ) {
      return;
    }

    // Copy element (Ctrl+C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementId) {
      e.preventDefault();
      const element = elements.find(el => el.id === selectedElementId);
      if (element) {
        copyPaste.copyElement(element);
      }
    }

    // Paste element (Ctrl+V)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'v' &&
      copyPaste.hasCopiedElement
    ) {
      e.preventDefault();
      onPasteElement();
    }

    // Undo (Ctrl+Z)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'z' &&
      !e.shiftKey &&
      undoRedo.canUndo
    ) {
      e.preventDefault();
      onUndo();
    }

    // Redo (Ctrl+Y or Ctrl+Shift+Z)
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'y' || (e.key === 'z' && e.shiftKey)) &&
      undoRedo.canRedo
    ) {
      e.preventDefault();
      onRedo();
    }

    // Delete element (Delete or Backspace key)
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
      e.preventDefault();
      onDeleteElement(selectedElementId);
    }
  };
};
