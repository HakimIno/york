import React, { useMemo, useRef, useEffect } from 'react';

export interface RulerProps {
  width: number;
  height: number;
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
  unit: 'px' | 'mm' | 'cm' | 'in';
  showRuler: boolean;
  orientation: 'horizontal' | 'vertical';
  className?: string;
  onGuidelineCreate?: (position: number, orientation: 'horizontal' | 'vertical') => void;
  onDragStateChange?: (isDragging: boolean, position: number | null, orientation: 'horizontal' | 'vertical') => void;
}

interface RulerMark {
  position: number;
  value: number;
  isMajor: boolean;
  label?: string;
}

const Ruler: React.FC<RulerProps> = ({
  width,
  height,
  scrollLeft,
  scrollTop,
  zoom,
  unit,
  showRuler,
  orientation,
  className = '',
  onGuidelineCreate,
  onDragStateChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = 'dark' ;
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragPosition, setDragPosition] = React.useState<number | null>(null);

  // Convert pixels to the specified unit
  const convertToUnit = useMemo(() => {
    const dpi = 96; // Standard web DPI
    const mmPerInch = 25.4;
    const cmPerInch = 2.54;
    
    switch (unit) {
      case 'mm':
        return (px: number) => (px / dpi) * mmPerInch;
      case 'cm':
        return (px: number) => (px / dpi) * cmPerInch;
      case 'in':
        return (px: number) => px / dpi;
      case 'px':
      default:
        return (px: number) => px;
    }
  }, [unit]);

  // Convert unit back to pixels
  const convertFromUnit = useMemo(() => {
    const dpi = 96;
    const mmPerInch = 25.4;
    const cmPerInch = 2.54;
    
    switch (unit) {
      case 'mm':
        return (value: number) => (value / mmPerInch) * dpi;
      case 'cm':
        return (value: number) => (value / cmPerInch) * dpi;
      case 'in':
        return (value: number) => value * dpi;
      case 'px':
      default:
        return (value: number) => value;
    }
  }, [unit]);

  // Generate ruler marks based on zoom level and unit
  const generateMarks = useMemo((): RulerMark[] => {
    const marks: RulerMark[] = [];
    const size = orientation === 'horizontal' ? width : height;
    const scrollOffset = orientation === 'horizontal' ? scrollLeft : scrollTop;
    
    // Calculate appropriate intervals based on zoom and unit
    let majorInterval: number;
    let minorInterval: number;
    
    if (unit === 'px') {
      // For pixels, use zoom-based intervals
      if (zoom >= 2) {
        majorInterval = 50;
        minorInterval = 10;
      } else if (zoom >= 1) {
        majorInterval = 100;
        minorInterval = 20;
      } else if (zoom >= 0.5) {
        majorInterval = 200;
        minorInterval = 50;
      } else {
        majorInterval = 500;
        minorInterval = 100;
      }
    } else {
      // For physical units, use unit-appropriate intervals
      switch (unit) {
        case 'mm':
          majorInterval = convertFromUnit(10); // 10mm marks
          minorInterval = convertFromUnit(2);  // 2mm marks
          break;
        case 'cm':
          majorInterval = convertFromUnit(1);  // 1cm marks
          minorInterval = convertFromUnit(0.2); // 2mm marks
          break;
        case 'in':
          majorInterval = convertFromUnit(1);  // 1 inch marks
          minorInterval = convertFromUnit(0.25); // 1/4 inch marks
          break;
        default:
          majorInterval = 100;
          minorInterval = 20;
      }
    }

    // Generate marks
    const start = Math.floor(scrollOffset / minorInterval) * minorInterval;
    const end = start + size + majorInterval;
    
    for (let pos = start; pos <= end; pos += minorInterval) {
      const isMajor = pos % majorInterval === 0;
      const value = convertToUnit(pos);
      
      marks.push({
        position: pos - scrollOffset,
        value,
        isMajor,
        label: isMajor ? value.toFixed(unit === 'px' ? 0 : 1) : undefined,
      });
    }
    
    return marks;
  }, [width, height, scrollLeft, scrollTop, zoom, unit, orientation, convertToUnit, convertFromUnit]);

  // Draw ruler
  useEffect(() => {
    if (!showRuler || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set styles - Modern minimal design with theme support
    const isDark = theme !== 'dark';
    ctx.fillStyle = isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeRect(0, 0, width, height);

    // Draw marks
    const marks = generateMarks;
    
    marks.forEach(mark => {
      const { position, value, isMajor, label } = mark;
      
      if (position < 0 || position > (orientation === 'horizontal' ? width : height)) {
        return;
      }

      ctx.strokeStyle = isMajor 
        ? (isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)')
        : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)');
      ctx.lineWidth = isMajor ? 2.0 : 1.5;
      
      if (orientation === 'horizontal') {
        const markHeight = isMajor ? 10 : 6;
        ctx.beginPath();
        ctx.moveTo(position, height - markHeight);
        ctx.lineTo(position, height);
        ctx.stroke();
        
        // Draw label with background for better readability
        if (label && isMajor) {
          const textWidth = ctx.measureText(label).width;
          const padding = 2;
          const bgWidth = textWidth + padding * 2;
          const bgHeight = 10;
          const bgX = position - bgWidth / 2;
          const bgY = height - 20;
          
          // Draw background
          ctx.fillStyle = isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
          
          // Draw text
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
          ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, position, height - 13);
        }
      } else {
        const markWidth = isMajor ? 10 : 6;
        ctx.beginPath();
        ctx.moveTo(width - markWidth, position);
        ctx.lineTo(width, position);
        ctx.stroke();
        
        // Draw label with background for better readability
        if (label && isMajor) {
          // Set font first to measure text
          ctx.font = '9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const textWidth = ctx.measureText(label).width;
          const padding = 2;
          const bgWidth = textWidth + padding * 2;
          const bgHeight = 10;
          const bgX = width - 12 - textWidth;
          const bgY = position - bgHeight / 2;
          
          // Draw background
          ctx.fillStyle = isDark ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
          
          // Draw text
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, width - 10, position);
        }
      }
    });

    // Draw unit indicator
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)';
    ctx.font = '7px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(unit, 6, 6);

    // Draw guideline preview while dragging
    if (isDragging && dragPosition !== null) {
      ctx.strokeStyle = '#007AFF';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      
      if (orientation === 'horizontal') {
        const x = dragPosition - scrollLeft;
        if (x >= 0 && x <= width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      } else {
        const y = dragPosition - scrollTop;
        if (y >= 0 && y <= height) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      
      ctx.setLineDash([]); // Reset line dash
    }
  }, [width, height, generateMarks, showRuler, orientation, unit, theme, isDragging, dragPosition, scrollLeft, scrollTop]);

  // Handle mouse events for guideline creation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onGuidelineCreate) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    let position: number;
    if (orientation === 'horizontal') {
      position = clientX + scrollLeft;
    } else {
      position = clientY + scrollTop;
    }

    setIsDragging(true);
    setDragPosition(position);
    
    // Notify parent component about drag state
    onDragStateChange?.(true, position, orientation);
    
    // Prevent default to avoid text selection
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !onGuidelineCreate) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    let position: number;
    if (orientation === 'horizontal') {
      position = clientX + scrollLeft;
    } else {
      position = clientY + scrollTop;
    }

    setDragPosition(position);
    
    // Notify parent component about drag position update
    onDragStateChange?.(true, position, orientation);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !onGuidelineCreate || dragPosition === null) return;

    // Only create guideline if we actually dragged (not just clicked)
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      
      let currentPosition: number;
      if (orientation === 'horizontal') {
        currentPosition = clientX + scrollLeft;
      } else {
        currentPosition = clientY + scrollTop;
      }

      // Check if we moved at least 5 pixels to consider it a drag
      if (Math.abs(currentPosition - dragPosition) >= 5) {
        onGuidelineCreate(currentPosition, orientation);
      }
    }

    setIsDragging(false);
    setDragPosition(null);
    
    // Notify parent component about drag end
    onDragStateChange?.(false, null, orientation);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragPosition(null);
      
      // Notify parent component about drag end
      onDragStateChange?.(false, null, orientation);
    }
  };

  if (!showRuler) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`ruler ${orientation} ${className}`}
      style={{
        position: 'absolute',
        zIndex: 10,
        pointerEvents: onGuidelineCreate ? 'auto' : 'none',
        cursor: onGuidelineCreate ? 'crosshair' : 'default',
        ...(orientation === 'horizontal' 
          ? { 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '20px'
            }
          : { 
              top: 0, 
              right: 0, 
              width: '20px', 
              height: '100%'
            }
        ),
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default Ruler;
