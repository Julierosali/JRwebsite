import type { Metadata } from 'next';
import { getSeoSettings } from '@/lib/seo';
import { buildMetadataFromSeo } from '@/lib/metadata-seo';
import { getSections } from '@/lib/sections-server';
import { getSiteUrl } from '@/lib/site-url';
import HomePageClient from './HomePageClient';
import { SeoJsonLd } from '@/components/SeoJsonLd';

/** Régénère la page (contenu + SEO) au plus toutes les 60 s, sans redéploiement. */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings('/');
  const baseUrl = getSiteUrl();
  return buildMetadataFromSeo(seo, { baseUrl, canonicalOverride: baseUrl ? `${baseUrl}/` : undefined });
}

export default async function HomePage() {
  const sections = await getSections();
  return (
    <>
      <SeoJsonLd path="/" />
      <HomePageClient initialSections={sections} />
    </>
  );
}
