import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';
import { isLikelyBot } from '@/lib/bot-detection';
import { hashIp, fetchAll, deleteSessions, isShortVisitSession, chunk } from '@/lib/analytics-server';

/** Durée de conservation des statistiques (annoncée dans la politique de confidentialité). */
const RETENTION_MONTHS = 3;

function isCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || req.headers.get('x-cron-secret');
  return header === `Bearer ${secret}`;
}

async function sessionIdsWhere(
  supabase: SupabaseClient,
  apply: (q: ReturnType<ReturnType<SupabaseClient['from']>['select']>) => typeof q
): Promise<string[]> {
  const rows = await fetchAll<{ session_id: string }>((from, to) =>
    apply(supabase.from('analytics_sessions').select('session_id')).order('session_id').range(from, to)
  );
  return rows.map((r) => r.session_id);
}

async function purgeOlderThan(supabase: SupabaseClient, before: Date) {
  const ids = await sessionIdsWhere(supabase, (q) => q.lt('created_at', before.toISOString()));
  return deleteSessions(supabase, ids);
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

/** Appelé chaque jour par la tâche planifiée Vercel (vercel.json) : supprime les données de plus de 3 mois. */
export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });
  try {
    const count = await purgeOlderThan(supabase, monthsAgo(RETENTION_MONTHS));
    return NextResponse.json({ ok: true, purged: `olderThan${RETENTION_MONTHS}months`, count });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { adminId } = await getAdminIdFromRequest(req);
  if (!adminId && !isCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  let body: { ips?: unknown; hashes?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // pas de corps
  }
  const asStrings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

  try {
    if (searchParams.get('bots') === '1') {
      const sessions = await fetchAll<{ session_id: string; user_agent: string | null }>((from, to) =>
        supabase.from('analytics_sessions').select('session_id, user_agent').order('session_id').range(from, to)
      );
      const ids = sessions.filter((s) => isLikelyBot(s.user_agent)).map((s) => s.session_id);
      return NextResponse.json({ ok: true, purged: 'bots', count: await deleteSessions(supabase, ids) });
    }

    if (searchParams.get('shortVisits') === '1') {
      type Ev = { session_id: string; event_type: string; duration: number | null };
      const [sessions, events] = await Promise.all([
        sessionIdsWhere(supabase, (q) => q),
        fetchAll<Ev>((from, to) =>
          supabase.from('analytics_events').select('session_id, event_type, duration').order('id').range(from, to)
        ),
      ]);
      const bySession: Record<string, Ev[]> = {};
      events.forEach((e) => (bySession[e.session_id] ??= []).push(e));
      const ids = sessions.filter((sid) => isShortVisitSession(bySession[sid] ?? []));
      return NextResponse.json({ ok: true, purged: 'shortVisits', count: await deleteSessions(supabase, ids) });
    }

    if (searchParams.get('all') === '1') {
      const { error: e1 } = await supabase.from('analytics_events').delete().not('id', 'is', null);
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase.from('analytics_sessions').delete().not('session_id', 'is', null);
      if (e2) throw new Error(e2.message);
      return NextResponse.json({ ok: true, purged: 'all' });
    }

    if (searchParams.get('olderThan') === '1month') {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return NextResponse.json({ ok: true, purged: 'olderThan1month', count: await purgeOlderThan(supabase, d) });
    }

    const hashes = [...asStrings(body.hashes), ...asStrings(body.ips).map((ip) => hashIp(ip))];
    if (hashes.length > 0) {
      const ids: string[] = [];
      for (const part of chunk(hashes)) {
        ids.push(...(await sessionIdsWhere(supabase, (q) => q.in('ip_hash', part))));
      }
      const purged = asStrings(body.hashes).length > 0 ? 'hashes' : 'ips';
      return NextResponse.json({ ok: true, purged, count: await deleteSessions(supabase, ids) });
    }

    const count = await purgeOlderThan(supabase, monthsAgo(RETENTION_MONTHS));
    return NextResponse.json({ ok: true, purged: `olderThan${RETENTION_MONTHS}months`, count });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
