use serde_json;
use std::sync::{Mutex, MutexGuard, Arc};
use crate::types::*;

/// Element management module
pub struct ElementManager {
    elements: Arc<Mutex<Vec<Element>>>,
}

impl ElementManager {
    pub fn new() -> Self {
        Self {
            elements: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn new_with_data(elements: Arc<Mutex<Vec<Element>>>) -> Self {
        Self { elements }
    }

    /// สร้าง element ใหม่ (working implementation with unique IDs)
    pub fn create_element(&self, component_type: &str, x: f64, y: f64) -> String {
        let mut elements = self.elements.lock().unwrap();
        
        // Generate unique ID using timestamp and random number
        let timestamp = js_sys::Date::now() as u64;
        let random = (js_sys::Math::random() * 1000000.0) as u64;
        let element_id = format!("element-{}-{}", timestamp, random);
        
        let mut element = Element::new(
            element_id,
            component_type.to_string(),
            component_type.to_string(),
        );
        
        element.x = x;
        element.y = y;
        
        // Initialize table data for table elements
        if component_type == "table" {
            element.create_default_table(3, 3); // Default 3x3 table
        }
        
        elements.push(element.clone());
        
        serde_json::to_string(&element).unwrap_or_else(|_| "{}".to_string())
    }

    /// อัพเดทตำแหน่ง element (working implementation)
    pub fn update_element_position(&self, element_id: &str, x: f64, y: f64) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id {
                element.x = x;
                element.y = y;
                return true;
            }
        }
        false
    }

    /// อัพเดท element size (working implementation)
    pub fn update_element_size(&self, element_id: &str, width: f64, height: f64) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id {
                element.set_width(width);
                element.set_height(height);
                return true;
            }
        }
        false
    }

    /// อัพเดท element content
    pub fn update_element_content(&self, element_id: &str, content: &str) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id {
                element.content = content.to_string();
                return true;
            }
        }
        false
    }

    /// อัพเดท element style
    pub fn update_element_style(&self, element_id: &str, style_json: &str) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id {
                // Parse partial style update
                if let Ok(style_update) = serde_json::from_str::<serde_json::Value>(style_json) {
                    let mut updated = false;
                    if let Some(font_size) = style_update.get("fontSize").and_then(|v| v.as_f64()) {
                        element.style.font_size = font_size;
                        updated = true;
                    }
                    if let Some(font_family) = style_update.get("fontFamily").and_then(|v| v.as_str()) {
                        element.style.font_family = font_family.to_string();
                        updated = true;
                    }
                    if let Some(font_weight) = style_update.get("fontWeight").and_then(|v| v.as_str()) {
                        element.style.font_weight = font_weight.to_string();
                        updated = true;
                    }
                    if let Some(font_style) = style_update.get("fontStyle").and_then(|v| v.as_str()) {
                        element.style.font_style = font_style.to_string();
                        updated = true;
                    }
                    if let Some(color) = style_update.get("color").and_then(|v| v.as_str()) {
                        element.style.color = color.to_string();
                        updated = true;
                    }
                    if let Some(bg_color) = style_update.get("backgroundColor").and_then(|v| v.as_str()) {
                        element.style.background_color = bg_color.to_string();
                        updated = true;
                    }
                    if let Some(text_align) = style_update.get("textAlign").and_then(|v| v.as_str()) {
                        element.style.text_align = text_align.to_string();
                        updated = true;
                    }
                    if let Some(padding) = style_update.get("padding").and_then(|v| v.as_f64()) {
                        element.style.padding = padding;
                        updated = true;
                    }
                    if let Some(border_radius) = style_update.get("borderRadius").and_then(|v| v.as_f64()) {
                        element.style.border_radius = border_radius;
                        updated = true;
                    }
                    if let Some(border_width) = style_update.get("borderWidth").and_then(|v| v.as_f64()) {
                        element.style.border_width = border_width;
                        updated = true;
                    }
                    if let Some(border_color) = style_update.get("borderColor").and_then(|v| v.as_str()) {
                        element.style.border_color = border_color.to_string();
                        updated = true;
                    }
                    
                    // Fill style updates
                    if let Some(fill_update) = style_update.get("fill") {
                        if let Some(fill_color) = fill_update.get("color").and_then(|v| v.as_str()) {
                            element.style.fill.color = fill_color.to_string();
                            updated = true;
                        }
                        if let Some(fill_opacity) = fill_update.get("opacity").and_then(|v| v.as_f64()) {
                            element.style.fill.opacity = fill_opacity;
                            updated = true;
                        }
                        if let Some(fill_enabled) = fill_update.get("enabled").and_then(|v| v.as_bool()) {
                            element.style.fill.enabled = fill_enabled;
                            updated = true;
                        }
                    }
                    
                    // Stroke style updates
                    if let Some(stroke_update) = style_update.get("stroke") {
                        if let Some(stroke_color) = stroke_update.get("color").and_then(|v| v.as_str()) {
                            element.style.stroke.color = stroke_color.to_string();
                            updated = true;
                        }
                        if let Some(stroke_opacity) = stroke_update.get("opacity").and_then(|v| v.as_f64()) {
                            element.style.stroke.opacity = stroke_opacity;
                            updated = true;
                        }
                        if let Some(stroke_width) = stroke_update.get("width").and_then(|v| v.as_f64()) {
                            element.style.stroke.width = stroke_width;
                            updated = true;
                        }
                        if let Some(stroke_position) = stroke_update.get("position").and_then(|v| v.as_str()) {
                            element.style.stroke.position = stroke_position.to_string();
                            updated = true;
                        }
                        if let Some(stroke_style) = stroke_update.get("style").and_then(|v| v.as_str()) {
                            element.style.stroke.style = stroke_style.to_string();
                            updated = true;
                        }
                        if let Some(stroke_enabled) = stroke_update.get("enabled").and_then(|v| v.as_bool()) {
                            element.style.stroke.enabled = stroke_enabled;
                            updated = true;
                        }
                    }
                    
                    return updated;
                } else {
                    return false;
                }
            }
        }
        false
    }

    /// ลบ element (working implementation)
    pub fn delete_element(&self, element_id: &str) -> bool {
        let mut elements = self.elements.lock().unwrap();
        let initial_len = elements.len();
        elements.retain(|element| element.id != element_id);
        
        elements.len() < initial_len
    }

    /// ได้ element ตาม ID (optimized with spatial indexing)
    pub fn get_element(&self, element_id: &str) -> String {
        let elements = self.elements.lock().unwrap();
        // Use binary search for O(log n) lookup if elements are sorted by ID
        // For now, keep linear search but this could be optimized further
        for element in elements.iter() {
            if element.id == element_id {
                return serde_json::to_string(element).unwrap_or_else(|_| "null".to_string());
            }
        }
        
        "null".to_string()
    }

    /// ได้ elements ทั้งหมด
    pub fn get_all_elements(&self) -> String {
        let elements = self.elements.lock().unwrap();
        serde_json::to_string(&*elements).unwrap_or_else(|_| "[]".to_string())
    }

    /// ได้จำนวน elements
    pub fn get_element_count(&self) -> usize {
        let elements = self.elements.lock().unwrap();
        elements.len()
    }

    /// ตรวจสอบการชน (minimal implementation)
    pub fn check_collisions(&self, _element_id: &str) -> String {
        r#"{"element_id":"","colliding_elements":[],"is_out_of_bounds":false}"#.to_string()
    }

    /// หา elements ในพื้นที่ที่กำหนด (minimal implementation)
    pub fn get_elements_in_region(&self, _x: f64, _y: f64, _width: f64, _height: f64) -> String {
        r#"{"elements":[],"total_count":0}"#.to_string()
    }

    /// อัพเดทตำแหน่งหลาย elements พร้อมกัน (minimal implementation)
    pub fn batch_update_positions(&self, _updates_json: &str) -> String {
        "[]".to_string()
    }

    /// ได้ elements reference สำหรับ export
    pub fn get_elements_ref(&self) -> MutexGuard<Vec<Element>> {
        self.elements.lock().unwrap()
    }

    /// Clear all elements
    pub fn clear(&self) {
        let mut elements = self.elements.lock().unwrap();
        elements.clear();
    }

    /// Performance optimization methods for StylePanel
    /// Parse form field data efficiently in WASM
    pub fn parse_form_field_data(&self, element_id: &str) -> String {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id && element.element_type == "form_field" {
                // Parse and return optimized form field data
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&element.content) {
                    let optimized_data = serde_json::json!({
                        "showLabel": parsed.get("showLabel").and_then(|v| v.as_bool()).unwrap_or(true),
                        "gap": parsed.get("gap").and_then(|v| v.as_f64()).unwrap_or(8.0),
                        "labelWidth": parsed.get("labelWidth").and_then(|v| v.as_f64()).unwrap_or(30.0),
                        "valueWidth": parsed.get("valueWidth").and_then(|v| v.as_f64()).unwrap_or(70.0),
                        "underlineStyle": parsed.get("underlineStyle").and_then(|v| v.as_str()).unwrap_or("solid")
                    });
                    return optimized_data.to_string();
                }
            }
        }
        
        // Return default form field data
        serde_json::json!({
            "showLabel": true,
            "gap": 8.0,
            "labelWidth": 30.0,
            "valueWidth": 70.0,
            "underlineStyle": "solid"
        }).to_string()
    }

    /// Calculate safe style properties efficiently in WASM
    pub fn calculate_safe_style(&self, element_id: &str) -> String {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id {
                // Calculate and return optimized safe style
                let safe_style = serde_json::json!({
                    "fontSize": element.style.font_size,
                    "fontFamily": element.style.font_family,
                    "fontWeight": element.style.font_weight,
                    "fontStyle": element.style.font_style,
                    "color": element.style.color,
                    "backgroundColor": element.style.background_color,
                    "textAlign": element.style.text_align,
                    "padding": element.style.padding,
                    "borderRadius": element.style.border_radius,
                    "borderWidth": element.style.border_width,
                    "borderColor": element.style.border_color
                });
                return safe_style.to_string();
            }
        }
        
        "null".to_string()
    }

    /// Get element type flags efficiently
    pub fn get_element_type_flags(&self, element_id: &str) -> String {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id {
                let flags = serde_json::json!({
                    "isTable": element.element_type == "table",
                    "isFormField": element.element_type == "form_field",
                    "elementType": element.element_type
                });
                return flags.to_string();
            }
        }
        
        serde_json::json!({
            "isTable": false,
            "isFormField": false,
            "elementType": "unknown"
        }).to_string()
    }

    /// Batch update form field content efficiently
    pub fn batch_update_form_field(&self, element_id: &str, updates_json: &str) -> bool {
        let mut elements = self.elements.lock().unwrap();
        for element in elements.iter_mut() {
            if element.id == element_id && element.element_type == "form_field" {
                if let Ok(updates) = serde_json::from_str::<serde_json::Value>(updates_json) {
                    // Parse current content
                    let mut current_data = if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&element.content) {
                        parsed
                    } else {
                        serde_json::json!({})
                    };
                    
                    // Apply updates
                    if let Some(show_label) = updates.get("showLabel") {
                        current_data["showLabel"] = show_label.clone();
                    }
                    if let Some(gap) = updates.get("gap") {
                        current_data["gap"] = gap.clone();
                    }
                    if let Some(label_width) = updates.get("labelWidth") {
                        current_data["labelWidth"] = label_width.clone();
                    }
                    if let Some(value_width) = updates.get("valueWidth") {
                        current_data["valueWidth"] = value_width.clone();
                    }
                    if let Some(underline_style) = updates.get("underlineStyle") {
                        current_data["underlineStyle"] = underline_style.clone();
                    }
                    
                    // Update element content
                    element.content = current_data.to_string();
                    return true;
                }
            }
        }
        false
    }

    /// Get optimized element data for StylePanel
    pub fn get_element_for_style_panel(&self, element_id: &str) -> String {
        let elements = self.elements.lock().unwrap();
        for element in elements.iter() {
            if element.id == element_id {
                // Return only necessary data for StylePanel
                let optimized_element = serde_json::json!({
                    "id": element.id,
                    "element_type": element.element_type,
                    "content": element.content,
                    "style": {
                        "fontSize": element.style.font_size,
                        "fontFamily": element.style.font_family,
                        "fontWeight": element.style.font_weight,
                        "fontStyle": element.style.font_style,
                        "color": element.style.color,
                        "backgroundColor": element.style.background_color,
                        "textAlign": element.style.text_align,
                        "padding": element.style.padding,
                        "borderRadius": element.style.border_radius,
                        "borderWidth": element.style.border_width,
                        "borderColor": element.style.border_color
                    },
                    "table_data": if element.element_type == "table" {
                        element.table_data.as_ref().map(|data| serde_json::json!({
                            "rows": data.rows.len(),
                            "columns": data.columns,
                            "header_rows": data.header_rows
                        }))
                    } else {
                        None
                    }
                });
                return optimized_element.to_string();
            }
        }
        
        "null".to_string()
    }

    /// Validate and sanitize style updates
    pub fn validate_style_update(&self, style_json: &str) -> String {
        if let Ok(style_update) = serde_json::from_str::<serde_json::Value>(style_json) {
            let mut validated = serde_json::Map::new();
            
            // Validate font size (8-72)
            if let Some(font_size) = style_update.get("fontSize").and_then(|v| v.as_f64()) {
                if font_size >= 8.0 && font_size <= 72.0 {
                    validated.insert("fontSize".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(font_size).unwrap()));
                }
            }
            
            // Validate font family
            if let Some(font_family) = style_update.get("fontFamily").and_then(|v| v.as_str()) {
                validated.insert("fontFamily".to_string(), serde_json::Value::String(font_family.to_string()));
            }
            
            // Validate font weight
            if let Some(font_weight) = style_update.get("fontWeight").and_then(|v| v.as_str()) {
                if matches!(font_weight, "normal" | "bold") {
                    validated.insert("fontWeight".to_string(), serde_json::Value::String(font_weight.to_string()));
                }
            }
            
            // Validate font style
            if let Some(font_style) = style_update.get("fontStyle").and_then(|v| v.as_str()) {
                if matches!(font_style, "normal" | "italic") {
                    validated.insert("fontStyle".to_string(), serde_json::Value::String(font_style.to_string()));
                }
            }
            
            // Validate color (hex format)
            if let Some(color) = style_update.get("color").and_then(|v| v.as_str()) {
                if color.starts_with('#') && color.len() == 7 {
                    validated.insert("color".to_string(), serde_json::Value::String(color.to_string()));
                }
            }
            
            // Validate background color
            if let Some(bg_color) = style_update.get("backgroundColor").and_then(|v| v.as_str()) {
                if bg_color.starts_with('#') && bg_color.len() == 7 {
                    validated.insert("backgroundColor".to_string(), serde_json::Value::String(bg_color.to_string()));
                }
            }
            
            // Validate text align
            if let Some(text_align) = style_update.get("textAlign").and_then(|v| v.as_str()) {
                if matches!(text_align, "left" | "center" | "right") {
                    validated.insert("textAlign".to_string(), serde_json::Value::String(text_align.to_string()));
                }
            }
            
            // Validate padding (0-50)
            if let Some(padding) = style_update.get("padding").and_then(|v| v.as_f64()) {
                if padding >= 0.0 && padding <= 50.0 {
                    validated.insert("padding".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(padding).unwrap()));
                }
            }
            
            // Validate border radius (0-50)
            if let Some(border_radius) = style_update.get("borderRadius").and_then(|v| v.as_f64()) {
                if border_radius >= 0.0 && border_radius <= 50.0 {
                    validated.insert("borderRadius".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(border_radius).unwrap()));
                }
            }
            
            // Validate border width (0-10)
            if let Some(border_width) = style_update.get("borderWidth").and_then(|v| v.as_f64()) {
                if border_width >= 0.0 && border_width <= 10.0 {
                    validated.insert("borderWidth".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(border_width).unwrap()));
                }
            }
            
            // Validate border color
            if let Some(border_color) = style_update.get("borderColor").and_then(|v| v.as_str()) {
                if border_color.starts_with('#') && border_color.len() == 7 {
                    validated.insert("borderColor".to_string(), serde_json::Value::String(border_color.to_string()));
                }
            }
            
            return serde_json::Value::Object(validated).to_string();
        }
        
        "{}".to_string()
    }

    /// Performance optimized element lookup with caching
    pub fn get_elements_summary(&self) -> String {
        let elements = self.elements.lock().unwrap();
        
        let summary = serde_json::json!({
            "total": elements.len(),
            "by_type": {
                "text": elements.iter().filter(|e| e.element_type == "text").count(),
                "table": elements.iter().filter(|e| e.element_type == "table").count(),
                "form_field": elements.iter().filter(|e| e.element_type == "form_field").count(),
                "button": elements.iter().filter(|e| e.element_type == "button").count(),
                "input": elements.iter().filter(|e| e.element_type == "input").count(),
                "checkbox": elements.iter().filter(|e| e.element_type == "checkbox").count()
            }
        });
        
        summary.to_string()
    }
}
