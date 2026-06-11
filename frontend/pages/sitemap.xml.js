// pages/sitemap.xml.js - Dynamic sitemap generation
import { supabase } from '../lib/supabase';

function generateSiteMap(pools, cities, cityPages, winners) {
  const baseUrl = 'https://abbaa-carraa-ethiopia.vercel.app';
  const today = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
           xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
           xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
           xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
     
     <!-- Main Pages -->
     <url><loc>${baseUrl}</loc><priority>1.0</priority><changefreq>daily</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/listings</loc><priority>0.9</priority><changefreq>daily</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/winners</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/merkato-vip</loc><priority>0.9</priority><changefreq>daily</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/cities</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/about</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/faq</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/contact</loc><priority>0.6</priority><changefreq>monthly</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/how-it-works</loc><priority>0.7</priority><changefreq>monthly</changefreq><lastmod>${today}</lastmod></url>
     <url><loc>${baseUrl}/become-agent</loc><priority>0.6</priority><changefreq>monthly</changefreq><lastmod>${today}</lastmod></url>
     
     <!-- Regular Pools -->
     ${pools.map(pool => `
       <url>
         <loc>${baseUrl}/pools/${pool.id}</loc>
         <priority>0.8</priority>
         <changefreq>weekly</changefreq>
         <lastmod>${pool.updated_at || pool.created_at || today}</lastmod>
         ${pool.image_url ? `<image:image><image:loc>${pool.image_url}</image:loc><image:title>${pool.prize_name}</image:title></image:image>` : ''}
       </url>
     `).join('')}
     
     <!-- City VIP Pages (Static) -->
     ${cityPages.map(city => `
       <url><loc>${baseUrl}/cities/${city.id}</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${today}</lastmod></url>
     `).join('')}
     
     <!-- City VIP Pages (Database) -->
     ${cities.map(city => `
       <url><loc>${baseUrl}/cities/${city.city_id}</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${city.updated_at || today}</lastmod></url>
     `).join('')}
     
     <!-- Winners Pages -->
     ${winners.map(winner => `
       <url>
         <loc>${baseUrl}/winners/${winner.id}</loc>
         <priority>0.7</priority>
         <changefreq>never</changefreq>
         <lastmod>${winner.drawn_at || today}</lastmod>
         <news:news>
           <news:publication>
             <news:name>Abbaa Carraa</news:name>
             <news:language>en</news:language>
           </news:publication>
           <news:publication_date>${winner.drawn_at || today}</news:publication_date>
           <news:title>Winner announced for ${winner.prize_name}</news:title>
         </news:news>
       </url>
     `).join('')}
   </urlset>
  `;
}

export async function getServerSideProps({ res }) {
  try {
    // Fetch regular pools
    const { data: pools } = await supabase
      .from('pools')
      .select('id, prize_name, image_url, updated_at, created_at')
      .eq('status', 'active')
      .limit(200);
    
    // Fetch city VIP configurations
    const { data: cities } = await supabase
      .from('city_vip_config')
      .select('city_id, updated_at')
      .eq('is_active', true)
      .limit(200);
    
    // Fetch winners
    const { data: winners } = await supabase
      .from('merkato_vip_draws')
      .select('id, prize_name, drawn_at')
      .order('drawn_at', { ascending: false })
      .limit(100);
    
    // Static city pages (94+ Ethiopian cities)
    const cityPages = [
      'addis-ababa', 'shaggar', 'dire-dawa', 'mekelle', 'axum', 'adigrat', 'shire',
      'mekoni', 'maychew', 'abiy-addi', 'wukro', 'gondar', 'bahir-dar', 'dessie',
      'debre-markos', 'finote-selam', 'woldia', 'debre-birhan', 'kombolcha', 'sekota',
      'aykal', 'metema', 'debre-tabor', 'bati', 'kemise', 'injibara', 'lalibela',
      'adama', 'jimma', 'bishoftu', 'asella', 'shashemene', 'robe', 'ginir', 'yabelo',
      'moyale', 'chiro', 'fiche', 'woliso', 'ambo', 'nekemte', 'gimbi', 'dembi-dollo',
      'shambu', 'metu', 'bedele', 'bule-hora', 'negele-borana', 'ziway', 'mojo',
      'dodola', 'gera', 'agaro', 'lemu', 'hagere-mariam', 'shakiso', 'kibre-mengist',
      'wachile', 'goba', 'sinana', 'dinsho', 'jijiga', 'degehabur', 'kebri-dehar',
      'gode', 'warder', 'shilabo', 'kelafo', 'mustahil', 'ferfer', 'harar', 'hawassa',
      'yirgalem', 'awassa', 'arba-minch', 'sodo', 'dilla', 'sawla', 'jinka', 'konso',
      'karat', 'bonga', 'mizan-teferi', 'teppi', 'gereb', 'key-afar', 'bako', 'welkite',
      'assosa', 'gilgel-beles', 'kamashi', 'metekel', 'dibate', 'gambella', 'meti',
      'fugnido', 'itur', 'semera', 'asaita', 'logiya', 'abila', 'dubti', 'elidar', 'chifra'
    ].map(city => ({ id: city }));
    
    const sitemap = generateSiteMap(pools || [], cities || [], cityPages, winners || []);
    
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800');
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Fallback sitemap
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://abbaa-carraa-ethiopia.vercel.app</loc><priority>1.0</priority></url>
        <url><loc>https://abbaa-carraa-ethiopia.vercel.app/merkato-vip</loc><priority>0.9</priority></url>
        <url><loc>https://abbaa-carraa-ethiopia.vercel.app/listings</loc><priority>0.8</priority></url>
        <url><loc>https://abbaa-carraa-ethiopia.vercel.app/cities</loc><priority>0.8</priority></url>
      </urlset>`;
    res.setHeader('Content-Type', 'text/xml');
    res.write(fallbackSitemap);
    res.end();
  }

  return { props: {} };
}

export default function SiteMap() {}
