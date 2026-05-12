import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://ruqfgsnhvrckbvibpsyu.supabase.co" />
        <link rel="dns-prefetch" href="https://ruqfgsnhvrckbvibpsyu.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/images/abbaa-carraa-bg.png" as="image" />
        
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Abbaa Carraa" />
        <link rel="apple-touch-icon" href="/images/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
