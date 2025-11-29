use wasm_bindgen::prelude::*;
use std::sync::{Mutex, Arc};

// Import modules
mod types;
mod utils;
mod paper;
mod element;
mod drag;
mod transform;
mod table;
mod export;
mod spatial_index;
mod style_history;

use types::*;
use paper::PaperManager;
use element::ElementManager;
use drag::DragManager;
use transform::TransformManager;
use table::TableManager;
use export::ExportManager;
use spatial_index::SpatialIndexManager;
use style_history::StyleHistory;

// Main HTML Builder Engine
#[wasm_bindgen]
pub struct HTMLBuilderEngine {
    // Core managers
    paper_manager: PaperManager,
    element_manager: ElementManager,
    drag_manager: DragManager,
    transform_manager: TransformManager,
    table_manager: TableManager,
    export_manager: ExportManager,
    spatial_index_manager: SpatialIndexManager,
    style_history: Arc<Mutex<StyleHistory>>,
}

#[wasm_bindgen(start)]
pub fn main() {
    // WASM module initialized
}

#[wasm_bindgen]
impl HTMLBuilderEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> HTMLBuilderEngine {
        // Initialize shared data structures with Arc for sharing
        let elements = Arc::new(Mutex::new(Vec::<Element>::new()));
        let papers = Arc::new(Mutex::new(Vec::<A4Paper>::new()));
        
        // Initialize managers with shared data
        let paper_manager = PaperManager::new_with_data(Arc::clone(&papers));
        let element_manager = ElementManager::new_with_data(Arc::clone(&elements));
        let drag_manager = DragManager::new();
        let transform_manager = TransformManager::new();
        let table_manager = TableManager::new(Arc::clone(&elements));
        let export_manager = ExportManager::new(Arc::clone(&elements), Arc::clone(&papers));
        let spatial_index_manager = SpatialIndexManager::new((0.0, 0.0, 2000.0, 2000.0), 100.0);
        let style_history = Arc::new(Mutex::new(StyleHistory::new(50))); // 50 entries max
        
        HTMLBuilderEngine {
            paper_manager,
            element_manager,
            drag_manager,
            transform_manager,
            table_manager,
            export_manager,
            spatial_index_manager,
            style_history,
        }
    }

    // Paper management methods
    /// สร้าง A4 paper ใหม่ (backward compatibility)
    #[wasm_bindgen]
    pub fn create_a4_paper(&self, x: f64, y: f64) -> String {
        self.paper_manager.create_a4_paper(x, y)
    }

    /// สร้าง paper ใหม่ด้วยขนาดและทิศทางที่กำหนด
    #[wasm_bindgen]
    pub fn create_paper(&self, id: &str, size: &str, orientation: &str, x: f64, y: f64) -> String {
        self.paper_manager.create_paper(id, size, orientation, x, y)
    }

    /// ได้ papers ทั้งหมด
    #[wasm_bindgen]
    pub fn get_a4_papers(&self) -> String {
        self.paper_manager.get_a4_papers()
    }

    /// ลบ paper ตาม ID
    #[wasm_bindgen]
    pub fn remove_paper(&self, paper_id: &str) -> bool {
        self.paper_manager.remove_paper(paper_id)
    }

    /// อัปเดตตำแหน่ง paper
    #[wasm_bindgen]
    pub fn update_paper_position(&self, paper_id: &str, x: f64, y: f64) -> bool {
        self.paper_manager.update_paper_position(paper_id, x, y)
    }

    /// นับจำนวน papers
    #[wasm_bindgen]
    pub fn get_paper_count(&self) -> usize {
        self.paper_manager.get_paper_count()
    }

    /// ค้นหา paper ตาม ID
    #[wasm_bindgen]
    pub fn get_paper_by_id(&self, paper_id: &str) -> String {
        self.paper_manager.get_paper_by_id(paper_id)
    }

    /// ตั้งค่า viewport size (minimal implementation)
    #[wasm_bindgen]
    pub fn set_viewport_size(&self, width: f64, height: f64) {
        self.paper_manager.set_viewport_size(width, height)
    }

    /// Fit A4 papers ให้พอดี viewport (minimal implementation)
    #[wasm_bindgen]
    pub fn fit_to_viewport(&self, margin_percent: f64) {
        self.paper_manager.fit_to_viewport(margin_percent)
    }

    // Element management methods
    /// สร้าง element ใหม่ (working implementation with unique IDs)
    #[wasm_bindgen]
    pub fn create_element(&self, component_type: &str, x: f64, y: f64) -> String {
        self.element_manager.create_element(component_type, x, y)
    }

    /// อัพเดทตำแหน่ง element (working implementation)
    #[wasm_bindgen]
    pub fn update_element_position(&self, element_id: &str, x: f64, y: f64) -> bool {
        self.element_manager.update_element_position(element_id, x, y)
    }

    /// อัพเดท element size (working implementation)
    #[wasm_bindgen]
    pub fn update_element_size(&self, element_id: &str, width: f64, height: f64) -> bool {
        self.element_manager.update_element_size(element_id, width, height)
    }

    /// อัพเดท element content
    #[wasm_bindgen]
    pub fn update_element_content(&self, element_id: &str, content: &str) -> bool {
        self.element_manager.update_element_content(element_id, content)
    }

    /// อัพเดท element style
    #[wasm_bindgen]
    pub fn update_element_style(&self, element_id: &str, style_json: &str) -> bool {
        self.element_manager.update_element_style(element_id, style_json)
    }

    /// ลบ element (working implementation)
    #[wasm_bindgen]
    pub fn delete_element(&self, element_id: &str) -> bool {
        self.element_manager.delete_element(element_id)
    }

    /// ได้ element ตาม ID (working implementation)
    #[wasm_bindgen]
    pub fn get_element(&self, element_id: &str) -> String {
        self.element_manager.get_element(element_id)
    }

    /// ได้ elements ทั้งหมด
    #[wasm_bindgen]
    pub fn get_all_elements(&self) -> String {
        self.element_manager.get_all_elements()
    }

    /// ได้จำนวน elements
    #[wasm_bindgen]
    pub fn get_element_count(&self) -> usize {
        self.element_manager.get_element_count()
    }

    // Drag management methods
    /// เริ่ม drag operation (working implementation)
    #[wasm_bindgen]
    pub fn start_drag(&self, element_id: &str, mouse_x: f64, mouse_y: f64) -> bool {
        // Get elements from element manager and pass to drag manager
        let elements = self.element_manager.get_elements_ref();
        let elements_arc = Arc::new(Mutex::new(elements.clone()));
        self.drag_manager.start_drag(element_id, mouse_x, mouse_y, &elements_arc)
    }

    /// อัพเดท drag operation (working implementation)
    #[wasm_bindgen]
    pub fn update_drag(&self, mouse_x: f64, mouse_y: f64, zoom: f64, pan_x: f64, pan_y: f64) -> String {
        self.drag_manager.update_drag(mouse_x, mouse_y, zoom, pan_x, pan_y, &self.element_manager)
    }

    /// จบ drag operation (working implementation)
    #[wasm_bindgen]
    pub fn end_drag(&self) -> bool {
        self.drag_manager.end_drag()
    }

    /// แปลงจาก screen coordinates เป็น canvas coordinates (minimal implementation)
    #[wasm_bindgen]
    pub fn screen_to_canvas(&self, screen_x: f64, screen_y: f64) -> String {
        self.drag_manager.screen_to_canvas(screen_x, screen_y)
    }

    /// แปลงจาก canvas coordinates เป็น screen coordinates (minimal implementation)
    #[wasm_bindgen]
    pub fn canvas_to_screen(&self, canvas_x: f64, canvas_y: f64) -> String {
        self.drag_manager.canvas_to_screen(canvas_x, canvas_y)
    }

    // Transform management methods
    /// ตั้งค่า transform
    #[wasm_bindgen]
    pub fn set_transform(&self, zoom: f64, pan_x: f64, pan_y: f64) -> String {
        self.transform_manager.set_transform(zoom, pan_x, pan_y)
    }

    /// Zoom ไปยังจุดที่กำหนด
    #[wasm_bindgen]
    pub fn zoom_to_point(&self, screen_x: f64, screen_y: f64, zoom_delta: f64) -> f64 {
        self.transform_manager.zoom_to_point(screen_x, screen_y, zoom_delta)
    }

    /// ได้ค่า zoom ปัจจุบัน
    #[wasm_bindgen]
    pub fn get_zoom(&self) -> f64 {
        self.transform_manager.get_zoom()
    }

    /// ตั้งค่า zoom
    #[wasm_bindgen]
    pub fn set_zoom(&self, zoom: f64) -> f64 {
        self.transform_manager.set_zoom(zoom)
    }

    // Utility methods
    /// ตรวจสอบการชน (minimal implementation)
    #[wasm_bindgen]
    pub fn check_collisions(&self, element_id: &str) -> String {
        self.element_manager.check_collisions(element_id)
    }

    /// หา elements ในพื้นที่ที่กำหนด (minimal implementation)
    #[wasm_bindgen]
    pub fn get_elements_in_region(&self, x: f64, y: f64, width: f64, height: f64) -> String {
        self.element_manager.get_elements_in_region(x, y, width, height)
    }

    /// อัพเดทตำแหน่งหลาย elements พร้อมกัน (minimal implementation)
    #[wasm_bindgen]
    pub fn batch_update_positions(&self, updates_json: &str) -> String {
        self.element_manager.batch_update_positions(updates_json)
    }

    /// Export HTML (complete implementation)
    #[wasm_bindgen]
    pub fn export_html(&self, options_json: &str) -> String {
        self.export_manager.export_html(options_json)
    }

    /// ได้สถิติการทำงาน (minimal implementation)
    #[wasm_bindgen]
    pub fn get_performance_stats(&self) -> String {
        r#"{"spatial":{"total_elements":0,"visible_elements":0,"memory_usage_bytes":0},"transform":{"zoom":1.0,"pan_x":0,"pan_y":0,"viewport_width":800,"viewport_height":600,"is_cache_valid":true},"operations":{},"memory_usage_bytes":0,"timestamp":0}"#.to_string()
    }

    /// Reset engine state (minimal implementation)
    #[wasm_bindgen]
    pub fn reset(&self) {
        self.element_manager.clear();
        self.paper_manager.clear();
        self.drag_manager.clear();
        self.transform_manager.reset();
    }

    // Table-specific methods
    /// Add row to table
    #[wasm_bindgen]
    pub fn add_table_row(&self, element_id: &str, at_index: Option<usize>) -> bool {
        self.table_manager.add_table_row(element_id, at_index)
    }

    /// Remove row from table
    #[wasm_bindgen]
    pub fn remove_table_row(&self, element_id: &str, index: usize) -> bool {
        self.table_manager.remove_table_row(element_id, index)
    }

    /// Add column to table
    #[wasm_bindgen]
    pub fn add_table_column(&self, element_id: &str, at_index: Option<usize>) -> bool {
        self.table_manager.add_table_column(element_id, at_index)
    }

    /// Remove column from table
    #[wasm_bindgen]
    pub fn remove_table_column(&self, element_id: &str, index: usize) -> bool {
        self.table_manager.remove_table_column(element_id, index)
    }

    /// Update table cell content
    #[wasm_bindgen]
    pub fn update_table_cell(&self, element_id: &str, row: usize, col: usize, content: &str) -> bool {
        self.table_manager.update_table_cell(element_id, row, col, content)
    }

    /// Update table cell style
    #[wasm_bindgen]
    pub fn update_table_cell_style(&self, element_id: &str, row: usize, col: usize, style_json: &str) -> bool {
        self.table_manager.update_table_cell_style(element_id, row, col, style_json)
    }

    /// Merge table cells
    #[wasm_bindgen]
    pub fn merge_table_cells(&self, element_id: &str, start_row: usize, start_col: usize, end_row: usize, end_col: usize) -> bool {
        self.table_manager.merge_table_cells(element_id, start_row, start_col, end_row, end_col)
    }

    /// Get table data
    #[wasm_bindgen]
    pub fn get_table_data(&self, element_id: &str) -> String {
        self.table_manager.get_table_data(element_id)
    }

    /// Update table column width
    #[wasm_bindgen]
    pub fn update_table_column_width(&self, element_id: &str, column_index: usize, width: f64) -> bool {
        self.table_manager.update_table_column_width(element_id, column_index, width)
    }

    /// Update table row height
    #[wasm_bindgen]
    pub fn update_table_row_height(&self, element_id: &str, row_index: usize, height: f64) -> bool {
        self.table_manager.update_table_row_height(element_id, row_index, height)
    }

    /// Calculate sum of column (Excel-like function)
    #[wasm_bindgen]
    pub fn calculate_column_sum(&self, element_id: &str, col_index: usize) -> f64 {
        self.table_manager.calculate_column_sum(element_id, col_index)
    }

    /// Calculate sum of row (Excel-like function)
    #[wasm_bindgen]
    pub fn calculate_row_sum(&self, element_id: &str, row_index: usize) -> f64 {
        self.table_manager.calculate_row_sum(element_id, row_index)
    }

    /// Calculate average of range (Excel-like function)
    #[wasm_bindgen]
    pub fn calculate_average(&self, element_id: &str, start_row: usize, start_col: usize, end_row: usize, end_col: usize) -> f64 {
        self.table_manager.calculate_average(element_id, start_row, start_col, end_row, end_col)
    }

    /// Auto-fit columns based on content (Excel-like function)
    #[wasm_bindgen]
    pub fn auto_fit_columns(&self, element_id: &str) -> bool {
        self.table_manager.auto_fit_columns(element_id)
    }

    /// Unmerge table cells
    #[wasm_bindgen]
    pub fn unmerge_table_cells(&self, element_id: &str, row: usize, col: usize) -> bool {
        self.table_manager.unmerge_table_cells(element_id, row, col)
    }

    /// Check if a cell is merged
    #[wasm_bindgen]
    pub fn is_cell_merged(&self, element_id: &str, row: usize, col: usize) -> bool {
        self.table_manager.is_cell_merged(element_id, row, col)
    }

    /// Get table dimensions for export
    #[wasm_bindgen]
    pub fn get_table_dimensions(&self, element_id: &str) -> String {
        self.table_manager.get_table_dimensions(element_id)
    }

    /// Get table cell style
    #[wasm_bindgen]
    pub fn get_table_cell_style(&self, element_id: &str, row: usize, col: usize) -> String {
        self.table_manager.get_table_cell_style(element_id, row, col)
    }

    // Performance optimization methods for StylePanel
    /// Parse form field data efficiently in WASM
    #[wasm_bindgen]
    pub fn parse_form_field_data(&self, element_id: &str) -> String {
        self.element_manager.parse_form_field_data(element_id)
    }

    /// Calculate safe style properties efficiently in WASM
    #[wasm_bindgen]
    pub fn calculate_safe_style(&self, element_id: &str) -> String {
        self.element_manager.calculate_safe_style(element_id)
    }

    /// Get element type flags efficiently
    #[wasm_bindgen]
    pub fn get_element_type_flags(&self, element_id: &str) -> String {
        self.element_manager.get_element_type_flags(element_id)
    }

    /// Batch update form field content efficiently
    #[wasm_bindgen]
    pub fn batch_update_form_field(&self, element_id: &str, updates_json: &str) -> bool {
        self.element_manager.batch_update_form_field(element_id, updates_json)
    }

    /// Get optimized element data for StylePanel
    #[wasm_bindgen]
    pub fn get_element_for_style_panel(&self, element_id: &str) -> String {
        self.element_manager.get_element_for_style_panel(element_id)
    }

    /// Validate and sanitize style updates
    #[wasm_bindgen]
    pub fn validate_style_update(&self, style_json: &str) -> String {
        self.element_manager.validate_style_update(style_json)
    }

    /// Performance optimized element lookup with caching
    #[wasm_bindgen]
    pub fn get_elements_summary(&self) -> String {
        self.element_manager.get_elements_summary()
    }

    // Spatial Indexing methods
    /// Query elements in a region using spatial indexing
    #[wasm_bindgen]
    pub fn query_elements_in_region(&self, x: f64, y: f64, width: f64, height: f64) -> String {
        self.spatial_index_manager.query_region(x, y, width, height)
    }

    /// Find elements at a specific point using spatial indexing
    #[wasm_bindgen]
    pub fn find_elements_at_point(&self, x: f64, y: f64) -> String {
        self.spatial_index_manager.find_at_point(x, y)
    }

    /// Find nearest element to a point using spatial indexing
    #[wasm_bindgen]
    pub fn find_nearest_element(&self, x: f64, y: f64, max_distance: f64) -> String {
        self.spatial_index_manager.find_nearest(x, y, max_distance)
    }

    /// Detect collisions for an element using spatial indexing
    #[wasm_bindgen]
    pub fn detect_element_collisions(&self, element_id: &str) -> String {
        // Get element first
        let element_json = self.element_manager.get_element(element_id);
        if element_json == "null" {
            return "[]".to_string();
        }
        
        // Parse element
        if let Ok(element) = serde_json::from_str::<Element>(&element_json) {
            self.spatial_index_manager.detect_collisions(&element)
        } else {
            "[]".to_string()
        }
    }

    /// Get spatial index statistics
    #[wasm_bindgen]
    pub fn get_spatial_index_stats(&self) -> String {
        self.spatial_index_manager.get_stats()
    }

    /// Update spatial index bounds
    #[wasm_bindgen]
    pub fn update_spatial_index_bounds(&self, x: f64, y: f64, width: f64, height: f64) {
        self.spatial_index_manager.update_bounds((x, y, width, height));
    }

    /// Rebuild spatial index
    #[wasm_bindgen]
    pub fn rebuild_spatial_index(&self, cell_size: f64) {
        // Get all elements
        let elements_json = self.element_manager.get_all_elements();
        if let Ok(elements) = serde_json::from_str::<Vec<Element>>(&elements_json) {
            self.spatial_index_manager.rebuild(&elements, (0.0, 0.0, 2000.0, 2000.0), cell_size);
        }
    }

    /// Auto-optimize spatial index based on performance
    #[wasm_bindgen]
    pub fn auto_optimize_spatial_index(&self) -> bool {
        self.spatial_index_manager.auto_optimize()
    }

    // Style History methods
    /// Save style to history
    #[wasm_bindgen]
    pub fn save_style_to_history(&self, style_json: &str) -> bool {
        if let Ok(style) = serde_json::from_str::<ElementStyle>(style_json) {
            if let Ok(mut history) = self.style_history.lock() {
                history.add_style(style);
                return true;
            }
        }
        false
    }

    /// Get style history (returns JSON array of styles)
    #[wasm_bindgen]
    pub fn get_style_history(&self, count: usize) -> String {
        if let Ok(history) = self.style_history.lock() {
            let styles = history.get_recent_styles(count);
            serde_json::to_string(&styles).unwrap_or_else(|_| "[]".to_string())
        } else {
            "[]".to_string()
        }
    }

    /// Get last style from history
    #[wasm_bindgen]
    pub fn get_last_style(&self) -> String {
        if let Ok(history) = self.style_history.lock() {
            if let Some(style) = history.get_last_style() {
                serde_json::to_string(&style).unwrap_or_else(|_| "null".to_string())
            } else {
                "null".to_string()
            }
        } else {
            "null".to_string()
        }
    }

    /// Clear style history
    #[wasm_bindgen]
    pub fn clear_style_history(&self) {
        if let Ok(mut history) = self.style_history.lock() {
            history.clear();
        }
    }

    /// Export style history as compressed base64 string
    #[wasm_bindgen]
    pub fn export_style_history(&self) -> String {
        if let Ok(history) = self.style_history.lock() {
            history.export_to_base64().unwrap_or_else(|_| String::new())
        } else {
            String::new()
        }
    }

    /// Import style history from compressed base64 string
    #[wasm_bindgen]
    pub fn import_style_history(&self, data: &str) -> bool {
        if let Ok(mut history) = self.style_history.lock() {
            history.import_from_base64(data).is_ok()
        } else {
            false
        }
    }

    /// Get style history count
    #[wasm_bindgen]
    pub fn get_style_history_count(&self) -> usize {
        if let Ok(history) = self.style_history.lock() {
            history.len()
        } else {
            0
        }
    }
}