'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/SectionWrapper';
import { clampFontSize } from '@/lib/fontSize';

type SceneContent = {
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  ctaText?: string;
  titleFontSize?: number;
  textFontSize?: number;
};

export function SceneSection({
  content,
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: SceneContent;
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const title = content?.title ?? 'Scène';
  const subtitle = content?.subtitle ?? 'Julie Rosali en concert';
  const body = content?.body ?? 'Julie se produit sur scène pour vos événements : concerts, festivals, soirées privées. Une artiste incarnée qui transporte son univers entre chanson française et couleurs latines. Contactez-la pour une prestation sur mesure.';
  const imageUrl1 = content?.imageUrl1 ?? '';
  const imageUrl2 = content?.imageUrl2 ?? '';
  const ctaText = content?.ctaText ?? 'Réserver une prestation';
  const titlePx = clampFontSize(content?.titleFontSize);
  const textPx = clampFontSize(content?.textFontSize);

  return (
    <SectionWrapper
      id="scene"
      sectionKey="scene"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <motion.article
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="overflow-hidden rounded-2xl bg-accent shadow-2xl md:grid md:grid-cols-12"
          data-block="scene"
        >
          {/* Texte + CTA */}
          <div className="relative z-10 flex flex-col justify-center p-8 md:col-span-6 md:p-10 lg:p-12">
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-title mb-3 inline-block w-fit rounded-full border border-white/50 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-widest text-white/90"
            >
              Prestations scène
            </motion.span>
            <h2 className="font-title mb-2 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl" style={titlePx != null ? { fontSize: `${titlePx}px` } : undefined}>
              {title}
            </h2>
            <p className="font-title mb-4 text-lg text-white/90 whitespace-pre-line" style={textPx != null ? { fontSize: `${textPx}px` } : undefined}>{subtitle}</p>
            <p className="font-body mb-8 max-w-lg text-white/95 leading-relaxed whitespace-pre-line" style={textPx != null ? { fontSize: `${textPx}px` } : undefined}>
              {body}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
            >
              <Link
                href="#contact"
                className="font-title inline-flex w-fit items-center gap-2 rounded-full border-2 border-white/90 bg-white/15 px-6 py-3 text-base font-medium transition hover:bg-white/30 hover:border-white hover:scale-[1.02]"
              >
                {ctaText}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </div>

          {/* 2 images dynamiques */}
          <div className="relative grid grid-cols-2 gap-2 p-4 md:col-span-6 md:gap-4 md:p-6">
            {imageUrl1 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-xl"
              >
                <Image
                  src={imageUrl1}
                  alt="Julie Rosali sur scène"
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                  unoptimized={imageUrl1.includes('supabase.co')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition opacity duration-300 hover:opacity-100" aria-hidden />
              </motion.div>
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-white/10 text-sm text-white/40">
                Photo scène 1
              </div>
            )}
            {imageUrl2 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-xl md:mt-6"
              >
                <Image
                  src={imageUrl2}
                  alt="Julie Rosali en concert"
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 30vw"
                  unoptimized={imageUrl2.includes('supabase.co')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition opacity duration-300 hover:opacity-100" aria-hidden />
              </motion.div>
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-white/10 text-sm text-white/40 md:mt-6">
                Photo scène 2
              </div>
            )}
          </div>
        </motion.article>
      </div>
    </SectionWrapper>
  );
}
