# Pivot Table with WASM + Rust

A high-performance pivot table implementation using WebAssembly (WASM) and Rust, integrated with React.

## Features

- **High Performance**: Powered by Rust compiled to WebAssembly
- **Multiple Aggregations**: Sum, Count, Average, Max, Min
- **Dynamic Configuration**: Configurable row fields, column fields, and value fields
- **Sample Data**: Built-in sample datasets for testing
- **TypeScript Support**: Full type safety and IntelliSense
- **React Integration**: Ready-to-use React component

## Architecture

### Rust (WASM Backend)
- **Location**: `module/src/lib.rs`
- **Dependencies**: `wasm-bindgen`, `serde`, `serde_json`
- **Features**: 
  - Pivot table calculation engine
  - Data aggregation algorithms
  - Memory-efficient data structures

### TypeScript Interface
- **Location**: `module/wasm-interface.ts`
- **Features**:
  - Type-safe WASM bindings
  - Mock implementation for development
  - Utility functions and sample data generators

### React Component
- **Location**: `index.tsx`
- **Features**:
  - Interactive UI for configuration
  - Real-time pivot table generation
  - Data preview and results display

## Quick Start

### 1. Build WASM Module
```bash
cd src/features/pivot-table/module
./build.sh
```

### 2. Use in React
```tsx
import PivotTable from '@/features/pivot-table'

function App() {
  return <PivotTable />
}
```

## API Reference

### PivotTable Class (TypeScript)
```typescript
const pivotTable = new PivotTable(wasmInstance)

// Add data
pivotTable.addData([
  { Product: 'Laptop', Region: 'North', Sales: '1000' },
  { Product: 'Phone', Region: 'South', Sales: '800' }
])

// Configure
pivotTable.setConfig({
  row_fields: ['Product'],
  column_fields: ['Region'],
  value_fields: ['Sales'],
  aggregation: 'sum'
})

// Generate result
const result = pivotTable.generatePivot()
```

### PivotConfig Interface
```typescript
interface PivotConfig {
  row_fields: string[];      // Fields to group by rows
  column_fields: string[];   // Fields to group by columns
  value_fields: string[];    // Fields to aggregate
  aggregation: 'sum' | 'count' | 'average' | 'max' | 'min';
}
```

### PivotResult Interface
```typescript
interface PivotResult {
  headers: string[];         // Column headers
  rows: string[][];         // Pivot table rows
  totals: number[];         // Column totals
}
```

## Sample Data

### Sales Data
```typescript
SampleData.getSalesData()
// Returns: Product, Region, Sales, Quarter data
```

### Employee Data
```typescript
SampleData.getEmployeeData()
// Returns: Department, Position, Salary, Experience data
```

## Development

### Building
```bash
# Build WASM module
./module/build.sh

# The build generates:
# - pivot_table_wasm_bg.wasm (WebAssembly binary)
# - pivot_table_wasm.js (JavaScript bindings)
# - pivot_table_wasm.d.ts (TypeScript definitions)
```

### Dependencies
- **Rust**: Latest stable version
- **wasm-pack**: For compiling Rust to WASM
- **Node.js**: For React development

### Project Structure
```
src/features/pivot-table/
├── index.tsx              # React component
├── module/
│   ├── src/lib.rs         # Rust implementation
│   ├── Cargo.toml         # Rust dependencies
│   ├── build.sh           # Build script
│   ├── wasm-interface.ts  # TypeScript interface
│   └── pkg/               # Generated WASM files
└── README.md              # This file
```

## Performance

The WASM implementation provides:
- **Memory Efficiency**: Optimized data structures
- **Fast Aggregation**: Rust's performance for calculations
- **Small Bundle Size**: Minimal WASM binary (~650KB)

## Browser Support

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## License

MIT License - feel free to use in your projects!
