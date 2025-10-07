use serde_json;
use std::sync::{Mutex, MutexGuard, Arc};
use crate::types::*;

/// Paper management module
pub struct PaperManager {
    papers: Arc<Mutex<Vec<A4Paper>>>,
}

impl PaperManager {
    pub fn new() -> Self {
        Self {
            papers: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn new_with_data(papers: Arc<Mutex<Vec<A4Paper>>>) -> Self {
        Self { papers }
    }

    /// สร้าง A4 paper ใหม่ (backward compatibility)
    pub fn create_a4_paper(&self, x: f64, y: f64) -> String {
        self.create_paper("a4-paper", "A4", "Portrait", x, y)
    }

    /// สร้าง paper ใหม่ด้วยขนาดและทิศทางที่กำหนด
    pub fn create_paper(&self, id: &str, size: &str, orientation: &str, x: f64, y: f64) -> String {
        let mut papers = self.papers.lock().unwrap();
        
        // Parse size and orientation
        let paper_size = match size.to_uppercase().as_str() {
            "A4" => PaperSize::A4,
            "A5" => PaperSize::A5,
            _ => PaperSize::A4
        };
        
        let paper_orientation = match orientation.to_lowercase().as_str() {
            "portrait" => PaperOrientation::Portrait,
            "landscape" => PaperOrientation::Landscape,
            _ => PaperOrientation::Portrait
        };
        
        let paper_id = format!("{}-{}", id, papers.len());
        let paper = Paper::new(paper_id.clone(), paper_size, paper_orientation, x, y);
        
        papers.push(paper.clone());
        
        serde_json::to_string(&paper).unwrap_or_else(|_| "{}".to_string())
    }

    /// ได้ papers ทั้งหมด
    pub fn get_a4_papers(&self) -> String {
        let papers = self.papers.lock().unwrap();
        serde_json::to_string(&*papers).unwrap_or_else(|_| "[]".to_string())
    }

    /// ลบ paper ตาม ID
    pub fn remove_paper(&self, paper_id: &str) -> bool {
        let mut papers = self.papers.lock().unwrap();
        let initial_len = papers.len();
        papers.retain(|paper| paper.id != paper_id);
        
        papers.len() < initial_len
    }

    /// อัปเดตตำแหน่ง paper
    pub fn update_paper_position(&self, paper_id: &str, x: f64, y: f64) -> bool {
        let mut papers = self.papers.lock().unwrap();
        
        if let Some(paper) = papers.iter_mut().find(|p| p.id == paper_id) {
            paper.update_position(x, y);
            true
        } else {
            false
        }
    }

    /// นับจำนวน papers
    pub fn get_paper_count(&self) -> usize {
        let papers = self.papers.lock().unwrap();
        papers.len()
    }

    /// ค้นหา paper ตาม ID
    pub fn get_paper_by_id(&self, paper_id: &str) -> String {
        let papers = self.papers.lock().unwrap();
        
        if let Some(paper) = papers.iter().find(|p| p.id == paper_id) {
            serde_json::to_string(paper).unwrap_or_else(|_| "{}".to_string())
        } else {
            "{}".to_string()
        }
    }

    /// ตั้งค่า viewport size (minimal implementation)
    pub fn set_viewport_size(&self, _width: f64, _height: f64) {
        // Minimal implementation
    }

    /// Fit A4 papers ให้พอดี viewport (minimal implementation)
    pub fn fit_to_viewport(&self, _margin_percent: f64) {
        // Minimal implementation
    }

    /// ตรวจสอบว่า element อยู่ในขอบเขตของ paper หรือไม่
    pub fn is_element_in_paper(&self, element: &Element, paper: &A4Paper) -> bool {
        let element_right = element.x + element.width;
        let element_bottom = element.y + element.height;
        let paper_right = paper.x + paper.width;
        let paper_bottom = paper.y + paper.height;
        
        // Element overlaps with paper if it's within the paper boundaries
        element.x < paper_right && element_right > paper.x &&
        element.y < paper_bottom && element_bottom > paper.y
    }

    /// ได้ papers reference สำหรับ export
    pub fn get_papers_ref(&self) -> MutexGuard<Vec<A4Paper>> {
        self.papers.lock().unwrap()
    }

    /// Clear all papers
    pub fn clear(&self) {
        let mut papers = self.papers.lock().unwrap();
        papers.clear();
    }
}
