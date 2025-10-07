import React from 'react';

interface SpatialIndexStats {
  total_elements: number;
  total_cells: number;
  occupied_cells: number;
  average_elements_per_cell: number;
  max_elements_per_cell: number;
  memory_usage_bytes: number;
  last_query_time_ms: number;
}

interface SpatialIndexingOverlayProps {
  stats: SpatialIndexStats;
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

const SpatialIndexingOverlay: React.FC<SpatialIndexingOverlayProps> = ({
  stats,
  isVisible = true,
  position = 'top-left',
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
        return 'top-4 left-4';
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

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const cellEfficiency = stats.total_cells > 0 ? (stats.occupied_cells / stats.total_cells) * 100 : 0;

  if (compact) {
    return (
      <div className={`absolute ${getPositionClasses()} z-50`}>
        <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
          <div className="text-blue-400 font-bold">SI</div>
          <div>{stats.total_elements}E</div>
          <div className={getPerformanceColor(stats.last_query_time_ms)}>
            {stats.last_query_time_ms.toFixed(1)}ms
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`absolute ${getPositionClasses()} z-50`}>
      <div className="bg-black/90 text-white p-3 rounded-lg text-xs font-mono min-w-[220px]">
        <div className="text-blue-400 font-bold mb-2 flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
          SPATIAL INDEXING
        </div>
        
        <div className="space-y-2">
          {/* Element and Cell Counts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Elements:</span>
              <span className="text-white">{stats.total_elements}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Cells:</span>
              <span className="text-blue-400">{stats.total_cells}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Occupied:</span>
              <span className="text-cyan-400">{stats.occupied_cells}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Efficiency:</span>
              <span className={getEfficiencyColor(cellEfficiency)}>
                {cellEfficiency.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Avg/Cell:</span>
              <span className="text-yellow-400">
                {stats.average_elements_per_cell.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max/Cell:</span>
              <span className="text-orange-400">
                {stats.max_elements_per_cell}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Memory:</span>
              <span className="text-purple-400">
                {formatBytes(stats.memory_usage_bytes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Query Time:</span>
              <span className={getPerformanceColor(stats.last_query_time_ms)}>
                {stats.last_query_time_ms.toFixed(2)}ms
              </span>
            </div>
          </div>

          {/* Performance Bar */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Query Performance</span>
              <span className={getPerformanceColor(stats.last_query_time_ms)}>
                {stats.last_query_time_ms.toFixed(1)}ms
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  stats.last_query_time_ms <= 1 ? 'bg-green-400' :
                  stats.last_query_time_ms <= 5 ? 'bg-yellow-400' :
                  stats.last_query_time_ms <= 10 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ 
                  width: `${Math.min(100, (stats.last_query_time_ms / 10) * 100)}%` 
                }}
              />
            </div>
          </div>

          {/* Cell Efficiency Bar */}
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Cell Efficiency</span>
              <span className={getEfficiencyColor(cellEfficiency)}>
                {cellEfficiency.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  cellEfficiency >= 80 ? 'bg-green-400' :
                  cellEfficiency >= 60 ? 'bg-yellow-400' :
                  cellEfficiency >= 40 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ width: `${cellEfficiency}%` }}
              />
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="border-t border-gray-600 pt-2">
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className={`text-center px-1 py-0.5 rounded ${
                stats.last_query_time_ms <= 1 ? 'bg-green-400/20 text-green-400' :
                stats.last_query_time_ms <= 5 ? 'bg-yellow-400/20 text-yellow-400' :
                'bg-red-400/20 text-red-400'
              }`}>
                {stats.last_query_time_ms <= 1 ? 'FAST' :
                 stats.last_query_time_ms <= 5 ? 'GOOD' : 'SLOW'}
              </div>
              <div className={`text-center px-1 py-0.5 rounded ${
                cellEfficiency >= 60 ? 'bg-green-400/20 text-green-400' :
                cellEfficiency >= 40 ? 'bg-yellow-400/20 text-yellow-400' :
                'bg-red-400/20 text-red-400'
              }`}>
                {cellEfficiency >= 60 ? 'OPTIMAL' :
                 cellEfficiency >= 40 ? 'FAIR' : 'POOR'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpatialIndexingOverlay;
