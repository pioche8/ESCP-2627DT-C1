// site/scripts/shots.mjs — Playwright screenshots of every section at 1440 / 1024 / 768 / 390, plus the menu, with a
// console-error and horizontal-scroll check. Optionally the same for the reference page (REF_URL) for side-by-side review.
//   SITE_URL=http://localhost:3100 REF_URL=http://localhost:3200/TenderScout%20Website%20v3.dc.html LIBS=/path/with/react+babel node scripts/shots.cjs [outDir]
// The reference page loads React and Babel from unpkg; LIBS points at local copies (react.production.min.js, react-dom.production.min.js, babel.min.js) that are served in their place.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright'); // pre-installed in the dev container; not a site dependency

const SITE = process.env.SITE_URL || 'http://localhost:3100';
const REF = process.env.REF_URL || '';
const OUT = path.resolve(process.argv[2] || 'screenshots');
const WIDTHS = (process.env.WIDTHS || '1440,1024,768,390').split(',').map(Number);
const SECTIONS = ['top', 'statement', 'tonight', 'languages', 'how', 'who', 'app', 'sectors', 'where', 'film', 'faq', 'start', 'footer'];
fs.mkdirSync(OUT, { recursive: true });
let failures = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) failures++; };

(async () => {
const LIBS = process.env.LIBS || '';
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
  // the menu
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.menu-pill');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `site-${w}-menu.png`) });
  const focused = await page.evaluate(() => document.activeElement?.className || '');
  ok(/menu-close/.test(focused), `${w}px · menu traps focus (active: ${focused || 'none'})`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(850);
  ok(await page.locator('.menu.open').count() === 0, `${w}px · Escape closes the menu`);
  await page.screenshot({ path: path.join(OUT, `site-${w}-full.png`), fullPage: true });
  ok(problems.length === 0, `${w}px · no console errors, page errors or failed requests` + (problems.length ? '\n       ' + problems.join('\n       ') : ''));
  await ctx.close();
}
if (REF) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    if (LIBS) await page.route('https://unpkg.com/**', (route) => {
      const f = route.request().url().split('/').pop();
      const local = path.join(LIBS, f);
      return fs.existsSync(local) ? route.fulfill({ path: local, contentType: 'application/javascript' }) : route.abort();
    });
    try {
      await page.goto(REF, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      for (const [i, label] of ['01 Hero', '02 Statement', '03 Tonight', '04 Languages', '05 How it works', '06 Built for', '07 In the app', '08 Sectors', '09 Where you bid', '10 Film', '11 Questions', '12 Start', '13 Footer'].entries()) {
        const el = page.locator(`[data-screen-label="${label}"]`).first();
        if (!(await el.count())) continue;
        await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
        await el.screenshot({ path: path.join(OUT, `ref-${w}-${SECTIONS[i]}.png`), animations: 'disabled' }).catch(() => {});
      }
      await page.screenshot({ path: path.join(OUT, `ref-${w}-full.png`), fullPage: true });
      console.log(`  info reference captured at ${w}px`);
    } catch (e) { console.log(`  info reference not captured at ${w}px: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
}
await browser.close();
console.log('\n' + (failures ? failures + ' check(s) failed' : 'Site screenshots passed') + ' · ' + OUT);
process.exitCode = failures ? 1 : 0;
})();
