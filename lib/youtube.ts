/**
 * Extrait l'ID d'une vidéo YouTube depuis une URL ou retourne la chaîne telle quelle si c'est déjà un ID.
 * Supporte : watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
 */
export function getYoutubeIdFromUrl(urlOrId: string): string {
  const s = (urlOrId ?? '').trim();
  if (!s) return '';

  // Déjà un ID (ex: 11 caractères alphanumeriques + _-)
  if (/^[\w-]{10,12}$/.test(s)) return s;

  try {
    // youtu.be/ID
    const shortMatch = s.match(/(?:youtu\.be\/)([\w-]{10,12})/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/watch?v=ID ou youtube.com/embed/ID
    const url = new URL(s.startsWith('http') ? s : `https://${s}`);
    const v = url.searchParams.get('v');
    if (v) return v;
    const pathId = url.pathname.split('/').filter(Boolean).pop();
    if (pathId && /^[\w-]{10,12}$/.test(pathId)) return pathId;
  } catch {
    // URL invalide, retourner la chaîne (pourrait être un ID)
    return /^[\w-]{10,12}$/.test(s) ? s : '';
  }
  return '';
}

/** Construit l'URL standard à partir de l'ID pour affichage dans l'admin */
export function youtubeIdToUrl(id: string): string {
  if (!id?.trim()) return '';
  return `https://www.youtube.com/watch?v=${id.trim()}`;
}
