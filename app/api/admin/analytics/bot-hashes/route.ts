import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';
import { isLikelyBot } from '@/lib/bot-detection';
import { fetchAll } from '@/lib/analytics-server';

export async function GET(req: NextRequest) {
  const { adminId } = await getAdminIdFromRequest(req);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });

  try {
    const sessions = await fetchAll<{ ip_hash: string; user_agent: string | null }>((from, to) =>
      supabase.from('analytics_sessions').select('ip_hash, user_agent').order('session_id').range(from, to)
    );
    const botHashes = new Set(sessions.filter((s) => isLikelyBot(s.user_agent)).map((s) => s.ip_hash));
    return NextResponse.json({ hashes: Array.from(botHashes) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
