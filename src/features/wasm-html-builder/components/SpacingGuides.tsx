import React, { useMemo } from 'react';
import { Element } from '../module/wasm-interface';

interface SpacingGuidesProps {
    elements: Element[];
    selectedElementId: string | null;
    showSpacingGuides?: boolean;
    zoom?: number;
    scrollPosition?: { left: number; top: number };
}

interface SpacingMeasurement {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    distance: number;
    orientation: 'horizontal' | 'vertical';
    label: string;
}

/**
 * SpacingGuides Component
 * Shows intelligent spacing measurements between elements
 * Helps users align elements beautifully with visual distance indicators
 */
const SpacingGuides: React.FC<SpacingGuidesProps> = ({
    elements,
    selectedElementId,
    showSpacingGuides = true,
    zoom = 1,
    scrollPosition = { left: 0, top: 0 },
}) => {
    // Calculate spacing measurements for selected element
    const spacingMeasurements = useMemo((): SpacingMeasurement[] => {
        if (!showSpacingGuides || !selectedElementId) return [];

        const selectedElement = elements.find(el => el.id === selectedElementId);
        if (!selectedElement) return [];

        const measurements: SpacingMeasurement[] = [];
        const threshold = 500; // Only show measurements for elements within 500px

        // Helper to convert world coordinates to screen coordinates
        const toScreen = (val: number) => val * zoom;

        // Calculate bounds of selected element in World Space
        const selectedBounds = {
            left: selectedElement.x,
            right: selectedElement.x + selectedElement.width,
            top: selectedElement.y,
            bottom: selectedElement.y + selectedElement.height,
        };

        elements.forEach(element => {
            if (element.id === selectedElementId) return;

            const elementBounds = {
                left: element.x,
                right: element.x + element.width,
                top: element.y,
                bottom: element.y + element.height,
            };

            // Horizontal spacing measurements
            // Element is to the right
            if (elementBounds.left >= selectedBounds.right) {
                const distance = elementBounds.left - selectedBounds.right;
                if (distance <= threshold) {
                    const verticalOverlap = !(
                        elementBounds.bottom < selectedBounds.top ||
                        elementBounds.top > selectedBounds.bottom
                    );

                    if (verticalOverlap) {
                        const y = Math.max(selectedBounds.top, elementBounds.top) +
                            Math.min(
                                selectedBounds.bottom - Math.max(selectedBounds.top, elementBounds.top),
                                elementBounds.bottom - Math.max(selectedBounds.top, elementBounds.top)
                            ) / 2;

                        measurements.push({
                            id: `h-${selectedElementId}-${element.id}`,
                            x1: toScreen(selectedBounds.right),
                            y1: toScreen(y),
                            x2: toScreen(elementBounds.left),
                            y2: toScreen(y),
                            distance: Math.round(distance),
                            orientation: 'horizontal',
                            label: `${Math.round(distance)}px`,
                        });
                    }
                }
            }

            // Element is to the left
            if (elementBounds.right <= selectedBounds.left) {
                const distance = selectedBounds.left - elementBounds.right;
                if (distance <= threshold) {
                    const verticalOverlap = !(
                        elementBounds.bottom < selectedBounds.top ||
                        elementBounds.top > selectedBounds.bottom
                    );

                    if (verticalOverlap) {
                        const y = Math.max(selectedBounds.top, elementBounds.top) +
                            Math.min(
                                selectedBounds.bottom - Math.max(selectedBounds.top, elementBounds.top),
                                elementBounds.bottom - Math.max(selectedBounds.top, elementBounds.top)
                            ) / 2;

                        measurements.push({
                            id: `h-${element.id}-${selectedElementId}`,
                            x1: toScreen(elementBounds.right),
                            y1: toScreen(y),
                            x2: toScreen(selectedBounds.left),
                            y2: toScreen(y),
                            distance: Math.round(distance),
                            orientation: 'horizontal',
                            label: `${Math.round(distance)}px`,
                        });
                    }
                }
            }

            // Vertical spacing measurements
            // Element is below
            if (elementBounds.top >= selectedBounds.bottom) {
                const distance = elementBounds.top - selectedBounds.bottom;
                if (distance <= threshold) {
                    const horizontalOverlap = !(
                        elementBounds.right < selectedBounds.left ||
                        elementBounds.left > selectedBounds.right
                    );

                    if (horizontalOverlap) {
                        const x = Math.max(selectedBounds.left, elementBounds.left) +
                            Math.min(
                                selectedBounds.right - Math.max(selectedBounds.left, elementBounds.left),
                                elementBounds.right - Math.max(selectedBounds.left, elementBounds.left)
                            ) / 2;

                        measurements.push({
                            id: `v-${selectedElementId}-${element.id}`,
                            x1: toScreen(x),
                            y1: toScreen(selectedBounds.bottom),
                            x2: toScreen(x),
                            y2: toScreen(elementBounds.top),
                            distance: Math.round(distance),
                            orientation: 'vertical',
                            label: `${Math.round(distance)}px`,
                        });
                    }
                }
            }

            // Element is above
            if (elementBounds.bottom <= selectedBounds.top) {
                const distance = selectedBounds.top - elementBounds.bottom;
                if (distance <= threshold) {
                    const horizontalOverlap = !(
                        elementBounds.right < selectedBounds.left ||
                        elementBounds.left > selectedBounds.right
                    );

                    if (horizontalOverlap) {
                        const x = Math.max(selectedBounds.left, elementBounds.left) +
                            Math.min(
                                selectedBounds.right - Math.max(selectedBounds.left, elementBounds.left),
                                elementBounds.right - Math.max(selectedBounds.left, elementBounds.left)
                            ) / 2;

                        measurements.push({
                            id: `v-${element.id}-${selectedElementId}`,
                            x1: toScreen(x),
                            y1: toScreen(elementBounds.bottom),
                            x2: toScreen(x),
                            y2: toScreen(selectedBounds.top),
                            distance: Math.round(distance),
                            orientation: 'vertical',
                            label: `${Math.round(distance)}px`,
                        });
                    }
                }
            }
        });

        return measurements;
    }, [elements, selectedElementId, showSpacingGuides, zoom]);

    if (!showSpacingGuides || spacingMeasurements.length === 0) {
        return null;
    }

    // Apply scroll offset to the SVG group to align with viewport
    return (
        <svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            style={{ zIndex: 9999 }}
        >
            {spacingMeasurements.map(measurement => {
                const isHorizontal = measurement.orientation === 'horizontal';
                const midX = (measurement.x1 + measurement.x2) / 2;
                const midY = (measurement.y1 + measurement.y2) / 2;

                return (
                    <g key={measurement.id}>
                        {/* Main line */}
                        <line
                            x1={measurement.x1}
                            y1={measurement.y1}
                            x2={measurement.x2}
                            y2={measurement.y2}
                            stroke="#FF6B6B"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                        />

                        {/* End caps */}
                        {isHorizontal ? (
                            <>
                                <line
                                    x1={measurement.x1}
                                    y1={measurement.y1 - 6}
                                    x2={measurement.x1}
                                    y2={measurement.y1 + 6}
                                    stroke="#FF6B6B"
                                    strokeWidth="1.5"
                                />
                                <line
                                    x1={measurement.x2}
                                    y1={measurement.y2 - 6}
                                    x2={measurement.x2}
                                    y2={measurement.y2 + 6}
                                    stroke="#FF6B6B"
                                    strokeWidth="1.5"
                                />
                            </>
                        ) : (
                            <>
                                <line
                                    x1={measurement.x1 - 6}
                                    y1={measurement.y1}
                                    x2={measurement.x1 + 6}
                                    y2={measurement.y1}
                                    stroke="#FF6B6B"
                                    strokeWidth="1.5"
                                />
                                <line
                                    x1={measurement.x2 - 6}
                                    y1={measurement.y2}
                                    x2={measurement.x2 + 6}
                                    y2={measurement.y2}
                                    stroke="#FF6B6B"
                                    strokeWidth="1.5"
                                />
                            </>
                        )}

                        {/* Label background */}
                        <rect
                            x={midX - 25}
                            y={midY - 10}
                            width="50"
                            height="20"
                            fill="#FF6B6B"
                            rx="3"
                        />

                        {/* Label text */}
                        <text
                            x={midX}
                            y={midY + 5}
                            textAnchor="middle"
                            fill="white"
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="system-ui, -apple-system, sans-serif"
                        >
                            {measurement.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

export default SpacingGuides;
