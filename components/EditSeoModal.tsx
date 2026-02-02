'use client';

import { useState, useEffect } from 'react';
import {
  getAllSeoSettings,
  saveSeoSettings,
  SEO_PATHS,
  OG_TYPES,
  TWITTER_CARDS,
  type PageSeoSettings,
  type PageSeoSettingsUpdate,
} from '@/lib/seo';
import { SeoImageUpload } from '@/components/SeoImageUpload';

type EditSeoModalProps = { onClose: () => void };

export function EditSeoModal({ onClose }: EditSeoModalProps) {
  const [rows, setRows] = useState<PageSeoSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>('_global');
  const [form, setForm] = useState<PageSeoSettingsUpdate>({});

  useEffect(() => {
    getAllSeoSettings().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  const globalRow = rows.find((r) => r.path === '_global');
  const currentRow = rows.find((r) => r.path === selectedPath) ?? globalRow;

  useEffect(() => {
    if (!currentRow) return;
    setForm({
      meta_title: currentRow.meta_title ?? '',
      meta_description: currentRow.meta_description ?? '',
      h1: currentRow.h1 ?? '',
      canonical_url: currentRow.canonical_url ?? '',
      robots_index: currentRow.robots_index ?? true,
      robots_follow: currentRow.robots_follow ?? true,
      og_title: currentRow.og_title ?? '',
      og_description: currentRow.og_description ?? '',
      og_image_url: currentRow.og_image_url ?? '',
      og_type: currentRow.og_type ?? 'website',
      twitter_card: currentRow.twitter_card ?? 'summary_large_image',
      twitter_title: currentRow.twitter_title ?? '',
      twitter_image_url: currentRow.twitter_image_url ?? '',
      json_ld: currentRow.json_ld ?? '',
      favicon_url: currentRow.favicon_url ?? '',
    });
  }, [currentRow, selectedPath]);

  const updateGlobalFavicon = (url: string) => {
    setRows((prev) =>
      prev.map((r) => (r.path === '_global' ? { ...r, favicon_url: url } : r))
    );
    saveSeoSettings('_global', { favicon_url: url });
  };

  const updateForm = (updates: Partial<PageSeoSettingsUpdate>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    const payload: PageSeoSettingsUpdate =
      selectedPath === '_global'
        ? { favicon_url: form.favicon_url ?? null }
        : {
            meta_title: form.meta_title ?? null,
            meta_description: form.meta_description ?? null,
            h1: form.h1 ?? null,
            canonical_url: form.canonical_url ?? null,
            robots_index: form.robots_index ?? true,
            robots_follow: form.robots_follow ?? true,
            og_title: form.og_title ?? null,
            og_description: form.og_description ?? null,
            og_image_url: form.og_image_url ?? null,
            og_type: form.og_type ?? null,
            twitter_card: form.twitter_card ?? null,
            twitter_title: form.twitter_title ?? null,
            twitter_image_url: form.twitter_image_url ?? null,
            json_ld: form.json_ld ?? null,
          };
    const { error } = await saveSeoSettings(selectedPath, payload);
    setSaving(false);
    if (error) {
      setSaveError(error.message || 'Erreur lors de l\'enregistrement');
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.path === selectedPath ? { ...r, ...form } : r))
    );
    if (selectedPath === '_global') {
      setRows((prev) =>
        prev.map((r) => (r.path === '_global' ? { ...r, favicon_url: form.favicon_url ?? null } : r))
      );
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet border-t-transparent" />
      </div>
    );
  }

  const isGlobal = selectedPath === '_global';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-blue/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold">SEO Command Center</h3>
        <p className="mt-1 text-sm text-white/70">
          Métadonnées injectées côté serveur (crawl Google).
        </p>

        {/* Favicon en haut (global) */}
        <div className="mt-6 border-b border-white/20 pb-4">
          <p className="text-sm font-medium text-white/90">Favicon du site (global)</p>
          <SeoImageUpload
            label="Favicon (.ico ou .png, max 5 Ko)"
            value={globalRow?.favicon_url ?? ''}
            onChange={updateGlobalFavicon}
            subPath="favicon"
            maxSizeBytes={5 * 1024}
          />
        </div>

        {/* Sélection de page */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-white/90">Page à éditer</label>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
          >
            {SEO_PATHS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {!isGlobal && (
          <>
            {/* Basic */}
            <div className="mt-6 border-b border-white/20 pb-4">
              <p className="text-sm font-medium text-white/90">Basique</p>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-xs text-white/70">Meta Title</label>
                  <input
                    type="text"
                    value={form.meta_title ?? ''}
                    onChange={(e) => updateForm({ meta_title: e.target.value })}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                    placeholder="Titre de la page (SEO)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">Meta Description</label>
                  <textarea
                    value={form.meta_description ?? ''}
                    onChange={(e) => updateForm({ meta_description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                    placeholder="Description pour les moteurs de recherche"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">H1 principal</label>
                  <input
                    type="text"
                    value={form.h1 ?? ''}
                    onChange={(e) => updateForm({ h1: e.target.value })}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                    placeholder="Titre H1 affiché"
                  />
                </div>
              </div>
            </div>

            {/* Technique */}
            <div className="mt-4 border-b border-white/20 pb-4">
              <p className="text-sm font-medium text-white/90">Technique</p>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-xs text-white/70">Canonical URL</label>
                  <input
                    type="url"
                    value={form.canonical_url ?? ''}
                    onChange={(e) => updateForm({ canonical_url: e.target.value })}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.robots_index !== false}
                      onChange={(e) => updateForm({ robots_index: e.target.checked })}
                      className="rounded border-white/30"
                    />
                    <span className="text-sm text-white/90">Index (noindex si décoché)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.robots_follow !== false}
                      onChange={(e) => updateForm({ robots_follow: e.target.checked })}
                      className="rounded border-white/30"
                    />
                    <span className="text-sm text-white/90">Follow (nofollow si décoché)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Open Graph */}
            <div className="mt-4 border-b border-white/20 pb-4">
              <p className="text-sm font-medium text-white/90">Open Graph (Facebook / LinkedIn)</p>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-xs text-white/70">OG Title</label>
                  <input
                    type="text"
                    value={form.og_title ?? ''}
                    onChange={(e) => updateForm({ og_title: e.target.value })}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">OG Description</label>
                  <textarea
                    value={form.og_description ?? ''}
                    onChange={(e) => updateForm({ og_description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <SeoImageUpload
                    label="OG Image (partage social, max 30 Ko)"
                    value={form.og_image_url ?? ''}
                    onChange={(url) => updateForm({ og_image_url: url })}
                    subPath="og"
                    maxSizeBytes={30 * 1024}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70">OG Type</label>
                  <select
                    value={form.og_type ?? 'website'}
                    onChange={(e) => updateForm({ og_type: e.target.value })}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                  >
                    {OG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Twitter */}
            <div className="mt-4 border-b border-white/20 pb-4">
              <p className="text-sm font-medium text-white/90">Twitter Card</p>
              <div className="mt-2 space-y-2">
                <div>
                  <label className="block text-xs text-white/70">Twitter Card Type</label>
                  <select
                    value={form.twitter_card ?? 'summary_large_image'}
                    onChange={(e) => updateForm({ twitter_card: e.target.value })}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                  >
                    {TWITTER_CARDS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/70">Twitter Title</label>
                  <input
                    type="text"
                    value={form.twitter_title ?? ''}
                    onChange={(e) => updateForm({ twitter_title: e.target.value })}
                    className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <SeoImageUpload
                    label="Twitter Image (max 30 Ko)"
                    value={form.twitter_image_url ?? ''}
                    onChange={(url) => updateForm({ twitter_image_url: url })}
                    subPath="twitter"
                    maxSizeBytes={30 * 1024}
                  />
                </div>
              </div>
            </div>

            {/* JSON-LD */}
            <div className="mt-4 border-b border-white/20 pb-4">
              <p className="text-sm font-medium text-white/90">Structured Data (JSON-LD)</p>
              <p className="mt-1 text-xs text-white/60">
                Schéma schema.org injecté dans la page. JSON valide uniquement.
              </p>
              <textarea
                value={form.json_ld ?? ''}
                onChange={(e) => updateForm({ json_ld: e.target.value })}
                rows={6}
                className="mt-2 w-full rounded border border-white/30 bg-black/30 px-3 py-2 font-mono text-xs text-white"
                placeholder='{"@context":"https://schema.org",...}'
              />
            </div>
          </>
        )}

        {saveError && (
          <p className="mt-4 rounded border border-red-400/50 bg-red-900/20 px-3 py-2 text-sm text-red-200">
            {saveError}
          </p>
        )}
        {saveSuccess && (
          <p className="mt-4 rounded border border-green-400/50 bg-green-900/20 px-3 py-2 text-sm text-green-200">
            Enregistré.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-white/20 px-4 py-2 font-medium transition hover:bg-white/30"
          >
            Fermer
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
