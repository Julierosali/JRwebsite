'use client';

import { motion } from 'framer-motion';

export type HeaderContent = {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  /** Point de focus de l'image (0–100), défaut 50 (centre). */
  focusX?: number;
  focusY?: number;
};

const DEFAULT_FOCUS = 50;

export function Header({ content }: { content: HeaderContent }) {
  const title = content?.title ?? 'Julie Rosali';
  const subtitle = content?.subtitle ?? 'Auteure-compositrice-interprète';
  const focusX = content?.focusX ?? DEFAULT_FOCUS;
  const focusY = content?.focusY ?? DEFAULT_FOCUS;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 flex w-full flex-col items-center justify-center overflow-hidden text-center"
      style={{ aspectRatio: '1920/566' }}
    >
      {content?.logoUrl ? (
        <img
          src={content.logoUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${focusX}% ${focusY}%` }}
        />
      ) : null}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 md:py-12">
        <h1 className="font-title text-4xl font-bold tracking-wide md:text-5xl lg:text-6xl">{title}</h1>
        {subtitle ? (
          <p className="font-title mt-2 text-lg text-white/90 md:text-xl whitespace-pre-line">{subtitle}</p>
        ) : null}
      </div>
    </motion.header>
  );
}
