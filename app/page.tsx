import type { Metadata } from 'next';
import { getSeoSettings } from '@/lib/seo';
import { buildMetadataFromSeo } from '@/lib/metadata-seo';
import HomePageClient from './HomePageClient';
import { SeoJsonLd } from '@/components/SeoJsonLd';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings('/');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return buildMetadataFromSeo(seo, { baseUrl });
}

export default function HomePage() {
  return (
    <>
      <SeoJsonLd path="/" />
      <HomePageClient />
    </>
  );
}
