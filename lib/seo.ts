/**
 * SEO Command Center - Types et accès données (client + serveur).
 * Les métadonnées doivent être lues côté serveur (generateMetadata) pour le crawl.
 */

import { supabase } from './supabase';

export const SEO_ASSETS_BUCKET = 'seo-assets';

export type PageSeoSettings = {
  id: string;
  path: string;
  meta_title: string | null;
  meta_description: string | null;
  h1: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  og_type: string | null;
  twitter_card: string | null;
  twitter_title: string | null;
  twitter_image_url: string | null;
  json_ld: string | null;
  favicon_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PageSeoSettingsInsert = Omit<PageSeoSettings, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<PageSeoSettings, 'id'>>;
export type PageSeoSettingsUpdate = Partial<Omit<PageSeoSettings, 'id' | 'path' | 'created_at'>>;

export const SEO_PATHS = [
  { value: '_global', label: 'Global (favicon)' },
  { value: '/', label: 'Accueil' },
  { value: '/album', label: 'Album (liste)' },
  { value: '/album/[slug]', label: 'Album (détail)' },
] as const;

export const OG_TYPES = ['website', 'article', 'music.album', 'profile'] as const;
export const TWITTER_CARDS = ['summary', 'summary_large_image', 'player', 'app'] as const;

/**
 * Récupère les réglages SEO pour un path (côté serveur ou client).
 * Utilisé par generateMetadata (SSR) et par la modale admin.
 */
export async function getSeoSettings(path: string): Promise<PageSeoSettings | null> {
  const { data, error } = await supabase
    .from('page_seo_settings')
    .select('*')
    .eq('path', path)
    .maybeSingle();
  if (error) return null;
  return data as PageSeoSettings | null;
}

/**
 * Récupère tous les réglages SEO (pour la modale admin).
 */
export async function getAllSeoSettings(): Promise<PageSeoSettings[]> {
  const { data, error } = await supabase
    .from('page_seo_settings')
    .select('*')
    .order('path', { ascending: true });
  if (error) return [];
  return (data ?? []) as PageSeoSettings[];
}

/**
 * Upsert des réglages SEO pour un path (modale admin).
 */
export async function saveSeoSettings(path: string, row: PageSeoSettingsUpdate): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('page_seo_settings')
    .upsert(
      { path, ...row, updated_at: new Date().toISOString() },
      { onConflict: 'path' }
    );
  return { error: error ?? null };
}
