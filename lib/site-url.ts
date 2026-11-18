/**
 * URL publique du site (sans slash final).
 * Priorité : NEXT_PUBLIC_SITE_URL (à définir dans Vercel avec le vrai domaine),
 * sinon le domaine de production fourni automatiquement par Vercel.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return '';
}
