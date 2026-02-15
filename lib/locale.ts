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
 * Champs textuels traduisibles — seuls ces champs peuvent différer entre FR et ES.
 * Tout le reste (URLs, images, embeds, liens, configurations) vient toujours de FR.
 */
const TRANSLATABLE_FIELDS = new Set([
  'title',
  'subtitle',
  'body',
  'description',
  'text',
  'albumTitle',
  'ctaText',
  'pressKitText',
]);

/** Sous-champs de albumPage qui sont du texte traduisible. */
const TRANSLATABLE_ALBUM_PAGE_FIELDS = new Set([
  'releaseDate',
  'artist',
  'label',
  'producer',
]);

/**
 * Fusionne un objet de type albumPage : prend FR comme base,
 * n'écrase que les sous-champs textuels avec la version ES.
 * Les buttons gardent les labels ES mais tout le reste vient de FR.
 */
function mergeAlbumPage(
  frAp: Record<string, unknown> | undefined,
  esAp: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!frAp) return {};
  if (!esAp) return { ...frAp };
  const result = { ...frAp };
  TRANSLATABLE_ALBUM_PAGE_FIELDS.forEach((key) => {
    if (esAp[key] !== undefined && esAp[key] !== '') {
      result[key] = esAp[key];
    }
  });
  // Buttons : garder les URLs de FR, mais prendre le label ES si dispo
  const frButtons = (frAp.buttons as { label: string; url: string }[]) ?? [];
  const esButtons = (esAp.buttons as { label: string; url: string }[]) ?? [];
  if (frButtons.length > 0) {
    result.buttons = frButtons.map((btn, i) => ({
      ...btn,
      label: esButtons[i]?.label || btn.label,
    }));
  }
  return result;
}

/**
 * Fusionne les vidéos (clips) : prend FR comme base,
 * n'écrase que le titre avec la version ES.
 */
function mergeVideos(
  frVideos: { title?: string; youtubeId?: string }[] | undefined,
  esVideos: { title?: string; youtubeId?: string }[] | undefined,
): { title?: string; youtubeId?: string }[] {
  if (!frVideos) return [];
  if (!esVideos) return frVideos;
  return frVideos.map((v, i) => ({
    ...v,
    title: esVideos[i]?.title || v.title,
  }));
}

/**
 * Extrait le contenu d'une section pour une locale donnée.
 *
 * Règle simple :
 * - FR est la source de vérité pour TOUT (URLs, images, embeds, liens, config).
 * - ES ne peut surcharger que les champs textuels traduisibles (title, subtitle, body, etc.).
 * - Les champs racine partagés (tailles de police, images portrait, overlay) ont la priorité absolue.
 *
 * Résultat : le site est strictement identique dans les 2 langues,
 * seuls les textes affichés changent.
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
  const fr = (content.fr as Record<string, unknown>) ?? {};

  // En mode FR, on retourne directement le bloc FR
  if (locale === 'fr') {
    const result = { ...fr };
    for (const key of SHARED_KEYS) {
      if (content[key] !== undefined) result[key] = content[key];
    }
    return result as T;
  }

  // En mode ES : FR comme base, seuls les champs textuels sont écrasés
  const es = (content[locale] as Record<string, unknown>) ?? {};
  const result: Record<string, unknown> = { ...fr };

  // Écraser uniquement les champs textuels traduisibles (top-level)
  TRANSLATABLE_FIELDS.forEach((key) => {
    if (es[key] !== undefined && es[key] !== '') {
      result[key] = es[key];
    }
  });

  // albumPage : fusion spéciale (textes ES, URLs/embeds FR)
  if (fr.albumPage || es.albumPage) {
    result.albumPage = mergeAlbumPage(
      fr.albumPage as Record<string, unknown>,
      es.albumPage as Record<string, unknown>,
    );
  }

  // videos (clips) : fusion spéciale (titres ES, youtubeId FR)
  if (fr.videos || es.videos) {
    result.videos = mergeVideos(
      fr.videos as { title?: string; youtubeId?: string }[],
      es.videos as { title?: string; youtubeId?: string }[],
    );
  }

  // social / streaming links : on écrase les labels ES mais garde les URLs FR
  if (fr.links || es.links) {
    const frLinks = (fr.links as { platform: string; url: string; imageUrl?: string }[]) ?? [];
    const esLinks = (es.links as { platform: string; url: string; imageUrl?: string }[]) ?? [];
    // On garde FR pour les URLs, on prend seulement la structure FR
    if (frLinks.length > 0) {
      result.links = frLinks;
    } else if (esLinks.length > 0) {
      result.links = esLinks;
    }
  }

  // Les clés partagées stockées à la racine prennent toujours le dessus
  for (const key of SHARED_KEYS) {
    if (content[key] !== undefined) {
      result[key] = content[key];
    }
  }

  return result as T;
}
