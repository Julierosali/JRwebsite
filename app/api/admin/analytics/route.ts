import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';
import { createHash } from 'crypto';

const SALT = process.env.ANALYTICS_IP_SALT || 'julie-rosali-analytics-v1';

function hashIp(ip: string): string {
  return createHash('sha256').update(SALT + ip.trim()).digest('hex');
}

type Filter = { include?: string[]; exclude?: string[]; excludeHashes?: string[] };

function getDateRange(period: string, days?: number): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;

  if (days != null && days > 0) {
    from = new Date(now);
    from.setDate(from.getDate() - days);
  } else if (period === 'last_month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { from: from.toISOString(), to };
}

export async function GET(req: NextRequest) {
  const adminId = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : undefined;
  const period = searchParams.get('period') || 'current_month';
  const pageParam = searchParams.get('page');
  const page = Math.max(1, parseInt(pageParam || '1', 10));
  const perPage = 20;
  const offset = (page - 1) * perPage;

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });
  }

  const { from, to } = getDateRange(period, days);

  let filter: Filter = { include: [], exclude: [], excludeHashes: [] };
  const { data: settingsRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'analytics_ip_filter')
    .maybeSingle();
  if (settingsRow?.value && typeof settingsRow.value === 'object') {
    const v = settingsRow.value as Record<string, unknown>;
    filter = {
      include: Array.isArray(v.include) ? v.include as string[] : [],
      exclude: Array.isArray(v.exclude) ? v.exclude as string[] : [],
      excludeHashes: Array.isArray(v.excludeHashes) ? v.excludeHashes as string[] : [],
    };
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('analytics_sessions')
    .select('session_id, ip_hash, ip, country, city, referrer, browser, device, os, created_at')
    .eq('is_authenticated', false)
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false });

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  const includeHashes = new Set(
    (filter.include || []).map((ip) => hashIp(ip))
  );
  const excludeHashes = new Set(
    [...(filter.exclude || []).map((ip) => hashIp(ip)), ...(filter.excludeHashes || [])]
  );

  let filtered = (sessions || []).filter((s) => {
    const h = s.ip_hash as string;
    if (excludeHashes.has(h)) return false;
    if ((filter.include?.length ?? 0) > 0 && !includeHashes.has(h)) return false;
    return true;
  });

  const sessionIds = new Set(filtered.map((s) => s.session_id));

  const { data: events, error: eventsError } = await supabase
    .from('analytics_events')
    .select('session_id, event_type, path, element_id, duration, created_at')
    .in('session_id', Array.from(sessionIds));

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const eventsList = events || [];
  const pageviews = eventsList.filter((e) => e.event_type === 'pageview');
  const clicks = eventsList.filter((e) => e.event_type === 'click');

  const uniqueVisitors = filtered.length;
  const totalViews = pageviews.length;
  const withDuration = pageviews.filter((p) => p.duration != null && p.duration > 0);
  const avgDuration =
    withDuration.length > 0
      ? Math.round(withDuration.reduce((a, p) => a + (p.duration || 0), 0) / withDuration.length)
      : 0;
  const singlePageVisits = sessionIds.size > 0
    ? Array.from(sessionIds).filter((sid) => {
        const count = pageviews.filter((e) => e.session_id === sid).length;
        return count <= 1;
      }).length
    : 0;
  const bounceRate = uniqueVisitors > 0 ? Math.round((singlePageVisits / uniqueVisitors) * 100) : 0;
  const pagesPerVisit =
    uniqueVisitors > 0
      ? Math.round((totalViews / uniqueVisitors) * 100) / 100
      : 0;

  const pathCount: Record<string, number> = {};
  pageviews.forEach((e) => {
    const p = (e.path as string) || '';
    pathCount[p] = (pathCount[p] || 0) + 1;
  });
  const topContents = Object.entries(pathCount)
    .map(([path, count]) => ({ path: path || '/', count }))
    .sort((a, b) => b.count - a.count)
    .slice(offset, offset + perPage);

  const countryCount: Record<string, number> = {};
  const cityCount: Record<string, number> = {};
  filtered.forEach((s) => {
    const c = (s.country as string) || 'Inconnu';
    const v = (s.city as string) || 'Inconnu';
    countryCount[c] = (countryCount[c] || 0) + 1;
    cityCount[v] = (cityCount[v] || 0) + 1;
  });
  const byCountry = Object.entries(countryCount)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(offset, offset + perPage);
  const byCity = Object.entries(cityCount)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(offset, offset + perPage);

  const clickCount: Record<string, number> = {};
  clicks.forEach((e) => {
    const id = (e.element_id as string) || 'sans-id';
    clickCount[id] = (clickCount[id] || 0) + 1;
  });
  const topClicks = Object.entries(clickCount)
    .map(([element_id, count]) => ({ element_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(offset, offset + perPage);

  const sourceCount: Record<string, number> = {};
  filtered.forEach((s) => {
    const ref = (s.referrer as string) || 'direct';
    const br = (s.browser as string) || 'Inconnu';
    const key = `${ref}|${br}`;
    sourceCount[key] = (sourceCount[key] || 0) + 1;
  });
  const bySource = Object.entries(sourceCount)
    .map(([key, count]) => {
      const [referrer, browser] = key.split('|');
      return { referrer, browser, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(offset, offset + perPage);

  const visitsByPage = Object.entries(pathCount)
    .map(([path, count]) => ({ path: path || '/', count }))
    .sort((a, b) => b.count - a.count)
    .slice(offset, offset + perPage);

  const visitorsByHash: Record<
    string,
    { ip_hash: string; ip: string | null; country: string; city: string; sessionCount: number }
  > = {};
  filtered.forEach((s) => {
    const h = s.ip_hash as string;
    if (!visitorsByHash[h]) {
      visitorsByHash[h] = {
        ip_hash: h,
        ip: (s.ip as string) ?? null,
        country: (s.country as string) || 'Inconnu',
        city: (s.city as string) || 'Inconnu',
        sessionCount: 0,
      };
    }
    visitorsByHash[h].sessionCount += 1;
  });
  const visitors = Object.values(visitorsByHash)
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(offset, offset + perPage);

  return NextResponse.json({
    filter: { include: filter.include || [], exclude: filter.exclude || [], excludeHashes: filter.excludeHashes || [] },
    kpis: {
      uniqueVisitors: uniqueVisitors,
      totalViews,
      avgDurationSeconds: avgDuration,
      bounceRate,
      pagesPerVisit,
    },
    topContents,
    byCountry,
    byCity,
    topClicks,
    bySource,
    visitsByPage,
    visitors,
    period: { from, to },
    page,
    perPage,
  });
}
