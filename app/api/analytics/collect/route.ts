import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { hashIp, getClientIp } from '@/lib/analytics-server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s ? s.slice(0, max) : null;
}

/**
 * Collecte anonyme (sans cookie). L'IP n'est jamais stockée en clair : seul un hash salé est conservé.
 * Une page vue = une ligne : le client renvoie le même event_id pour mettre à jour la durée.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (body.is_authenticated === true) return NextResponse.json({ ok: true });

  const sessionId = str(body.session_id, 36);
  const eventId = str(body.event_id, 36);
  const eventType = body.event_type;
  const path = str(body.path, 500);

  if (!sessionId || !UUID_RE.test(sessionId) || !path) {
    return NextResponse.json({ error: 'session_id, event_type, path required' }, { status: 400 });
  }
  if (eventType !== 'pageview' && eventType !== 'click') {
    return NextResponse.json({ error: 'invalid event_type' }, { status: 400 });
  }
  if (eventId && !UUID_RE.test(eventId)) {
    return NextResponse.json({ error: 'invalid event_id' }, { status: 400 });
  }

  const rawDuration = typeof body.duration === 'number' ? Math.round(body.duration) : null;
  const duration = rawDuration != null && rawDuration >= 0 ? Math.min(rawDuration, 86400) : null;

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });

  const ip = getClientIp(req.headers);
  const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null;
  const cityRaw = req.headers.get('x-vercel-ip-city');
  let city: string | null = null;
  if (cityRaw) {
    try {
      city = decodeURIComponent(cityRaw);
    } catch {
      city = cityRaw;
    }
  }

  const { error: sessionError } = await supabase.from('analytics_sessions').upsert(
    {
      session_id: sessionId,
      ip_hash: ip ? hashIp(ip) : '',
      country: country || 'Inconnu',
      city: city || 'Inconnu',
      referrer: str(body.referrer, 500),
      browser: str(body.browser, 40),
      device: str(body.device, 40),
      os: str(body.os, 40),
      user_agent: str(req.headers.get('user-agent'), 500),
      is_authenticated: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'session_id' }
  );
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  const eventRow = {
    ...(eventId ? { id: eventId } : {}),
    session_id: sessionId,
    event_type: eventType,
    path,
    element_id: str(body.element_id, 200),
    duration,
  };

  const { error: eventError } = eventId
    ? await supabase.from('analytics_events').upsert(eventRow, { onConflict: 'id' })
    : await supabase.from('analytics_events').insert(eventRow);
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
