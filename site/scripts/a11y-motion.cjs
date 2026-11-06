// site/scripts/a11y-motion.cjs — reduced-motion and keyboard checks for the site (dev-only; Playwright is pre-installed).
//   node scripts/a11y-motion.cjs                          serves the static export in out/ itself (npm run audit runs it)
//   SITE_URL=http://localhost:3100 node scripts/a11y-motion.cjs   (or test a running server)
// 6 Nov 2026 (CLAUDE.md §11 items 139–141): part of `npm run audit`; adds the reduced-motion overflow, the lazy map, the
// exact map counts, the AT label, and the phone's five tabs.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const OUT = path.join(path.resolve(__dirname, '..'), 'out');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml', '.svg': 'image/svg+xml' };
const serve = () => new Promise((resolve) => {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    let abs = path.join(OUT, p); if (fs.existsSync(abs + '.html')) abs += '.html'; else if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) abs = path.join(abs, 'index.html');
    if (!abs.startsWith(OUT) || !fs.existsSync(abs)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' }); fs.createReadStream(abs).pipe(res);
  });
  srv.listen(0, '127.0.0.1', () => resolve(srv));
});
let failures = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) failures++; };
const counts = async (page) => (await page.locator('.map-counts').innerText()).replace(/\s+/g, ' ').trim();
(async () => {
  let srv = null, SITE = process.env.SITE_URL;
  if (!SITE) {
    if (!fs.existsSync(path.join(OUT, 'index.html'))) { console.error('a11y-motion: no static export in out/. Run: npm run export (or set SITE_URL)'); process.exit(2); }
    srv = await serve(); SITE = 'http://127.0.0.1:' + srv.address().port;
  }
  const browser = await chromium.launch();
  // 1. prefers-reduced-motion: no marquee, no glow follow, no count-ups, instant reveals
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle' });
  const marq = await page.evaluate(() => { const el = document.querySelector('.marq-row'); const a = el.getBoundingClientRect().left; return new Promise((r) => setTimeout(() => r({ name: getComputedStyle(el).animationName, moved: Math.abs(el.getBoundingClientRect().left - a) }), 500)); });
  ok(marq.name === 'none' && marq.moved < 0.5, `reduced motion: marquee frozen (${marq.name}, moved ${marq.moved}px)`);
  const gx = await page.evaluate(() => { const h = document.querySelector('.hero'); const a = h.style.getPropertyValue('--gx'); return new Promise((r) => setTimeout(() => r([a, h.style.getPropertyValue('--gx')]), 400)); });
  ok(gx[0] === gx[1], `reduced motion: hero glow does not drift (${gx[0] || 'static'})`);
  await page.locator('#how').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  ok((await page.locator('.counter-num').innerText()) === '777', 'reduced motion: the 777 counter shows its final value at once');
  await page.locator('#statement').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  const lit = await page.evaluate(() => [document.querySelectorAll('.reveal span.lit').length, document.querySelectorAll('.reveal span').length]);
  ok(lit[0] === lit[1], `reduced motion: statement fully lit at once (${lit[0]}/${lit[1]})`);
  const anims = await page.evaluate(() => document.getAnimations().filter((a) => (a.effect.getComputedTiming().duration || 0) > 0).length);
  ok(anims === 0, `reduced motion: no running CSS animations (${anims})`);
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(sw[0] === sw[1], `reduced motion: no horizontal scroll at 1280 px (the frozen marquee stays inside its row: ${sw[0]} / ${sw[1]})`);
  await ctx.close();
  const ctxm = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const pm = await ctxm.newPage(); await pm.goto(SITE, { waitUntil: 'networkidle' });
  const swm = await pm.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(swm[0] === swm[1], `reduced motion: no horizontal scroll at 390 px (${swm[0]} / ${swm[1]})`);
  await ctxm.close();
  // 2. keyboard: menu opens, traps focus, Escape closes and returns focus; the dock tabs take arrow keys; pins are focusable
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(SITE, { waitUntil: 'networkidle' });
  await p2.focus('.menu-pill'); await p2.keyboard.press('Enter'); await p2.waitForTimeout(900);
  ok(await p2.evaluate(() => document.activeElement?.classList.contains('menu-close')), 'menu: focus moves to Close');
  for (let i = 0; i < 9; i++) await p2.keyboard.press('Tab');
  ok(await p2.evaluate(() => !!document.activeElement?.closest('#site-menu')), 'menu: Tab stays inside the dialog');
  await p2.keyboard.press('Escape'); await p2.waitForTimeout(850);
  ok(await p2.evaluate(() => document.activeElement?.classList.contains('menu-pill')), 'menu: Escape returns focus to the Menu pill');
  await p2.locator('#app').scrollIntoViewIfNeeded();
  await p2.focus('[role="tab"][aria-selected="true"]'); await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(100);
  ok((await p2.locator('[role="tab"][aria-selected="true"]').innerText()).includes('Company'), 'phone dock: ArrowRight moves to Company');
  const dockTabs = await p2.locator('.dock [role="tab"]').evaluateAll((ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return [t.getAttribute('aria-label'), Math.round(r.width), Math.round(r.height)]; }));
  ok(dockTabs.length === 5 && dockTabs.map((t) => t[0].split(',')[0]).join(' ') === 'Feed Bids Company Profile Settings', 'phone dock: the app\'s five tabs (' + dockTabs.map((t) => t[0]).join(' · ') + ')');
  ok(dockTabs.every((t) => t[1] >= 44 && t[2] >= 44), 'phone dock: every tab at least 44 × 44 px (' + dockTabs.map((t) => t[1] + '×' + t[2]).join(' ') + ')');
  await p2.locator('#dock-tab-0').click(); await p2.locator('#dock-tab-0').focus(); await p2.keyboard.press('ArrowLeft'); await p2.waitForTimeout(100);
  ok((await p2.evaluate(() => document.activeElement && document.activeElement.id)) === 'dock-tab-4', 'phone dock: ArrowLeft from Feed wraps to Settings');
  await p2.locator('#dock-tab-1').click(); await p2.waitForTimeout(200);
  ok((await p2.locator('.pwl').innerText()).replace(/\s+/g, ' ').includes('8 of 21 won · 38% in the last 12 months'), 'phone Bids: the app\'s Win/loss row (' + (await p2.locator('.pwl').innerText()).replace(/\s+/g, ' ').replace('arrow_forward', '').trim() + ')');
  await p2.locator('#dock-tab-2').click(); await p2.waitForTimeout(200);
  await p2.keyboard.press('Tab'); await p2.keyboard.press('Tab'); await p2.keyboard.press('Tab');
  await p2.locator('.pswitch[aria-checked]').nth(1).focus(); await p2.keyboard.press('Space'); await p2.waitForTimeout(800);
  ok((await p2.locator('.pblock').getAttribute('aria-label') || '').includes('Maybe, score 90'), 'phone: ISO 27001 by keyboard → Landkreis Hohenau: Maybe 90 (' + (await p2.locator('.pblock').getAttribute('aria-label')) + ')');
  await p2.locator('.meet-btn').focus(); await p2.keyboard.press('Enter'); await p2.waitForTimeout(800);
  ok((await p2.locator('.pblock').getAttribute('aria-label') || '').includes('Go, score 100'), 'phone: "We meet it" → Go 100');
  await p2.locator('#dock-tab-3').click(); await p2.waitForTimeout(200);
  ok((await p2.locator('.pkv').innerText()).includes('ISO 9001, ISO 27001'), 'phone Profile: shows ISO 27001 after the Company switch');
  await p2.locator('.pbtn-full').click(); await p2.waitForTimeout(200);
  ok((await p2.locator('[role="tab"][aria-selected="true"]').getAttribute('id')) === 'dock-tab-2', 'phone Profile: "Edit on Company" opens Company');
  await p2.locator('#where').scrollIntoViewIfNeeded();
  await p2.waitForSelector('.map-svg .pin', { timeout: 10000 }); await p2.waitForTimeout(400);
  const mh = await p2.evaluate(() => { const s = document.querySelector('.map-svg'); return [s.getBoundingClientRect().height, document.querySelectorAll('.map-svg .pin').length]; });
  ok(mh[0] > 300 && mh[1] === 6, `map: loads near the viewport and fills its frame (${Math.round(mh[0])} px tall, ${mh[1]} pins)`);
  const at = await p2.evaluate(() => { const t = [...document.querySelectorAll('.map-svg text.map-cc')].find((x) => x.textContent === 'AT'); const r = t.getBoundingClientRect(); return [r.left + 2, r.left + r.width / 2, r.right - 2].every((x) => document.elementFromPoint(x, r.top + r.height / 2) === t); });
  ok(at, 'map: the AT code is not covered (it sat under Kaltbrunn\'s label at 16.1 / 46.85)');
  ok((await counts(p2)) === '1 Go 2 Maybe 3 No-go', 'map: counts before the switch (' + (await counts(p2)) + ')');
  await p2.locator('.pin').first().focus();
  ok(await p2.locator('.map-tip').count() === 1, 'map: a focused pin shows its tooltip');
  await p2.locator('.map-row').click(); await p2.waitForTimeout(300);
  ok((await counts(p2)) === '1 Go 1 Maybe 4 No-go', 'map: cross-border off re-scores to 1 · 1 · 4 (' + (await counts(p2)) + ')');
  await p2.locator('.map-row').click(); await p2.waitForTimeout(300);
  ok((await counts(p2)) === '1 Go 2 Maybe 3 No-go', 'map: switching back restores 1 · 2 · 3 (' + (await counts(p2)) + ')');
  await ctx2.close();
  await browser.close();
  if (srv) srv.close();
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'Site motion + keyboard checks passed'));
  process.exitCode = failures ? 1 : 0;
})();
