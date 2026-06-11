// pages/api/sitemap.xml.js - API route for sitemap
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  const baseUrl = 'https://abbaa-carraa-ethiopia.vercel.app';
  const today = new Date().toISOString();
  
  try {
    // Fetch regular pools
    const { data: pools } = await supabase
      .from('pools')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .limit(200);
    
    // Fetch city VIP configurations
    const { data: cities } = await supabase
      .from('city_vip_config')
      .select('city_id, updated_at')
      .eq('is_active', true)
      .limit(200);
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>${baseUrl}</loc><priority>1.0</priority><changefreq>daily</changefreq><lastmod>${today}</lastmod></url>
        <url><loc>${baseUrl}/listings</loc><priority>0.9</priority><changefreq>daily</changefreq><lastmod>${today}</lastmod></url>
        <url><loc>${baseUrl}/winners</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${today}</lastmod></url>
        <url><loc>${baseUrl}/merkato-vip</loc><priority>0.9</priority><changefreq>daily</changefreq><lastmod>${today}</lastmod></url>
        <url><loc>${baseUrl}/cities</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${today}</lastmod></url>
        ${pools?.map(pool => `
          <url><loc>${baseUrl}/pools/${pool.id}</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${pool.updated_at || pool.created_at || today}</lastmod></url>
        `).join('')}
        ${cities?.map(city => `
          <url><loc>${baseUrl}/cities/${city.city_id}</loc><priority>0.8</priority><changefreq>weekly</changefreq><lastmod>${city.updated_at || today}</lastmod></url>
        `).join('')}
      </urlset>
    `;
    
    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>${baseUrl}</loc><priority>1.0</priority></url>
        <url><loc>${baseUrl}/merkato-vip</loc><priority>0.9</priority></url>
        <url><loc>${baseUrl}/listings</loc><priority>0.8</priority></url>
      </urlset>`;
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(fallbackSitemap);
  }
}
