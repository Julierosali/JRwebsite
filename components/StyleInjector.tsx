'use client';

import { useEffect } from 'react';
import {
  DEFAULT_GRADIENT,
  TITLE_FONT_DEFAULT,
  BODY_FONT_DEFAULT,
  getBlockBackground,
  type StyleContent,
} from '@/lib/style';

const ACCENT_BLOCK_KEYS = ['album', 'presentation', 'scene', 'contact'];

function fontKeyToCssVar(key: string): string {
  return `var(--font-${key.replace(/_/g, '-')})`;
}

type StyleInjectorProps = {
  styleContent: StyleContent | null | undefined;
};

export function StyleInjector({ styleContent }: StyleInjectorProps) {
  const gradient = styleContent?.backgroundGradient ?? DEFAULT_GRADIENT;
  const titleFont = styleContent?.titleFont ?? TITLE_FONT_DEFAULT;
  const bodyFont = styleContent?.bodyFont ?? BODY_FONT_DEFAULT;

  useEffect(() => {
    document.body.style.background = gradient;
    document.body.style.backgroundAttachment = 'fixed';
    document.documentElement.style.setProperty('--font-title', fontKeyToCssVar(titleFont));
    document.documentElement.style.setProperty('--font-body', fontKeyToCssVar(bodyFont));
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      document.documentElement.style.removeProperty('--font-title');
      document.documentElement.style.removeProperty('--font-body');
    };
  }, [gradient, titleFont, bodyFont]);

  const blockRules = ACCENT_BLOCK_KEYS.map(
    (key) =>
      `.bg-accent[data-block="${key}"] { background-color: ${getBlockBackground(styleContent, key)} !important; }`
  ).join('\n');

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `/* Style dynamique */ ${blockRules}`,
      }}
    />
  );
}
