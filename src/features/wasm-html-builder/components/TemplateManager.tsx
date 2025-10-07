'use client';

import React, { useState, useCallback } from 'react';
import { StyleTemplate } from '../hooks/useTemplateManager';
import { ElementStyle } from '../module/wasm-interface';
import { Icon } from '@iconify/react';

interface TemplateManagerProps {
  templates: StyleTemplate[];
  currentTemplate: StyleTemplate | null;
  onSaveTemplate: (
    name: string,
    style: Partial<ElementStyle>,
    description?: string
  ) => void;
  onLoadTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onClearTemplate: () => void;
  onExportTemplates: () => string;
  onImportTemplates: (jsonData: string) => boolean;
  currentStyle?: Partial<ElementStyle>;
  onClose: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  currentTemplate,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onClearTemplate,
  onExportTemplates,
  onImportTemplates,
  currentStyle,
  onClose,
}) => {
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importData, setImportData] = useState('');

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim() || !currentStyle) return;

    onSaveTemplate(
      templateName.trim(),
      currentStyle,
      templateDescription.trim() || undefined
    );
    setTemplateName('');
    setTemplateDescription('');
    setShowSaveForm(false);
  }, [templateName, templateDescription, currentStyle, onSaveTemplate]);

  const handleImportTemplates = useCallback(() => {
    if (!importData.trim()) return;

    const success = onImportTemplates(importData.trim());
    if (success) {
      setImportData('');
      setShowImportForm(false);
      alert('Templates imported successfully!');
    } else {
      alert('Failed to import templates. Please check the format.');
    }
  }, [importData, onImportTemplates]);

  const handleExportTemplates = useCallback(() => {
    const data = onExportTemplates();

    // Create download link
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `style-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [onExportTemplates]);

  const formatStylePreview = (style: Partial<ElementStyle>) => {
    const preview = [];
    if (style.fontSize) preview.push(`${style.fontSize}px`);
    if (style.fontFamily) preview.push(style.fontFamily.split(',')[0]);
    if (style.fontWeight && style.fontWeight !== 'normal')
      preview.push(style.fontWeight);
    if (style.color && style.color !== '#000000') preview.push(style.color);
    return preview.join(', ') || 'Default style';
  };

  return (
    <div className="fixed right-4 top-20 w-96 bg-white shadow-xl border border-gray-200 rounded-lg z-50 max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Style Templates</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 text-gray-400 hover:text-gray-600 flex items-center justify-center"
        >
          <Icon icon="hugeicons:cancel-01" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col h-full max-h-[calc(80vh-60px)]">
        {/* Current Template Status */}
        {currentTemplate && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-800">
                  Active Template
                </div>
                <div className="text-sm text-blue-600">
                  {currentTemplate.name}
                </div>
              </div>
              <button
                onClick={onClearTemplate}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              disabled={!currentStyle}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                currentStyle
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Icon icon="hugeicons:save-01" className="w-4 h-4 inline mr-1" />
              Save Template
            </button>

            <button
              onClick={handleExportTemplates}
              disabled={templates.length === 0}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                templates.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Icon
                icon="hugeicons:download-01"
                className="w-4 h-4 inline mr-1"
              />
              Export
            </button>
          </div>

          <button
            onClick={() => setShowImportForm(!showImportForm)}
            className="w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            <Icon icon="hugeicons:upload-01" className="w-4 h-4 inline mr-1" />
            Import Templates
          </button>
        </div>

        {/* Save Template Form */}
        {showSaveForm && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="My Custom Style"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={e => setTemplateDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${
                    templateName.trim()
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveForm(false);
                    setTemplateName('');
                    setTemplateDescription('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Templates Form */}
        {showImportForm && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Paste Template JSON
                </label>
                <textarea
                  value={importData}
                  onChange={e => setImportData(e.target.value)}
                  placeholder='{"version":"1.0","templates":[...]}'
                  rows={4}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none font-mono"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleImportTemplates}
                  disabled={!importData.trim()}
                  className={`flex-1 px-3 py-1 text-sm rounded-md transition-colors ${
                    importData.trim()
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImportForm(false);
                    setImportData('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Icon
                icon="hugeicons:folder-open"
                className="w-12 h-12 mx-auto mb-2 text-gray-300"
              />
              <p className="text-sm">No templates saved yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Create a style and save it as a template
              </p>
            </div>
          ) : (
            <div className="p-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`p-3 mb-2 rounded-lg border transition-colors cursor-pointer ${
                    currentTemplate?.id === template.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => onLoadTemplate(template.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {template.name}
                        </h4>
                        {currentTemplate?.id === template.id && (
                          <Icon
                            icon="hugeicons:checkmark-circle-02"
                            className="w-4 h-4 text-blue-500 flex-shrink-0"
                          />
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {formatStylePreview(template.style)}
                      </p>

                      {template.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {template.description}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Delete template "${template.name}"?`)) {
                          onDeleteTemplate(template.id);
                        }
                      }}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Icon icon="hugeicons:delete-02" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;
