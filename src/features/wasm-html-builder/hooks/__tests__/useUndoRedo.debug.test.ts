import { describe, it, expect, beforeEach } from 'bun:test';
import { Element } from '../../module/wasm-interface';

// Simple mock WASM engine for debugging
class MockWasmEngine {
  private elements: Map<string, Element> = new Map();
  private idCounter = 0;

  createElement(type: string, x: number, y: number): Element {
    const id = `element-${++this.idCounter}`;
    const element: Element = {
      id,
      element_type: type,
      component_id: '',
      x,
      y,
      width: 200,
      height: 50,
      z_index: 0,
      visible: true,
      content: 'New Element',
      style: {
        fontSize: 16,
        color: '#000000',
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        backgroundColor: '#ffffff',
        padding: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000',
      },
    };
    this.elements.set(id, element);
    console.log(`[WASM] Created element ${id} at (${x}, ${y})`);
    return element;
  }

  updateElementPosition(id: string, x: number, y: number): boolean {
    const element = this.elements.get(id);
    if (element) {
      element.x = x;
      element.y = y;
      console.log(`[WASM] Updated ${id} position to (${x}, ${y})`);
      return true;
    }
    return false;
  }

  getAllElements(): Element[] {
    const elements = Array.from(this.elements.values());
    console.log(`[WASM] getAllElements() returning ${elements.length} elements`);
    elements.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
    return elements;
  }

  deleteElement(id: string): boolean {
    const result = this.elements.delete(id);
    console.log(`[WASM] Deleted ${id}: ${result}`);
    return result;
  }

  reset() {
    this.elements.clear();
    this.idCounter = 0;
    console.log('[WASM] Reset');
  }
}

// Simple UndoRedo implementation (same as before)
class UndoRedoManager {
  private history: Array<{ elements: Element[]; action: string }> = [];
  private currentIndex = -1;
  private isUndoRedoInProgress = false;

  get canUndo(): boolean {
    return this.currentIndex >= 0 && this.history.length > 0;
  }

  get canRedo(): boolean {
    return this.currentIndex < this.history.length - 1 && this.history.length > 0;
  }

  saveState(elements: Element[], action: string): void {
    if (this.isUndoRedoInProgress) {
      console.log('[UndoRedo] Skipping save during undo/redo');
      return;
    }

    // Deep copy elements
    const elementsCopy = elements.map(el => ({
      ...el,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      style: { ...el.style },
    }));

    // Remove future history
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new state
    this.history.push({ elements: elementsCopy, action });
    this.currentIndex = this.history.length - 1;
    
    console.log(`[UndoRedo] Saved state: ${action} | Index: ${this.currentIndex + 1}/${this.history.length}`);
    elementsCopy.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
  }

  undo(): Element[] | null {
    if (!this.canUndo) {
      console.log('[UndoRedo] Cannot undo');
      return null;
    }

    if (this.currentIndex === 0) {
      console.log('[UndoRedo] At first state, returning empty');
      this.isUndoRedoInProgress = true;
      this.currentIndex = -1;
      Promise.resolve().then(() => {
        this.isUndoRedoInProgress = false;
      });
      return [];
    }

    this.isUndoRedoInProgress = true;
    this.currentIndex--;
    const state = this.history[this.currentIndex];
    
    console.log(`[UndoRedo] Undo to: ${state.action} | Index: ${this.currentIndex + 1}/${this.history.length}`);
    state.elements.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
    
    Promise.resolve().then(() => {
      this.isUndoRedoInProgress = false;
    });
    
    return state.elements;
  }

  redo(): Element[] | null {
    if (!this.canRedo) {
      console.log('[UndoRedo] Cannot redo');
      return null;
    }

    this.isUndoRedoInProgress = true;
    this.currentIndex++;
    const state = this.history[this.currentIndex];
    
    console.log(`[UndoRedo] Redo to: ${state.action} | Index: ${this.currentIndex + 1}/${this.history.length}`);
    state.elements.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
    
    Promise.resolve().then(() => {
      this.isUndoRedoInProgress = false;
    });
    
    return state.elements;
  }

  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    console.log('[UndoRedo] History cleared');
  }
}

describe('🔍 Undo/Redo Debugging - Real Scenario', () => {
  let wasmEngine: MockWasmEngine;
  let undoRedo: UndoRedoManager;
  let reactElements: Element[];

  beforeEach(() => {
    console.log('\n========================================');
    wasmEngine = new MockWasmEngine();
    undoRedo = new UndoRedoManager();
    reactElements = [];
  });

  it('should simulate real drag and undo scenario', async () => {
    console.log('\n📍 Step 1: Create element');
    // User creates an element at (100, 100)
    const newElement = wasmEngine.createElement('text', 100, 100);
    reactElements = [newElement];
    
    // Save initial state (this happens in createElement)
    undoRedo.saveState(reactElements, 'create_element');
    
    console.log('\n📍 Step 2: User drags element to (300, 250)');
    // User drags the element
    wasmEngine.updateElementPosition(newElement.id, 300, 250);
    
    // React state updates during drag (many times)
    reactElements = reactElements.map(el => 
      el.id === newElement.id ? { ...el, x: 300, y: 250 } : el
    );
    
    console.log('React state after drag:');
    reactElements.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
    
    console.log('\n📍 Step 3: Drag ends - save state');
    // Simulate mouseUp handler
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Get elements from WASM (this is what dragHandlers does)
    const wasmElements = wasmEngine.getAllElements();
    console.log('Elements from WASM:');
    wasmElements.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
    
    // Save state after drag
    undoRedo.saveState(wasmElements, 'drag_element');
    
    console.log('\n📍 Step 4: User presses Undo');
    // User presses Cmd+Z
    const undoState = undoRedo.undo();
    
    if (undoState) {
      console.log('Undo returned elements:');
      undoState.forEach(el => {
        console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
      });
      
      // Apply to React state
      reactElements = undoState;
      
      // Sync to WASM
      console.log('\n📍 Step 5: Sync undone state back to WASM');
      for (const element of undoState) {
        wasmEngine.updateElementPosition(element.id, element.x, element.y);
      }
      
      console.log('Final React state:');
      reactElements.forEach(el => {
        console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
      });
      
      console.log('Final WASM state:');
      const finalWasm = wasmEngine.getAllElements();
      finalWasm.forEach(el => {
        console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
      });
      
      // Verify position restored correctly
      expect(undoState[0].x).toBe(100);
      expect(undoState[0].y).toBe(100);
      expect(reactElements[0].x).toBe(100);
      expect(reactElements[0].y).toBe(100);
      
      const wasmElement = wasmEngine.getAllElements()[0];
      expect(wasmElement.x).toBe(100);
      expect(wasmElement.y).toBe(100);
      
      console.log('\n✅ Position correctly restored to (100, 100)');
    }
  });

  it('should identify issue if saveState uses stale React state', async () => {
    console.log('\n⚠️  Testing PROBLEM SCENARIO: Using stale React state');
    
    console.log('\n📍 Step 1: Create element');
    const newElement = wasmEngine.createElement('text', 100, 100);
    reactElements = [newElement];
    undoRedo.saveState(reactElements, 'create_element');
    
    console.log('\n📍 Step 2: Drag element to (300, 250)');
    wasmEngine.updateElementPosition(newElement.id, 300, 250);
    
    // React state updates
    reactElements = reactElements.map(el => 
      el.id === newElement.id ? { ...el, x: 300, y: 250 } : el
    );
    
    console.log('\n📍 Step 3: PROBLEM - Save using React state instead of WASM');
    // This is the BUG: saving React state instead of WASM state
    console.log('⚠️  Saving React state (BAD):');
    reactElements.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
    undoRedo.saveState(reactElements, 'drag_element');
    
    // Meanwhile, WASM might have different values
    console.log('WASM state might be:');
    const wasmState = wasmEngine.getAllElements();
    wasmState.forEach(el => {
      console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
    });
    
    console.log('\n📍 Step 4: Undo');
    const undoState = undoRedo.undo();
    
    if (undoState) {
      console.log('Undoing to:');
      undoState.forEach(el => {
        console.log(`  - ${el.id}: (${el.x}, ${el.y})`);
      });
      
      console.log('\n✅ This scenario should work if React and WASM are in sync');
      expect(undoState[0].x).toBe(100);
      expect(undoState[0].y).toBe(100);
    }
  });
});

