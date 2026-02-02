'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const DEFAULT_MENU_ITEMS = [
  { href: '#album', label: 'Nouvel album', key: 'album' },
  { href: '#presentation', label: 'Présentation', key: 'presentation' },
  { href: '#player', label: 'Écouter', key: 'player' },
  { href: '#scene', label: 'Scène', key: 'scene' },
  { href: '#portrait', label: 'Portrait', key: 'portrait' },
  { href: '#contact', label: 'Contact', key: 'contact' },
];

type NavProps = {
  /** Clés des sections visibles (masquées = absentes du menu). Si non fourni, tout le menu s'affiche. */
  visibleSectionKeys?: string[] | null;
};

export function Nav({ visibleSectionKeys }: NavProps) {
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
      <ul className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 md:gap-6">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="font-anton block rounded px-3 py-2 text-sm font-medium text-white transition hover:bg-violet/60 md:text-base"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
}
