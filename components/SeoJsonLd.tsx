import { getSeoSettings } from '@/lib/seo';

type SeoJsonLdProps = { path: string };

/**
 * Injecte le JSON-LD (structured data) côté serveur pour le crawl.
 */
export async function SeoJsonLd({ path }: SeoJsonLdProps) {
  const seo = await getSeoSettings(path);
  const jsonLd = seo?.json_ld?.trim();
  if (!jsonLd) return null;
  try {
    const parsed = JSON.parse(jsonLd);
    if (parsed === null || typeof parsed !== 'object') return null;
  } catch {
    return null;
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
