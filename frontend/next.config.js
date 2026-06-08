// next.config.js - UPDATED with timeout and connection settings
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  
  // Add timeout for serverless functions
  serverRuntimeConfig: {
    supabaseTimeout: 30000,
  },
  
  // Add larger timeout for API routes
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  images: {
    unoptimized: true,
    domains: ['supabase.co', 'your-project.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  
  // Add headers for better performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
