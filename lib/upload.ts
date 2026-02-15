import { supabase } from './supabase';

const BUCKET = 'site-images';
const DOCS_BUCKET = 'site-documents';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
}

/**
 * Upload une image (Blob WebP compressé ou File) vers Supabase Storage.
 * Retourne l'URL publique de l'image.
 * L'utilisateur doit être authentifié (admin).
 */
export async function uploadImage(
  blobOrFile: Blob | File,
  pathPrefix: string
): Promise<string> {
  const isBlob = blobOrFile instanceof Blob && !(blobOrFile instanceof File);
  const timestamp = Date.now();
  const ext = isBlob ? 'webp' : (blobOrFile.name.split('.').pop()?.toLowerCase() || 'webp');
  const baseName = isBlob
    ? String(timestamp)
    : sanitizeFileName((blobOrFile as File).name.replace(/\.[^.]+$/, ''));
  const path = isBlob
    ? `${pathPrefix}/${timestamp}.webp`
    : `${pathPrefix}/${timestamp}-${baseName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blobOrFile, {
    cacheControl: '3600',
    upsert: false,
    contentType: isBlob ? 'image/webp' : undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload un fichier (PDF, etc.) vers Supabase Storage (bucket site-documents).
 * Retourne l'URL publique du fichier.
 */
export async function uploadFile(
  file: File,
  pathPrefix: string
): Promise<string> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
  const path = `${pathPrefix}/${timestamp}-${baseName}.${ext}`;

  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || 'application/pdf',
  });

  if (error) throw error;

  const { data } = supabase.storage.from(DOCS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
