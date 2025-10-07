/**
 * Calculate center position for papers based on viewport size
 */
export const calculateCenterPosition = (
  paperWidth: number = 794, // A4 width at 96 DPI (standard web size)
  paperHeight: number = 1123, // A4 height at 96 DPI (standard web size)
  margin: number = 50
) => {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  
  // Calculate center position with margin
  const centerX = Math.max(margin, (viewportWidth - paperWidth) / 2);
  const centerY = Math.max(margin, (viewportHeight - paperHeight - 200) / 2); // Account for header/controls
  
  return { x: centerX, y: centerY };
};

/**
 * Get A4 paper dimensions
 */
export const getA4Dimensions = () => ({
  portrait: { width: 794, height: 1123 },
  landscape: { width: 1123, height: 794 },
});

/**
 * Get A5 paper dimensions
 */
export const getA5Dimensions = () => ({
  portrait: { width: 559, height: 794 }, // A5 portrait at 96 DPI (standard web size)
  landscape: { width: 794, height: 559 }, // A5 landscape at 96 DPI (standard web size)
});
