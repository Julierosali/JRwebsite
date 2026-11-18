import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { getSectionByKey } from '@/lib/sections-server';
import { getSectionContent } from '@/lib/locale';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Données collectées sur le site de Julie Rosali et vos droits.',
  alternates: { canonical: '/confidentialite' },
};

export default async function ConfidentialitePage() {
  const contact = getSectionContent<{ email?: string }>(
    (await getSectionByKey('contact'))?.content as Record<string, unknown> | undefined,
    'fr'
  );
  const email = contact.email?.trim();

  return (
    <LegalPage title="Politique de confidentialité">
      <h2>Mesure d&apos;audience</h2>
      <p>
        Ce site utilise sa propre mesure d&apos;audience, <strong>sans cookie</strong> et sans outil publicitaire. Elle
        sert uniquement à savoir quelles pages sont consultées. Sont enregistrés pour chaque visite :
      </p>
      <ul>
        <li>les pages vues, le temps passé et les clics sur les liens et boutons ;</li>
        <li>le site d&apos;origine (référent), le type de navigateur, de système et d&apos;appareil ;</li>
        <li>le pays et la ville approximatifs, déduits de la connexion ;</li>
        <li>
          une empreinte chiffrée et non réversible de l&apos;adresse IP (l&apos;adresse IP elle-même n&apos;est pas
          conservée).
        </li>
      </ul>
      <p>
        Un identifiant de visite aléatoire est gardé dans votre navigateur le temps de l&apos;onglet (stockage de
        session), et la langue choisie est mémorisée localement. Ces données ne sont ni revendues ni partagées, et sont{' '}
        <strong>supprimées automatiquement au bout de 3 mois</strong>. Base légale : intérêt légitime de l&apos;éditrice
        à mesurer la fréquentation de son site.
      </p>

      <h2>Contenus intégrés</h2>
      <p>
        Certaines pages intègrent des lecteurs YouTube (mode « confidentialité renforcée »), Vimeo, Spotify ou
        SoundCloud. Ces services peuvent déposer leurs propres cookies et collecter des données lorsque leur lecteur
        est affiché ou utilisé, selon leurs politiques respectives.
      </p>

      <h2>Contact par e-mail ou téléphone</h2>
      <p>Les messages que vous envoyez sont utilisés uniquement pour vous répondre.</p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et d&apos;effacement de vos
        données
        {email ? (
          <>
            , à exercer en écrivant à <a href={`mailto:${email}`}>{email}</a>
          </>
        ) : null}
        . Vous pouvez également adresser une réclamation à la CNIL (
        <a href="https://www.cnil.fr" rel="noopener noreferrer">cnil.fr</a>).
      </p>
    </LegalPage>
  );
}
