import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';
import { isLikelyBot } from '@/lib/bot-detection';

export async function GET(req: NextRequest) {
  const { adminId, reason } = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized', reason }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });
  }

  const { data: sessions } = await supabase
    .from('analytics_sessions')
    .select('ip_hash, user_agent');

  const botHashes = new Set<string>();
  (sessions || []).forEach((s) => {
    if (isLikelyBot(s.user_agent as string | null)) {
      botHashes.add(s.ip_hash as string);
    }
  });

  return NextResponse.json({ hashes: Array.from(botHashes) });
}
