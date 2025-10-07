// Performance monitoring utilities for StylePanel
export class StylePanelPerformanceMonitor {
  private static instance: StylePanelPerformanceMonitor;
  private renderTimes: number[] = [];
  private updateTimes: number[] = [];

  static getInstance(): StylePanelPerformanceMonitor {
    if (!StylePanelPerformanceMonitor.instance) {
      StylePanelPerformanceMonitor.instance = new StylePanelPerformanceMonitor();
    }
    return StylePanelPerformanceMonitor.instance;
  }

  startRenderMeasure(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.renderTimes.push(renderTime);
      
      if (renderTime > 16) { // Longer than 1 frame (16ms)
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (>16ms)`);
      }
      
      // Keep only last 100 measurements
      if (this.renderTimes.length > 100) {
        this.renderTimes.shift();
      }
    };
  }

  startUpdateMeasure(updateType: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      this.updateTimes.push(updateTime);
      
      if (updateTime > 5) { // Longer than 5ms
        console.warn(`${updateType} update took ${updateTime.toFixed(2)}ms (>5ms)`);
      }
      
      // Keep only last 100 measurements
      if (this.updateTimes.length > 100) {
        this.updateTimes.shift();
      }
    };
  }

  getStats() {
    const avgRenderTime = this.renderTimes.length > 0 
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length 
      : 0;
    
    const avgUpdateTime = this.updateTimes.length > 0 
      ? this.updateTimes.reduce((a, b) => a + b, 0) / this.updateTimes.length 
      : 0;

    const maxRenderTime = this.renderTimes.length > 0 
      ? Math.max(...this.renderTimes) 
      : 0;
    
    const maxUpdateTime = this.updateTimes.length > 0 
      ? Math.max(...this.updateTimes) 
      : 0;

    return {
      averageRenderTime: Number(avgRenderTime.toFixed(2)),
      averageUpdateTime: Number(avgUpdateTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      maxUpdateTime: Number(maxUpdateTime.toFixed(2)),
      totalMeasurements: this.renderTimes.length + this.updateTimes.length,
    };
  }

  logStats() {
    const stats = this.getStats();
    console.group('StylePanel Performance Stats');
    console.log('Average Render Time:', stats.averageRenderTime + 'ms');
    console.log('Average Update Time:', stats.averageUpdateTime + 'ms');
    console.log('Max Render Time:', stats.maxRenderTime + 'ms');
    console.log('Max Update Time:', stats.maxUpdateTime + 'ms');
    console.log('Total Measurements:', stats.totalMeasurements);
    console.groupEnd();
  }

  reset() {
    this.renderTimes = [];
    this.updateTimes = [];
  }
}

export const performanceMonitor = StylePanelPerformanceMonitor.getInstance();

// Hook for easy performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const startRender = () => performanceMonitor.startRenderMeasure(componentName);
  const startUpdate = (updateType: string) => performanceMonitor.startUpdateMeasure(updateType);
  
  return { startRender, startUpdate };
};
