/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Remove font caching - this is causing the 404 error
  runtimeCaching: [
    // Supabase API calls
    {
      urlPattern: /^https:\/\/ruqfgsnhvrckbvibpsyu\.supabase\.co\/rest\/v1\/pools.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pools-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60
        }
      }
    },
    {
      urlPattern: /^https:\/\/ruqfgsnhvrckbvibpsyu\.supabase\.co\/rest\/v1\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60
        }
      }
    },
    // Images caching
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60
        }
      }
    },
    // Next.js static files
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60
        }
      }
    }
    // REMOVED the font caching and generic page caching that cause issues
  ]
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [
      'ruqfgsnhvrckbvibpsyu.supabase.co',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
    ],
  },
  compress: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable font optimization to prevent preload errors
  optimizeFonts: false,
};

module.exports = withPWA(nextConfig);
