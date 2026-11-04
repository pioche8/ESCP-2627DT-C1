// site/scripts/shots.cjs — Playwright screenshots of every section at 1440 / 1024 / 768 / 390, plus the menu, with a
// console-error and horizontal-scroll check, and the declutter scan (../../tests/declutter-scan.js) of the site's
// stylesheets and of the rendered page at every width.
//   SITE_URL=http://localhost:3100 node scripts/shots.cjs [outDir]
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright'); // pre-installed in the dev container; not a site dependency
const scan = require('../../tests/declutter-scan.js');

const SITE = process.env.SITE_URL || 'http://localhost:3100';
const OUT = path.resolve(process.argv[2] || 'screenshots');
const WIDTHS = (process.env.WIDTHS || '1440,1024,768,390').split(',').map(Number);
const SECTIONS = ['top', 'statement', 'tonight', 'languages', 'how', 'who', 'app', 'sectors', 'where', 'film', 'faq', 'start', 'footer'];
fs.mkdirSync(OUT, { recursive: true });
let failures = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) failures++; };

(async () => {
const cssFindings = ['site/src/styles/components.css', 'site/src/styles/tokens.css', 'site/src/app/globals.css'].flatMap(scan.scanCss);
ok(cssFindings.length === 0, 'static CSS scan: no declutter pattern in the site stylesheets' + (cssFindings.length ? '\n       ' + cssFindings.map((v) => v.file + ' · ' + v.pattern + ' · ' + v.match).join('\n       ') : ''));
const browser = await chromium.launch();
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const scroll = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
  ok(scroll.sw <= scroll.cw && scroll.bw <= scroll.cw, `${w}px · no horizontal scroll (scrollWidth ${scroll.sw}, clientWidth ${scroll.cw})`);
  for (const id of SECTIONS) {
    const el = id === 'footer' ? page.locator('footer').first() : page.locator('#' + id).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(id === 'how' ? 900 : 350);
    await el.screenshot({ path: path.join(OUT, `site-${w}-${id}.png`), animations: 'disabled' }).catch((e) => ok(false, `${w}px · screenshot ${id}: ${e.message.split('\n')[0]}`));
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(400);
  const found = await scan.scanDom(page);
  ok(found.length === 0, `${w}px · declutter scan: none of the 18 patterns in the rendered page` + (found.length ? '\n       ' + found.map((x) => x.pattern + ' · ' + x.el + (x.extra ? ' · ' + x.extra : '') + (x.text ? ' · "' + x.text + '"' : '')).join('\n       ') : ''));
  // the menu
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.menu-btn');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `site-${w}-menu.png`) });
  const menuFound = await scan.scanDom(page);
  ok(menuFound.length === 0, `${w}px · declutter scan: menu clean` + (menuFound.length ? '\n       ' + menuFound.map((x) => x.pattern + ' · ' + x.el + ' · ' + (x.extra || '')).join('\n       ') : ''));
  const focused = await page.evaluate(() => document.activeElement?.className || '');
  ok(/menu-close/.test(focused), `${w}px · menu traps focus (active: ${focused || 'none'})`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(850);
  ok(await page.locator('.menu.open').count() === 0, `${w}px · Escape closes the menu`);
  await page.screenshot({ path: path.join(OUT, `site-${w}-full.png`), fullPage: true });
  ok(problems.length === 0, `${w}px · no console errors, page errors or failed requests` + (problems.length ? '\n       ' + problems.join('\n       ') : ''));
  await ctx.close();
}
await browser.close();
console.log('\n' + (failures ? failures + ' check(s) failed' : 'Site screenshots passed') + ' · ' + OUT);
process.exitCode = failures ? 1 : 0;
})();
