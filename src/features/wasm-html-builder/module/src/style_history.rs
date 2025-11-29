use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use flate2::Compression;
use flate2::write::DeflateEncoder;
use flate2::read::DeflateDecoder;
use base64::{Engine as _, engine::general_purpose};
use crate::types::ElementStyle;

/// Style history entry with compression
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StyleHistoryEntry {
    pub style: ElementStyle,
    pub timestamp: f64, // Unix timestamp in milliseconds
}

/// Style history manager with DEFLATE compression
#[derive(Debug, Clone)]
pub struct StyleHistory {
    entries: Vec<StyleHistoryEntry>,
    max_entries: usize,
}

impl StyleHistory {
    /// Create a new style history with max entries limit
    pub fn new(max_entries: usize) -> Self {
        StyleHistory {
            entries: Vec::with_capacity(max_entries),
            max_entries,
        }
    }

    /// Add a style to history (auto-deduplicates)
    pub fn add_style(&mut self, style: ElementStyle) {
        let timestamp = js_sys::Date::now();
        
        // Check if the last entry is identical (avoid duplicates)
        if let Some(last_entry) = self.entries.last() {
            if self.styles_equal(&last_entry.style, &style) {
                return; // Skip duplicate
            }
        }

        let entry = StyleHistoryEntry { style, timestamp };

        // Add to history
        self.entries.push(entry);

        // Maintain max entries (FIFO)
        if self.entries.len() > self.max_entries {
            self.entries.remove(0);
        }
    }

    /// Get the most recent style
    pub fn get_last_style(&self) -> Option<ElementStyle> {
        self.entries.last().map(|entry| entry.style.clone())
    }

    /// Get recent N styles
    pub fn get_recent_styles(&self, count: usize) -> Vec<ElementStyle> {
        let start = if self.entries.len() > count {
            self.entries.len() - count
        } else {
            0
        };
        
        self.entries[start..]
            .iter()
            .map(|entry| entry.style.clone())
            .collect()
    }

    /// Get all styles
    pub fn get_all_styles(&self) -> Vec<ElementStyle> {
        self.entries.iter().map(|entry| entry.style.clone()).collect()
    }

    /// Clear all history
    pub fn clear(&mut self) {
        self.entries.clear();
    }

    /// Get history size
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Check if history is empty
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Compress and export history as base64 string
    pub fn export_to_base64(&self) -> Result<String, String> {
        // Serialize to JSON
        let json = serde_json::to_string(&self.entries)
            .map_err(|e| format!("Failed to serialize: {}", e))?;

        // Compress with DEFLATE
        let mut encoder = DeflateEncoder::new(Vec::new(), Compression::best());
        encoder.write_all(json.as_bytes())
            .map_err(|e| format!("Failed to write to encoder: {}", e))?;
        let compressed = encoder.finish()
            .map_err(|e| format!("Failed to finish compression: {}", e))?;

        // Encode to base64
        let base64_str = general_purpose::STANDARD.encode(&compressed);
        
        Ok(base64_str)
    }

    /// Import history from base64 string
    pub fn import_from_base64(&mut self, data: &str) -> Result<(), String> {
        // Decode from base64
        let compressed = general_purpose::STANDARD.decode(data)
            .map_err(|e| format!("Failed to decode base64: {}", e))?;

        // Decompress with DEFLATE
        let mut decoder = DeflateDecoder::new(&compressed[..]);
        let mut json = String::new();
        decoder.read_to_string(&mut json)
            .map_err(|e| format!("Failed to decompress: {}", e))?;

        // Deserialize from JSON
        let entries: Vec<StyleHistoryEntry> = serde_json::from_str(&json)
            .map_err(|e| format!("Failed to deserialize: {}", e))?;

        // Replace current entries
        self.entries = entries;

        // Trim if exceeds max
        if self.entries.len() > self.max_entries {
            let start = self.entries.len() - self.max_entries;
            self.entries = self.entries[start..].to_vec();
        }

        Ok(())
    }

    /// Helper: Compare two styles for equality
    fn styles_equal(&self, a: &ElementStyle, b: &ElementStyle) -> bool {
        // Compare all relevant fields
        a.font_size == b.font_size &&
        a.font_family == b.font_family &&
        a.font_weight == b.font_weight &&
        a.font_style == b.font_style &&
        a.color == b.color &&
        a.background_color == b.background_color &&
        a.text_align == b.text_align &&
        a.padding == b.padding &&
        a.border_radius == b.border_radius &&
        a.border_width == b.border_width &&
        a.border_color == b.border_color &&
        a.fill.color == b.fill.color &&
        a.fill.opacity == b.fill.opacity &&
        a.fill.enabled == b.fill.enabled &&
        a.stroke.color == b.stroke.color &&
        a.stroke.opacity == b.stroke.opacity &&
        a.stroke.width == b.stroke.width &&
        a.stroke.enabled == b.stroke.enabled
    }
}

impl Default for StyleHistory {
    fn default() -> Self {
        Self::new(50) // Default: 50 entries
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ElementStyle;

    #[test]
    fn test_add_and_get_style() {
        let mut history = StyleHistory::new(10);
        let style = ElementStyle::default();
        
        history.add_style(style.clone());
        assert_eq!(history.len(), 1);
        
        let last = history.get_last_style().unwrap();
        assert_eq!(last.font_size, style.font_size);
    }

    #[test]
    fn test_deduplication() {
        let mut history = StyleHistory::new(10);
        let style = ElementStyle::default();
        
        history.add_style(style.clone());
        history.add_style(style.clone()); // Duplicate
        
        assert_eq!(history.len(), 1); // Should not add duplicate
    }

    #[test]
    fn test_max_entries() {
        let mut history = StyleHistory::new(3);
        
        for i in 0..5 {
            let mut style = ElementStyle::default();
            style.font_size = 10.0 + i as f64;
            history.add_style(style);
        }
        
        assert_eq!(history.len(), 3); // Should keep only last 3
        let last = history.get_last_style().unwrap();
        assert_eq!(last.font_size, 14.0); // Last added
    }

    #[test]
    fn test_export_import() {
        let mut history = StyleHistory::new(10);
        let mut style = ElementStyle::default();
        style.font_size = 20.0;
        style.color = "#ff0000".to_string();
        
        history.add_style(style.clone());
        
        let exported = history.export_to_base64().unwrap();
        
        let mut new_history = StyleHistory::new(10);
        new_history.import_from_base64(&exported).unwrap();
        
        assert_eq!(new_history.len(), 1);
        let imported_style = new_history.get_last_style().unwrap();
        assert_eq!(imported_style.font_size, 20.0);
        assert_eq!(imported_style.color, "#ff0000");
    }
}
