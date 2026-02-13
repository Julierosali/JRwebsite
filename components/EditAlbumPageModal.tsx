'use client';

import { useState, useEffect } from 'react';
import { Section } from '@/lib/supabase';
import { getYoutubeIdFromUrl, youtubeIdToUrl } from '@/lib/youtube';
import { isBilingualContent, type Locale } from '@/lib/locale';

type EditAlbumPageModalProps = {
  section: Section | null;
  onClose: () => void;
  onSave: (id: string, content: Record<string, unknown>) => Promise<void>;
};

/** Sous-champs de albumPage qui sont des liens / média (identiques dans les 2 langues). */
const ALBUM_PAGE_SHARED_KEYS = [
  'youtubeEmbedId',
  'listenUrls',
  'soundcloudEmbedUrl',
  'videoGallery',
  'videoGalleryColumns',
  'buttons',
];

function normalizeBilingual(content: Record<string, unknown>): Record<string, unknown> {
  if (isBilingualContent(content)) return content;
  const flat = { ...content };
  return { fr: { ...flat }, es: { ...flat } };
}

export function EditAlbumPageModal({ section, onClose, onSave }: EditAlbumPageModalProps) {
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [editLocale, setEditLocale] = useState<Locale>('fr');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) setContent(normalizeBilingual(section.content as Record<string, unknown>));
  }, [section]);

  if (!section) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave(section.id, content);
    setSaving(false);
    onClose();
  };

  const update = (path: string, value: unknown) => {
    setContent((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
        cur = cur[k] as Record<string, unknown>;
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  /** Écrit dans la locale courante et synchronise les champs partagés (URLs, vidéos) dans l’autre locale. */
  const u = (path: string, value: unknown) => {
    setContent((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      // Écrire dans la locale courante
      const curPath = `${editLocale}.${path}`;
      const curKeys = curPath.split('.');
      let cur: Record<string, unknown> = next;
      for (let i = 0; i < curKeys.length - 1; i++) {
        const k = curKeys[i];
        if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
        cur = cur[k] as Record<string, unknown>;
      }
      cur[curKeys[curKeys.length - 1]] = value;

      // Synchroniser les champs partagés de albumPage dans l’autre locale
      if (path === 'albumPage' && typeof value === 'object' && value !== null) {
        const otherLocale = editLocale === 'fr' ? 'es' : 'fr';
        if (!next[otherLocale] || typeof next[otherLocale] !== 'object') next[otherLocale] = {};
        const otherBlock = next[otherLocale] as Record<string, unknown>;
        if (!otherBlock.albumPage || typeof otherBlock.albumPage !== 'object') otherBlock.albumPage = {};
        const otherAp = otherBlock.albumPage as Record<string, unknown>;
        for (const sk of ALBUM_PAGE_SHARED_KEYS) {
          if ((value as Record<string, unknown>)[sk] !== undefined) {
            // Boutons : ne synchroniser que les URLs, pas les libellés
            if (sk === 'buttons') {
              const srcButtons = (value as Record<string, unknown>).buttons as { label: string; url: string }[] | undefined;
              const dstButtons = (otherAp.buttons as { label: string; url: string }[]) ?? [];
              if (srcButtons) {
                otherAp.buttons = srcButtons.map((btn, i) => ({
                  label: dstButtons[i]?.label ?? btn.label,
                  url: btn.url,
                }));
              }
            } else {
              otherAp[sk] = (value as Record<string, unknown>)[sk];
            }
          }
        }
      }
      return next;
    });
  };

  // FR comme base, locale courante par-dessus (merge aussi albumPage)
  const frBlock = (content.fr ?? {}) as Record<string, unknown>;
  const localeBlock = (content[editLocale] ?? {}) as Record<string, unknown>;
  const block = editLocale === 'fr' ? frBlock : { ...frBlock, ...localeBlock };
  const frAp = (frBlock.albumPage as Record<string, unknown>) ?? {};
  const localeAp = (localeBlock.albumPage as Record<string, unknown>) ?? {};
  const ap = editLocale === 'fr' ? frAp : { ...frAp, ...localeAp };
  const buttons = (ap.buttons as { label: string; url: string }[]) ?? [];
  const videoGallery = (ap.videoGallery as string[]) ?? [];
  const videoGalleryColumns = Math.min(4, Math.max(1, (ap.videoGalleryColumns as number) ?? 2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-blue/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold">Page album</h3>
        <div className="mt-4 flex gap-2 border-b border-white/20 pb-3">
          <button
            type="button"
            onClick={() => setEditLocale('fr')}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${editLocale === 'fr' ? 'bg-violet text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
          >
            🇫🇷 Fr
          </button>
          <button
            type="button"
            onClick={() => setEditLocale('es')}
            className={`rounded px-3 py-1.5 text-sm font-medium transition ${editLocale === 'es' ? 'bg-violet text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
          >
            🇪🇸 Es
          </button>
        </div>
        <p className="mt-3 text-sm text-white/70">
          {editLocale === 'es'
            ? 'Fecha de lanzamiento, artista, reproductores, vídeo, botones bajo la portada.'
            : 'Date de sortie, artiste, lecteurs, vidéo, boutons sous la pochette.'}
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">
              {editLocale === 'es' ? 'Fecha de lanzamiento' : 'Date de sortie'}
            </label>
            <input
              type="text"
              value={String(ap.releaseDate ?? '')}
              onChange={(e) => u('albumPage', { ...ap, releaseDate: e.target.value })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              placeholder={editLocale === 'es' ? '16 de septiembre de 2024' : '16 septembre 2024'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              {editLocale === 'es' ? 'Artista' : 'Artiste'}
            </label>
            <input
              type="text"
              value={String(ap.artist ?? '')}
              onChange={(e) => u('albumPage', { ...ap, artist: e.target.value })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              {editLocale === 'es' ? 'Sello' : 'Label'}
            </label>
            <input
              type="text"
              value={String(ap.label ?? '')}
              onChange={(e) => u('albumPage', { ...ap, label: e.target.value })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              {editLocale === 'es' ? 'Vídeo YouTube (página álbum)' : 'URL vidéo YouTube (page album)'}
            </label>
            <input
              type="url"
              value={youtubeIdToUrl(String(ap.youtubeEmbedId ?? ''))}
              onChange={(e) => u('albumPage', { ...ap, youtubeEmbedId: getYoutubeIdFromUrl(e.target.value) })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              {editLocale === 'es' ? 'Enlaces de escucha (Spotify y/o SoundCloud)' : 'Liens d\'écoute (Spotify et/ou SoundCloud)'}
            </label>
            <p className="mt-1 text-xs text-white/70">
              {editLocale === 'es'
                ? 'Un enlace por línea. El reproductor se adapta al tipo de enlace.'
                : 'Un lien par ligne. Le lecteur affiché s\'adapte au type de lien.'}
            </p>
            <textarea
              value={(ap.listenUrls as string) ?? (ap.soundcloudEmbedUrl as string) ?? ''}
              onChange={(e) => u('albumPage', { ...ap, listenUrls: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              placeholder={"https://open.spotify.com/track/...\nhttps://soundcloud.com/..."}
            />
          </div>
          <div className="border-t border-white/20 pt-4">
            <p className="text-sm font-medium text-white/80">
              {editLocale === 'es' ? 'Botones bajo la portada (texto + enlace)' : 'Boutons sous la pochette (libellé + lien)'}
            </p>
            {buttons.map((btn, i) => (
              <div key={i} className="mt-2 flex flex-wrap gap-2 rounded border border-white/20 p-3">
                <input
                  type="text"
                  value={btn.label ?? ''}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[i] = { ...next[i], label: e.target.value };
                    u('albumPage', { ...ap, buttons: next });
                  }}
                  placeholder={editLocale === 'es' ? 'Texto' : 'Libellé'}
                  className="flex-1 min-w-[120px] rounded border border-white/30 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
                <input
                  type="url"
                  value={btn.url ?? ''}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[i] = { ...next[i], url: e.target.value };
                    u('albumPage', { ...ap, buttons: next });
                  }}
                  placeholder="https://..."
                  className="flex-1 min-w-[160px] rounded border border-white/30 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = buttons.filter((_, j) => j !== i);
                    u('albumPage', { ...ap, buttons: next });
                  }}
                  className="rounded border border-red-400/50 bg-red-900/20 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                >
                  {editLocale === 'es' ? 'Eliminar' : 'Supprimer'}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => u('albumPage', { ...ap, buttons: [...buttons, { label: '', url: '' }] })}
              className="mt-2 rounded border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              {editLocale === 'es' ? '+ Añadir un botón' : '+ Ajouter un bouton'}
            </button>
          </div>
          <div className="border-t border-white/20 pt-4">
            <p className="text-sm font-medium text-white/80">
              {editLocale === 'es' ? 'Galería de vídeos' : 'Galerie vidéo'}
            </p>
            <p className="mt-1 text-xs text-white/70">
              {editLocale === 'es'
                ? 'Enlaces YouTube. Elige el número de columnas y el orden de los vídeos.'
                : 'Liens YouTube. Choisissez le nombre de colonnes et l\'ordre des vidéos.'}
            </p>
            <div className="mt-2">
              <label className="block text-xs text-white/70">
                {editLocale === 'es' ? 'Número de columnas' : 'Nombre de colonnes'}
              </label>
              <select
                value={videoGalleryColumns}
                onChange={(e) => u('albumPage', { ...ap, videoGalleryColumns: Number(e.target.value) || 2 })}
                className="mt-1 rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {editLocale === 'es' ? (n > 1 ? 'columnas' : 'columna') : (n > 1 ? 'colonnes' : 'colonne')}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 space-y-2">
              {videoGallery.map((url, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded border border-white/20 p-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const next = [...videoGallery];
                      next[i] = e.target.value;
                      u('albumPage', { ...ap, videoGallery: next });
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="min-w-[180px] flex-1 rounded border border-white/30 bg-black/30 px-2 py-1.5 text-sm text-white"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => {
                        if (i === 0) return;
                        const next = [...videoGallery];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        u('albumPage', { ...ap, videoGallery: next });
                      }}
                      className="rounded border border-white/30 bg-white/10 px-2 py-1 text-xs disabled:opacity-40"
                      title={editLocale === 'es' ? 'Subir' : 'Monter'}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={i === videoGallery.length - 1}
                      onClick={() => {
                        if (i === videoGallery.length - 1) return;
                        const next = [...videoGallery];
                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                        u('albumPage', { ...ap, videoGallery: next });
                      }}
                      className="rounded border border-white/30 bg-white/10 px-2 py-1 text-xs disabled:opacity-40"
                      title={editLocale === 'es' ? 'Bajar' : 'Descendre'}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = videoGallery.filter((_, j) => j !== i);
                        u('albumPage', { ...ap, videoGallery: next });
                      }}
                      className="rounded border border-red-400/50 bg-red-900/20 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                    >
                      {editLocale === 'es' ? 'Eliminar' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => u('albumPage', { ...ap, videoGallery: [...videoGallery, ''] })}
                className="rounded border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
              >
                {editLocale === 'es' ? '+ Añadir un vídeo' : '+ Ajouter une vidéo'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-white/20 px-4 py-2 font-medium transition hover:bg-white/30"
          >
            {editLocale === 'es' ? 'Cancelar' : 'Annuler'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-violet px-4 py-2 font-medium transition hover:bg-violet-light disabled:opacity-50"
          >
            {saving
              ? (editLocale === 'es' ? 'Guardando…' : 'Enregistrement…')
              : (editLocale === 'es' ? 'Guardar' : 'Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  );
}
