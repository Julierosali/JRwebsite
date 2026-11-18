import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getSeoSettings } from '@/lib/seo';
import { buildMetadataFromSeo } from '@/lib/metadata-seo';
import { getAlbumSection, getAlbumSlug, getSectionByKey } from '@/lib/sections-server';
import { getSiteUrl } from '@/lib/site-url';
import { SeoJsonLd } from '@/components/SeoJsonLd';
import { AlbumPageView } from '@/components/AlbumPageView';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getSeoSettings('/album/[slug]');
  const baseUrl = getSiteUrl();
  const canonicalOverride = baseUrl ? `${baseUrl}/album/${encodeURIComponent(slug)}` : undefined;
  return buildMetadataFromSeo(seo, { canonicalOverride, baseUrl });
}

export default async function AlbumSlugPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  // /album/album → /album (évite les doublons d'URL)
  if (slug === 'album') permanentRedirect('/album');

  const [album, footer] = await Promise.all([getAlbumSection(), getSectionByKey('footer')]);
  // Tout autre slug que celui configuré renvoie une vraie 404.
  if (getAlbumSlug(album) !== slug) notFound();

  return (
    <>
      <SeoJsonLd path="/album/[slug]" pagePath={`/album/${rawSlug}`} />
      <AlbumPageView initialSection={album} footerSection={footer} />
    </>
  );
}
