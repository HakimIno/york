import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';
import { Element } from '../../module/wasm-interface';

describe('useUndoRedo', () => {
  const createMockElement = (id: string, x: number = 0, y: number = 0): Element => ({
    id,
    element_type: 'text',
    x,
    y,
    width: 100,
    height: 50,
    content: 'Test',
    style: {
      fontSize: '16px',
      color: '#000000',
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'left',
      backgroundColor: '#ffffff',
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty history', () => {
      const { result } = renderHook(() => useUndoRedo());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.getHistorySize()).toBe(0);
      expect(result.current.getCurrentHistoryIndex()).toBe(-1);
    });
  });

  describe('saveState', () => {
    it('should save initial state', () => {
      const { result } = renderHook(() => useUndoRedo());
      const elements = [createMockElement('el-1')];

      act(() => {
        result.current.saveState(elements, 'create_element', 'Created element 1');
      });

      expect(result.current.getHistorySize()).toBe(1);
      expect(result.current.getCurrentHistoryIndex()).toBe(0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should save multiple states', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState([createMockElement('el-1')], 'create_element', 'Created 1');
      });

      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2')],
          'create_element',
          'Created 2'
        );
      });

      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')],
          'create_element',
          'Created 3'
        );
      });

      expect(result.current.getHistorySize()).toBe(3);
      expect(result.current.getCurrentHistoryIndex()).toBe(2);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should not save duplicate states', () => {
      const { result } = renderHook(() => useUndoRedo());
      const elements = [createMockElement('el-1')];

      act(() => {
        result.current.saveState(elements, 'create_element', 'Created');
      });

      act(() => {
        result.current.saveState(elements, 'create_element', 'Created again');
      });

      expect(result.current.getHistorySize()).toBe(1);
    });

    it('should limit history size to MAX_HISTORY_SIZE', () => {
      const { result } = renderHook(() => useUndoRedo());
      const MAX_SIZE = 50;

      // Save more than MAX_SIZE states
      for (let i = 0; i < MAX_SIZE + 10; i++) {
        act(() => {
          const elements = Array.from({ length: i + 1 }, (_, idx) =>
            createMockElement(`el-${idx}`)
          );
          result.current.saveState(elements, 'create_element', `State ${i}`);
        });
      }

      expect(result.current.getHistorySize()).toBe(MAX_SIZE);
      expect(result.current.canUndo).toBe(true);
    });

    it('should remove redo history when saving after undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Save 3 states
      act(() => {
        result.current.saveState([createMockElement('el-1')], 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2')],
          'create',
          'State 2'
        );
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')],
          'create',
          'State 3'
        );
      });

      // Undo twice
      act(() => {
        result.current.undo();
      });
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
      expect(result.current.getHistorySize()).toBe(3);

      // Save new state - should remove redo history
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-4')],
          'create',
          'New State'
        );
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.getHistorySize()).toBe(2); // State 1 + New State
    });
  });

  describe('undo', () => {
    it('should undo to previous state', () => {
      const { result } = renderHook(() => useUndoRedo());
      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];

      act(() => {
        result.current.saveState(state1, 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(state2, 'create', 'State 2');
      });

      let undoResult: Element[] | null = null;
      act(() => {
        undoResult = result.current.undo();
      });

      expect(undoResult).toEqual(state1);
      expect(result.current.getCurrentHistoryIndex()).toBe(0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it('should not undo when at beginning of history', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState([createMockElement('el-1')], 'create', 'State 1');
      });

      // Undo once
      act(() => {
        result.current.undo();
      });

      // Try to undo again
      let undoResult: Element[] | null = null;
      act(() => {
        undoResult = result.current.undo();
      });

      expect(undoResult).toBeNull();
      expect(result.current.canUndo).toBe(false);
    });

    it('should maintain correct history after multiple undos', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState([createMockElement('el-1')], 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2')],
          'create',
          'State 2'
        );
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')],
          'create',
          'State 3'
        );
      });

      expect(result.current.getCurrentHistoryIndex()).toBe(2);

      act(() => {
        result.current.undo();
      });
      expect(result.current.getCurrentHistoryIndex()).toBe(1);

      act(() => {
        result.current.undo();
      });
      expect(result.current.getCurrentHistoryIndex()).toBe(0);

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('redo', () => {
    it('should redo to next state', () => {
      const { result } = renderHook(() => useUndoRedo());
      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];

      act(() => {
        result.current.saveState(state1, 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(state2, 'create', 'State 2');
      });

      // Undo first
      act(() => {
        result.current.undo();
      });

      // Then redo
      let redoResult: Element[] | null = null;
      act(() => {
        redoResult = result.current.redo();
      });

      expect(redoResult).toEqual(state2);
      expect(result.current.getCurrentHistoryIndex()).toBe(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should not redo when at end of history', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState([createMockElement('el-1')], 'create', 'State 1');
      });

      let redoResult: Element[] | null = null;
      act(() => {
        redoResult = result.current.redo();
      });

      expect(redoResult).toBeNull();
      expect(result.current.canRedo).toBe(false);
    });

    it('should handle multiple redo operations', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState([createMockElement('el-1')], 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2')],
          'create',
          'State 2'
        );
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')],
          'create',
          'State 3'
        );
      });

      // Undo all
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.getCurrentHistoryIndex()).toBe(0);

      // Redo all
      act(() => {
        result.current.redo();
      });
      expect(result.current.getCurrentHistoryIndex()).toBe(1);

      act(() => {
        result.current.redo();
      });
      expect(result.current.getCurrentHistoryIndex()).toBe(2);

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('Undo/Redo Integration', () => {
    it('should handle complete undo/redo workflow', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Create initial state
      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];
      const state3 = [
        createMockElement('el-1'),
        createMockElement('el-2'),
        createMockElement('el-3'),
      ];

      act(() => {
        result.current.saveState(state1, 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(state2, 'create', 'State 2');
      });
      act(() => {
        result.current.saveState(state3, 'create', 'State 3');
      });

      expect(result.current.getCurrentHistoryIndex()).toBe(2);

      // Undo to state 2
      let undoResult: Element[] | null = null;
      act(() => {
        undoResult = result.current.undo();
      });
      expect(undoResult).toEqual(state2);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      // Undo to state 1
      act(() => {
        undoResult = result.current.undo();
      });
      expect(undoResult).toEqual(state1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      // Redo to state 2
      let redoResult: Element[] | null = null;
      act(() => {
        redoResult = result.current.redo();
      });
      expect(redoResult).toEqual(state2);

      // Redo to state 3
      act(() => {
        redoResult = result.current.redo();
      });
      expect(redoResult).toEqual(state3);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.saveState([createMockElement('el-1')], 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-1'), createMockElement('el-2')],
          'create',
          'State 2'
        );
      });

      expect(result.current.getHistorySize()).toBe(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.getHistorySize()).toBe(0);
      expect(result.current.getCurrentHistoryIndex()).toBe(-1);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });
});

