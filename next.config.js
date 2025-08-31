/** @type {import('next').NextConfig} */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_HOST = (() => {
  try { return new URL(SUPABASE_URL).host; } catch { return ''; }
})();

const nextConfig = {
  images: {
    unoptimized: false, // on garde l'optimizer activé, mais on pourra débrayer au composant
    remotePatterns: SUPABASE_HOST ? [
      {
        protocol: 'https',
        hostname: SUPABASE_HOST,
        pathname: '/storage/v1/object/public/**',
      },
    ] : [],
  },
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
};
module.exports = nextConfig;
