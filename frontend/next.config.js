/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // ← THIS ONE LINE FIXES EVERYTHING
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  
  images: {
    unoptimized: true,  // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ruqfgsnhvrckbvibpsyu.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
