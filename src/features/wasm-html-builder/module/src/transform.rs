use std::sync::Mutex;

/// Transform management module for zoom and pan operations
pub struct TransformManager {
    zoom: Mutex<f64>,
    pan_x: Mutex<f64>,
    pan_y: Mutex<f64>,
}

impl TransformManager {
    pub fn new() -> Self {
        Self {
            zoom: std::sync::Mutex::new(1.0),
            pan_x: std::sync::Mutex::new(0.0),
            pan_y: std::sync::Mutex::new(0.0),
        }
    }

    /// ตั้งค่า transform
    pub fn set_transform(&self, zoom: f64, pan_x: f64, pan_y: f64) -> String {
        // Clamp zoom to reasonable values
        let clamped_zoom = zoom.max(0.1).min(5.0);
        
        // Update internal state
        if let Ok(mut zoom_mutex) = self.zoom.lock() {
            *zoom_mutex = clamped_zoom;
        }
        if let Ok(mut pan_x_mutex) = self.pan_x.lock() {
            *pan_x_mutex = pan_x;
        }
        if let Ok(mut pan_y_mutex) = self.pan_y.lock() {
            *pan_y_mutex = pan_y;
        }
        
        format!(r#"{{"zoom":{},"pan_x":{},"pan_y":{}}}"#, clamped_zoom, pan_x, pan_y)
    }

    /// Zoom ไปยังจุดที่กำหนด
    pub fn zoom_to_point(&self, screen_x: f64, screen_y: f64, zoom_delta: f64) -> f64 {
        let current_zoom = if let Ok(zoom_mutex) = self.zoom.lock() {
            *zoom_mutex
        } else {
            1.0
        };
        
        let current_pan_x = if let Ok(pan_x_mutex) = self.pan_x.lock() {
            *pan_x_mutex
        } else {
            0.0
        };
        
        let current_pan_y = if let Ok(pan_y_mutex) = self.pan_y.lock() {
            *pan_y_mutex
        } else {
            0.0
        };
        
        // Calculate new zoom
        let new_zoom = (current_zoom * (1.0 + zoom_delta)).max(0.1).min(5.0);
        
        // Calculate new pan to zoom towards the point
        let zoom_ratio = new_zoom / current_zoom;
        let new_pan_x = screen_x - (screen_x - current_pan_x) * zoom_ratio;
        let new_pan_y = screen_y - (screen_y - current_pan_y) * zoom_ratio;
        
        // Update internal state
        if let Ok(mut zoom_mutex) = self.zoom.lock() {
            *zoom_mutex = new_zoom;
        }
        if let Ok(mut pan_x_mutex) = self.pan_x.lock() {
            *pan_x_mutex = new_pan_x;
        }
        if let Ok(mut pan_y_mutex) = self.pan_y.lock() {
            *pan_y_mutex = new_pan_y;
        }
        
        new_zoom
    }

    /// ได้ค่า zoom ปัจจุบัน
    pub fn get_zoom(&self) -> f64 {
        if let Ok(zoom_mutex) = self.zoom.lock() {
            *zoom_mutex
        } else {
            1.0
        }
    }

    /// ตั้งค่า zoom
    pub fn set_zoom(&self, zoom: f64) -> f64 {
        let clamped_zoom = zoom.max(0.1).min(5.0);
        if let Ok(mut zoom_mutex) = self.zoom.lock() {
            *zoom_mutex = clamped_zoom;
        }
        clamped_zoom
    }

    /// ได้ค่า pan x ปัจจุบัน
    pub fn get_pan_x(&self) -> f64 {
        if let Ok(pan_x_mutex) = self.pan_x.lock() {
            *pan_x_mutex
        } else {
            0.0
        }
    }

    /// ได้ค่า pan y ปัจจุบัน
    pub fn get_pan_y(&self) -> f64 {
        if let Ok(pan_y_mutex) = self.pan_y.lock() {
            *pan_y_mutex
        } else {
            0.0
        }
    }

    /// ตั้งค่า pan
    pub fn set_pan(&self, pan_x: f64, pan_y: f64) {
        if let Ok(mut pan_x_mutex) = self.pan_x.lock() {
            *pan_x_mutex = pan_x;
        }
        if let Ok(mut pan_y_mutex) = self.pan_y.lock() {
            *pan_y_mutex = pan_y;
        }
    }

    /// ได้ transform state ทั้งหมด
    pub fn get_transform_state(&self) -> String {
        let zoom = self.get_zoom();
        let pan_x = self.get_pan_x();
        let pan_y = self.get_pan_y();
        
        format!(r#"{{"zoom":{},"pan_x":{},"pan_y":{}}}"#, zoom, pan_x, pan_y)
    }

    /// Reset transform to default values
    pub fn reset(&self) {
        if let Ok(mut zoom_mutex) = self.zoom.lock() {
            *zoom_mutex = 1.0;
        }
        if let Ok(mut pan_x_mutex) = self.pan_x.lock() {
            *pan_x_mutex = 0.0;
        }
        if let Ok(mut pan_y_mutex) = self.pan_y.lock() {
            *pan_y_mutex = 0.0;
        }
    }

    /// Apply transform to coordinates
    pub fn apply_transform(&self, x: f64, y: f64) -> (f64, f64) {
        let zoom = self.get_zoom();
        let pan_x = self.get_pan_x();
        let pan_y = self.get_pan_y();
        
        let transformed_x = (x - pan_x) / zoom;
        let transformed_y = (y - pan_y) / zoom;
        
        (transformed_x, transformed_y)
    }

    /// Apply inverse transform to coordinates
    pub fn apply_inverse_transform(&self, x: f64, y: f64) -> (f64, f64) {
        let zoom = self.get_zoom();
        let pan_x = self.get_pan_x();
        let pan_y = self.get_pan_y();
        
        let transformed_x = x * zoom + pan_x;
        let transformed_y = y * zoom + pan_y;
        
        (transformed_x, transformed_y)
    }
}
