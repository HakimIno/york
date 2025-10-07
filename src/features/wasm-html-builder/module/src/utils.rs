use crate::types::*;

/// Utility functions for HTML Builder WASM module

/// Generate unique ID for elements
pub fn generate_id() -> String {
    let timestamp = get_performance_now() as u64;
    let random = (js_sys::Math::random() * 1000000.0) as u64;
    format!("element-{}-{}", timestamp, random)
}

/// Get performance timestamp
pub fn get_performance_now() -> f64 {
    web_sys::window()
        .and_then(|window| window.performance())
        .map(|performance| performance.now())
        .unwrap_or(0.0)
}

/// Get default size for component types
pub fn get_default_size(component_type: &str) -> (f64, f64) {
    match component_type {
        "heading" => (300.0, 60.0),
        "paragraph" => (400.0, 80.0),
        "button" => (120.0, 40.0),
        "image" => (200.0, 150.0),
        "container" => (300.0, 200.0),
        "card" => (280.0, 180.0),
        "input" => (250.0, 40.0),
        "textarea" => (300.0, 100.0),
        "select" => (200.0, 40.0),
        "checkbox" => (150.0, 30.0),
        "radio" => (150.0, 30.0),
        "a4-paper" => (794.0, 1123.0), // A4 size at 96 DPI
        _ => (200.0, 50.0), // default size
    }
}

/// Clamp value between min and max
pub fn clamp(value: f64, min: f64, max: f64) -> f64 {
    if value < min {
        min
    } else if value > max {
        max
    } else {
        value
    }
}

/// Linear interpolation
pub fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * clamp(t, 0.0, 1.0)
}

/// Calculate distance between two points
pub fn distance(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt()
}

/// Check if point is inside rectangle
pub fn point_in_rect(px: f64, py: f64, rx: f64, ry: f64, rw: f64, rh: f64) -> bool {
    px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

/// Check if two rectangles intersect
pub fn rects_intersect(
    x1: f64, y1: f64, w1: f64, h1: f64,
    x2: f64, y2: f64, w2: f64, h2: f64,
) -> bool {
    !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1)
}

/// Convert degrees to radians
pub fn degrees_to_radians(degrees: f64) -> f64 {
    degrees * std::f64::consts::PI / 180.0
}

/// Convert radians to degrees
pub fn radians_to_degrees(radians: f64) -> f64 {
    radians * 180.0 / std::f64::consts::PI
}

/// Normalize angle to 0-2π range
pub fn normalize_angle(angle: f64) -> f64 {
    let two_pi = 2.0 * std::f64::consts::PI;
    ((angle % two_pi) + two_pi) % two_pi
}

/// Calculate bounding box of multiple points
pub fn calculate_bounds(points: &[(f64, f64)]) -> Option<Bounds> {
    if points.is_empty() {
        return None;
    }

    let mut min_x = f64::MAX;
    let mut min_y = f64::MAX;
    let mut max_x = f64::MIN;
    let mut max_y = f64::MIN;

    for &(x, y) in points {
        min_x = min_x.min(x);
        min_y = min_y.min(y);
        max_x = max_x.max(x);
        max_y = max_y.max(y);
    }

    Some(Bounds::new(min_x, min_y, max_x - min_x, max_y - min_y))
}

/// Round number to specified decimal places
pub fn round_to_decimal_places(value: f64, places: i32) -> f64 {
    let multiplier = 10f64.powi(places);
    (value * multiplier).round() / multiplier
}

/// Check if number is approximately equal (within epsilon)
pub fn approximately_equal(a: f64, b: f64, epsilon: f64) -> bool {
    (a - b).abs() < epsilon
}

/// Snap value to grid
pub fn snap_to_grid(value: f64, grid_size: f64) -> f64 {
    if grid_size <= 0.0 {
        return value;
    }
    (value / grid_size).round() * grid_size
}

/// Calculate aspect ratio
pub fn calculate_aspect_ratio(width: f64, height: f64) -> f64 {
    if height == 0.0 {
        1.0
    } else {
        width / height
    }
}

/// Constrain size to maintain aspect ratio
pub fn constrain_to_aspect_ratio(
    width: f64, 
    height: f64, 
    target_aspect_ratio: f64
) -> (f64, f64) {
    let current_aspect_ratio = calculate_aspect_ratio(width, height);
    
    if current_aspect_ratio > target_aspect_ratio {
        // Width is too large, constrain by height
        (height * target_aspect_ratio, height)
    } else {
        // Height is too large, constrain by width
        (width, width / target_aspect_ratio)
    }
}

/// Generate color from string (for consistent element colors)
pub fn string_to_color(s: &str) -> (u8, u8, u8) {
    let mut hash: u32 = 0;
    for byte in s.bytes() {
        hash = hash.wrapping_mul(31).wrapping_add(byte as u32);
    }
    
    let r = ((hash & 0xFF0000) >> 16) as u8;
    let g = ((hash & 0x00FF00) >> 8) as u8;
    let b = (hash & 0x0000FF) as u8;
    
    // Ensure colors are not too dark or too light
    (
        clamp(r as f64, 64.0, 192.0) as u8,
        clamp(g as f64, 64.0, 192.0) as u8,
        clamp(b as f64, 64.0, 192.0) as u8,
    )
}

/// Debounce utility for frequent operations
pub struct Debouncer {
    last_call_time: f64,
    delay: f64,
}

impl Debouncer {
    pub fn new(delay_ms: f64) -> Self {
        Debouncer {
            last_call_time: 0.0,
            delay: delay_ms,
        }
    }

    pub fn should_execute(&mut self) -> bool {
        let current_time = get_performance_now();
        if current_time - self.last_call_time >= self.delay {
            self.last_call_time = current_time;
            true
        } else {
            false
        }
    }
}

/// Throttle utility for performance-sensitive operations
pub struct Throttler {
    last_execution_time: f64,
    interval: f64,
}

impl Throttler {
    pub fn new(interval_ms: f64) -> Self {
        Throttler {
            last_execution_time: 0.0,
            interval: interval_ms,
        }
    }

    pub fn should_execute(&mut self) -> bool {
        let current_time = get_performance_now();
        if current_time - self.last_execution_time >= self.interval {
            self.last_execution_time = current_time;
            true
        } else {
            false
        }
    }
}

/// Performance monitor for tracking operation times
pub struct PerformanceMonitor {
    operation_times: std::collections::HashMap<String, Vec<f64>>,
    max_samples: usize,
}

impl PerformanceMonitor {
    pub fn new(max_samples: usize) -> Self {
        PerformanceMonitor {
            operation_times: std::collections::HashMap::new(),
            max_samples,
        }
    }

    pub fn start_timing(&self, _operation: &str) -> f64 {
        get_performance_now()
    }

    pub fn end_timing(&mut self, operation: &str, start_time: f64) {
        let duration = get_performance_now() - start_time;
        
        let times = self.operation_times.entry(operation.to_string()).or_insert_with(Vec::new);
        times.push(duration);
        
        if times.len() > self.max_samples {
            times.remove(0);
        }
    }

    pub fn get_average_time(&self, operation: &str) -> Option<f64> {
        self.operation_times.get(operation).and_then(|times| {
            if times.is_empty() {
                None
            } else {
                Some(times.iter().sum::<f64>() / times.len() as f64)
            }
        })
    }

    pub fn get_stats(&self) -> std::collections::HashMap<String, (f64, f64, usize)> {
        // Returns (average, max, sample_count) for each operation
        let mut stats = std::collections::HashMap::new();
        
        for (operation, times) in &self.operation_times {
            if !times.is_empty() {
                let avg = times.iter().sum::<f64>() / times.len() as f64;
                let max = times.iter().fold(0.0f64, |a, &b| a.max(b));
                stats.insert(operation.clone(), (avg, max, times.len()));
            }
        }
        
        stats
    }
}

/// Memory usage tracker
pub struct MemoryTracker {
    allocations: std::collections::HashMap<String, usize>,
}

impl MemoryTracker {
    pub fn new() -> Self {
        MemoryTracker {
            allocations: std::collections::HashMap::new(),
        }
    }

    pub fn track_allocation(&mut self, category: &str, size: usize) {
        *self.allocations.entry(category.to_string()).or_insert(0) += size;
    }

    pub fn track_deallocation(&mut self, category: &str, size: usize) {
        if let Some(current) = self.allocations.get_mut(category) {
            *current = current.saturating_sub(size);
        }
    }

    pub fn get_total_usage(&self) -> usize {
        self.allocations.values().sum()
    }

    pub fn get_usage_by_category(&self) -> &std::collections::HashMap<String, usize> {
        &self.allocations
    }
}
