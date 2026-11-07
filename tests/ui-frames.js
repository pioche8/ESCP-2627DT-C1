/*
 * tests/ui-frames.js — the docs/ui frames that the smoke path cannot give cleanly (6 Nov 2026).
 * Dev-only: needs Playwright + Chromium. The app itself has no dependencies.
 *
 *   node tests/ui-frames.js            → rewrites the eleven frames below in docs/ui/ (390×844 at 2×)
 *   node tests/ui-frames.js <folder>   → writes them to <folder> instead
 *
 * The smoke test's own screenshots (node tests/smoke.js <folder>) cover every other frame in UI_DESIGN.md §6; these need
 * a state of their own (until 7 Nov its path also left a toast on them). Here each frame gets a fresh page: the stored
 * tenderscout.v2 is seeded before load (load() merges it onto fresh(), so a partial state is enough), the route opens
 * with ?demo=fast&theme=<scheme>, and the shot waits until no toast is showing. Nothing in the app changes for it.
 */
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { console.error('Playwright is not installed: npm i --no-save playwright && npx playwright install chromium'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const BASE = 'file://' + ROOT + '/index.html';
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'docs', 'ui'));
const TODAY = require(path.join(ROOT, 'data.js')).DEMO_TODAY;
const BIDS = { saved: { 'ell-schools': 'Bidding' }, skipped: { 'vli-libraries': { reasons: ['Missing a certificate'], at: TODAY } } };
const FLIP = { overrides: { 'hoh-security': { r3: 'pass' } } };
// name, scheme, route, state on top of { onboarded, notifiedOn }, options
const FRAMES = [
  ['bids-stages', 'dark', '#/bids', BIDS],
  ['light-bids', 'light', '#/bids', BIDS],
  ['insights', 'dark', '#/insights', {}],
  ['insights-full', 'dark', '#/insights', {}, { full: true }],
  ['light-insights', 'light', '#/insights', {}],
  ['profile', 'dark', '#/profile', {}],
  ['light-profile', 'light', '#/profile', {}],
  ['about', 'dark', '#/settings', {}],
  ['light-settings', 'light', '#/settings', {}],
  ['light-company-rescore', 'light', '#/company', FLIP, { tap: '[data-cert="ISO 27001"]' }],
  ['tender-competition', 'dark', '#/t/hoh-security', {}, { section: 'Competition' }]
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright.chromium.launch();
  let failed = 0;
  for (const [name, scheme, route, patch, o = {}] of FRAMES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const state = Object.assign({ onboarded: true, notifiedOn: TODAY }, patch);
    await page.addInitScript((s) => {
      try { if (!sessionStorage.getItem('ui-frames')) { localStorage.setItem('tenderscout.v2', JSON.stringify(s)); sessionStorage.setItem('ui-frames', '1'); } } catch (e) { /* private mode: the app falls back to memory */ }
    }, state);
    await page.goto(BASE + '?demo=fast&theme=' + scheme + route);
    await page.waitForTimeout(1600); // entrances and the fast simulated read settle
    if (o.tap) { await page.click(o.tap); await page.waitForTimeout(1600); } // the re-score morph settles
    if (o.section) {
      await page.evaluate((title) => {
        const h = Array.prototype.find.call(document.querySelectorAll('.sec-h'), (x) => x.textContent.indexOf(title) === 0);
        window.scrollTo(0, window.scrollY + h.getBoundingClientRect().top - 90);
      }, o.section);
      await page.waitForTimeout(700);
    }
    if (await page.locator('.toast.show').count()) await page.waitForTimeout(4600); // toasts hide after 4 s
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: !!o.full });
    const ok = errors.length === 0;
    if (!ok) failed++;
    console.log((ok ? 'ok   ' : 'FAIL ') + name + ' · ' + scheme + ' · ' + route + (ok ? '' : ' · ' + errors.join(' | ')));
    await ctx.close();
  }
  await browser.close();
  console.log(failed ? failed + ' frame(s) had console errors' : 'All frames written to ' + (path.relative(ROOT, OUT) || OUT));
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
