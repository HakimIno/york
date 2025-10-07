import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Palette, Layout, Shapes, CheckSquare } from 'lucide-react';
import {
  LazyTypographyTab,
  LazyColorsTab,
  LazyLayoutTab,
  LazyFormFieldTab,
  LazyTableTab,
} from './LazyTabContent';
import FillStrokeControls from './FillStrokeControls';
import CheckboxTab from './CheckboxTab';
import { TabProps, FormFieldTabProps, TableTabProps } from '../types';

interface OptimizedTabsProps {
  element: TabProps['element'];
  localStyle: TabProps['localStyle'];
  safeStyle: TabProps['safeStyle'];
  onStyleUpdate: TabProps['onStyleUpdate'];
  formFieldData: FormFieldTabProps['formFieldData'];
  localLineData: any;
  onContentUpdate: FormFieldTabProps['onContentUpdate'];
  onLineDataUpdate: (updates: any) => void;
  isTableElement: boolean;
  isFormFieldElement: boolean;
  isCheckboxElement: boolean;
  checkboxData: any;
  // Table-specific props moved to Zustand store
  onAddRow?: (elementId: string, atIndex?: number) => void;
  onRemoveRow?: (elementId: string, index: number) => void;
  onAddColumn?: (elementId: string, atIndex?: number) => void;
  onRemoveColumn?: (elementId: string, index: number) => void;
  onUpdateColumnWidth?: (elementId: string, columnIndex: number, width: number) => void;
  onUpdateRowHeight?: (elementId: string, rowIndex: number, height: number) => void;
}

export const OptimizedTabs: React.FC<OptimizedTabsProps> = React.memo(({
  element,
  localStyle,
  safeStyle,
  onStyleUpdate,
  formFieldData,
  localLineData,
  onContentUpdate,
  onLineDataUpdate,
  isTableElement,
  isFormFieldElement,
  isCheckboxElement,
  checkboxData,
  onAddRow,
  onRemoveRow,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumnWidth,
  onUpdateRowHeight,
}) => {
  // Check if element is a shape
  const isShapeElement = useMemo(() => {
    return element && ['rectangle', 'circle', 'line'].includes(element.element_type);
  }, [element]);

  // Set default tab based on element type
  const getDefaultTab = useCallback(() => {
    if (isTableElement) return 'table';
    if (isFormFieldElement) return 'form_field';
    if (isCheckboxElement) return 'checkbox';
    if (isShapeElement) return 'fill_stroke';
    if (element && ['text', 'heading', 'paragraph', 'span', 'div'].includes(element.element_type)) {
      return 'typography';
    }
    return 'colors'; // Default to colors for most elements
  }, [isTableElement, isFormFieldElement, isCheckboxElement, isShapeElement, element?.element_type]);

  const [activeTab, setActiveTab] = useState(getDefaultTab);

  // Reset active tab only when element ID or element type changes
  useEffect(() => {
    const newDefaultTab = getDefaultTab();
    setActiveTab(newDefaultTab);
  }, [element?.id, element?.element_type, getDefaultTab]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  // Memoize tab configuration based on element type
  const tabConfig = useMemo(() => {
    const tabs = [];

    // Show Typography tab only for text elements
    if (element && ['text', 'heading', 'paragraph', 'span', 'div'].includes(element.element_type)) {
      tabs.push({ value: 'typography', label: 'Text', icon: Type });
    }

    // Show Colors tab for non-shape elements (shapes use Fill & Stroke instead)
    if (element && !['rectangle', 'circle', 'line'].includes(element.element_type)) {
      tabs.push({ value: 'colors', label: 'Colors', icon: Palette });
    }

    // Show Layout tab for most elements (except pure shapes)
    if (element && !['rectangle', 'circle', 'line'].includes(element.element_type)) {
      tabs.push({ value: 'layout', label: 'Layout', icon: Layout });
    }

    // Show Fill & Stroke tab only for shape elements
    if (isShapeElement) {
      tabs.push({ value: 'fill_stroke', label: 'Fill & Stroke', icon: Shapes });
    }

    // Show Table tab only for table elements
    if (isTableElement) {
      tabs.push({ value: 'table', label: 'Table', icon: Layout });
    }

    // Show Form tab only for form field elements
    if (isFormFieldElement) {
      tabs.push({ value: 'form_field', label: 'Form', icon: Layout });
    }

    // Show Checkbox tab only for checkbox elements
    if (isCheckboxElement) {
      tabs.push({ value: 'checkbox', label: 'Checkbox', icon: CheckSquare });
    }

    return tabs;
  }, [isTableElement, isFormFieldElement, isCheckboxElement, isShapeElement, element]);

  // Only render the active tab content to improve performance
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'typography':
        return (
          <TabsContent value="typography" className="mt-4">
            <LazyTypographyTab
              element={element}
              localStyle={localStyle}
              safeStyle={safeStyle}
              onStyleUpdate={onStyleUpdate}
            />
          </TabsContent>
        );
      case 'colors':
        return (
          <TabsContent value="colors" className="mt-4">
            <LazyColorsTab
              element={element}
              localStyle={localStyle}
              safeStyle={safeStyle}
              onStyleUpdate={onStyleUpdate}
            />
          </TabsContent>
        );
      case 'layout':
        return (
          <TabsContent value="layout" className="mt-4">
            <LazyLayoutTab
              element={element}
              localStyle={localStyle}
              safeStyle={safeStyle}
              onStyleUpdate={onStyleUpdate}
            />
          </TabsContent>
        );
      case 'table':
        return isTableElement ? (
          <TabsContent value="table" className="mt-4">
            <LazyTableTab
              element={element}
              localStyle={localStyle}
              safeStyle={safeStyle}
              onStyleUpdate={onStyleUpdate}
              // Cell selection props moved to Zustand store
              onAddRow={onAddRow}
              onRemoveRow={onRemoveRow}
              onAddColumn={onAddColumn}
              onRemoveColumn={onRemoveColumn}
              onUpdateColumnWidth={onUpdateColumnWidth}
              onUpdateRowHeight={onUpdateRowHeight}
            />
          </TabsContent>
        ) : null;
      case 'fill_stroke':
        return isShapeElement ? (
          <TabsContent value="fill_stroke" className="mt-4">
            <FillStrokeControls
              fill={{
                color: localStyle.fill?.color || '#ffffff',
                opacity: localStyle.fill?.opacity || 1.0,
                enabled: localStyle.fill?.enabled !== false,
              }}
              stroke={{
                color: localStyle.stroke?.color || '#000000',
                opacity: localStyle.stroke?.opacity || 1.0,
                width: localStyle.stroke?.width || 1.0,
                position: (localStyle.stroke?.position as 'inside' | 'outside' | 'center') || 'inside',
                style: (localStyle.stroke?.style as 'solid' | 'dashed' | 'dotted') || 'solid',
                enabled: localStyle.stroke?.enabled !== false,
              }}
              elementType={element.element_type}
              lineData={element.element_type === 'line' ? localLineData : undefined}
              onLineDataChange={element.element_type === 'line' ? onLineDataUpdate : undefined}
              onFillChange={(updates) => {
                const currentFill = localStyle.fill || { color: '#ffffff', opacity: 1.0, enabled: true };
                onStyleUpdate({
                  fill: { ...currentFill, ...updates }
                });
              }}
              onStrokeChange={(updates) => {
                const currentStroke = localStyle.stroke || { 
                  color: '#000000', 
                  opacity: 1.0, 
                  width: 1.0, 
                  position: 'inside' as const, 
                  style: 'solid' as const, 
                  enabled: true 
                };
                onStyleUpdate({
                  stroke: { 
                    ...currentStroke, 
                    ...updates,
                    position: updates.position as 'inside' | 'outside' | 'center' || currentStroke.position,
                    style: updates.style as 'solid' | 'dashed' | 'dotted' || currentStroke.style
                  }
                });
              }}
            />
          </TabsContent>
        ) : null;
      case 'form_field':
        return isFormFieldElement ? (
          <TabsContent value="form_field" className="mt-4">
            <LazyFormFieldTab
              element={element}
              localStyle={localStyle}
              safeStyle={safeStyle}
              onStyleUpdate={onStyleUpdate}
              formFieldData={formFieldData}
              onContentUpdate={onContentUpdate}
            />
          </TabsContent>
        ) : null;
      case 'checkbox':
        return isCheckboxElement ? (
          <TabsContent value="checkbox" className="mt-4">
            <CheckboxTab
              checkboxData={checkboxData}
              onContentUpdate={onContentUpdate}
            />
          </TabsContent>
        ) : null;
      default:
        return null;
    }
  }, [
    activeTab,
    element,
    localStyle,
    safeStyle,
    onStyleUpdate,
    formFieldData,
    localLineData,
    onContentUpdate,
    onLineDataUpdate,
    isTableElement,
    isFormFieldElement,
    isCheckboxElement,
    checkboxData,
    isShapeElement,
    onAddRow,
    onRemoveRow,
    onAddColumn,
    onRemoveColumn,
    onUpdateColumnWidth,
    onUpdateRowHeight,
  ]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList 
        className="grid w-full h-8" 
        style={{ gridTemplateColumns: `repeat(${tabConfig.length}, 1fr)` }}
      >
        {tabConfig.map(({ value, label, icon: Icon }) => (
          <TabsTrigger 
            key={value} 
            value={value} 
            className="text-xs flex items-center space-x-1"
          >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {renderTabContent()}
    </Tabs>
  );
});

OptimizedTabs.displayName = 'OptimizedTabs';

export default OptimizedTabs;
