import { NextRequest, NextResponse } from 'next/server';
import { getAdminIdFromRequest } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const adminId = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '';
  return NextResponse.json({ ip });
}
