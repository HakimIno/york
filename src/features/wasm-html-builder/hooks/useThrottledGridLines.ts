import { useCallback, useEffect, useRef, useState } from 'react';

interface ThrottledGridLinesOptions {
    showGrid: boolean;
    gridSize: number;
    canvasSize: { width: number; height: number };
    scrollPosition: { left: number; top: number };
    convertFromUnit: (value: number) => number;
    throttleMs?: number;
}

interface GridLines {
    horizontal: number[];
    vertical: number[];
}

/**
 * Custom hook for throttled grid line generation
 * Prevents recalculation on every scroll/resize event
 */
export const useThrottledGridLines = ({
    showGrid,
    gridSize,
    canvasSize,
    scrollPosition,
    convertFromUnit,
    throttleMs = 100, // Default 100ms throttle
}: ThrottledGridLinesOptions): GridLines => {
    const [gridLines, setGridLines] = useState<GridLines>({
        horizontal: [],
        vertical: [],
    });

    const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastCalculationRef = useRef<number>(0);

    const calculateGridLines = useCallback(() => {
        if (!showGrid) {
            setGridLines({ horizontal: [], vertical: [] });
            return;
        }

        const gridSizePx = convertFromUnit(gridSize);
        const horizontal: number[] = [];
        const vertical: number[] = [];

        // Optimize: Only generate lines for visible area + small buffer
        const bufferSize = gridSizePx * 2;
        const startY = Math.max(0, scrollPosition.top - bufferSize);
        const endY = scrollPosition.top + canvasSize.height + bufferSize;
        const startX = Math.max(0, scrollPosition.left - bufferSize);
        const endX = scrollPosition.left + canvasSize.width + bufferSize;

        // Generate horizontal lines (only visible ones)
        for (let y = Math.floor(startY / gridSizePx) * gridSizePx; y <= endY; y += gridSizePx) {
            horizontal.push(y - scrollPosition.top);
        }

        // Generate vertical lines (only visible ones)
        for (let x = Math.floor(startX / gridSizePx) * gridSizePx; x <= endX; x += gridSizePx) {
            vertical.push(x - scrollPosition.left);
        }

        setGridLines({ horizontal, vertical });
        lastCalculationRef.current = Date.now();
    }, [showGrid, gridSize, canvasSize, scrollPosition, convertFromUnit]);

    // Throttled calculation
    useEffect(() => {
        const now = Date.now();
        const timeSinceLastCalculation = now - lastCalculationRef.current;

        if (timeSinceLastCalculation >= throttleMs) {
            // If enough time has passed, calculate immediately
            calculateGridLines();
        } else {
            // Otherwise, schedule for later
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
            }

            throttleTimeoutRef.current = setTimeout(() => {
                calculateGridLines();
            }, throttleMs - timeSinceLastCalculation);
        }

        return () => {
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
            }
        };
    }, [calculateGridLines, throttleMs]);

    return gridLines;
};
