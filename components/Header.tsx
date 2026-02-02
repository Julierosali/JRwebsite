'use client';

import { motion } from 'framer-motion';

type HeaderContent = {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
};

export function Header({ content }: { content: HeaderContent }) {
  const title = content?.title ?? 'Julie Rosali';
  const subtitle = content?.subtitle ?? 'Auteure-compositrice-interprète';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 py-12 text-center"
    >
      {content?.logoUrl ? (
        <img src={content.logoUrl} alt={title} className="mx-auto mb-4 h-24 w-auto object-contain" />
      ) : null}
      <h1 className="font-anton text-4xl font-bold tracking-wide md:text-5xl lg:text-6xl">{title}</h1>
      {subtitle ? <p className="font-anton mt-2 text-lg text-white/90 md:text-xl whitespace-pre-line">{subtitle}</p> : null}
    </motion.header>
  );
}
