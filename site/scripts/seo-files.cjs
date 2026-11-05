// site/scripts/seo-files.cjs — robots.txt and sitemap.xml as static files (5 Nov 2026), run by `prebuild`.
// Static files instead of app/robots.ts and app/sitemap.ts because the Vercel build (cacheComponents) rejects the
// `force-static` segment config that the static export requires; one pair of files works for both builds.
// Absolute URLs: SITE_URL, else Vercel's production URL, else localhost (the site is not deployed yet).
const fs = require('node:fs');
const path = require('node:path');
const site = path.resolve(__dirname, '..');
const base = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000')).replace(/\/$/, '');
const pages = [['/', '1.0'], ['/how', '0.8']];
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map(([p, pr]) => '  <url><loc>' + base + p + '</loc><changefreq>weekly</changefreq><priority>' + pr + '</priority></url>').join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(site, 'public', 'sitemap.xml'), xml);
fs.writeFileSync(path.join(site, 'public', 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + base + '/sitemap.xml\n');
console.log('seo-files: public/robots.txt and public/sitemap.xml for ' + base);
