import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';
import { createHash } from 'crypto';
import { isLikelyBot } from '@/lib/bot-detection';

const SALT = process.env.ANALYTICS_IP_SALT || 'julie-rosali-analytics-v1';

function hashIp(ip: string): string {
  return createHash('sha256').update(SALT + ip.trim()).digest('hex');
}

export async function POST(req: NextRequest) {
  const adminId = await getAdminIdFromRequest(req);
  const secret = req.headers.get('x-cron-secret') || req.headers.get('authorization');
  const isCron = process.env.CRON_SECRET && secret === `Bearer ${process.env.CRON_SECRET}`;

  if (!adminId && !isCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === '1';
  const olderThan = searchParams.get('olderThan');

  let body: { ips?: string[]; hashes?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    // no body
  }

  const botsOnly = searchParams.get('bots') === '1';

  if (botsOnly) {
    const { data: sessions } = await supabase
      .from('analytics_sessions')
      .select('session_id, user_agent');
    const botSessionIds = (sessions || [])
      .filter((s) => isLikelyBot(s.user_agent as string | null))
      .map((s) => s.session_id);
    let deleted = 0;
    const batchSize = 500;
    for (let i = 0; i < botSessionIds.length; i += batchSize) {
      const batch = botSessionIds.slice(i, i + batchSize);
      await supabase.from('analytics_events').delete().in('session_id', batch);
      const { error } = await supabase.from('analytics_sessions').delete().in('session_id', batch);
      if (!error) deleted += batch.length;
    }
    return NextResponse.json({ ok: true, purged: 'bots', count: deleted });
  }

  if (all) {
    const { error: delEvents } = await supabase.from('analytics_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delEvents) {
      return NextResponse.json({ error: delEvents.message }, { status: 500 });
    }
    const { error: delSessions } = await supabase.from('analytics_sessions').delete().neq('session_id', '00000000-0000-0000-0000-0000-000000000000');
    if (delSessions) {
      return NextResponse.json({ error: delSessions.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, purged: 'all' });
  }

  if (olderThan === '1month') {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    const before = d.toISOString();
    const { data: sessions } = await supabase.from('analytics_sessions').select('session_id').lt('created_at', before);
    const ids = (sessions || []).map((s) => s.session_id);
    if (ids.length > 0) {
      await supabase.from('analytics_events').delete().in('session_id', ids);
      const { error } = await supabase.from('analytics_sessions').delete().in('session_id', ids);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, purged: 'olderThan1month', count: ids.length });
  }

  if (body.hashes && body.hashes.length > 0) {
    const hashes = body.hashes as string[];
    const { data: sessions } = await supabase.from('analytics_sessions').select('session_id').in('ip_hash', hashes);
    const ids = (sessions || []).map((s) => s.session_id);
    if (ids.length > 0) {
      await supabase.from('analytics_events').delete().in('session_id', ids);
      const { error } = await supabase.from('analytics_sessions').delete().in('session_id', ids);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, purged: 'hashes', count: ids.length });
  }

  if (body.ips && body.ips.length > 0) {
    const hashes = (body.ips as string[]).map((ip) => hashIp(ip));
    const { data: sessions } = await supabase.from('analytics_sessions').select('session_id').in('ip_hash', hashes);
    const ids = (sessions || []).map((s) => s.session_id);
    if (ids.length > 0) {
      await supabase.from('analytics_events').delete().in('session_id', ids);
      const { error } = await supabase.from('analytics_sessions').delete().in('session_id', ids);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true, purged: 'ips', count: ids.length });
  }

  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  const before = d.toISOString();
  const { data: sessions } = await supabase.from('analytics_sessions').select('session_id').lt('created_at', before);
  const ids = (sessions || []).map((s) => s.session_id);
  if (ids.length > 0) {
    await supabase.from('analytics_events').delete().in('session_id', ids);
    const { error } = await supabase.from('analytics_sessions').delete().in('session_id', ids);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, purged: 'olderThan3months', count: ids.length });
}
