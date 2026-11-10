// site/scripts/a11y-motion.cjs — the website's motion inventory, reduced motion, keyboard and touch (dev-only; Playwright
// is pre-installed). Part of `npm run audit`.
//   node scripts/a11y-motion.cjs                          serves the static export in out/ itself
//   SITE_URL=http://localhost:3100 node scripts/a11y-motion.cjs   (or test a running server)
// Pass 5 (7 Nov 2026, CLAUDE.md §11): one check per item of the original 3 Nov site's motion inventory (docs/reports/
// 2026-11-07-pass-5.md → "Website", and docs/adr/0004 → appendix): each runs with motion on, settles at once and stops looping under reduced motion,
// and the interactive ones work by keyboard and by touch. Plus the earlier checks: the lazy map, the exact map counts,
// the AT code, and the phone's five tabs. After the adversarial review: every helper fails on a missing element, the
// landing page gets the rendered declutter scan at 1440 and 390, and the map's targets, codes and tooltips are measured
// at 320 and 390 too.
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
// style() and changes() throw when the selector matches nothing, so a renamed element fails its check instead of passing on null
const changes = (page, sel, prop, ms = 700) => page.evaluate(([sel, prop, ms]) => new Promise((r, no) => { const el = document.querySelector(sel); if (!el) return no(new Error('no element for ' + sel)); const get = () => (prop === 'class' ? el.className.baseVal ?? el.className : prop === 'text' ? el.textContent : getComputedStyle(el)[prop]); const a = get(); setTimeout(() => r(a !== get()), ms); }), [sel, prop, ms]);
const style = (page, sel, prop) => page.evaluate(([sel, prop]) => { const el = document.querySelector(sel); if (!el) throw new Error('no element for ' + sel); return getComputedStyle(el)[prop]; }, [sel, prop]);
// The phone is the real app in an iframe since pass 8 (PhoneDemo): drive it through its Frame, as tests/smoke.js drives the app.
const phoneFrame = async (page) => {
  await page.waitForFunction(() => { const f = document.querySelector('.phone-app'); return !!(f && f.contentDocument && f.contentDocument.querySelector('.feed-list')); }, null, { timeout: 15000 });
  return (await page.$('.phone-app')).contentFrame();
};
const sheetIs = (f, open) => f.waitForFunction((o) => !!document.querySelector('#sheet-root.open') === o, open).then(() => f.waitForTimeout(400));
// The demo path inside the phone (BRIEF.md steps 4–5): Hohenau's unclear line answered "We meet it", then ISO 27001 on Company.
const hohenauPath = async (f, keyboard) => {
  await f.click('a.tcard[href="#/t/hoh-security"]'); await f.waitForSelector('.vhead.v-nogo', { timeout: 10000 });
  await f.click('a.req[href="#/t/hoh-security/req/r3"]'); await sheetIs(f, true);
  if (keyboard) { await f.focus('.sheet button[data-confirm="pass"]'); await f.page().keyboard.press('Enter'); } else await f.click('.sheet button[data-confirm="pass"]');
  await sheetIs(f, false);
  await f.click('button[data-act="back"]'); await f.waitForSelector('.feed-list');
  await f.click('.tabbar a[href="#/company"]'); await f.waitForSelector('.co-head');
};
const scan = require('../../tests/declutter-scan.js');
const declutter = async (page, label) => { const found = await scan.scanDom(page); ok(found.length === 0, label + ': none of the 18 declutter patterns in the rendered page' + (found.length ? '\n       ' + found.map((x) => x.pattern + ' · ' + x.el + (x.extra ? ' · ' + x.extra : '') + (x.text ? ' · "' + x.text + '"' : '')).join('\n       ') : '')); };
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
  ok(await running(p, '.st-band') === 2, 'statement: two surface discs drift (16 s / 20 s, the original glows)');
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
  const orbA = await style(p, '.how-orb', 'transform');
  await p.evaluate(() => document.querySelectorAll('.how-step')[2].scrollIntoView({ block: 'center' })); await p.waitForTimeout(1000);
  const orbB = await style(p, '.how-orb', 'transform'), vis = await p.locator('.how-vis').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
  ok((await p.locator('.step-bars span.on').count()) === 3 && orbA !== orbB && /matrix/.test(orbB) && vis.join(',') === '0,0,1,0', `how it works: step 3 → three bars lit, the disc moved and resized (${orbA} → ${orbB}), only the third visual shown (opacities ${vis.join(',')})`);
  const orb0 = await style(p, '.how-orb', 'transform');
  ok((await style(p, '.how-step:not(.active) .step-title', 'color')) !== (await style(p, '.how-step.active .step-title', 'color')), 'how it works: inactive steps are muted, the active one ink (the step blur, as colour)');
  await into(p, '.track-folders');
  const fp = p.locator('.folder').first(); const top0 = await fp.locator('.folder-panel').evaluate((e) => getComputedStyle(e).top); await fp.hover(); await p.waitForTimeout(650);
  ok(top0 !== await fp.locator('.folder-panel').evaluate((e) => getComputedStyle(e).top), 'built for: the card lifts and its panel slides down (the fold)');
  await p.mouse.move(5, 5);
  await go(p, 'app', 800);
  const pf1 = await phoneFrame(p);
  ok((await pf1.locator('.screen').innerText()).replace(/\s+/g, ' ').includes('6 new tenders'), 'phone: the real app opens on its Feed, onboarded ("6 new tenders")');
  await hohenauPath(pf1, false);
  await pf1.click('button[data-cert="ISO 27001"]'); await pf1.waitForSelector('.rescore[data-rescore]'); await p.waitForTimeout(520);
  const mid = +(await pf1.locator('#rescore .rescore-score .to').innerText()); await p.waitForTimeout(1400);
  const rescoreCard = (await pf1.locator('#rescore').innerText()).replace(/\s+/g, ' ');
  ok(mid >= 25 && mid < 100 && rescoreCard.includes('25 → 100') && rescoreCard.includes('No-go → Go'), `phone: "We meet it", then ISO 27001 → Landkreis Hohenau No-go 25 → Go 100 on the app's re-score card, counting up (mid ${mid})`);
  await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); // keys go to the page again, not the app in the frame
  await go(p, 'sectors');
  const g0 = await style(p, '.strip:nth-child(4)', 'flexGrow'); await p.locator('.strip').nth(3).hover(); await p.waitForTimeout(900);
  ok(g0 !== await style(p, '.strip:nth-child(4)', 'flexGrow'), 'sectors: the hovered strip widens and shows its line (the accordion)');
  await p.mouse.move(5, 5); await into(p, '.marq', 500);
  const mq = await running(p, '.marq-row', 'ts-marq');
  ok(mq === 2, `sectors: two rows of all 45 divisions drift in opposite directions (the marquee; ${mq} running)`);
  await p.locator('.marq-row-1').hover({ force: true }); await p.waitForTimeout(200);
  ok(await running(p, '.marq-row-1', 'ts-marq') === 0 && await running(p, '.marq-row-2', 'ts-marq') === 1, 'sectors: the hovered row pauses, the other keeps moving');
  await p.mouse.move(5, 5);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  ok(await running(p, '.marq-row', 'ts-marq') === 0, 'sectors: the marquee pauses off-screen');
  await go(p, 'where', 0);
  await p.waitForSelector('.map-svg .map-land', { timeout: 10000 });
  const fillAt = () => p.evaluate(() => [...document.querySelectorAll('.map-land')].map((e) => getComputedStyle(e).fill));
  const mf1 = await fillAt(); await p.waitForTimeout(350); const mf2 = await fillAt(); await p.waitForTimeout(1600); const f3 = await fillAt();
  ok(new Set(mf2).size > 1 && new Set(f3).size === 1, 'map: the countries fill in one after another on arrival (mixed at 350 ms, all lit by 2 s)');
  await p.waitForSelector('.map-svg .pin', { timeout: 10000 });
  const mh = await p.evaluate(() => [document.querySelector('.map-svg').getBoundingClientRect().height, document.querySelectorAll('.map-svg .pin').length]);
  ok(mh[0] > 300 && mh[1] === 6, `map: loads near the viewport, fills its frame (${Math.round(mh[0])} px tall) and shows the six buyer pins`);
  ok((await style(p, '.map-land', 'fill')) !== (await style(p, '.map-svg path:not(.map-land):not(.arc)', 'fill')), 'map: the countries you bid in have filled in');
  ok(await running(p, '.arc', 'ts-flow') === 6, 'map: six dashed arcs flow out from Leipzig');
  ok(await running(p, '.pulse', 'ts-pulse') === 1, 'map: the home pulse');
  const at = await p.evaluate(() => { const t = [...document.querySelectorAll('.map-svg text.map-cc')].find((x) => x.textContent === 'AT'); const r = t.getBoundingClientRect(); return [r.left + 2, r.left + r.width / 2, r.right - 2].every((x) => { const e = document.elementFromPoint(x, r.top + r.height / 2); return e === t || (e && e.classList && e.classList.contains('arc')); }); });
  ok(at, 'map: the AT code is not covered by a pin or its label');
  const codesClear = await p.evaluate(() => { const shapes = [...document.querySelectorAll('.pin-shape')].map((s) => s.getBoundingClientRect()); return [...document.querySelectorAll('.map-cc')].filter((t) => { const r = t.getBoundingClientRect(); return shapes.some((s) => r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top); }).map((t) => t.textContent); });
  ok(codesClear.length === 0, 'map: no country code overlaps a pin shape at 1440 (' + (codesClear.join(', ') || 'none') + ')');
  await p.locator('.pin').nth(1).locator('.pin-shape').hover(); await p.waitForTimeout(250);
  ok((await p.locator('.map-tip').count()) === 1 && (await p.locator('.map-tip').innerText()).includes('IT security audit'), 'map: hovering a pin shows its tooltip');
  ok((await style(p, '.map-tip', 'borderTopWidth')) === '0px' && (await style(p, '.map-tip', 'boxShadow')) === 'none', 'map: the tooltip is a plain block, no border, no shadow');
  const tipBox = await p.locator('.map-tip').boundingBox();
  await p.mouse.move(tipBox.x + tipBox.width / 2, tipBox.y + tipBox.height / 2, { steps: 4 }); await p.waitForTimeout(400);
  ok((await p.locator('.map-tip').count()) === 1, 'map: the tooltip stays while the pointer moves onto it (WCAG 1.4.13)');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok((await p.locator('.map-tip').count()) === 0, 'map: Escape dismisses a hovered tooltip');
  await p.mouse.move(5, 5); await p.waitForTimeout(250);
  await p.locator('.pin').nth(1).locator('.pin-shape').hover(); await p.waitForTimeout(250); await p.mouse.move(5, 5); await p.waitForTimeout(300);
  ok((await p.locator('.map-tip').count()) === 0, 'map: the tooltip goes when the pointer leaves');
  ok((await counts(p)) === '1 Go 2 Maybe 3 No-go', 'map: counts before the switch (' + (await counts(p)) + ')');
  const pinV = () => p.locator('.pin').evaluateAll((ps) => ps.map((x) => x.getAttribute('aria-label').split('.')[0]));
  const before = await pinV(); const flex0 = await style(p, '.map-count.v-maybe', 'flexGrow');
  await p.locator('.map-row').click(); await p.waitForTimeout(120);
  const midCount = await p.evaluate(() => [...document.querySelectorAll('.map-count .counter-val')].map((e) => e.textContent).join(','));
  await p.waitForTimeout(800);
  const after = await pinV();
  ok((await counts(p)) === '1 Go 1 Maybe 4 No-go', 'map: cross-border off re-scores with the decision rules to 1 · 1 · 4 (' + (await counts(p)) + ')');
  const flipped = before.filter((b, i) => b !== after[i]);
  ok(flipped.length === 1 && flipped[0].startsWith('Valdemora'), 'map: only Valdemora flips (' + flipped.join(' / ') + ' → ' + after.filter((a, i) => a !== before[i]).join(' / ') + ')');
  ok(flex0 !== await style(p, '.map-count.v-maybe', 'flexGrow'), 'map: the count tiles re-flex (mid-switch counts ' + midCount + ')');
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
  await p.locator('#start input').fill('not a site'); await p.locator('#start input').press('Tab'); await p.waitForTimeout(400);
  const dim = await p.evaluate(() => { const b = document.querySelector('#start .btn'); const cs = getComputedStyle(b); return [b.className.includes('is-dim'), cs.backgroundColor, cs.color, document.activeElement === b]; });
  ok(dim[0] && dim[3] && dim[1] === 'rgb(11, 17, 28)' && dim[2] === 'rgb(138, 147, 163)', 'start: a dim "Draft my profile" stays muted on surface when focused (no fill: ' + dim[1] + ' / ' + dim[2] + ')');
  await p.locator('#start input').fill('nordlicht-netzwerk.example');
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  const hw = await style(p, '.header-cta .fx-fill', 'clipPath'); await p.locator('.header-cta').hover(); await p.waitForTimeout(400);
  ok(hw !== await style(p, '.header-cta .fx-fill', 'clipPath'), 'header: "Try the prototype" fills from below (the wave)');
  const m0 = await p.locator('#site-menu').evaluate((e) => getComputedStyle(e).transform); await p.locator('.menu-btn').click(); await p.waitForTimeout(300);
  ok(m0 !== await p.locator('#site-menu').evaluate((e) => getComputedStyle(e).transform), 'menu: slides down (750 ms)');
  await p.waitForTimeout(600); await p.locator('.menu-link').nth(1).hover(); await p.waitForTimeout(350);
  ok((await p.locator('.menu-link').nth(1).locator('.menu-arrow').evaluate((e) => getComputedStyle(e).opacity)) === '1', 'menu: a hovered link moves right and shows its arrow');
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  await declutter(p, '1440 px, landing page after the full scroll');
  ok(errors.length === 0, 'no console or page errors' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await ctx.close();

  // ---------- 2. reduced motion: everything settles at once, nothing loops ----------
  section('2. Reduced motion (1280 × 900 and 390 × 844)');
  const rc = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const r = await rc.newPage(); await r.goto(SITE, { waitUntil: 'networkidle' }); await r.waitForTimeout(400);
  ok(!(await changes(r, '.hero-disc', 'transform', 500)) && !(await r.evaluate(() => new Promise((res) => { const c = () => [...document.querySelectorAll('.hero-wordmark span')].map((s) => s.className).join(','); const a = c(); setTimeout(() => res(a !== c() || !/lit-0/.test(a)), 600); }))), 'reduced motion: the hero disc and the lit letters stand still (lit around the centre)');
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
  await go(p2, 'app', 800);
  const pf2 = await phoneFrame(p2);
  const tabs = await pf2.locator('.tabbar a').evaluateAll((ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return [t.innerText.replace(/^\S+\s*/, '').trim(), Math.round(r.width), Math.round(r.height)]; }));
  ok(tabs.length === 5 && tabs.map((t) => t[0]).join(' ') === 'Feed Bids Company Profile Settings', 'phone tabs: the app\'s five tabs (' + tabs.map((t) => t[0]).join(' · ') + ')');
  ok(tabs.every((t) => t[1] >= 44 && t[2] >= 44), 'phone tabs: every tab at least 44 × 44 px, at the app\'s own size (' + tabs.map((t) => t[1] + '×' + t[2]).join(' ') + ')');
  await pf2.focus('.tabbar a[href="#/bids"]'); await p2.keyboard.press('Enter'); await pf2.waitForSelector('.bids-head');
  ok((await pf2.locator('.screen').innerText()).replace(/\s+/g, ' ').includes('8 of 21 won · 38% in the last 12 months'), 'phone Bids, by keyboard: the app\'s Win/loss row');
  await pf2.focus('.tabbar a[href="#/feed"]'); await p2.keyboard.press('Enter'); await pf2.waitForSelector('.feed-list');
  await hohenauPath(pf2, true);
  await pf2.focus('button[data-cert="ISO 27001"]'); await p2.keyboard.press('Space'); await pf2.waitForSelector('.rescore[data-rescore]'); await p2.waitForTimeout(1500);
  ok((await pf2.locator('#rescore').innerText()).replace(/\s+/g, ' ').includes('25 → 100'), 'phone, by keyboard: "We meet it", then ISO 27001 → Landkreis Hohenau 25 → 100');
  await pf2.focus('.tabbar a[href="#/profile"]'); await p2.keyboard.press('Enter'); await p2.waitForTimeout(400);
  ok((await pf2.locator('.screen').innerText()).includes('ISO 27001'), 'phone Profile: shows ISO 27001 after the Company switch');
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
  const pinBox = await t.locator('.pin').nth(1).boundingBox(), pinShape = await t.locator('.pin').nth(1).locator('.pin-shape').boundingBox();
  await t.touchscreen.tap(pinShape.x + pinShape.width / 2, pinShape.y + pinShape.height / 2); await t.waitForTimeout(300);
  await t.waitForTimeout(2500);
  ok((await t.locator('.map-tip').count()) === 1 && (await t.locator('.map-tip').innerText()).includes('IT security audit'), 'map: a tap on a pin opens its tooltip, which is still there 2.5 s later');
  ok(pinBox.width >= 44 && pinBox.height >= 44, `map: each pin is a ${Math.round(pinBox.width)} × ${Math.round(pinBox.height)} px target`);
  const fr = await t.locator('.map-frame').boundingBox();
  await t.touchscreen.tap(fr.x + 12, fr.y + fr.height - 12); await t.waitForTimeout(300);
  ok((await t.locator('.map-tip').count()) === 0, 'map: a tap elsewhere on the map closes it');
  await t.locator('.map-row').tap(); await t.waitForTimeout(600);
  ok((await counts(t)) === '1 Go 1 Maybe 4 No-go', 'map: the switch works by tap');
  ok(await t.evaluate(() => [...document.querySelectorAll('.map-count')].every((e) => e.scrollWidth <= e.clientWidth + 1)), 'map: every count tile fits its word');
  await go(t, 'sectors', 300); await t.locator('.strip').nth(2).tap(); await t.waitForTimeout(900);
  ok((await t.locator('.strip').nth(2).getAttribute('class')).includes('active'), 'sectors: a tap opens a strip');
  await go(t, 'app', 800); const pft = await phoneFrame(t); await t.evaluate(() => document.querySelector('.phone').scrollIntoView({ block: 'end' })); await t.waitForTimeout(300); await pft.locator('.tabbar a[href="#/settings"]').tap(); await pft.waitForSelector('.tabbar a[href="#/settings"][aria-current="page"]', { timeout: 5000 }).catch(() => {});
  ok((await pft.evaluate(() => location.hash)) === '#/settings' && (await pft.locator('.screen').innerText()).includes('About this prototype'), 'phone tabs: a tap opens Settings, with "About this prototype"');
  const sw4 = await t.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  ok(sw4[0] === sw4[1], `no horizontal scroll at 390 px (${sw4[0]} / ${sw4[1]})`);
  const tipInside = await t.evaluate(() => [...document.querySelectorAll('.pin')].map((_, i) => i));
  let clipped = [];
  for (const i of tipInside) { const b = await t.locator('.pin').nth(i).locator('.pin-shape').boundingBox(); await t.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await t.waitForTimeout(200); const r = await t.evaluate(() => { const f = document.querySelector('.map-frame').getBoundingClientRect(), tip = document.querySelector('.map-tip'); if (!tip) return null; const x = tip.getBoundingClientRect(); return x.top >= f.top - 1 && x.bottom <= f.bottom + 1; }); if (r === false) clipped.push(i); await t.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await t.waitForTimeout(150); }
  ok(clipped.length === 0, 'map: every pin\'s tooltip fits inside the map at 390 px (clipped: ' + (clipped.join(', ') || 'none') + ')');
  const codes390 = await t.evaluate(() => { const shapes = [...document.querySelectorAll('.pin-shape')].map((s) => s.getBoundingClientRect()); return [...document.querySelectorAll('.map-cc')].filter((x) => { const r = x.getBoundingClientRect(); return shapes.some((s) => r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top); }).map((x) => x.textContent); });
  ok(codes390.length === 0, 'map: no country code overlaps a pin shape at 390 px (' + (codes390.join(', ') || 'none') + ')');
  await declutter(t, '390 px, landing page');
  await tc.close();
  const t3 = await (await browser.newContext({ viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 })).newPage();
  await t3.goto(SITE, { waitUntil: 'networkidle' }); await go(t3, 'where', 300); await t3.waitForSelector('.map-svg .pin', { timeout: 10000 }); await t3.waitForTimeout(1500);
  const hoh = await t3.locator('.pin').nth(1).locator('.pin-shape').boundingBox();
  await t3.touchscreen.tap(hoh.x + hoh.width / 2, hoh.y + hoh.height / 2); await t3.waitForTimeout(300);
  ok((await t3.locator('.map-tip').innerText().catch(() => '')).includes('Landkreis Hohenau'), 'map at 320 px: a tap on Hohenau\'s square opens Hohenau, not its neighbour Kaltbrunn (18 px apart)');
  const codes320 = await t3.evaluate(() => { const shapes = [...document.querySelectorAll('.pin-shape')].map((s) => s.getBoundingClientRect()); return [...document.querySelectorAll('.map-cc')].filter((x) => { const r = x.getBoundingClientRect(); return shapes.some((s) => r.left < s.right && r.right > s.left && r.top < s.bottom && r.bottom > s.top); }).map((x) => x.textContent); });
  ok(codes320.length === 0, 'map: no country code overlaps a pin shape at 320 px (' + (codes320.join(', ') || 'none') + ')');
  await t3.context().close();

  await browser.close();
  if (srv) srv.close();
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'Site motion inventory, reduced motion, keyboard and touch checks passed'));
  process.exitCode = failures ? 1 : 0;
})();
