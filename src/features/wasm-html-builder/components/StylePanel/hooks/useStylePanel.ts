import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Element, ElementStyle } from '../../../module/wasm-interface';
import { getWasmInstance } from '../../../module/wasm-interface';
import { StylePanelProps } from '../types';

const formFieldParseCache = new Map<string, any>();

type LocalElementStyle = ElementStyle & { __elementId?: string };

export const useStylePanel = ({
  element,
  onStyleChange,
  onContentChange,
}: Pick<StylePanelProps, 'element' | 'onStyleChange' | 'onContentChange'>) => {
  const [localStyle, setLocalStyle] = useState<LocalElementStyle | null>(
    element ? { ...element.style } : null
  );
  const [localLineData, setLocalLineData] = useState<any>(null);

  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (element && (!localStyle || element.id !== localStyle.__elementId)) {
      const elementStyle = {
        ...element.style,
        fill: element.style.fill || { color: '#ffffff', opacity: 1.0, enabled: true },
        stroke: element.style.stroke || { color: '#000000', opacity: 1.0, width: 1.0, position: 'inside' as const, style: 'solid' as const, enabled: true },
        __elementId: element.id
      };
      setLocalStyle(elementStyle);
    }
  }, [element?.id, element?.style, localStyle]);

  useEffect(() => {
    if (element && element.element_type === 'line') {
      try {
        const parsedData = JSON.parse(element.content || '{}');
        setLocalLineData(parsedData);
      } catch {
        setLocalLineData({
          lineType: 'straight',
          startX: 0,
          startY: 0,
          endX: element.width,
          endY: 0,
          arrowStart: false,
          arrowEnd: false,
        });
      }
    }
  }, [element?.id, element?.content, element?.element_type, element?.width]);

  const styleUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStyleUpdate = useCallback(
    (updates: Partial<ElementStyle>) => {
      if (!element || !localStyle) return;

      const newStyle = { ...localStyle };
      
      if (updates.fill) {
        newStyle.fill = { ...newStyle.fill, ...updates.fill };
      }
      if (updates.stroke) {
        newStyle.stroke = { ...newStyle.stroke, ...updates.stroke };
      }
      
      Object.keys(updates).forEach(key => {
        if (key !== 'fill' && key !== 'stroke') {
          (newStyle as any)[key] = (updates as any)[key];
        }
      });

      setLocalStyle(newStyle);

      if (styleUpdateTimeoutRef.current) {
        clearTimeout(styleUpdateTimeoutRef.current);
      }

      styleUpdateTimeoutRef.current = setTimeout(() => {
        onStyleChange(element.id, updates);
      }, 50);
    },
    [element?.id, localStyle, onStyleChange]
  );

  const handleContentUpdate = useCallback(
    (updates: any) => {
      if (!element) return;

      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }

      contentUpdateTimeoutRef.current = setTimeout(() => {
        try {
          const currentData = JSON.parse(element.content || '{}');
          const newData = { ...currentData, ...updates };
          onContentChange(element.id, JSON.stringify(newData));
        } catch (error) {
          console.error('Error updating content:', error);
        }
      }, element.element_type === 'line' ? 200 : 50);
    },
    [element?.id, element?.content, element?.element_type, onContentChange]
  );

  const handleLineDataUpdate = useCallback(
    (updates: any) => {
      if (!element || element.element_type !== 'line') return;

      setLocalLineData((prev: any) => ({ ...prev, ...updates }));

      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }

      contentUpdateTimeoutRef.current = setTimeout(() => {
        try {
          const currentData = localLineData || JSON.parse(element.content || '{}');
          const newData = { ...currentData, ...updates };
          onContentChange(element.id, JSON.stringify(newData));
        } catch (error) {
          console.error('Error updating line data:', error);
        }
      }, 300);
    },
    [element?.id, element?.content, element?.element_type, localLineData, onContentChange]
  );

  const safeStyle = useMemo(() => {
    if (!localStyle) return null;
    
    const defaults = {
      fontSize: 16,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'normal' as const,
      fontStyle: 'normal' as const,
      color: '#000000',
      backgroundColor: '#ffffff',
      textAlign: 'left' as const,
      padding: 0,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#cccccc',
      fill: {
        color: '#ffffff',
        opacity: 1.0,
        enabled: true,
      },
      stroke: {
        color: '#000000',
        opacity: 1.0,
        width: 1.0,
        position: 'inside' as const,
        style: 'solid' as const,
        enabled: true,
      },
    };
    
    return {
      fontSize: localStyle.fontSize ?? defaults.fontSize,
      fontFamily: localStyle.fontFamily ?? defaults.fontFamily,
      fontWeight: localStyle.fontWeight ?? defaults.fontWeight,
      fontStyle: localStyle.fontStyle ?? defaults.fontStyle,
      color: localStyle.color ?? defaults.color,
      backgroundColor: localStyle.backgroundColor ?? defaults.backgroundColor,
      textAlign: localStyle.textAlign ?? defaults.textAlign,
      padding: localStyle.padding ?? defaults.padding,
      borderRadius: localStyle.borderRadius ?? defaults.borderRadius,
      borderWidth: localStyle.borderWidth ?? defaults.borderWidth,
      borderColor: localStyle.borderColor ?? defaults.borderColor,
      fill: localStyle.fill ?? defaults.fill,
      stroke: localStyle.stroke ?? defaults.stroke,
    };
  }, [localStyle]);

  const formFieldData = useMemo(() => {
    if (!element || element.element_type !== 'form_field') return null;
    
    const contentKey = `${element.id}-${element.content || ''}`;
    
    let parsed;
    if (formFieldParseCache.has(contentKey)) {
      parsed = formFieldParseCache.get(contentKey);
    } else {
      try {
        parsed = JSON.parse(element.content || '{}');
        formFieldParseCache.set(contentKey, parsed);
        if (formFieldParseCache.size > 50) {
          const firstKey = formFieldParseCache.keys().next().value;
          if (firstKey) formFieldParseCache.delete(firstKey);
        }
      } catch {
        parsed = {};
        formFieldParseCache.set(contentKey, parsed);
      }
    }
    
    return {
      showLabel: parsed.showLabel ?? true,
      gap: parsed.gap ?? 8,
      labelWidth: parsed.labelWidth ?? 30,
      valueWidth: parsed.valueWidth ?? 70,
      underlineStyle: parsed.underlineStyle ?? 'solid',
    };
  }, [element?.id, element?.content, element?.element_type]);

  const isTableElement = useMemo(() => 
    element?.element_type === 'table',
    [element?.element_type]
  );
  
  const isFormFieldElement = useMemo(() => 
    element?.element_type === 'form_field',
    [element?.element_type]
  );

  const checkboxData = useMemo(() => {
    if (!element || element.element_type !== 'checkbox') return null;
    
    try {
      const parsed = JSON.parse(element.content || '{}');
      return {
        label: parsed.label ?? 'Checkbox',
        checked: parsed.checked ?? false,
        showLabel: parsed.showLabel !== false,
        labelPosition: parsed.labelPosition ?? 'right',
        checkboxStyle: parsed.checkboxStyle ?? 'square',
        boxSize: parsed.boxSize ?? 15,
        fontSize: parsed.fontSize ?? 12,
        labelGap: parsed.labelGap ?? 4,
      };
    } catch {
      return {
        label: 'Checkbox',
        checked: false,
        showLabel: true,
        labelPosition: 'right',
        checkboxStyle: 'square',
        boxSize: 15,
        fontSize: 12,
        labelGap: 4,
      };
    }
  }, [element?.id, element?.content, element?.element_type]);

  const isCheckboxElement = useMemo(() => 
    element?.element_type === 'checkbox',
    [element?.element_type]
  );


  useEffect(() => {
    return () => {
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
      }
      if (styleUpdateTimeoutRef.current) {
        clearTimeout(styleUpdateTimeoutRef.current);
      }
    };
  }, []);

  return {
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
  };
};