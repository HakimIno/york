import { useState, useCallback, useRef, useMemo } from 'react';

export interface LinePoint {
  x: number;
  y: number;
}

export interface LineData {
  lineType: 'straight' | 'curved' | 'zigzag' | 'dashed' | 'dotted';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  arrowStart: boolean;
  arrowEnd: boolean;
}

export interface UseLineDragProps {
  elementId: string;
  elementX: number;
  elementY: number;
  lineData: LineData;
  onLineChange: (elementId: string, newLineData: LineData) => void;
  onSizeChange: (elementId: string, width: number, height: number) => void;
  onPositionChange: (elementId: string, x: number, y: number) => void;
  snapToGrid?: boolean;
  gridSize?: number;
  showMeasurements?: boolean;
}

export interface DragHandle {
  id: 'start' | 'end';
  x: number;
  y: number;
  cursor: string;
}

export const useLineDrag = ({
  elementId,
  elementX,
  elementY,
  lineData,
  onLineChange,
  onSizeChange,
  onPositionChange,
  snapToGrid = true,
  gridSize = 10,
  showMeasurements = true,
}: UseLineDragProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<'start' | 'end' | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; originalLine: LineData } | null>(null);

  const HANDLE_SIZE = 8;

  // Snap to grid utility
  const snapToGridValue = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Calculate distance between two points
  const calculateDistance = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }, []);

  // Calculate angle between two points (in degrees)
  const calculateAngle = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    return angle < 0 ? angle + 360 : angle;
  }, []);

  // Check if line is horizontal, vertical, or diagonal (45°)
  const getSnapAngle = useCallback((angle: number) => {
    const normalizedAngle = angle % 360;
    const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    const tolerance = 15; // degrees
    
    for (const snapAngle of snapAngles) {
      if (Math.abs(normalizedAngle - snapAngle) <= tolerance) {
        return snapAngle;
      }
    }
    return null;
  }, []);

  // Calculate drag handles positions
  const dragHandles: DragHandle[] = [
    {
      id: 'start',
      x: lineData.startX - HANDLE_SIZE / 2,
      y: lineData.startY - HANDLE_SIZE / 2,
      cursor: 'crosshair',
    },
    {
      id: 'end',
      x: lineData.endX - HANDLE_SIZE / 2,
      y: lineData.endY - HANDLE_SIZE / 2,
      cursor: 'crosshair',
    },
  ];

  // Start dragging a handle
  const handleDragStart = useCallback((e: React.MouseEvent, handleId: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.target as HTMLElement).closest('[data-element-id]')?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setIsDragging(true);
    setDragHandle(handleId);
    dragStartRef.current = {
      mouseX,
      mouseY,
      originalLine: { ...lineData },
    };

    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - rect.left - dragStartRef.current.mouseX;
      const deltaY = e.clientY - rect.top - dragStartRef.current.mouseY;

      const newLineData = { ...dragStartRef.current.originalLine };

      let newX, newY;
      
      if (handleId === 'start') {
        newX = Math.max(0, dragStartRef.current.originalLine.startX + deltaX);
        newY = Math.max(0, dragStartRef.current.originalLine.startY + deltaY);
        
        // Apply grid snapping
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
        
        // Apply angle snapping if shift is held (we'll detect this later)
        const currentAngle = calculateAngle(newX, newY, newLineData.endX, newLineData.endY);
        const snapAngle = getSnapAngle(currentAngle);
        
        if (snapAngle !== null) {
          const distance = calculateDistance(newX, newY, newLineData.endX, newLineData.endY);
          const radians = (snapAngle * Math.PI) / 180;
          newX = newLineData.endX - Math.cos(radians) * distance;
          newY = newLineData.endY - Math.sin(radians) * distance;
        }
        
        newLineData.startX = newX;
        newLineData.startY = newY;
      } else {
        newX = Math.max(0, dragStartRef.current.originalLine.endX + deltaX);
        newY = Math.max(0, dragStartRef.current.originalLine.endY + deltaY);
        
        // Apply grid snapping
        newX = snapToGridValue(newX);
        newY = snapToGridValue(newY);
        
        // Apply angle snapping
        const currentAngle = calculateAngle(newLineData.startX, newLineData.startY, newX, newY);
        const snapAngle = getSnapAngle(currentAngle);
        
        if (snapAngle !== null) {
          const distance = calculateDistance(newLineData.startX, newLineData.startY, newX, newY);
          const radians = (snapAngle * Math.PI) / 180;
          newX = newLineData.startX + Math.cos(radians) * distance;
          newY = newLineData.startY + Math.sin(radians) * distance;
        }
        
        newLineData.endX = newX;
        newLineData.endY = newY;
      }

      // Calculate new element bounds
      const minX = Math.min(newLineData.startX, newLineData.endX);
      const minY = Math.min(newLineData.startY, newLineData.endY);
      const maxX = Math.max(newLineData.startX, newLineData.endX);
      const maxY = Math.max(newLineData.startY, newLineData.endY);

      const newWidth = Math.max(50, maxX - minX + 20); // Add padding
      const newHeight = Math.max(20, maxY - minY + 20); // Add padding

      // Adjust line coordinates to be relative to new bounds
      const adjustedLineData = {
        ...newLineData,
        startX: newLineData.startX - minX + 10,
        startY: newLineData.startY - minY + 10,
        endX: newLineData.endX - minX + 10,
        endY: newLineData.endY - minY + 10,
      };

      // Update element position if bounds changed
      const newElementX = elementX + minX - 10;
      const newElementY = elementY + minY - 10;

      if (newElementX !== elementX || newElementY !== elementY) {
        onPositionChange(elementId, newElementX, newElementY);
      }

      onSizeChange(elementId, newWidth, newHeight);
      onLineChange(elementId, adjustedLineData);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
      dragStartRef.current = null;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [elementId, elementX, elementY, lineData, onLineChange, onSizeChange, onPositionChange]);

  // Toggle arrow on handle double-click
  const handleDoubleClick = useCallback((handleId: 'start' | 'end') => {
    const newLineData = { ...lineData };
    
    if (handleId === 'start') {
      newLineData.arrowStart = !newLineData.arrowStart;
    } else {
      newLineData.arrowEnd = !newLineData.arrowEnd;
    }
    
    onLineChange(elementId, newLineData);
  }, [elementId, lineData, onLineChange]);

  // Cycle through line types
  const cycleLineType = useCallback(() => {
    const lineTypes: Array<'straight' | 'curved' | 'zigzag' | 'dashed' | 'dotted'> = [
      'straight', 'curved', 'zigzag', 'dashed', 'dotted'
    ];
    
    const currentIndex = lineTypes.indexOf(lineData.lineType);
    const nextIndex = (currentIndex + 1) % lineTypes.length;
    const newLineType = lineTypes[nextIndex];
    
    const newLineData = { ...lineData, lineType: newLineType };
    onLineChange(elementId, newLineData);
  }, [elementId, lineData, onLineChange]);

  // Calculate current measurements
  const measurements = useMemo(() => {
    const distance = calculateDistance(lineData.startX, lineData.startY, lineData.endX, lineData.endY);
    const angle = calculateAngle(lineData.startX, lineData.startY, lineData.endX, lineData.endY);
    const snapAngle = getSnapAngle(angle);
    
    return {
      length: Math.round(distance * 10) / 10, // Round to 1 decimal
      angle: Math.round(angle * 10) / 10,
      isSnapped: snapAngle !== null,
      snapAngle: snapAngle,
      isHorizontal: Math.abs(angle % 180) < 5 || Math.abs((angle + 5) % 180) < 5,
      isVertical: Math.abs((angle + 90) % 180) < 5 || Math.abs((angle - 90) % 180) < 5,
      isDiagonal: snapAngle === 45 || snapAngle === 135 || snapAngle === 225 || snapAngle === 315,
    };
  }, [lineData, calculateDistance, calculateAngle, getSnapAngle]);

  return {
    isDragging,
    dragHandle,
    dragHandles,
    handleDragStart,
    handleDoubleClick,
    cycleLineType,
    measurements,
    HANDLE_SIZE,
  };
};
