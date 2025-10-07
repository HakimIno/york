# Table Component Refactoring

This directory contains the refactored TableElement component that has been broken down into smaller, more maintainable pieces.

## Structure

```
table/
├── README.md                 # This file
├── index.ts                  # Main exports
├── types.ts                  # TypeScript interfaces and types
├── utils.ts                  # Utility functions for calculations
├── styles.ts                 # Styling functions and helpers
├── TableElement.tsx          # Main table component
├── TableCell.tsx             # Individual cell component
├── TableControls.tsx         # Row/column remove controls
├── TableActionButtons.tsx    # Main action buttons (add, delete, lock, etc.)
├── TableResizeHandles.tsx    # Row/column resize handles
└── hooks/
    ├── index.ts              # Hook exports
    ├── useTableEditing.ts    # Cell editing logic
    └── useTableResize.ts     # Resize functionality
```

## Components

### TableElement.tsx
The main table component that orchestrates all other components. Handles:
- Main table rendering
- Event coordination
- State management
- Performance optimizations

### TableCell.tsx
Individual table cell component that handles:
- Cell content rendering
- Edit mode switching
- Cell-specific styling

### TableControls.tsx
Row and column control buttons that handle:
- Remove row/column buttons
- Dynamic positioning based on table layout

### TableActionButtons.tsx
Main action buttons for the table:
- Delete table
- Lock/unlock table
- Add row/column
- Auto-fit columns

### TableResizeHandles.tsx
Resize handles for rows and columns:
- Visual resize indicators
- Mouse event handling for resizing

## Hooks

### useTableEditing.ts
Manages cell editing state and interactions:
- Cell selection (single and multi-select)
- Edit mode management
- Content change handling
- Keyboard navigation

### useTableResize.ts
Handles row and column resizing:
- Resize event handling
- Position calculations
- Hover state management

## Utilities

### utils.ts
Pure functions for table calculations:
- `calculateTableDimensions()` - Calculate table size based on content
- `calculateTablePositions()` - Calculate row/column positions with caching
- `getColumnPosition()` - Get precise column positions from DOM
- `getRowPosition()` - Get precise row positions from DOM
- `createDebouncedResize()` - Create debounced resize function

### styles.ts
Styling functions and helpers:
- `getElementStyles()` - Generate element container styles
- `getTableStyles()` - Generate table-specific styles
- `getCellStyles()` - Generate individual cell styles
- `createCellStyleFunction()` - Create memoized cell style function

### types.ts
TypeScript interfaces and types for:
- Component props
- State interfaces
- Style properties
- Event handlers

## Benefits of Refactoring

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other contexts
3. **Testability**: Smaller components are easier to test
4. **Maintainability**: Changes to specific functionality are isolated
5. **Performance**: Better memoization and optimization opportunities
6. **Code Organization**: Clear file structure and naming conventions

## Usage

```tsx
import { TableElement } from './table';

// Use the refactored TableElement exactly like before
<TableElement
  element={element}
  isSelected={isSelected}
  isEditing={isEditing}
  // ... other props
/>
```

The refactored component maintains the same API as the original, ensuring backward compatibility.
