// Frame-exact render of a design/films page (the animations-v3 stage): ?render semantics, i.e. the engine's own
// clock is stopped and window.seek(seconds) draws every frame through the stage's seek event (sync commit).
//
//   node marketing/render-frames.js <page-url> <frames-dir> <fps> [maxFrames]
//
// The design pages load React, ReactDOM and Babel from unpkg. Serve the repo root over HTTP and, where the CDN is
// not reachable, serve local copies of the three UMD files and point LIBS at them (default http://127.0.0.1:8125/libs):
//   react@18.3.1/umd/react.production.min.js, react-dom@18.3.1/umd/react-dom.production.min.js, @babel/standalone@7.29.0/babel.min.js
// Used on 3 Nov 2026 for marketing/TenderScout-launch-film-1920x1080.mp4 (1350 frames at 30 fps), then marketing/encode.sh.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [,, URL_, DIR, FPS_ = '30', MAX_ = ''] = process.argv; const FPS = +FPS_;
fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200))); page.on('requestfailed', r => errs.push('reqfail: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()); });
  const LIBS = process.env.LIBS || 'http://127.0.0.1:8125/libs';
  await page.addInitScript((LIBS) => { window.__resources = {   // support.js honours window.__resources instead of the CDN
    'https://unpkg.com/react@18.3.1/umd/react.production.min.js': LIBS + '/react.production.min.js',
    'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js': LIBS + '/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js': LIBS + '/babel.min.js' }; }, LIBS);
  await page.goto(URL_ + (URL_.includes('?') ? '&' : '?') + 'render');
  await page.waitForSelector('[data-om-exportable-video-with-duration-secs]', { timeout: 60000 });
  // ?render: stop the engine's own clock; window.seek(seconds) draws that exact moment (sync commit).
  await page.evaluate(() => {
    const el = document.querySelector('[data-om-exportable-video-with-duration-secs]');
    window.seek = (t) => el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: t, sync: true } }));
    window.seek(0);
  });
  // Load every font the films use before the first frame (frame 0 must not paint in a fallback face).
  await page.evaluate(async () => {
    const faces = ['300 44px "Hanken Grotesk"', '400 30px "Hanken Grotesk"', '500 30px "Hanken Grotesk"', '600 30px "Hanken Grotesk"', '700 30px "Hanken Grotesk"', '800 96px "Hanken Grotesk"', 'italic 400 30px "Hanken Grotesk"', '500 18px "IBM Plex Mono"', '600 18px "IBM Plex Mono"', '400 24px "Material Symbols Rounded"'];
    await Promise.all(faces.map(f => document.fonts.load(f).catch(() => null)));
    await document.fonts.ready;
  });
  // Warm the image cache: seek across the whole piece once so every <img> has decoded before capture.
  const duration = +(await page.getAttribute('[data-om-exportable-video-with-duration-secs]', 'data-om-exportable-video-with-duration-secs'));
  for (let t = 0; t <= duration; t += 2) { await page.evaluate((t) => window.seek(t), t); await page.waitForTimeout(40); }
  await page.waitForTimeout(800);
  const total = Math.round(duration * FPS), max = MAX_ ? Math.min(+MAX_, total) : total;
  const svg = page.locator('[data-om-exportable-video-with-duration-secs]');
  const box = await svg.boundingBox(); const clip = { x: Math.round(box.x), y: Math.round(box.y), width: 1920, height: 1080 };
  const t0 = Date.now();
  for (let i = 0; i < max; i++) {
    await page.evaluate((t) => { window.seek(t); return new Promise(r => requestAnimationFrame(() => r())); }, i / FPS);
    await page.screenshot({ path: path.join(DIR, String(i).padStart(5, '0') + '.png'), clip });
    if (i % 150 === 0) console.log('frame', i, '/', total, Math.round((Date.now() - t0) / 1000) + 's');
  }
  console.log('done', max, 'frames in', Math.round((Date.now() - t0) / 1000) + 's', 'duration', duration, 'errors:', errs.length ? errs.slice(0, 10) : 'none');
  await b.close();
})();
