'use client';

import { motion } from 'framer-motion';

export function Footer({ text }: { text?: string }) {
  const footerText = text ?? 'Copyright ©2026 Julie Rosali | Tous droits réservés.';

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="border-t border-white/20 bg-black/30 py-6 text-center text-sm text-white/90 whitespace-pre-line"
    >
      {footerText}
    </motion.footer>
  );
}
