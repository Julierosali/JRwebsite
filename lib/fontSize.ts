/** Tailles de police configurables pour titres et textes (px). */
export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 48;
export const FONT_SIZE_OPTIONS = Array.from(
  { length: FONT_SIZE_MAX - FONT_SIZE_MIN + 1 },
  (_, i) => FONT_SIZE_MIN + i
);

export function clampFontSize(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return undefined;
  const clamped = Math.round(Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, n)));
  return clamped;
}
