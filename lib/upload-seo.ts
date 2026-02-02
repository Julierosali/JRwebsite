/**
 * Upload d'images SEO (favicon, OG, Twitter) vers le bucket Supabase 'seo-assets'.
 */

import { supabase } from './supabase';
import { SEO_ASSETS_BUCKET } from './seo';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
}

/**
 * Upload un fichier vers seo-assets (favicon, og_image, twitter_image).
 * Retourne l'URL publique.
 */
export async function uploadSeoAsset(
  file: File,
  subPath: string
): Promise<string> {
  const timestamp = Date.now();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
  const path = `${subPath}/${timestamp}-${baseName}.${ext}`;

  const { error } = await supabase.storage.from(SEO_ASSETS_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(SEO_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
