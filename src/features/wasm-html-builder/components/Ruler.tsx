import React, { useMemo, useRef, useEffect } from "react";

export interface RulerProps {
  width: number;
  height: number;
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
  unit: "px" | "mm" | "cm" | "in";
  showRuler: boolean;
  orientation: "horizontal" | "vertical";
  className?: string;
  onGuidelineCreate?: (
    position: number,
    orientation: "horizontal" | "vertical",
  ) => void;
  onDragStateChange?: (
    isDragging: boolean,
    position: number | null,
    orientation: "horizontal" | "vertical",
  ) => void;
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
  className = "",
  onGuidelineCreate,
  onDragStateChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = "dark";
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragPosition, setDragPosition] = React.useState<number | null>(null);

  // Convert pixels to the specified unit
  const convertToUnit = useMemo(() => {
    const dpi = 96; // Standard web DPI
    const mmPerInch = 25.4;
    const cmPerInch = 2.54;

    switch (unit) {
      case "mm":
        return (px: number) => (px / dpi) * mmPerInch;
      case "cm":
        return (px: number) => (px / dpi) * cmPerInch;
      case "in":
        return (px: number) => px / dpi;
      case "px":
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
      case "mm":
        return (value: number) => (value / mmPerInch) * dpi;
      case "cm":
        return (value: number) => (value / cmPerInch) * dpi;
      case "in":
        return (value: number) => value * dpi;
      case "px":
      default:
        return (value: number) => value;
    }
  }, [unit]);

  // Generate ruler marks based on zoom level and unit
  const generateMarks = useMemo((): RulerMark[] => {
    const marks: RulerMark[] = [];
    const size = orientation === "horizontal" ? width : height;
    const scrollOffset = orientation === "horizontal" ? scrollLeft : scrollTop;

    // Calculate appropriate intervals based on zoom and unit
    let majorInterval: number;
    let minorInterval: number;

    if (unit === "px") {
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
        case "mm":
          majorInterval = convertFromUnit(10); // 10mm marks
          minorInterval = convertFromUnit(2); // 2mm marks
          break;
        case "cm":
          majorInterval = convertFromUnit(1); // 1cm marks
          minorInterval = convertFromUnit(0.2); // 2mm marks
          break;
        case "in":
          majorInterval = convertFromUnit(1); // 1 inch marks
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
        label: isMajor ? value.toFixed(unit === "px" ? 0 : 1) : undefined,
      });
    }

    return marks;
  }, [
    width,
    height,
    scrollLeft,
    scrollTop,
    zoom,
    unit,
    orientation,
    convertToUnit,
    convertFromUnit,
  ]);

  // Draw ruler
  useEffect(() => {
    if (!showRuler || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set styles - Modern minimal design
    const isDark = theme !== "dark";
    // Transparent background for minimalist look
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.strokeStyle = isDark
      ? "rgba(255, 255, 255, 0.15)"
      : "rgba(0, 0, 0, 0.1)";

    // Draw border line only
    ctx.beginPath();
    if (orientation === "horizontal") {
      ctx.moveTo(0, height);
      ctx.lineTo(width, height);
    } else {
      ctx.moveTo(width, 0);
      ctx.lineTo(width, height);
    }
    ctx.stroke();

    // Draw marks
    const marks = generateMarks;

    marks.forEach((mark) => {
      const { position, value, isMajor, label } = mark;

      if (
        position < 0 ||
        position > (orientation === "horizontal" ? width : height)
      ) {
        return;
      }

      ctx.strokeStyle = isMajor
        ? isDark
          ? "rgba(255, 255, 255, 0.6)"
          : "rgba(0, 0, 0, 0.5)"
        : isDark
          ? "rgba(255, 255, 255, 0.3)"
          : "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = isMajor ? 1.0 : 0.5; // Thinner lines for minimalist look

      if (orientation === "horizontal") {
        const markHeight = isMajor ? 8 : 4; // Shorter marks
        ctx.beginPath();
        ctx.moveTo(position, height - markHeight);
        ctx.lineTo(position, height);
        ctx.stroke();

        // Draw label
        if (label && isMajor) {
          ctx.fillStyle = isDark
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)";
          ctx.font =
            '10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'; // Clean font
          ctx.textAlign = "center";
          ctx.fillText(label, position + 2, height - 12); // Adjusted position
        }
      } else {
        const markWidth = isMajor ? 8 : 4; // Shorter marks
        ctx.beginPath();
        ctx.moveTo(width - markWidth, position);
        ctx.lineTo(width, position);
        ctx.stroke();

        // Draw label
        if (label && isMajor) {
          ctx.fillStyle = isDark
            ? "rgba(255, 255, 255, 0.7)"
            : "rgba(0, 0, 0, 0.6)";
          ctx.font =
            '10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";

          // Rotate text for vertical ruler to save space and look cleaner
          ctx.save();
          ctx.translate(width - 12, position);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      }
    });

    // Draw unit indicator
    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.3)";
    ctx.font =
      '9px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(unit, 4, 4);

    // Draw guideline preview while dragging
    if (isDragging && dragPosition !== null) {
      ctx.strokeStyle = "#00C2FF"; // Cyan for guidelines
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]); // Dashed line

      // LOGIC SWAP: Horizontal Ruler -> Vertical Guide (X-axis)
      if (orientation === "horizontal") {
        const x = dragPosition - scrollLeft;
        if (x >= 0 && x <= width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height); // Draw vertical line preview on ruler
          ctx.stroke();
        }
      } else {
        // LOGIC SWAP: Vertical Ruler -> Horizontal Guide (Y-axis)
        const y = dragPosition - scrollTop;
        if (y >= 0 && y <= height) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y); // Draw horizontal line preview on ruler
          ctx.stroke();
        }
      }

      ctx.setLineDash([]); // Reset line dash
    }
  }, [
    width,
    height,
    generateMarks,
    showRuler,
    orientation,
    unit,
    theme,
    isDragging,
    dragPosition,
    scrollLeft,
    scrollTop,
  ]);

  // Handle mouse events for guideline creation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onGuidelineCreate) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    let position: number;
    // LOGIC SWAP: Horizontal Ruler -> Vertical Guide (X-axis)
    if (orientation === "horizontal") {
      position = clientX + scrollLeft;
    } else {
      // LOGIC SWAP: Vertical Ruler -> Horizontal Guide (Y-axis)
      position = clientY + scrollTop;
    }

    setIsDragging(true);
    setDragPosition(position);

    // Notify parent component about drag state
    // LOGIC SWAP: Pass swapped orientation
    const guideOrientation = orientation === "horizontal" ? "vertical" : "horizontal";
    onDragStateChange?.(true, position, guideOrientation);

    // Prevent default to avoid text selection
    e.preventDefault();

    // Attach window listeners for dragging outside the ruler
    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      const currentRect = canvasRef.current?.getBoundingClientRect();
      if (!currentRect) return;

      const moveClientX = moveEvent.clientX - currentRect.left;
      const moveClientY = moveEvent.clientY - currentRect.top;

      let movePosition: number;
      if (orientation === "horizontal") {
        movePosition = moveClientX + scrollLeft;
      } else {
        movePosition = moveClientY + scrollTop;
      }

      setDragPosition(movePosition);
      onDragStateChange?.(true, movePosition, guideOrientation);
    };

    const handleWindowMouseUp = (upEvent: MouseEvent) => {
      const currentRect = canvasRef.current?.getBoundingClientRect();
      if (currentRect) {
        const upClientX = upEvent.clientX - currentRect.left;
        const upClientY = upEvent.clientY - currentRect.top;

        let upPosition: number;
        if (orientation === "horizontal") {
          upPosition = upClientX + scrollLeft;
        } else {
          upPosition = upClientY + scrollTop;
        }

        // Check if we moved at least 5 pixels to consider it a drag
        // Note: We compare with the initial position from closure, but for simplicity
        // we can just check if dragPosition is set. 
        // Better: use the last known dragPosition which state updates.
        // Actually, we can just create it at the final position.
        onGuidelineCreate(upPosition, guideOrientation);
      }

      setIsDragging(false);
      setDragPosition(null);
      onDragStateChange?.(false, null, guideOrientation);

      // Remove window listeners
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  // No longer needed as we use window listeners
  // const handleMouseMove = ... 
  // const handleMouseUp = ...
  // const handleMouseLeave = ...

  if (!showRuler) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`ruler ${orientation} ${className}`}
      style={{
        position: "absolute",
        zIndex: 10,
        pointerEvents: onGuidelineCreate ? "auto" : "none",
        cursor: onGuidelineCreate ? "crosshair" : "default",
        ...(orientation === "horizontal"
          ? {
            top: 0,
            left: 0,
            width: "100%",
            height: "20px",
          }
          : {
            top: 0,
            right: 0,
            width: "20px",
            height: "100%",
          }),
      }}
      onMouseDown={handleMouseDown}
    // onMouseMove={handleMouseMove} // Handled by window listener
    // onMouseUp={handleMouseUp}     // Handled by window listener
    // onMouseLeave={handleMouseLeave} // Handled by window listener
    />
  );
};

export default Ruler;
