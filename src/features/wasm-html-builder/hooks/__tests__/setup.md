# Test Setup Guide

## Prerequisites

Make sure you have the following packages installed:

```bash
npm install --save-dev @testing-library/react @testing-library/react-hooks jest ts-jest @types/jest
```

## Jest Configuration

If you don't have `jest.config.js` yet, create it in the project root:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
};
```

## Jest Setup File

Create `jest.setup.js` in project root:

```javascript
// jest.setup.js
// Add custom matchers or global setup here
global.console = {
  ...console,
  // Suppress console.log in tests (optional)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:undo": "jest useUndoRedo"
  }
}
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run in watch mode (for development)
```bash
npm run test:watch
```

### Run with coverage report
```bash
npm run test:coverage
```

This will generate a coverage report in `coverage/` directory.

### Run specific tests
```bash
npm test -- useUndoRedo.test.ts
npm test -- undoRedo.integration.test.ts
```

## Understanding Test Output

### ✅ Passing Test
```
PASS  src/features/wasm-html-builder/hooks/__tests__/useUndoRedo.test.ts
  useUndoRedo
    Initial State
      ✓ should initialize with empty history (5ms)
    saveState
      ✓ should save initial state (3ms)
      ✓ should save multiple states (4ms)
```

### ❌ Failing Test
```
FAIL  src/features/wasm-html-builder/hooks/__tests__/useUndoRedo.test.ts
  useUndoRedo
    undo
      ✕ should undo to previous state (15ms)

  ● useUndoRedo › undo › should undo to previous state

    expect(received).toEqual(expected)

    Expected: [{"id": "el-1", ...}]
    Received: [{"id": "el-1", ...}, {"id": "el-2", ...}]
```

## Test Coverage Report

After running `npm run test:coverage`, you'll see:

```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   87.5  |   75.0   |   90.0  |   87.5  |
 useUndoRedo.ts | 95.0 | 85.0 | 100.0 | 95.0 |
----------|---------|----------|---------|---------|
```

Aim for:
- **Statements**: > 80%
- **Branches**: > 70%
- **Functions**: > 90%
- **Lines**: > 80%

## Troubleshooting

### Issue: "Cannot find module '@testing-library/react'"
**Solution**: Install dependencies
```bash
npm install --save-dev @testing-library/react @testing-library/react-hooks
```

### Issue: "ReferenceError: document is not defined"
**Solution**: Make sure `testEnvironment` is set to `'jsdom'` in jest.config.js

### Issue: "Module not found: Can't resolve '@/components/...'"
**Solution**: Add module mapper to jest.config.js:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### Issue: Tests timing out
**Solution**: Increase timeout in test file:
```typescript
jest.setTimeout(10000); // 10 seconds
```

## Continuous Integration

For GitHub Actions, add this workflow:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Next Steps

1. ✅ Run tests: `npm test`
2. ✅ Check coverage: `npm run test:coverage`
3. ✅ Fix any failing tests
4. ✅ Add more tests for new features
5. ✅ Set up pre-commit hooks (optional)

## Pre-commit Hook (Optional)

Install husky for automatic testing before commits:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

This ensures all tests pass before allowing a commit.

