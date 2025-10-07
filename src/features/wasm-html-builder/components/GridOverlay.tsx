'use client';

import React from 'react';

interface GridOverlayProps {
  show: boolean;
  gridSize?: number;
  width: number;
  height: number;
  opacity?: number;
}

const GridOverlay: React.FC<GridOverlayProps> = ({
  show,
  gridSize = 10,
  width,
  height,
  opacity = 0.1,
}) => {
  if (!show) return null;

  // Create grid pattern
  const createGridPattern = () => {
    const lines = [];
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="0.5"
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="0.5"
        />
      );
    }
    
    return lines;
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        opacity,
      }}
    >
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
      >
        {createGridPattern()}
        
        {/* Major grid lines every 50px */}
        {Array.from({ length: Math.ceil(width / 50) + 1 }, (_, i) => i * 50).map((x) => (
          <line
            key={`major-v-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="1"
          />
        ))}
        
        {Array.from({ length: Math.ceil(height / 50) + 1 }, (_, i) => i * 50).map((y) => (
          <line
            key={`major-h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="1"
          />
        ))}
      </svg>
      
      {/* Grid info */}
      <div
        className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded"
        style={{ fontSize: '10px' }}
      >
        Grid: {gridSize}px
      </div>
    </div>
  );
};

export default GridOverlay;
