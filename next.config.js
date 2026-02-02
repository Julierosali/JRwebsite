/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'xnldksrwfsfxgemzkfrs.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
