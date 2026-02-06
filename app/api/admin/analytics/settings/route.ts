import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const adminId = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const excludeBots = typeof body.excludeBots === 'boolean' ? body.excludeBots : undefined;
  const excludeShortVisits = typeof body.excludeShortVisits === 'boolean' ? body.excludeShortVisits : undefined;
  if (excludeBots === undefined && excludeShortVisits === undefined) {
    return NextResponse.json({ error: 'excludeBots (boolean) or excludeShortVisits (boolean) required' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const settingsToUpdate: { key: string; value: Record<string, unknown> }[] = [];
  if (excludeBots !== undefined) {
    settingsToUpdate.push({ key: 'analytics_exclude_bots', value: { excludeBots } });
  }
  if (excludeShortVisits !== undefined) {
    settingsToUpdate.push({ key: 'analytics_exclude_short_visits', value: { excludeShortVisits } });
  }
  if (settingsToUpdate.length === 0) {
    return NextResponse.json({ error: 'excludeBots (boolean) or excludeShortVisits (boolean) required' }, { status: 400 });
  }

  for (const { key, value } of settingsToUpdate) {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, excludeBots, excludeShortVisits });
}
