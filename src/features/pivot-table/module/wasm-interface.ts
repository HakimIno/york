// TypeScript interface for WASM pivot table functions

export interface PivotConfig {
  row_fields: string[];
  column_fields: string[];
  value_fields: string[];
  aggregation: 'sum' | 'count' | 'average' | 'max' | 'min';
}

export interface PivotResult {
  headers: string[];
  rows: string[][];
  totals: number[];
}

export interface PivotData {
  rows: string[];
  columns: string[];
  values: number[];
  row_labels: string[];
  column_labels: string[];
}

// WASM module interface
export interface PivotTableWasm {
  // Methods
  add_data(data_json: string): void;
  set_config(config_json: string): void;
  generate_pivot(): string;
  get_sample_data(): string;
  get_sample_config(): string;
}

// Direct function exports
export interface PivotTableModule {
  PivotTable: new() => PivotTableWasm;
  create_pivot_table(): PivotTableWasm;
  calculate_pivot_sum(data: string, row_field: string, col_field: string, value_field: string): string;
  greet(): void;
}

// Main pivot table class for TypeScript usage
export class PivotTable {
  private wasmInstance: PivotTableWasm;

  constructor(wasmInstance: PivotTableWasm) {
    this.wasmInstance = wasmInstance;
  }

  addData(data: Record<string, string>[]): void {
    const dataJson = JSON.stringify(data);
    this.wasmInstance.add_data(dataJson);
  }

  setConfig(config: PivotConfig): void {
    const configJson = JSON.stringify(config);
    this.wasmInstance.set_config(configJson);
  }

  generatePivot(): PivotResult {
    const resultJson = this.wasmInstance.generate_pivot();
    return JSON.parse(resultJson);
  }

  getSampleData(): Record<string, string>[] {
    const sampleDataJson = this.wasmInstance.get_sample_data();
    return JSON.parse(sampleDataJson);
  }

  getSampleConfig(): PivotConfig {
    const sampleConfigJson = this.wasmInstance.get_sample_config();
    return JSON.parse(sampleConfigJson);
  }
}

// Utility functions for easy usage
export class PivotTableUtils {
  static async loadWasmModule(): Promise<PivotTableModule> {
    try {
      // Try to load the actual WASM module
      const wasmModule = await import('./pkg/pivot_table_wasm');
      
      // Check if the module has the required functions
      if (!wasmModule.create_pivot_table) {
        throw new Error('WASM module missing create_pivot_table function');
      }
      
      return wasmModule as PivotTableModule;
    } catch (error) {
      console.warn('Failed to load WASM module, using mock implementation:', error);
      // Fallback to mock implementation
      return {
        PivotTable: class MockPivotTable {
          constructor() {}
          add_data(data_json: string): void {}
          set_config(config_json: string): void {}
          generate_pivot(): string { return '{}'; }
          get_sample_data(): string { return '[]'; }
          get_sample_config(): string { return '{}'; }
        } as any,
        create_pivot_table(): PivotTableWasm {
          let mockData: Record<string, string>[] = [];
          let mockConfig: PivotConfig = {
            row_fields: [],
            column_fields: [],
            value_fields: [],
            aggregation: 'sum'
          };

          return {
            add_data: (data_json: string) => {
              mockData = JSON.parse(data_json);
            },
            set_config: (config_json: string) => {
              mockConfig = JSON.parse(config_json);
            },
            generate_pivot: () => {
              // Simple mock pivot calculation
              const result: PivotResult = {
                headers: ['', 'Total'],
                rows: [['No Data', '0.00']],
                totals: [0]
              };

              if (mockData.length === 0) {
                return JSON.stringify(result);
              }

              // Get unique values for rows and columns
              const rowField = mockConfig.row_fields[0] || 'id';
              const colField = mockConfig.column_fields[0] || 'category';
              const valueField = mockConfig.value_fields[0] || 'amount';

              const rowValues = [...new Set(mockData.map(d => d[rowField] || 'Unknown'))];
              const colValues = [...new Set(mockData.map(d => d[colField] || 'Unknown'))];

              // Create headers
              const headers = ['', ...colValues, 'Total'];
              const rows: string[][] = [];

              let grandTotal = 0;

              // Calculate rows
              for (const rowValue of rowValues) {
                const row: string[] = [rowValue];
                let rowTotal = 0;

                for (const colValue of colValues) {
                  const cellValue = mockData
                    .filter(d => d[rowField] === rowValue && d[colField] === colValue)
                    .reduce((sum, d) => {
                      const val = parseFloat(d[valueField] || '0');
                      return sum + (isNaN(val) ? 0 : val);
                    }, 0);

                  row.push(cellValue.toFixed(2));
                  rowTotal += cellValue;
                }

                row.push(rowTotal.toFixed(2));
                rows.push(row);
                grandTotal += rowTotal;
              }

              // Add totals row
              const totalsRow = ['Total'];
              let colTotals = 0;
              for (const colValue of colValues) {
                const colTotal = mockData
                  .filter(d => d[colField] === colValue)
                  .reduce((sum, d) => {
                    const val = parseFloat(d[valueField] || '0');
                    return sum + (isNaN(val) ? 0 : val);
                  }, 0);
                totalsRow.push(colTotal.toFixed(2));
                colTotals += colTotal;
              }
              totalsRow.push(grandTotal.toFixed(2));
              rows.push(totalsRow);

              result.headers = headers;
              result.rows = rows;
              result.totals = [grandTotal];

              return JSON.stringify(result);
            },
            get_sample_data: () => JSON.stringify(mockData),
            get_sample_config: () => JSON.stringify(mockConfig)
          };
        },
        calculate_pivot_sum(data: string, row_field: string, col_field: string, value_field: string): string {
          return '{}';
        },
        greet(): void {
          console.log('Hello from WASM!');
        }
      };
    }
  }

  static createPivotTable(wasmModule: PivotTableModule): PivotTable {
    const wasmInstance = wasmModule.create_pivot_table();
    return new PivotTable(wasmInstance);
  }

  static async quickPivot(
    data: Record<string, string>[],
    rowField: string,
    colField: string,
    valueField: string,
    aggregation: PivotConfig['aggregation'] = 'sum'
  ): Promise<PivotResult> {
    const wasmModule = await this.loadWasmModule();
    const pivotTable = this.createPivotTable(wasmModule);
    
    pivotTable.addData(data);
    pivotTable.setConfig({
      row_fields: [rowField],
      column_fields: [colField],
      value_fields: [valueField],
      aggregation
    });
    
    return pivotTable.generatePivot();
  }
}

// Sample data generators
export class SampleData {
  static getSalesData(): Record<string, string>[] {
    return [
      { Product: 'Laptop', Region: 'North', Sales: '1000', Quarter: 'Q1' },
      { Product: 'Laptop', Region: 'South', Sales: '1200', Quarter: 'Q1' },
      { Product: 'Phone', Region: 'North', Sales: '800', Quarter: 'Q1' },
      { Product: 'Phone', Region: 'South', Sales: '900', Quarter: 'Q1' },
      { Product: 'Laptop', Region: 'North', Sales: '1100', Quarter: 'Q2' },
      { Product: 'Laptop', Region: 'South', Sales: '1300', Quarter: 'Q2' },
      { Product: 'Phone', Region: 'North', Sales: '850', Quarter: 'Q2' },
      { Product: 'Phone', Region: 'South', Sales: '950', Quarter: 'Q2' },
    ];
  }

  static getEmployeeData(): Record<string, string>[] {
    return [
      { Department: 'IT', Position: 'Developer', Salary: '5000', Experience: '3' },
      { Department: 'IT', Position: 'Manager', Salary: '7000', Experience: '5' },
      { Department: 'HR', Position: 'Specialist', Salary: '4000', Experience: '2' },
      { Department: 'HR', Position: 'Manager', Salary: '6000', Experience: '4' },
      { Department: 'Finance', Position: 'Analyst', Salary: '4500', Experience: '2' },
      { Department: 'Finance', Position: 'Manager', Salary: '6500', Experience: '6' },
    ];
  }
}
