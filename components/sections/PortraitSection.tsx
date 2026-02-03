'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/SectionWrapper';
import { clampFontSize } from '@/lib/fontSize';

type PortraitContent = {
  title?: string;
  images?: { url: string; alt?: string }[];
  scrollSpeed?: number;
  titleFontSize?: number;
  textFontSize?: number;
};

export function PortraitSection({
  content,
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: PortraitContent;
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const images = content?.images ?? [];
  const scrollSpeed = Math.max(10, Math.min(120, content?.scrollSpeed ?? 40)); // secondes pour un tour (10–120)
  const titlePx = clampFontSize(content?.titleFontSize);

  return (
    <SectionWrapper
      id="portrait"
      sectionKey="portrait"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="py-12 md:py-16">
        <h2 className="font-title mb-8 text-center text-3xl font-bold tracking-wide md:text-4xl" style={titlePx != null ? { fontSize: `${titlePx}px` } : undefined}>
          {content?.title ?? 'Portrait'}
        </h2>
        {images.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative h-96 w-full overflow-hidden md:h-[26rem] lg:h-[31rem]"
          >
            <div
              className="flex h-full gap-2 md:gap-3"
              data-gallery="photo"
              style={{
                width: 'max-content',
                animation: `portrait-scroll ${scrollSpeed}s linear infinite`,
                willChange: 'transform',
              }}
            >
              {[...images, ...images].map((img, i) => (
                <div key={i} className="relative h-full w-80 shrink-0 overflow-hidden md:w-96 lg:w-[26rem]">
                  <Image
                    src={img.url}
                    alt={img.alt ?? `Portrait ${(i % images.length) + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 320px, 384px"
                    unoptimized={img.url.includes('supabase.co')}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex h-64 items-center justify-center rounded-xl bg-black/30 text-white/50 md:h-80">
              Galerie photo : ajoutez des images depuis l&apos;admin.
            </div>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
