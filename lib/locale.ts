/**
 * Langues du site : Fr (Français) et Es (Espagnol).
 */
export type Locale = 'fr' | 'es';

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Espagnol', flag: '🇪🇸' },
];

export const DEFAULT_LOCALE: Locale = 'fr';

const STORAGE_KEY = 'julie-rosali-locale';

/**
 * Langue stockée en localStorage : le visiteur retrouve sa langue au prochain passage.
 */
export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'fr' || v === 'es') return v;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

/**
 * Indique si le content est au format bilingue { fr, es }.
 */
export function isBilingualContent(
  content: Record<string, unknown> | null | undefined
): boolean {
  if (!content || typeof content !== 'object') return false;
  return 'fr' in content || 'es' in content;
}

/** Champs communs à toutes les langues (visuels, réglages, galeries) : lus à la racine ou dans fr. */
const SHARED_KEYS = [
  'titleFontSize',
  'textFontSize',
  'logoUrl',
  'focusX',
  'focusY',
  'overlayColor',
  'overlayOpacity',
  'images',
  'scrollSpeed',
];

/**
 * Extrait le contenu d'une section pour une locale donnée.
 * Les champs partagés (tailles, image header, overlay, etc.) sont lus à la racine ou dans fr
 * et fusionnés avec le bloc de la locale, pour que l’image du header et les réglages restent en ES.
 */
export function getSectionContent<T extends Record<string, unknown>>(
  content: Record<string, unknown> | null | undefined,
  locale: Locale
): T {
  if (!content || typeof content !== 'object') return {} as T;
  const hasBilingual = isBilingualContent(content);
  if (!hasBilingual) {
    return { ...content } as T;
  }
  const byLocale = content[locale] as Record<string, unknown> | undefined;
  const fr = content.fr as Record<string, unknown> | undefined;
  const fallback = { ...(byLocale ?? fr ?? {}) } as Record<string, unknown>;
  for (const key of SHARED_KEYS) {
    if (content[key] !== undefined) {
      fallback[key] = content[key];
    } else if (fr?.[key] !== undefined) {
      fallback[key] = fr[key];
    }
  }
  return fallback as T;
}
