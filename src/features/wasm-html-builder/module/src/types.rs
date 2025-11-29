use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Table cell structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableCell {
    pub id: String,
    pub content: String,
    pub row_span: usize,
    pub col_span: usize,
    pub style: ElementStyle,
}

impl Default for TableCell {
    fn default() -> Self {
        TableCell {
            id: String::new(),
            content: String::new(),
            row_span: 1,
            col_span: 1,
            style: ElementStyle::default(),
        }
    }
}

/// Table row structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableRow {
    pub id: String,
    pub cells: Vec<TableCell>,
    pub height: f64,
}

impl Default for TableRow {
    fn default() -> Self {
        TableRow {
            id: String::new(),
            cells: Vec::new(),
            height: 30.0,
        }
    }
}

/// Table structure for complex tables
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableData {
    pub rows: Vec<TableRow>,
    pub columns: usize,
    pub header_rows: usize,
    pub footer_rows: usize,
    pub column_widths: Vec<f64>,
    pub border_collapse: bool,
    pub table_style: ElementStyle,
}

impl Default for TableData {
    fn default() -> Self {
        TableData {
            rows: Vec::new(),
            columns: 3,
            header_rows: 1,
            footer_rows: 0,
            column_widths: vec![150.0; 3],
            border_collapse: true,
            table_style: ElementStyle::default(),
        }
    }
}

/// Fill style for shapes
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FillStyle {
    pub color: String,
    pub opacity: f64, // 0.0 to 1.0
    pub enabled: bool,
}

impl Default for FillStyle {
    fn default() -> Self {
        FillStyle {
            color: "#e0e0e0".to_string(),
            opacity: 1.0,
            enabled: true,
        }
    }
}

/// Stroke style for shapes
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StrokeStyle {
    pub color: String,
    pub opacity: f64, // 0.0 to 1.0
    pub width: f64,
    pub position: String, // "center", "inside", "outside"
    pub style: String,    // "solid", "dashed", "dotted"
    pub enabled: bool,
}

impl Default for StrokeStyle {
    fn default() -> Self {
        StrokeStyle {
            color: "#000000".to_string(),
            opacity: 1.0,
            width: 1.0,
            position: "center".to_string(),
            style: "solid".to_string(),
            enabled: true,
        }
    }
}

/// Element style structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementStyle {
    pub font_size: f64,
    pub font_family: String,
    pub font_weight: String, // "normal" or "bold"
    pub font_style: String,  // "normal" or "italic"
    pub color: String,
    pub background_color: String,
    pub text_align: String,  // "left", "center", or "right"
    pub padding: f64,
    pub border_radius: f64,
    pub border_width: f64,
    pub border_color: String,
    // Shape-specific styles
    pub fill: FillStyle,
    pub stroke: StrokeStyle,
}

impl Default for ElementStyle {
    fn default() -> Self {
        ElementStyle {
            font_size: 16.0,
            font_family: "Arial, sans-serif".to_string(),
            font_weight: "normal".to_string(),
            font_style: "normal".to_string(),
            color: "#000000".to_string(),
            background_color: "#ffffff".to_string(),
            text_align: "left".to_string(),
            padding: 8.0,
            border_radius: 4.0,
            border_width: 1.0,
            border_color: "#cccccc".to_string(),
            fill: FillStyle::default(),
            stroke: StrokeStyle::default(),
        }
    }
}

/// Core element structure for WASM
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Element {
    pub id: String,
    pub component_id: String,
    pub element_type: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub z_index: i32,
    pub visible: bool,
    pub content: String,
    pub style: ElementStyle,
    pub table_data: Option<TableData>, // For table elements
}

impl Element {
    pub fn new(id: String, component_id: String, element_type: String) -> Element {
        let default_content = match element_type.as_str() {
            "heading" => "Heading Text".to_string(),
            "paragraph" => "This is a paragraph text. Click to edit.".to_string(),
            "button" => "Click Me".to_string(),
            "image" => "Image".to_string(),
            "table" => "Table".to_string(),
            "form_field" => r#"{"label":"Label:","value":"","labelWidth":30,"valueWidth":70,"gap":8,"showLabel":true,"underlineStyle":"solid"}"#.to_string(),
            "checkbox" => r#"{"label":"Checkbox","checked":true,"showLabel":true,"labelPosition":"right","checkboxStyle":"square","boxSize":15,"fontSize":12,"labelGap":4}"#.to_string(),
            "rectangle" => "Rectangle".to_string(),
            "circle" => "Circle".to_string(),
            "line" => r#"{"lineType":"straight","startX":0,"startY":0,"endX":100,"endY":0,"arrowStart":false,"arrowEnd":false}"#.to_string(),
            _ => "Text Content".to_string(),
        };

        let (width, height) = match element_type.as_str() {
            "heading" => (300.0, 60.0),
            "paragraph" => (400.0, 100.0),
            "button" => (120.0, 40.0),
            "image" => (200.0, 150.0),
            "table" => (450.0, 200.0), // Default table size
            "form_field" => (400.0, 40.0), // Default form field size
            "checkbox" => (150.0, 30.0), // Default checkbox size
            "rectangle" => (150.0, 100.0), // Default rectangle size
            "circle" => (120.0, 120.0), // Default circle size (square for perfect circle)
            "line" => (200.0, 2.0), // Default line size (width x height)
            _ => (200.0, 50.0),
        };

        // Create table data for table elements
        let table_data = if element_type == "table" {
            Some(TableData::default())
        } else {
            None
        };

        Element {
            id,
            component_id,
            element_type,
            x: 0.0,
            y: 0.0,
            width,
            height,
            z_index: 0,
            visible: true,
            content: default_content,
            style: ElementStyle::default(),
            table_data,
        }
    }

    pub fn set_width(&mut self, width: f64) {
        self.width = width.max(10.0); // Minimum width
    }

    pub fn set_height(&mut self, height: f64) {
        self.height = height.max(10.0); // Minimum height
    }

    pub fn get_bounds(&self) -> Bounds {
        Bounds {
            x: self.x,
            y: self.y,
            width: self.width,
            height: self.height,
        }
    }

    pub fn contains_point(&self, x: f64, y: f64) -> bool {
        x >= self.x && x <= self.x + self.width && y >= self.y && y <= self.y + self.height
    }

    // Table-specific methods
    pub fn is_table(&self) -> bool {
        self.element_type == "table"
    }

    // Shape-specific methods
    pub fn is_shape(&self) -> bool {
        matches!(self.element_type.as_str(), "rectangle" | "circle" | "line")
    }

    pub fn is_rectangle(&self) -> bool {
        self.element_type == "rectangle"
    }

    pub fn is_circle(&self) -> bool {
        self.element_type == "circle"
    }

    pub fn is_line(&self) -> bool {
        self.element_type == "line"
    }

    pub fn get_table_data(&self) -> Option<&TableData> {
        self.table_data.as_ref()
    }

    // Excel-like calculation functions
    pub fn calculate_column_sum(&self, col_index: usize) -> f64 {
        if let Some(table_data) = &self.table_data {
            if col_index >= table_data.column_widths.len() {
                return 0.0;
            }
            
            let mut sum = 0.0;
            for row in &table_data.rows {
                if col_index < row.cells.len() {
                    if let Ok(value) = row.cells[col_index].content.parse::<f64>() {
                        sum += value;
                    }
                }
            }
            sum
        } else {
            0.0
        }
    }

    pub fn calculate_row_sum(&self, row_index: usize) -> f64 {
        if let Some(table_data) = &self.table_data {
            if row_index >= table_data.rows.len() {
                return 0.0;
            }
            
            let row = &table_data.rows[row_index];
            let mut sum = 0.0;
            for cell in &row.cells {
                if let Ok(value) = cell.content.parse::<f64>() {
                    sum += value;
                }
            }
            sum
        } else {
            0.0
        }
    }

    pub fn calculate_average(&self, start_row: usize, start_col: usize, end_row: usize, end_col: usize) -> f64 {
        if let Some(table_data) = &self.table_data {
            let mut sum = 0.0;
            let mut count = 0;
            
            for row_idx in start_row..=end_row.min(table_data.rows.len() - 1) {
                let row = &table_data.rows[row_idx];
                for col_idx in start_col..=end_col.min(row.cells.len() - 1) {
                    if let Ok(value) = row.cells[col_idx].content.parse::<f64>() {
                        sum += value;
                        count += 1;
                    }
                }
            }
            
            if count > 0 { sum / count as f64 } else { 0.0 }
        } else {
            0.0
        }
    }

    pub fn auto_fit_columns(&mut self) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            for col_index in 0..table_data.column_widths.len() {
                let mut max_width: f64 = 64.0; // Minimum width
                
                // Check header if exists
                if col_index < table_data.rows[0].cells.len() {
                    let header_content = &table_data.rows[0].cells[col_index].content;
                    let header_width = (header_content.len() as f64 * 7.0).max(64.0); // More accurate character width
                    max_width = max_width.max(header_width);
                }
                
                // Check all cells in column
                for row in &table_data.rows {
                    if col_index < row.cells.len() {
                        let cell_width = (row.cells[col_index].content.len() as f64 * 7.0).max(64.0); // More accurate character width
                        max_width = max_width.max(cell_width);
                    }
                }
                
                table_data.column_widths[col_index] = max_width.min(400.0).max(64.0); // Max width 400px, min 64px
            }
            
            // Update element width based on actual column widths
            let total_width: f64 = table_data.column_widths.iter().sum();
            self.width = (total_width + 32.0).max(200.0); // Minimum table width 200px
            
            true
        } else {
            false
        }
    }

    pub fn get_table_data_mut(&mut self) -> Option<&mut TableData> {
        self.table_data.as_mut()
    }

    pub fn create_default_table(&mut self, rows: u32, cols: u32) {
        if self.element_type == "table" {
            let mut table_data = TableData {
                columns: cols as usize,
                header_rows: 1,
                footer_rows: 0,
                column_widths: vec![150.0; cols as usize],
                border_collapse: true,
                table_style: ElementStyle::default(),
                rows: Vec::new(),
            };

            // Create header row
            let mut header_row = TableRow::default();
            header_row.height = 35.0;
            for _ in 0..cols {
                let mut cell = TableCell::default();
                cell.content = "Header".to_string();
                cell.style.font_weight = "bold".to_string();
                cell.style.background_color = "#f3f4f6".to_string();
                header_row.cells.push(cell);
            }
            table_data.rows.push(header_row);

            // Create data rows
            for _ in 1..rows {
                let mut row = TableRow::default();
                for _ in 0..cols {
                    let mut cell = TableCell::default();
                    cell.content = "Data".to_string();
                    row.cells.push(cell);
                }
                table_data.rows.push(row);
            }

            self.table_data = Some(table_data);
        }
    }

    pub fn add_table_row(&mut self, at_index: Option<usize>) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            let mut new_row = TableRow::default();
            new_row.height = 20.0; // Set proper row height (Excel-like)
            
            // Add cells for each column
            for _ in 0..table_data.columns {
                new_row.cells.push(TableCell::default());
            }
            
            if let Some(index) = at_index {
                if index <= table_data.rows.len() {
                    table_data.rows.insert(index, new_row);
                    // Update element height based on actual row heights
                    let total_height: f64 = table_data.rows.iter().map(|row| row.height.max(20.0)).sum();
                    self.height = (total_height + 32.0).max(self.height).max(100.0);
                    return true;
                }
            } else {
                table_data.rows.push(new_row);
                // Update element height based on actual row heights
                let total_height: f64 = table_data.rows.iter().map(|row| row.height.max(20.0)).sum();
                self.height = (total_height + 32.0).max(self.height).max(100.0);
                return true;
            }
        }
        false
    }

    pub fn remove_table_row(&mut self, index: usize) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            if index < table_data.rows.len() && table_data.rows.len() > 1 {
                table_data.rows.remove(index);
                // Update element height based on actual row heights
                let total_height: f64 = table_data.rows.iter().map(|row| row.height.max(20.0)).sum();
                self.height = (total_height + 32.0).max(100.0);
                return true;
            }
        }
        false
    }

    pub fn add_table_column(&mut self, at_index: Option<usize>) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            let new_width = 64.0; // Excel-like default column width
            if let Some(index) = at_index {
                if index <= table_data.column_widths.len() {
                    table_data.column_widths.insert(index, new_width);
                    table_data.columns += 1;
                    
                    // Add cell to each row
                    for row in &mut table_data.rows {
                        let new_cell = TableCell::default();
                        row.cells.insert(index, new_cell);
                    }
                    // Update element width based on actual column widths
                    let total_width: f64 = table_data.column_widths.iter().map(|w| w.max(64.0)).sum();
                    self.width = (total_width + 32.0).max(self.width).max(200.0);
                    return true;
                }
            } else {
                table_data.column_widths.push(new_width);
                table_data.columns += 1;
                
                // Add cell to each row
                for row in &mut table_data.rows {
                    let new_cell = TableCell::default();
                    row.cells.push(new_cell);
                }
                // Update element width based on actual column widths
                let total_width: f64 = table_data.column_widths.iter().map(|w| w.max(64.0)).sum();
                self.width = (total_width + 32.0).max(self.width).max(200.0);
                return true;
            }
        }
        false
    }

    pub fn remove_table_column(&mut self, index: usize) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            if index < table_data.column_widths.len() && table_data.columns > 1 {
                table_data.column_widths.remove(index);
                table_data.columns -= 1;
                
                // Remove cell from each row
                for row in &mut table_data.rows {
                    if index < row.cells.len() {
                        row.cells.remove(index);
                    }
                }
                // Update element width based on actual column widths
                let total_width: f64 = table_data.column_widths.iter().map(|w| w.max(64.0)).sum();
                self.width = (total_width + 32.0).max(200.0);
                return true;
            }
        }
        false
    }

    pub fn update_table_cell(&mut self, row: usize, col: usize, content: String) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            if row < table_data.rows.len() && col < table_data.rows[row].cells.len() {
                table_data.rows[row].cells[col].content = content.clone();
                
                // Auto-calculate cell width based on content (Excel-like behavior)
                let content_length = content.len() as f64;
                let estimated_width = (content_length * 8.0).max(64.0).min(300.0);
                
                if col < table_data.column_widths.len() {
                    let current_width = table_data.column_widths[col];
                    if estimated_width > current_width {
                        table_data.column_widths[col] = estimated_width;
                        // Update element width
                        let total_width: f64 = table_data.column_widths.iter().sum();
                        self.width = (total_width + 32.0).max(self.width);
                    }
                }
                
                return true;
            }
        }
        false
    }

    pub fn merge_table_cells(&mut self, start_row: usize, start_col: usize, end_row: usize, end_col: usize) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            if start_row < table_data.rows.len() && 
               end_row < table_data.rows.len() &&
               start_col < table_data.rows[start_row].cells.len() &&
               end_col < table_data.rows[end_row].cells.len() {
                
                let row_span = end_row - start_row + 1;
                let col_span = end_col - start_col + 1;
                
                // Collect content from all cells to merge
                let mut merged_content = String::new();
                for r in start_row..=end_row {
                    for c in start_col..=end_col {
                        let cell_content = &table_data.rows[r].cells[c].content;
                        if !cell_content.is_empty() {
                            if !merged_content.is_empty() {
                                merged_content.push(' ');
                            }
                            merged_content.push_str(cell_content);
                        }
                    }
                }
                
                // Update the first cell with row_span, col_span, and merged content
                table_data.rows[start_row].cells[start_col].row_span = row_span;
                table_data.rows[start_row].cells[start_col].col_span = col_span;
                table_data.rows[start_row].cells[start_col].content = merged_content;
                
                // Mark other cells as merged by setting them to empty with special markers
                for r in start_row..=end_row {
                    for c in start_col..=end_col {
                        if !(r == start_row && c == start_col) {
                            table_data.rows[r].cells[c].content = "".to_string();
                            table_data.rows[r].cells[c].row_span = 0; // Mark as merged
                            table_data.rows[r].cells[c].col_span = 0; // Mark as merged
                        }
                    }
                }
                return true;
            }
        }
        false
    }

    /// Unmerge table cells (split merged cell back to individual cells)
    pub fn unmerge_table_cells(&mut self, row: usize, col: usize) -> bool {
        if let Some(ref mut table_data) = self.table_data {
            if row < table_data.rows.len() && col < table_data.rows[row].cells.len() {
                let cell = &table_data.rows[row].cells[col];
                if cell.row_span > 1 || cell.col_span > 1 {
                    let row_span = cell.row_span;
                    let col_span = cell.col_span;
                    
                    // Reset the main cell
                    table_data.rows[row].cells[col].row_span = 1;
                    table_data.rows[row].cells[col].col_span = 1;
                    
                    // Restore other cells in the merged area
                    for r in row..(row + row_span) {
                        for c in col..(col + col_span) {
                            if !(r == row && c == col) {
                                if r < table_data.rows.len() && c < table_data.rows[r].cells.len() {
                                    table_data.rows[r].cells[c].content = "Cell".to_string();
                                    table_data.rows[r].cells[c].row_span = 1;
                                    table_data.rows[r].cells[c].col_span = 1;
                                }
                            }
                        }
                    }
                    return true;
                }
            }
        }
        false
    }

    /// Check if a cell is merged
    pub fn is_cell_merged(&self, row: usize, col: usize) -> bool {
        if let Some(ref table_data) = self.table_data {
            if row < table_data.rows.len() && col < table_data.rows[row].cells.len() {
                let cell = &table_data.rows[row].cells[col];
                return cell.row_span > 1 || cell.col_span > 1;
            }
        }
        false
    }

    /// Get the main cell for a merged cell area
    pub fn get_main_cell_for_merged_area(&self, row: usize, col: usize) -> Option<(usize, usize)> {
        if let Some(ref table_data) = self.table_data {
            // Check if this cell is already a main cell
            if row < table_data.rows.len() && col < table_data.rows[row].cells.len() {
                let cell = &table_data.rows[row].cells[col];
                if cell.row_span > 1 || cell.col_span > 1 {
                    return Some((row, col));
                }
            }
            
            // Search for the main cell that contains this position
            for r in 0..table_data.rows.len() {
                for c in 0..table_data.rows[r].cells.len() {
                    let cell = &table_data.rows[r].cells[c];
                    if cell.row_span > 1 || cell.col_span > 1 {
                        let end_row = r + cell.row_span - 1;
                        let end_col = c + cell.col_span - 1;
                        if row >= r && row <= end_row && col >= c && col <= end_col {
                            return Some((r, c));
                        }
                    }
                }
            }
        }
        None
    }
}

/// Bounds structure for collision detection
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[wasm_bindgen]
impl Bounds {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, width: f64, height: f64) -> Bounds {
        Bounds { x, y, width, height }
    }

    #[wasm_bindgen]
    pub fn intersects(&self, other: &Bounds) -> bool {
        !(self.x + self.width < other.x
            || other.x + other.width < self.x
            || self.y + self.height < other.y
            || other.y + other.height < self.y)
    }

    #[wasm_bindgen]
    pub fn contains(&self, other: &Bounds) -> bool {
        self.x <= other.x
            && self.y <= other.y
            && self.x + self.width >= other.x + other.width
            && self.y + self.height >= other.y + other.height
    }

    #[wasm_bindgen]
    pub fn contains_point(&self, x: f64, y: f64) -> bool {
        x >= self.x && x <= self.x + self.width && y >= self.y && y <= self.y + self.height
    }
}

/// Point structure
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Point {
        Point { x, y }
    }

    #[wasm_bindgen]
    pub fn distance_to(&self, other: &Point) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
}

/// Paper size enum
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum PaperSize {
    A4,
    A5,
}

/// Paper orientation enum
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum PaperOrientation {
    Portrait,
    Landscape,
}

/// Paper structure - renamed from A4Paper to be more generic
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Paper {
    pub id: String,
    pub size: PaperSize,
    pub orientation: PaperOrientation,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub title: Option<String>,
}

impl Paper {
    /// Create a new paper with specified size and orientation
    pub fn new(id: String, size: PaperSize, orientation: PaperOrientation, x: f64, y: f64) -> Paper {
        let (width, height) = Self::get_dimensions(size, orientation);
        let title = Some(format!("{:?} {:?}", size, orientation));
        
        Paper {
            id,
            size,
            orientation,
            x,
            y,
            width,
            height,
            title,
        }
    }

    /// Get paper dimensions based on size and orientation
    fn get_dimensions(size: PaperSize, orientation: PaperOrientation) -> (f64, f64) {
        match size {
            PaperSize::A4 => {
                match orientation {
                    PaperOrientation::Portrait => (794.0, 1123.0),   // A4 portrait at 96 DPI (standard web size)
                    PaperOrientation::Landscape => (1123.0, 794.0),  // A4 landscape at 96 DPI (standard web size)
                }
            }
            PaperSize::A5 => {
                match orientation {
                    PaperOrientation::Portrait => (559.0, 794.0),    // A5 portrait at 96 DPI (standard web size)
                    PaperOrientation::Landscape => (794.0, 559.0),   // A5 landscape at 96 DPI (standard web size)
                }
            }
        }
    }

    pub fn get_bounds(&self) -> Bounds {
        Bounds {
            x: self.x,
            y: self.y,
            width: self.width,
            height: self.height,
        }
    }

    pub fn contains_element(&self, element: &Element) -> bool {
        let element_bounds = element.get_bounds();
        self.get_bounds().contains(&element_bounds)
    }

    /// Update paper position
    pub fn update_position(&mut self, x: f64, y: f64) {
        self.x = x;
        self.y = y;
    }

    /// Get paper area for collision detection
    pub fn get_area(&self) -> f64 {
        self.width * self.height
    }
}

// Keep A4Paper for backward compatibility
pub type A4Paper = Paper;

/// Drag state structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DragState {
    pub is_dragging: bool,
    pub element_id: Option<String>,
    pub start_position: Point,
    pub current_position: Point,
    pub offset: Point,
}

impl Default for DragState {
    fn default() -> Self {
        DragState {
            is_dragging: false,
            element_id: None,
            start_position: Point { x: 0.0, y: 0.0 },
            current_position: Point { x: 0.0, y: 0.0 },
            offset: Point { x: 0.0, y: 0.0 },
        }
    }
}

/// Position update for batch operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionUpdate {
    pub element_id: String,
    pub x: f64,
    pub y: f64,
}

/// Collision result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollisionResult {
    pub element_id: String,
    pub colliding_elements: Vec<String>,
    pub is_out_of_bounds: bool,
}

/// Performance statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceStats {
    pub total_elements: usize,
    pub visible_elements: usize,
    pub collision_checks_per_frame: u32,
    pub average_frame_time_ms: f64,
    pub memory_usage_bytes: usize,
}

/// Transform result for coordinate conversions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformResult {
    pub x: f64,
    pub y: f64,
}

/// Drag update result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DragUpdateResult {
    pub element_id: String,
    pub new_position: Point,
    pub is_valid: bool,
    pub collisions: Vec<String>,
}

/// Element creation parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementCreationParams {
    pub component_type: String,
    pub x: f64,
    pub y: f64,
    pub width: Option<f64>,
    pub height: Option<f64>,
}

/// Spatial query result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpatialQueryResult {
    pub elements: Vec<Element>,
    pub total_count: usize,
}
