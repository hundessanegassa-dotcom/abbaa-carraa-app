// next.config.js - FIXED FOR BUILD ERRORS
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  compress: true,
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  poweredByHeader: false,
  
  serverRuntimeConfig: {
    supabaseTimeout: 30000,
  },
  
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  images: {
    unoptimized: false,
    domains: [
      'supabase.co',
      'ruqfgsnhvrckbvibpsyu.supabase.co',
      'tiktok.com',
      'cdn.tiktok.com',
      'p16-tiktokcdn-com.akamaized.net',
      'p19-tiktokcdn-com.akamaized.net',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.tiktok.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
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
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=43200' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  
  // ✅ CRITICAL FIX: Handle ESM modules and prevent build errors
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          tiktok: {
            name: 'tiktok',
            test: /[\\/]node_modules[\\/](@tiktok)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      },
    };
    
    config.optimization.usedExports = true;
    
    // ✅ Fix: Prevent server-side modules from breaking client build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };
    }
    
    // ✅ Fix: Properly handle ESM modules
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.m?js$/,
          include: /node_modules/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    };
    
    return config;
  },
  
  // ✅ CRITICAL FIX: Experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    esmExternals: false, // ✅ Changed to false to handle ESM properly
  },
  
  // ✅ Fix: Transpile specific packages
  transpilePackages: [
    'react-hot-toast',
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    'react-icons',
  ],
};

module.exports = nextConfig;
