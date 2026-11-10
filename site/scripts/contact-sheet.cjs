// site/scripts/contact-sheet.cjs — the cohesion contact sheet: the site's phone next to the real app, in every state of
// the BRIEF.md demo path (pass 8). Since pass 8 the site's phone is the app itself (an iframe of the byte-for-byte copy
// in public/prototype/), so the two columns must show the same screens, numbers and labels; a difference means the copy
// is stale (`node site/scripts/sync-shared.mjs --check` fails in CI for the same reason).
//   npm run export && node scripts/contact-sheet.cjs [out.jpg|png]          serves out/ itself; the app from ../index.html
//   SITE_URL=http://localhost:3100 APP_URL=file:///…/index.html node scripts/contact-sheet.cjs
// Row 0 is the phone as a visitor sees it (onboarded, on the Feed); rows 1–7 run both from ?demo=reset,fast.
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const OUTDIR = path.join(ROOT, 'out');
const APP = process.env.APP_URL || 'file://' + path.resolve(ROOT, '../index.html');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, '../docs/site/contact-sheet.jpg'));
const DIR = path.join(require('node:os').tmpdir(), 'ts-contact-' + process.pid);
fs.mkdirSync(DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const serve = () => new Promise((resolve) => {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
    let abs = path.join(OUTDIR, p); if (fs.existsSync(abs + '.html')) abs += '.html'; else if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) abs = path.join(abs, 'index.html');
    if (!abs.startsWith(OUTDIR) || !fs.existsSync(abs)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' }); fs.createReadStream(abs).pipe(res);
  });
  srv.listen(0, '127.0.0.1', () => resolve(srv));
});

// The seven steps of BRIEF.md's demo, on a Page (the app) or a Frame (the site's phone): both have the same API.
async function demoPath(f, shot) {
  const sheet = (open) => f.waitForFunction((o) => !!document.querySelector('#sheet-root.open') === o, open).then(() => f.waitForTimeout(450));
  await f.waitForSelector('.welcome'); await f.waitForTimeout(500); await shot(1);
  await f.click('button[data-act="draft"]'); await f.waitForSelector('text=Check your profile', { timeout: 10000 });
  await f.click('button[data-act="finish"]'); await f.waitForSelector('.feed-list');
  await f.waitForFunction(() => document.querySelector('.pages-line').innerText.includes('777'), null, { timeout: 6000 }); await f.waitForTimeout(400); await shot(2);
  await f.click('a.tcard[href="#/t/ell-schools"]'); await f.waitForSelector('.vhead.v-go', { timeout: 8000 });
  await f.click('a.req[href="#/t/ell-schools/req/r1"]'); await sheet(true); await shot(3);
  await f.evaluate(() => history.back()); await sheet(false);
  await f.click('button[data-act="back"]'); await f.waitForSelector('.feed-list');
  await f.click('a.tcard[href="#/t/hoh-security"]'); await f.waitForSelector('.vhead.v-nogo', { timeout: 8000 });
  await f.click('a.req[href="#/t/hoh-security/req/r3"]'); await sheet(true); await shot(4);
  await f.click('.sheet button[data-confirm="pass"]'); await sheet(false);
  await f.click('button[data-act="back"]'); await f.waitForSelector('.feed-list');
  await f.click('.tabbar a[href="#/company"]'); await f.waitForSelector('.co-head');
  await f.click('button[data-cert="ISO 27001"]'); await f.waitForSelector('.rescore[data-rescore]'); await f.waitForTimeout(1600);
  await f.evaluate(() => window.scrollTo(0, 0)); await f.waitForTimeout(300); await shot(5);
  await f.click('.tabbar a[href="#/feed"]'); await f.waitForSelector('.feed-list');
  await f.click('a.tcard[href="#/t/hoh-security"]'); await f.waitForSelector('.vhead.v-go', { timeout: 8000 });
  await f.evaluate(() => document.getElementById('asks').scrollIntoView({ block: 'center' }));
  await f.click('button[data-ask="0"]'); await f.waitForSelector('#ans-0 .cite', { timeout: 5000 }); await f.waitForTimeout(400); await shot(6);
  await f.click('button[data-act="back"]'); await f.waitForSelector('.feed-list');
  await f.click('a.tcard[href="#/t/vli-libraries"]'); await f.waitForSelector('.vhead.v-nogo', { timeout: 8000 });
  await f.click('button[data-go="#/t/vli-libraries/skip"]'); await sheet(true);
  await f.click('.opt[data-skip="Missing a certificate"]'); await f.click('button[data-act="skip-confirm"]'); await f.waitForSelector('.feed-list');
  await f.click('.tabbar a[href="#/bids"]'); await f.waitForSelector('.bids-head'); await f.waitForTimeout(4600); /* the "Skipped" toast belongs to the Feed */ await shot(7);
}

(async () => {
  let srv = null, SITE = process.env.SITE_URL;
  if (!SITE) {
    if (!fs.existsSync(path.join(OUTDIR, 'index.html'))) { console.error('contact-sheet: no static export in out/. Run: npm run export (or set SITE_URL)'); process.exit(2); }
    srv = await serve(); SITE = 'http://127.0.0.1:' + srv.address().port;
  }
  const browser = await chromium.launch();
  const problems = [];
  // --- the site's phone (1440 × 1000, the 410 × 800 phone holds the app at 390 × 780) ---
  const sctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const sp = await sctx.newPage();
  sp.on('pageerror', (e) => problems.push('site: ' + e.message));
  sp.on('console', (m) => { if (m.type() === 'error') problems.push('site: ' + m.text()); });
  await sp.goto(SITE, { waitUntil: 'networkidle' });
  await sp.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('app').scrollIntoView({ block: 'center' }); });
  await sp.waitForFunction(() => { const f = document.querySelector('.phone-app'); return !!(f && f.contentDocument && f.contentDocument.querySelector('.feed-list')); }, null, { timeout: 15000 });
  const phone = sp.locator('.phone');
  const fr = await (await sp.$('.phone-app')).contentFrame();
  await sp.waitForTimeout(3200); // the 777 count-up
  await phone.screenshot({ path: path.join(DIR, 'site-0.png') });
  await fr.goto(SITE + '/prototype/index.html?demo=reset,fast');
  await demoPath(fr, (n) => phone.screenshot({ path: path.join(DIR, 'site-' + n + '.png') }));
  await sctx.close();
  // --- the real app at the same size, dark ---
  const actx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, colorScheme: 'dark', hasTouch: true });
  const ap = await actx.newPage();
  ap.on('pageerror', (e) => problems.push('app: ' + e.message));
  ap.on('console', (m) => { if (m.type() === 'error') problems.push('app: ' + m.text()); });
  await ap.goto(APP + '?demo=reset,fast');
  await ap.waitForSelector('.welcome');
  await ap.evaluate(() => { const s = JSON.parse(localStorage.getItem('tenderscout.v2')); s.onboarded = true; localStorage.setItem('tenderscout.v2', JSON.stringify(s)); });
  await ap.goto('about:blank'); await ap.goto(APP + '?demo=fast#/feed'); await ap.waitForSelector('.feed-list'); await ap.waitForTimeout(3200);
  await ap.screenshot({ path: path.join(DIR, 'app-0.png') });
  await ap.goto('about:blank'); await ap.goto(APP + '?demo=reset,fast');
  await demoPath(ap, (n) => ap.screenshot({ path: path.join(DIR, 'app-' + n + '.png') }));
  await actx.close();
  await browser.close();
  if (srv) srv.close();

  // --- compose: one row per state, site | app ---
  const rows = [
    ['0 · The phone as a visitor sees it: onboarded, on the Feed', 'Site · the phone on the landing page', 'App · #/feed, onboarded'],
    ['1 · Welcome', 'Site · the phone, ?demo=reset,fast', 'App · ?demo=reset,fast'],
    ['2 · Feed: 1 Go · 2 Maybe · 3 No-go, 777 pages in 4 languages', 'Site · the phone', 'App · #/feed'],
    ['3 · The Go tender, a line\'s proof: the original sentence and its page', 'Site · the phone', 'App · #/t/ell-schools/req/r1'],
    ['4 · Landkreis Hohenau, No-go: the line only you can answer', 'Site · the phone', 'App · #/t/hoh-security/req/r3'],
    ['5 · Company → ISO 27001: Landkreis Hohenau 25 → 100, No-go → Go', 'Site · the phone', 'App · #/company'],
    ['6 · Ask this tender: "Can we subcontract?"', 'Site · the phone', 'App · #/t/hoh-security'],
    ['7 · Skip the Dutch libraries tender → Bids', 'Site · the phone', 'App · #/bids'],
  ];
  const CELL_W = 700, CELL_H = 1400, PAD = 40, LABEL = 110, HEAD = 150;
  const W = PAD * 3 + CELL_W * 2, H = HEAD + rows.length * (CELL_H + LABEL + PAD) + PAD;
  const layers = [];
  const fit = async (file, w, h) => sharp(path.join(DIR, file)).resize(w, h, { fit: 'inside', background: '#02040A' }).png().toBuffer();
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const font = 'font-family="Hanken Grotesk, Arial, sans-serif"';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#02040A"/>` +
    `<text x="${PAD}" y="64" fill="#FFFFFF" ${font} font-size="40" font-weight="800">TenderScout · the site's phone vs the real app, the demo path</text>` +
    `<text x="${PAD}" y="104" fill="#A3ADBD" ${font} font-size="18">The site's phone is the app (an iframe of public/prototype/) · dark · real rules, fictional companies and tenders · ${new Date().toISOString().slice(0, 10)}</text>`;
  for (let i = 0; i < rows.length; i++) {
    const [title, sLabel, aLabel] = rows[i];
    const y = HEAD + i * (CELL_H + LABEL + PAD);
    svg += `<text x="${PAD}" y="${y + 36}" fill="#FFFFFF" ${font} font-size="30" font-weight="700">${esc(title)}</text>`;
    svg += `<text x="${PAD}" y="${y + 74}" fill="#8A93A3" ${font} font-size="16">${esc(sLabel)}</text>`;
    svg += `<text x="${PAD * 2 + CELL_W}" y="${y + 74}" fill="#8A93A3" ${font} font-size="16">${esc(aLabel)}</text>`;
    const s = await fit('site-' + i + '.png', CELL_W, CELL_H), a = await fit('app-' + i + '.png', CELL_W, CELL_H);
    const sm = await sharp(s).metadata(), am = await sharp(a).metadata();
    layers.push({ input: s, left: PAD + Math.round((CELL_W - sm.width) / 2), top: y + LABEL });
    layers.push({ input: a, left: PAD * 2 + CELL_W + Math.round((CELL_W - am.width) / 2), top: y + LABEL });
  }
  svg += '</svg>';
  const img = sharp(Buffer.from(svg)).composite(layers);
  if (/\.jpe?g$/.test(OUT)) await img.jpeg({ quality: 82, mozjpeg: true }).toFile(OUT); else await img.png().toFile(OUT);
  fs.rmSync(DIR, { recursive: true, force: true });
  console.log('contact sheet: ' + path.relative(process.cwd(), OUT) + ' (' + W + '×' + H + ')' + (problems.length ? '\nPROBLEMS: ' + problems.join(' | ') : ', 0 console errors'));
  process.exitCode = problems.length ? 1 : 0;
})();
