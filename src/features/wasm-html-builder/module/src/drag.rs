use std::sync::{Mutex, Arc};
use crate::types::*;

/// Simple drag state
#[derive(Debug, Clone)]
pub struct DragState {
    pub element_id: String,
    pub offset_x: f64,
    pub offset_y: f64,
}

/// Drag management module
pub struct DragManager {
    pub drag_state: Mutex<Option<DragState>>,
}

impl DragManager {
    pub fn new() -> Self {
        Self {
            drag_state: std::sync::Mutex::new(None),
        }
    }

    /// เริ่ม drag operation (working implementation)
    pub fn start_drag(&self, element_id: &str, mouse_x: f64, mouse_y: f64, elements: &Arc<Mutex<Vec<Element>>>) -> bool {
        let elements_guard = elements.lock().unwrap();
        if let Some(element) = elements_guard.iter().find(|e| e.id == element_id) {
            let offset_x = mouse_x - element.x;
            let offset_y = mouse_y - element.y;
            
            let mut drag_state = self.drag_state.lock().unwrap();
            *drag_state = Some(DragState {
                element_id: element_id.to_string(),
                offset_x,
                offset_y,
            });
            
            true
        } else {
            false
        }
    }

    /// อัพเดท drag operation (working implementation)
    pub fn update_drag(&self, mouse_x: f64, mouse_y: f64, _zoom: f64, _pan_x: f64, _pan_y: f64, element_manager: &crate::element::ElementManager) -> String {
        let drag_state = self.drag_state.lock().unwrap();
        
        if let Some(ref drag) = *drag_state {
            let new_x = mouse_x - drag.offset_x;
            let new_y = mouse_y - drag.offset_y;
            
            // อัพเดทตำแหน่ง element
            let success = element_manager.update_element_position(&drag.element_id, new_x, new_y);
            
            if success {
                let result = format!(
                    r#"{{"is_valid":true,"element_id":"{}","new_position":{{"x":{},"y":{}}},"collisions":[]}}"#,
                    drag.element_id, new_x, new_y
                );
                return result;
            }
        }
        
        r#"{"is_valid":false,"element_id":"","new_position":{"x":0,"y":0},"collisions":[]}"#.to_string()
    }

    /// จบ drag operation (working implementation)
    pub fn end_drag(&self) -> bool {
        let mut drag_state = self.drag_state.lock().unwrap();
        let was_dragging = drag_state.is_some();
        *drag_state = None;
        
        was_dragging
    }

    /// แปลงจาก screen coordinates เป็น canvas coordinates (minimal implementation)
    pub fn screen_to_canvas(&self, screen_x: f64, screen_y: f64) -> String {
        format!(r#"{{"x":{},"y":{}}}"#, screen_x, screen_y)
    }

    /// แปลงจาก canvas coordinates เป็น screen coordinates (minimal implementation)
    pub fn canvas_to_screen(&self, canvas_x: f64, canvas_y: f64) -> String {
        format!(r#"{{"x":{},"y":{}}}"#, canvas_x, canvas_y)
    }

    /// ได้ drag state ปัจจุบัน
    pub fn get_drag_state(&self) -> Option<DragState> {
        let drag_state = self.drag_state.lock().unwrap();
        drag_state.clone()
    }

    /// ตรวจสอบว่ากำลัง drag อยู่หรือไม่
    pub fn is_dragging(&self) -> bool {
        let drag_state = self.drag_state.lock().unwrap();
        drag_state.is_some()
    }

    /// Clear drag state
    pub fn clear(&self) {
        let mut drag_state = self.drag_state.lock().unwrap();
        *drag_state = None;
    }
}
