/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 THIS DISABLES ALL STATIC PRE-RENDERING
  output: 'standalone',
  
  // Disable static generation for all pages
  trailingSlash: false,
  
  reactStrictMode: true,
  swcMinify: true,
  
  images: {
    unoptimized: true,
    domains: ['supabase.co'],
  },
  
  // Tell Next.js not to try to pre-render any page
  staticPageGenerationTimeout: 1,
};

module.exports = nextConfig;
