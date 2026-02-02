'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { compressImageToWebp } from '@/lib/compress';
import { uploadImage } from '@/lib/upload';

const DEFAULT_MAX_SIZE = 200 * 1024; // 200 Ko

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  pathPrefix: string;
  /** Taille max en octets (défaut 200 Ko). Ex. 10 Ko pour icônes : 10240 */
  maxSizeBytes?: number;
};

export function ImageUploadField({ label, value, onChange, pathPrefix, maxSizeBytes = DEFAULT_MAX_SIZE }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setError(null);
    setUploading(true);
    try {
      const compressed = await compressImageToWebp(file, maxSizeBytes);
      const url = await uploadImage(compressed, pathPrefix);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="mt-2 flex flex-wrap items-start gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/30 bg-black/30">
            <Image
              src={value}
              alt="Aperçu"
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={value.startsWith('data:') || value.includes('supabase.co')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 disabled:opacity-50"
            >
              {uploading ? 'Import…' : 'Remplacer par une photo'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={uploading}
              className="rounded border border-red-400/50 bg-red-900/20 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-900/40 disabled:opacity-50"
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
          className="mt-2 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-white/40 bg-white/5 py-8 text-sm font-medium text-white/80 transition hover:border-white/60 hover:bg-white/10 disabled:opacity-50"
        >
          {uploading ? 'Import en cours…' : 'Importer une photo depuis l\'ordinateur'}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
