import React, { useCallback, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';

interface PerformanceSliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
  debounceMs?: number;
}

/**
 * Performance-optimized Slider component with debouncing
 * to prevent excessive re-renders during dragging
 */
export const PerformanceSlider: React.FC<PerformanceSliderProps> = React.memo(({
  value,
  onValueChange,
  min,
  max,
  step,
  className,
  debounceMs = 30, // Reduced default for better responsiveness
}) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  const debouncedOnValueChange = useCallback(
    (newValue: number[]) => {
      setLocalValue(newValue);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // If dragging, debounce the callback with shorter delay
      if (isDraggingRef.current) {
        timeoutRef.current = setTimeout(() => {
          onValueChange(newValue);
        }, Math.min(debounceMs, 30)); // Cap at 30ms for better responsiveness
      } else {
        // If not dragging (single click), call immediately
        onValueChange(newValue);
      }
    },
    [onValueChange, debounceMs]
  );

  const handlePointerDown = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    // Ensure final value is sent immediately when dragging stops
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      onValueChange(localValue);
    }
  }, [localValue, onValueChange]);

  // Sync local value with prop value when not dragging
  React.useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Slider
      value={localValue}
      onValueChange={debouncedOnValueChange}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      min={min}
      max={max}
      step={step}
      className={className}
    />
  );
});

PerformanceSlider.displayName = 'PerformanceSlider';

export default PerformanceSlider;
