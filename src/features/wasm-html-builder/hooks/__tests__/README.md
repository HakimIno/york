# Undo/Redo Unit Tests

This directory contains comprehensive unit tests for the undo/redo functionality.

## Test Files

### `useUndoRedo.test.ts`
Tests the core undo/redo hook functionality:
- Initial state validation
- Save state operations
- Undo operations
- Redo operations
- History management
- Edge cases

### `undoRedo.integration.test.ts`
Integration tests that simulate real user workflows:
- Creating and deleting elements
- Undo/redo sequences
- Branching history
- Performance with large datasets
- Concurrent operations

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test useUndoRedo.test.ts
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

## Test Coverage

The tests cover the following scenarios:

### ✅ Basic Operations
- [x] Initial state is empty
- [x] Save single state
- [x] Save multiple states
- [x] Undo to previous state
- [x] Redo to next state

### ✅ History Management
- [x] History size limits (MAX_HISTORY_SIZE = 50)
- [x] Duplicate state prevention
- [x] Clear history
- [x] History index tracking

### ✅ Branching
- [x] Save after undo removes redo history
- [x] Correct state restoration after branching

### ✅ Edge Cases
- [x] Undo at beginning of history (should do nothing)
- [x] Redo at end of history (should do nothing)
- [x] Rapid undo/redo operations
- [x] Save state during undo/redo (should be blocked)
- [x] Deep copy of elements (prevent mutations)

### ✅ Performance
- [x] Handle > 50 states efficiently
- [x] Maintain performance with large elements array
- [x] Memory management with history limits

## Expected Behavior

### User Creates Element
```
1. Initial: []
2. Create el-1: [el-1]
3. Create el-2: [el-1, el-2]

History: [[], [el-1], [el-1, el-2]]
Index: 2
canUndo: true
canRedo: false
```

### User Presses Cmd+Z (Undo)
```
Before: [el-1, el-2] (index=2)
After:  [el-1] (index=1)

canUndo: true
canRedo: true
```

### User Presses Cmd+Shift+Z (Redo)
```
Before: [el-1] (index=1)
After:  [el-1, el-2] (index=2)

canUndo: true
canRedo: false
```

### User Undoes then Creates New Element
```
1. State: [el-1, el-2, el-3] (index=2)
2. Undo twice → [el-1] (index=0)
3. Create el-4 → [el-1, el-4]

Old history: [el-1], [el-1, el-2], [el-1, el-2, el-3]
New history: [el-1], [el-1, el-4]  ← el-2 and el-3 removed

canRedo: false (history was branched)
```

## Debugging Failed Tests

If tests fail, check the console logs for detailed information:

```typescript
'[History] State saved: create_element | Index: 2/3 | Can undo: true | Can redo: false'
'[Undo] Restoring state: create_element (1/3)'
'[Redo] Restoring state: create_element (2/3)'
```

### Common Issues

1. **Flag not clearing**: Check that `isUndoRedoInProgress` flag is properly cleared
2. **State not updating**: Verify that `setElements` is called with correct state
3. **History size wrong**: Check that duplicate states are being prevented
4. **Can't redo after undo**: Ensure saveState doesn't run during undo operation

## Adding New Tests

When adding new features to undo/redo, make sure to add tests for:

1. **Happy path**: Normal expected behavior
2. **Edge cases**: Boundary conditions (empty, full history, etc.)
3. **Error cases**: Invalid inputs, concurrent operations
4. **Performance**: Large datasets, rapid operations

Example test structure:

```typescript
it('should [expected behavior]', () => {
  const { result } = renderHook(() => useUndoRedo());
  
  // Arrange
  act(() => {
    result.current.saveState(...);
  });
  
  // Act
  let output;
  act(() => {
    output = result.current.undo();
  });
  
  // Assert
  expect(output).toEqual(...);
  expect(result.current.canUndo).toBe(...);
});
```

## CI/CD Integration

These tests should run automatically on:
- Every commit (pre-commit hook)
- Every pull request
- Before deployment

Minimum required coverage: 80%

