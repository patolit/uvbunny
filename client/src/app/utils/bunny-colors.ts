/**
 * Bunny Color Utilities
 *
 * TODO: Move this to backend configuration in the future
 * - Add colors to Firebase configuration collection
 * - Allow admin to add/remove colors
 * - Support custom color hex codes
 * - Add color validation and constraints
 */

export interface BunnyColor {
  name: string;
  hex: string;
}

export const BUNNY_COLORS: BunnyColor[] = [
  { name: 'Brown', hex: '#8B4513' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Black', hex: '#000000' },
  { name: 'Spotted', hex: '#D3D3D3' }
];

/**
 * Get bunny color by name
 * @param colorName - The name of the color
 * @returns The color object or default brown color
 */
export function getBunnyColor(colorName: string | undefined): string {
  if (!colorName) return '#8B4513'; // Default brown
  const color = BUNNY_COLORS.find(c => c.name === colorName);
  return color ? color.hex : '#8B4513';
}

/**
 * Get all available bunny colors
 * @returns Array of all available bunny colors
 */
export function getAvailableBunnyColors(): BunnyColor[] {
  return [...BUNNY_COLORS];
}
