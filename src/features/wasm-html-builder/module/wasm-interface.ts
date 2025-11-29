// TypeScript interface สำหรับ HTML Builder WASM Core
import init, { HTMLBuilderEngine } from './pkg/html_builder_core';
import { PaperConfig } from '../types/paper';

// Types for better type safety
export interface FillStyle {
  color: string;
  opacity: number;
  enabled: boolean;
}

export interface StrokeStyle {
  color: string;
  opacity: number;
  width: number;
  position: 'inside' | 'outside' | 'center';
  style: 'solid' | 'dashed' | 'dotted';
  enabled: boolean;
}

export interface ElementStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  padding: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  // Shape-specific styles
  fill?: FillStyle;
  stroke?: StrokeStyle;
}

export interface TableCell {
  id: string;
  content: string;
  rowSpan: number;
  colSpan: number;
  style: ElementStyle;
}

export interface TableRow {
  id: string;
  cells: TableCell[];
  height: number;
}

export interface TableData {
  rows: TableRow[];
  columns: number;
  headerRows: number;
  footerRows: number;
  columnWidths: number[];
  borderCollapse: boolean;
  tableStyle: ElementStyle;
}

export interface Element {
  id: string;
  componentId: string;
  elementType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  visible: boolean;
  content: string;
  style: ElementStyle;
  tableData?: TableData; // For table elements
}

export interface A4Paper {
  id: string;
  size: 'A4' | 'A5';
  orientation: 'Portrait' | 'Landscape';
  x: number;
  y: number;
  width: number;
  height: number;
  title: string | null;
}

export interface Point {
  x: number;
  y: number;
}

export interface DragUpdateResult {
  element_id: string;
  new_position: Point;
  is_valid: boolean;
  collisions: string[];
}

export interface CollisionResult {
  element_id: string;
  colliding_elements: string[];
  is_out_of_bounds: boolean;
}

export interface PerformanceStats {
  spatial: {
    total_elements: number;
    visible_elements: number;
    memory_usage_bytes: number;
  };
  transform: {
    zoom: number;
    pan_x: number;
    pan_y: number;
    viewport_width: number;
    viewport_height: number;
    is_cache_valid: boolean;
  };
  operations: Record<string, [number, number, number]>; // [avg, max, count]
  memory_usage_bytes: number;
  timestamp: number;
}

export interface ExportOptions {
  include_responsive: boolean;
  minify_css: boolean;
  include_bootstrap: boolean;
  include_tailwind: boolean;
  css_framework: 'None' | 'Bootstrap' | 'Tailwind' | { Custom: string };
  export_format: 'Html' | 'React' | 'Vue' | 'Angular';
}

// Spatial Indexing interfaces
export interface SpatialIndexStats {
  total_elements: number;
  total_cells: number;
  occupied_cells: number;
  average_elements_per_cell: number;
  max_elements_per_cell: number;
  memory_usage_bytes: number;
  last_query_time_ms: number;
}

export interface SpatialQuery {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportResult {
  html: string;
  css: string;
  js?: string;
  metadata: {
    total_elements: number;
    total_pages: number;
    css_classes_count: number;
    export_timestamp: number;
    framework_used: string;
  };
}

export interface PositionUpdate {
  element_id: string;
  x: number;
  y: number;
}

export interface WasmEngineState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  engine: HtmlBuilderWasm | null;
}

// High-level TypeScript wrapper for WASM engine
export class HtmlBuilderWasm {
  private engine: HTMLBuilderEngine | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  constructor() { }

  // Initialize WASM module
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this._doInitialize();

    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('Initializing WASM module...');
      await init();
      console.log('WASM module loaded, creating engine...');

      // Add a small delay to ensure WASM is fully ready
      await new Promise(resolve => setTimeout(resolve, 50));

      this.engine = new HTMLBuilderEngine();
      this.isInitialized = true;
      console.log('HTML Builder WASM initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WASM:', error);
      this.isInitialized = false;
      this.engine = null;
      throw error;
    }
  }

  // Ensure engine is initialized
  private ensureInitialized(): HTMLBuilderEngine {
    if (!this.isInitialized || !this.engine) {
      throw new Error('WASM engine not initialized. Call initialize() first.');
    }
    return this.engine;
  }

  // A4 Paper Management
  createA4Paper(x: number, y: number): A4Paper {
    const engine = this.ensureInitialized();
    const result = engine.create_a4_paper(x, y);
    return JSON.parse(result) as A4Paper;
  }

  getA4Papers(): A4Paper[] {
    const engine = this.ensureInitialized();
    const result = engine.get_a4_papers();
    return JSON.parse(result) as A4Paper[];
  }

  // Enhanced Paper Management
  createPaper(id: string, size: string, orientation: string, x: number, y: number): A4Paper {
    const engine = this.ensureInitialized();
    const result = engine.create_paper(id, size, orientation, x, y);
    return JSON.parse(result) as A4Paper;
  }

  removePaper(paperId: string): boolean {
    const engine = this.ensureInitialized();
    try {
      return engine.remove_paper(paperId);
    } catch (error) {
      console.error('Error removing paper:', error);
      return false;
    }
  }

  updatePaperPosition(paperId: string, x: number, y: number): boolean {
    const engine = this.ensureInitialized();
    try {
      return engine.update_paper_position(paperId, x, y);
    } catch (error) {
      console.error('Error updating paper position:', error);
      return false;
    }
  }

  getPaperCount(): number {
    const engine = this.ensureInitialized();
    try {
      return engine.get_paper_count();
    } catch (error) {
      console.error('Error getting paper count:', error);
      return 0;
    }
  }

  getPaperById(paperId: string): A4Paper | null {
    const engine = this.ensureInitialized();
    try {
      const result = engine.get_paper_by_id(paperId);
      return result === "{}" ? null : JSON.parse(result) as A4Paper;
    } catch (error) {
      console.error('Error getting paper by ID:', error);
      return null;
    }
  }

  // Viewport Management
  setViewportSize(width: number, height: number): void {
    const engine = this.ensureInitialized();
    engine.set_viewport_size(width, height);
  }

  fitToViewport(marginPercent: number = 10): void {
    const engine = this.ensureInitialized();
    engine.fit_to_viewport(marginPercent);
  }

  // Element Management
  createElement(componentType: string, x: number, y: number): Element {
    const engine = this.ensureInitialized();
    const result = engine.create_element(componentType, x, y);
    return JSON.parse(result) as Element;
  }

  updateElementPosition(elementId: string, x: number, y: number): boolean {
    const engine = this.ensureInitialized();
    return engine.update_element_position(elementId, x, y);
  }

  updateElementSize(elementId: string, width: number, height: number): boolean {
    const engine = this.ensureInitialized();
    return engine.update_element_size(elementId, width, height);
  }

  updateElementContent(elementId: string, content: string): boolean {
    const engine = this.ensureInitialized();
    return engine.update_element_content(elementId, content);
  }

  updateElementStyle(elementId: string, style: Partial<ElementStyle>): boolean {
    const engine = this.ensureInitialized();
    return engine.update_element_style(elementId, JSON.stringify(style));
  }

  deleteElement(elementId: string): boolean {
    const engine = this.ensureInitialized();
    return engine.delete_element(elementId);
  }

  getElement(elementId: string): Element | null {
    const engine = this.ensureInitialized();
    const result = engine.get_element(elementId);
    return result === 'null' ? null : (JSON.parse(result) as Element);
  }

  getAllElements(): Element[] {
    const engine = this.ensureInitialized();
    const result = engine.get_all_elements();
    return JSON.parse(result) as Element[];
  }

  getElementCount(): number {
    const engine = this.ensureInitialized();
    return engine.get_element_count();
  }

  // Drag Operations
  startDrag(elementId: string, mouseX: number, mouseY: number): boolean {
    const engine = this.ensureInitialized();
    return engine.start_drag(elementId, mouseX, mouseY);
  }

  updateDrag(
    mouseX: number,
    mouseY: number,
    zoom: number,
    panX: number,
    panY: number
  ): DragUpdateResult | null {
    const engine = this.ensureInitialized();
    const result = engine.update_drag(mouseX, mouseY, zoom, panX, panY);
    try {
      const parsed = JSON.parse(result);
      return parsed.is_valid ? (parsed as DragUpdateResult) : null;
    } catch (error) {
      console.error('Failed to parse drag result:', result, error);
      return null;
    }
  }

  endDrag(): boolean {
    const engine = this.ensureInitialized();
    return engine.end_drag();
  }

  // Transform Operations
  screenToCanvas(screenX: number, screenY: number): Point {
    const engine = this.ensureInitialized();
    const result = engine.screen_to_canvas(screenX, screenY);
    return JSON.parse(result) as Point;
  }

  canvasToScreen(canvasX: number, canvasY: number): Point {
    const engine = this.ensureInitialized();
    const result = engine.canvas_to_screen(canvasX, canvasY);
    return JSON.parse(result) as Point;
  }

  setTransform(
    zoom: number,
    panX: number,
    panY: number
  ): { zoom: number; pan_x: number; pan_y: number } {
    const engine = this.ensureInitialized();
    const result = engine.set_transform(zoom, panX, panY);
    return JSON.parse(result);
  }

  zoomToPoint(screenX: number, screenY: number, zoomDelta: number): number {
    if (!this.isInitialized || !this.engine) {
      console.warn('WASM engine not initialized, cannot zoom to point');
      return 1.0;
    }
    try {
      return this.engine.zoom_to_point(screenX, screenY, zoomDelta);
    } catch (error) {
      console.warn('Error in zoomToPoint:', error);
      return 1.0;
    }
  }

  getZoom(): number {
    if (!this.isInitialized || !this.engine) {
      console.warn('WASM engine not initialized, returning default zoom');
      return 1.0;
    }
    try {
      return this.engine.get_zoom();
    } catch (error) {
      console.warn('Error getting zoom:', error);
      return 1.0;
    }
  }

  setZoom(zoom: number): number {
    if (!this.isInitialized || !this.engine) {
      console.warn('WASM engine not initialized, cannot set zoom');
      return 1.0;
    }
    try {
      return this.engine.set_zoom(zoom);
    } catch (error) {
      console.warn('Error setting zoom:', error);
      return 1.0;
    }
  }

  fitA4PapersToViewport(papers: PaperConfig[], marginPercent: number = 0.9): void {
    if (!this.isInitialized || !this.engine) {
      console.warn('WASM engine not initialized, cannot fit papers to viewport');
      return;
    }
    // For now, just reset zoom to 1.0
    // TODO: Implement proper fit to viewport logic
    this.setZoom(1.0);
  }

  // Collision Detection
  checkCollisions(elementId: string): CollisionResult {
    const engine = this.ensureInitialized();
    const result = engine.check_collisions(elementId);
    return JSON.parse(result) as CollisionResult;
  }

  // Spatial Queries
  getElementsInRegion(
    x: number,
    y: number,
    width: number,
    height: number
  ): { elements: Element[]; total_count: number } {
    const engine = this.ensureInitialized();
    const result = engine.get_elements_in_region(x, y, width, height);
    return JSON.parse(result);
  }

  // Batch Operations
  batchUpdatePositions(updates: PositionUpdate[]): boolean[] {
    const engine = this.ensureInitialized();
    const result = engine.batch_update_positions(JSON.stringify(updates));
    return JSON.parse(result) as boolean[];
  }

  // HTML Export
  exportHtml(options?: Partial<ExportOptions>): ExportResult {
    const engine = this.ensureInitialized();
    const defaultOptions: ExportOptions = {
      include_responsive: true,
      minify_css: false,
      include_bootstrap: false,
      include_tailwind: false,
      css_framework: 'None',
      export_format: 'Html',
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const result = engine.export_html(JSON.stringify(mergedOptions));
    return JSON.parse(result) as ExportResult;
  }

  // Performance Monitoring
  getPerformanceStats(): PerformanceStats {
    const engine = this.ensureInitialized();
    const result = engine.get_performance_stats();
    return JSON.parse(result) as PerformanceStats;
  }

  // Table-specific methods
  addTableRow(elementId: string, atIndex?: number): boolean {
    const engine = this.ensureInitialized();
    return engine.add_table_row(elementId, atIndex);
  }

  removeTableRow(elementId: string, index: number): boolean {
    const engine = this.ensureInitialized();
    return engine.remove_table_row(elementId, index);
  }

  addTableColumn(elementId: string, atIndex?: number): boolean {
    const engine = this.ensureInitialized();
    return engine.add_table_column(elementId, atIndex);
  }

  removeTableColumn(elementId: string, index: number): boolean {
    const engine = this.ensureInitialized();
    return engine.remove_table_column(elementId, index);
  }

  updateTableCell(elementId: string, row: number, col: number, content: string): boolean {
    const engine = this.ensureInitialized();
    return engine.update_table_cell(elementId, row, col, content);
  }

  updateTableCellStyle(elementId: string, row: number, col: number, style: any): boolean {
    const engine = this.ensureInitialized();
    return engine.update_table_cell_style(elementId, row, col, JSON.stringify(style));
  }

  getTableCellStyle(elementId: string, row: number, col: number): any {
    const engine = this.ensureInitialized();
    const result = engine.get_table_cell_style(elementId, row, col);
    return result === '{}' ? null : JSON.parse(result);
  }

  getTableDimensions(elementId: string): any {
    const engine = this.ensureInitialized();
    const result = engine.get_table_dimensions(elementId);
    return result === '{}' ? null : JSON.parse(result);
  }

  mergeTableCells(elementId: string, startRow: number, startCol: number, endRow: number, endCol: number): boolean {
    const engine = this.ensureInitialized();
    return engine.merge_table_cells(elementId, startRow, startCol, endRow, endCol);
  }

  getTableData(elementId: string): TableData | null {
    const engine = this.ensureInitialized();
    const result = engine.get_table_data(elementId);
    return result === 'null' ? null : (JSON.parse(result) as TableData);
  }

  updateTableColumnWidth(elementId: string, columnIndex: number, width: number): boolean {
    const engine = this.ensureInitialized();
    return engine.update_table_column_width(elementId, columnIndex, width);
  }

  updateTableRowHeight(elementId: string, rowIndex: number, height: number): boolean {
    const engine = this.ensureInitialized();
    return engine.update_table_row_height(elementId, rowIndex, height);
  }

  // Excel-like calculation functions
  calculateColumnSum(elementId: string, colIndex: number): number {
    const engine = this.ensureInitialized();
    return engine.calculate_column_sum(elementId, colIndex);
  }

  calculateRowSum(elementId: string, rowIndex: number): number {
    const engine = this.ensureInitialized();
    return engine.calculate_row_sum(elementId, rowIndex);
  }

  calculateAverage(elementId: string, startRow: number, startCol: number, endRow: number, endCol: number): number {
    const engine = this.ensureInitialized();
    return engine.calculate_average(elementId, startRow, startCol, endRow, endCol);
  }

  autoFitColumns(elementId: string): boolean {
    const engine = this.ensureInitialized();
    return engine.auto_fit_columns(elementId);
  }

  unmergeTableCells(elementId: string, row: number, col: number): boolean {
    const engine = this.ensureInitialized();
    return engine.unmerge_table_cells(elementId, row, col);
  }

  isCellMerged(elementId: string, row: number, col: number): boolean {
    const engine = this.ensureInitialized();
    return engine.is_cell_merged(elementId, row, col);
  }

  // Performance optimization methods for StylePanel
  parseFormFieldData(elementId: string): any {
    const engine = this.ensureInitialized();
    try {
      const result = engine.parse_form_field_data(elementId);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error parsing form field data:', error);
      return {
        showLabel: true,
        gap: 8,
        labelWidth: 30,
        valueWidth: 70,
        underlineStyle: 'solid'
      };
    }
  }

  calculateSafeStyle(elementId: string): ElementStyle | null {
    const engine = this.ensureInitialized();
    try {
      const result = engine.calculate_safe_style(elementId);
      return result === 'null' ? null : JSON.parse(result) as ElementStyle;
    } catch (error) {
      console.error('Error calculating safe style:', error);
      return null;
    }
  }

  getElementTypeFlags(elementId: string): { isTable: boolean; isFormField: boolean; elementType: string } {
    const engine = this.ensureInitialized();
    try {
      const result = engine.get_element_type_flags(elementId);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error getting element type flags:', error);
      return { isTable: false, isFormField: false, elementType: 'unknown' };
    }
  }

  batchUpdateFormField(elementId: string, updates: any): boolean {
    const engine = this.ensureInitialized();
    try {
      return engine.batch_update_form_field(elementId, JSON.stringify(updates));
    } catch (error) {
      console.error('Error batch updating form field:', error);
      return false;
    }
  }

  getElementForStylePanel(elementId: string): Element | null {
    const engine = this.ensureInitialized();
    try {
      const result = engine.get_element_for_style_panel(elementId);
      return result === 'null' ? null : JSON.parse(result) as Element;
    } catch (error) {
      console.error('Error getting element for style panel:', error);
      return null;
    }
  }

  validateStyleUpdate(style: Partial<ElementStyle>): Partial<ElementStyle> {
    const engine = this.ensureInitialized();
    try {
      const result = engine.validate_style_update(JSON.stringify(style));
      return JSON.parse(result);
    } catch (error) {
      console.error('Error validating style update:', error);
      return {};
    }
  }

  getElementsSummary(): { total: number; by_type: Record<string, number> } {
    const engine = this.ensureInitialized();
    try {
      const result = engine.get_elements_summary();
      return JSON.parse(result);
    } catch (error) {
      console.error('Error getting elements summary:', error);
      return { total: 0, by_type: {} };
    }
  }

  // Utility Methods
  reset(): void {
    const engine = this.ensureInitialized();
    engine.reset();
  }

  // Helper method for calculating drop position
  calculateDropPosition(
    mouseX: number,
    mouseY: number,
    elementWidth: number,
    elementHeight: number,
    zoom: number,
    panX: number,
    panY: number
  ): Point {
    // Convert screen coordinates to canvas coordinates
    const canvasPos = this.screenToCanvas(mouseX, mouseY);

    // Center the element at the mouse position
    const dropPos = {
      x: canvasPos.x - elementWidth / 2,
      y: canvasPos.y - elementHeight / 2,
    };

    // Ensure the position is within A4 papers if they exist
    const papers = this.getA4Papers();
    if (papers.length > 0) {
      // Find the nearest paper
      let nearestPaper = papers[0];
      let minDistance = Number.MAX_VALUE;

      for (const paper of papers) {
        const paperCenterX = paper.x + paper.width / 2;
        const paperCenterY = paper.y + paper.height / 2;
        const elementCenterX = dropPos.x + elementWidth / 2;
        const elementCenterY = dropPos.y + elementHeight / 2;

        const distance = Math.sqrt(
          Math.pow(paperCenterX - elementCenterX, 2) +
          Math.pow(paperCenterY - elementCenterY, 2)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestPaper = paper;
        }
      }

      // Constrain to paper bounds
      const padding = 16;
      const minX = nearestPaper.x + padding;
      const minY = nearestPaper.y + padding;
      const maxX = nearestPaper.x + nearestPaper.width - elementWidth - padding;
      const maxY =
        nearestPaper.y + nearestPaper.height - elementHeight - padding;

      dropPos.x = Math.max(minX, Math.min(dropPos.x, maxX));
      dropPos.y = Math.max(minY, Math.min(dropPos.y, maxY));
    }

    return dropPos;
  }

  // Spatial Indexing methods
  /**
   * Query elements in a region using spatial indexing
   */
  queryElementsInRegion(x: number, y: number, width: number, height: number): Element[] {
    if (!this.engine) return [];

    try {
      const result = this.engine.query_elements_in_region(x, y, width, height);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error querying elements in region:', error);
      return [];
    }
  }

  /**
   * Find elements at a specific point using spatial indexing
   */
  findElementsAtPoint(x: number, y: number): Element[] {
    if (!this.engine) return [];

    try {
      const result = this.engine.find_elements_at_point(x, y);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error finding elements at point:', error);
      return [];
    }
  }

  /**
   * Find nearest element to a point using spatial indexing
   */
  findNearestElement(x: number, y: number, maxDistance: number = 100): Element | null {
    if (!this.engine) return null;

    try {
      const result = this.engine.find_nearest_element(x, y, maxDistance);
      if (result === 'null') return null;
      return JSON.parse(result);
    } catch (error) {
      console.error('Error finding nearest element:', error);
      return null;
    }
  }

  /**
   * Detect collisions for an element using spatial indexing
   */
  detectElementCollisions(elementId: string): Element[] {
    if (!this.engine) return [];

    try {
      const result = this.engine.detect_element_collisions(elementId);
      return JSON.parse(result);
    } catch (error) {
      console.error('Error detecting element collisions:', error);
      return [];
    }
  }

  /**
   * Get spatial index statistics
   */
  getSpatialIndexStats(): SpatialIndexStats | null {
    if (!this.engine) return null;

    try {
      const result = this.engine.get_spatial_index_stats();
      return JSON.parse(result);
    } catch (error) {
      console.error('Error getting spatial index stats:', error);
      return null;
    }
  }

  /**
   * Update spatial index bounds
   */
  updateSpatialIndexBounds(x: number, y: number, width: number, height: number): void {
    if (!this.engine) return;

    try {
      this.engine.update_spatial_index_bounds(x, y, width, height);
    } catch (error) {
      console.error('Error updating spatial index bounds:', error);
    }
  }

  /**
   * Rebuild spatial index
   */
  rebuildSpatialIndex(cellSize: number = 100): void {
    if (!this.engine) return;

    try {
      this.engine.rebuild_spatial_index(cellSize);
    } catch (error) {
      console.error('Error rebuilding spatial index:', error);
    }
  }

  /**
   * Auto-optimize spatial index based on performance
   */
  autoOptimizeSpatialIndex(): boolean {
    if (!this.engine) return false;

    try {
      return this.engine.auto_optimize_spatial_index();
    } catch (error) {
      console.error('Error auto-optimizing spatial index:', error);
      return false;
    }
  }

  // Style History methods
  /**
   * Save a style to history
   */
  saveStyleToHistory(style: ElementStyle): boolean {
    if (!this.engine) return false;

    try {
      const styleJson = JSON.stringify(style);
      return this.engine.save_style_to_history(styleJson);
    } catch (error) {
      console.error('Error saving style to history:', error);
      return false;
    }
  }

  /**
   * Get recent styles from history
   */
  getStyleHistory(count: number = 10): ElementStyle[] {
    if (!this.engine) return [];

    try {
      const result = this.engine.get_style_history(count);
      return JSON.parse(result) as ElementStyle[];
    } catch (error) {
      console.error('Error getting style history:', error);
      return [];
    }
  }

  /**
   * Get the last style from history
   */
  getLastStyle(): ElementStyle | null {
    if (!this.engine) return null;

    try {
      const result = this.engine.get_last_style();
      if (result === 'null') return null;
      return JSON.parse(result) as ElementStyle;
    } catch (error) {
      console.error('Error getting last style:', error);
      return null;
    }
  }

  /**
   * Clear all style history
   */
  clearStyleHistory(): void {
    if (!this.engine) return;

    try {
      this.engine.clear_style_history();
    } catch (error) {
      console.error('Error clearing style history:', error);
    }
  }

  /**
   * Export style history as compressed base64 string
   */
  exportStyleHistory(): string {
    if (!this.engine) return '';

    try {
      return this.engine.export_style_history();
    } catch (error) {
      console.error('Error exporting style history:', error);
      return '';
    }
  }

  /**
   * Import style history from compressed base64 string
   */
  importStyleHistory(data: string): boolean {
    if (!this.engine) return false;

    try {
      return this.engine.import_style_history(data);
    } catch (error) {
      console.error('Error importing style history:', error);
      return false;
    }
  }

  /**
   * Get style history count
   */
  getStyleHistoryCount(): number {
    if (!this.engine) return 0;

    try {
      return this.engine.get_style_history_count();
    } catch (error) {
      console.error('Error getting style history count:', error);
      return 0;
    }
  }

  // Cleanup
  dispose(): void {
    if (this.engine) {
      // WASM cleanup would go here if needed
      this.engine = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
let wasmInstance: HtmlBuilderWasm | null = null;

export const getWasmInstance = async (): Promise<HtmlBuilderWasm> => {
  if (!wasmInstance) {
    wasmInstance = new HtmlBuilderWasm();
    await wasmInstance.initialize();
  }
  return wasmInstance;
};

// Export default instance
export default HtmlBuilderWasm;
