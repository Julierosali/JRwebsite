import type { Metadata } from 'next';
import { Anton, Source_Sans_3, Playfair_Display, Lora } from 'next/font/google';
import { AdminProvider } from '@/context/AdminContext';
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

export const metadata: Metadata = {
  title: 'Julie Rosali | Artiste - Auteure-compositrice-interprète',
  description: 'Julie Rosali, artiste française indépendante. Chanson française, pop émotionnelle et influences latines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${anton.variable} ${sourceSans.variable} ${playfairDisplay.variable} ${lora.variable}`}>
      <body className="font-body antialiased bg-gradient min-h-screen text-white">
        <AdminProvider>
          {children}
        </AdminProvider>
      </body>
    </html>
  );
}
