import type { Metadata } from 'next';
import { Anton, Source_Sans_3, Playfair_Display, Lora } from 'next/font/google';
import { AdminProvider } from '@/context/AdminContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { AnalyticsCollector } from '@/components/AnalyticsCollector';
import { getSeoSettings } from '@/lib/seo';
import './globals.css';

const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const DEFAULT_TITLE =
  'Julie Rosali | Artiste, auteure-compositrice-interprète — Chanson française et influences latines';
const DEFAULT_DESCRIPTION =
  'Julie Rosali, artiste française indépendante. Chanson française, pop émotionnelle et influences latines. Découvrez ses albums et ses concerts.';

export async function generateMetadata(): Promise<Metadata> {
  const globalSeo = await getSeoSettings('_global');
  const desc =
    globalSeo?.meta_description?.trim() || DEFAULT_DESCRIPTION;
  const shortDesc = desc.length > 300 ? desc.slice(0, 297).trimEnd() + '…' : desc;
  return {
    icons: globalSeo?.favicon_url ? { icon: globalSeo.favicon_url } : undefined,
    title: {
      default: globalSeo?.meta_title?.trim() || DEFAULT_TITLE,
      template: '%s | Julie Rosali',
    },
    description: shortDesc,
    verification: {
      google: 'TnBC2oaICiHBGgpTXL2r8P_LtA5JW9Q6zHcG9ZqaIQ8',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${anton.variable} ${sourceSans.variable} ${playfairDisplay.variable} ${lora.variable}`}>
      <body className="font-body antialiased bg-gradient min-h-screen text-white">
        <AdminProvider>
          <LocaleProvider>
            <AnalyticsCollector />
            {children}
          </LocaleProvider>
        </AdminProvider>
      </body>
    </html>
  );
}
