'use client';

import { useState, useEffect } from 'react';
import { Section } from '@/lib/supabase';
import { parseVideoUrl, toStoredVideoValue, toDisplayUrl } from '@/lib/video';
import { FONT_SIZE_OPTIONS, clampFontSize } from '@/lib/fontSize';
import { isBilingualContent, type Locale } from '@/lib/locale';
import { ImageUploadField } from '@/components/ImageUploadField';
import { ImageGalleryEdit } from '@/components/ImageGalleryEdit';

type EditSectionModalProps = {
  section: Section | null;
  onClose: () => void;
  onSave: (id: string, content: Record<string, unknown>) => Promise<void>;
  /** Titre du modal (ex. "Album" depuis la page album). */
  title?: string;
};

const SIZE_KEYS = ['titleFontSize', 'textFontSize'];
const PORTRAIT_SHARED_KEYS = ['images', 'scrollSpeed'];

/** Champs partagés par section (URLs, images, layout) — identiques entre les langues. */
const SECTION_SHARED_FIELDS: Record<string, string[]> = {
  header: ['logoUrl', 'focusX', 'focusY', 'overlayColor', 'overlayOpacity'],
  album: ['coverUrl', 'pageSlug'],
  presentation: ['imageUrl'],
  player: ['spotifyEmbedUrl', 'spotifyPlaylistId'],
  clips: ['videos'],
  scene: ['imageUrl1', 'imageUrl2'],
  contact: ['email', 'phone', 'imageUrl'],
  social: ['links'],
  streaming: ['links'],
};

function normalizeBilingual(content: Record<string, unknown>): Record<string, unknown> {
  if (isBilingualContent(content)) {
    const next = { ...content } as Record<string, unknown>;
    const fr = next.fr as Record<string, unknown> | undefined;
    const es = next.es as Record<string, unknown> | undefined;
    SIZE_KEYS.forEach((k) => {
      if (next[k] === undefined && fr?.[k] !== undefined) next[k] = fr[k];
    });
    PORTRAIT_SHARED_KEYS.forEach((k) => {
      if (next[k] === undefined && fr?.[k] !== undefined) next[k] = fr[k];
    });
    if (fr) {
      const frCopy = { ...fr };
      [...SIZE_KEYS, ...PORTRAIT_SHARED_KEYS].forEach((k) => delete frCopy[k]);
      next.fr = frCopy;
    }
    if (es) {
      const esCopy = { ...es };
      [...SIZE_KEYS, ...PORTRAIT_SHARED_KEYS].forEach((k) => delete esCopy[k]);
      next.es = esCopy;
    }
    return next;
  }
  const flat = { ...content };
  const rootSizes: Record<string, unknown> = {};
  [...SIZE_KEYS, ...PORTRAIT_SHARED_KEYS].forEach((k) => {
    if (flat[k] !== undefined) rootSizes[k] = flat[k];
    delete flat[k];
  });
  return { ...rootSizes, fr: { ...flat }, es: { ...flat } };
}

export function EditSectionModal({ section, onClose, onSave, title: titleOverride }: EditSectionModalProps) {
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

  /** Met à jour un champ : tailles à la racine, champs partagés dans les 2 langues, textes dans la locale courante. */
  const u = (path: string, value: unknown) => {
    if (path === 'titleFontSize' || path === 'textFontSize') {
      update(path, value);
      return;
    }
    const topKey = path.split('.')[0];
    const shared = SECTION_SHARED_FIELDS[section.key] ?? [];
    if (shared.includes(topKey)) {
      // Écrire dans les 2 langues pour garder le contenu synchronisé
      setContent((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        for (const loc of ['fr', 'es']) {
          const fullPath = `${loc}.${path}`;
          const keys = fullPath.split('.');
          let cur: Record<string, unknown> = next;
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
            cur = cur[k] as Record<string, unknown>;
          }
          cur[keys[keys.length - 1]] = value;
        }
        return next;
      });
    } else {
      update(`${editLocale}.${path}`, value);
    }
  };
  const get = (path: string): unknown => {
    if (path === 'titleFontSize' || path === 'textFontSize') {
      return (content as Record<string, unknown>)[path];
    }
    const block = (content[editLocale] ?? {}) as Record<string, unknown>;
    const keys = path.split('.');
    let cur: unknown = block;
    for (const k of keys) {
      cur = (cur as Record<string, unknown>)?.[k];
    }
    // Fallback vers FR si la valeur est absente dans la locale courante
    if (cur === undefined && editLocale !== 'fr') {
      const frBlock = (content.fr ?? {}) as Record<string, unknown>;
      let frCur: unknown = frBlock;
      for (const k of keys) {
        frCur = (frCur as Record<string, unknown>)?.[k];
      }
      return frCur;
    }
    return cur;
  };
  const getStr = (path: string) => (get(path) as string) ?? '';
  const getNum = (path: string) => (get(path) as number) ?? 0;

  const renderSizeRow = (showTitle: boolean, showText: boolean) => {
    const titlePx = clampFontSize(get('titleFontSize'));
    const textPx = clampFontSize(get('textFontSize'));
    return (
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded border border-white/20 bg-black/20 p-3">
        {showTitle && (
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Taille titre (px)</span>
            <select
              value={titlePx ?? ''}
              onChange={(e) => u('titleFontSize', e.target.value ? Number(e.target.value) : undefined)}
              className="rounded border border-white/30 bg-black/30 px-2 py-1 text-white"
            >
              <option value="">Défaut</option>
              {FONT_SIZE_OPTIONS.map((px) => (
                <option key={px} value={px}>{px}</option>
              ))}
            </select>
          </label>
        )}
        {showText && (
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Taille texte (px)</span>
            <select
              value={textPx ?? ''}
              onChange={(e) => u('textFontSize', e.target.value ? Number(e.target.value) : undefined)}
              className="rounded border border-white/30 bg-black/30 px-2 py-1 text-white"
            >
              <option value="">Défaut</option>
              {FONT_SIZE_OPTIONS.map((px) => (
                <option key={px} value={px}>{px}</option>
              ))}
            </select>
          </label>
        )}
      </div>
    );
  };

  const renderFields = () => {
    const key = section.key;
    // FR comme base, la locale courante par-dessus (shallow merge suffisant car champs top-level)
    const frBlock = (content.fr ?? {}) as Record<string, unknown>;
    const c = editLocale === 'fr'
      ? frBlock
      : { ...frBlock, ...((content[editLocale] ?? {}) as Record<string, unknown>) };

    if (key === 'header') {
      const focusX = typeof c.focusX === 'number' ? c.focusX : 50;
      const focusY = typeof c.focusY === 'number' ? c.focusY : 50;
      const overlayColor = (c.overlayColor as string) ?? '#000000';
      const overlayOpacity = typeof c.overlayOpacity === 'number' ? c.overlayOpacity : 0.3;
      return (
        <>
          {renderSizeRow(true, true)}
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Sous-titre (retours à la ligne possibles)</label>
          <textarea
            value={(c.subtitle as string) ?? ''}
            onChange={(e) => u('subtitle', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Image (optionnel)"
            value={(c.logoUrl as string) ?? ''}
            onChange={(url) => u('logoUrl', url)}
            pathPrefix="header"
          />
          <div className="mt-4 border-t border-white/20 pt-4">
            <p className="text-sm font-medium">Superposition sur la bannière</p>
            <p className="mt-1 text-xs text-white/70">
              Couleur et opacité de la couche au-dessus de l&apos;image (pour améliorer la lisibilité du texte).
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs text-white/70">Couleur</label>
                <input
                  type="color"
                  value={overlayColor}
                  onChange={(e) => u('overlayColor', e.target.value)}
                  className="mt-1 h-10 w-24 cursor-pointer rounded border border-white/30 bg-black/30"
                />
              </div>
              <div className="min-w-[120px] flex-1">
                <label className="block text-xs text-white/70">Opacité (0–1)</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={overlayOpacity}
                  onChange={(e) => {
                  const v = Number(e.target.value);
                  u('overlayOpacity', Number.isNaN(v) ? 0.3 : Math.min(1, Math.max(0, v)));
                }}
                  className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
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
                    onChange={(e) => u('focusX', Number(e.target.value) || 50)}
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
                    onChange={(e) => u('focusY', Number(e.target.value) || 50)}
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
      return (
        <>
          {renderSizeRow(true, true)}
          <p className="mb-4 text-sm text-white/70">Carte Album sur la page d&apos;accueil (titre, pochette, lien vers la page).</p>
          <label className="block text-sm font-medium">Titre section</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Sous-titre album (retours à la ligne possibles)</label>
          <textarea
            value={(c.subtitle as string) ?? ''}
            onChange={(e) => u('subtitle', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Titre album</label>
          <input
            type="text"
            value={(c.albumTitle as string) ?? ''}
            onChange={(e) => u('albumTitle', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Pochette d'album"
            value={(c.coverUrl as string) ?? ''}
            onChange={(url) => u('coverUrl', url)}
            pathPrefix="album"
          />
          <label className="mt-4 block text-sm font-medium">Slug page (URL)</label>
          <input
            type="text"
            value={(c.pageSlug as string) ?? 'album'}
            onChange={(e) => u('pageSlug', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Description</label>
          <textarea
            value={(c.description as string) ?? ''}
            onChange={(e) => u('description', e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
        </>
      );
    }

    if (key === 'presentation') {
      return (
        <>
          {renderSizeRow(true, true)}
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte</label>
          <textarea
            value={(c.body as string) ?? ''}
            onChange={(e) => u('body', e.target.value)}
            rows={8}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Photo de présentation (max 500 Ko)"
            value={(c.imageUrl as string) ?? ''}
            onChange={(url) => u('imageUrl', url)}
            pathPrefix="presentation"
            maxSizeBytes={500 * 1024}
          />
        </>
      );
    }

    if (key === 'player') {
      return (
        <>
          {renderSizeRow(true, true)}
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">URL Spotify (ou ID playlist)</label>
          <input
            type="text"
            value={((c.spotifyEmbedUrl as string) ?? (c.spotifyPlaylistId as string) ?? '').trim()}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v.startsWith('http')) {
                u('spotifyEmbedUrl', v);
                u('spotifyPlaylistId', '');
              } else if (v) {
                u('spotifyPlaylistId', v);
                u('spotifyEmbedUrl', '');
              } else {
                u('spotifyEmbedUrl', '');
                u('spotifyPlaylistId', '');
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
          {renderSizeRow(true, true)}
          <label className="block text-sm font-medium">Titre section</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
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
                  u('videos', v);
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
                  u('videos', v);
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
          {renderSizeRow(true, true)}
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Sous-titre (retours à la ligne possibles)</label>
          <textarea
            value={(c.subtitle as string) ?? ''}
            onChange={(e) => u('subtitle', e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte de présentation</label>
          <textarea
            value={(c.body as string) ?? ''}
            onChange={(e) => u('body', e.target.value)}
            rows={5}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte du bouton (CTA)</label>
          <input
            type="text"
            value={(c.ctaText as string) ?? ''}
            onChange={(e) => u('ctaText', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            placeholder="Réserver une prestation"
          />
          <ImageUploadField
            label="Image 1 (scène / concert)"
            value={(c.imageUrl1 as string) ?? ''}
            onChange={(url) => u('imageUrl1', url)}
            pathPrefix="scene"
          />
          <ImageUploadField
            label="Image 2 (scène / concert)"
            value={(c.imageUrl2 as string) ?? ''}
            onChange={(url) => u('imageUrl2', url)}
            pathPrefix="scene"
          />
        </>
      );
    }

    if (key === 'portrait') {
      const blockFr = content.fr as Record<string, unknown> | undefined;
      const images = ((content as Record<string, unknown>).images ?? blockFr?.images ?? c.images ?? []) as { url: string; alt?: string }[];
      const scrollSpeed = typeof (content as Record<string, unknown>).scrollSpeed === 'number'
        ? (content as Record<string, unknown>).scrollSpeed as number
        : typeof blockFr?.scrollSpeed === 'number'
          ? blockFr.scrollSpeed as number
          : typeof c.scrollSpeed === 'number'
            ? c.scrollSpeed
            : 40;
      return (
        <>
          {renderSizeRow(true, true)}
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
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
          {renderSizeRow(true, true)}
          <label className="block text-sm font-medium">Titre</label>
          <input
            type="text"
            value={(c.title as string) ?? ''}
            onChange={(e) => u('title', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Texte</label>
          <textarea
            value={(c.body as string) ?? ''}
            onChange={(e) => u('body', e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Email</label>
          <input
            type="text"
            value={(c.email as string) ?? ''}
            onChange={(e) => u('email', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <label className="mt-4 block text-sm font-medium">Téléphone</label>
          <input
            type="text"
            value={(c.phone as string) ?? ''}
            onChange={(e) => u('phone', e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          />
          <ImageUploadField
            label="Photo de présentation"
            value={(c.imageUrl as string) ?? ''}
            onChange={(url) => u('imageUrl', url)}
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
                  u('links', next);
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
                    u('links', next);
                  }}
                  className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
                />
                <ImageUploadField
                  label="Logo personnalisé (optionnel, max 10 Ko)"
                  value={link.imageUrl ?? ''}
                  onChange={(url) => {
                    const next = links.filter((l) => l.platform !== platform);
                    next.push({ ...link, platform, imageUrl: url });
                    u('links', next);
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
          {renderSizeRow(false, true)}
          <label className="block text-sm font-medium">Texte pied de page (retours à la ligne possibles)</label>
          <textarea
            value={(c.text as string) ?? ''}
            onChange={(e) => u('text', e.target.value)}
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
        <h3 className="text-xl font-bold">{titleOverride ?? `Modifier : ${section.key}`}</h3>
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
