'use client';

import React, { useMemo, useCallback } from 'react';
import { Element } from '../../module/wasm-interface';
import { useLineDrag, LineData, type DragHandle } from '../../hooks/useLineDrag';

interface LineElementProps {
  element: Element;
  isSelected: boolean;
  isEditing: boolean;
  isLocked: boolean;
  onSelect: (elementId: string) => void;
  onStartDrag: (e: React.MouseEvent, elementId: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  editContent: string;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onContentKeyDown: (e: React.KeyboardEvent) => void;
  onContentBlur: () => void;
  elementRef: React.RefObject<HTMLDivElement>;
  onSizeChange: (elementId: string, width: number, height: number) => void;
  onPositionChange: (elementId: string, x: number, y: number) => void;
  onLineDataChange: (elementId: string, lineData: LineData) => void;
}

// Constants
const HANDLE_GLOW_SIZE = 8;
const MEASUREMENT_OFFSET = 35;
const GRID_INDICATOR_SIZE = 2;

const LineElement: React.FC<LineElementProps> = ({
  element,
  isSelected,
  isEditing,
  isLocked,
  onSelect,
  onStartDrag,
  onMouseEnter,
  onMouseLeave,
  onKeyDown,
  elementRef,
  onSizeChange,
  onPositionChange,
  onLineDataChange,
}) => {
  // Parse line data from element content with better error handling
  const lineData = useMemo((): LineData => {
    const defaultLineData: LineData = {
      lineType: 'straight',
      startX: 10,
      startY: 10,
      endX: element.width - 10,
      endY: 10,
      arrowStart: false,
      arrowEnd: false,
    };

    try {
      const parsed = JSON.parse(element.content);
      return {
        lineType: parsed.lineType || defaultLineData.lineType,
        startX: parsed.startX ?? defaultLineData.startX,
        startY: parsed.startY ?? defaultLineData.startY,
        endX: parsed.endX ?? element.width - 10,
        endY: parsed.endY ?? defaultLineData.endY,
        arrowStart: Boolean(parsed.arrowStart),
        arrowEnd: Boolean(parsed.arrowEnd),
      };
    } catch {
      return defaultLineData;
    }
  }, [element.content, element.width]);

  // Line drag hook
  const lineDragHook = useLineDrag({
    elementId: element.id,
    elementX: element.x,
    elementY: element.y,
    lineData,
    onLineChange: onLineDataChange,
    onSizeChange,
    onPositionChange,
    snapToGrid: true,
    gridSize: 10,
    showMeasurements: true,
  });

  // Extract stroke properties
  const strokeProps = useMemo(() => {
    const stroke = element.style.stroke;
    return {
      color: stroke?.enabled ? stroke.color : element.style.color,
      width: stroke?.enabled ? stroke.width : 2,
      style: stroke?.enabled ? stroke.style : 'solid',
    };
  }, [element.style]);

  // Container styles
  const containerStyles = useMemo((): React.CSSProperties => ({
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.z_index,
    cursor: getCursor(),
    userSelect: isEditing ? 'text' : 'none',
    overflow: 'visible',
    transition: 'none',
  }), [element, isEditing, isLocked, lineDragHook.isDragging]);

  function getCursor() {
    if (isEditing) return 'text';
    if (isLocked) return 'not-allowed';
    return 'grab';
  }

  // SVG path generation
  const generatePath = useCallback((data: LineData): string => {
    const { startX, startY, endX, endY, lineType } = data;
    
    const pathGenerators: Record<LineData['lineType'], () => string> = {
      straight: () => `M ${startX} ${startY} L ${endX} ${endY}`,
      curved: () => {
        const midX = (startX + endX) / 2;
        const midY = Math.min(startY, endY) - 20;
        return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
      },
      zigzag: () => {
        const segments = 5;
        let path = `M ${startX} ${startY}`;
        for (let i = 1; i <= segments; i++) {
          const x = startX + (endX - startX) * (i / segments);
          const y = startY + (endY - startY) * (i / segments) + (i % 2 === 0 ? 10 : -10);
          path += ` L ${x} ${y}`;
        }
        return path;
      },
      dashed: () => `M ${startX} ${startY} L ${endX} ${endY}`,
      dotted: () => `M ${startX} ${startY} L ${endX} ${endY}`,
    };

    return pathGenerators[lineType]();
  }, []);

  // Event handlers
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelect(element.id);
    }
  }, [element.id, onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditing && !isLocked && !lineDragHook.isDragging) {
      onStartDrag(e, element.id);
    }
  }, [isEditing, isLocked, lineDragHook.isDragging, element.id, onStartDrag]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLocked) {
      lineDragHook.cycleLineType();
    }
  }, [isLocked, lineDragHook.cycleLineType]);

  return (
    <div
      ref={elementRef}
      style={containerStyles}
      data-element-id={element.id}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={onKeyDown}
      tabIndex={isSelected ? 0 : -1}
      title={`เส้น ${lineData.lineType} (คลิกขวาเพื่อเปลี่ยนประเภทเส้น)`}
    >
      <LineSVG 
        lineData={lineData}
        strokeProps={strokeProps}
        generatePath={generatePath}
      />
      
      <SelectionIndicator 
        isSelected={isSelected}
        isLocked={isLocked}
      />
      
      {isSelected && !isEditing && !isLocked && (
        <DragHandles 
          element={element}
          lineData={lineData}
          lineDragHook={lineDragHook}
        />
      )}
    </div>
  );
};

// Extracted Components for better organization

const LineSVG: React.FC<{
  lineData: LineData;
  strokeProps: { color: string; width: number; style: string };
  generatePath: (data: LineData) => string;
}> = ({ lineData, strokeProps, generatePath }) => {
  const ArrowMarker: React.FC<{ id: string; color: string }> = ({ id, color }) => (
    <marker
      id={id}
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,6 L9,3 z" fill={color} />
    </marker>
  );

  const getStrokeDashArray = () => {
    switch (lineData.lineType) {
      case 'dashed': return '5,5';
      case 'dotted': return '2,2';
      default: return 'none';
    }
  };

  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <ArrowMarker id="arrow-start" color={strokeProps.color} />
        <ArrowMarker id="arrow-end" color={strokeProps.color} />
      </defs>
      
      <path
        d={generatePath(lineData)}
        stroke={strokeProps.color}
        strokeWidth={strokeProps.width}
        strokeDasharray={getStrokeDashArray()}
        fill="none"
        markerStart={lineData.arrowStart ? 'url(#arrow-start)' : undefined}
        markerEnd={lineData.arrowEnd ? 'url(#arrow-end)' : undefined}
      />
    </svg>
  );
};

const SelectionIndicator: React.FC<{
  isSelected: boolean;
  isLocked: boolean;
}> = ({ isSelected, isLocked }) => {
  if (!isSelected) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: -2,
        border: `2px solid ${isLocked ? '#f59e0b' : '#3b82f6'}`,
        borderRadius: '4px',
        pointerEvents: 'none',
        boxShadow: isLocked 
          ? '0 4px 12px rgba(245, 158, 11, 0.2)'
          : '0 4px 12px rgba(59, 130, 246, 0.2)',
      }}
    />
  );
};

const DragHandles: React.FC<{
  element: Element;
  lineData: LineData;
  lineDragHook: ReturnType<typeof useLineDrag>;
}> = ({ element, lineData, lineDragHook }) => {
  const { dragHandle, dragHandles, handleDragStart, handleDoubleClick, measurements, HANDLE_SIZE, isDragging } = lineDragHook;

  return (
    <>
      {/* Individual drag handles */}
      {dragHandles.map((handle) => (
        <DragHandle
          key={handle.id}
          handle={handle}
          dragHandle={dragHandle}
          HANDLE_SIZE={HANDLE_SIZE}
          element={element}
          lineData={lineData}
          onDragStart={handleDragStart}
          onDoubleClick={handleDoubleClick}
          measurements={measurements}
        />
      ))}
      
      <MeasurementDisplay 
        dragHandles={dragHandles}
        element={element}
        lineData={lineData}
        measurements={measurements}
        isDragging={isDragging}
      />
      
      {isDragging && (
        <GridIndicators 
          element={element}
          lineData={lineData}
          measurements={measurements}
        />
      )}
    </>
  );
};

const DragHandle: React.FC<{
  handle: DragHandle;
  dragHandle: string | null;
  HANDLE_SIZE: number;
  element: Element;
  lineData: LineData;
  onDragStart: (e: React.MouseEvent, handleId: 'start' | 'end') => void;
  onDoubleClick: (handleId: 'start' | 'end') => void;
  measurements: any;
}> = ({ handle, dragHandle, HANDLE_SIZE, element, lineData, onDragStart, onDoubleClick, measurements }) => {
  const isDragging = dragHandle === handle.id;
  const hasArrow = (handle.id === 'start' && lineData.arrowStart) || 
                  (handle.id === 'end' && lineData.arrowEnd);

  const getHandleColor = () => {
    if (isDragging) return 'bg-red-500';
    if (measurements.isSnapped) return 'bg-green-500 hover:bg-green-600';
    return 'bg-blue-500 hover:bg-blue-600';
  };

  return (
    <div style={{ position: 'absolute' }}>
      {/* Glow effect */}
      {isDragging && (
        <div
          className="absolute bg-red-400 rounded-full opacity-30 animate-pulse pointer-events-none"
          style={{
            left: handle.x - 4,
            top: handle.y - 4,
            width: HANDLE_SIZE + HANDLE_GLOW_SIZE,
            height: HANDLE_SIZE + HANDLE_GLOW_SIZE,
            zIndex: element.z_index + 999,
          }}
        />
      )}
      
      {/* Main handle */}
      <div
        className={`absolute border-2 border-white rounded-full shadow-md cursor-crosshair ${getHandleColor()}`}
        style={{
          left: handle.x,
          top: handle.y,
          width: HANDLE_SIZE,
          height: HANDLE_SIZE,
          zIndex: element.z_index + 1000,
          transition: isDragging ? 'none' : 'all 0.2s ease',
          pointerEvents: 'auto',
          transform: isDragging ? 'scale(1.25)' : 'scale(1)',
        }}
        onMouseDown={(e) => onDragStart(e, handle.id)}
        onDoubleClick={() => onDoubleClick(handle.id)}
        title={`${handle.id === 'start' ? 'จุดเริ่มต้น' : 'จุดสิ้นสุด'} (ดับเบิลคลิกเพื่อเพิ่ม/ลบลูกศร)`}
      />
      
      {/* Arrow indicator */}
      {hasArrow && (
        <div
          className="absolute text-white text-xs font-bold pointer-events-none"
          style={{
            left: handle.x + HANDLE_SIZE + 2,
            top: handle.y - 2,
            zIndex: element.z_index + 1001,
          }}
        >
          →
        </div>
      )}
    </div>
  );
};

const MeasurementDisplay: React.FC<{
  dragHandles: any[];
  element: Element;
  lineData: LineData;
  measurements: any;
  isDragging: boolean;
}> = ({ dragHandles, element, lineData, measurements, isDragging }) => {
  const getBgColor = () => {
    if (measurements.isSnapped) return 'bg-green-500';
    if (isDragging) return 'bg-blue-500';
    return 'bg-black';
  };

  const getSnapIndicator = () => {
    if (!measurements.isSnapped) return '';
    if (measurements.isHorizontal) return '—';
    if (measurements.isVertical) return '|';
    if (measurements.isDiagonal) return '⧸';
    return '';
  };

  return (
    <div
      className={`absolute text-white text-xs px-2 py-0 rounded shadow-lg pointer-events-none ${getBgColor()}`}
      style={{
        left:  0,
        top: Math.min(dragHandles[0].y, dragHandles[1].y) - MEASUREMENT_OFFSET,
        zIndex: element.z_index + 1001,
        fontSize: '11px',
        whiteSpace: 'nowrap',
      }}
    >
      <div className="flex items-center gap-2">
        <div>
          {lineData.lineType}
          {(lineData.arrowStart || lineData.arrowEnd) && ' ↔'}
        </div>
        <div className="text-xs opacity-90">
          L: {measurements.length}px
        </div>
        <div className="text-xs opacity-90">
          ∠: {measurements.angle}°
          {measurements.isSnapped && (
            <span className="ml-1 text-green-300">
              {getSnapIndicator()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const GridIndicators: React.FC<{
  element: Element;
  lineData: LineData;
  measurements: any;
}> = ({ element, lineData, measurements }) => (
  <>
    {/* Start point grid indicator */}
    <div
      className="absolute w-2 h-2 bg-green-400 border border-white rounded-full pointer-events-none"
      style={{
        left: Math.round(lineData.startX / 10) * 10 - GRID_INDICATOR_SIZE,
        top: Math.round(lineData.startY / 10) * 10 - GRID_INDICATOR_SIZE,
        zIndex: element.z_index + 999,
        opacity: 0.7,
      }}
    />
    {/* End point grid indicator */}
    <div
      className="absolute w-2 h-2 bg-green-400 border border-white rounded-full pointer-events-none"
      style={{
        left: Math.round(lineData.endX / 10) * 10 - GRID_INDICATOR_SIZE,
        top: Math.round(lineData.endY / 10) * 10 - GRID_INDICATOR_SIZE,
        zIndex: element.z_index + 999,
        opacity: 0.7,
      }}
    />
    
    {/* Angle guide lines when snapped */}
    {measurements.isSnapped && (
      <svg
        className="absolute pointer-events-none"
        style={{
          left: -element.width,
          top: -element.height,
          width: element.width * 3,
          height: element.height * 3,
          zIndex: element.z_index + 998,
        }}
      >
        <defs>
          <pattern id="guideDash" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="5" height="1" fill="rgba(34, 197, 94, 0.5)" />
          </pattern>
        </defs>
        <line
          x1={lineData.startX + element.width - 100}
          y1={lineData.startY + element.height}
          x2={lineData.endX + element.width + 100}
          y2={lineData.endY + element.height}
          stroke="rgba(34, 197, 94, 0.5)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
      </svg>
    )}
  </>
);

export default LineElement;