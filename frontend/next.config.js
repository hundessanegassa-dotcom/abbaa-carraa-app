/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 THIS DISABLES ALL STATIC GENERATION
  output: 'standalone',
  
  reactStrictMode: true,
  swcMinify: true,
  
  images: {
    unoptimized: true,
    domains: ['supabase.co'],
  },
};

module.exports = nextConfig;
