'use client';

import { useEffect } from 'react';
import {
  DEFAULT_GRADIENT,
  getBlockBackground,
  type StyleContent,
} from '@/lib/style';

const ACCENT_BLOCK_KEYS = ['album', 'presentation', 'scene', 'contact'];

type StyleInjectorProps = {
  styleContent: StyleContent | null | undefined;
};

export function StyleInjector({ styleContent }: StyleInjectorProps) {
  const gradient = styleContent?.backgroundGradient ?? DEFAULT_GRADIENT;

  useEffect(() => {
    document.body.style.background = gradient;
    document.body.style.backgroundAttachment = 'fixed';
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
    };
  }, [gradient]);

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
