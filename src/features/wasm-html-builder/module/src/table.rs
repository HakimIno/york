use serde_json;
use std::sync::{Mutex, Arc};
use crate::types::*;

/// Table management module
pub struct TableManager {
    elements: Arc<Mutex<Vec<Element>>>,
}

impl TableManager {
    pub fn new(elements: Arc<Mutex<Vec<Element>>>) -> Self {
        Self { elements }
    }

    /// Add row to table
    pub fn add_table_row(&self, element_id: &str, at_index: Option<usize>) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.add_table_row(at_index);
            }
        }
        false
    }

    /// Remove row from table
    pub fn remove_table_row(&self, element_id: &str, index: usize) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.remove_table_row(index);
            }
        }
        false
    }

    /// Add column to table
    pub fn add_table_column(&self, element_id: &str, at_index: Option<usize>) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.add_table_column(at_index);
            }
        }
        false
    }

    /// Remove column from table
    pub fn remove_table_column(&self, element_id: &str, index: usize) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.remove_table_column(index);
            }
        }
        false
    }

    /// Update table cell content
    pub fn update_table_cell(&self, element_id: &str, row: usize, col: usize, content: &str) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.update_table_cell(row, col, content.to_string());
            }
        }
        false
    }

    /// Update table cell style
    pub fn update_table_cell_style(&self, element_id: &str, row: usize, col: usize, style_json: &str) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                if let Some(ref mut table_data) = element.table_data {
                    if row < table_data.rows.len() && col < table_data.rows[row].cells.len() {
                        if let Ok(style_update) = serde_json::from_str::<serde_json::Value>(style_json) {
                            let cell = &mut table_data.rows[row].cells[col];
                            
                            // Update cell style properties
                            if let Some(font_size) = style_update.get("fontSize").and_then(|v| v.as_f64()) {
                                cell.style.font_size = font_size;
                            }
                            if let Some(font_family) = style_update.get("fontFamily").and_then(|v| v.as_str()) {
                                cell.style.font_family = font_family.to_string();
                            }
                            if let Some(font_weight) = style_update.get("fontWeight").and_then(|v| v.as_str()) {
                                cell.style.font_weight = font_weight.to_string();
                            }
                            if let Some(font_style) = style_update.get("fontStyle").and_then(|v| v.as_str()) {
                                cell.style.font_style = font_style.to_string();
                            }
                            if let Some(color) = style_update.get("color").and_then(|v| v.as_str()) {
                                cell.style.color = color.to_string();
                            }
                            if let Some(bg_color) = style_update.get("backgroundColor").and_then(|v| v.as_str()) {
                                cell.style.background_color = bg_color.to_string();
                            }
                            if let Some(text_align) = style_update.get("textAlign").and_then(|v| v.as_str()) {
                                cell.style.text_align = text_align.to_string();
                            }
                            
                            return true;
                        }
                    }
                }
            }
        }
        
        false
    }

    /// Merge table cells
    pub fn merge_table_cells(&self, element_id: &str, start_row: usize, start_col: usize, end_row: usize, end_col: usize) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.merge_table_cells(start_row, start_col, end_row, end_col);
            }
        }
        false
    }

    /// Get table data
    pub fn get_table_data(&self, element_id: &str) -> String {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.is_table() {
                if let Some(table_data) = element.get_table_data() {
                    return serde_json::to_string(table_data).unwrap_or_else(|_| "null".to_string());
                }
            }
        }
        "null".to_string()
    }

    /// Update table column width
    pub fn update_table_column_width(&self, element_id: &str, column_index: usize, width: f64) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                if let Some(ref mut table_data) = element.table_data {
                    if column_index < table_data.column_widths.len() {
                        table_data.column_widths[column_index] = width;
                        return true;
                    }
                }
            }
        }
        false
    }

    /// Update table row height
    pub fn update_table_row_height(&self, element_id: &str, row_index: usize, height: f64) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                if let Some(ref mut table_data) = element.table_data {
                    if row_index < table_data.rows.len() {
                        table_data.rows[row_index].height = height;
                        return true;
                    }
                }
            }
        }
        false
    }

    /// Calculate sum of column (Excel-like function)
    pub fn calculate_column_sum(&self, element_id: &str, col_index: usize) -> f64 {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.is_table() {
                return element.calculate_column_sum(col_index);
            }
        }
        0.0
    }

    /// Calculate sum of row (Excel-like function)
    pub fn calculate_row_sum(&self, element_id: &str, row_index: usize) -> f64 {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.is_table() {
                return element.calculate_row_sum(row_index);
            }
        }
        0.0
    }

    /// Calculate average of range (Excel-like function)
    pub fn calculate_average(&self, element_id: &str, start_row: usize, start_col: usize, end_row: usize, end_col: usize) -> f64 {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.is_table() {
                return element.calculate_average(start_row, start_col, end_row, end_col);
            }
        }
        0.0
    }

    /// Auto-fit columns based on content (Excel-like function)
    pub fn auto_fit_columns(&self, element_id: &str) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.auto_fit_columns();
            }
        }
        false
    }

    /// Unmerge table cells
    pub fn unmerge_table_cells(&self, element_id: &str, row: usize, col: usize) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.is_table() {
                return element.unmerge_table_cells(row, col);
            }
        }
        false
    }

    /// Check if a cell is merged
    pub fn is_cell_merged(&self, element_id: &str, row: usize, col: usize) -> bool {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.is_table() {
                return element.is_cell_merged(row, col);
            }
        }
        false
    }

    /// Get table dimensions for export
    pub fn get_table_dimensions(&self, element_id: &str) -> String {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.is_table() {
                if let Some(ref table_data) = element.table_data {
                    let total_width: f64 = table_data.column_widths.iter().sum();
                    let total_height: f64 = table_data.rows.iter().map(|row| row.height).sum();
                    
                    let dimensions = serde_json::json!({
                        "totalWidth": total_width,
                        "totalHeight": total_height,
                        "columnWidths": table_data.column_widths,
                        "rowHeights": table_data.rows.iter().map(|row| row.height).collect::<Vec<f64>>()
                    });
                    
                    return dimensions.to_string();
                }
            }
        }
        
        "null".to_string()
    }

    /// Get table cell style
    pub fn get_table_cell_style(&self, element_id: &str, row: usize, col: usize) -> String {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.is_table() {
                if let Some(ref table_data) = element.table_data {
                    if row < table_data.rows.len() && col < table_data.rows[row].cells.len() {
                        let cell = &table_data.rows[row].cells[col];
                        
                        let cell_style = serde_json::json!({
                            "fontSize": cell.style.font_size,
                            "fontFamily": cell.style.font_family,
                            "fontWeight": cell.style.font_weight,
                            "fontStyle": cell.style.font_style,
                            "color": cell.style.color,
                            "backgroundColor": cell.style.background_color,
                            "textAlign": cell.style.text_align
                        });
                        
                        return cell_style.to_string();
                    }
                }
            }
        }
        
        // Return default cell style instead of empty object
        let default_style = serde_json::json!({
            "fontSize": 12.0,
            "fontFamily": "Arial",
            "fontWeight": "normal",
            "fontStyle": "normal",
            "color": "#000000",
            "backgroundColor": "#ffffff",
            "textAlign": "left"
        });
        default_style.to_string()
    }
}
