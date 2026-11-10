// Absolute URLs for Open Graph, the canonical links and the sitemap: Vercel's production URL when deployed, SITE_URL for
// a static host, localhost meanwhile. The Pages export sets SITE_URL to the origin only (https://pioche8.github.io): Next
// adds the base path itself to the files it generates (the Open Graph image), and withBase() adds it to the URLs written
// in the metadata, so neither ends up with the base path twice.
export const SITE_URL = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000');

// The path the site is served under. Empty on Vercel and in the plain static export; '/ESCP-2627DT-C1/website' in the
// GitHub Pages export (scripts/pages-export.mjs, ADR-0005), where next.config.ts sets basePath from the same variable.
// Next adds basePath to its own links, scripts and metadata files, but not to a plain <a href>, an <img src> or an
// iframe, so those go through withBase().
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
/**
 * A root-relative site path under the base path; anything else (https://…, #…) unchanged. With a base path (the Pages
 * export, built with trailingSlash) a page path gets its trailing slash too, so it lands on the page without a redirect:
 * '/how' → '/ESCP-2627DT-C1/website/how/', '/assets/x.jpg' → '/ESCP-2627DT-C1/website/assets/x.jpg'. Without one it
 * returns its input, so the Vercel build and the plain export are unchanged.
 */
export const withBase = (p: string) => {
  if (!BASE_PATH || !p.startsWith('/') || p.startsWith('//')) return p;
  const i = p.search(/[?#]/);
  const path = i === -1 ? p : p.slice(0, i), tail = i === -1 ? '' : p.slice(i);
  const page = !/\.[a-z0-9]+$/i.test(path) && !path.endsWith('/');
  return BASE_PATH + path + (page ? '/' : '') + tail;
};
