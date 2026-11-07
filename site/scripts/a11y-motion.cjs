// site/scripts/a11y-motion.cjs — the website's motion inventory, reduced motion, keyboard and touch (dev-only; Playwright
// is pre-installed). Part of `npm run audit`.
//   node scripts/a11y-motion.cjs                          serves the static export in out/ itself
//   SITE_URL=http://localhost:3100 node scripts/a11y-motion.cjs   (or test a running server)
// Pass 5 (7 Nov 2026, CLAUDE.md §11): one check per item of the original 3 Nov site's motion inventory (docs/reports/
// 2026-11-07-pass-5.md → "Website"): each runs with motion on, settles at once and stops looping under reduced motion,
// and the interactive ones work by keyboard and by touch. Plus the earlier checks: the lazy map, the exact map counts,
// the AT code, and the phone's five tabs.
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
const section = (t) => console.log('\n' + t);
const counts = async (page) => (await page.locator('.map-counts').innerText()).replace(/\s+/g, ' ').trim();
// helpers that run in the page
const running = (page, sel, name) => page.evaluate(([sel, name]) => document.querySelectorAll(sel).length ? [...document.querySelectorAll(sel)].reduce((n, el) => n + el.getAnimations().filter((a) => a.playState === 'running' && (!name || a.animationName === name)).length, 0) : -1, [sel, name]);
const changes = (page, sel, prop, ms = 700) => page.evaluate(([sel, prop, ms]) => new Promise((r) => { const el = document.querySelector(sel); if (!el) return r(false); const get = () => (prop === 'class' ? el.className.baseVal ?? el.className : prop === 'text' ? el.textContent : getComputedStyle(el)[prop]); const a = get(); setTimeout(() => r(a !== get()), ms); }), [sel, prop, ms]);
const style = (page, sel, prop) => page.evaluate(([sel, prop]) => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : null; }, [sel, prop]);
// The page scrolls smoothly (html { scroll-behavior: smooth }); the checks jump instead, so a hover lands where it was aimed.
const go = async (page, id, wait = 500) => { await page.evaluate((id) => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById(id).scrollIntoView({ block: 'start' }); }, id); await page.waitForTimeout(wait); };
const into = async (page, sel, wait = 400) => { await page.evaluate((sel) => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector(sel).scrollIntoView({ block: 'center' }); }, sel); await page.waitForTimeout(wait); };

(async () => {
  let srv = null, SITE = process.env.SITE_URL;
  if (!SITE) {
    if (!fs.existsSync(path.join(OUT, 'index.html'))) { console.error('a11y-motion: no static export in out/. Run: npm run export (or set SITE_URL)'); process.exit(2); }
    srv = await serve(); SITE = 'http://127.0.0.1:' + srv.address().port;
  }
  const browser = await chromium.launch();

  // ---------- 1. the inventory, motion on (1440 × 900, a mouse) ----------
  section('1. Motion inventory (1440 × 900, motion on)');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(SITE, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  ok(await changes(p, '.hero-disc', 'transform'), 'hero: the disc drifts on its own (the glow drift)');
  await p.mouse.move(200, 600); await p.waitForTimeout(900); const d1 = await style(p, '.hero-disc', 'transform');
  await p.mouse.move(1240, 600); await p.waitForTimeout(1200); const d2 = await style(p, '.hero-disc', 'transform');
  const dx = (s) => +(s.match(/matrix\(([^)]+)\)/) || [0, '0,0,0,0,0'])[1].split(',')[4];
  ok(dx(d2) - dx(d1) > 200, `hero: the disc eases toward the cursor (x ${Math.round(dx(d1))} → ${Math.round(dx(d2))} px)`);
  const lit = await p.evaluate(() => [...document.querySelectorAll('.hero-wordmark span')].map((s) => s.className).join(','));
  await p.mouse.move(200, 600); await p.waitForTimeout(1500);
  const lit2 = await p.evaluate(() => [...document.querySelectorAll('.hero-wordmark span')].map((s) => s.className).join(','));
  ok(/lit-0/.test(lit) && lit !== lit2, 'hero: the wordmark lights the letters nearest the disc, in solid steps, and they follow it (the gradient wordmark)');
  await p.mouse.move(5, 5);
  await go(p, 'statement', 300);
  ok(await running(p, '.st-band') === 3, 'statement: three surface bands drift (16 s / 20 s / 12 s)');
  await p.evaluate(() => window.scrollBy(0, 300)); await p.waitForTimeout(400);
  const words = await p.evaluate(() => [document.querySelectorAll('.reveal span.lit').length, document.querySelectorAll('.reveal span').length]);
  ok(words[0] > 0, `statement: word-by-word reveal (${words[0]}/${words[1]} lit)`);
  await go(p, 'tonight');
  ok(await running(p, '.hop .vshape', 'ts-hop') === 3, 'tonight: the three verdict shapes hop, 160 ms apart (the hop pill)');
  ok(await changes(p, '.roll-track', 'transform', 2300), 'tonight: the rolling word rolls every 2 s');
  const card = p.locator('.tcard').first(); const t0 = await card.evaluate((e) => getComputedStyle(e).transform); await card.hover(); await p.waitForTimeout(450);
  ok(t0 !== await card.evaluate((e) => getComputedStyle(e).transform), 'tonight: a card lifts on hover');
  await p.mouse.move(5, 5);
  await go(p, 'languages');
  ok(await running(p, '.lang-bid span[class^="pan"]') >= 3, 'languages: one brand letter travels through "Bid" (the photo pan)');
  ok(await running(p, '.sweep-w', 'ts-sweep-word') > 5, 'languages: one brand word sweeps the sentence (the light sweep)');
  await go(p, 'how', 400);
  const n1 = +(await p.locator('.counter-num').innerText()); await p.waitForTimeout(900); const n2 = +(await p.locator('.counter-num').innerText());
  const off = +(await style(p, '.ring-fill', 'strokeDashoffset')).replace('px', '');
  ok(n2 > n1 && off < 591, `how it works: 0 → 777 count-up (${n1} → ${n2}) with the ring filling (offset ${Math.round(off)} of 591)`);
  const spot = async (x, y) => p.evaluate(([x, y]) => { const c = document.querySelector('.how-spot'), r = c.getBoundingClientRect(), k = c.width / r.width; const ctx = c.getContext('2d'); let hit = null; for (let dy = -14; dy <= 14 && !hit; dy++) for (let dx = -14; dx <= 14 && !hit; dx++) { const d = ctx.getImageData(Math.round((x - r.left + dx) * k), Math.round((y - r.top + dy) * k), 1, 1).data; if (d[3]) hit = [d[0], d[1], d[2]]; } return hit; }, [x, y]);
  await p.mouse.move(1100, 450); await p.waitForTimeout(250);
  const near = await spot(1100, 450), far = await spot(200, 860);
  ok(!!near && !!far && near[2] > 200 && far[2] < 60, `how it works: the dots by the cursor light up brand, the rest stay surface (the spotlight; near ${near}, far ${far})`);
  ok((await p.locator('.step-bars span.on').count()) === 1 && (await p.locator('.how-orb').getAttribute('class')).includes('orb-0'), 'how it works: step 1 → one step bar lit, the disc in its step-1 place');
  await p.evaluate(() => document.querySelectorAll('.how-step')[2].scrollIntoView({ block: 'center' })); await p.waitForTimeout(900);
  ok((await p.locator('.step-bars span.on').count()) === 3 && (await p.locator('.how-orb').getAttribute('class')).includes('orb-2'), 'how it works: step 3 → three bars lit, the disc moved and resized (the orb, 800 ms), the visual crossfaded');
  ok((await style(p, '.how-step:not(.active) .step-title', 'color')) !== (await style(p, '.how-step.active .step-title', 'color')), 'how it works: inactive steps are muted, the active one ink (the step blur, as colour)');
  await into(p, '.track-folders');
  const fp = p.locator('.folder').first(); const top0 = await fp.locator('.folder-panel').evaluate((e) => getComputedStyle(e).top); await fp.hover(); await p.waitForTimeout(650);
  ok(top0 !== await fp.locator('.folder-panel').evaluate((e) => getComputedStyle(e).top), 'built for: the card lifts and its panel slides down (the fold)');
  await p.mouse.move(5, 5);
  await go(p, 'app');
  const th0 = await style(p, '.ptab-thumb', 'left'); await p.locator('#dock-tab-2').click(); await p.waitForTimeout(600);
  ok(th0 !== await style(p, '.ptab-thumb', 'left'), 'phone: the brand block slides to the active tab (the dock pill)');
  const wipe0 = await style(p, '.pbtn-skip .fx-fill', 'transform'); await p.locator('.pbtn-skip').hover(); await p.waitForTimeout(550);
  ok(wipe0 !== await style(p, '.pbtn-skip .fx-fill', 'transform'), 'phone: Skip wipes in on hover (the wipe)');
  const rad0 = await style(p, '.pbtn-save .fx-fill', 'clipPath'); await p.locator('.pbtn-save').hover(); await p.waitForTimeout(650);
  ok(rad0 !== await style(p, '.pbtn-save .fx-fill', 'clipPath'), 'phone: Save to Bids fills from the pointer (the radial fill)');
  await p.locator('button.pswitch').first().click(); await p.waitForTimeout(160);
  const mid = +(await p.locator('.pblock .counter-val').innerText()); await p.waitForTimeout(800);
  ok(mid > 25 && mid < 90 && (await p.locator('.pblock').getAttribute('aria-label')).includes('Maybe, score 90'), `phone: ISO 27001 → Hohenau No-go 25 → Maybe 90, counting up (mid ${mid})`);
  await p.locator('.meet-btn').click(); await p.waitForTimeout(800);
  ok((await p.locator('.pblock').getAttribute('aria-label')).includes('Go, score 100'), 'phone: "We meet it" → Go 100');
  await go(p, 'sectors');
  const g0 = await style(p, '.strip:nth-child(4)', 'flexGrow'); await p.locator('.strip').nth(3).hover(); await p.waitForTimeout(900);
  ok(g0 !== await style(p, '.strip:nth-child(4)', 'flexGrow'), 'sectors: the hovered strip widens and shows its line (the accordion)');
  await p.mouse.move(5, 5); await into(p, '.marq', 500);
  const mq = await running(p, '.marq-row', 'ts-marq');
  ok(mq === 2, `sectors: two rows of all 45 divisions drift in opposite directions (the marquee; ${mq} running)`);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  ok(await running(p, '.marq-row', 'ts-marq') === 0, 'sectors: the marquee pauses off-screen');
  await go(p, 'where', 300);
  await p.waitForSelector('.map-svg .pin', { timeout: 10000 }); await p.waitForTimeout(1600);
  const mh = await p.evaluate(() => [document.querySelector('.map-svg').getBoundingClientRect().height, document.querySelectorAll('.map-svg .pin').length]);
  ok(mh[0] > 300 && mh[1] === 6, `map: loads near the viewport, fills its frame (${Math.round(mh[0])} px tall) and shows the six buyer pins`);
  ok((await style(p, '.map-land', 'fill')) !== (await style(p, '.map-svg path:not(.map-land):not(.arc)', 'fill')), 'map: the countries you bid in have filled in');
  ok(await running(p, '.arc', 'ts-flow') === 6, 'map: six dashed arcs flow out from Leipzig');
  ok(await running(p, '.pulse', 'ts-pulse') === 1, 'map: the home pulse');
  const at = await p.evaluate(() => { const t = [...document.querySelectorAll('.map-svg text.map-cc')].find((x) => x.textContent === 'AT'); const r = t.getBoundingClientRect(); return [r.left + 2, r.left + r.width / 2, r.right - 2].every((x) => { const e = document.elementFromPoint(x, r.top + r.height / 2); return e === t || (e && e.classList && e.classList.contains('arc')); }); });
  ok(at, 'map: the AT code is not covered by a pin or its label');
  await p.locator('.pin').nth(1).hover(); await p.waitForTimeout(250);
  ok((await p.locator('.map-tip').count()) === 1 && (await p.locator('.map-tip').innerText()).includes('IT security audit'), 'map: hovering a pin shows its tooltip');
  ok((await style(p, '.map-tip', 'borderTopWidth')) === '0px' && (await style(p, '.map-tip', 'boxShadow')) === 'none', 'map: the tooltip is a plain block, no border, no shadow');
  await p.mouse.move(5, 5); await p.waitForTimeout(200);
  ok((await p.locator('.map-tip').count()) === 0, 'map: the tooltip goes when the pointer leaves');
  ok((await counts(p)) === '1 Go 2 Maybe 3 No-go', 'map: counts before the switch (' + (await counts(p)) + ')');
  const pinV = () => p.locator('.pin').evaluateAll((ps) => ps.map((x) => x.getAttribute('aria-label').split('.')[0]));
  const before = await pinV(); const flex0 = await style(p, '.map-count.v-maybe', 'flexGrow');
  await p.locator('.map-row').click(); await p.waitForTimeout(900);
  const after = await pinV();
  ok((await counts(p)) === '1 Go 1 Maybe 4 No-go', 'map: cross-border off re-scores with the decision rules to 1 · 1 · 4 (' + (await counts(p)) + ')');
  const flipped = before.filter((b, i) => b !== after[i]);
  ok(flipped.length === 1 && flipped[0].startsWith('Valdemora'), 'map: only Valdemora flips (' + flipped.join(' / ') + ' → ' + after.filter((a, i) => a !== before[i]).join(' / ') + ')');
  ok(flex0 !== await style(p, '.map-count.v-maybe', 'flexGrow'), 'map: the count tiles re-flex');
  await p.locator('.map-row').click(); await p.waitForTimeout(900);
  ok((await counts(p)) === '1 Go 2 Maybe 3 No-go', 'map: switching back restores 1 · 2 · 3');
  await go(p, 'film');
  ok(await running(p, '.poster-ping rect', 'ts-ping') === 1, 'film: the play square pings every 2.2 s');
  const z0 = await style(p, '.poster-photo img', 'transform'), b0 = await style(p, '.poster-bar > div', 'width');
  await p.locator('a.poster').hover(); await p.waitForTimeout(700);
  ok(z0 !== await style(p, '.poster-photo img', 'transform') && b0 !== await style(p, '.poster-bar > div', 'width'), 'film: hover zooms the photo, grows the play square and fills the bar');
  const w0 = await style(p, '#film .fx-wave .fx-fill', 'clipPath'); await p.locator('#film .fx-wave').hover(); await p.waitForTimeout(400);
  ok(w0 !== await style(p, '#film .fx-wave .fx-fill', 'clipPath'), 'film: "Watch the film" fills from below (the wave)');
  await p.mouse.move(5, 5);
  await go(p, 'faq');
  const r0 = await style(p, '.faq-plus', 'transform'); await p.locator('.faq-q').first().click(); await p.waitForTimeout(500);
  ok(r0 !== await style(p, '.faq-plus', 'transform'), 'questions: the + turns as the answer folds');
  await go(p, 'start');
  ok(await running(p, '.metal-spin', 'ts-spin') === 1, 'start: the arc turns around the arrow (the metal ring)');
  ok(await running(p, '.start-disc', 'ts-d3') === 1, 'start: the disc drifts behind the section (the glow)');
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  const hw = await style(p, '.header-cta .fx-fill', 'clipPath'); await p.locator('.header-cta').hover(); await p.waitForTimeout(400);
  ok(hw !== await style(p, '.header-cta .fx-fill', 'clipPath'), 'header: "Try the prototype" fills from below (the wave)');
  const m0 = await p.locator('#site-menu').evaluate((e) => getComputedStyle(e).transform); await p.locator('.menu-btn').click(); await p.waitForTimeout(300);
  ok(m0 !== await p.locator('#site-menu').evaluate((e) => getComputedStyle(e).transform), 'menu: slides down (750 ms)');
  await p.waitForTimeout(600); await p.locator('.menu-link').nth(1).hover(); await p.waitForTimeout(350);
  ok((await p.locator('.menu-link').nth(1).locator('.menu-arrow').evaluate((e) => getComputedStyle(e).opacity)) === '1', 'menu: a hovered link moves right and shows its arrow');
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  ok(errors.length === 0, 'no console or page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await ctx.close();

  // ---------- 2. reduced motion: everything settles at once, nothing loops ----------
  section('2. Reduced motion (1280 × 900 and 390 × 844)');
  const rc = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const r = await rc.newPage(); await r.goto(SITE, { waitUntil: 'networkidle' }); await r.waitForTimeout(400);
  ok(!(await changes(r, '.hero-disc', 'transform', 500)), 'reduced motion: the hero disc and the lit letters stand still');
  for (const id of ['statement', 'tonight', 'languages', 'how', 'who', 'app', 'sectors', 'where', 'film', 'start']) await go(r, id, id === 'where' ? 1200 : 250);
  const live = await r.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && (a.effect.getComputedTiming().duration || 0) > 0).map((a) => a.animationName || a.transitionProperty || 'waapi'));
  ok(live.length === 0, 'reduced motion: no running animation anywhere after a full scroll (' + (live.join(', ') || 'none') + ')');
  ok(await r.evaluate(() => !document.querySelector('.map-svg .pulse')), 'reduced motion: no home pulse');
  ok((await r.locator('.map-svg .pin').count()) === 6 && (await style(r, '.map-land', 'fill')) !== 'rgb(2, 4, 10)', 'reduced motion: the map is lit at once, the pins are there');
  await go(r, 'how', 300);
  ok((await r.locator('.counter-num').innerText()) === '777' && /^0(px)?$/.test(await style(r, '.ring-fill', 'strokeDashoffset')), 'reduced motion: 777 and a full ring at once');
  await go(r, 'statement', 200);
  const lit3 = await r.evaluate(() => [document.querySelectorAll('.reveal span.lit').length, document.querySelectorAll('.reveal span').length]);
  ok(lit3[0] === lit3[1], `reduced motion: the statement fully lit at once (${lit3[0]}/${lit3[1]})`);
  const sw = await r.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(sw[0] === sw[1], `reduced motion: no horizontal scroll at 1280 px (the still marquee stays in its row: ${sw[0]} / ${sw[1]})`);
  await rc.close();
  const rm = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const pm = await rm.newPage(); await pm.goto(SITE, { waitUntil: 'networkidle' });
  const swm = await pm.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(swm[0] === swm[1], `reduced motion: no horizontal scroll at 390 px (${swm[0]} / ${swm[1]})`);
  await rm.close();

  // ---------- 3. keyboard ----------
  section('3. Keyboard (1280 × 900)');
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(SITE, { waitUntil: 'networkidle' });
  await p2.focus('.menu-btn'); await p2.keyboard.press('Enter'); await p2.waitForTimeout(900);
  ok(await p2.evaluate(() => document.activeElement?.classList.contains('menu-close')), 'menu: focus moves to Close');
  for (let i = 0; i < 9; i++) await p2.keyboard.press('Tab');
  ok(await p2.evaluate(() => !!document.activeElement?.closest('#site-menu')), 'menu: Tab stays inside the dialog');
  await p2.keyboard.press('Escape'); await p2.waitForTimeout(850);
  ok(await p2.evaluate(() => document.activeElement?.classList.contains('menu-btn')), 'menu: Escape returns focus to the Menu button');
  await go(p2, 'app', 300);
  await p2.focus('[role="tab"][aria-selected="true"]'); await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(100);
  ok((await p2.locator('[role="tab"][aria-selected="true"]').innerText()).includes('Company'), 'phone tabs: ArrowRight moves to Company');
  const tabs = await p2.locator('.ptabs [role="tab"]').evaluateAll((ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return [t.innerText.replace(/^\S+\s*/, '').trim(), Math.round(r.width), Math.round(r.height)]; }));
  ok(tabs.length === 5 && tabs.map((t) => t[0]).join(' ') === 'Feed Bids Company Profile Settings', 'phone tabs: the app\'s five tabs (' + tabs.map((t) => t[0]).join(' · ') + ')');
  ok(tabs.every((t) => t[1] >= 44 && t[2] >= 44), 'phone tabs: every tab at least 44 × 44 px (' + tabs.map((t) => t[1] + '×' + t[2]).join(' ') + ')');
  await p2.locator('#dock-tab-0').click(); await p2.locator('#dock-tab-0').focus(); await p2.keyboard.press('ArrowLeft'); await p2.waitForTimeout(100);
  ok((await p2.evaluate(() => document.activeElement && document.activeElement.id)) === 'dock-tab-4', 'phone tabs: ArrowLeft from Feed wraps to Settings');
  await p2.locator('#dock-tab-1').click(); await p2.waitForTimeout(200);
  ok((await p2.locator('.pwl').innerText()).replace(/\s+/g, ' ').includes('8 of 21 won · 38% in the last 12 months'), 'phone Bids: the app\'s Win/loss row');
  await p2.locator('#dock-tab-2').click(); await p2.waitForTimeout(200);
  await p2.locator('button.pswitch').first().focus(); await p2.keyboard.press('Space'); await p2.waitForTimeout(800);
  ok((await p2.locator('.pblock').getAttribute('aria-label') || '').includes('Maybe, score 90'), 'phone: ISO 27001 by keyboard → Landkreis Hohenau: Maybe 90');
  await p2.locator('.meet-btn').focus(); await p2.keyboard.press('Enter'); await p2.waitForTimeout(800);
  ok((await p2.locator('.pblock').getAttribute('aria-label') || '').includes('Go, score 100'), 'phone: "We meet it" → Go 100');
  await p2.locator('#dock-tab-3').click(); await p2.waitForTimeout(200);
  ok((await p2.locator('.pkv').innerText()).includes('ISO 9001, ISO 27001'), 'phone Profile: shows ISO 27001 after the Company switch');
  await p2.locator('.pfull').focus(); await p2.keyboard.press('Enter'); await p2.waitForTimeout(200);
  ok((await p2.evaluate(() => document.activeElement && document.activeElement.id)) === 'dock-tab-2', 'phone Profile: "Edit on Company" opens Company and focus moves with it');
  await go(p2, 'where', 300); await p2.waitForSelector('.map-svg .pin', { timeout: 10000 }); await p2.waitForTimeout(1500);
  await p2.locator('.pin').first().focus(); await p2.waitForTimeout(150);
  ok((await p2.locator('.map-tip').count()) === 1, 'map: a focused pin shows its tooltip');
  await p2.keyboard.press('Enter'); await p2.locator('.map-row').focus(); await p2.waitForTimeout(150);
  ok((await p2.locator('.map-tip').count()) === 1 && (await p2.locator('.map-tip').innerText()).includes('Structured cabling'), 'map: Enter holds a pin\'s tooltip after focus leaves the map');
  await p2.keyboard.press('Escape'); await p2.waitForTimeout(150);
  ok((await p2.locator('.map-tip').count()) === 0, 'map: Escape closes the held tooltip');
  await p2.locator('.map-row').focus(); await p2.keyboard.press('Space'); await p2.waitForTimeout(500);
  ok((await counts(p2)) === '1 Go 1 Maybe 4 No-go', 'map: the switch works by keyboard');
  await ctx2.close();

  // ---------- 4. touch (a phone) ----------
  section('4. Touch (390 × 844, a touch screen)');
  const tc = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const t = await tc.newPage(); await t.goto(SITE, { waitUntil: 'networkidle' });
  await go(t, 'where', 300); await t.waitForSelector('.map-svg .pin', { timeout: 10000 }); await t.waitForTimeout(1500);
  const pinBox = await t.locator('.pin').nth(1).boundingBox();
  await t.touchscreen.tap(pinBox.x + pinBox.width / 2, pinBox.y + pinBox.height / 2); await t.waitForTimeout(300);
  ok((await t.locator('.map-tip').count()) === 1 && (await t.locator('.map-tip').innerText()).includes('IT security audit'), 'map: a tap on a pin opens its tooltip, which stays');
  ok(pinBox.width >= 44 && pinBox.height >= 44, `map: each pin is a ${Math.round(pinBox.width)} × ${Math.round(pinBox.height)} px target`);
  const fr = await t.locator('.map-frame').boundingBox();
  await t.touchscreen.tap(fr.x + 12, fr.y + fr.height - 12); await t.waitForTimeout(300);
  ok((await t.locator('.map-tip').count()) === 0, 'map: a tap elsewhere on the map closes it');
  await t.locator('.map-row').tap(); await t.waitForTimeout(600);
  ok((await counts(t)) === '1 Go 1 Maybe 4 No-go', 'map: the switch works by tap');
  ok(await t.evaluate(() => [...document.querySelectorAll('.map-count')].every((e) => e.scrollWidth <= e.clientWidth + 1)), 'map: every count tile fits its word');
  await go(t, 'sectors', 300); await t.locator('.strip').nth(2).tap(); await t.waitForTimeout(900);
  ok((await t.locator('.strip').nth(2).getAttribute('class')).includes('active'), 'sectors: a tap opens a strip');
  await go(t, 'app', 300); await t.locator('#dock-tab-4').tap(); await t.waitForTimeout(500);
  ok((await t.locator('#dock-tab-4').getAttribute('aria-selected')) === 'true', 'phone tabs: a tap switches the tab');
  const sw4 = await t.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(sw4[0] === sw4[1], `no horizontal scroll at 390 px (${sw4[0]} / ${sw4[1]})`);
  await tc.close();

  await browser.close();
  if (srv) srv.close();
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'Site motion inventory, reduced motion, keyboard and touch checks passed'));
  process.exitCode = failures ? 1 : 0;
})();
