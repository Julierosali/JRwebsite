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

  if (s.startsWith('http')) {
    try {
      const url = new URL(s);
      const pathParts = url.pathname.split('/').filter(Boolean);
      // open.spotify.com/playlist/xxx -> ["playlist", "xxx"] (ignorer slash final ou query)
      if (pathParts.length >= 2) {
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
  const allowed = ['playlist', 'track', 'album', 'artist'];
  if (!allowed.includes(type)) type = 'playlist';
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}
