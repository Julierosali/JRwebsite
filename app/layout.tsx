import type { Metadata } from 'next';
import { Anton, Source_Sans_3 } from 'next/font/google';
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
  variable: '--font-body',
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
    <html lang="fr" className={`${anton.variable} ${sourceSans.variable}`}>
      <body className="font-body antialiased bg-gradient min-h-screen text-white">
        <AdminProvider>
          {children}
        </AdminProvider>
      </body>
    </html>
  );
}
