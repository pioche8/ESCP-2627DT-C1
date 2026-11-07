// site/scripts/record.cjs — screen recordings of the website for people who cannot open it (it is not deployed): the hero,
// the map with the cross-border switch, and the phone demo, about 30 s each at desktop (1440 × 900) and phone (390 × 844),
// plus a before/after strip. Dev-only: Playwright (pre-installed) and ffmpeg + ImageMagick.
//   npm run export && node scripts/record.cjs                       → ../docs/site/site-1440.mp4, site-390.mp4
//   BEFORE_URL=http://localhost:4104/ node scripts/record.cjs        → also ../docs/site/before-after.jpg (BEFORE_URL: the site
//                                                                      as it was, e.g. main's static export served locally)
// Frames are device-pixel JPEGs sampled over the DevTools protocol and assembled by ffmpeg at a constant 25 fps, as
// tests/demo-record.js does for the app (Playwright's own recordVideo is 1× only). Motion on, dark, fictional demo data.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const SITE_DIR = path.resolve(__dirname, '..');
const OUT = path.join(SITE_DIR, 'out');
const DOCS = path.join(SITE_DIR, '..', 'docs', 'site');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
const serve = () => new Promise((resolve) => {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    let abs = path.join(OUT, p); if (fs.existsSync(abs + '.html')) abs += '.html';
    if (!abs.startsWith(OUT) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' }); fs.createReadStream(abs).pipe(res);
  });
  srv.listen(0, '127.0.0.1', () => resolve(srv));
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Scroll like a person: eased over `ms`, the element's top `offset` px under the top of the viewport.
const glide = (page, sel, ms = 1200, offset = 0) => page.evaluate(([sel, ms, offset]) => new Promise((done) => {
  document.documentElement.style.scrollBehavior = 'auto';
  const from = window.scrollY, to = document.querySelector(sel).getBoundingClientRect().top + window.scrollY - offset, t0 = performance.now();
  const step = (t) => { const p = Math.min(1, (t - t0) / ms), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; window.scrollTo(0, from + (to - from) * e); if (p < 1) requestAnimationFrame(step); else done(); };
  requestAnimationFrame(step);
}), [sel, ms, offset]);

async function record(browser, base, { w, h, dsf, touch, name }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, hasTouch: touch, isMobile: touch, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' }); await sleep(500);
  const cdp = await ctx.newCDPSession(page);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'site-rec-'));
  const frames = []; const t0 = Date.now(); let on = true, misses = 0;
  const sampler = (async () => {
    let i = 0;
    while (on) {
      const tick = Date.now();
      try {
        const r = await Promise.race([cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 86, fromSurface: true, optimizeForSpeed: true }), sleep(2000)]);
        if (r && r.data) { const f = path.join(tmp, 'f' + String(i++).padStart(5, '0') + '.jpg'); fs.writeFileSync(f, Buffer.from(r.data, 'base64')); frames.push({ t: Date.now() - t0, f }); }
        else misses++; // a capture that hung past 2 s
      } catch { misses++; /* mid-navigation: try again, counted */ }
      const left = 40 - (Date.now() - tick); if (left > 0) await sleep(left);
    }
  })();
  const tap = async (sel, nth = 0) => { const el = page.locator(sel).nth(nth); if (touch) await el.tap(); else { await el.hover(); await sleep(250); await el.click(); } };
  const pin = (i) => page.locator('.pin').nth(i).locator('.pin-shape');
  // 1. hero: the disc drifts (and, with a mouse, follows the pointer); the wordmark's lit letters follow it
  if (!touch) { for (let k = 0; k <= 40; k++) { await page.mouse.move(150 + (w - 300) * (k / 40), 520 + 60 * Math.sin(k / 6)); await sleep(90); } await page.mouse.move(w / 2, 40); }
  await sleep(touch ? 3500 : 1500);
  // 2. the map: fill-in, pins and arcs; a tooltip; cross-border off (only Valdemora flips) and on again
  await glide(page, '#where', 1300, touch ? 0 : -10); await sleep(2600);
  if (touch) await pin(1).tap(); else { await pin(1).hover(); await sleep(250); await pin(1).click(); } await sleep(1800);
  if (touch) { const fr = await page.locator('.map-frame').boundingBox(); await page.touchscreen.tap(fr.x + 10, fr.y + fr.height - 10); } else { await pin(5).hover(); }
  await sleep(1200);
  await page.locator('.map-panel').scrollIntoViewIfNeeded(); await tap('.map-row'); await sleep(2000);
  await tap('.map-row'); await sleep(1600);
  if (!touch) await page.mouse.move(w / 2, 40);
  // 3. the phone: tabs slide, ISO 27001 re-scores Hohenau No-go 25 → Maybe 90, "We meet it" → Go 100, Profile follows
  await glide(page, touch ? '.phone' : '#app', 1200, touch ? 20 : -40); await sleep(900);
  await tap('#dock-tab-0'); await sleep(1300);
  await tap('#dock-tab-2'); await sleep(1100);
  await tap('button.pswitch', 0); await sleep(1900);
  await tap('.meet-btn'); await sleep(1900);
  await tap('#dock-tab-3'); await sleep(1500);
  await tap('#dock-tab-1'); await sleep(1500);
  on = false; await sampler;
  await ctx.close();
  const FPS = 25, tick = 1000 / FPS, end = frames[frames.length - 1].t, list = []; let k = 0;
  for (let t = frames[0].t; t <= end; t += tick) { while (k + 1 < frames.length && frames[k + 1].t <= t) k++; list.push("file '" + frames[k].f + "'\nduration " + (tick / 1000).toFixed(4)); }
  list.push("file '" + frames[frames.length - 1].f + "'");
  fs.writeFileSync(path.join(tmp, 'list.txt'), list.join('\n') + '\n');
  const mp4 = path.join(DOCS, name);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '26',
    '-pix_fmt', 'yuv420p', '-vf', 'scale=' + w * dsf + ':' + h * dsf + ':flags=lanczos', '-r', String(FPS), '-movflags', '+faststart', '-an', mp4], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  const mb = fs.statSync(mp4).size / 1048576, secs = (end - frames[0].t) / 1000, fps = frames.length / secs;
  if (fps < 8) problems.push(`only ${fps.toFixed(1)} frames per second were captured (at least 8 needed for a smooth video)`);
  if (misses > frames.length / 10) problems.push(`${misses} captures failed or hung (over a tenth of ${frames.length})`);
  console.log(`video  docs/site/${name} · ${secs | 0} s · ${frames.length} frames (${fps.toFixed(1)}/s, ${misses} missed) · ${mb.toFixed(1)} MB` + (problems.length ? ' · PROBLEMS: ' + problems.join(' | ') : ''));
  return problems.length === 0 && mb < 10;
}

// Before/after: the hero, the map and the phone at 1440 × 900, the site as it was (left) and as it is (right).
async function strip(browser, before, after) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'site-ba-'));
  const shots = [];
  for (const [label, url] of [['before', before], ['after', after]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(url, { waitUntil: 'networkidle' }); await sleep(800);
    for (const id of ['top', 'where', 'app']) {
      await page.evaluate((id) => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById(id).scrollIntoView(); }, id);
      await sleep(id === 'where' ? 2600 : 900);
      const f = path.join(tmp, `${id}-${label}.png`); await page.screenshot({ path: f }); shots.push(f);
    }
    if (label === 'after' && errs.length) throw new Error('console errors on the site while making the strip: ' + errs.join(' | '));
    await ctx.close();
  }
  const png = path.join(DOCS, 'before-after.png'), jpg = path.join(DOCS, 'before-after.jpg');
  const order = ['top', 'where', 'app'].flatMap((id) => [path.join(tmp, `${id}-before.png`), path.join(tmp, `${id}-after.png`)]);
  execFileSync('montage', [...order.flatMap((f, i) => ['-label', (i % 2 ? 'After (pass 5): the decluttered look, the original motion and map' : 'Before (main, 6 Nov): the restored 3 Nov design'), f]),
    '-font', 'DejaVu-Sans', '-pointsize', '22', '-fill', '#FFFFFF', '-background', '#02040A', '-tile', '2x3', '-geometry', '960x600+12+12', png], { stdio: 'inherit' });
  execFileSync('convert', [png, '-strip', '-quality', '86', jpg]); fs.rmSync(png);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('strip  docs/site/before-after.jpg · ' + (fs.statSync(jpg).size / 1048576).toFixed(1) + ' MB');
}

(async () => {
  if (!fs.existsSync(path.join(OUT, 'index.html'))) { console.error('record: no static export in out/. Run: npm run export'); process.exit(2); }
  fs.mkdirSync(DOCS, { recursive: true });
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch();
  let good = true;
  if (!process.env.ONLY_STRIP) {
    good = (await record(browser, base, { w: 1440, h: 900, dsf: 1, touch: false, name: 'site-1440.mp4' })) && good;
    good = (await record(browser, base, { w: 390, h: 844, dsf: 2, touch: true, name: 'site-390.mp4' })) && good;
  }
  if (process.env.BEFORE_URL) await strip(browser, process.env.BEFORE_URL, base);
  await browser.close(); srv.close();
  process.exitCode = good ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
