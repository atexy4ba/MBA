import 'dotenv/config';
import mysql from 'mysql2/promise';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'dist');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mba_ecom',
});

const template = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= title %></title>
  <meta name="description" content="<%= description %>" />
  <meta property="og:title" content="<%= ogTitle %>" />
  <meta property="og:description" content="<%= description %>" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="<%= url %>" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <script>
    window.__PRERENDER__ = true;
    window.__PRERENDER_DATA__ = <%- JSON.stringify(data) %>;
  </script>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <script type="module" src="/assets/<%= jsBundle %>"></script>
  <link rel="stylesheet" href="/assets/<%= cssBundle %>" />
</head>
<body>
  <div id="root"></div>
</body>
</html>
`;

function getBundles(): { js: string; css: string } {
  try {
    const assetsDir = path.join(OUT_DIR, 'assets');
    const files = fs.readdirSync(assetsDir);
    const js = files.find((f) => f.endsWith('.js'));
    const css = files.find((f) => f.endsWith('.css'));
    return { js: js || 'index.js', css: css || 'index.css' };
  } catch {
    return { js: 'index.js', css: 'index.css' };
  }
}

async function prerenderHomepage() {
  try {
    const [rows] = await pool.query('SELECT name FROM categories WHERE parent_id IS NULL AND is_active = 1 ORDER BY sort_order LIMIT 5');
    const featuredCategories = rows as { name: string }[];

    const data = { page: 'home', featuredCategories };
    const { js, css } = getBundles();

    const html = ejs.render(template, {
      title: 'Made by Algerians — Vêtements et textiles personnalisés',
      description: 'Vêtements et textiles personnalisés fabriqués en Algérie. T-shirts, hoodies, polos, vêtements professionnels. 7 ans d\'expérience.',
      ogTitle: 'Made by Algerians — L\'excellence textile algérienne',
      url: process.env.BASE_URL || 'https://madebyalgerians.com',
      data,
      jsBundle: js,
      cssBundle: css,
    });

    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
    console.log('✅ Homepage prerendered');

    const frDir = path.join(OUT_DIR, 'fr');
    if (!fs.existsSync(frDir)) fs.mkdirSync(frDir, { recursive: true });
    fs.writeFileSync(path.join(frDir, 'index.html'), html);
    console.log('✅ /fr/ prerendered');
  } catch (err) {
    console.error('❌ Homepage prerender failed:', err);
  }
}

async function prerenderCategories() {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug, parent_id FROM categories WHERE is_active = 1 ORDER BY sort_order'
    );
    const categories = rows as { id: number; name: string; slug: string; parent_id: number | null }[];

    const { js, css } = getBundles();

    for (const cat of categories) {
      const data = { page: 'category', category: cat };
      const html = ejs.render(template, {
        title: `${cat.name} — Made by Algerians`,
        description: `${cat.name} fabriqués en Algérie. Découvrez notre collection de ${cat.name.toLowerCase()} personnalisables.`,
        ogTitle: `${cat.name} — Made by Algerians`,
        url: `${process.env.BASE_URL || 'https://madebyalgerians.com'}/fr/categories/${cat.slug}`,
        data,
        jsBundle: js,
        cssBundle: css,
      });

      const catDir = path.join(OUT_DIR, 'fr', 'categories', cat.slug);
      if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
      fs.writeFileSync(path.join(catDir, 'index.html'), html);
    }

    console.log(`✅ ${categories.length} category pages prerendered`);
  } catch (err) {
    console.error('❌ Category prerender failed:', err);
  }
}

async function main() {
  console.log('🔨 Prerendering static pages...');
  await prerenderHomepage();
  await prerenderCategories();
  await pool.end();
  console.log('🎉 Prerender complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('Prerender error:', err);
  process.exit(1);
});
