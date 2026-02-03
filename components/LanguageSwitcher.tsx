'use client';

import { useLocale } from '@/context/LocaleContext';
import { LOCALES, type Locale } from '@/lib/locale';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded border border-white/30 bg-black/20 p-1">
      {LOCALES.map(({ value, label, flag }) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value as Locale)}
          title={label}
          aria-label={label}
          className={`rounded px-2 py-1 text-lg transition hover:bg-white/20 ${
            locale === value ? 'bg-violet/80 ring-1 ring-white/40' : 'opacity-80 hover:opacity-100'
          }`}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
