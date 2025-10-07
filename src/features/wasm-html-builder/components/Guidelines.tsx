import React from 'react';
import { Guideline } from '../hooks/useGuidelines';

export interface GuidelinesProps {
  guidelines: Guideline[];
  canvasWidth: number;
  canvasHeight: number;
  scrollLeft: number;
  scrollTop: number;
  showGuidelines: boolean;
  onGuidelineClick?: (guideline: Guideline) => void;
  onGuidelineDoubleClick?: (guideline: Guideline) => void;
  // For drag preview
  isDragging?: boolean;
  dragPosition?: number | null;
  dragOrientation?: 'horizontal' | 'vertical';
}

const Guidelines: React.FC<GuidelinesProps> = ({
  guidelines,
  canvasWidth,
  canvasHeight,
  scrollLeft,
  scrollTop,
  showGuidelines,
  onGuidelineClick,
  onGuidelineDoubleClick,
  isDragging = false,
  dragPosition = null,
  dragOrientation = 'horizontal',
}) => {
  if (!showGuidelines && !isDragging) return null;

  return (
    <div
      className="guidelines-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      {guidelines.map((guideline) => {
        const isHorizontal = guideline.orientation === 'horizontal';
        const position = isHorizontal 
          ? guideline.position - scrollTop 
          : guideline.position - scrollLeft;

        // Don't render guidelines that are outside the visible area
        if (position < 0 || (isHorizontal && position > canvasHeight) || (!isHorizontal && position > canvasWidth)) {
          return null;
        }

        return (
          <div
            key={guideline.id}
            className="guideline"
            style={{
              position: 'absolute',
              backgroundColor: guideline.color || '#007AFF',
              opacity: 0.7,
              pointerEvents: 'auto',
              cursor: 'pointer',
              ...(isHorizontal
                ? {
                    top: position,
                    left: 0,
                    width: '100%',
                    height: '1px',
                  }
                : {
                    left: position,
                    top: 0,
                    width: '1px',
                    height: '100%',
                  }
              ),
            }}
            onClick={() => onGuidelineClick?.(guideline)}
            onDoubleClick={() => onGuidelineDoubleClick?.(guideline)}
            title={`${guideline.orientation} guideline at ${guideline.position}px`}
          />
        );
      })}

      {/* Drag preview guideline */}
      {isDragging && dragPosition !== null && (
        <div
          className="guideline-drag-preview"
          style={{
            position: 'absolute',
            backgroundColor: '#007AFF',
            opacity: 0.8,
            pointerEvents: 'none',
            ...(dragOrientation === 'horizontal'
              ? {
                  left: dragPosition - scrollLeft,
                  top: 0,
                  width: '2px',
                  height: '100%',
                }
              : {
                  top: dragPosition - scrollTop,
                  left: 0,
                  width: '100%',
                  height: '2px',
                }
            ),
          }}
        />
      )}
    </div>
  );
};

export default Guidelines;
