import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#10b981" />
        
        {/* Apple iOS Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Abbaa Carraa" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/images/icon-192x192.png" />
        
        {/* Favicon for older browsers */}
        <link rel="icon" type="image/png" sizes="32x32" href="/images/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/icon-16x16.png" />
        
        {/* Preconnect for fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* SEO Meta Tags */}
        <meta name="description" content="A community-driven prize and contribution platform for Ethiopia" />
        <meta name="keywords" content="prize pool, lottery, community, Ethiopia, Telebirr, CBE Birr" />
        <meta name="author" content="Abbaa Carraa" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
