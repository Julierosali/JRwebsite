'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLocale } from '@/context/LocaleContext';

const DEFAULT_MENU_ITEMS = [
  { href: '#album', label: 'Nouvel album', key: 'album' },
  { href: '#presentation', label: 'Présentation', key: 'presentation' },
  { href: '#player', label: 'Écouter', key: 'player' },
  { href: '#scene', label: 'Scène', key: 'scene' },
  { href: '#presse', label: 'Presse', key: 'presse' },
  { href: '#portrait', label: 'Portrait', key: 'portrait' },
  { href: '#contact', label: 'Contact', key: 'contact' },
];

type NavProps = {
  /** Clés des sections visibles (masquées = absentes du menu). Si non fourni, tout le menu s'affiche. */
  visibleSectionKeys?: string[] | null;
  /** Titres des sections par clé (locale courante). Si fourni, remplace les labels par défaut. */
  sectionTitles?: Record<string, string> | null;
};

export function Nav({ visibleSectionKeys, sectionTitles }: NavProps) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const items = (
    visibleSectionKeys && visibleSectionKeys.length > 0
      ? DEFAULT_MENU_ITEMS.filter((item) => visibleSectionKeys.includes(item.key))
      : DEFAULT_MENU_ITEMS
  ).map((item) => ({ ...item, label: sectionTitles?.[item.key]?.trim() || item.label }));

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-white/20 bg-black/30 backdrop-blur-md"
      aria-label={locale === 'es' ? 'Navegación principal' : 'Navigation principale'}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Bureau */}
        <ul className="hidden flex-1 flex-wrap items-center justify-center gap-4 md:flex md:gap-6">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                data-analytics-id={`menu|${item.label}`}
                className="font-title block rounded px-3 py-2 text-xl font-medium text-white transition hover:bg-violet/60"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        {/* Mobile */}
        <button
          type="button"
          className="flex items-center gap-2 rounded px-3 py-2 font-title text-lg md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            {open ? (
              <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
          Menu
        </button>
        <div className="shrink-0">
          <LanguageSwitcher />
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-menu"
            data-mobile-drawer="true"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 px-4 pb-3 md:hidden"
          >
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  data-analytics-id={`menu mobile|${item.label}`}
                  className="font-title block rounded px-3 py-3 text-lg font-medium text-white transition hover:bg-violet/60"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
