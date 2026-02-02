/**
 * Détecte le type de vidéo (YouTube ou Vimeo) et extrait l'ID.
 * Pour la rétrocompatibilité, une chaîne sans préfixe est traitée comme ID YouTube.
 */
export type VideoKind = 'youtube' | 'vimeo';

export type ParsedVideo = { kind: VideoKind; id: string } | null;

export function parseVideoUrl(urlOrId: string): ParsedVideo {
  const s = (urlOrId ?? '').trim();
  if (!s) return null;

  // Déjà préfixé (données existantes)
  if (s.startsWith('vimeo:')) {
    const id = s.slice(6).trim();
    return id ? { kind: 'vimeo', id } : null;
  }

  // Vimeo: vimeo.com/123456789 ou player.vimeo.com/video/123456789
  const vimeoMatch = s.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) return { kind: 'vimeo', id: vimeoMatch[1] };

  // YouTube: ID seul (10–11 caractères) ou URL
  if (/^[\w-]{10,12}$/.test(s)) return { kind: 'youtube', id: s };
  try {
    const shortMatch = s.match(/(?:youtu\.be\/)([\w-]{10,12})/);
    if (shortMatch) return { kind: 'youtube', id: shortMatch[1] };
    const url = new URL(s.startsWith('http') ? s : `https://${s}`);
    const v = url.searchParams.get('v');
    if (v && /^[\w-]{10,12}$/.test(v)) return { kind: 'youtube', id: v };
    const pathId = url.pathname.split('/').filter(Boolean).pop();
    if (pathId && /^[\w-]{10,12}$/.test(pathId)) return { kind: 'youtube', id: pathId };
  } catch {
    if (/^[\w-]{10,12}$/.test(s)) return { kind: 'youtube', id: s };
  }
  return null;
}

/** Valeur à enregistrer en base : ID YouTube seul ou "vimeo:ID" */
export function toStoredVideoValue(parsed: ParsedVideo): string {
  if (!parsed) return '';
  if (parsed.kind === 'vimeo') return `vimeo:${parsed.id}`;
  return parsed.id;
}

/** URL d’affichage pour l’admin (lien cliquable) */
/** URL d'affichage pour l'admin. Accepte ID, préfixe vimeo: ou URL complète. */
export function toDisplayUrl(stored: string): string {
  if (!stored) return '';
  const parsed = parseVideoUrl(stored);
  if (!parsed) return stored.startsWith('http') ? stored : '';
  return parsed.kind === 'vimeo'
    ? `https://vimeo.com/${parsed.id}`
    : `https://www.youtube.com/watch?v=${parsed.id}`;
}
