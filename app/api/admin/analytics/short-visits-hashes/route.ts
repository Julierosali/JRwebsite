import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getAdminIdFromRequest } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const adminId = await getAdminIdFromRequest(req);
  if (!adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Analytics not configured' }, { status: 503 });
  }

  // Récupérer toutes les sessions avec leurs événements
  const { data: sessions } = await supabase
    .from('analytics_sessions')
    .select('ip_hash, session_id');

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ hashes: [] });
  }

  // Récupérer tous les événements avec durée
  const { data: events } = await supabase
    .from('analytics_events')
    .select('session_id, duration');

  const eventsBySession: Record<string, { duration: number | null }[]> = {};
  (events || []).forEach((e) => {
    const sid = e.session_id as string;
    if (!eventsBySession[sid]) eventsBySession[sid] = [];
    eventsBySession[sid].push({ duration: e.duration as number | null });
  });

  // Identifier les sessions avec uniquement des visites < 1 sec
  const shortVisitHashes = new Set<string>();
  sessions.forEach((s) => {
    const sid = s.session_id as string;
    const sessionEvents = eventsBySession[sid] || [];
    
    // Une session est considérée comme "visite courte" si elle a des événements
    // et que tous les événements avec une durée ont une durée < 1 sec (ou null)
    if (sessionEvents.length > 0) {
      const hasOnlyShortVisits = sessionEvents.every(
        (e) => e.duration === null || e.duration < 1
      );
      if (hasOnlyShortVisits) {
        shortVisitHashes.add(s.ip_hash as string);
      }
    }
  });

  return NextResponse.json({ hashes: Array.from(shortVisitHashes) });
}
