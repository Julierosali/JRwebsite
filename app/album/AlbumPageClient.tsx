'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Section } from '@/lib/supabase';
import { getSpotifyEmbedUrl, getListenLinkType } from '@/lib/spotify';
import { getYoutubeIdFromUrl } from '@/lib/youtube';
import { useAdmin } from '@/context/AdminContext';
import { useLocale } from '@/context/LocaleContext';
import { getSectionContent } from '@/lib/locale';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const EditAlbumPageModal = dynamic(() => import('@/components/EditAlbumPageModal').then((m) => m.EditAlbumPageModal), { ssr: false });
const AnalyticsDashboard = dynamic(() => import('@/components/AnalyticsDashboard').then((m) => m.AnalyticsDashboard), { ssr: false });

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
    listenUrls?: string;
    buttons?: { label: string; url: string }[];
    videoGallery?: string[];
    videoGalleryColumns?: number;
  };
};

export default function AlbumPageClient() {
  const { isAdmin } = useAdmin();
  const { locale } = useLocale();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

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

  const content = getSectionContent(section?.content as Record<string, unknown>, locale) as AlbumContent;
  const albumPage = content?.albumPage ?? {};
  const listenUrlsRaw = albumPage.listenUrls?.trim() ?? (albumPage.soundcloudEmbedUrl ? String(albumPage.soundcloudEmbedUrl) : '');
  const listenLinks = useMemo(
    () =>
      listenUrlsRaw
        .split(/\r?\n/)
        .map((u) => u.trim())
        .filter(Boolean),
    [listenUrlsRaw]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet border-t-transparent" />
      </div>
    );
  }

  const youtubeId = albumPage.youtubeEmbedId ?? '';
  const videoGallery = (albumPage.videoGallery ?? []) as string[];
  const videoGalleryColumns = Math.min(4, Math.max(1, albumPage.videoGalleryColumns ?? 2));

  const handleSaveAlbum = async (id: string, newContent: Record<string, unknown>) => {
    await supabase.from('sections').update({ content: newContent }).eq('id', id);
    setSection((prev) => (prev ? { ...prev, content: newContent } : null));
    setShowAlbumModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="rounded border border-white/40 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
            data-analytics-id="menu|Accueil"
          >
            {locale === 'es' ? 'Inicio' : 'Accueil'}
          </Link>
          <h1 className="text-2xl font-bold md:text-3xl">{content?.albumTitle ?? 'LIBRE'}</h1>
          <div className="shrink-0">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      {isAdmin && (
        <div className="sticky top-[4.5rem] z-40 flex flex-wrap justify-center gap-2 border-b border-white/20 bg-black/40 py-2">
          <Link
            href="/admin"
            className="rounded bg-white/20 px-3 py-2 text-sm font-medium transition hover:bg-white/30"
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={() => setShowStatsModal(true)}
            className="rounded bg-white/20 px-3 py-2 text-sm font-medium transition hover:bg-white/30"
          >
            Statistiques
          </button>
        </div>
      )}
      {showStatsModal && <AnalyticsDashboard onClose={() => setShowStatsModal(false)} />}
      {showAlbumModal && section && (
        <EditAlbumPageModal
          section={section}
          onClose={() => setShowAlbumModal(false)}
          onSave={handleSaveAlbum}
        />
      )}

      <main className="mx-auto max-w-6xl px-4 py-10 md:grid md:grid-cols-2 md:gap-12 md:py-16">
        {isAdmin && (
          <div className="col-span-full mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAlbumModal(true)}
              className="rounded bg-violet px-4 py-2 text-sm font-medium transition hover:bg-violet-light"
            >
              Modifier l&apos;album
            </button>
          </div>
        )}
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
                {locale === 'es' ? 'Fecha de lanzamiento' : 'Date de sortie'} : {albumPage.releaseDate}
              </p>
            )}
            {albumPage.artist && (
              <p>
                <span className="mr-2">🎵</span>
                {locale === 'es' ? 'Artista' : 'Artiste'} : {albumPage.artist}
              </p>
            )}
            {albumPage.label && (
              <p>
                <span className="mr-2">🏷</span>
                {locale === 'es' ? 'Sello' : 'Label'} : {albumPage.label}
              </p>
            )}
            {albumPage.producer && <p>{locale === 'es' ? 'Productor' : 'Producteur'} : {albumPage.producer}</p>}
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
          {listenLinks.length > 0 && (
            <div className="space-y-6">
              {listenLinks.map((url, i) => {
                const type = getListenLinkType(url);
                if (type === 'spotify') {
                  const embedSrc = getSpotifyEmbedUrl(url);
                  if (!embedSrc) return null;
                  return (
                    <div key={i} className="overflow-hidden rounded-xl bg-black/40 p-4">
                      <iframe
                        title="Spotify"
                        src={embedSrc}
                        width="100%"
                        height="352"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="rounded-lg"
                      />
                    </div>
                  );
                }
                if (type === 'soundcloud') {
                  return (
                    <div key={i} className="overflow-hidden rounded-xl bg-black/40 p-4">
                      <iframe
                        title="SoundCloud"
                        width="100%"
                        height="166"
                        allow="autoplay"
                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%236b4e9e`}
                        className="rounded-lg"
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
          {youtubeId && (
            <div className="overflow-hidden rounded-xl bg-black/40 p-4">
              <h2 className="mb-4 text-lg font-bold">{locale === 'es' ? 'Vídeo' : 'Vidéo'}</h2>
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
          {listenLinks.length === 0 && !youtubeId && (
            <p className="rounded-xl bg-black/30 p-6 text-center text-white/60">
              {locale === 'es'
                ? 'Configure los enlaces de escucha (Spotify, SoundCloud) y/o el vídeo de YouTube en el admin (sección Álbum).'
                : 'Configurez les liens d\'écoute (Spotify, SoundCloud) et/ou la vidéo YouTube dans l\'admin (section Album).'}
            </p>
          )}
        </section>

        {videoGallery.filter((url) => getYoutubeIdFromUrl(url)).length > 0 && (
          <section className="mt-12 w-full space-y-6 border-t border-white/20 pt-12 md:col-span-2">
            <h2 className="text-lg font-bold">{locale === 'es' ? 'Galería de vídeos' : 'Galerie vidéo'}</h2>
            <div
              className="grid gap-4"
              data-gallery="video"
              style={{ gridTemplateColumns: `repeat(${videoGalleryColumns}, minmax(0, 1fr))` }}
            >
              {videoGallery
                .map((url) => getYoutubeIdFromUrl(url))
                .filter(Boolean)
                .map((embedId, i) => (
                  <div key={i} className="overflow-hidden rounded-xl bg-black/40">
                    <div className="relative aspect-video">
                      <iframe
                        title={`Vidéo ${i + 1}`}
                        src={`https://www.youtube-nocookie.com/embed/${embedId}?rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full rounded-lg"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
