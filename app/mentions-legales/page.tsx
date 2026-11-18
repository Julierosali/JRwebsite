import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { getSectionByKey } from '@/lib/sections-server';
import { getSectionContent } from '@/lib/locale';
import { getSiteUrl } from '@/lib/site-url';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales du site officiel de Julie Rosali.',
  alternates: { canonical: '/mentions-legales' },
};

export default async function MentionsLegalesPage() {
  const contact = getSectionContent<{ email?: string }>(
    (await getSectionByKey('contact'))?.content as Record<string, unknown> | undefined,
    'fr'
  );
  const email = contact.email?.trim();
  const siteUrl = getSiteUrl();

  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        Le site {siteUrl ? <a href={siteUrl}>{siteUrl.replace(/^https?:\/\//, '')}</a> : 'officiel de Julie Rosali'} est
        édité par Julie Rosali, artiste auteure-compositrice-interprète.
        {email ? (
          <>
            {' '}Contact : <a href={`mailto:${email}`}>{email}</a>.
          </>
        ) : null}
      </p>
      <p>Directrice de la publication : Julie Rosali.</p>

      <h2>Hébergement</h2>
      <p>
        Site hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
        <a href="https://vercel.com" rel="noopener noreferrer">vercel.com</a>.
      </p>
      <p>
        Contenus et données stockés par Supabase Inc. (base de données et fichiers) —{' '}
        <a href="https://supabase.com" rel="noopener noreferrer">supabase.com</a>.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus de ce site (textes, photographies, visuels, musiques, vidéos, logos) est la
        propriété de Julie Rosali ou de leurs auteurs respectifs. Toute reproduction ou diffusion, totale ou partielle,
        sans autorisation préalable est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
