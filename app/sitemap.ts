import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) {
    return [];
  }

  const urls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ];

  const { data: section } = await supabase
    .from('sections')
    .select('content')
    .eq('key', 'album')
    .maybeSingle();

  const content = (section?.content as { pageSlug?: string } | null) ?? {};
  const pageSlug = content.pageSlug?.trim() || 'album';
  urls.push({
    url: `${baseUrl}/album/${encodeURIComponent(pageSlug)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.9,
  });

  return urls;
}
