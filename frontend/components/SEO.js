// components/SEO.js - Dynamic SEO component for all pages
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SEO({ 
  title, 
  description, 
  image, 
  url,
  type = 'website',
  siteName = 'Abbaa Carraa',
  twitterCardType = 'summary_large_image',
  noIndex = false,
  publishedTime,
  updatedTime,
  author = 'Abbaa Carraa Team'
}) {
  const router = useRouter();
  const currentUrl = url || `https://abbaa-carraa-ethiopia.vercel.app${router.asPath}`;
  const defaultImage = 'https://abbaa-carraa-ethiopia.vercel.app/images/og-image.jpg';
  const defaultTitle = 'Abbaa Carraa - Win Amazing Prizes | Ethiopia\'s Premier Prize Platform';
  const defaultDescription = 'Win cars, houses, electronics, and up to 40 Million ETB through community savings. Join Merkato VIP, City VIP, or Regular Pools. 2% supports kidney & heart disease patients.';

  const finalTitle = title ? `${title} | Abbaa Carraa` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={currentUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="am_ET" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCardType} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      
      {/* Article specific */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {updatedTime && <meta property="article:modified_time" content={updatedTime} />}
          <meta property="article:author" content={author} />
        </>
      )}
      
      {/* Additional SEO */}
      <meta name="author" content={author} />
      <meta name="keywords" content="Ethiopian lottery, digital lottery, Abbaa Carraa, win prizes, Merkato VIP, City VIP, Ethiopian games, equb, community savings, win car, win house, win electronics" />
      
      {/* Verification tags (optional - add your own) */}
      {/* <meta name="google-site-verification" content="your-code" /> */}
      {/* <meta name="facebook-domain-verification" content="your-code" /> */}
      
      {/* Structured Data - Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Abbaa Carraa",
            "url": "https://abbaa-carraa-ethiopia.vercel.app",
            "logo": "https://abbaa-carraa-ethiopia.vercel.app/images/logo.png",
            "sameAs": [
              "https://facebook.com/abbaacarraa",
              "https://twitter.com/abbaacarraa",
              "https://instagram.com/abbaacarraa",
              "https://t.me/abbaacarraa"
            ],
            "description": defaultDescription,
            "email": "hundessanegassa@gmail.com",
            "telephone": "+251913277922",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Addis Ababa",
              "addressCountry": "Ethiopia"
            }
          })
        }}
      />
      
      {/* Structured Data - Website */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Abbaa Carraa",
            "url": "https://abbaa-carraa-ethiopia.vercel.app",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://abbaa-carraa-ethiopia.vercel.app/search?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </Head>
  );
}
