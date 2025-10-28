import { useState, useCallback, useMemo } from 'react';

export type ResizeDirection = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

// Constants for better performance and consistency
const MIN_WIDTH = 50;
const MIN_HEIGHT = 30;
const HANDLE_SIZE = 12;
const HANDLE_HALF = HANDLE_SIZE / 2;

// Resize handle configuration
export const RESIZE_HANDLES = [
  {
    direction: 'nw' as ResizeDirection,
    cursor: 'nw-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x - HANDLE_HALF,
      y: y - HANDLE_HALF,
    }),
  },
  {
    direction: 'n' as ResizeDirection,
    cursor: 'n-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x + w / 2 - HANDLE_HALF,
      y: y - HANDLE_HALF,
    }),
  },
  {
    direction: 'ne' as ResizeDirection,
    cursor: 'ne-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x + w - HANDLE_HALF,
      y: y - HANDLE_HALF,
    }),
  },
  {
    direction: 'w' as ResizeDirection,
    cursor: 'w-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x - HANDLE_HALF,
      y: y + h / 2 - HANDLE_HALF,
    }),
  },
  {
    direction: 'e' as ResizeDirection,
    cursor: 'e-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x + w - HANDLE_HALF,
      y: y + h / 2 - HANDLE_HALF,
    }),
  },
  {
    direction: 'sw' as ResizeDirection,
    cursor: 'sw-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x - HANDLE_HALF,
      y: y + h - HANDLE_HALF,
    }),
  },
  {
    direction: 's' as ResizeDirection,
    cursor: 's-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x + w / 2 - HANDLE_HALF,
      y: y + h - HANDLE_HALF,
    }),
  },
  {
    direction: 'se' as ResizeDirection,
    cursor: 'se-resize',
    getPosition: (x: number, y: number, w: number, h: number) => ({
      x: x + w - HANDLE_HALF,
      y: y + h - HANDLE_HALF,
    }),
  },
];

interface UseResizableProps {
  elementId: string;
  elementWidth: number;
  elementHeight: number;
  elementX: number;
  elementY: number;
  onSizeChange: (elementId: string, width: number, height: number) => void;
  onPositionChange: (elementId: string, x: number, y: number) => void;
  onResizeEnd?: () => void; // Callback when resize ends
}

export const useResizable = ({
  elementId,
  elementWidth,
  elementHeight,
  elementX,
  elementY,
  onSizeChange,
  onPositionChange,
  onResizeEnd,
}: UseResizableProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] =
    useState<ResizeDirection | null>(null);

  // Memoized resize calculator for better performance
  const calculateResize = useMemo(() => {
    return (
      direction: ResizeDirection,
      deltaX: number,
      deltaY: number,
      startWidth: number,
      startHeight: number,
      startX: number,
      startY: number
    ) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startX;
      let newY = startY;

      const resizeMap = {
        se: () => {
          newWidth = Math.max(MIN_WIDTH, startWidth + deltaX);
          newHeight = Math.max(MIN_HEIGHT, startHeight + deltaY);
        },
        sw: () => {
          newWidth = Math.max(MIN_WIDTH, startWidth - deltaX);
          newHeight = Math.max(MIN_HEIGHT, startHeight + deltaY);
          newX = startX + (startWidth - newWidth);
        },
        ne: () => {
          newWidth = Math.max(MIN_WIDTH, startWidth + deltaX);
          newHeight = Math.max(MIN_HEIGHT, startHeight - deltaY);
          newY = startY + (startHeight - newHeight);
        },
        nw: () => {
          newWidth = Math.max(MIN_WIDTH, startWidth - deltaX);
          newHeight = Math.max(MIN_HEIGHT, startHeight - deltaY);
          newX = startX + (startWidth - newWidth);
          newY = startY + (startHeight - newHeight);
        },
        e: () => {
          newWidth = Math.max(MIN_WIDTH, startWidth + deltaX);
        },
        w: () => {
          newWidth = Math.max(MIN_WIDTH, startWidth - deltaX);
          newX = startX + (startWidth - newWidth);
        },
        s: () => {
          newHeight = Math.max(MIN_HEIGHT, startHeight + deltaY);
        },
        n: () => {
          newHeight = Math.max(MIN_HEIGHT, startHeight - deltaY);
          newY = startY + (startHeight - newHeight);
        },
      };

      resizeMap[direction]?.();
      return { newWidth, newHeight, newX, newY };
    };
  }, []);

  // Optimized resize handler with batch updates
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: ResizeDirection) => {
      e.preventDefault();
      e.stopPropagation();

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startElementWidth = elementWidth;
      const startElementHeight = elementHeight;
      const startElementX = elementX;
      const startElementY = elementY;

      setIsResizing(true);
      setResizeDirection(direction);

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startMouseX;
        const deltaY = e.clientY - startMouseY;

        const { newWidth, newHeight, newX, newY } = calculateResize(
          direction,
          deltaX,
          deltaY,
          startElementWidth,
          startElementHeight,
          startElementX,
          startElementY
        );

        onSizeChange(elementId, newWidth, newHeight);
        if (newX !== startElementX || newY !== startElementY) {
          onPositionChange(elementId, newX, newY);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        setResizeDirection(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Call onResizeEnd callback if provided
        if (onResizeEnd) {
          setTimeout(() => {
            onResizeEnd();
          }, 50);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [
      elementId,
      elementWidth,
      elementHeight,
      elementX,
      elementY,
      onSizeChange,
      onPositionChange,
      onResizeEnd,
      calculateResize,
    ]
  );

  return {
    isResizing,
    resizeDirection,
    handleResizeStart,
    RESIZE_HANDLES,
    HANDLE_SIZE,
  };
};
