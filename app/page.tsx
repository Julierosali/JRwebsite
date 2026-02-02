import type { Metadata } from 'next';
import { getSeoSettings } from '@/lib/seo';
import { buildMetadataFromSeo } from '@/lib/metadata-seo';
import HomePageClient from './HomePageClient';
import { SeoJsonLd } from '@/components/SeoJsonLd';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings('/');
  return buildMetadataFromSeo(seo);
}

export default function HomePage() {
  return (
    <>
      <SeoJsonLd path="/" />
      <HomePageClient />
    </>
  );
}
