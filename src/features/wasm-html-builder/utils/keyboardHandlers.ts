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
    // Only intercept if there's no text selection and an element is selected
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedElementId && !hasTextSelection) {
      e.preventDefault();
      const element = elements.find(el => el.id === selectedElementId);
      if (element) {
        copyPaste.copyElement(element);
      }
    }

    // Paste element (Ctrl+V)
    // Only intercept if there's no active input/textarea focused and we have a copied element
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'v' &&
      copyPaste.hasCopiedElement &&
      !hasTextSelection
    ) {
      e.preventDefault();
      onPasteElement();
    }

    // Undo (Ctrl+Z)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.key === 'z' &&
      !e.shiftKey
    ) {
      e.preventDefault();
      if (undoRedo.canUndo) {
        onUndo();
      }
    }

    // Redo (Ctrl+Y or Ctrl+Shift+Z)
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'y' || (e.key === 'z' && e.shiftKey))
    ) {
      e.preventDefault();
      if (undoRedo.canRedo) {
        onRedo();
      }
    }

    // Delete element (Delete or Backspace key)
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
      e.preventDefault();
      onDeleteElement(selectedElementId);
    }
  };
};
