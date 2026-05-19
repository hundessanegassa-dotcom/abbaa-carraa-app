/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  staticPageGenerationTimeout: 240, // 4 minutes timeout
  
  // 🔥 THIS PREVENTS ALL PAGES FROM STATIC GENERATION
  output: 'standalone',
  trailingSlash: false,
  
  // Disable static generation for all pages (forces server-side rendering)
  generateBuildId: async () => 'build',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ruqfgsnhvrckbvibpsyu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    minimumCacheTTL: 60,
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  modularizeImports: {
    '@heroicons/react': {
      transform: '@heroicons/react/{{member}}',
    },
  },
};

module.exports = nextConfig;
