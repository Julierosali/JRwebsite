import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { createHash } from 'crypto';

const SALT = process.env.ANALYTICS_IP_SALT || 'julie-rosali-analytics-v1';

function hashIp(ip: string): string {
  return createHash('sha256').update(SALT + ip.trim()).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      session_id,
      event_type,
      path,
      element_id,
      duration,
      referrer,
      is_authenticated,
      device,
      os,
      browser,
    } = body;

    if (is_authenticated === true) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (!session_id || !event_type || !path) {
      return NextResponse.json({ error: 'session_id, event_type, path required' }, { status: 400 });
    }

    if (!['pageview', 'click'].includes(event_type)) {
      return NextResponse.json({ error: 'invalid event_type' }, { status: 400 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '';
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null;
    const city = req.headers.get('x-vercel-ip-city') || null;
    const ipHash = ip ? hashIp(ip) : '';

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });
    }

    const sessionRow: Record<string, unknown> = {
      session_id,
      ip_hash: ipHash,
      country: country || 'Inconnu',
      city: city || 'Inconnu',
      referrer: referrer ?? null,
      browser: browser ?? null,
      device: device ?? null,
      os: os ?? null,
      is_authenticated: false,
      updated_at: new Date().toISOString(),
    };
    if (ip) sessionRow.ip = ip;

    const { error: upsertError } = await supabase.from('analytics_sessions').upsert(sessionRow, {
      onConflict: 'session_id',
      ignoreDuplicates: false,
    });

    if (upsertError) {
      const withoutIp = { ...sessionRow };
      delete withoutIp.ip;
      const { error: retryError } = await supabase.from('analytics_sessions').upsert(withoutIp, {
        onConflict: 'session_id',
        ignoreDuplicates: false,
      });
      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
    }

    const eventRow = {
      session_id,
      event_type,
      path,
      element_id: element_id ?? null,
      duration: duration ?? null,
      metadata: {},
    };

    const { error: insertEventError } = await supabase.from('analytics_events').insert(eventRow);
    if (insertEventError) {
      return NextResponse.json({ error: insertEventError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
