/**
 * Convertit une URL ou un ID Spotify en URL d'embed pour iframe.
 * Supporte : open.spotify.com/playlist/ID, /track/ID, /album/ID, /artist/ID, ou juste l'ID.
 */
export function getSpotifyEmbedUrl(urlOrId: string): string {
  const s = (urlOrId ?? '').trim();
  if (!s) return '';

  // Déjà une URL embed
  if (s.includes('/embed/')) return s;

  let type = 'playlist';
  let id = '';

  const allowed = ['playlist', 'track', 'album', 'artist'];

  if (s.startsWith('http')) {
    try {
      const url = new URL(s);
      const pathParts = url.pathname.split('/').filter(Boolean);
      // open.spotify.com/playlist/xxx ou open.spotify.com/intl-fr/track/xxx
      const typeIndex = pathParts.findIndex((p) => allowed.includes(p));
      if (typeIndex !== -1 && pathParts.length > typeIndex + 1) {
        type = pathParts[typeIndex];
        id = pathParts[typeIndex + 1];
      } else if (pathParts.length >= 2) {
        type = pathParts[0];
        id = pathParts[1];
      } else if (pathParts.length === 1) {
        id = pathParts[0];
      }
    } catch {
      return '';
    }
  } else {
    id = s;
  }

  if (!id) return '';
  if (!allowed.includes(type)) type = 'playlist';
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

/** Détecte le type de lien d'écoute (Spotify ou SoundCloud) à partir d'une URL. */
export function getListenLinkType(url: string): 'spotify' | 'soundcloud' | null {
  const s = (url ?? '').trim();
  if (!s) return null;
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (u.hostname.includes('spotify.com')) return 'spotify';
    if (u.hostname.includes('soundcloud.com')) return 'soundcloud';
  } catch {
    // ignore
  }
  return null;
}
