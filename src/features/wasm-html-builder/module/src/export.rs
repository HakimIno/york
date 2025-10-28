use serde_json;
use std::sync::{Mutex, Arc};
use crate::types::*;

/// HTML export module
pub struct ExportManager {
    elements: Arc<Mutex<Vec<Element>>>,
    papers: Arc<Mutex<Vec<A4Paper>>>,
}

impl ExportManager {
    pub fn new(elements: Arc<Mutex<Vec<Element>>>, papers: Arc<Mutex<Vec<A4Paper>>>) -> Self {
        Self { elements, papers }
    }

    /// Clean and modernize HTML content (convert deprecated tags to modern HTML/CSS)
    fn clean_html_content(&self, content: &str) -> String {
        let mut cleaned = content.to_string();
        
        // Convert <font color="..."> to <span style="color: ...">
        // Simple regex-like replacement for basic cases
        while let Some(start_idx) = cleaned.find("<font color=\"") {
            if let Some(color_start) = cleaned[start_idx..].find('"') {
                let color_start_abs = start_idx + color_start + 1;
                if let Some(color_end) = cleaned[color_start_abs..].find('"') {
                    let color = &cleaned[color_start_abs..color_start_abs + color_end];
                    if let Some(tag_end) = cleaned[start_idx..].find('>') {
                        let tag_end_abs = start_idx + tag_end + 1;
                        
                        // Find matching </font>
                        if let Some(close_tag_idx) = cleaned[tag_end_abs..].find("</font>") {
                            let close_tag_abs = tag_end_abs + close_tag_idx;
                            let inner_content = &cleaned[tag_end_abs..close_tag_abs].to_string();
                            
                            // Replace with modern span
                            let new_tag = format!("<span style=\"color: {}\">{}</span>", color, inner_content);
                            cleaned.replace_range(start_idx..close_tag_abs + 7, &new_tag);
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        cleaned
    }

    /// Export HTML (complete implementation)
    pub fn export_html(&self, _options_json: &str) -> String {
        let elements = self.elements.lock().unwrap();
        let papers = self.papers.lock().unwrap();
        
        // สร้าง HTML structure
        let mut html = String::new();
        let mut css = String::new();
        
        // CSS สำหรับ A4 papers
        css.push_str("
/* Force print background colors and images */
* {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
}

.paper-container {
    width: 100%;
    min-height: 100vh;
    background-color: #f5f5f5;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.a4-paper {
    width: 794px;
    min-height: 1123px;
    background-color: white;
    margin: 0 auto 20px auto;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    page-break-after: always;
}

.element {
    position: absolute;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
}

.element-text {
    white-space: pre-wrap;
    word-wrap: break-word;
}

.element-button {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid #007bff;
    background: #007bff;
    color: white;
    border-radius: 4px;
}

.element-input {
    border: 1px solid #ccc;
    padding: 4px 8px;
    border-radius: 4px;
    background: white;
}

.element-table {
    border-collapse: collapse;
    table-layout: auto;
}

.element-table th,
.element-table td {
    border: 1px solid #ccc;
    padding: 4px 8px;
    text-align: left;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.form-field {
    display: flex;
    align-items: center;
}

.form-field-label {
    margin-right: 8px;
}

.form-field-value {
    flex: 1;
    border-bottom: 1px solid #000;
    min-height: 1.2em;
    padding-bottom: 2px;
}

.element-rectangle {
    border-radius: 0;
}

.element-circle {
    border-radius: 50%;
}

.element-line {
    background: transparent;
    border: none;
}

.element-line svg {
    pointer-events: none;
}

.checkbox {
    display: inline-block;
    border: 1px solid #222;
    text-align: center;
    margin-right: 4px;
}

@media print {
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }
    body { margin: 0; }
    .paper-container { padding: 0; background: white; }
    .a4-paper { 
        width: 210mm; 
        min-height: 297mm; 
        margin: 0; 
        box-shadow: none; 
        page-break-after: always;
    }
    .element {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }
    .element-table {
        table-layout: auto !important;
    }
    .element-table td {
        width: auto !important;
        min-width: auto !important;
        height: auto !important;
        min-height: auto !important;
    }
}
        ");
        
        // HTML structure
        html.push_str("<div class=\"paper-container\">\n");
        
        // สร้าง A4 papers
        for (page_index, paper) in papers.iter().enumerate() {
            html.push_str(&format!(
                "  <div class=\"a4-paper\" id=\"page-{}\">\n",
                page_index + 1
            ));
            
            // หา elements ที่อยู่ในหน้านี้
            let page_elements: Vec<&Element> = elements.iter()
                .filter(|element| self.is_element_in_paper(element, paper))
                .collect();
            
            // เรียง elements ตาม z-index
            let mut sorted_elements = page_elements;
            sorted_elements.sort_by(|a, b| a.z_index.cmp(&b.z_index));
            
            // สร้าง HTML สำหรับแต่ละ element
            for element in sorted_elements {
                html.push_str(&self.generate_element_html(element, paper));
            }
            
            html.push_str("  </div>\n");
        }
        
        html.push_str("</div>\n");
        
        let timestamp = js_sys::Date::now();
        
        let result = format!(
            r#"{{"html":"{}","css":"{}","metadata":{{"total_elements":{},"total_pages":{},"css_classes_count":10,"export_timestamp":{},"framework_used":"None"}}}}"#,
            html.replace('"', "\\\"").replace('\n', "\\n"),
            css.replace('"', "\\\"").replace('\n', "\\n"),
            elements.len(),
            papers.len(),
            timestamp
        );
        
        result
    }

    /// ตรวจสอบว่า element อยู่ในขอบเขตของ paper หรือไม่
    fn is_element_in_paper(&self, element: &Element, paper: &A4Paper) -> bool {
        let element_right = element.x + element.width;
        let element_bottom = element.y + element.height;
        let paper_right = paper.x + paper.width;
        let paper_bottom = paper.y + paper.height;
        
        // Element overlaps with paper if it's within the paper boundaries
        element.x < paper_right && element_right > paper.x &&
        element.y < paper_bottom && element_bottom > paper.y
    }

    fn generate_element_html(&self, element: &Element, paper: &A4Paper) -> String {
        let mut html = String::new();
        
        // คำนวณตำแหน่งสัมพันธ์กับ paper
        let relative_x = element.x - paper.x;
        let relative_y = element.y - paper.y;
        
        // สร้าง style string โดยไม่มี border (เว้นแต่จะเป็น button หรือ input)
        let has_border = matches!(element.element_type.as_str(), "button" | "input");
        
        let style = if has_border {
            format!(
                "left: {}px; top: {}px; width: {}px; height: {}px; z-index: {}; \
                 font-size: {}px; font-family: {}; font-weight: {}; font-style: {}; \
                 color: {}; background-color: {}; text-align: {}; padding: {}px; \
                 border-radius: {}px; border: {}px solid {}; position: absolute;",
                relative_x, relative_y, element.width, element.height, element.z_index,
                element.style.font_size, element.style.font_family, element.style.font_weight,
                element.style.font_style, element.style.color, element.style.background_color,
                element.style.text_align, element.style.padding, element.style.border_radius,
                element.style.border_width, element.style.border_color
            )
        } else {
            format!(
                "left: {}px; top: {}px; width: {}px; height: {}px; z-index: {}; \
                 font-size: {}px; font-family: {}; font-weight: {}; font-style: {}; \
                 color: {}; background-color: {}; text-align: {}; padding: {}px; \
                 border-radius: {}px; border: none; position: absolute;",
                relative_x, relative_y, element.width, element.height, element.z_index,
                element.style.font_size, element.style.font_family, element.style.font_weight,
                element.style.font_style, element.style.color, element.style.background_color,
                element.style.text_align, element.style.padding, element.style.border_radius
            )
        };

        // Helper to handle rich text content
        let get_content = |content: &str| -> String {
            if content.contains('<') && content.contains('>') {
                // Already contains HTML, clean and modernize it
                self.clean_html_content(content)
            } else {
                // Plain text, escape it
                self.escape_html(content)
            }
        };

        match element.element_type.as_str() {
            "text" => {
                html.push_str(&format!(
                    "    <div class=\"element element-text\" style=\"{}\">{}</div>\n",
                    style, get_content(&element.content)
                ));
            }
            "heading" => {
                html.push_str(&format!(
                    "    <h1 class=\"element element-heading\" style=\"{}\">{}</h1>\n",
                    style, get_content(&element.content)
                ));
            }
            "paragraph" => {
                html.push_str(&format!(
                    "    <p class=\"element element-paragraph\" style=\"{}\">{}</p>\n",
                    style, get_content(&element.content)
                ));
            }
            "button" => {
                html.push_str(&format!(
                    "    <button class=\"element element-button\" style=\"{}\">{}</button>\n",
                    style, get_content(&element.content)
                ));
            }
            "input" => {
                html.push_str(&format!(
                    "    <input class=\"element element-input\" type=\"text\" value=\"{}\" style=\"{}\" />\n",
                    self.escape_html(&element.content), style
                ));
            }
            "table" => {
                html.push_str(&self.generate_table_html(element, &style));
            }
            "form_field" => {
                html.push_str(&self.generate_form_field_html(element, &style));
            }
            "checkbox" => {
                html.push_str(&self.generate_checkbox_html(element, &style));
            }
            "rectangle" => {
                html.push_str(&self.generate_rectangle_html(element, &style));
            }
            "circle" => {
                html.push_str(&self.generate_circle_html(element, &style));
            }
            "line" => {
                html.push_str(&self.generate_line_html(element, &style));
            }
            _ => {
                // Default: treat as div with rich text support
                html.push_str(&format!(
                    "    <div class=\"element\" style=\"{}\">{}</div>\n",
                    style, get_content(&element.content)
                ));
            }
        }
        
        html
    }

    fn generate_table_html(&self, element: &Element, base_style: &str) -> String {
        let mut html = String::new();
        
        if let Some(ref table_data) = element.table_data {
            // Calculate total table width from column widths
            let total_width: f64 = table_data.column_widths.iter().sum();
            let table_width_style = format!("{} table-layout: auto; width: {}px;", base_style, total_width);
            
            
            html.push_str(&format!(
                "    <table class=\"element element-table\" style=\"{}\">\n",
                table_width_style
            ));
            
            for (_row_index, row) in table_data.rows.iter().enumerate() {
                html.push_str("      <tr>\n");
                for (col_index, cell) in row.cells.iter().enumerate() {
                    // Skip merged cells that are marked as merged (rowspan=0 and colspan=0)
                    if cell.rowspan == 0 && cell.colspan == 0 {
                        continue;
                    }
                    
                    // Use actual column width from table data
                    let cell_width = if col_index < table_data.column_widths.len() {
                        let width = table_data.column_widths[col_index];
                        format!("width: {}px; min-width: {}px;", width, width)
                    } else {
                        String::new()
                    };
                    
                    // Use actual row height from table data
                    let cell_height = format!("height: {}px; min-height: {}px;", row.height, row.height);
                    
                    // Add border styling for better table appearance
                    let border_style = "border: 1px solid #ccc;";
                    
                    // Use cell-specific styles instead of hardcoded values
                    let cell_font_size = cell.style.font_size;
                    let cell_font_family = &cell.style.font_family;
                    let cell_font_weight = &cell.style.font_weight;
                    let cell_font_style = &cell.style.font_style;
                    let cell_color = &cell.style.color;
                    let cell_background_color = &cell.style.background_color;
                    let cell_text_align = &cell.style.text_align;
                    let cell_padding = cell.style.padding;
                    
                    
                    let cell_style = format!("{} {} {} font-size: {}px; font-family: {}; font-weight: {}; font-style: {}; color: {}; background-color: {}; text-align: {}; padding: {}px;", 
                                           cell_width, cell_height, border_style,
                                           cell_font_size, cell_font_family, cell_font_weight, cell_font_style,
                                           cell_color, cell_background_color, cell_text_align, cell_padding);
                    
                    if cell.rowspan > 1 || cell.colspan > 1 {
                        html.push_str(&format!(
                            "        <td rowspan=\"{}\" colspan=\"{}\" style=\"{}\">{}</td>\n",
                            cell.rowspan, cell.colspan, cell_style,
                            self.escape_html(&cell.content)
                        ));
                    } else {
                        html.push_str(&format!(
                            "        <td style=\"{}\">{}</td>\n",
                            cell_style, self.escape_html(&cell.content)
                        ));
                    }
                }
                html.push_str("      </tr>\n");
            }
            
            html.push_str("    </table>\n");
        } else {
            // Fallback for table without data
            html.push_str(&format!(
                "    <div class=\"element\" style=\"{}\">{}</div>\n",
                base_style, self.escape_html(&element.content)
            ));
        }
        
        html
    }

    fn generate_form_field_html(&self, element: &Element, base_style: &str) -> String {
        let mut html = String::new();
        
        // Parse form field data
        if let Ok(form_data) = serde_json::from_str::<serde_json::Value>(&element.content) {
            let label = form_data.get("label").and_then(|v| v.as_str()).unwrap_or("Label:");
            let value = form_data.get("value").and_then(|v| v.as_str()).unwrap_or("");
            let show_label = form_data.get("showLabel").and_then(|v| v.as_bool()).unwrap_or(true);
            let label_width = form_data.get("labelWidth").and_then(|v| v.as_f64()).unwrap_or(30.0);
            let value_width = form_data.get("valueWidth").and_then(|v| v.as_f64()).unwrap_or(70.0);
            let underline_style = form_data.get("underlineStyle").and_then(|v| v.as_str()).unwrap_or("solid");
            
            html.push_str(&format!(
                "    <div class=\"element form-field\" style=\"{}\">\n",
                base_style
            ));
            
            if show_label {
                html.push_str(&format!(
                    "      <span class=\"form-field-label\" style=\"width: {}%; margin-right: 8px;\">{}</span>\n",
                    label_width, self.escape_html(label)
                ));
            }
            
            let border_style = match underline_style {
                "dashed" => "1px dashed #000",
                "dotted" => "1px dotted #000", 
                "double" => "3px double #000",
                _ => "1px solid #000",
            };
            
            html.push_str(&format!(
                "      <span class=\"form-field-value\" style=\"width: {}%; border-bottom: {}; min-height: 1.2em; padding-bottom: 2px;\">{}</span>\n",
                if show_label { value_width } else { 100.0 },
                border_style,
                self.escape_html(value)
            ));
            
            html.push_str("    </div>\n");
        } else {
            // Fallback
            html.push_str(&format!(
                "    <div class=\"element\" style=\"{}\">{}</div>\n",
                base_style, self.escape_html(&element.content)
            ));
        }
        
        html
    }

    fn generate_checkbox_html(&self, element: &Element, base_style: &str) -> String {
        let mut html = String::new();
        
        // Parse checkbox data
        if let Ok(checkbox_data) = serde_json::from_str::<serde_json::Value>(&element.content) {
            let label = checkbox_data.get("label").and_then(|v| v.as_str()).unwrap_or("Checkbox");
            let checked = checkbox_data.get("checked").and_then(|v| v.as_bool()).unwrap_or(false);
            let show_label = checkbox_data.get("showLabel").and_then(|v| v.as_bool()).unwrap_or(true);
            let label_position = checkbox_data.get("labelPosition").and_then(|v| v.as_str()).unwrap_or("right");
            let checkbox_style = checkbox_data.get("checkboxStyle").and_then(|v| v.as_str()).unwrap_or("square");
            let box_size = checkbox_data.get("boxSize").and_then(|v| v.as_f64()).unwrap_or(15.0) as i32;
            let font_size = checkbox_data.get("fontSize").and_then(|v| v.as_f64()).unwrap_or(12.0) as i32;
            let label_gap = checkbox_data.get("labelGap").and_then(|v| v.as_f64()).unwrap_or(4.0) as i32;
            
            html.push_str(&format!(
                "    <div class=\"element checkbox-element\" style=\"{}display: flex; align-items: center;\">\n",
                base_style
            ));
            
            // Determine order based on label position
            if label_position == "left" && show_label {
                html.push_str(&format!(
                    "      <span style=\"margin-right: {}px; font-size: {}px; font-family: {}; font-weight: {}; font-style: {}; color: {}; background-color: {}; padding: {}px; border-radius: {}px;\">{}</span>\n",
                    label_gap, 
                    element.style.font_size, element.style.font_family, element.style.font_weight,
                    element.style.font_style, element.style.color, element.style.background_color,
                    element.style.padding, element.style.border_radius,
                    self.escape_html(label)
                ));
            }
            
            // Checkbox input with custom styling
            let _checkbox_checked = if checked { " checked" } else { "" };
            let checkbox_shape_style = match checkbox_style {
                "circle" => "border-radius: 50%;",
                "rounded" => "border-radius: 4px;",
                _ => "border-radius: 2px;", // square
            };
            
            html.push_str(&format!(
                "      <span class=\"checkbox\" style=\"width: {}px; height: {}px; line-height: {}px; font-size: {}px; margin-right: {}px; {}\">\n",
                box_size, box_size, box_size, font_size, label_gap, checkbox_shape_style
            ));
            
            if checked {
                html.push_str("        ✓\n");
            }
            
            html.push_str("      </span>\n");
            
            if label_position == "right" && show_label {
                html.push_str(&format!(
                    "      <span style=\"font-size: {}px; font-family: {}; font-weight: {}; font-style: {}; color: {}; background-color: {}; padding: {}px; border-radius: {}px;\">{}</span>\n",
                    element.style.font_size, element.style.font_family, element.style.font_weight,
                    element.style.font_style, element.style.color, element.style.background_color,
                    element.style.padding, element.style.border_radius,
                    self.escape_html(label)
                ));
            }
            
            html.push_str("    </div>\n");
        } else {
            // Fallback
            html.push_str(&format!(
                "    <div class=\"element\" style=\"{}\">{}</div>\n",
                base_style, self.escape_html(&element.content)
            ));
        }
        
        html
    }

    fn generate_rectangle_html(&self, element: &Element, base_style: &str) -> String {
        let fill_color = if element.style.fill.enabled {
            element.style.fill.color.clone()
        } else if !element.style.background_color.is_empty() && element.style.background_color != "transparent" {
            // Use background_color as fallback when fill is not enabled
            element.style.background_color.clone()
        } else {
            "transparent".to_string()
        };
        
        let stroke_width = element.style.stroke.width;
        let stroke_color = element.style.stroke.color.clone();
        let stroke_style_type = if element.style.stroke.enabled {
            element.style.stroke.style.clone()
        } else {
            "solid".to_string()
        };
        
        // Use SVG for proper stroke style support
        if element.style.stroke.enabled && stroke_width > 0.0 {
            let stroke_dasharray = match stroke_style_type.as_str() {
                "dashed" => "stroke-dasharray=\"5,5\"",
                "dotted" => "stroke-dasharray=\"2,2\"",
                _ => "",
            };
            
            format!(
                r#"    <div class="element element-rectangle" style="{} background-color: {}; position: relative;">
        <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
            <rect x="{}" y="{}" width="{}" height="{}" fill="{}" stroke="{}" stroke-width="{}" {} />
        </svg>
    </div>
"#,
                base_style, fill_color,
                stroke_width / 2.0, stroke_width / 2.0,
                element.width - stroke_width, element.height - stroke_width,
                fill_color, stroke_color, stroke_width, stroke_dasharray
            )
        } else {
            let shape_style = format!(
                "{} background-color: {}; border: none;",
                base_style, fill_color
            );
            
            format!(
                "    <div class=\"element element-rectangle\" style=\"{}\"></div>\n",
                shape_style
            )
        }
    }

    fn generate_circle_html(&self, element: &Element, base_style: &str) -> String {
        let fill_color = if element.style.fill.enabled {
            element.style.fill.color.clone()
        } else if !element.style.background_color.is_empty() && element.style.background_color != "transparent" {
            // Use background_color as fallback when fill is not enabled
            element.style.background_color.clone()
        } else {
            "transparent".to_string()
        };
        
        let stroke_width = element.style.stroke.width;
        let stroke_color = element.style.stroke.color.clone();
        let stroke_style_type = if element.style.stroke.enabled {
            element.style.stroke.style.clone()
        } else {
            "solid".to_string()
        };
        
        // Use SVG for proper stroke style support
        if element.style.stroke.enabled && stroke_width > 0.0 {
            let stroke_dasharray = match stroke_style_type.as_str() {
                "dashed" => "stroke-dasharray=\"5,5\"",
                "dotted" => "stroke-dasharray=\"2,2\"",
                _ => "",
            };
            
            let radius = (element.width.min(element.height) - stroke_width) / 2.0;
            let center_x = element.width / 2.0;
            let center_y = element.height / 2.0;
            
            format!(
                r#"    <div class="element element-circle" style="{} background-color: {}; position: relative;">
        <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
            <circle cx="{}" cy="{}" r="{}" fill="{}" stroke="{}" stroke-width="{}" {} />
        </svg>
    </div>
"#,
                base_style, fill_color,
                center_x, center_y, radius,
                fill_color, stroke_color, stroke_width, stroke_dasharray
            )
        } else {
            let shape_style = format!(
                "{} background-color: {}; border: none; border-radius: 50%;",
                base_style, fill_color
            );
            
            format!(
                "    <div class=\"element element-circle\" style=\"{}\"></div>\n",
                shape_style
            )
        }
    }

    fn generate_line_html(&self, element: &Element, base_style: &str) -> String {
        // Parse line data from element content
        let line_data = if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&element.content) {
            parsed
        } else {
            serde_json::json!({
                "lineType": "straight",
                "startX": 0,
                "startY": 0,
                "endX": element.width,
                "endY": 0,
                "arrowStart": false,
                "arrowEnd": false
            })
        };

        let line_type = line_data.get("lineType").and_then(|v| v.as_str()).unwrap_or("straight");
        let start_x = line_data.get("startX").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let start_y = line_data.get("startY").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let end_x = line_data.get("endX").and_then(|v| v.as_f64()).unwrap_or(element.width);
        let end_y = line_data.get("endY").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let arrow_start = line_data.get("arrowStart").and_then(|v| v.as_bool()).unwrap_or(false);
        let arrow_end = line_data.get("arrowEnd").and_then(|v| v.as_bool()).unwrap_or(false);

        let stroke_color = if element.style.stroke.enabled {
            element.style.stroke.color.clone()
        } else {
            element.style.color.clone()
        };
        let stroke_width = if element.style.stroke.enabled {
            element.style.stroke.width
        } else {
            2.0
        };
        let stroke_style = if element.style.stroke.enabled {
            element.style.stroke.style.clone()
        } else {
            "solid".to_string()
        };

        // Generate SVG path based on line type
        let path_d = match line_type {
            "straight" => format!("M {} {} L {} {}", start_x, start_y, end_x, end_y),
            "curved" => {
                let mid_x = (start_x + end_x) / 2.0;
                let mid_y = start_y.min(end_y) - 20.0;
                format!("M {} {} Q {} {} {} {}", start_x, start_y, mid_x, mid_y, end_x, end_y)
            },
            "zigzag" => {
                let segments = 5;
                let mut path = format!("M {} {}", start_x, start_y);
                for i in 1..=segments {
                    let x = start_x + (end_x - start_x) * (i as f64 / segments as f64);
                    let y = start_y + (end_y - start_y) * (i as f64 / segments as f64) + if i % 2 == 0 { 10.0 } else { -10.0 };
                    path.push_str(&format!(" L {} {}", x, y));
                }
                path
            },
            _ => format!("M {} {} L {} {}", start_x, start_y, end_x, end_y),
        };

        // Generate stroke dash array based on actual stroke style, not line type
        let stroke_dasharray = match stroke_style.as_str() {
            "dashed" => "5,5",
            "dotted" => "2,2",
            _ => "none",
        };

        // Generate arrow markers
        let arrow_markers = if arrow_start || arrow_end {
            format!(
                r#"<defs>
        <marker id="arrow-start-{}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="{}"/>
        </marker>
        <marker id="arrow-end-{}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="{}"/>
        </marker>
    </defs>"#,
                element.id, stroke_color, element.id, stroke_color
            )
        } else {
            String::new()
        };

        // Create marker references with proper lifetime
        let marker_start = if arrow_start { 
            format!("url(#arrow-start-{})", element.id) 
        } else { 
            "none".to_string() 
        };
        let marker_end = if arrow_end { 
            format!("url(#arrow-end-{})", element.id) 
        } else { 
            "none".to_string() 
        };

        format!(
            r#"    <div class="element element-line" style="{}">
        <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
            {}
            <path d="{}" stroke="{}" stroke-width="{}" stroke-dasharray="{}" fill="none" 
                  marker-start="{}" marker-end="{}"/>
        </svg>
    </div>
"#,
            base_style,
            arrow_markers,
            path_d,
            stroke_color,
            stroke_width,
            stroke_dasharray,
            marker_start,
            marker_end
        )
    }

    fn escape_html(&self, text: &str) -> String {
        text.replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;")
            .replace('"', "&quot;")
            .replace('\'', "&#x27;")
    }
}
