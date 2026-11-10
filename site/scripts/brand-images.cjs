// site/scripts/brand-images.cjs — the Open Graph image, the favicon and the touch icons, rendered from shared/tokens.json
// (5 Nov 2026). One of the nine colours as ground, the wordmark with its brand dot, the one-line pitch, one typeface.
//   node scripts/brand-images.cjs            writes src/app/opengraph-image.png (1200×630), src/app/icon.png (192),
//                                            src/app/apple-icon.png (180) and public/icon-512.png
// Playwright renders the HTML (pre-installed in the dev container; not a site dependency). `prebuild` runs this when
// Playwright is present and keeps the committed files otherwise, like the photos. The HTML is deterministic, so the
// output only changes when the tokens, the fonts or the pitch change.
const fs = require('node:fs');
const path = require('node:path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { console.log('brand-images: Playwright not installed, keeping the committed images'); process.exit(0); }

const site = path.resolve(__dirname, '..');
const T = JSON.parse(fs.readFileSync(path.resolve(site, '..', 'shared', 'tokens.json'), 'utf8'));
const scheme = T.color.themes[T.color.site];
const font = fs.readFileSync(path.join(site, 'src/fonts/HankenGrotesk-normal-400to800-latin.woff2')).toString('base64');
const PITCH = 'Public tenders you can actually win, read for you overnight.';
const HONESTY = 'University prototype · real rules, fictional companies and tenders';

const css = `@font-face{font-family:H;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:400 800}
*{margin:0;padding:0;box-sizing:border-box}html,body{background:${scheme.bg};color:${scheme.ink};font-family:H,system-ui,sans-serif;font-variant-numeric:tabular-nums}`;
const og = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
body{width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;padding:72px 80px}
.wm{display:flex;align-items:center;gap:18px;font-weight:800;font-size:44px;line-height:1}.dot{width:22px;height:22px;border-radius:50%;background:${scheme.brand}}
h1{font-weight:800;font-size:84px;line-height:1.02;max-width:1000px;letter-spacing:0}.meta{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;font-weight:500;font-size:24px;color:${scheme.muted}}
.v{display:flex;gap:28px;font-weight:700;font-size:26px}.v span{display:inline-flex;align-items:center;gap:10px}.go{color:${scheme.go}}.maybe{color:${scheme.maybe}}.nogo{color:${scheme.nogo}}
.s{display:inline-block;width:14px;height:14px;background:currentColor}.go .s{border-radius:50%}.maybe .s{clip-path:polygon(50% 0,100% 100%,0 100%)}.nogo .s{border-radius:1px}
</style></head><body><div class="wm"><span class="dot"></span>TenderScout</div><h1>${PITCH}</h1><div class="meta"><div class="v"><span class="go"><i class="s"></i>Go</span><span class="maybe"><i class="s"></i>Maybe</span><span class="nogo"><i class="s"></i>No-go</span></div><div>${HONESTY}</div></div></body></html>`;
const icon = (size) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}
body{width:${size}px;height:${size}px;display:grid;place-items:center;border-radius:${Math.round(size * 0.18)}px;overflow:hidden}
.t{position:relative;font-weight:800;font-size:${Math.round(size * 0.62)}px;line-height:1;color:${scheme.ink}}.dot{position:absolute;right:${-Math.round(size * 0.14)}px;bottom:${Math.round(size * 0.04)}px;width:${Math.round(size * 0.17)}px;height:${Math.round(size * 0.17)}px;border-radius:50%;background:${scheme.brand}}
</style></head><body><div class="t">T<span class="dot"></span></div></body></html>`;

(async () => {
  const browser = await chromium.launch();
  const shots = [
    ['src/app/opengraph-image.png', og, 1200, 630],
    ['src/app/icon.png', icon(192), 192, 192],
    ['src/app/apple-icon.png', icon(180), 180, 180],
    ['public/icon-512.png', icon(512), 512, 512],
  ];
  for (const [out, html, w, h] of shots) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const abs = path.join(site, out);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    await page.screenshot({ path: abs, type: 'png', omitBackground: false });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(site, 'src/app/opengraph-image.alt.txt'), 'TenderScout: ' + PITCH + ' Go, Maybe, No-go. ' + HONESTY + '.\n');
  console.log('brand-images: ' + shots.map((s) => s[0]).join(', ') + ' from tokens ' + T.version + ' (' + T.color.site + ' scheme)');
})();
