import type { MetadataRoute } from 'next';
import { getAlbumSection, getAlbumSlug, albumPathFromSlug } from '@/lib/sections-server';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  if (!baseUrl) return [];

  const album = await getAlbumSection();
  const albumLastModified = album?.updated_at ? new Date(album.updated_at) : new Date();

  return [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    {
      url: `${baseUrl}${albumPathFromSlug(getAlbumSlug(album))}`,
      lastModified: albumLastModified,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    { url: `${baseUrl}/mentions-legales`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${baseUrl}/confidentialite`, changeFrequency: 'yearly', priority: 0.1 },
  ];
}
