'use client';

import { useState, useEffect } from 'react';
import { Section } from '@/lib/supabase';
import {
  DEFAULT_GRADIENT,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_ACCENT_OPACITY,
  buildGradientFromColors,
  type StyleContent,
} from '@/lib/style';

const ACCENT_BLOCK_KEYS = [
  { key: 'album', label: 'Nouvel album' },
  { key: 'presentation', label: "L'univers" },
  { key: 'scene', label: 'Scène' },
  { key: 'contact', label: 'Contact' },
];

const DEFAULT_COLORS: [string, string, string, string] = ['#1a3a52', '#2d5a7b', '#e07c4a', '#c96538'];

type EditStyleModalProps = {
  section: Section | null;
  onClose: () => void;
  onSave: (id: string, content: Record<string, unknown>) => Promise<void>;
};

export function EditStyleModal({ section, onClose, onSave }: EditStyleModalProps) {
  const [content, setContent] = useState<StyleContent>({});
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState<[string, string, string, string]>(DEFAULT_COLORS);
  const [angle, setAngle] = useState(135);

  useEffect(() => {
    if (!section?.content) return;
    const c = section.content as StyleContent;
    setContent(c);
    if (c.backgroundColors?.length === 4) setColors(c.backgroundColors);
    if (typeof c.backgroundAngle === 'number') setAngle(c.backgroundAngle);
  }, [section]);

  if (!section) return null;

  const update = (updates: Partial<StyleContent>) => {
    setContent((prev) => ({ ...prev, ...updates }));
  };

  const handleGradientFromColors = () => {
    const gradient = buildGradientFromColors(colors, angle);
    update({ backgroundGradient: gradient, backgroundColors: colors, backgroundAngle: angle });
  };

  const handleSave = async () => {
    setSaving(true);
    const finalGradient = content.backgroundGradient ?? buildGradientFromColors(colors, angle);
    const toSave: StyleContent = {
      ...content,
      backgroundGradient: finalGradient,
      backgroundColors: colors,
      backgroundAngle: angle,
    };
    await onSave(section.id, toSave as Record<string, unknown>);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-blue/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold">Style du site</h3>

        {/* Fond du site (dégradé) */}
        <div className="mt-6 border-b border-white/20 pb-4">
          <p className="mb-2 font-medium">Fond du site (dégradé)</p>
          <p className="mb-3 text-xs text-white/70">
            Dégradé actuel par défaut. Modifiez les couleurs et l&apos;angle pour personnaliser.
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {colors.map((color, i) => (
              <div key={i}>
                <label className="block text-xs text-white/70">Couleur {i + 1}</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const next = [...colors] as [string, string, string, string];
                    next[i] = e.target.value;
                    setColors(next);
                  }}
                  className="mt-1 h-10 w-full cursor-pointer rounded border border-white/30 bg-black/30"
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-xs text-white/70">Angle (degrés)</label>
            <input
              type="number"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value) || 135)}
              className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
            />
          </div>
          <button
            type="button"
            onClick={handleGradientFromColors}
            className="mt-2 rounded border border-white/40 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          >
            Appliquer ce dégradé
          </button>
        </div>

        {/* Couleur globale des blocs */}
        <div className="mt-6 border-b border-white/20 pb-4">
          <p className="mb-2 font-medium">Couleur des blocs (par défaut)</p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-white/70">Couleur</label>
              <input
                type="color"
                value={content.accentColor ?? DEFAULT_ACCENT_COLOR}
                onChange={(e) => update({ accentColor: e.target.value })}
                className="mt-1 h-10 w-24 cursor-pointer rounded border border-white/30 bg-black/30"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-white/70">Opacité (0–1)</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={content.accentOpacity ?? DEFAULT_ACCENT_OPACITY}
                onChange={(e) => update({ accentOpacity: Number(e.target.value) || 0.72 })}
                className="mt-1 w-full rounded border border-white/30 bg-black/30 px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Par bloc */}
        <div className="mt-6">
          <p className="mb-2 font-medium">Par bloc (optionnel)</p>
          <p className="mb-3 text-xs text-white/70">
            Laissez vide pour utiliser la couleur et l&apos;opacité par défaut ci-dessus.
          </p>
          {ACCENT_BLOCK_KEYS.map(({ key, label }) => {
            const block = content.blocks?.[key] ?? {};
            return (
              <div key={key} className="mb-3 rounded border border-white/20 p-3">
                <p className="mb-2 text-sm font-medium">{label}</p>
                <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="block text-xs text-white/70">Couleur</label>
                    <input
                      type="color"
                      value={block.color ?? ''}
                      onChange={(e) =>
                        update({
                          blocks: {
                            ...content.blocks,
                            [key]: { ...block, color: e.target.value || undefined },
                          },
                        })
                      }
                      className="mt-1 h-9 w-20 cursor-pointer rounded border border-white/30 bg-black/30"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-white/70">Opacité</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={block.opacity ?? ''}
                      placeholder="défaut"
                      onChange={(e) => {
                        const v = e.target.value;
                        update({
                          blocks: {
                            ...content.blocks,
                            [key]: { ...block, opacity: v === '' ? undefined : Number(v) },
                          },
                        });
                      }}
                      className="mt-1 w-full rounded border border-white/30 bg-black/30 px-2 py-1.5 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
