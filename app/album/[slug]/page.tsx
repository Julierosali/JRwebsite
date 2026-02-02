'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Section } from '@/lib/supabase';

type AlbumContent = {
  title?: string;
  albumTitle?: string;
  coverUrl?: string;
  pageSlug?: string;
  description?: string;
  albumPage?: {
    releaseDate?: string;
    artist?: string;
    label?: string;
    producer?: string;
    youtubeEmbedId?: string;
    soundcloudEmbedUrl?: string;
    buttons?: { label: string; url: string }[];
  };
};

export default function AlbumPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) ?? 'album';
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('sections')
        .select('*')
        .eq('key', 'album')
        .maybeSingle();
      setSection((data as Section) ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet border-t-transparent" />
      </div>
    );
  }

  const content = (section?.content ?? {}) as AlbumContent;
  const pageSlug = content?.pageSlug ?? 'album';
  if (pageSlug !== slug) {
    router.replace(`/album/${pageSlug}`);
    return null;
  }

  const albumPage = content?.albumPage ?? {};
  const youtubeId = albumPage.youtubeEmbedId ?? '';
  const soundcloudUrl = albumPage.soundcloudEmbedUrl ?? '';

  return (
    <div className="min-h-screen bg-gradient">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold md:text-3xl">{content?.albumTitle ?? 'LIBRE'}</h1>
          <nav className="flex gap-4">
            <Link
              href="/"
              className="rounded border border-white/40 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
            >
              Accueil
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 md:grid md:grid-cols-2 md:gap-12 md:py-16">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-xl bg-black/30 p-4">
            {content?.coverUrl ? (
              <div className="relative aspect-square w-full max-w-md">
                <Image
                  src={content.coverUrl}
                  alt={content?.albumTitle ?? 'LIBRE'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex aspect-square max-w-md items-center justify-center rounded-lg bg-white/10 text-4xl font-bold text-white/60">
                {content?.albumTitle ?? 'LIBRE'}
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm text-white/90">
            {albumPage.releaseDate && (
              <p>
                <span className="mr-2">📅</span>
                {albumPage.releaseDate}
              </p>
            )}
            {albumPage.artist && (
              <p>
                <span className="mr-2">🎵</span>
                {albumPage.artist}
              </p>
            )}
            {albumPage.label && (
              <p>
                <span className="mr-2">🏷</span>
                {albumPage.label}
              </p>
            )}
            {albumPage.producer && <p>Producer: {albumPage.producer}</p>}
          </div>
          {(albumPage.buttons?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-3">
              {albumPage.buttons!.map((btn, i) => (
                <a
                  key={i}
                  href={btn.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-white/40 px-4 py-2 text-sm transition hover:bg-white/20"
                >
                  {btn.label}
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-8">
          {soundcloudUrl && (
            <div className="overflow-hidden rounded-xl bg-black/40 p-4">
              <h2 className="mb-4 text-lg font-bold">Écouter</h2>
              <iframe
                title="SoundCloud"
                width="100%"
                height="166"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&color=%236b4e9e`}
                className="rounded-lg"
              />
            </div>
          )}
          {youtubeId && (
            <div className="overflow-hidden rounded-xl bg-black/40 p-4">
              <h2 className="mb-4 text-lg font-bold">Vidéo</h2>
              <div className="relative aspect-video">
                <iframe
                  title="YouTube"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full rounded-lg"
                />
              </div>
            </div>
          )}
          {!soundcloudUrl && !youtubeId && (
            <p className="rounded-xl bg-black/30 p-6 text-center text-white/60">
              Configurez les liens YouTube et SoundCloud dans l&apos;admin (section Album).
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
