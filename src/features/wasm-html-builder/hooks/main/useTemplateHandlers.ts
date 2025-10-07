import { useCallback, useEffect } from 'react';
import { ElementStyle } from '../../module/wasm-interface';
import { useWasmBuilderState } from '../useWasmBuilderState';

interface UseTemplateHandlersProps {
  templateManager: any;
  state: ReturnType<typeof useWasmBuilderState>;
}

export const useTemplateHandlers = ({
  templateManager,
  state,
}: UseTemplateHandlersProps) => {
  const handleSaveTemplate = useCallback(
    (name: string, style: Partial<ElementStyle>, description?: string) => {
      templateManager.saveTemplate(name, style, description);
      state.setStyleTemplate(style);
    },
    [templateManager, state.setStyleTemplate]
  );

  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      templateManager.loadTemplate(templateId);
      const template = templateManager.templates.find((t: any) => t.id === templateId);
      if (template) {
        state.setStyleTemplate(template.style);
      }
    },
    [templateManager, state.setStyleTemplate]
  );

  const handleClearTemplate = useCallback(() => {
    state.clearTemplate();
    templateManager.clearCurrentTemplate();
  }, [state, templateManager]);

  // Sync template manager's current template with local state
  useEffect(() => {
    if (templateManager.currentTemplate) {
      state.setStyleTemplate(templateManager.currentTemplate.style);
    }
  }, [templateManager.currentTemplate, state.setStyleTemplate]);

  return {
    handleSaveTemplate,
    handleLoadTemplate,
    handleClearTemplate,
  };
};
