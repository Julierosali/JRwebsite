'use client';

import { useState, useEffect } from 'react';
import { Section } from '@/lib/supabase';
import { getYoutubeIdFromUrl, youtubeIdToUrl } from '@/lib/youtube';
import { parseVideoUrl, toStoredVideoValue, toDisplayUrl } from '@/lib/video';
import { ImageUploadField } from '@/components/ImageUploadField';
import { ImageGalleryEdit } from '@/components/ImageGalleryEdit';

type EditSectionModalProps = {
  section: Section | null;
  onClose: () => void;
  onSave: (id: string, content: Record<string, unknown>) => Promise<void>;
};

export function EditSectionModal({ section, onClose, onSave }: EditSectionModalProps) {
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (section) setContent(section.content as Record<string, unknown>);
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
      const next = { ...prev };
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

  const renderFields = () => {
    const key = section.key;
    const c = content as Record<string, unknown>;

    if (key === 'header') {
      const focusX = typeof c.focusX === 'number' ? c.focusX : 50;
      const focusY = typeof c.focusY === 'number' ? c.focusY : 50;
      return (
        <>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Sous-titre (retours à la ligne possibles)</label>
          <textarea
            value={(c.subtitle as string) ?? ''}
            onChange={(e) => update('subtitle', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Image (optionnel)"
            value={(c.logoUrl as string) ?? ''}
            onChange={(url) => update('logoUrl', url)}
            pathPrefix="header"
          />
          {(c.logoUrl as string) ? (
            <>
              <p className="mt-4 text-sm font-medium">Point de focus de l&apos;image</p>
              <p className="mt-1 text-xs text-white/70">
                Définissez quelle partie de l&apos;image reste visible (0 = gauche/haut, 100 = droite/bas, 50 = centre).
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/70">Horizontal (X) %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={focusX}
                    onChange={(e) => update('focusX', Number(e.target.value) || 50)}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">Vertical (Y) %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={focusY}
                    onChange={(e) => update('focusY', Number(e.target.value) || 50)}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
                  />
                </div>
              </div>
            </>
          ) : null}
        </>
      );
    }

    if (key === 'album') {
      const ap = (c.albumPage as Record<string, unknown>) ?? {};
      const buttons = (ap.buttons as { label: string; url: string }[]) ?? [];
      return (
        <>
          <label className="block text-sm font-medium">Titre section</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Sous-titre album (retours à la ligne possibles)</label>
          <textarea
            value={(c.subtitle as string) ?? ''}
            onChange={(e) => update('subtitle', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Titre album</label>
          <input
            type="text"
            value={(c.albumTitle as string) ?? ''}
            onChange={(e) => update('albumTitle', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Pochette d'album"
            value={(c.coverUrl as string) ?? ''}
            onChange={(url) => update('coverUrl', url)}
            pathPrefix="album"
          />
          <label className="mt-4 block text-sm font-medium">Slug page (URL)</label>
          <input
            type="text"
            value={(c.pageSlug as string) ?? 'album'}
            onChange={(e) => update('pageSlug', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Description</label>
          <textarea
            value={(c.description as string) ?? ''}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <div className="mt-6 border-t border-white/20 pt-4">
            <p className="text-sm font-medium text-white/80">Page album (détail)</p>
            <label className="mt-2 block text-sm font-medium">Date de sortie</label>
            <input
              type="text"
              value={String(ap.releaseDate ?? '')}
              onChange={(e) => update('albumPage', { ...ap, releaseDate: e.target.value })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              placeholder="16 septembre 2024"
            />
            <label className="mt-2 block text-sm font-medium">Artiste</label>
            <input
              type="text"
              value={String(ap.artist ?? '')}
              onChange={(e) => update('albumPage', { ...ap, artist: e.target.value })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            />
            <label className="mt-2 block text-sm font-medium">Label</label>
            <input
              type="text"
              value={String(ap.label ?? '')}
              onChange={(e) => update('albumPage', { ...ap, label: e.target.value })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            />
            <label className="mt-2 block text-sm font-medium">URL vidéo YouTube (page album)</label>
            <input
              type="url"
              value={youtubeIdToUrl(String(ap.youtubeEmbedId ?? ''))}
              onChange={(e) => update('albumPage', { ...ap, youtubeEmbedId: getYoutubeIdFromUrl(e.target.value) })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <label className="mt-2 block text-sm font-medium">URL SoundCloud (page album)</label>
            <input
              type="text"
              value={(ap.soundcloudEmbedUrl as string) ?? ''}
              onChange={(e) => update('albumPage', { ...ap, soundcloudEmbedUrl: e.target.value })}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              placeholder="https://soundcloud.com/..."
            />
            <p className="mt-4 text-sm font-medium text-white/80">Boutons sous la pochette (libellé + lien)</p>
            {buttons.map((btn, i) => (
              <div key={i} className="mt-2 flex flex-wrap gap-2 rounded border border-white/20 p-3">
                <input
                  type="text"
                  value={btn.label ?? ''}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[i] = { ...next[i], label: e.target.value };
                    update('albumPage', { ...ap, buttons: next });
                  }}
                  placeholder="Libellé"
                  className="flex-1 min-w-[120px] rounded border border-white/30 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
                <input
                  type="url"
                  value={btn.url ?? ''}
                  onChange={(e) => {
                    const next = [...buttons];
                    next[i] = { ...next[i], url: e.target.value };
                    update('albumPage', { ...ap, buttons: next });
                  }}
                  placeholder="https://..."
                  className="flex-1 min-w-[160px] rounded border border-white/30 bg-black/30 px-2 py-1.5 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = buttons.filter((_, j) => j !== i);
                    update('albumPage', { ...ap, buttons: next });
                  }}
                  className="rounded border border-red-400/50 bg-red-900/20 px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                >
                  Supprimer
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => update('albumPage', { ...ap, buttons: [...buttons, { label: '', url: '' }] })}
              className="mt-2 rounded border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              + Ajouter un bouton
            </button>
          </div>
        </>
      );
    }

    if (key === 'presentation') {
      return (
        <>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte</label>
          <textarea
            value={(c.body as string) ?? ''}
            onChange={(e) => update('body', e.target.value)}
            rows={8}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Photo de présentation (max 500 Ko)"
            value={(c.imageUrl as string) ?? ''}
            onChange={(url) => update('imageUrl', url)}
            pathPrefix="presentation"
            maxSizeBytes={500 * 1024}
          />
        </>
      );
    }

    if (key === 'player') {
      return (
        <>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">URL Spotify (ou ID playlist)</label>
          <input
            type="text"
            value={((c.spotifyEmbedUrl as string) ?? (c.spotifyPlaylistId as string) ?? '').trim()}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v.startsWith('http')) {
                update('spotifyEmbedUrl', v);
                update('spotifyPlaylistId', '');
              } else if (v) {
                update('spotifyPlaylistId', v);
                update('spotifyEmbedUrl', '');
              } else {
                update('spotifyEmbedUrl', '');
                update('spotifyPlaylistId', '');
              }
            }}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            placeholder="https://open.spotify.com/playlist/... ou ID playlist"
          />
        </>
      );
    }

    if (key === 'clips') {
      const videos = (c.videos as { title?: string; youtubeId?: string }[]) ?? [];
      return (
        <>
          <label className="block text-sm font-medium">Titre section</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          {[0, 1, 2].map((i) => (
            <div key={i} className="mt-4 rounded border border-white/20 p-3">
              <label className="block text-sm font-medium">Clip {i + 1} - Titre</label>
              <input
                type="text"
                value={videos[i]?.title ?? ''}
                onChange={(e) => {
                  const v = [...videos];
                  if (!v[i]) v[i] = {};
                  v[i].title = e.target.value;
                  update('videos', v);
                }}
                className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              />
              <label className="mt-2 block text-sm font-medium">URL YouTube ou Vimeo</label>
              <input
                type="url"
                value={toDisplayUrl(videos[i]?.youtubeId ?? '')}
                onChange={(e) => {
                  const v = [...videos];
                  if (!v[i]) v[i] = {};
                  const parsed = parseVideoUrl(e.target.value);
                  v[i].youtubeId = toStoredVideoValue(parsed);
                  update('videos', v);
                }}
                className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
                placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
              />
            </div>
          ))}
        </>
      );
    }

    if (key === 'scene') {
      return (
        <>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Sous-titre (retours à la ligne possibles)</label>
          <textarea
            value={(c.subtitle as string) ?? ''}
            onChange={(e) => update('subtitle', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte de présentation</label>
          <textarea
            value={(c.body as string) ?? ''}
            onChange={(e) => update('body', e.target.value)}
            rows={5}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte du bouton (CTA)</label>
          <input
            type="text"
            value={(c.ctaText as string) ?? ''}
            onChange={(e) => update('ctaText', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            placeholder="Réserver une prestation"
          />
          <ImageUploadField
            label="Image 1 (scène / concert)"
            value={(c.imageUrl1 as string) ?? ''}
            onChange={(url) => update('imageUrl1', url)}
            pathPrefix="scene"
          />
          <ImageUploadField
            label="Image 2 (scène / concert)"
            value={(c.imageUrl2 as string) ?? ''}
            onChange={(url) => update('imageUrl2', url)}
            pathPrefix="scene"
          />
        </>
      );
    }

    if (key === 'portrait') {
      const images = (c.images as { url: string; alt?: string }[]) ?? [];
      const scrollSpeed = typeof c.scrollSpeed === 'number' ? c.scrollSpeed : 40;
      return (
        <>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Vitesse du défilement (secondes pour un tour)</label>
          <input
            type="number"
            min={10}
            max={120}
            value={scrollSpeed}
            onChange={(e) => update('scrollSpeed', Number(e.target.value) || 40)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <p className="mt-1 text-xs text-white/60">Entre 10 et 120 secondes. Plus le nombre est bas, plus le défilement est rapide.</p>
          <ImageGalleryEdit
            images={images}
            onChange={(imgs) => update('images', imgs)}
            pathPrefix="portrait"
          />
        </>
      );
    }

    if (key === 'contact') {
      return (
        <>
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte</label>
          <textarea
            value={(c.body as string) ?? ''}
            onChange={(e) => update('body', e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Email</label>
          <input
            type="text"
            value={(c.email as string) ?? ''}
            onChange={(e) => update('email', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Téléphone</label>
          <input
            type="text"
            value={(c.phone as string) ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Photo de présentation"
            value={(c.imageUrl as string) ?? ''}
            onChange={(url) => update('imageUrl', url)}
            pathPrefix="contact"
          />
        </>
      );
    }

    if (key === 'social') {
      const links = (c.links as { platform: string; url: string }[]) ?? [];
      const platforms = ['instagram', 'tiktok', 'facebook', 'x'];
      return (
        <>
          {platforms.map((platform) => (
            <div key={platform} className="mt-4">
              <label className="block text-sm font-medium">{platform}</label>
              <input
                type="url"
                value={links.find((l) => l.platform === platform)?.url ?? ''}
                onChange={(e) => {
                  const next = links.filter((l) => l.platform !== platform);
                  next.push({ platform, url: e.target.value });
                  update('links', next);
                }}
                className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              />
            </div>
          ))}
        </>
      );
    }

    if (key === 'streaming') {
      const links = (c.links as { platform: string; url: string; imageUrl?: string }[]) ?? [];
      const platforms = ['spotify', 'deezer', 'youtube', 'soundcloud', 'amazon', 'apple'] as const;
      const platformLabels: Record<string, string> = { apple: 'Apple Music', amazon: 'Amazon Music' };
      return (
        <>
          {platforms.map((platform) => {
            const link = links.find((l) => l.platform === platform) ?? { platform, url: '' };
            return (
              <div key={platform} className="mt-6 rounded border border-white/20 p-4">
                <label className="block text-sm font-medium">{platformLabels[platform] ?? platform} - URL</label>
                <input
                  type="url"
                  value={link.url ?? ''}
                  onChange={(e) => {
                    const next = links.filter((l) => l.platform !== platform);
                    next.push({ ...link, platform, url: e.target.value });
                    update('links', next);
                  }}
                  className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
                />
                <ImageUploadField
                  label="Logo personnalisé (optionnel, max 10 Ko)"
                  value={link.imageUrl ?? ''}
                  onChange={(url) => {
                    const next = links.filter((l) => l.platform !== platform);
                    next.push({ ...link, platform, imageUrl: url });
                    update('links', next);
                  }}
                  pathPrefix="streaming-icons"
                  maxSizeBytes={10 * 1024}
                />
              </div>
            );
          })}
        </>
      );
    }

    if (key === 'footer') {
      return (
        <>
          <label className="block text-sm font-medium">Texte pied de page (retours à la ligne possibles)</label>
          <textarea
            value={(c.text as string) ?? ''}
            onChange={(e) => update('text', e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
        </>
      );
    }

    return <p className="text-white/70">Édition non disponible pour cette section.</p>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-blue/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold">Modifier : {section.key}</h3>
        <div className="mt-6">{renderFields()}</div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-white/20 px-4 py-2 font-medium transition hover:bg-white/30"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-violet px-4 py-2 font-medium transition hover:bg-violet-light disabled:opacity-50"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
