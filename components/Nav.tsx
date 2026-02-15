'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

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
  const items =
    visibleSectionKeys && visibleSectionKeys.length > 0
      ? DEFAULT_MENU_ITEMS.filter((item) => visibleSectionKeys.includes(item.key))
      : DEFAULT_MENU_ITEMS;

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-white/20 bg-black/30 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <ul className="flex flex-1 flex-wrap items-center justify-center gap-4 md:gap-6">
          {items.map((item, index) => {
            const label = sectionTitles?.[item.key]?.trim() || item.label;
            return (
              <li key={item.href}>
                {index > 0 && ' '}
                <Link
                  href={item.href}
                  data-analytics-id={`menu|${label}`}
                  className="font-title block rounded px-3 py-2 text-lg font-medium text-white transition hover:bg-violet/60 md:text-xl"
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="shrink-0">
          <LanguageSwitcher />
        </div>
      </div>
    </motion.nav>
  );
}
