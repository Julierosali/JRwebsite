import type { Metadata } from 'next';
import { getSeoSettings } from '@/lib/seo';
import { buildMetadataFromSeo } from '@/lib/metadata-seo';
import { SeoJsonLd } from '@/components/SeoJsonLd';
import AlbumPageClient from './AlbumPageClient';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seo = await getSeoSettings('/album/[slug]');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const canonicalOverride = baseUrl ? `${baseUrl.replace(/\/$/, '')}/album/${params.slug}` : undefined;
  return buildMetadataFromSeo(seo, { canonicalOverride, baseUrl });
}

export default function AlbumPage({ params }: Props) {
  return (
    <>
      <SeoJsonLd path="/album/[slug]" />
      <AlbumPageClient />
    </>
  );
}
