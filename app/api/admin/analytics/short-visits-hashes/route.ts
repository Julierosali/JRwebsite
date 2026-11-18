import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';
import { fetchAll, isShortVisitSession } from '@/lib/analytics-server';

type Ev = { session_id: string; event_type: string; duration: number | null };

export async function GET(req: NextRequest) {
  const { adminId } = await getAdminIdFromRequest(req);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });

  try {
    const [sessions, events] = await Promise.all([
      fetchAll<{ session_id: string; ip_hash: string }>((from, to) =>
        supabase.from('analytics_sessions').select('session_id, ip_hash').order('session_id').range(from, to)
      ),
      fetchAll<Ev>((from, to) =>
        supabase.from('analytics_events').select('session_id, event_type, duration').order('id').range(from, to)
      ),
    ]);

    const bySession: Record<string, Ev[]> = {};
    events.forEach((e) => (bySession[e.session_id] ??= []).push(e));

    const hashes = new Set<string>();
    sessions.forEach((s) => {
      if (isShortVisitSession(bySession[s.session_id] ?? [])) hashes.add(s.ip_hash);
    });
    return NextResponse.json({ hashes: Array.from(hashes) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
