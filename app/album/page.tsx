import type { Metadata } from 'next';
import { getSeoSettings } from '@/lib/seo';
import { buildMetadataFromSeo } from '@/lib/metadata-seo';
import { SeoJsonLd } from '@/components/SeoJsonLd';
import AlbumPageClient from './AlbumPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings('/album');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const canonicalOverride = baseUrl ? `${baseUrl.replace(/\/$/, '')}/album` : undefined;
  return buildMetadataFromSeo(seo, { canonicalOverride, baseUrl });
}

export default function AlbumPage() {
  return (
    <>
      <SeoJsonLd path="/album" />
      <AlbumPageClient />
    </>
  );
}
