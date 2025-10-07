import { ElementStyle } from '../../module/wasm-interface';

export const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Courier New, monospace', label: 'Courier New' },
] as const;

export const STYLE_PRESETS: Array<{ name: string; style: Partial<ElementStyle> }> = [
  {
    name: 'Heading',
    style: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: '#1f2937',
      backgroundColor: '#f3f4f6',
    },
  },
  {
    name: 'Body Text',
    style: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      color: '#374151',
      backgroundColor: '#ffffff',
    },
  },
  {
    name: 'Button',
    style: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: '#ffffff',
      backgroundColor: '#3b82f6',
      borderRadius: 6,
    },
  },
  {
    name: 'Caption',
    style: {
      fontSize: 12,
      fontStyle: 'italic' as const,
      color: '#6b7280',
      backgroundColor: '#f9fafb',
    },
  },
];

export const UNDERLINE_STYLES = [
  { value: 'solid', label: 'Solid', preview: '━━━━━━' },
  { value: 'dashed', label: 'Dashed', preview: '┅┅┅┅┅┅' },
  { value: 'dotted', label: 'Dotted', preview: '┈┈┈┈┈┈' },
  { value: 'double', label: 'Double', preview: '═══' },
] as const;

export const TEXT_ALIGNMENTS = ['left', 'center', 'right'] as const;

export const SLIDER_CONFIGS = {
  fontSize: { min: 8, max: 72, step: 1 },
  padding: { min: 0, max: 50, step: 1 },
  borderRadius: { min: 0, max: 50, step: 1 },
  borderWidth: { min: 0, max: 10, step: 1 },
  gap: { min: 0, max: 50, step: 1 },
  labelWidth: { min: 10, max: 80, step: 5 },
  valueWidth: { min: 20, max: 90, step: 5 },
} as const;
