'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/SectionWrapper';
import { clampFontSize } from '@/lib/fontSize';
import type { Locale } from '@/lib/locale';

type Article = {
  title?: string;
  url?: string;
  source?: string;
  imageUrl?: string;
};

type Radio = {
  name?: string;
  url?: string;
  logoUrl?: string;
};

type PresseContent = {
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  pressKitUrl?: string;
  ctaText?: string;
  pressKitText?: string;
  articles?: Article[];
  radios?: Radio[];
  articlesScrollSpeed?: number;
  radiosScrollSpeed?: number;
  titleFontSize?: number;
  textFontSize?: number;
};

export function PresseSection({
  content,
  locale = 'fr',
  visible,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onEdit,
  canMoveUp,
  canMoveDown,
}: {
  content: PresseContent;
  locale?: Locale;
  visible: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onEdit?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const title = content?.title ?? 'Presse';
  const subtitle = content?.subtitle ?? 'Julie Rosali dans les médias';
  const body =
    content?.body ??
    'Articles de presse, couvertures, passages radio… Julie Rosali fait vibrer les ondes et les pages. Découvrez ses apparitions médiatiques et téléchargez le dossier de presse.';
  const imageUrl = content?.imageUrl ?? '';
  const pressKitUrl = content?.pressKitUrl ?? '';
  const ctaText = content?.ctaText ?? 'Contacter';
  const pressKitText = content?.pressKitText ?? 'Télécharger le dossier de presse';
  const articles = (content?.articles ?? []).filter((a) => a.title || a.url);
  const radios = (content?.radios ?? []).filter((r) => r.name);
  const articlesScrollSpeed = Math.max(0, Math.min(120, content?.articlesScrollSpeed ?? 40));
  const radiosScrollSpeed = Math.max(0, Math.min(120, content?.radiosScrollSpeed ?? 40));
  const titlePx = clampFontSize(content?.titleFontSize);
  const textPx = clampFontSize(content?.textFontSize);

  const articlesContainerRef = useRef<HTMLDivElement>(null);
  const radiosContainerRef = useRef<HTMLDivElement>(null);
  const [articlesManualScroll, setArticlesManualScroll] = useState(false);
  const [radiosManualScroll, setRadiosManualScroll] = useState(false);

  // Fonction pour mettre en pause l'animation lors du survol ou clic
  const toggleAnimation = (type: 'articles' | 'radios', pause: boolean) => {
    const container = type === 'articles' ? articlesContainerRef.current : radiosContainerRef.current;
    if (container) {
      container.style.animationPlayState = pause ? 'paused' : 'running';
    }
  };

  const scrollContainer = (containerRef: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    // Si l'animation est active, on ne peut pas vraiment scroller manuellement de manière fiable
    // car "scrollLeft" ne change pas la position de l'animation CSS transform.
    // Mais si vitesse = 0, le scroll manuel fonctionne via scrollTo.
    
    // Pour supporter le scroll manuel MÊME quand l'animation est active, c'est complexe sans refonte majeure.
    // Solution simple : les flèches ne fonctionnent bien que si vitesse = 0 OU on accepte que ça ne bouge que le conteneur scrollable (si overflow activé).
    
    // CORRECTIF : On force overflow-x-auto même avec l'animation pour permettre le scroll,
    // mais attention, mélanger scroll et transform est glitchy.
    
    if (!containerRef.current) return;
    const scrollAmount = 400;
    const targetScroll = containerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
    containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };

  return (
    <SectionWrapper
      id="presse"
      sectionKey="presse"
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onToggleVisible={onToggleVisible}
      onEdit={onEdit}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      visible={visible}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* ── En-tête de la section ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h2
            className="font-title text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
            style={titlePx != null ? { fontSize: `${titlePx}px` } : undefined}
          >
            {title}
          </h2>
          <span
            className="font-title mt-4 inline-block rounded-full border border-white/40 bg-white/10 px-5 py-1.5 text-xs uppercase tracking-[0.2em] text-white/80"
            style={textPx != null ? { fontSize: `${textPx}px` } : undefined}
          >
            {subtitle}
          </span>
        </motion.div>

        {/* ── Bloc principal : Image + texte ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mb-10 overflow-hidden rounded-2xl bg-accent shadow-2xl md:grid md:grid-cols-12"
        >
          {/* Photo presse */}
          <div className="relative min-h-[280px] md:col-span-5 md:min-h-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Julie Rosali – presse"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                unoptimized={imageUrl.includes('supabase.co')}
              />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center bg-white/5 text-sm text-white/40">
                Photo presse
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-accent/80 hidden md:block" aria-hidden />
          </div>

          {/* Texte + CTA */}
          <div className="relative z-10 flex flex-col justify-center p-8 md:col-span-7 md:p-10 lg:p-14">
            <p
              className="font-body mb-8 max-w-xl text-white/95 leading-relaxed whitespace-pre-line"
              style={textPx != null ? { fontSize: `${textPx}px` } : undefined}
            >
              {body}
            </p>
            <div className="flex flex-wrap gap-4">
              {pressKitUrl && (
                <a
                  href={pressKitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-title inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 text-sm font-medium border-2 border-white/60 transition hover:bg-white/30 hover:border-white hover:scale-[1.02]"
                  data-analytics-id="presse|dossier-de-presse"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  {pressKitText}
                </a>
              )}
              <Link
                href="#contact"
                className="font-title inline-flex items-center gap-2 rounded-full border-2 border-white/90 bg-violet/60 px-6 py-3 text-sm font-medium transition hover:bg-violet hover:border-white hover:scale-[1.02]"
                data-analytics-id="presse|contacter"
              >
                {ctaText}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── Articles de presse ── */}
        {articles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-10"
          >
            {/* Wrapper avec flèches */}
            <div className="relative flex items-center gap-4 group">
              {/* Flèche gauche */}
              {(articlesScrollSpeed === 0) && (
                <button
                  onClick={() => scrollContainer(articlesContainerRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 opacity-0 transition hover:bg-white/20 group-hover:opacity-100 group-hover:z-20"
                  aria-label="Article précédent"
                  data-analytics-id="presse|articles-scroll-gauche"
                >
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Conteneur de scroll */}
              <div className="relative overflow-hidden w-full">
                <div
                  ref={articlesContainerRef}
                  className={`flex gap-6 scroll-smooth scrollbar-hide ${
                    articlesScrollSpeed > 0 ? '' : 'overflow-x-auto'
                  }`}
                  style={{
                    animation: articlesScrollSpeed > 0 ? `presse-articles-scroll ${articlesScrollSpeed}s linear infinite` : 'none',
                    animationPlayState: articlesManualScroll ? 'paused' : 'running',
                  }}
                  onMouseEnter={() => setArticlesManualScroll(true)}
                  onMouseLeave={() => setArticlesManualScroll(false)}
                >
                  {articlesScrollSpeed > 0 
                    ? [...articles, ...articles, ...articles].map((article, i) => (
                      <motion.a
                        key={i}
                        href={article.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-analytics-id={`presse|article-${article.source || article.title || i}`}
                        className="group/article relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg transition hover:border-white/30 hover:bg-white/10 hover:shadow-xl hover:scale-[1.02] flex-shrink-0"
                        style={{ width: '28%', minWidth: '300px', maxWidth: '420px' }}
                      >
                        {article.imageUrl ? (
                          <div className="relative aspect-[16/9] w-full overflow-hidden">
                            <Image
                              src={article.imageUrl}
                              alt={article.title || 'Article'}
                              fill
                              className="object-cover transition duration-500 group-hover/article:scale-105"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              unoptimized={article.imageUrl.includes('supabase.co')}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
                          </div>
                        ) : (
                          <div className="flex aspect-[16/9] w-full items-center justify-center bg-white/5">
                            <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col justify-between p-5">
                          {article.source && (
                            <span className="mb-2 inline-block w-fit rounded-full bg-violet/30 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-white/80">
                              {article.source}
                            </span>
                          )}
                          <h4 className="font-body text-lg font-semibold leading-snug group-hover/article:text-violet-light transition">
                            {article.title || 'Article'}
                          </h4>
                          <span className="mt-3 inline-flex items-center gap-1 text-sm text-white/60 group-hover/article:text-white/90 transition">
                            {locale === 'es' ? 'Leer artículo' : 'Lire l\'article'}
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                        </div>
                      </motion.a>
                    ))
                    : articles.map((article, i) => (
                      <motion.a
                        key={i}
                        href={article.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-analytics-id={`presse|article-${article.source || article.title || i}`}
                        className="group/article relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg transition hover:border-white/30 hover:bg-white/10 hover:shadow-xl hover:scale-[1.02] flex-shrink-0"
                        style={{ width: '28%', minWidth: '300px', maxWidth: '420px' }}
                      >
                        {article.imageUrl ? (
                          <div className="relative aspect-[16/9] w-full overflow-hidden">
                            <Image
                              src={article.imageUrl}
                              alt={article.title || 'Article'}
                              fill
                              className="object-cover transition duration-500 group-hover/article:scale-105"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              unoptimized={article.imageUrl.includes('supabase.co')}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
                          </div>
                        ) : (
                          <div className="flex aspect-[16/9] w-full items-center justify-center bg-white/5">
                            <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col justify-between p-5">
                          {article.source && (
                            <span className="mb-2 inline-block w-fit rounded-full bg-violet/30 px-3 py-0.5 text-xs font-medium uppercase tracking-wider text-white/80">
                              {article.source}
                            </span>
                          )}
                          <h4 className="font-body text-lg font-semibold leading-snug group-hover/article:text-violet-light transition">
                            {article.title || 'Article'}
                          </h4>
                          <span className="mt-3 inline-flex items-center gap-1 text-sm text-white/60 group-hover/article:text-white/90 transition">
                            {locale === 'es' ? 'Leer artículo' : 'Lire l\'article'}
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                        </div>
                      </motion.a>
                    ))
                  }
                </div>
              </div>

              {/* Flèche droite */}
              {(articlesScrollSpeed === 0) && (
                <button
                  onClick={() => scrollContainer(articlesContainerRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 opacity-0 transition hover:bg-white/20 group-hover:opacity-100 group-hover:z-20"
                  aria-label="Article suivant"
                  data-analytics-id="presse|articles-scroll-droite"
                >
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Radios ── */}
        {radios.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Wrapper avec flèches */}
            <div className="relative flex items-center gap-4 group">
              {/* Flèche gauche */}
              {(radiosScrollSpeed === 0) && (
                <button
                  onClick={() => scrollContainer(radiosContainerRef, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 opacity-0 transition hover:bg-white/20 group-hover:opacity-100 group-hover:z-20"
                  aria-label="Radio précédente"
                  data-analytics-id="presse|radios-scroll-gauche"
                >
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Conteneur de scroll */}
              <div className="relative overflow-hidden w-full">
                <div
                  ref={radiosContainerRef}
                  className={`flex gap-4 scroll-smooth scrollbar-hide ${
                    radiosScrollSpeed > 0 ? '' : 'overflow-x-auto'
                  }`}
                  style={{
                    animation: radiosScrollSpeed > 0 ? `presse-radios-scroll ${radiosScrollSpeed}s linear infinite` : 'none',
                    animationPlayState: radiosManualScroll ? 'paused' : 'running',
                  }}
                  onMouseEnter={() => setRadiosManualScroll(true)}
                  onMouseLeave={() => setRadiosManualScroll(false)}
                >
                  {radiosScrollSpeed > 0
                    ? [...radios, ...radios, ...radios].map((radio, i) => {
                      const Tag = radio.url ? 'a' : 'div';
                      const linkProps = radio.url
                        ? { href: radio.url, target: '_blank' as const, rel: 'noopener noreferrer' }
                        : {};
                      return (
                        <motion.div
                          key={i}
                          className="flex-shrink-0"
                          style={{ width: 'auto', minWidth: '140px' }}
                        >
                          <Tag
                            {...linkProps}
                            data-analytics-id={`presse|radio-${radio.name || i}`}
                            className="group/radio flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 text-center transition hover:border-violet/50 hover:bg-white/10 hover:shadow-lg hover:scale-[1.03] h-full"
                          >
                            {radio.logoUrl ? (
                              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 bg-white/10 transition group-hover/radio:border-violet/60">
                                <Image
                                  src={radio.logoUrl}
                                  alt={radio.name || 'Radio'}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                  unoptimized={radio.logoUrl.includes('supabase.co')}
                                />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 transition group-hover/radio:border-violet/60">
                                <svg className="h-7 w-7 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a5 5 0 010-7.072m5.656 0a5 5 0 010 7.072M12 12h.01" />
                                </svg>
                              </div>
                            )}
                            <span className="font-title text-sm font-medium leading-tight text-white/90 group-hover/radio:text-white whitespace-nowrap">
                              {radio.name}
                            </span>
                            {radio.url && (
                              <span className="text-xs text-white/40 group-hover/radio:text-violet-light transition">
                                {locale === 'es' ? 'Escuchar' : 'Écouter'} →
                              </span>
                            )}
                          </Tag>
                        </motion.div>
                      );
                    })
                    : radios.map((radio, i) => {
                      const Tag = radio.url ? 'a' : 'div';
                      const linkProps = radio.url
                        ? { href: radio.url, target: '_blank' as const, rel: 'noopener noreferrer' }
                        : {};
                      return (
                        <motion.div
                          key={i}
                          className="flex-shrink-0"
                          style={{ width: 'auto', minWidth: '140px' }}
                        >
                          <Tag
                            {...linkProps}
                            data-analytics-id={`presse|radio-${radio.name || i}`}
                            className="group/radio flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 text-center transition hover:border-violet/50 hover:bg-white/10 hover:shadow-lg hover:scale-[1.03] h-full"
                          >
                            {radio.logoUrl ? (
                              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/20 bg-white/10 transition group-hover/radio:border-violet/60">
                                <Image
                                  src={radio.logoUrl}
                                  alt={radio.name || 'Radio'}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                  unoptimized={radio.logoUrl.includes('supabase.co')}
                                />
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 transition group-hover/radio:border-violet/60">
                                <svg className="h-7 w-7 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a5 5 0 010-7.072m5.656 0a5 5 0 010 7.072M12 12h.01" />
                                </svg>
                              </div>
                            )}
                            <span className="font-title text-sm font-medium leading-tight text-white/90 group-hover/radio:text-white whitespace-nowrap">
                              {radio.name}
                            </span>
                            {radio.url && (
                              <span className="text-xs text-white/40 group-hover/radio:text-violet-light transition">
                                {locale === 'es' ? 'Escuchar' : 'Écouter'} →
                              </span>
                            )}
                          </Tag>
                        </motion.div>
                      );
                    })
                  }
                </div>
              </div>

              {/* Flèche droite */}
              {(radiosScrollSpeed === 0) && (
                <button
                  onClick={() => scrollContainer(radiosContainerRef, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 opacity-0 transition hover:bg-white/20 group-hover:opacity-100 group-hover:z-20"
                  aria-label="Radio suivante"
                  data-analytics-id="presse|radios-scroll-droite"
                >
                  <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </SectionWrapper>
  );
}
