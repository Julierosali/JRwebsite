/**
 * Lecture des sections côté serveur (rendu SSR / ISR pour le référencement).
 */
import { supabase, Section } from './supabase';
import { getSectionContent } from './locale';

export async function getSections(): Promise<Section[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data as Section[]) ?? [];
}

export async function getAlbumSection(): Promise<Section | null> {
  const { data } = await supabase.from('sections').select('*').eq('key', 'album').maybeSingle();
  return (data as Section) ?? null;
}

export async function getSectionByKey(key: string): Promise<Section | null> {
  const { data } = await supabase.from('sections').select('*').eq('key', key).maybeSingle();
  return (data as Section) ?? null;
}

/** Slug de la page album (lu dans le contenu FR, qui fait foi). */
export function getAlbumSlug(section: Section | null): string {
  const content = getSectionContent<{ pageSlug?: string }>(
    section?.content as Record<string, unknown> | undefined,
    'fr'
  );
  return content.pageSlug?.trim() || 'album';
}

/** Chemin public de la page album : /album pour le slug par défaut, /album/<slug> sinon. */
export function albumPathFromSlug(slug: string): string {
  return slug === 'album' ? '/album' : `/album/${encodeURIComponent(slug)}`;
}
