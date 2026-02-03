'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/SectionWrapper';
import { clampFontSize } from '@/lib/fontSize';

type PresentationContent = {
  title?: string;
  body?: string;
  imageUrl?: string;
  titleFontSize?: number;
  textFontSize?: number;
};

export function PresentationSection({
  content,
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: PresentationContent;
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const body = content?.body ?? '';
  const imageUrl = content?.imageUrl ?? '';
  const titlePx = clampFontSize(content?.titleFontSize);
  const textPx = clampFontSize(content?.textFontSize);

  return (
    <SectionWrapper
      id="presentation"
      sectionKey="presentation"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="overflow-hidden rounded-xl bg-accent shadow-2xl md:grid md:grid-cols-2 md:gap-0" data-block="presentation">
          <div className="p-8 md:p-10">
            <h2 className="font-title mb-6 text-3xl font-bold tracking-wide md:text-4xl" style={titlePx != null ? { fontSize: `${titlePx}px` } : undefined}>
              {content?.title ?? "L'UNIVERS"}
            </h2>
            <div className="prose prose-invert max-w-none font-body text-white/95 whitespace-pre-line [&>p]:leading-relaxed" style={textPx != null ? { fontSize: `${textPx}px` } : undefined}>
              {body}
            </div>
          </div>
          {imageUrl ? (
            <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[400px]">
              <Image
                src={imageUrl}
                alt="Julie Rosali"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center bg-white/5 md:aspect-auto md:min-h-[400px]">
              <span className="text-white/40">Photo de présentation</span>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
}
