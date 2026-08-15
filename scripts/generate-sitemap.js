/* eslint-env node */
const fs = require('fs');
const path = require('path');

async function generateSitemap() {
  try {
    let baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
    
    // Node.js fetch() requires absolute URLs. If Vercel sets the env to '/api', 
    // route directly to the AWS Lambda backend instead.
    if (baseUrl.startsWith('/')) {
      baseUrl = 'https://6ddppysfz5onv3n37neep242em0fhxmm.lambda-url.us-east-2.on.aws';
    }
    
    const siteUrl = process.env.SITE_URL || 'https://konura.store';
    
    console.log(`Fetching products from ${baseUrl}...`);
    
    let products = [];
    let skip = 0;
    const limit = 100;
    
    while (true) {
      const response = await fetch(`${baseUrl}/products?limit=${limit}&skip=${skip}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products at skip ${skip}: ${response.statusText}`);
      }
      const chunk = await response.json();
      if (chunk.length === 0) {
        break;
      }
      products.push(...chunk);
      skip += limit;
      
      // Safety break
      if (products.length > 10000) break;
    }

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
