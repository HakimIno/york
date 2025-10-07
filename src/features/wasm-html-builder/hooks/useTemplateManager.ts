'use client';

import { useState, useCallback, useEffect } from 'react';
import { ElementStyle } from '../module/wasm-interface';

export interface StyleTemplate {
  id: string;
  name: string;
  style: Partial<ElementStyle>;
  createdAt: number;
  description?: string;
}

export interface TemplateManagerHook {
  templates: StyleTemplate[];
  currentTemplate: StyleTemplate | null;
  saveTemplate: (
    name: string,
    style: Partial<ElementStyle>,
    description?: string
  ) => void;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  clearCurrentTemplate: () => void;
  exportTemplates: () => string;
  importTemplates: (jsonData: string) => boolean;
}

const STORAGE_KEY = 'wasm-html-builder-templates';

export const useTemplateManager = (): TemplateManagerHook => {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<StyleTemplate | null>(
    null
  );

  // Load templates from localStorage on mount
  useEffect(() => {
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEY);
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates) as StyleTemplate[];
        setTemplates(parsed);
      }
    } catch (error) {
      console.error('Failed to load templates from localStorage:', error);
    }
  }, []);

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save templates to localStorage:', error);
    }
  }, [templates]);

  const saveTemplate = useCallback(
    (name: string, style: Partial<ElementStyle>, description?: string) => {
      const newTemplate: StyleTemplate = {
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        style,
        description,
        createdAt: Date.now(),
      };

      setTemplates(prev => [...prev, newTemplate]);
      setCurrentTemplate(newTemplate);
    },
    []
  );

  const loadTemplate = useCallback(
    (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setCurrentTemplate(template);
      }
    },
    [templates]
  );

  const deleteTemplate = useCallback(
    (templateId: string) => {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      if (currentTemplate?.id === templateId) {
        setCurrentTemplate(null);
      }
    },
    [currentTemplate]
  );

  const clearCurrentTemplate = useCallback(() => {
    setCurrentTemplate(null);
  }, []);

  const exportTemplates = useCallback(() => {
    return JSON.stringify(
      {
        version: '1.0',
        templates,
        exportedAt: Date.now(),
      },
      null,
      2
    );
  }, [templates]);

  const importTemplates = useCallback((jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);

      if (data.templates && Array.isArray(data.templates)) {
        // Validate template structure
        const validTemplates = data.templates.filter(
          (template: any) =>
            template.id &&
            template.name &&
            template.style &&
            typeof template.createdAt === 'number'
        );

        if (validTemplates.length > 0) {
          setTemplates(prev => [...prev, ...validTemplates]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return false;
    }
  }, []);

  return {
    templates,
    currentTemplate,
    saveTemplate,
    loadTemplate,
    deleteTemplate,
    clearCurrentTemplate,
    exportTemplates,
    importTemplates,
  };
};
