import React, { useMemo } from 'react';
import { DetailedPerformanceStats } from '@/hooks/usePerformanceMonitor';

interface PerformanceOverlayProps {
  stats: DetailedPerformanceStats | null;
  isVisible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
  isMonitoring?: boolean;
}

const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  stats,
  isVisible = true,
  position = 'top-right',
  compact = false,
  isMonitoring = false
}) => {
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  }, [position]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.warning) return 'text-red-400';
    if (value >= thresholds.good) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getFPSColor = (fps: number) => {
    if (fps === 0) return 'text-gray-400'; // Gray for 0 FPS (not measured yet)
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryColor = (percentage: number) => {
    return getStatusColor(percentage, { good: 60, warning: 80 });
  };

  const getCPUColor = (usage: number) => {
    return getStatusColor(usage, { good: 50, warning: 80 });
  };

  if (!stats || !isVisible) return null;

  if (compact) {
    return (
      <div className={`absolute ${positionClasses} bg-black/90 text-white p-3 rounded-lg text-xs font-mono z-50 min-w-48`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300">Performance</span>
          {stats.warnings.length > 0 && (
            <span className="text-red-400">⚠ {stats.warnings.length}</span>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>FPS:</span>
            <span className={getFPSColor(stats.fps.current)}>
              {stats.fps.current}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>CPU:</span>
            <span className={getCPUColor(stats.cpu.usage)}>
              {stats.cpu.usage}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={getMemoryColor(stats.memory.percentage)}>
              {stats.memory.percentage}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Elements:</span>
            <span className="text-blue-400">
              {stats.custom.elementsRendered}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute ${positionClasses} bg-black/90 text-white p-4 rounded-lg text-sm font-mono z-50 min-w-72 max-w-96`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-600">
        <span className="text-gray-300 font-semibold">Performance Monitor</span>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center ${isMonitoring ? 'text-green-400' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full mr-1 ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs">{isMonitoring ? 'Live' : 'Stopped'}</span>
          </div>
          {stats.warnings.length > 0 && (
            <div className="flex items-center text-red-400">
              <span className="mr-1">⚠</span>
              <span>{stats.warnings.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* FPS Section */}
      <div className="mb-3">
        <div className="text-gray-400 text-xs mb-1">FRAME RATE</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Current:</span>
            <span className={getFPSColor(stats.fps.current)}>
              {stats.fps.current === 0 ? 'Measuring...' : `${stats.fps.current} fps`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Average:</span>
            <span className={getFPSColor(stats.fps.average)}>
              {stats.fps.average} fps
            </span>
          </div>
          <div className="flex justify-between">
            <span>Min:</span>
            <span className="text-gray-300">{stats.fps.min} fps</span>
          </div>
          <div className="flex justify-between">
            <span>Drops:</span>
            <span className={stats.fps.drops > 5 ? 'text-red-400' : 'text-gray-300'}>
              {stats.fps.drops}
            </span>
          </div>
        </div>
      </div>

      {/* CPU Section */}
      <div className="mb-3">
        <div className="text-gray-400 text-xs mb-1">CPU</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Usage:</span>
            <span className={getCPUColor(stats.cpu.usage)}>
              {stats.cpu.usage}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Cores:</span>
            <span className="text-gray-300">{stats.cpu.cores}</span>
          </div>
        </div>
      </div>

      {/* Memory Section */}
      <div className="mb-3">
        <div className="text-gray-400 text-xs mb-1">MEMORY</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Used:</span>
            <span className={getMemoryColor(stats.memory.percentage)}>
              {stats.memory.used}MB ({stats.memory.percentage}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span>Heap:</span>
            <span className="text-gray-300">
              {stats.memory.heap.used}/{stats.memory.heap.limit}MB
            </span>
          </div>
        </div>
      </div>

      {/* Rendering Section */}
      <div className="mb-3">
        <div className="text-gray-400 text-xs mb-1">RENDERING</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Elements:</span>
            <span className="text-blue-400">{stats.custom.elementsRendered}</span>
          </div>
          <div className="flex justify-between">
            <span>Visible:</span>
            <span className="text-blue-400">{stats.custom.visibleElements}</span>
          </div>
          <div className="flex justify-between">
            <span>DOM Nodes:</span>
            <span className="text-gray-300">{stats.dom.elementCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Canvas Ops:</span>
            <span className="text-purple-400">{stats.custom.canvasOperations}</span>
          </div>
        </div>
      </div>

      {/* Timing Section */}
      <div className="mb-3">
        <div className="text-gray-400 text-xs mb-1">TIMING</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Render:</span>
            <span className="text-gray-300">{stats.timing.renderTime.toFixed(1)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Paint:</span>
            <span className="text-gray-300">{stats.timing.paintTime.toFixed(1)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Layout:</span>
            <span className="text-gray-300">{stats.timing.layoutTime.toFixed(1)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Script:</span>
            <span className="text-gray-300">{stats.timing.scriptTime.toFixed(1)}ms</span>
          </div>
        </div>
      </div>

      {/* Network Section */}
      <div className="mb-3">
        <div className="text-gray-400 text-xs mb-1">NETWORK</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="text-gray-300">{stats.network.effectiveType}</span>
          </div>
          <div className="flex justify-between">
            <span>Speed:</span>
            <span className="text-gray-300">{stats.network.downlink} Mbps</span>
          </div>
          <div className="flex justify-between">
            <span>RTT:</span>
            <span className="text-gray-300">{stats.network.rtt}ms</span>
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      {stats.warnings.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-600">
          <div className="text-red-400 text-xs mb-1">WARNINGS</div>
          <div className="space-y-1">
            {stats.warnings.slice(0, 3).map((warning, index) => (
              <div key={index} className="text-xs text-red-300 flex items-start">
                <span className="mr-1">•</span>
                <span className="flex-1">{warning}</span>
              </div>
            ))}
            {stats.warnings.length > 3 && (
              <div className="text-xs text-gray-400">
                +{stats.warnings.length - 3} more warnings
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-400">
        Updated: {new Date(stats.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default PerformanceOverlay;
