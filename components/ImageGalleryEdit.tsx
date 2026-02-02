'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { compressImageToWebp } from '@/lib/compress';
import { uploadImage } from '@/lib/upload';

const MAX_SIZE_BYTES = 500 * 1024; // 500 Ko (galerie)

type ImageItem = { url: string; alt?: string };

type ImageGalleryEditProps = {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  pathPrefix: string;
};

export function ImageGalleryEdit({ images, onChange, pathPrefix }: ImageGalleryEditProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setError(null);
    setUploading(true);
    try {
      const compressed = await compressImageToWebp(file, MAX_SIZE_BYTES);
      const url = await uploadImage(compressed, pathPrefix);
      onChange([...images, { url, alt: '' }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: 'up' | 'down') => {
    const next = [...images];
    const j = direction === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium">Galerie photo</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-2 flex w-full items-center justify-center rounded-lg border-2 border-dashed border-white/40 bg-white/5 py-6 text-sm font-medium text-white/80 transition hover:border-white/60 hover:bg-white/10 disabled:opacity-50"
      >
        {uploading ? 'Import en cours…' : 'Ajouter une photo depuis l\'ordinateur'}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      {images.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <li key={i} className="flex flex-col items-center gap-1 rounded border border-white/20 bg-black/20 p-1.5">
              <div className="relative h-14 w-full overflow-hidden rounded bg-black/30" style={{ aspectRatio: '1' }}>
                <Image
                  src={img.url}
                  alt={img.alt ?? ''}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={img.url.includes('supabase.co')}
                />
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => move(i, 'up')}
                  className="rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-xs disabled:opacity-40"
                  title="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 'down')}
                  className="rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-xs disabled:opacity-40"
                  title="Descendre"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded border border-red-400/50 bg-red-900/20 px-1.5 py-0.5 text-xs text-red-200 hover:bg-red-900/40"
                >
                  Suppr.
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
