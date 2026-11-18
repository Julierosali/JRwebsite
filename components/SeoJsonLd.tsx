import { getSeoSettings } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site-url';

type SeoJsonLdProps = { path: string; /** Chemin réel de la page (pour corriger l'URL du JSON-LD). */ pagePath?: string };

/** Remplace l'origine d'une URL du JSON-LD par celle du site réel (ex. ancien domaine saisi dans l'admin). */
function fixUrl(value: unknown, siteUrl: string, pagePath: string): unknown {
  if (typeof value !== 'string' || !siteUrl) return value;
  try {
    const u = new URL(value);
    const site = new URL(siteUrl);
    if (u.host === site.host) return value;
    return `${site.origin}${pagePath === '/' ? '' : pagePath}`;
  } catch {
    return value;
  }
}

/**
 * Injecte le JSON-LD (structured data) côté serveur pour le crawl.
 */
export async function SeoJsonLd({ path, pagePath }: SeoJsonLdProps) {
  const seo = await getSeoSettings(path);
  const jsonLd = seo?.json_ld?.trim();
  if (!jsonLd) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonLd);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;

  const siteUrl = getSiteUrl();
  const realPath = pagePath ?? path;
  if (!Array.isArray(parsed) && 'url' in (parsed as Record<string, unknown>)) {
    const obj = parsed as Record<string, unknown>;
    obj.url = fixUrl(obj.url, siteUrl, realPath);
  }

  // Ré-sérialisation + échappement de "<" : empêche toute sortie de la balise <script>.
  const safe = JSON.stringify(parsed).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safe }} />;
}
