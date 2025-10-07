import React, { useEffect } from 'react';
import { X, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStylePanel } from './hooks/useStylePanel';
import { StylePanelProps } from './types';
import { OptimizedTabs } from './components/OptimizedTabs';
import { usePerformanceMonitor } from './utils/performanceMonitor';

const StylePanelInternal: React.FC<StylePanelProps> = ({
  element,
  onStyleChange,
  onContentChange,
  onClose,
  styleTemplate,
  onTableCellChange,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onMergeCells,
  onUpdateColumnWidth,
  onUpdateRowHeight,
  // Cell selection props moved to Zustand store
}) => {
  const { startRender, startUpdate } = usePerformanceMonitor('StylePanel');

  // Monitor render performance
  useEffect(() => {
    const stopMeasure = startRender();
    return stopMeasure;
  });
  const {
    localStyle,
    safeStyle,
    formFieldData,
    checkboxData,
    localLineData,
    isTableElement,
    isFormFieldElement,
    isCheckboxElement,
    handleStyleUpdate,
    handleContentUpdate,
    handleLineDataUpdate,
  } = useStylePanel({ element, onStyleChange, onContentChange });

  if (!element || !localStyle || !safeStyle) return null;

  // Wrap style and content updates with performance monitoring
  const monitoredHandleStyleUpdate = React.useCallback(
    (updates: any) => {
      const stopMeasure = startUpdate('style');
      handleStyleUpdate(updates);
      stopMeasure();
    },
    [handleStyleUpdate, startUpdate]
  );

  const monitoredHandleContentUpdate = React.useCallback(
    (updates: any) => {
      const stopMeasure = startUpdate('content');
      handleContentUpdate(updates);
      stopMeasure();
    },
    [handleContentUpdate, startUpdate]
  );

  return (
    <div className="h-full bg-background dark:bg-neutral-950 border-l border-border" style={{ transform: 'translate3d(0,0,0)' }}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-border">
          <div className="flex items-center space-x-2">
            <Layout className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Properties</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Element Info */}
        <div className="px-2 py-1 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
            <Badge variant="outline" className="text-xs">{element.element_type}</Badge>
            <span className="font-mono">#{element.id.slice(-6)}</span>
          </div>

         
        </div>

        <div className="flex-1 overflow-y-auto" style={{ contain: 'layout style' }}>
          <div className="p-4">
            <OptimizedTabs
              element={element}
              localStyle={localStyle}
              safeStyle={safeStyle}
              onStyleUpdate={monitoredHandleStyleUpdate}
              formFieldData={formFieldData}
              localLineData={localLineData}
              onContentUpdate={monitoredHandleContentUpdate}
              onLineDataUpdate={handleLineDataUpdate}
              isTableElement={isTableElement}
              isFormFieldElement={isFormFieldElement}
              isCheckboxElement={isCheckboxElement}
              checkboxData={checkboxData}
              // Cell selection props moved to Zustand store
              onAddRow={onAddRow}
              onRemoveRow={onRemoveRow}
              onAddColumn={onAddColumn}
              onRemoveColumn={onRemoveColumn}
              onUpdateColumnWidth={onUpdateColumnWidth}
              onUpdateRowHeight={onUpdateRowHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Optimized wrapper component with better performance
const StylePanel: React.FC<StylePanelProps> = (props) => {
  // Remove unnecessary loading delay - render immediately for better UX
  return <StylePanelInternal {...props} />;
};

StylePanel.displayName = 'StylePanel';

// Optimized comparison function for React.memo
const arePropsEqual = (prevProps: StylePanelProps, nextProps: StylePanelProps) => {
  // Quick reference equality checks first (most common case)
  if (prevProps.element === nextProps.element && 
      prevProps.styleTemplate === nextProps.styleTemplate &&
      prevProps.onStyleChange === nextProps.onStyleChange &&
      prevProps.onContentChange === nextProps.onContentChange &&
      prevProps.onClose === nextProps.onClose) {
    return true;
  }
  
  // Detailed element comparison only if references differ
  if (prevProps.element?.id !== nextProps.element?.id) return false;
  
  // Use JSON.stringify for deep comparison of style and content (cached)
  const prevStyleStr = prevProps.element?.style ? JSON.stringify(prevProps.element.style) : '';
  const nextStyleStr = nextProps.element?.style ? JSON.stringify(nextProps.element.style) : '';
  if (prevStyleStr !== nextStyleStr) return false;
  
  if (prevProps.element?.content !== nextProps.element?.content) return false;
  if (prevProps.styleTemplate !== nextProps.styleTemplate) return false;
  
  return true;
};

export default React.memo(StylePanel, arePropsEqual);
