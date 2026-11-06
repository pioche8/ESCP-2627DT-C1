// site/scripts/audit.cjs — Lighthouse and axe-core on every page of the static export, dark and light (5 Nov 2026).
//   STATIC_EXPORT=1 npm run build && node scripts/audit.cjs      (or: npm run audit, which does both)
// Serves out/ on a local port (maps /how → how.html as a static host would), then for each page × colour scheme:
//   · Lighthouse (mobile preset, the dev container's Chromium): performance, accessibility, best practices, SEO must
//     each score ≥ THRESHOLD (95 by default; LH_MIN= overrides), as the median of LH_RUNS runs (3). Reports land in lighthouse/.
//   · axe-core 4.14 through Playwright: 0 violations of any impact. (Lighthouse's accessibility audit uses axe too, but
//     with a smaller rule set; this run uses the full one with the WCAG 2.2 AA tags.)
// The site is dark-only (CLAUDE.md §11 item 55); the light run emulates prefers-color-scheme: light and renders the
// same dark page, which is what a phone set to light would get.
//   AUDIT_URL=https://escp-2627dt-c1-site.vercel.app node scripts/audit.cjs   audits a deployed site instead of out/
//   (no export needed; .github/workflows/post-deploy.yml runs it after each production deploy, ADR-0003).
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '..');
const OUT = path.join(site, 'out');
const REPORTS = path.join(site, 'lighthouse');
const THRESHOLD = +(process.env.LH_MIN || 95);
const RUNS = +(process.env.LH_RUNS || 3);
const PAGES = (process.env.PAGES || '/,/how').split(',');
const SCHEMES = ['dark', 'light'];
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.mp4': 'video/mp4' };

const REMOTE = (process.env.AUDIT_URL || '').replace(/\/$/, '');
if (!REMOTE && !fs.existsSync(path.join(OUT, 'index.html'))) { console.error('audit: no static export in out/. Run: STATIC_EXPORT=1 npm run build'); process.exit(2); }
fs.mkdirSync(REPORTS, { recursive: true });

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      let abs = path.join(OUT, p);
      if (!abs.startsWith(OUT)) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(abs + '.html')) abs += '.html'; // a static host serves /how from how.html (out/how/ only holds Next's prefetch data)
      else if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) abs = path.join(abs, 'index.html');
      if (!fs.existsSync(abs)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' });
      fs.createReadStream(abs).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

let failures = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) failures++; };

(async () => {
  const srv = REMOTE ? null : await serve();
  const base = REMOTE || 'http://127.0.0.1:' + srv.address().port;

  // ---- Lighthouse (node API, Chrome launched through chrome-launcher, colour scheme set on a puppeteer page) ----
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');
  const puppeteer = require('puppeteer-core');
  const chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + chrome.port, defaultViewport: null });
  console.log('== Lighthouse ' + (await (async () => { try { return JSON.parse(fs.readFileSync(require.resolve('lighthouse/package.json'), 'utf8')).version; } catch { return ''; } })()) + ' · threshold ' + THRESHOLD + ' · ' + base);
  for (const p of PAGES) {
    for (const scheme of SCHEMES) {
      // Lighthouse's performance score is noisy on a shared machine (total blocking time swings with the host's load),
      // so each page × scheme is measured RUNS times (default 3) and the median per category is what counts, as
      // Lighthouse's own documentation recommends. Every run's report is kept.
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        const page = await browser.newPage();
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
        const result = await lighthouse(base + p, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, undefined, page);
        const name = (p === '/' ? 'home' : p.replace(/\//g, '')) + '-' + scheme + (RUNS > 1 ? '-' + (i + 1) : '');
        fs.writeFileSync(path.join(REPORTS, name + '.json'), result.report);
        runs.push(result.lhr);
        await page.close();
      }
      const cats = runs[0].categories;
      const median = (arr) => { const s = arr.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
      const scores = Object.fromEntries(Object.keys(cats).map((k) => [k, median(runs.map((r) => Math.round((r.categories[k].score || 0) * 100)))]));
      const low = Object.keys(scores).filter((k) => scores[k] < THRESHOLD);
      const worst = runs.slice().sort((a, b) => (a.categories.performance.score || 0) - (b.categories.performance.score || 0))[Math.floor(runs.length / 2)];
      const detail = low.map((k) => k + ': ' + Object.values(worst.audits).filter((a) => a.score !== null && a.score < 1 && (cats[k].auditRefs || []).some((r) => r.id === a.id && r.weight > 0)).map((a) => a.id + ' (' + Math.round((a.score || 0) * 100) + (a.displayValue ? ', ' + a.displayValue : '') + ')').join(', ')).join(' · ');
      const perfRuns = runs.map((r) => Math.round((r.categories.performance.score || 0) * 100)).join('/');
      ok(low.length === 0, `${p} · ${scheme} · perf ${scores.performance} (runs ${perfRuns}) · a11y ${scores.accessibility} · best practices ${scores['best-practices']} · seo ${scores.seo}` + (low.length ? ' · under ' + THRESHOLD + ': ' + detail : ''));
    }
  }
  await browser.disconnect();
  await chrome.kill();

  // ---- axe-core through Playwright ----
  const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  console.log('== axe-core ' + JSON.parse(fs.readFileSync(require.resolve('axe-core/package.json'), 'utf8')).version);
  const pw = await chromium.launch();
  for (const p of PAGES) {
    for (const scheme of SCHEMES) {
      for (const [w, h] of [[1280, 900], [390, 844]]) {
        const ctx = await pw.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
        const page = await ctx.newPage();
        await page.goto(base + p, { waitUntil: 'networkidle' });
        await page.addScriptTag({ content: axeSrc });
        const res = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }));
        const v = res.violations;
        ok(v.length === 0, `${p} · ${scheme} · ${w}px · axe: ${v.length} violation(s), ${res.passes.length} rules passed` + (v.length ? '\n       ' + v.map((x) => x.impact + ' ' + x.id + ' (' + x.nodes.length + '): ' + x.help + ' → ' + x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')).join('\n       ') : ''));
        await ctx.close();
      }
    }
  }
  await pw.close();
  if (srv) srv.close();
  console.log('\n' + (failures ? failures + ' audit check(s) failed' : 'Lighthouse ≥ ' + THRESHOLD + ' in all four categories and 0 axe violations on ' + PAGES.length + ' pages × dark + light') + ' · reports in lighthouse/');
  process.exitCode = failures ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
