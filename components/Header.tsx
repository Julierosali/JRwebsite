'use client';

import { motion } from 'framer-motion';
import { hexToRgba } from '@/lib/style';

export type HeaderContent = {
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  /** Point de focus de l'image (0–100), défaut 50 (centre). */
  focusX?: number;
  focusY?: number;
  /** Couleur de superposition sur la photo (hex). */
  overlayColor?: string;
  /** Opacité de la superposition (0–1). */
  overlayOpacity?: number;
  /** Taille du titre (px, 8–48). */
  titleFontSize?: number;
  /** Taille du sous-titre (px, 8–48). */
  textFontSize?: number;
};

const DEFAULT_FOCUS = 50;
const DEFAULT_OVERLAY_COLOR = '#000000';
const DEFAULT_OVERLAY_OPACITY = 0.3;

export function Header({ content }: { content: HeaderContent }) {
  const title = content?.title ?? 'Julie Rosali';
  const subtitle = content?.subtitle ?? 'Auteure-compositrice-interprète';
  const focusX = content?.focusX ?? DEFAULT_FOCUS;
  const titleFontSize = content?.titleFontSize != null && content.titleFontSize >= 8 && content.titleFontSize <= 48 ? content.titleFontSize : undefined;
  const textFontSize = content?.textFontSize != null && content.textFontSize >= 8 && content.textFontSize <= 48 ? content.textFontSize : undefined;
  const focusY = content?.focusY ?? DEFAULT_FOCUS;
  const overlayColor = content?.overlayColor ?? DEFAULT_OVERLAY_COLOR;
  const overlayOpacity = content?.overlayOpacity ?? DEFAULT_OVERLAY_OPACITY;

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
      <div
        className="absolute inset-0 z-[1]"
        style={{ backgroundColor: hexToRgba(overlayColor, overlayOpacity) }}
        aria-hidden
      />
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 md:py-12">
        <h1 className="font-title text-4xl font-bold tracking-wide md:text-5xl lg:text-6xl" style={titleFontSize != null ? { fontSize: `${titleFontSize}px` } : undefined} data-analytics-id="Header|Logo">{title}</h1>
        {subtitle ? (
          <p className="font-title mt-2 text-lg text-white/90 md:text-xl whitespace-pre-line" style={textFontSize != null ? { fontSize: `${textFontSize}px` } : undefined}>{subtitle}</p>
        ) : null}
      </div>
    </motion.header>
  );
}
