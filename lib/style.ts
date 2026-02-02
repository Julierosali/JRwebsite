/**
 * Utilitaires pour le style du site (fond, blocs).
 */

export const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a3a52 0%, #2d5a7b 25%, #e07c4a 70%, #c96538 100%)';
export const DEFAULT_ACCENT_COLOR = '#6b4e9e';
export const DEFAULT_ACCENT_OPACITY = 0.72;

/** Clés de polices utilisées pour --font-xxx dans le layout (voir app/layout.tsx). */
export const TITLE_FONT_DEFAULT = 'anton';
export const BODY_FONT_DEFAULT = 'source_sans';

export const FONT_OPTIONS = [
  { value: 'anton', label: 'Anton' },
  { value: 'source_sans', label: 'Source Sans 3' },
  { value: 'playfair_display', label: 'Playfair Display' },
  { value: 'lora', label: 'Lora' },
] as const;

export type StyleContent = {
  backgroundGradient?: string;
  backgroundAngle?: number;
  backgroundColors?: [string, string, string, string];
  accentColor?: string;
  accentOpacity?: number;
  titleFont?: string;
  bodyFont?: string;
  blocks?: Record<string, { color?: string; opacity?: number }>;
};

export function buildGradientFromColors(colors: [string, string, string, string], angle = 135): string {
  if (!colors?.every((c) => c?.trim())) return DEFAULT_GRADIENT;
  const stops = colors.map((c, i) => `${c.trim()} ${(i / (colors.length - 1)) * 100}%`).join(', ');
  return `linear-gradient(${angle}deg, ${stops})`;
}

export function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(107, 78, 158, ${opacity})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getBlockBackground(style: StyleContent | null | undefined, blockKey: string): string {
  const accentColor = style?.accentColor ?? DEFAULT_ACCENT_COLOR;
  const accentOpacity = style?.accentOpacity ?? DEFAULT_ACCENT_OPACITY;
  const block = style?.blocks?.[blockKey];
  const color = block?.color ?? accentColor;
  const opacity = block?.opacity ?? accentOpacity;
  return hexToRgba(color, opacity);
}
