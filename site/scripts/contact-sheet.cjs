// site/scripts/contact-sheet.cjs — the cohesion contact sheet: the site's PhoneDemo next to the real app (dark scheme),
// in the same states: Feed, Bids, Company after ISO 27001 + "We meet it", plus the app's Hohenau detail and the site's
// How-it-works re-score card. Same engine, same data: the numbers and verdicts must match.
//   SITE_URL=http://localhost:3100 APP_URL=file:///…/index.html node scripts/contact-sheet.cjs [out.png]
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const sharp = require('sharp');
const SITE = process.env.SITE_URL || 'http://localhost:3100';
const APP = process.env.APP_URL || 'file://' + path.resolve(__dirname, '../../index.html');
const OUT = path.resolve(process.argv[2] || 'screenshots/cohesion/contact-sheet.png');
const DIR = path.dirname(OUT);
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  // --- site PhoneDemo states ---
  const sctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  const sp = await sctx.newPage();
  await sp.goto(SITE, { waitUntil: 'networkidle' });
  await sp.locator('#app').scrollIntoViewIfNeeded(); await sp.waitForTimeout(600);
  const phone = sp.locator('.phone');
  await sp.click('#dock-tab-0'); await sp.waitForTimeout(600); await phone.screenshot({ path: path.join(DIR, 'site-feed.png') });
  await sp.click('#dock-tab-2'); await sp.waitForTimeout(600);
  await sp.click('.pswitch[aria-checked="false"]'); await sp.waitForTimeout(900);
  await phone.screenshot({ path: path.join(DIR, 'site-company-iso.png') });
  await sp.click('.meet-btn'); await sp.waitForTimeout(900);
  await phone.screenshot({ path: path.join(DIR, 'site-company-go.png') });
  await sp.click('#dock-tab-1'); await sp.waitForTimeout(600); await phone.screenshot({ path: path.join(DIR, 'site-bids.png') });
  await sp.click('#dock-tab-0'); await sp.waitForTimeout(600); await phone.screenshot({ path: path.join(DIR, 'site-feed-after.png') });
  await sp.locator('#how').scrollIntoViewIfNeeded();
  await sp.evaluate(() => document.querySelectorAll('.how-step')[3].scrollIntoView({ block: 'center' })); await sp.waitForTimeout(1200);
  await sp.locator('.how-sticky').screenshot({ path: path.join(DIR, 'site-rescore-card.png') });
  await sctx.close();

  // --- the real app, dark scheme ---
  const actx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', hasTouch: true });
  const ap = await actx.newPage();
  ap.on('dialog', (d) => d.accept());
  await ap.goto(APP + '?demo=reset');
  await ap.waitForSelector('.welcome');
  // onboarded, three tenders saved in the site's stages, ISO 27001 on and Hohenau's open line answered
  await ap.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('tenderscout.v2'));
    s.onboarded = true; s.saved = { 'ell-schools': 'Bidding', 'kal-fibre': 'Deciding', 'hoh-security': 'Deciding' };
    localStorage.setItem('tenderscout.v2', JSON.stringify(s));
  });
  await ap.goto('about:blank'); await ap.goto(APP + '#/feed'); await ap.waitForSelector('.feed-list'); await ap.waitForTimeout(900);
  await ap.screenshot({ path: path.join(DIR, 'app-feed.png') });
  await ap.goto('about:blank'); await ap.goto(APP + '#/company'); await ap.waitForSelector('.co-head'); await ap.waitForTimeout(600);
  await ap.click('button[data-cert="ISO 27001"]'); await ap.waitForSelector('.rescore[data-rescore]'); await ap.waitForTimeout(1000);
  await ap.evaluate(() => window.scrollTo(0, 0)); await ap.waitForTimeout(200);
  await ap.screenshot({ path: path.join(DIR, 'app-company-iso.png') });
  await ap.goto('about:blank'); await ap.goto(APP + '#/t/hoh-security'); await ap.waitForSelector('.vhead.v-maybe', { timeout: 10000 }); await ap.waitForTimeout(400);
  await ap.click('a.req[href="#/t/hoh-security/req/r3"]'); await ap.waitForSelector('#sheet-root.open .sheet'); await ap.waitForTimeout(500);
  await ap.click('.sheet button[data-confirm="pass"]'); await ap.waitForTimeout(900);
  await ap.screenshot({ path: path.join(DIR, 'app-detail-go.png') });
  await ap.goto('about:blank'); await ap.goto(APP + '#/company'); await ap.waitForSelector('.co-head'); await ap.waitForTimeout(900);
  await ap.screenshot({ path: path.join(DIR, 'app-company-go.png') });
  await ap.goto('about:blank'); await ap.goto(APP + '#/bids'); await ap.waitForSelector('.bids-head'); await ap.waitForTimeout(900);
  await ap.screenshot({ path: path.join(DIR, 'app-bids.png') });
  await ap.goto('about:blank'); await ap.goto(APP + '#/feed'); await ap.waitForSelector('.feed-list'); await ap.waitForTimeout(900);
  await ap.screenshot({ path: path.join(DIR, 'app-feed-after.png') });
  await actx.close();
  await browser.close();

  // --- compose: 4 rows × (site | app), labels in the shared type ---
  const rows = [
    ['Feed · tonight', 'site-feed.png', 'app-feed.png', 'Site PhoneDemo (Feed)', 'App #/feed · dark'],
    ['Company · ISO 27001 on → Maybe 90', 'site-company-iso.png', 'app-company-iso.png', 'Site PhoneDemo (Company)', 'App #/company · re-score card'],
    ['“We meet it” → Go 100', 'site-company-go.png', 'app-detail-go.png', 'Site PhoneDemo (Company)', 'App #/t/hoh-security · after the answer'],
    ['Bids · 3 saved', 'site-bids.png', 'app-bids.png', 'Site PhoneDemo (Bids)', 'App #/bids'],
    ['Feed after the re-score · 2 : 2 : 2', 'site-feed-after.png', 'app-feed-after.png', 'Site PhoneDemo (Feed)', 'App #/feed'],
  ];
  const CELL_W = 700, CELL_H = 1420, PAD = 40, LABEL = 110, HEAD = 150;
  const W = PAD * 3 + CELL_W * 2, H = HEAD + rows.length * (CELL_H + LABEL + PAD) + PAD;
  const layers = [];
  const fit = async (file, w, h) => sharp(path.join(DIR, file)).resize(w, h, { fit: 'inside', background: '#02040A' }).png().toBuffer();
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#02040A"/>` +
    `<text x="${PAD}" y="64" fill="#FFFFFF" font-family="Hanken Grotesk, Arial, sans-serif" font-size="40" font-weight="800">TenderScout · site PhoneDemo vs real app</text>` +
    `<text x="${PAD}" y="104" fill="#A3ADBD" font-family="Hanken Grotesk, Arial, sans-serif" font-size="18">Same decision rules, same data, same tokens · dark scheme · all companies and tenders are fictional · ${new Date().toISOString().slice(0, 10)}</text>`;
  for (let i = 0; i < rows.length; i++) {
    const [title, sFile, aFile, sLabel, aLabel] = rows[i];
    const y = HEAD + i * (CELL_H + LABEL + PAD);
    svg += `<text x="${PAD}" y="${y + 36}" fill="#FFFFFF" font-family="Hanken Grotesk, Arial, sans-serif" font-size="30" font-weight="700">${esc(title)}</text>`;
    svg += `<text x="${PAD}" y="${y + 74}" fill="#8A93A3" font-family="Hanken Grotesk, Arial, sans-serif" font-size="16">${esc(sLabel)}</text>`;
    svg += `<text x="${PAD * 2 + CELL_W}" y="${y + 74}" fill="#8A93A3" font-family="Hanken Grotesk, Arial, sans-serif" font-size="16">${esc(aLabel)}</text>`;
    const s = await fit(sFile, CELL_W, CELL_H), a = await fit(aFile, CELL_W, CELL_H);
    const sm = await sharp(s).metadata(), am = await sharp(a).metadata();
    layers.push({ input: s, left: PAD + Math.round((CELL_W - sm.width) / 2), top: y + LABEL });
    layers.push({ input: a, left: PAD * 2 + CELL_W + Math.round((CELL_W - am.width) / 2), top: y + LABEL });
  }
  svg += '</svg>';
  await sharp(Buffer.from(svg)).composite(layers).png().toFile(OUT);
  console.log('contact sheet: ' + OUT + ' (' + W + '×' + H + ')');
})();
