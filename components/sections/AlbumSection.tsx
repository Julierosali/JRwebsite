'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/SectionWrapper';
import { clampFontSize } from '@/lib/fontSize';

type AlbumContent = {
  title?: string;
  albumTitle?: string;
  subtitle?: string;
  coverUrl?: string;
  pageSlug?: string;
  description?: string;
  titleFontSize?: number;
  textFontSize?: number;
};

export function AlbumSection({
  content,
  sectionId,
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: AlbumContent;
  sectionId: string;
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const slug = content?.pageSlug ?? 'album';
  const coverUrl = content?.coverUrl ?? '';
  const titlePx = clampFontSize(content?.titleFontSize);
  const textPx = clampFontSize(content?.textFontSize);
  // Use /album for default slug, /album/[slug] for custom slugs
  const albumUrl = slug === 'album' ? '/album' : `/album/${slug}`;

  return (
    <SectionWrapper
      id="album"
      sectionKey="album"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="font-title mb-6 text-center text-3xl font-bold tracking-wide md:text-4xl" style={titlePx != null ? { fontSize: `${titlePx}px` } : undefined}>
          {content?.title ?? 'Nouvel album'}
        </h2>
        <Link href={albumUrl} className="block" data-analytics-id={`Accueil|Album - ${content?.albumTitle ?? 'LIBRE'}`}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="overflow-hidden rounded-lg bg-accent p-6 shadow-xl md:flex md:items-center md:gap-8"
            data-block="album"
          >
            <div className="relative mx-auto aspect-square w-64 shrink-0 overflow-hidden rounded-lg bg-white/10 md:w-72">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={content?.albumTitle ?? 'LIBRE'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 256px, 288px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white/60">
                  {content?.albumTitle ?? 'LIBRE'}
                </div>
              )}
            </div>
            <div className="mt-6 md:mt-0">
              <h3 className="font-title text-2xl font-bold md:text-3xl" style={titlePx != null ? { fontSize: `${titlePx}px` } : undefined}>{content?.albumTitle ?? 'LIBRE'}</h3>
              <p className="font-title mt-2 text-white/90 whitespace-pre-line" style={textPx != null ? { fontSize: `${textPx}px` } : undefined}>{content?.subtitle ?? '11 titres, deux univers'}</p>
              <p className="mt-4 text-sm text-white/80 line-clamp-3 whitespace-pre-line" style={textPx != null ? { fontSize: `${textPx}px` } : undefined}>{content?.description ?? ''}</p>
              <span className="mt-4 inline-block rounded border border-white/60 px-4 py-2 text-sm font-medium transition hover:bg-white/20">
                Découvrir l&apos;album →
              </span>
            </div>
          </motion.div>
        </Link>
      </div>
    </SectionWrapper>
  );
}
