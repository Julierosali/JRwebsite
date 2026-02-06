import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const adminId = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const excludeBots = typeof body.excludeBots === 'boolean' ? body.excludeBots : undefined;
  if (excludeBots === undefined) {
    return NextResponse.json({ error: 'excludeBots (boolean) required' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      { key: 'analytics_exclude_bots', value: { excludeBots }, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, excludeBots });
}
