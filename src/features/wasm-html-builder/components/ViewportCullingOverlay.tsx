import React from 'react';
import { ViewportCullingMetrics } from '../utils/viewportUtils';

interface ViewportCullingOverlayProps {
  metrics: ViewportCullingMetrics;
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

const ViewportCullingOverlay: React.FC<ViewportCullingOverlayProps> = ({
  metrics,
  isVisible = true,
  position = 'top-right',
  compact = false,
}) => {
  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getEfficiencyColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPerformanceColor = (timeMs: number) => {
    if (timeMs <= 1) return 'text-green-400';
    if (timeMs <= 5) return 'text-yellow-400';
    if (timeMs <= 10) return 'text-orange-400';
    return 'text-red-400';
  };

  if (compact) {
    return (
      <div className={`absolute ${getPositionClasses()} z-50`}>
        <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
          <div className="text-green-400 font-bold">VC</div>
          <div>{metrics.visibleElements}/{metrics.totalElements}</div>
          <div className={getEfficiencyColor(metrics.cullingPercentage)}>
            {metrics.cullingPercentage.toFixed(0)}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute ${getPositionClasses()} z-50`}>
      <div className="bg-black/90 text-white p-3 rounded-lg text-xs font-mono min-w-[200px]">
        <div className="text-green-400 font-bold mb-2 flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          VIEWPORT CULLING
        </div>
        
        <div className="space-y-2">
          {/* Element Counts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="text-white">{metrics.totalElements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Visible:</span>
              <span className="text-blue-400">{metrics.visibleElements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Culled:</span>
              <span className="text-red-400">{metrics.culledElements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Efficiency:</span>
              <span className={getEfficiencyColor(metrics.cullingPercentage)}>
                {metrics.cullingPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Visibility:</span>
              <span className="text-cyan-400">
                {metrics.averageVisibilityPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Processing:</span>
              <span className={getPerformanceColor(metrics.processingTimeMs)}>
                {metrics.processingTimeMs.toFixed(2)}ms
              </span>
            </div>
          </div>

          {/* Performance Bar */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Performance</span>
              <span className={getPerformanceColor(metrics.processingTimeMs)}>
                {metrics.processingTimeMs.toFixed(1)}ms
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  metrics.processingTimeMs <= 1 ? 'bg-green-400' :
                  metrics.processingTimeMs <= 5 ? 'bg-yellow-400' :
                  metrics.processingTimeMs <= 10 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ 
                  width: `${Math.min(100, (metrics.processingTimeMs / 10) * 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Efficiency Bar */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Culling Efficiency</span>
              <span className={getEfficiencyColor(metrics.cullingPercentage)}>
                {metrics.cullingPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  metrics.cullingPercentage >= 80 ? 'bg-green-400' :
                  metrics.cullingPercentage >= 60 ? 'bg-yellow-400' :
                  metrics.cullingPercentage >= 40 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ width: `${metrics.cullingPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewportCullingOverlay;
