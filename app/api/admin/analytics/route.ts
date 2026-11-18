import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';
import { isLikelyBot } from '@/lib/bot-detection';
import { hashIp, fetchAll, fetchEventsForSessions } from '@/lib/analytics-server';

type SessionRow = {
  session_id: string;
  ip_hash: string;
  ip: string | null;
  country: string | null;
  city: string | null;
  referrer: string | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  user_agent: string | null;
  created_at: string;
};

type Filter = { include?: string[]; exclude?: string[]; excludeHashes?: string[]; excludeBots?: boolean; excludeShortVisits?: boolean };

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
  const { adminId, reason } = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized', reason }, { status: 401 });
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

  let filter: Filter = { include: [], exclude: [], excludeHashes: [], excludeBots: true, excludeShortVisits: true };
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
      excludeBots: filter.excludeBots,
      excludeShortVisits: filter.excludeShortVisits,
    };
  }
  const { data: botsRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'analytics_exclude_bots')
    .maybeSingle();
  if (botsRow?.value && typeof botsRow.value === 'object') {
    const v = botsRow.value as { excludeBots?: boolean };
    filter.excludeBots = v.excludeBots !== false;
  }
  const { data: shortVisitsRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'analytics_exclude_short_visits')
    .maybeSingle();
  if (shortVisitsRow?.value && typeof shortVisitsRow.value === 'object') {
    const v = shortVisitsRow.value as { excludeShortVisits?: boolean };
    filter.excludeShortVisits = v.excludeShortVisits !== false;
  }

  let sessions: SessionRow[];
  try {
    sessions = await fetchAll<SessionRow>((rangeFrom, rangeTo) =>
      supabase
        .from('analytics_sessions')
        .select('session_id, ip_hash, ip, country, city, referrer, browser, device, os, user_agent, created_at')
        .eq('is_authenticated', false)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false })
        .order('session_id', { ascending: true })
        .range(rangeFrom, rangeTo)
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'sessions error' }, { status: 500 });
  }

  const includeHashes = new Set(
    (filter.include || []).map((ip) => hashIp(ip))
  );
  const excludeHashes = new Set(
    [...(filter.exclude || []).map((ip) => hashIp(ip)), ...(filter.excludeHashes || [])]
  );

  const filtered =(sessions || []).filter((s) => {
    const h = s.ip_hash as string;
    if (excludeHashes.has(h)) return false;
    if ((filter.include?.length ?? 0) > 0 && !includeHashes.has(h)) return false;
    if (filter.excludeBots !== false && isLikelyBot(s.user_agent as string | null)) return false;
    return true;
  });

  const sessionIds = new Set(filtered.map((s) => s.session_id));

  let eventsList;
  try {
    eventsList = await fetchEventsForSessions(supabase, Array.from(sessionIds));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'events error' }, { status: 500 });
  }

  // Filtre « visites courtes » : ne s'applique qu'aux pages vues (< 1 s ou sans durée).
  // Les clics n'ont pas de durée : ils sont toujours conservés.
  const allPageviews = eventsList.filter((e) => e.event_type === 'pageview');
  const pageviews = filter.excludeShortVisits !== false
    ? allPageviews.filter((e) => e.duration != null && e.duration >= 1)
    : allPageviews;
  const clicks = eventsList.filter((e) => e.event_type === 'click');

  const uniqueVisitors = filtered.length;
  const totalViews = pageviews.length;
  const withDuration = pageviews.filter((p) => p.duration != null && p.duration > 0);
  const avgDuration =
    withDuration.length > 0
      ? Math.round(withDuration.reduce((a, p) => a + (p.duration || 0), 0) / withDuration.length)
      : 0;
  const pageviewsPerSession: Record<string, number> = {};
  pageviews.forEach((e) => {
    pageviewsPerSession[e.session_id] = (pageviewsPerSession[e.session_id] || 0) + 1;
  });
  const singlePageVisits = Array.from(sessionIds).filter((sid) => (pageviewsPerSession[sid] || 0) <= 1).length;
  const bounceRate = uniqueVisitors > 0 ? Math.round((singlePageVisits / uniqueVisitors) * 100) : 0;
  const pagesPerVisit =
    uniqueVisitors > 0
      ? Math.round((totalViews / uniqueVisitors) * 100) / 100
      : 0;

  const pathCount: Record<string, number> = {};
  const pathDuration: Record<string, number[]> = {};
  pageviews.forEach((e) => {
    const p = (e.path as string) || '';
    pathCount[p] = (pathCount[p] || 0) + 1;
    if (e.duration != null && e.duration > 0) {
      if (!pathDuration[p]) pathDuration[p] = [];
      pathDuration[p].push(e.duration);
    }
  });
  const topContents = Object.entries(pathCount)
    .map(([path, count]) => {
      const durations = pathDuration[path] || [];
      const avgDur = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
      return { path: path || '/', count, avgDuration: avgDur };
    })
    .sort((a, b) => b.count - a.count)
    .slice(offset, offset + perPage);

  const countryCityCount: Record<string, number> = {};
  const countryCityDuration: Record<string, number[]> = {};
  // Créer un mapping session_id -> pays/ville
  const sessionToCountryCity: Record<string, { country: string; city: string }> = {};
  filtered.forEach((s) => {
    sessionToCountryCity[s.session_id as string] = {
      country: (s.country as string) || 'Inconnu',
      city: (s.city as string) || 'Inconnu',
    };
  });
  // Calculer les stats par pays/ville via les événements
  pageviews.forEach((e) => {
    const loc = sessionToCountryCity[e.session_id as string];
    if (!loc) return;
    const key = `${loc.country}\t${loc.city}`;
    countryCityCount[key] = (countryCityCount[key] || 0) + 1;
    if (e.duration != null && e.duration > 0) {
      if (!countryCityDuration[key]) countryCityDuration[key] = [];
      countryCityDuration[key].push(e.duration);
    }
  });
  const byCountryCity = Object.entries(countryCityCount)
    .map(([key, count]) => {
      const [country, city] = key.split('\t');
      const durations = countryCityDuration[key] || [];
      const avgDur = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
      return { country: country || 'Inconnu', city: city || 'Inconnu', count, avgDuration: avgDur };
    })
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
    .map(([path, count]) => {
      const durations = pathDuration[path] || [];
      const avgDur = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
      return { path: path || '/', count, avgDuration: avgDur };
    })
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
    filter: { include: filter.include || [], exclude: filter.exclude || [], excludeHashes: filter.excludeHashes || [], excludeBots: filter.excludeBots !== false, excludeShortVisits: filter.excludeShortVisits !== false },
    kpis: {
      uniqueVisitors: uniqueVisitors,
      totalViews,
      avgDurationSeconds: avgDuration,
      bounceRate,
      pagesPerVisit,
    },
    topContents,
    byCountryCity,
    topClicks,
    bySource,
    visitsByPage,
    visitors,
    period: { from, to },
    page,
    perPage,
  });
}
