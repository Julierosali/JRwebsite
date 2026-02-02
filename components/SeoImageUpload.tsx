'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { uploadSeoAsset } from '@/lib/upload-seo';
import { compressImageToWebp } from '@/lib/compress';

type SeoImageUploadProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  subPath: string;
  /** Limite de taille en octets (ex. 5 Ko pour le favicon). Pour .ico : rejet si dépassement. Pour png/jpeg/webp : compression WebP. */
  maxSizeBytes?: number;
};

export function SeoImageUpload({ label, value, onChange, subPath, maxSizeBytes }: SeoImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIco = (f: File) =>
    f.type === 'image/x-icon' ||
    f.type === 'image/vnd.microsoft.icon' ||
    f.name.toLowerCase().endsWith('.ico');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setError(null);
    if (maxSizeBytes != null) {
      if (isIco(file)) {
        if (file.size > maxSizeBytes) {
          setError(`Le favicon ne doit pas dépasser ${Math.round(maxSizeBytes / 1024)} Ko.`);
          e.target.value = '';
          return;
        }
      } else {
        // png/jpeg/webp : compression vers WebP sous la limite
        setUploading(true);
        try {
          const blob = await compressImageToWebp(file, maxSizeBytes);
          if (blob.size > maxSizeBytes) {
            setError(`Impossible de réduire l'image sous ${Math.round(maxSizeBytes / 1024)} Ko. Utilisez une image plus petite ou un .ico.`);
            e.target.value = '';
            return;
          }
          const compressedFile = new File(
            [blob],
            (file.name.replace(/\.[^.]+$/, '') || 'image') + '.webp',
            { type: 'image/webp' }
          );
          const url = await uploadSeoAsset(compressedFile, subPath);
          onChange(url);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
        } finally {
          setUploading(false);
          e.target.value = '';
        }
        return;
      }
    }
    setUploading(true);
    try {
      const url = await uploadSeoAsset(file, subPath);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-white/90">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon"
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-white/30 bg-black/30">
            <Image
              src={value}
              alt="Aperçu"
              fill
              className="object-contain"
              sizes="64px"
              unoptimized={value.includes('supabase.co')}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded border border-white/40 bg-white/10 px-2 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-50"
            >
              {uploading ? 'Upload…' : 'Remplacer'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="rounded border border-red-400/50 bg-red-900/20 px-2 py-1.5 text-xs text-red-200 hover:bg-red-900/40"
            >
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-2 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-white/40 bg-white/5 py-4 text-sm text-white/80 hover:border-white/60 hover:bg-white/10 disabled:opacity-50"
        >
          {uploading ? 'Upload en cours…' : 'Choisir un fichier'}
        </button>
      )}
      {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  );
}
