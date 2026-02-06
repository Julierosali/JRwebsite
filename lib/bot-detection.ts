/**
 * Détection des crawlers / bots par User-Agent pour exclure du tracking analytics.
 * Utilisé côté serveur (API collect) et côté client (éviter d'envoyer des requêtes).
 */

const BOT_PATTERNS = [
  // Moteurs de recherche
  'googlebot',
  'bingbot',
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'sogou',
  'exabot',
  'facebot', // Facebook
  'ia_archiver', // Alexa
  // Réseaux sociaux / crawlers
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'slackbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'applebot',
  // Outils / headless / scripts
  'curl',
  'wget',
  'python-requests',
  'python-urllib',
  'go-http-client',
  'java/',
  'php/',
  'ruby',
  'perl',
  'headlesschrome',
  'phantomjs',
  'selenium',
  'puppeteer',
  'playwright',
  'bot',
  'crawler',
  'spider',
  'scraper',
  'crawling',
  'feed',
  'rss',
  'validator',
  'w3c',
  'monitor',
  'uptime',
  'pingdom',
  'gtmetrix',
  'lighthouse',
  'pagespeed',
  'semrush',
  'ahrefs',
  'maui', // Ahrefs
  'dotbot',
  'rogerbot', // Moz
  'screaming frog',
  'petalbot',
  'bytespider', // ByteDance
  'cloudflare',
  'amazon cloudfront',
  'datanyze',
  'sentry',
  'status',
  'health',
  'kube-',
  'k8s-',
];

/**
 * Retourne true si le User-Agent correspond à un bot/crawler connu.
 * À utiliser côté serveur (req.headers.get('user-agent')) et côté client (navigator.userAgent).
 */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || typeof userAgent !== 'string') return false;
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((p) => ua.includes(p));
}
