/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'xnldksrwfsfxgemzkfrs.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
    ],
  },
  async redirects() {
    return [
      { source: '/services', destination: '/', permanent: true },
      { source: '/services/:path*', destination: '/', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // En-têtes de sécurité de base
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
