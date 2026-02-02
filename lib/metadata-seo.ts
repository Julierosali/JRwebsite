/**
 * Construction des métadonnées Next.js à partir de page_seo_settings.
 * Utilisé UNIQUEMENT côté serveur (generateMetadata) pour le crawl.
 */

import type { Metadata } from 'next';
import type { PageSeoSettings } from './seo';

export function buildMetadataFromSeo(
  seo: PageSeoSettings | null,
  options?: { canonicalOverride?: string; baseUrl?: string }
): Metadata {
  if (!seo) return {};

  const baseUrl = options?.baseUrl ?? (typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_SITE_URL ?? '');
  const canonical = options?.canonicalOverride ?? seo.canonical_url ?? undefined;
  const canonicalAbsolute = canonical && baseUrl && !canonical.startsWith('http') ? `${baseUrl.replace(/\/$/, '')}${canonical}` : canonical;

  const robots = [
    seo.robots_index === false ? 'noindex' : 'index',
    seo.robots_follow === false ? 'nofollow' : 'follow',
  ].join(', ');

  const metadata: Metadata = {
    title: seo.meta_title ?? undefined,
    description: seo.meta_description ?? undefined,
    robots: robots === 'index, follow' ? undefined : { index: seo.robots_index !== false, follow: seo.robots_follow !== false },
    openGraph: {
      title: seo.og_title ?? seo.meta_title ?? undefined,
      description: seo.og_description ?? seo.meta_description ?? undefined,
      type: (seo.og_type as 'website' | 'article') ?? 'website',
      images: seo.og_image_url ? [{ url: seo.og_image_url }] : undefined,
    },
    twitter: {
      card: (seo.twitter_card as 'summary' | 'summary_large_image') ?? 'summary_large_image',
      title: seo.twitter_title ?? seo.og_title ?? seo.meta_title ?? undefined,
      images: seo.twitter_image_url ? [seo.twitter_image_url] : undefined,
    },
    alternates: canonicalAbsolute ? { canonical: canonicalAbsolute } : undefined,
  };

  return metadata;
}
