import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/favicon?url=https://example.com
 * Retourne l'URL du favicon/logo du site donné.
 * Stratégie : Google Favicon Service (fiable, rapide, haute qualité).
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Paramètre url manquant' }, { status: 400 });
  }

  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const domain = parsed.hostname;

    // Google Favicon S2 service — retourne un PNG haute résolution
    const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    // Vérifier que l'icône existe
    const check = await fetch(googleFavicon, { method: 'HEAD' });
    if (check.ok) {
      return NextResponse.json({ faviconUrl: googleFavicon });
    }

    // Fallback : favicon standard
    const fallback = `${parsed.origin}/favicon.ico`;
    return NextResponse.json({ faviconUrl: fallback });
  } catch {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }
}
