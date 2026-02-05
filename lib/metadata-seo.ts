/**
 * Construction des métadonnées Next.js à partir de page_seo_settings.
 * Utilisé UNIQUEMENT côté serveur (generateMetadata) pour le crawl.
 * Meta description et OG/Twitter description tronquées à 300 caractères (reco audit).
 */

import type { Metadata } from 'next';
import type { PageSeoSettings } from './seo';

const META_DESC_MAX_LENGTH = 300;
const SITE_NAME_FALLBACK = 'Julie Rosali';

function truncateDescription(text: string | null | undefined): string | undefined {
  if (text == null || text === '') return undefined;
  const t = text.trim();
  if (t.length <= META_DESC_MAX_LENGTH) return t;
  return t.slice(0, 297).trimEnd() + '…';
}

export function buildMetadataFromSeo(
  seo: PageSeoSettings | null,
  options?: { canonicalOverride?: string; baseUrl?: string; siteName?: string }
): Metadata {
  if (!seo) return {};

  const baseUrl = options?.baseUrl ?? (typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_SITE_URL ?? '');
  const canonical = options?.canonicalOverride ?? seo.canonical_url ?? undefined;
  const canonicalAbsolute = canonical && baseUrl && !canonical.startsWith('http') ? `${baseUrl.replace(/\/$/, '')}${canonical}` : canonical;

  const description = truncateDescription(seo.meta_description);
  const ogDesc = truncateDescription(seo.og_description ?? seo.meta_description);
  const twitterDesc = ogDesc;

  const robots = [
    seo.robots_index === false ? 'noindex' : 'index',
    seo.robots_follow === false ? 'nofollow' : 'follow',
  ].join(', ');

  const siteName = options?.siteName ?? SITE_NAME_FALLBACK;

  const metadata: Metadata = {
    title: seo.meta_title ?? undefined,
    description,
    robots: robots === 'index, follow' ? undefined : { index: seo.robots_index !== false, follow: seo.robots_follow !== false },
    openGraph: {
      title: seo.og_title ?? seo.meta_title ?? undefined,
      description: ogDesc,
      type: (seo.og_type as 'website' | 'article') ?? 'website',
      siteName,
      images: seo.og_image_url ? [{ url: seo.og_image_url }] : undefined,
    },
    twitter: {
      card: (seo.twitter_card as 'summary' | 'summary_large_image') ?? 'summary_large_image',
      title: seo.twitter_title ?? seo.og_title ?? seo.meta_title ?? undefined,
      description: twitterDesc,
      images: seo.twitter_image_url ? [seo.twitter_image_url] : undefined,
    },
    alternates: canonicalAbsolute ? { canonical: canonicalAbsolute } : undefined,
  };

  return metadata;
}
