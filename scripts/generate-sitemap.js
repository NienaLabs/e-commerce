/* eslint-env node */
const fs = require('fs');
const path = require('path');

async function generateSitemap() {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
    const siteUrl = process.env.SITE_URL || 'https://konura.store';
    
    console.log(`Fetching products from ${baseUrl}...`);
    // Using global fetch (available in Node 18+)
    const response = await fetch(`${baseUrl}/products?limit=1000`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    const products = await response.json();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static URLs -->
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Dynamic URLs for products
    for (const product of products) {
      const lastMod = new Date(product.updated_at || product.created_at || Date.now()).toISOString();
      sitemap += `  <url>
    <loc>${siteUrl}/product/${product.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    }

    sitemap += `</urlset>`;

    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, '_sitemap.xml');
    fs.writeFileSync(outputPath, sitemap, 'utf8');
    
    console.log(`Sitemap successfully generated with ${products.length} products at ${outputPath}`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Exit with 0 so the build doesn't fail if the backend is unreachable during dev builds
    process.exit(0);
  }
}

generateSitemap();
