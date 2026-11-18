'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale } from '@/context/LocaleContext';

const DEFAULT_TEXT = 'Copyright ©2026 Julie Rosali | Tous droits réservés.';

export function Footer({ text, textFontSize }: { text?: string; textFontSize?: number }) {
  const { locale } = useLocale();
  const footerText = text ?? DEFAULT_TEXT;
  const fontSizeStyle = textFontSize != null && textFontSize >= 8 && textFontSize <= 48 ? { fontSize: `${textFontSize}px` } : undefined;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-white/20 bg-black/30 py-6 text-center text-sm text-white/90"
    >
      {footerText ? (
        <p className="whitespace-pre-line" style={fontSizeStyle}>
          {footerText}
        </p>
      ) : null}
      <nav aria-label={locale === 'es' ? 'Información legal' : 'Informations légales'} className="mt-2 flex justify-center gap-4 text-xs text-white/70">
        <Link href="/mentions-legales" className="underline hover:no-underline">
          {locale === 'es' ? 'Aviso legal' : 'Mentions légales'}
        </Link>
        <Link href="/confidentialite" className="underline hover:no-underline">
          {locale === 'es' ? 'Privacidad' : 'Confidentialité'}
        </Link>
      </nav>
    </motion.footer>
  );
}
