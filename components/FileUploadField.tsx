'use client';

import { useRef, useState } from 'react';
import { uploadFile } from '@/lib/upload';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

type FileUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  pathPrefix: string;
  /** Types de fichiers acceptés (défaut : PDF) */
  accept?: string;
  /** Taille max en octets (défaut 10 Mo) */
  maxSizeBytes?: number;
};

export function FileUploadField({ label, value, onChange, pathPrefix, accept = '.pdf,application/pdf', maxSizeBytes = DEFAULT_MAX_SIZE }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileName = value ? decodeURIComponent(value.split('/').pop() ?? '').replace(/^\d+-/, '') : '';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeBytes) {
      setError(`Fichier trop lourd (max ${Math.round(maxSizeBytes / 1024 / 1024)} Mo)`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file, pathPrefix);
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
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
      {value ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-black/20 px-4 py-2.5">
            <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="max-w-[180px] truncate text-sm text-white/80">{fileName || 'Fichier'}</span>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 disabled:opacity-50"
          >
            {uploading ? 'Import…' : 'Remplacer'}
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
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/40 bg-white/5 py-6 text-sm font-medium text-white/80 transition hover:border-white/60 hover:bg-white/10 disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? 'Import en cours…' : 'Importer un fichier PDF'}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
