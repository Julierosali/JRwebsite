import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const adminId = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const include = Array.isArray(body.include) ? body.include : [];
  const exclude = Array.isArray(body.exclude) ? body.exclude : [];
  const excludeHashes = Array.isArray(body.excludeHashes) ? body.excludeHashes : [];

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: 'analytics_ip_filter',
        value: { include, exclude, excludeHashes },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
