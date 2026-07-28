// next.config.js - FULLY OPTIMIZED FOR PRODUCTION + TIKTOK SUPPORT
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Compression for better performance
  compress: true,
  
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Add timeout for serverless functions
  serverRuntimeConfig: {
    supabaseTimeout: 30000,
  },
  
  // API configuration
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  // Image optimization
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
  
  // Add headers for better performance and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Security headers
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
  
  // Webpack optimizations
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
          // Separate TikTok SDK
          tiktok: {
            name: 'tiktok',
            test: /[\\/]node_modules[\\/](@tiktok)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Separate Supabase
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Separate react-hot-toast
          toast: {
            name: 'toast',
            test: /[\\/]node_modules[\\/](react-hot-toast)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      },
    };
    
    // Enable tree shaking
    config.optimization.usedExports = true;
    
    // ✅ FIX: Handle ESM modules properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // ✅ FIX: Transpile problematic packages
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.m?js$/,
          include: /node_modules\/react-hot-toast/,
          type: 'javascript/auto',
        },
      ],
    };
    
    // Bundle analyzer (optional - only in development)
    if (!dev && !isServer) {
      // config.plugins.push(new BundleAnalyzerPlugin())
    }
    
    return config;
  },
  
  // ✅ FIX: Experimental features with ESM support
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    esmExternals: 'loose', // ✅ This is the key fix for react-hot-toast
  },
  
  // ✅ FIX: Transpile specific packages
  transpilePackages: [
    'react-hot-toast',
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
  ],
};

module.exports = nextConfig;
