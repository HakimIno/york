import { useState, useCallback } from 'react';

export interface Guideline {
  id: string;
  position: number;
  orientation: 'horizontal' | 'vertical';
  color?: string;
}

export interface GuidelineConfig {
  showGuidelines: boolean;
  snapToGuidelines: boolean;
  guidelineColor: string;
}

const DEFAULT_CONFIG: GuidelineConfig = {
  showGuidelines: true,
  snapToGuidelines: true,
  guidelineColor: '#007AFF',
};

export const useGuidelines = (initialConfig?: Partial<GuidelineConfig>) => {
  const [config, setConfig] = useState<GuidelineConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const [guidelines, setGuidelines] = useState<Guideline[]>([]);

  // Add a new guideline
  const addGuideline = useCallback((position: number, orientation: 'horizontal' | 'vertical') => {
    const newGuideline: Guideline = {
      id: `guideline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      orientation,
      color: config.guidelineColor,
    };

    setGuidelines(prev => [...prev, newGuideline]);
  }, [config.guidelineColor]);

  // Remove a guideline
  const removeGuideline = useCallback((id: string) => {
    setGuidelines(prev => prev.filter(g => g.id !== id));
  }, []);

  // Clear all guidelines
  const clearGuidelines = useCallback(() => {
    setGuidelines([]);
  }, []);

  // Update guideline position
  const updateGuideline = useCallback((id: string, position: number) => {
    setGuidelines(prev => 
      prev.map(g => g.id === id ? { ...g, position } : g)
    );
  }, []);

  // Get guidelines by orientation
  const getGuidelinesByOrientation = useCallback((orientation: 'horizontal' | 'vertical') => {
    return guidelines.filter(g => g.orientation === orientation);
  }, [guidelines]);

  // Check if position should snap to a guideline
  const getSnapPosition = useCallback((position: number, orientation: 'horizontal' | 'vertical', threshold: number = 5) => {
    if (!config.snapToGuidelines) return position;

    const relevantGuidelines = getGuidelinesByOrientation(orientation);
    
    for (const guideline of relevantGuidelines) {
      if (Math.abs(position - guideline.position) <= threshold) {
        return guideline.position;
      }
    }

    return position;
  }, [config.snapToGuidelines, getGuidelinesByOrientation]);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<GuidelineConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return {
    guidelines,
    config,
    addGuideline,
    removeGuideline,
    clearGuidelines,
    updateGuideline,
    getGuidelinesByOrientation,
    getSnapPosition,
    updateConfig,
  };
};
