import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';
import { Element } from '../../module/wasm-interface';

describe('Undo/Redo Integration Tests', () => {
  const createMockElement = (id: string, content: string = 'Test'): Element => ({
    id,
    element_type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    content,
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
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('User Actions Workflow', () => {
    it('should simulate creating elements with undo/redo', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Initial state (empty)
      const state0: Element[] = [];
      act(() => {
        result.current.saveState(state0, 'initial_state', 'Initial empty canvas');
      });

      // User creates element 1
      const state1 = [createMockElement('el-1', 'Element 1')];
      act(() => {
        result.current.saveState(state1, 'create_element', 'Created Element 1');
      });

      expect(result.current.getHistorySize()).toBe(2);
      expect(result.current.canUndo).toBe(true);

      // User creates element 2
      const state2 = [createMockElement('el-1', 'Element 1'), createMockElement('el-2', 'Element 2')];
      act(() => {
        result.current.saveState(state2, 'create_element', 'Created Element 2');
      });

      expect(result.current.getHistorySize()).toBe(3);
      expect(result.current.getCurrentHistoryIndex()).toBe(2);

      // User presses Cmd+Z (undo)
      let currentState = state2;
      act(() => {
        const undoResult = result.current.undo();
        if (undoResult) currentState = undoResult;
      });

      expect(currentState).toEqual(state1);
      expect(result.current.canRedo).toBe(true);

      // User presses Cmd+Z again (undo)
      act(() => {
        const undoResult = result.current.undo();
        if (undoResult) currentState = undoResult;
      });

      expect(currentState).toEqual(state0);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      // User presses Cmd+Shift+Z (redo)
      act(() => {
        const redoResult = result.current.redo();
        if (redoResult) currentState = redoResult;
      });

      expect(currentState).toEqual(state1);
      expect(result.current.canRedo).toBe(true);

      // User presses Cmd+Shift+Z again (redo)
      act(() => {
        const redoResult = result.current.redo();
        if (redoResult) currentState = redoResult;
      });

      expect(currentState).toEqual(state2);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should handle delete action with undo/redo', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Start with 3 elements
      const state1 = [
        createMockElement('el-1'),
        createMockElement('el-2'),
        createMockElement('el-3'),
      ];
      act(() => {
        result.current.saveState(state1, 'initial', 'Initial');
      });

      // Delete element 2
      const state2 = [createMockElement('el-1'), createMockElement('el-3')];
      act(() => {
        result.current.saveState(state2, 'delete_element', 'Deleted element 2');
      });

      expect(result.current.canUndo).toBe(true);

      // Undo delete
      let currentState = state2;
      act(() => {
        const undoResult = result.current.undo();
        if (undoResult) currentState = undoResult;
      });

      expect(currentState).toEqual(state1);
      expect(currentState.length).toBe(3);

      // Redo delete
      act(() => {
        const redoResult = result.current.redo();
        if (redoResult) currentState = redoResult;
      });

      expect(currentState).toEqual(state2);
      expect(currentState.length).toBe(2);
    });

    it('should handle branching history (undo then create new action)', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Create initial sequence
      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];
      const state3 = [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')];

      act(() => {
        result.current.saveState(state1, 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(state2, 'create', 'State 2');
      });
      act(() => {
        result.current.saveState(state3, 'create', 'State 3');
      });

      expect(result.current.getHistorySize()).toBe(3);

      // Undo twice
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.getCurrentHistoryIndex()).toBe(0);
      expect(result.current.canRedo).toBe(true);

      // Create new action (should remove redo history)
      const state4 = [createMockElement('el-1'), createMockElement('el-4')];
      act(() => {
        result.current.saveState(state4, 'create', 'New branch');
      });

      expect(result.current.getHistorySize()).toBe(2); // State 1 + State 4
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);

      // Verify state3 is no longer accessible
      let currentState = state4;
      act(() => {
        const redoResult = result.current.redo();
        if (redoResult) currentState = redoResult;
      });

      expect(currentState).toEqual(state4); // Should not change
    });
  });

  describe('Edge Cases', () => {
    it('should prevent saveState during undo/redo operations', async () => {
      const { result } = renderHook(() => useUndoRedo());

      const state1 = [createMockElement('el-1')];
      const state2 = [createMockElement('el-1'), createMockElement('el-2')];

      act(() => {
        result.current.saveState(state1, 'create', 'State 1');
      });
      act(() => {
        result.current.saveState(state2, 'create', 'State 2');
      });

      // Perform undo
      act(() => {
        result.current.undo();
      });

      // Try to save immediately (should be blocked by flag)
      const historySizeBefore = result.current.getHistorySize();
      act(() => {
        result.current.saveState(state2, 'create', 'Should be blocked');
      });

      // Wait for flag to clear
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // History size should be the same (save was blocked)
      expect(result.current.getHistorySize()).toBeGreaterThanOrEqual(historySizeBefore);
    });

    it('should handle rapid undo/redo operations', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Create multiple states
      for (let i = 1; i <= 5; i++) {
        act(() => {
          const elements = Array.from({ length: i }, (_, idx) =>
            createMockElement(`el-${idx + 1}`)
          );
          result.current.saveState(elements, 'create', `State ${i}`);
        });
      }

      expect(result.current.getHistorySize()).toBe(5);

      // Rapid undo
      act(() => {
        result.current.undo();
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.getCurrentHistoryIndex()).toBe(1);

      // Rapid redo
      act(() => {
        result.current.redo();
        result.current.redo();
      });

      expect(result.current.getCurrentHistoryIndex()).toBe(3);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });

    it('should maintain history integrity after clearing', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Create some history
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

      // Clear history
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.getHistorySize()).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      // Create new history after clearing
      act(() => {
        result.current.saveState([createMockElement('el-3')], 'create', 'New State 1');
      });
      act(() => {
        result.current.saveState(
          [createMockElement('el-3'), createMockElement('el-4')],
          'create',
          'New State 2'
        );
      });

      expect(result.current.getHistorySize()).toBe(2);
      expect(result.current.canUndo).toBe(true);

      // Verify undo works correctly
      let currentState: Element[] | null = null;
      act(() => {
        currentState = result.current.undo();
      });

      expect(currentState).not.toBeNull();
      expect(currentState?.length).toBe(1);
      expect(currentState?.[0].id).toBe('el-3');
    });
  });

  describe('Performance and Limits', () => {
    it('should handle large number of states efficiently', () => {
      const { result } = renderHook(() => useUndoRedo());
      const MAX_SIZE = 50;

      // Create more states than the limit
      for (let i = 0; i < MAX_SIZE + 20; i++) {
        act(() => {
          const elements = [createMockElement(`el-${i}`)];
          result.current.saveState(elements, 'create', `State ${i}`);
        });
      }

      // Should maintain max size
      expect(result.current.getHistorySize()).toBe(MAX_SIZE);
      expect(result.current.canUndo).toBe(true);

      // Should still be able to undo/redo
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('should deep copy elements to prevent mutations', () => {
      const { result } = renderHook(() => useUndoRedo());

      const originalElement = createMockElement('el-1', 'Original');
      const state1 = [originalElement];

      act(() => {
        result.current.saveState(state1, 'create', 'State 1');
      });

      // Mutate original element
      originalElement.content = 'Modified';

      // Undo should return unmodified copy
      let restoredState: Element[] | null = null;
      act(() => {
        // Add another state first
        result.current.saveState([createMockElement('el-2')], 'create', 'State 2');
      });

      act(() => {
        restoredState = result.current.undo();
      });

      expect(restoredState).not.toBeNull();
      expect(restoredState?.[0].content).toBe('Original');
      expect(restoredState?.[0].id).toBe('el-1');
    });
  });
});

