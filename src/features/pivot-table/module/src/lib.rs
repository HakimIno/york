use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, pivot-table-wasm!");
}

// Data structures for pivot table
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PivotData {
    pub rows: Vec<String>,
    pub columns: Vec<String>,
    pub values: Vec<f64>,
    pub row_labels: Vec<String>,
    pub column_labels: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PivotConfig {
    pub row_fields: Vec<String>,
    pub column_fields: Vec<String>,
    pub value_fields: Vec<String>,
    pub aggregation: String, // "sum", "count", "average", "max", "min"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PivotResult {
    pub headers: Vec<String>,
    pub rows: Vec<Vec<String>>,
    pub totals: Vec<f64>,
}

// Raw data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawData {
    pub data: Vec<HashMap<String, String>>,
}

#[wasm_bindgen]
pub struct PivotTable {
    raw_data: RawData,
    config: PivotConfig,
}

#[wasm_bindgen]
impl PivotTable {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PivotTable {
        PivotTable {
            raw_data: RawData { data: Vec::new() },
            config: PivotConfig {
                row_fields: Vec::new(),
                column_fields: Vec::new(),
                value_fields: Vec::new(),
                aggregation: "sum".to_string(),
            },
        }
    }

    #[wasm_bindgen]
    pub fn add_data(&mut self, data_json: &str) -> Result<(), JsValue> {
        let data: Vec<HashMap<String, String>> = serde_json::from_str(data_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse data: {}", e)))?;
        
        self.raw_data.data.extend(data);
        Ok(())
    }

    #[wasm_bindgen]
    pub fn set_config(&mut self, config_json: &str) -> Result<(), JsValue> {
        let config: PivotConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;
        
        self.config = config;
        Ok(())
    }

    #[wasm_bindgen]
    pub fn generate_pivot(&self) -> Result<String, JsValue> {
        let result = self.calculate_pivot()?;
        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize result: {}", e)))
    }

    fn calculate_pivot(&self) -> Result<PivotResult, JsValue> {
        if self.raw_data.data.is_empty() {
            return Err(JsValue::from_str("No data available"));
        }

        // Get unique row values
        let mut row_values: Vec<String> = Vec::new();
        for row in &self.raw_data.data {
            for field in &self.config.row_fields {
                if let Some(value) = row.get(field) {
                    if !row_values.contains(value) {
                        row_values.push(value.clone());
                    }
                }
            }
        }

        // Get unique column values
        let mut column_values: Vec<String> = Vec::new();
        for row in &self.raw_data.data {
            for field in &self.config.column_fields {
                if let Some(value) = row.get(field) {
                    if !column_values.contains(value) {
                        column_values.push(value.clone());
                    }
                }
            }
        }

        // Create headers
        let mut headers = vec!["".to_string()]; // Empty cell for row labels
        headers.extend(column_values.clone());
        headers.push("Total".to_string());

        // Calculate pivot data
        let mut pivot_rows: Vec<Vec<String>> = Vec::new();
        let mut totals = vec![0.0; column_values.len() + 1]; // +1 for total column

        for row_value in &row_values {
            let mut pivot_row = vec![row_value.clone()];
            let mut row_total = 0.0;

            for col_value in &column_values {
                let cell_value = self.calculate_cell_value(row_value, col_value);
                pivot_row.push(format!("{:.2}", cell_value));
                row_total += cell_value;
            }

            pivot_row.push(format!("{:.2}", row_total));
            pivot_rows.push(pivot_row);

            // Update totals
            for (i, col_value) in column_values.iter().enumerate() {
                let cell_value = self.calculate_cell_value(row_value, col_value);
                totals[i] += cell_value;
            }
            let last_index = totals.len() - 1;
            totals[last_index] += row_total;
        }

        // Add totals row
        let mut totals_row = vec!["Total".to_string()];
        for total in &totals {
            totals_row.push(format!("{:.2}", total));
        }
        pivot_rows.push(totals_row);

        Ok(PivotResult {
            headers,
            rows: pivot_rows,
            totals,
        })
    }

    fn calculate_cell_value(&self, row_value: &str, col_value: &str) -> f64 {
        let mut values: Vec<f64> = Vec::new();

        for data_row in &self.raw_data.data {
            let mut matches_row = true;
            let mut matches_col = true;

            // Check if row matches
            for field in &self.config.row_fields {
                if let Some(value) = data_row.get(field) {
                    if value != row_value {
                        matches_row = false;
                        break;
                    }
                } else {
                    matches_row = false;
                    break;
                }
            }

            // Check if column matches
            for field in &self.config.column_fields {
                if let Some(value) = data_row.get(field) {
                    if value != col_value {
                        matches_col = false;
                        break;
                    }
                } else {
                    matches_col = false;
                    break;
                }
            }

            if matches_row && matches_col {
                for field in &self.config.value_fields {
                    if let Some(value) = data_row.get(field) {
                        if let Ok(num) = value.parse::<f64>() {
                            values.push(num);
                        }
                    }
                }
            }
        }

        match self.config.aggregation.as_str() {
            "sum" => values.iter().sum(),
            "count" => values.len() as f64,
            "average" => {
                if values.is_empty() {
                    0.0
                } else {
                    values.iter().sum::<f64>() / values.len() as f64
                }
            }
            "max" => values.iter().fold(0.0, |a, &b| a.max(b)),
            "min" => values.iter().fold(f64::INFINITY, |a, &b| a.min(b)),
            _ => values.iter().sum(),
        }
    }

    #[wasm_bindgen]
    pub fn get_sample_data(&self) -> String {
        let sample_data: Vec<HashMap<String, String>> = vec![
            [
                ("Product".to_string(), "Laptop".to_string()),
                ("Region".to_string(), "North".to_string()),
                ("Sales".to_string(), "1000".to_string()),
            ].iter().cloned().collect(),
            [
                ("Product".to_string(), "Laptop".to_string()),
                ("Region".to_string(), "South".to_string()),
                ("Sales".to_string(), "1200".to_string()),
            ].iter().cloned().collect(),
            [
                ("Product".to_string(), "Phone".to_string()),
                ("Region".to_string(), "North".to_string()),
                ("Sales".to_string(), "800".to_string()),
            ].iter().cloned().collect(),
            [
                ("Product".to_string(), "Phone".to_string()),
                ("Region".to_string(), "South".to_string()),
                ("Sales".to_string(), "900".to_string()),
            ].iter().cloned().collect(),
        ];

        serde_json::to_string(&sample_data).unwrap_or_else(|_| "[]".to_string())
    }

    #[wasm_bindgen]
    pub fn get_sample_config(&self) -> String {
        let config = PivotConfig {
            row_fields: vec!["Product".to_string()],
            column_fields: vec!["Region".to_string()],
            value_fields: vec!["Sales".to_string()],
            aggregation: "sum".to_string(),
        };

        serde_json::to_string(&config).unwrap_or_else(|_| "{}".to_string())
    }
}

// Export functions for direct use
#[wasm_bindgen]
pub fn create_pivot_table() -> PivotTable {
    PivotTable::new()
}

#[wasm_bindgen]
pub fn calculate_pivot_sum(data: &str, row_field: &str, col_field: &str, value_field: &str) -> Result<String, JsValue> {
    let mut pivot = PivotTable::new();
    pivot.add_data(data)?;
    
    let config = PivotConfig {
        row_fields: vec![row_field.to_string()],
        column_fields: vec![col_field.to_string()],
        value_fields: vec![value_field.to_string()],
        aggregation: "sum".to_string(),
    };
    
    pivot.set_config(&serde_json::to_string(&config).unwrap())?;
    pivot.generate_pivot()
}
