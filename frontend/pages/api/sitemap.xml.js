// pages/api/sitemap.xml.js
export default async function handler(req, res) {
  const baseUrl = 'https://abbaa-carraa-ethiopia.vercel.app';
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>${baseUrl}</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
      <url><loc>${baseUrl}/listings</loc><priority>0.9</priority><changefreq>daily</changefreq></url>
      <url><loc>${baseUrl}/winners</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
      <url><loc>${baseUrl}/merkato-vip</loc><priority>0.9</priority><changefreq>daily</changefreq></url>
      <url><loc>${baseUrl}/cities</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
      <url><loc>${baseUrl}/about</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
      <url><loc>${baseUrl}/faq</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
      <url><loc>${baseUrl}/contact</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>
      <url><loc>${baseUrl}/how-it-works</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
      <url><loc>${baseUrl}/become-agent</loc><priority>0.6</priority><changefreq>monthly</changefreq></url>
      <url><loc>${baseUrl}/terms</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>
      <url><loc>${baseUrl}/privacy</loc><priority>0.5</priority><changefreq>monthly</changefreq></url>
    </urlset>
  `;
  
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800');
  res.status(200).send(sitemap);
}
