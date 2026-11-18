import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSeoSettings } from '@/lib/seo';
import { buildMetadataFromSeo } from '@/lib/metadata-seo';
import { getAlbumSection, getAlbumSlug, albumPathFromSlug, getSectionByKey } from '@/lib/sections-server';
import { getSiteUrl } from '@/lib/site-url';
import { SeoJsonLd } from '@/components/SeoJsonLd';
import { AlbumPageView } from '@/components/AlbumPageView';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings('/album');
  const baseUrl = getSiteUrl();
  return buildMetadataFromSeo(seo, { canonicalOverride: baseUrl ? `${baseUrl}/album` : undefined, baseUrl });
}

export default async function AlbumPage() {
  const [album, footer] = await Promise.all([getAlbumSection(), getSectionByKey('footer')]);
  const slug = getAlbumSlug(album);
  // Slug personnalisé : une seule URL publique pour l'album.
  if (slug !== 'album') redirect(albumPathFromSlug(slug));
  return (
    <>
      <SeoJsonLd path="/album" />
      <AlbumPageView initialSection={album} footerSection={footer} />
    </>
  );
}
