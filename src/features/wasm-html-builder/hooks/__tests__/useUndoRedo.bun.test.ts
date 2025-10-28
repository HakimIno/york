import { describe, it, expect, beforeEach } from 'bun:test';
import { Element } from '../../module/wasm-interface';

// Simple mock implementation for testing without React
class UndoRedoManager {
  private history: Array<{
    id: string;
    timestamp: number;
    action: string;
    elements: Element[];
    description: string;
  }> = [];
  private currentIndex = -1;
  private lastElementsHash = '';
  private isUndoRedoInProgress = false;
  private MAX_HISTORY_SIZE = 50;
  private saveThrottleMs = 500;
  private lastSaveTime = 0;

  get canUndo(): boolean {
    return this.currentIndex >= 0 && this.history.length > 0;
  }

  get canRedo(): boolean {
    return this.currentIndex < this.history.length - 1 && this.history.length > 0;
  }

  saveState(elements: Element[], action: string, description?: string): void {
    if (this.isUndoRedoInProgress) {
      console.log('[Undo/Redo] Skipping saveState during operation');
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

    if (elementsHash === this.lastElementsHash) {
      return;
    }

    if (
      now - this.lastSaveTime < this.saveThrottleMs &&
      action === 'elements_changed'
    ) {
      return;
    }

    this.lastSaveTime = now;
    this.lastElementsHash = elementsHash;

    const newEntry = {
      id: `history-${now}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      action,
      elements: elements.map(el => ({
        ...el,
        style: { ...el.style },
      })),
      description: description || action,
    };

    const newHistory = this.history.slice(0, this.currentIndex + 1);
    newHistory.push(newEntry);

    if (newHistory.length > this.MAX_HISTORY_SIZE) {
      newHistory.shift();
      this.currentIndex = newHistory.length - 1;
    } else {
      this.currentIndex = newHistory.length - 1;
    }

    this.history = newHistory;
    console.log(`[History] State saved: ${action} | Index: ${this.currentIndex + 1}/${newHistory.length}`);
  }

  undo(): Element[] | null {
    if (this.currentIndex < 0 || this.history.length === 0) {
      console.log('[Undo] Cannot undo: no history available');
      return null;
    }

    // If at index 0, return empty array (no more states to go back to)
    if (this.currentIndex === 0) {
      console.log('[Undo] At first state, returning to empty state');
      this.isUndoRedoInProgress = true;
      this.currentIndex = -1;
      
      Promise.resolve().then(() => {
        this.isUndoRedoInProgress = false;
      });
      
      return [];
    }

    this.isUndoRedoInProgress = true;
    const newIndex = this.currentIndex - 1;
    const targetEntry = this.history[newIndex];
    this.currentIndex = newIndex;
    
    console.log('[Undo] Restoring state:', targetEntry.description, `(${newIndex + 1}/${this.history.length})`);
    
    Promise.resolve().then(() => {
      this.isUndoRedoInProgress = false;
    });

    return targetEntry.elements;
  }

  redo(): Element[] | null {
    if (this.currentIndex >= this.history.length - 1) {
      console.log('[Redo] Cannot redo: at the end of history');
      return null;
    }

    if (this.history.length === 0) {
      console.log('[Redo] Cannot redo: no history available');
      return null;
    }

    this.isUndoRedoInProgress = true;
    const newIndex = this.currentIndex + 1;
    const targetEntry = this.history[newIndex];
    this.currentIndex = newIndex;
    
    console.log('[Redo] Restoring state:', targetEntry.description, `(${newIndex + 1}/${this.history.length})`);
    
    Promise.resolve().then(() => {
      this.isUndoRedoInProgress = false;
    });

    return targetEntry.elements;
  }

  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    this.lastElementsHash = '';
    console.log('History cleared');
  }

  getHistorySize(): number {
    return this.history.length;
  }

  getCurrentHistoryIndex(): number {
    return this.currentIndex;
  }
}

// Helper function
function createMockElement(id: string, content: string = 'Test'): Element {
  return {
    id,
    element_type: 'text',
    component_id: '',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    z_index: 0,
    visible: true,
    content,
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
}

describe('UndoRedo Manager', () => {
  let manager: UndoRedoManager;

  beforeEach(() => {
    manager = new UndoRedoManager();
  });

  describe('✅ Initial State', () => {
    it('should initialize with empty history', () => {
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(false);
      expect(manager.getHistorySize()).toBe(0);
      expect(manager.getCurrentHistoryIndex()).toBe(-1);
    });
  });

  describe('✅ Save State', () => {
    it('should save initial state', () => {
      const elements = [createMockElement('el-1')];
      manager.saveState(elements, 'create_element', 'Created element 1');

      expect(manager.getHistorySize()).toBe(1);
      expect(manager.getCurrentHistoryIndex()).toBe(0);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);
    });

    it('should save multiple states', () => {
      manager.saveState([createMockElement('el-1')], 'create', 'State 1');
      manager.saveState(
        [createMockElement('el-1'), createMockElement('el-2')],
        'create',
        'State 2'
      );
      manager.saveState(
        [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')],
        'create',
        'State 3'
      );

      expect(manager.getHistorySize()).toBe(3);
      expect(manager.getCurrentHistoryIndex()).toBe(2);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);
    });

    it('should not save duplicate states', () => {
      const elements = [createMockElement('el-1')];
      manager.saveState(elements, 'create', 'State 1');
      manager.saveState(elements, 'create', 'State 1 again');

      expect(manager.getHistorySize()).toBe(1);
    });
  });

  describe('✅ Undo', () => {
    it('should undo to previous state', () => {
      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];

      manager.saveState(state1, 'create', 'State 1');
      manager.saveState(state2, 'create', 'State 2');

      const undoResult = manager.undo();

      expect(undoResult).toEqual(state1);
      expect(manager.getCurrentHistoryIndex()).toBe(0);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(true);
    });

    it('should return empty array when undoing from first state', () => {
      manager.saveState([createMockElement('el-1')], 'create', 'State 1');
      
      const undoResult = manager.undo();
      expect(undoResult).toEqual([]); // Returns empty array, not null
      expect(manager.getCurrentHistoryIndex()).toBe(-1);
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(true); // Can redo back to state 1
    });
  });

  describe('✅ Redo', () => {
    it('should redo to next state', () => {
      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];

      manager.saveState(state1, 'create', 'State 1');
      manager.saveState(state2, 'create', 'State 2');
      manager.undo();

      const redoResult = manager.redo();

      expect(redoResult).toEqual(state2);
      expect(manager.getCurrentHistoryIndex()).toBe(1);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);
    });

    it('should not redo when at end of history', () => {
      manager.saveState([createMockElement('el-1')], 'create', 'State 1');

      const redoResult = manager.redo();
      expect(redoResult).toBeNull();
      expect(manager.canRedo).toBe(false);
    });
  });

  describe('✅ Complete Workflow', () => {
    it('should handle full undo/redo cycle', () => {
      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];
      const state3 = [
        createMockElement('el-1'),
        createMockElement('el-2'),
        createMockElement('el-3'),
      ];

      // Save states
      manager.saveState(state1, 'create', 'State 1');
      manager.saveState(state2, 'create', 'State 2');
      manager.saveState(state3, 'create', 'State 3');
      
      expect(manager.getCurrentHistoryIndex()).toBe(2);
      expect(manager.getHistorySize()).toBe(3);

      // Undo twice
      let result = manager.undo();
      expect(result).toEqual(state2);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(true);

      result = manager.undo();
      expect(result).toEqual(state1);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(true);

      // Redo twice
      result = manager.redo();
      expect(result).toEqual(state2);

      result = manager.redo();
      expect(result).toEqual(state3);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(false);
    });

    it('should handle branching (undo then create new action)', async () => {
      manager.saveState([createMockElement('el-1')], 'create', 'State 1');
      manager.saveState(
        [createMockElement('el-1'), createMockElement('el-2')],
        'create',
        'State 2'
      );
      manager.saveState(
        [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')],
        'create',
        'State 3'
      );

      expect(manager.getHistorySize()).toBe(3);

      // Undo twice
      manager.undo();
      manager.undo();

      // Wait for async flag to clear
      await Promise.resolve();

      expect(manager.getCurrentHistoryIndex()).toBe(0);
      expect(manager.canRedo).toBe(true);

      // Create new action (should remove redo history)
      manager.saveState(
        [createMockElement('el-1'), createMockElement('el-4')],
        'create',
        'New branch'
      );

      expect(manager.getHistorySize()).toBe(2);
      expect(manager.canRedo).toBe(false);
      expect(manager.canUndo).toBe(true);
    });
  });

  describe('✅ Edge Cases', () => {
    it('should handle rapid undo/redo', () => {
      for (let i = 1; i <= 5; i++) {
        const elements = Array.from({ length: i }, (_, idx) =>
          createMockElement(`el-${idx + 1}`)
        );
        manager.saveState(elements, 'create', `State ${i}`);
      }

      expect(manager.getHistorySize()).toBe(5);

      // Rapid undo
      manager.undo();
      manager.undo();
      manager.undo();

      expect(manager.getCurrentHistoryIndex()).toBe(1);

      // Rapid redo
      manager.redo();
      manager.redo();

      expect(manager.getCurrentHistoryIndex()).toBe(3);
      expect(manager.canUndo).toBe(true);
      expect(manager.canRedo).toBe(true);
    });

    it('should clear history completely', () => {
      manager.saveState([createMockElement('el-1')], 'create', 'State 1');
      manager.saveState(
        [createMockElement('el-1'), createMockElement('el-2')],
        'create',
        'State 2'
      );

      expect(manager.getHistorySize()).toBe(2);

      manager.clearHistory();

      expect(manager.getHistorySize()).toBe(0);
      expect(manager.getCurrentHistoryIndex()).toBe(-1);
      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(false);
    });
  });

  describe('✅ Position & Size Undo/Redo', () => {
    it('should correctly restore element position after drag', () => {
      // Initial position
      const el1 = { 
        ...createMockElement('el-1', 'Text'),
        x: 100,
        y: 100,
        width: 200,
        height: 50
      };
      manager.saveState([el1], 'create', 'Created element at (100, 100)');
      
      // Drag to new position
      const el1Moved = {
        ...el1,
        x: 300,
        y: 250
      };
      manager.saveState([el1Moved], 'drag_element', 'Moved element to (300, 250)');
      
      expect(manager.getHistorySize()).toBe(2);
      expect(manager.canUndo).toBe(true);
      
      // Undo - should go back to original position
      const undoState = manager.undo();
      expect(undoState).not.toBeNull();
      if (undoState) {
        expect(undoState.length).toBe(1);
        expect(undoState[0].x).toBe(100);
        expect(undoState[0].y).toBe(100);
        expect(undoState[0].width).toBe(200);
        expect(undoState[0].height).toBe(50);
      }
      
      // Redo - should go back to new position
      const redoState = manager.redo();
      expect(redoState).not.toBeNull();
      if (redoState) {
        expect(redoState.length).toBe(1);
        expect(redoState[0].x).toBe(300);
        expect(redoState[0].y).toBe(250);
        expect(redoState[0].width).toBe(200);
        expect(redoState[0].height).toBe(50);
      }
    });

    it('should correctly restore element size after resize', () => {
      // Initial size
      const el1 = { 
        ...createMockElement('el-1', 'Text'),
        x: 100,
        y: 100,
        width: 200,
        height: 50
      };
      manager.saveState([el1], 'create', 'Created element');
      
      // Resize element
      const el1Resized = {
        ...el1,
        width: 400,
        height: 150
      };
      manager.saveState([el1Resized], 'resize_element', 'Resized element');
      
      expect(manager.getHistorySize()).toBe(2);
      
      // Undo - should restore original size
      const undoState = manager.undo();
      expect(undoState).not.toBeNull();
      if (undoState) {
        expect(undoState[0].width).toBe(200);
        expect(undoState[0].height).toBe(50);
        expect(undoState[0].x).toBe(100);
        expect(undoState[0].y).toBe(100);
      }
      
      // Redo - should restore new size
      const redoState = manager.redo();
      expect(redoState).not.toBeNull();
      if (redoState) {
        expect(redoState[0].width).toBe(400);
        expect(redoState[0].height).toBe(150);
      }
    });

    it('should handle multiple elements with different positions', () => {
      // Create element 1
      const el1 = { 
        ...createMockElement('el-1', 'Element 1'),
        x: 100,
        y: 100,
        width: 200,
        height: 50
      };
      manager.saveState([el1], 'create', 'Created element 1');
      
      // Create element 2
      const el2 = { 
        ...createMockElement('el-2', 'Element 2'),
        x: 400,
        y: 200,
        width: 150,
        height: 80
      };
      manager.saveState([el1, el2], 'create', 'Created element 2');
      
      // Move element 1 only
      const el1Moved = { ...el1, x: 500, y: 300 };
      manager.saveState([el1Moved, el2], 'drag_element', 'Moved element 1');
      
      // Move element 2 only
      const el2Moved = { ...el2, x: 150, y: 50 };
      manager.saveState([el1Moved, el2Moved], 'drag_element', 'Moved element 2');
      
      expect(manager.getHistorySize()).toBe(4);
      
      // Undo last move (element 2)
      let state = manager.undo();
      expect(state).not.toBeNull();
      if (state) {
        expect(state.length).toBe(2);
        // Element 1 should still be at moved position
        expect(state[0].x).toBe(500);
        expect(state[0].y).toBe(300);
        // Element 2 should be at original position
        expect(state[1].x).toBe(400);
        expect(state[1].y).toBe(200);
      }
      
      // Undo again (element 1 move)
      state = manager.undo();
      expect(state).not.toBeNull();
      if (state) {
        expect(state.length).toBe(2);
        // Both should be at original positions
        expect(state[0].x).toBe(100);
        expect(state[0].y).toBe(100);
        expect(state[1].x).toBe(400);
        expect(state[1].y).toBe(200);
      }
    });

    it('should handle position and size changes together', () => {
      // Initial state
      const el1 = { 
        ...createMockElement('el-1', 'Text'),
        x: 100,
        y: 100,
        width: 200,
        height: 50
      };
      manager.saveState([el1], 'create', 'Created element');
      
      // Move and resize
      const el1Modified = {
        ...el1,
        x: 300,
        y: 250,
        width: 400,
        height: 100
      };
      manager.saveState([el1Modified], 'modify_element', 'Moved and resized');
      
      // Undo
      const undoState = manager.undo();
      expect(undoState).not.toBeNull();
      if (undoState) {
        // Should restore both position and size
        expect(undoState[0].x).toBe(100);
        expect(undoState[0].y).toBe(100);
        expect(undoState[0].width).toBe(200);
        expect(undoState[0].height).toBe(50);
      }
      
      // Redo
      const redoState = manager.redo();
      expect(redoState).not.toBeNull();
      if (redoState) {
        // Should restore both new position and size
        expect(redoState[0].x).toBe(300);
        expect(redoState[0].y).toBe(250);
        expect(redoState[0].width).toBe(400);
        expect(redoState[0].height).toBe(100);
      }
    });

    it('should maintain position precision with decimal values', () => {
      // Test with decimal positions (common in drag operations)
      const el1 = { 
        ...createMockElement('el-1', 'Text'),
        x: 123.456,
        y: 234.789,
        width: 200.5,
        height: 50.25
      };
      manager.saveState([el1], 'create', 'Created at precise position');
      
      const el1Moved = {
        ...el1,
        x: 456.123,
        y: 567.890
      };
      manager.saveState([el1Moved], 'drag_element', 'Moved to new position');
      
      // Undo
      const undoState = manager.undo();
      expect(undoState).not.toBeNull();
      if (undoState) {
        // Should preserve decimal precision
        expect(undoState[0].x).toBe(123.456);
        expect(undoState[0].y).toBe(234.789);
        expect(undoState[0].width).toBe(200.5);
        expect(undoState[0].height).toBe(50.25);
      }
    });

    it('should handle rapid position changes correctly', () => {
      // Simulate rapid dragging
      const positions = [
        { x: 100, y: 100 },
        { x: 150, y: 120 },
        { x: 200, y: 140 },
        { x: 250, y: 160 },
        { x: 300, y: 180 },
      ];
      
      positions.forEach((pos, index) => {
        const el = {
          ...createMockElement('el-1', 'Text'),
          x: pos.x,
          y: pos.y,
          width: 200,
          height: 50
        };
        manager.saveState([el], 'drag_element', `Position ${index + 1}`);
      });
      
      expect(manager.getHistorySize()).toBe(5);
      
      // Undo all
      for (let i = positions.length - 1; i > 0; i--) {
        const state = manager.undo();
        expect(state).not.toBeNull();
        if (state) {
          expect(state[0].x).toBe(positions[i - 1].x);
          expect(state[0].y).toBe(positions[i - 1].y);
        }
      }
      
      // Redo all
      for (let i = 1; i < positions.length; i++) {
        const state = manager.redo();
        expect(state).not.toBeNull();
        if (state) {
          expect(state[0].x).toBe(positions[i].x);
          expect(state[0].y).toBe(positions[i].y);
        }
      }
    });
  });
});

