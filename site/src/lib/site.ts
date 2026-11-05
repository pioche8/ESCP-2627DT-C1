// Absolute URLs for Open Graph, the canonical links and the sitemap: Vercel's production URL when deployed, SITE_URL for
// a static host, localhost meanwhile (the site is not deployed yet, README → "Hosting").
export const SITE_URL = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000');
