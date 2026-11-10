// Renders marketing/reel-overlay.html to a transparent 1080 × 1920 PNG for marketing/encode.sh (pass 8).
//   node marketing/render-overlay.js <out.png>
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'reel-overlay.html')); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: process.argv[2] || 'reel-overlay.png', omitBackground: true }); await b.close();
})();
