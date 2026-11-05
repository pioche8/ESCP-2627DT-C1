// site/scripts/how-check.cjs — the "How it decides" page against the static export (5 Nov 2026).
//   STATIC_EXPORT=1 npm run build && node scripts/how-check.cjs
// Asserts, in Chromium at 1440 and 390 px: the page renders the generated tables with the engine's numbers (weights,
// thresholds, the six demo rows), "Try the rules" reproduces the demo path 25 → 90 → 100 with the moved line marked,
// an off-script change (sector 72 off) gives "Outside your sectors", the reset returns to 25, no console errors, no
// horizontal scroll, every tap target ≥ 44 px, and none of the 18 declutter patterns in the rendered page.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const scan = require('../../tests/declutter-scan.js');

const site = path.resolve(__dirname, '..');
const OUT = path.join(site, 'out');
const H = JSON.parse(fs.readFileSync(path.join(site, 'src/generated/how-it-decides.json'), 'utf8'));
if (!fs.existsSync(path.join(OUT, 'how.html'))) { console.error('how-check: no static export with how.html in out/. Run: STATIC_EXPORT=1 npm run build'); process.exit(2); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' };
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

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  for (const width of [1440, 390]) {
    console.log('== /how at ' + width + ' px');
    const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, hasTouch: width < 500 });
    const page = await ctx.newPage();
    const problems = [];
    page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
    page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
    await page.goto(base + '/how', { waitUntil: 'networkidle' });
    const text = (sel) => page.locator(sel).first().innerText();
    const body = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    ok((await text('h1')).includes('How it decides'), 'title');
    ok(body.includes(`${H.weights.sector} if any of the tender’s CPV codes`) && body.includes(`Go line is ${H.constants.goMinScore}`) && body.includes(`caps the score at ${H.constants.knockoutCap}`), 'weights and thresholds come from the generated model (sector ' + H.weights.sector + ', Go ' + H.constants.goMinScore + ', cap ' + H.constants.knockoutCap + ')');
    ok(body.includes(H.source.engineSha) && body.includes(H.source.dataSha), 'code and data versions shown (' + H.source.engineSha + ', ' + H.source.dataSha + ')');
    const rows = await page.locator('.how-demo tbody tr').count();
    ok(rows === H.demo.tenders.length, 'demo table has ' + rows + ' rows (' + H.demo.tenders.length + ' tenders)');
    const hohRow = (await page.locator('.how-demo tbody tr').filter({ hasText: 'Landkreis Hohenau' }).innerText()).replace(/\s+/g, ' ');
    const hohGen = H.demo.tenders.find((t) => t.id === 'hoh-security');
    ok(hohRow.includes('No-go') && hohRow.includes(String(hohGen.score)) && hohRow.includes(hohGen.reason), 'Hohenau row: No-go ' + hohGen.score + ' · ' + hohGen.reason);
    ok(!/engine\.js|data\.js|ai\.js|tokens\.json/.test(body), 'no file names in the visible text (they live in the link targets)');
    const links = await page.locator('#real a[href*="github.com"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    ok(links.some((h) => /\/engine\.js$/.test(h)) && links.some((h) => /\/ai\.js$/.test(h)) && links.some((h) => /\/data\.js$/.test(h)) && links.some((h) => /tests\/engine\.test\.js$/.test(h)), '"What is real" links to engine.js, ai.js, data.js and the engine tests on GitHub');
    ok(body.includes(`${H.tests.engine} unit tests`), 'test count on the page = ' + H.tests.engine + ' (counted in the test file at build time)');

    // Try the rules: the demo path
    const tryEl = page.locator('.try');
    const state = async () => ({ v: await tryEl.getAttribute('data-verdict'), s: +(await tryEl.getAttribute('data-score')) });
    let st = await state();
    ok(st.v === 'nogo' && st.s === 25, 'Try the rules opens on Hohenau No-go 25 (got ' + st.v + ' ' + st.s + ')');
    await page.locator('.try [role="switch"][aria-label="ISO 27001"]').click();
    st = await state();
    ok(st.v === 'maybe' && st.s === 90, 'ISO 27001 on → Maybe 90 (got ' + st.v + ' ' + st.s + ')');
    const flipped = await page.locator('.try-req.flipped').evaluateAll((els) => els.map((e) => e.getAttribute('data-req') + ':' + e.getAttribute('data-status')));
    ok(flipped.join() === 'r1:pass', 'the line that flipped is marked: ' + flipped.join());
    const change = await text('[data-change]');
    ok(change.includes('ISO 27001 information security: Fails → Meets') && change.includes('No-go 25 → Maybe 90'), 'change line: "' + change + '"');
    await page.locator('.try [data-answer="pass"][data-req="r3"]').click();
    st = await state();
    ok(st.v === 'go' && st.s === 100, '"We meet it" → Go 100 (got ' + st.v + ' ' + st.s + ')');
    ok((await page.locator('.try-req.flipped').getAttribute('data-req')) === 'r3' && (await text('[data-change]')).includes('Maybe 90 → Go 100'), 'the answered line is the moved one; change line says Maybe 90 → Go 100');
    ok((await text('.try-headline')).includes('You meet all 3 requirements'), 'headline from the engine: "You meet all 3 requirements."');
    // Off-script: sector 72 off → outside your sectors; then reset
    await page.locator('.try [role="switch"][aria-label^="Sector 72"]').click();
    st = await state();
    ok(st.v === 'nogo' && st.s === 25 && (await text('.try-headline')).includes('Outside your sectors'), 'sector 72 off → No-go 25 "Outside your sectors"');
    await page.locator('.try [data-reset]').click();
    st = await state();
    ok(st.v === 'nogo' && st.s === 25 && (await page.locator('.try-req.flipped').count()) === 0 && (await page.locator('.try [role="switch"][aria-label="ISO 27001"]').getAttribute('aria-checked')) === 'false', 'reset returns to the demo profile: No-go 25, nothing marked');
    // Keyboard: the ISO switch toggles with Space
    await page.locator('.try [role="switch"][aria-label="ISO 27001"]').focus(); await page.keyboard.press('Space');
    st = await state();
    ok(st.v === 'maybe' && st.s === 90, 'keyboard: Space on the switch → Maybe 90');

    // Layout, tap targets, declutter
    const scroll = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    ok(scroll[0] <= scroll[1], 'no horizontal scroll (' + scroll.join(' / ') + ')');
    const small = await page.evaluate(() => Array.from(document.querySelectorAll('.try button, .try input, .how-toc a, .how-cta a, .site-header a, .site-header .btn')).map((el) => { const r = el.getBoundingClientRect(); return [el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30), Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] && x[2] && (x[1] < 44 || x[2] < 44)));
    ok(small.length === 0, 'every control is at least 44 px' + (small.length ? ': ' + JSON.stringify(small) : ''));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300);
    const found = await scan.scanDom(page);
    ok(found.length === 0, 'declutter scan: none of the 18 patterns' + (found.length ? '\n       ' + found.map((x) => x.pattern + ' · ' + x.el + (x.extra ? ' · ' + x.extra : '') + (x.text ? ' · "' + x.text + '"' : '')).join('\n       ') : ''));
    ok(problems.length === 0, 'no console errors, page errors or failed requests' + (problems.length ? ':\n       ' + problems.join('\n       ') : ''));
    await page.screenshot({ path: path.join(site, 'screenshots', 'how-' + width + '.png'), fullPage: true }).catch(() => {});
    await ctx.close();
  }
  // Metadata on both pages
  for (const p of ['/', '/how']) {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.goto(base + p, { waitUntil: 'load' });
    const meta = await page.evaluate(() => {
      const m = (s) => document.querySelector(s)?.getAttribute('content') || '';
      return { title: document.title, desc: m('meta[name="description"]'), ogt: m('meta[property="og:title"]'), ogi: m('meta[property="og:image"]'), tw: m('meta[name="twitter:card"]'), canon: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '', icon: !!document.querySelector('link[rel="icon"]'), apple: !!document.querySelector('link[rel="apple-touch-icon"]') };
    });
    ok(meta.title.length > 10 && meta.desc.length > 60 && meta.ogt && /opengraph-image/.test(meta.ogi) && meta.tw === 'summary_large_image' && meta.icon && meta.apple && meta.canon, p + ' metadata: title "' + meta.title + '", description, Open Graph with image, Twitter card, canonical, icon, apple-touch-icon');
    await ctx.close();
  }
  const sitemap = fs.existsSync(path.join(OUT, 'sitemap.xml')) ? fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8') : '';
  const robots = fs.existsSync(path.join(OUT, 'robots.txt')) ? fs.readFileSync(path.join(OUT, 'robots.txt'), 'utf8') : '';
  ok(/<loc>[^<]*\/how<\/loc>/.test(sitemap) && /<loc>/.test(sitemap), 'sitemap.xml lists the home page and /how');
  ok(/Sitemap:/.test(robots) && /Allow: \//.test(robots), 'robots.txt allows indexing and names the sitemap');
  await browser.close();
  srv.close();
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'How-it-decides page checks passed'));
  process.exitCode = failures ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
