/**
 * Utilitaires serveur pour les statistiques.
 * Supabase limite chaque réponse à 1000 lignes : on pagine systématiquement,
 * et on découpe les filtres `.in()` pour ne pas dépasser la longueur d'URL.
 */
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const SALT = process.env.ANALYTICS_IP_SALT || 'julie-rosali-analytics-v1';

export function hashIp(ip: string): string {
  return createHash('sha256').update(SALT + ip.trim()).digest('hex');
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || '';
}

const PAGE_SIZE = 1000;
const IN_CHUNK = 150;

type PageResult = PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;

/** Récupère toutes les lignes d'une requête en paginant par tranches de 1000. */
export async function fetchAll<T>(build: (from: number, to: number) => PageResult): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

export function chunk<T>(items: T[], size = IN_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export type EventRow = {
  session_id: string;
  event_type: string;
  path: string;
  element_id: string | null;
  duration: number | null;
  created_at: string;
};

/** Événements de plusieurs sessions (découpage + pagination). */
export async function fetchEventsForSessions(
  supabase: SupabaseClient,
  sessionIds: string[],
  columns = 'session_id, event_type, path, element_id, duration, created_at'
): Promise<EventRow[]> {
  const all: EventRow[] = [];
  for (const ids of chunk(sessionIds)) {
    const rows = await fetchAll<EventRow>((from, to) =>
      supabase
        .from('analytics_events')
        .select(columns)
        .in('session_id', ids)
        .order('id', { ascending: true })
        .range(from, to)
    );
    all.push(...rows);
  }
  return all;
}

/** Supprime des sessions (et leurs événements, via ON DELETE CASCADE). Retourne le nombre supprimé. */
export async function deleteSessions(supabase: SupabaseClient, sessionIds: string[]): Promise<number> {
  let deleted = 0;
  for (const ids of chunk(sessionIds)) {
    await supabase.from('analytics_events').delete().in('session_id', ids);
    const { error } = await supabase.from('analytics_sessions').delete().in('session_id', ids);
    if (error) throw new Error(error.message);
    deleted += ids.length;
  }
  return deleted;
}

/**
 * Sessions « visite courte » : toutes leurs pages vues ont duré moins d'1 s
 * (ou n'ont pas de durée). Les clics n'entrent pas en compte.
 */
export function isShortVisitSession(events: { event_type?: string; duration: number | null }[]): boolean {
  const pageviews = events.filter((e) => (e.event_type ?? 'pageview') === 'pageview');
  if (pageviews.length === 0) return events.length > 0;
  return pageviews.every((e) => e.duration == null || e.duration < 1);
}
