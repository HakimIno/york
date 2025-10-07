use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use serde_json;
use serde::{Serialize, Deserialize};
use crate::types::*;

/// Spatial grid cell containing element IDs
#[derive(Debug, Clone)]
pub struct GridCell {
    pub elements: HashSet<String>,
}

impl GridCell {
    pub fn new() -> Self {
        Self {
            elements: HashSet::new(),
        }
    }
}

/// Spatial grid for fast element queries
#[derive(Debug)]
pub struct SpatialGrid {
    pub cell_size: f64,
    pub width: f64,
    pub height: f64,
    pub cols: usize,
    pub rows: usize,
    pub cells: Vec<Vec<GridCell>>,
    pub bounds: (f64, f64, f64, f64), // (x, y, width, height)
}

impl SpatialGrid {
    pub fn new(bounds: (f64, f64, f64, f64), cell_size: f64) -> Self {
        let (x, y, width, height) = bounds;
        let cols = (width / cell_size).ceil() as usize;
        let rows = (height / cell_size).ceil() as usize;
        
        let mut cells = Vec::with_capacity(rows);
        for _ in 0..rows {
            let mut row = Vec::with_capacity(cols);
            for _ in 0..cols {
                row.push(GridCell::new());
            }
            cells.push(row);
        }
        
        Self {
            cell_size,
            width,
            height,
            cols,
            rows,
            cells,
            bounds: (x, y, width, height),
        }
    }
    
    /// Get grid cell coordinates for a point
    pub fn get_cell_coords(&self, x: f64, y: f64) -> Option<(usize, usize)> {
        let (bounds_x, bounds_y, _, _) = self.bounds;
        let col = ((x - bounds_x) / self.cell_size).floor() as usize;
        let row = ((y - bounds_y) / self.cell_size).floor() as usize;
        
        if row < self.rows && col < self.cols {
            Some((row, col))
        } else {
            None
        }
    }
    
    /// Get all cells that intersect with a bounding box
    pub fn get_intersecting_cells(&self, x: f64, y: f64, width: f64, height: f64) -> Vec<(usize, usize)> {
        let mut cells = Vec::new();
        let (bounds_x, bounds_y, _, _) = self.bounds;
        
        let start_col = ((x - bounds_x) / self.cell_size).floor() as usize;
        let end_col = ((x + width - bounds_x) / self.cell_size).ceil() as usize;
        let start_row = ((y - bounds_y) / self.cell_size).floor() as usize;
        let end_row = ((y + height - bounds_y) / self.cell_size).ceil() as usize;
        
        for row in start_row..end_row.min(self.rows) {
            for col in start_col..end_col.min(self.cols) {
                cells.push((row, col));
            }
        }
        
        cells
    }
    
    /// Add element to grid
    pub fn add_element(&mut self, element_id: &str, x: f64, y: f64, width: f64, height: f64) {
        let cells = self.get_intersecting_cells(x, y, width, height);
        for (row, col) in cells {
            self.cells[row][col].elements.insert(element_id.to_string());
        }
    }
    
    /// Remove element from grid
    pub fn remove_element(&mut self, element_id: &str) {
        for row in &mut self.cells {
            for cell in row {
                cell.elements.remove(element_id);
            }
        }
    }
    
    /// Update element in grid
    pub fn update_element(&mut self, element_id: &str, old_x: f64, old_y: f64, old_width: f64, old_height: f64, new_x: f64, new_y: f64, new_width: f64, new_height: f64) {
        // Remove from old cells
        let old_cells = self.get_intersecting_cells(old_x, old_y, old_width, old_height);
        for (row, col) in old_cells {
            self.cells[row][col].elements.remove(element_id);
        }
        
        // Add to new cells
        self.add_element(element_id, new_x, new_y, new_width, new_height);
    }
}

/// Spatial index statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpatialIndexStats {
    pub total_elements: usize,
    pub total_cells: usize,
    pub occupied_cells: usize,
    pub average_elements_per_cell: f64,
    pub max_elements_per_cell: usize,
    pub memory_usage_bytes: usize,
    pub last_query_time_ms: f64,
}

/// Spatial index manager for fast element queries
pub struct SpatialIndexManager {
    grid: Mutex<SpatialGrid>,
    element_map: Mutex<HashMap<String, Element>>,
    stats: Mutex<SpatialIndexStats>,
}

impl SpatialIndexManager {
    pub fn new(bounds: (f64, f64, f64, f64), cell_size: f64) -> Self {
        let grid = SpatialGrid::new(bounds, cell_size);
        let total_cells = grid.rows * grid.cols;
        
        Self {
            grid: Mutex::new(grid),
            element_map: Mutex::new(HashMap::new()),
            stats: Mutex::new(SpatialIndexStats {
                total_elements: 0,
                total_cells,
                occupied_cells: 0,
                average_elements_per_cell: 0.0,
                max_elements_per_cell: 0,
                memory_usage_bytes: total_cells * 8, // Rough estimate
                last_query_time_ms: 0.0,
            }),
        }
    }
    
    /// Add element to spatial index
    pub fn add_element(&self, element: &Element) -> bool {
        let mut grid = self.grid.lock().unwrap();
        let mut element_map = self.element_map.lock().unwrap();
        
        grid.add_element(&element.id, element.x, element.y, element.width, element.height);
        element_map.insert(element.id.clone(), element.clone());
        
        self.update_stats();
        true
    }
    
    /// Remove element from spatial index
    pub fn remove_element(&self, element_id: &str) -> bool {
        let mut grid = self.grid.lock().unwrap();
        let mut element_map = self.element_map.lock().unwrap();
        
        grid.remove_element(element_id);
        element_map.remove(element_id);
        
        self.update_stats();
        true
    }
    
    /// Update element in spatial index
    pub fn update_element(&self, element_id: &str, new_element: &Element) -> bool {
        let mut grid = self.grid.lock().unwrap();
        let mut element_map = self.element_map.lock().unwrap();
        
        if let Some(old_element) = element_map.get(element_id) {
            grid.update_element(
                element_id,
                old_element.x, old_element.y, old_element.width, old_element.height,
                new_element.x, new_element.y, new_element.width, new_element.height
            );
            element_map.insert(element_id.to_string(), new_element.clone());
            self.update_stats();
            true
        } else {
            false
        }
    }
    
    /// Query elements in region
    pub fn query_region(&self, x: f64, y: f64, width: f64, height: f64) -> String {
        let start_time = std::time::Instant::now();
        
        let grid = self.grid.lock().unwrap();
        let element_map = self.element_map.lock().unwrap();
        
        let cells = grid.get_intersecting_cells(x, y, width, height);
        let mut result_elements = Vec::new();
        let mut seen_ids = HashSet::new();
        
        for (row, col) in cells {
            let cell = &grid.cells[row][col];
            for element_id in &cell.elements {
                if seen_ids.contains(element_id) {
                    continue;
                }
                
                if let Some(element) = element_map.get(element_id) {
                    // Check if element actually intersects with query region
                    if self.elements_intersect(
                        element.x, element.y, element.width, element.height,
                        x, y, width, height
                    ) {
                        result_elements.push(element.clone());
                        seen_ids.insert(element_id.clone());
                    }
                }
            }
        }
        
        let query_time = start_time.elapsed().as_secs_f64() * 1000.0;
        self.update_query_time(query_time);
        
        serde_json::to_string(&result_elements).unwrap_or_else(|_| "[]".to_string())
    }
    
    /// Find elements at point
    pub fn find_at_point(&self, x: f64, y: f64) -> String {
        let grid = self.grid.lock().unwrap();
        let element_map = self.element_map.lock().unwrap();
        
        if let Some((row, col)) = grid.get_cell_coords(x, y) {
            let cell = &grid.cells[row][col];
            let mut result_elements = Vec::new();
            
            for element_id in &cell.elements {
                if let Some(element) = element_map.get(element_id) {
                    if self.point_in_element(x, y, element.x, element.y, element.width, element.height) {
                        result_elements.push(element.clone());
                    }
                }
            }
            
            serde_json::to_string(&result_elements).unwrap_or_else(|_| "[]".to_string())
        } else {
            "[]".to_string()
        }
    }
    
    /// Find nearest element to point
    pub fn find_nearest(&self, x: f64, y: f64, max_distance: f64) -> String {
        let grid = self.grid.lock().unwrap();
        let element_map = self.element_map.lock().unwrap();
        
        let start_cell = grid.get_cell_coords(x, y);
        if start_cell.is_none() {
            return "null".to_string();
        }
        
        let (start_row, start_col) = start_cell.unwrap();
        let max_radius = (max_distance / grid.cell_size).ceil() as usize;
        
        let mut nearest_element: Option<Element> = None;
        let mut min_distance = max_distance;
        
        // Search in expanding radius
        for radius in 0..=max_radius {
            for row_offset in -(radius as isize)..=(radius as isize) {
                for col_offset in -(radius as isize)..=(radius as isize) {
                    // Skip if not on current radius
                    if row_offset.abs().max(col_offset.abs()) != radius as isize {
                        continue;
                    }
                    
                    let row = (start_row as isize + row_offset) as usize;
                    let col = (start_col as isize + col_offset) as usize;
                    
                    if row >= grid.rows || col >= grid.cols {
                        continue;
                    }
                    
                    let cell = &grid.cells[row][col];
                    for element_id in &cell.elements {
                        if let Some(element) = element_map.get(element_id) {
                            let distance = self.distance_to_element(x, y, element);
                            if distance < min_distance {
                                min_distance = distance;
                                nearest_element = Some(element.clone());
                            }
                        }
                    }
                }
            }
            
            // If we found an element within current radius, we can stop
            if nearest_element.is_some() && min_distance <= radius as f64 * grid.cell_size {
                break;
            }
        }
        
        if let Some(element) = nearest_element {
            serde_json::to_string(&element).unwrap_or_else(|_| "null".to_string())
        } else {
            "null".to_string()
        }
    }
    
    /// Detect collisions for an element
    pub fn detect_collisions(&self, element: &Element) -> String {
        let grid = self.grid.lock().unwrap();
        let element_map = self.element_map.lock().unwrap();
        
        let cells = grid.get_intersecting_cells(element.x, element.y, element.width, element.height);
        let mut collisions = Vec::new();
        
        for (row, col) in cells {
            let cell = &grid.cells[row][col];
            for element_id in &cell.elements {
                if element_id == &element.id {
                    continue;
                }
                
                if let Some(other_element) = element_map.get(element_id) {
                    if self.elements_intersect(
                        element.x, element.y, element.width, element.height,
                        other_element.x, other_element.y, other_element.width, other_element.height
                    ) {
                        collisions.push(other_element.clone());
                    }
                }
            }
        }
        
        serde_json::to_string(&collisions).unwrap_or_else(|_| "[]".to_string())
    }
    
    /// Get spatial index statistics
    pub fn get_stats(&self) -> String {
        let stats = self.stats.lock().unwrap();
        serde_json::to_string(&*stats).unwrap_or_else(|_| "{}".to_string())
    }
    
    /// Rebuild spatial index with new elements and dynamic optimization
    pub fn rebuild(&self, elements: &[Element], bounds: (f64, f64, f64, f64), cell_size: f64) {
        let mut grid = self.grid.lock().unwrap();
        let mut element_map = self.element_map.lock().unwrap();
        
        // Calculate optimal cell size if not provided
        let final_cell_size = if cell_size <= 0.0 {
            self.calculate_optimal_cell_size(elements, bounds)
        } else {
            cell_size
        };
        
        // Create new grid with optimized cell size
        *grid = SpatialGrid::new(bounds, final_cell_size);
        element_map.clear();
        
        // Add all elements
        for element in elements {
            grid.add_element(&element.id, element.x, element.y, element.width, element.height);
            element_map.insert(element.id.clone(), element.clone());
        }
        
        self.update_stats();
    }
    
    /// Calculate optimal cell size based on element density
    fn calculate_optimal_cell_size(&self, elements: &[Element], bounds: (f64, f64, f64, f64)) -> f64 {
        if elements.is_empty() {
            return 100.0; // Default cell size
        }
        
        let (_, _, width, height) = bounds;
        let element_count = elements.len() as f64;
        
        // Calculate average element area
        let total_element_area: f64 = elements.iter()
            .map(|e| e.width * e.height)
            .sum();
        let avg_element_area = total_element_area / element_count;
        
        // Target: 5-20 elements per cell for optimal performance
        let target_elements_per_cell = 10.0;
        let target_cell_area = avg_element_area * target_elements_per_cell;
        let optimal_cell_size = target_cell_area.sqrt();
        
        // Clamp between reasonable bounds
        optimal_cell_size.max(50.0).min(500.0)
    }
    
    /// Auto-optimize spatial index based on current performance
    pub fn auto_optimize(&self) -> bool {
        let stats_json = self.get_stats();
        if let Ok(stats) = serde_json::from_str::<SpatialIndexStats>(&stats_json) {
            // Only optimize if really needed and we have enough elements
            if stats.total_elements > 1000 && 
               (stats.average_elements_per_cell > 100.0 || stats.max_elements_per_cell > 200) {
                // Get current elements
                let element_map = self.element_map.lock().unwrap();
                let elements: Vec<Element> = element_map.values().cloned().collect();
                drop(element_map);
                
                // Rebuild with optimized cell size
                let bounds = (0.0, 0.0, 2000.0, 2000.0); // Default bounds
                self.rebuild(&elements, bounds, 0.0); // 0.0 will trigger auto-calculation
                return true;
            }
        }
        
        false
    }
    
    /// Update grid bounds
    pub fn update_bounds(&self, bounds: (f64, f64, f64, f64)) {
        let elements: Vec<Element> = {
            let element_map = self.element_map.lock().unwrap();
            element_map.values().cloned().collect()
        };
        
        let grid = self.grid.lock().unwrap();
        let cell_size = grid.cell_size;
        drop(grid);
        
        self.rebuild(&elements, bounds, cell_size);
    }
    
    // Helper methods
    
    fn elements_intersect(&self, x1: f64, y1: f64, w1: f64, h1: f64, x2: f64, y2: f64, w2: f64, h2: f64) -> bool {
        x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
    }
    
    fn point_in_element(&self, px: f64, py: f64, ex: f64, ey: f64, ew: f64, eh: f64) -> bool {
        px >= ex && px <= ex + ew && py >= ey && py <= ey + eh
    }
    
    fn distance_to_element(&self, px: f64, py: f64, element: &Element) -> f64 {
        let dx = (px - element.x).max(0.0).max(element.x + element.width - px);
        let dy = (py - element.y).max(0.0).max(element.y + element.height - py);
        (dx * dx + dy * dy).sqrt()
    }
    
    fn update_stats(&self) {
        let grid = self.grid.lock().unwrap();
        let element_map = self.element_map.lock().unwrap();
        let mut stats = self.stats.lock().unwrap();
        
        let mut occupied_cells = 0;
        let mut total_elements_in_cells = 0;
        let mut max_elements_per_cell = 0;
        
        for row in &grid.cells {
            for cell in row {
                let element_count = cell.elements.len();
                if element_count > 0 {
                    occupied_cells += 1;
                    total_elements_in_cells += element_count;
                    max_elements_per_cell = max_elements_per_cell.max(element_count);
                }
            }
        }
        
        stats.total_elements = element_map.len();
        stats.total_cells = grid.rows * grid.cols;
        stats.occupied_cells = occupied_cells;
        stats.average_elements_per_cell = if occupied_cells > 0 {
            total_elements_in_cells as f64 / occupied_cells as f64
        } else {
            0.0
        };
        stats.max_elements_per_cell = max_elements_per_cell;
        stats.memory_usage_bytes = grid.rows * grid.cols * 8; // Rough estimate
    }
    
    fn update_query_time(&self, time_ms: f64) {
        let mut stats = self.stats.lock().unwrap();
        stats.last_query_time_ms = time_ms;
    }
}
