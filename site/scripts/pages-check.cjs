// site/scripts/pages-check.cjs — the GitHub Pages export, loaded from the Pages paths (10 Nov 2026, pass 9, ADR-0005).
//   cd site && node scripts/pages-export.mjs && node scripts/pages-check.cjs
//   PAGES_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node scripts/pages-check.cjs     (the live site instead)
// Serves the repository as GitHub Pages does (scripts/pages-serve.cjs: /ESCP-2627DT-C1/ = main's root), then at 1440 × 900
// and 390 × 844 (touch) opens /ESCP-2627DT-C1/website/, scrolls through every section so the lazy parts load (the map,
// the phone, the photos) and checks:
//   · every request answered below 400 (no 404), no failed request, 0 console errors and 0 page errors, in the page and
//     in the phone's frame;
//   · each of the twelve sections is on the page; every <img> decoded; the map drawn; both fonts loaded;
//   · the phone is the app at the Pages path, signed in, on the Feed, and its Settings show the About wording of pass 8;
//   · every link to the site, the app, the film and the reel answers 200 (the film and the reel are main's marketing/);
//   · /how (how/index.html; /how redirects to it as Pages does) loads with the same rules, and its "Try the rules" block is there.
const path = require('node:path');
const { chromium, devices } = require('playwright');
const { servePages, REPO_PATH } = require('./pages-serve.cjs');

const SECTIONS = ['top', 'statement', 'tonight', 'languages', 'how', 'who', 'app', 'sectors', 'where', 'film', 'faq', 'start'];
const LIVE = 'https://pioche8.github.io' + REPO_PATH + '/';
let failures = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) failures++; };

(async () => {
  const srv = process.env.PAGES_URL ? null : await servePages();
  const APP = (process.env.PAGES_URL || 'http://127.0.0.1:' + srv.address().port + REPO_PATH + '/').replace(/\/?$/, '/');
  const SITE = APP + 'website/';
  // Links on the page name the live Pages URL (APP_URL, FILM_URL); locally they are checked against the same file here.
  const local = (href) => href.startsWith(LIVE) ? APP + href.slice(LIVE.length) : href;
  const browser = await chromium.launch();
  console.log('== the Pages export · ' + SITE);

  for (const [label, opts] of [['1440 × 900', { viewport: { width: 1440, height: 900 } }], ['390 × 844, touch', { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }]]) {
    console.log('\n' + label);
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const bad = [], errors = [];
    page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    page.on('requestfailed', (r) => { if (!/net::ERR_ABORTED/.test(r.failure()?.errorText || '') || !/\.(mp4)$/.test(r.url())) bad.push('failed ' + r.url() + ' (' + (r.failure()?.errorText || '') + ')'); });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(SITE, { waitUntil: 'networkidle' });
    ok(page.url() === SITE, 'opens at ' + SITE.replace(APP, REPO_PATH + '/'));
    const missing = await page.evaluate((ids) => ids.filter((id) => !document.getElementById(id)), SECTIONS);
    ok(missing.length === 0, 'all ' + SECTIONS.length + ' sections are on the page' + (missing.length ? ': missing ' + missing.join(', ') : ''));
    // Pass 9b: Built for says how the 45 CPV divisions are numbered, so "45" does not read as an undercount next to code 98.
    const who = await page.locator('#who .body').first().innerText();
    ok(/They fall into 45 divisions, numbered 03 to 98 with gaps\./.test(who), 'Built for: "' + who + '"');
    // Scroll through every section so the lazy parts load (map within 600 px, phone frame, photos), then back to the top.
    for (const id of SECTIONS) { await page.evaluate((id) => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById(id).scrollIntoView({ block: 'start' }); }, id); await page.waitForTimeout(450); }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(600);
    await page.waitForLoadState('networkidle');
    // Photos in the sideways carousels load lazily, so an image the browser has not asked for yet is fetched here instead.
    const imgs = await page.evaluate(() => [...document.images].map((i) => ({ src: i.currentSrc || i.src, loaded: i.complete && !!i.currentSrc, ok: i.naturalWidth > 0 })));
    const broken = imgs.filter((i) => i.loaded && !i.ok);
    const fetched = [];
    for (const i of imgs.filter((x) => !x.loaded)) { const r = await ctx.request.fetch(i.src); fetched.push([i.src, r.status(), r.headers()['content-type'] || '']); }
    const badFetch = fetched.filter(([, st, ct]) => st !== 200 || !/^image\//.test(ct));
    ok(imgs.length > 0 && broken.length === 0 && badFetch.length === 0, imgs.length + ' images: ' + (imgs.length - fetched.length) + ' loaded and decoded, ' + fetched.length + ' lazy ones fetched as images (200)' + (broken.length || badFetch.length ? ': ' + broken.map((i) => 'not decoded ' + i.src).concat(badFetch.map(([u, st, ct]) => st + ' ' + ct + ' ' + u)).join(', ') : ''));
    ok(imgs.every((i) => i.src.startsWith(SITE)), 'every image is served from the website path');
    const map = await page.evaluate(() => { const s = document.querySelector('#where svg'); return s ? s.querySelectorAll('path').length : 0; });
    ok(map > 10, 'the map is drawn (' + map + ' paths)');
    const fonts = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].map((f) => f.family + ':' + f.status); });
    ok(fonts.some((f) => /Hanken/i.test(f) && /:loaded$/.test(f)) && fonts.some((f) => /Symbols/i.test(f) && /:loaded$/.test(f)), 'both fonts loaded (' + fonts.filter((f) => /:loaded$/.test(f)).map((f) => f.split(':')[0]).join(', ') + ')');
    // The phone: the app at the Pages path, signed in on the Feed.
    await page.evaluate(() => document.getElementById('app').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
    await page.waitForFunction(() => { const f = document.querySelector('.phone-app'); return !!(f && f.contentDocument && f.contentDocument.querySelector('.feed-list')); }, null, { timeout: 20000 }).catch(() => {});
    const frame = await (await page.$('.phone-app'))?.contentFrame();
    const furl = frame ? frame.url() : '';
    ok(!!frame && furl.startsWith(SITE + 'prototype/index.html'), 'the phone runs the app copy at ' + (furl ? furl.replace(APP, REPO_PATH + '/') : '(no frame)'));
    if (frame) {
      frame.on?.('console', () => {});
      ok(await frame.locator('.feed-list').count() === 1 && await frame.locator('.signin').count() === 0, 'the phone opens signed in, on the Feed');
      if (label.startsWith('1440')) {
        await frame.click('.tabbar a[href="#/settings"]'); await frame.waitForTimeout(500);
        const about = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');
        ok(/Real and fictional data/.test(about) && /The team ran the surveys/.test(about), 'the phone\'s Settings show the pass 8 About wording ("Real and fictional data", "The team ran the surveys")');
        ok(/demo@example\.com/.test(about), 'the phone\'s Settings say who is signed in (demo@example.com)');
        await frame.click('.tabbar a[href="#/feed"]'); await frame.waitForTimeout(300);
      }
    }
    // Links: the site's own pages, the app, the film, the reel (everything on github.io or under the site; not GitHub or anchors).
    const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.href))]);
    const toCheck = hrefs.filter((h) => !h.includes('#') && (h.startsWith(APP) || h.startsWith(LIVE)));
    const res = [];
    for (const h of toCheck) { const r = await ctx.request.fetch(local(h), { method: 'HEAD', maxRedirects: 5 }).catch((e) => ({ status: () => 'error ' + e.message })); res.push([h, r.status()]); }
    const badLinks = res.filter(([, s]) => s !== 200);
    ok(toCheck.length > 0 && badLinks.length === 0, toCheck.length + ' links to the site, the app and marketing/ answer 200' + (badLinks.length ? ': ' + badLinks.map(([h, s]) => s + ' ' + h).join(', ') : ''));
    const film = toCheck.find((h) => /marketing\/.+\.mp4$/.test(h));
    ok(!!film, 'the film link points at ' + (film || '(none)').replace(LIVE, REPO_PATH + '/'));
    ok(bad.length === 0, 'no request answered 400 or more, none failed' + (bad.length ? ':\n       ' + bad.join('\n       ') : ''));
    ok(errors.length === 0, '0 console errors and 0 page errors' + (errors.length ? ':\n       ' + errors.join('\n       ') : ''));
    await ctx.close();
  }

  // /how, and the reel (linked from the README and the film page, not the site).
  console.log('\n/how');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const bad = [], errors = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  // The Pages export is built with trailing slashes: /how is how/index.html, and /how without the slash redirects to it.
  const noSlash = await ctx.request.fetch(SITE + 'how', { method: 'HEAD', maxRedirects: 0 });
  ok(noSlash.status() === 301 && (noSlash.headers().location || '').endsWith('/website/how/'), REPO_PATH + '/website/how → ' + noSlash.status() + ' ' + (noSlash.headers().location || ''));
  const slash = await ctx.request.fetch(SITE + 'how/', { method: 'HEAD' });
  ok(slash.status() === 200, REPO_PATH + '/website/how/ → ' + slash.status() + ' (how/index.html)');
  await page.goto(SITE + 'how', { waitUntil: 'networkidle' });
  ok(page.url() === SITE + 'how/', '/how opens at ' + page.url().replace(APP, REPO_PATH + '/'));
  ok(/How it decides/.test(await page.title()), '/how: title "' + (await page.title()) + '"');
  ok(await page.locator('text=Try the rules').count() > 0, '/how: the "Try the rules" block is there');
  const back = await page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => /site/i.test(a.textContent)).map((a) => a.getAttribute('href')));
  ok(back.length > 0 && back.every((h) => h === REPO_PATH + '/website/'), '/how: "The site" links back to ' + REPO_PATH + '/website/ (' + back.join(', ') + ')');
  ok(bad.length === 0, '/how: no request answered 400 or more' + (bad.length ? ': ' + bad.join(', ') : ''));
  ok(errors.length === 0, '/how: 0 console errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  for (const f of ['marketing/TenderScout-launch-film-1920x1080.mp4', 'marketing/TenderScout-launch-reel-1080x1920.mp4']) {
    const r = await ctx.request.fetch(APP + f, { method: 'HEAD' });
    ok(r.status() === 200, REPO_PATH + '/' + f + ' → ' + r.status());
  }
  const sm = await (await ctx.request.fetch(SITE + 'sitemap.xml')).text();
  ok(sm.includes('<loc>https://pioche8.github.io' + REPO_PATH + '/website/</loc>') && !sm.includes('localhost'), 'sitemap.xml names the Pages URL');
  const html = await (await ctx.request.fetch(SITE)).text();
  const og = (html.match(/property="og:image" content="([^"]+)"/) || [])[1] || '';
  ok(og.startsWith('https://pioche8.github.io' + REPO_PATH + '/website/') && !og.includes('/website/ESCP'), 'the Open Graph image is on the Pages URL (' + og + ')');
  const canon = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
  ok(canon === 'https://pioche8.github.io' + REPO_PATH + '/website/', 'the canonical link is the Pages URL (' + canon + ')');
  const howHtml = await (await ctx.request.fetch(SITE + 'how/')).text();
  const howCanon = (howHtml.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
  const howOg = (howHtml.match(/property="og:image" content="([^"]+)"/) || [])[1] || '';
  ok(howCanon === 'https://pioche8.github.io' + REPO_PATH + '/website/how/' && howOg.startsWith('https://pioche8.github.io' + REPO_PATH + '/website/opengraph-image.png'), '/how: canonical ' + howCanon + ', Open Graph image ' + howOg);
  await ctx.close();
  await browser.close();
  if (srv) srv.close();
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'pages-check: all checks passed'));
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('FAIL pages-check crashed: ' + e.message); process.exit(1); });
