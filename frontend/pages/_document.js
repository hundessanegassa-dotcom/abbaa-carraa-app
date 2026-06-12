// pages/_document.js - OPTIMIZED FOR PWA AND PERFORMANCE
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to critical origins - Optimized */}
        <link rel="preconnect" href="https://ruqfgsnhvrckbvibpsyu.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ruqfgsnhvrckbvibpsyu.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical assets - Only load critical images */}
        {/* <link rel="preload" href="/images/abbaa-carraa-bg.png" as="image" /> - Remove or use only on homepage */}
        
        {/* PWA Manifest and Icons */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Abbaa Carraa" />
        
        {/* Icons - Multiple sizes for different devices - FIXED: using /images/ instead of /icons/ */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/icon-16x16.png" />
        <link rel="apple-touch-icon" href="/images/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/images/icon-152x152.png" />
        
        {/* Maskable icon for Android */}
        <link rel="mask-icon" href="/images/icon-512x512.png" color="#10b981" />
        
        {/* Viewport - Already in _app.js, but included for completeness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* SEO - Basic meta tags */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        
        {/* Security headers via meta tags - ALL KEPT */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />

        {/* Google Search Console Verification - KEPT */}
        <meta name="google-site-verification" content="R7_wK0rVZIH3R1tBPRkZQiiFDz9TC04m5NdAmmRuVbk" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
