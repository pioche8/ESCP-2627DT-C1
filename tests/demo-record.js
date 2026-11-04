/*
 * tests/demo-record.js — records the BRIEF.md demo path as the backup for the workshop (if the phone or the Wi-Fi fails).
 * Dev-only: needs Playwright + Chromium and ffmpeg. The app itself has no dependencies.
 *
 *   node tests/demo-record.js                                   → docs/demo/demo-path-390x844.mp4 + docs/demo/step-N-*.png
 *   DEMO_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node tests/demo-record.js   (record the live site instead of file://)
 *
 * 390×844, deviceScaleFactor 2 (780×1688 video and PNGs), dark scheme, ?demo=reset,fast, 2.5 s hold on every screen.
 * The seven steps are the ones in BRIEF.md ("75-second demo"); one PNG is taken at the moment each step's sentence lands.
 * Playwright's own recordVideo captures at 1× whatever the deviceScaleFactor, so the video is made from device-pixel
 * screenshots sampled over the DevTools protocol (about 12–20 per second) and assembled by ffmpeg at a constant 25 fps
 * (each tick shows the latest frame). Nothing in the app changes for the recording.
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
let playwright;
try { playwright = require('playwright'); } catch (e) { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.DEMO_URL || 'file://' + ROOT + '/index.html';
const OUT = path.join(ROOT, 'docs', 'demo');
const TMP = path.join(require('os').tmpdir(), 'tenderscout-demo-' + process.pid);
const HOLD = +(process.env.DEMO_HOLD || 2500);
const W = 390, H = 844, DSF = 2;
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

(async () => {
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DSF, hasTouch: true, isMobile: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  // Frame sampler: device-pixel JPEGs over CDP, at most 25 per second, for as long as `recording` is true. It starts
  // after the first paint (a screenshot request on about:blank never returns) and every request has a timeout, so a
  // stalled frame can never hang the script.
  const cdp = await ctx.newCDPSession(page);
  const frames = []; // { t (ms since t0), file }
  const t0 = Date.now();
  let recording = false, sampler = Promise.resolve();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const startSampling = () => {
    recording = true;
    sampler = (async () => {
      let i = 0;
      while (recording) {
        const tick = Date.now();
        try {
          const r = await Promise.race([cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, fromSurface: true, optimizeForSpeed: true }), sleep(2000)]);
          if (r && r.data) {
            const file = path.join(TMP, 'f' + String(i++).padStart(5, '0') + '.jpg');
            fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
            frames.push({ t: Date.now() - t0, file });
          }
        } catch (e) { /* mid-navigation: try again */ }
        const left = 40 - (Date.now() - tick); if (left > 0) await sleep(left);
      }
    })();
  };
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
  const hold = (ms) => page.waitForTimeout(ms == null ? HOLD : ms);
  const png = (n, name) => page.screenshot({ path: path.join(OUT, 'step-' + n + '-' + name + '.png') });
  const waitSheet = async (open) => { await page.waitForFunction((o) => !!document.querySelector('#sheet-root.open') === o, open); await page.waitForTimeout(360); };

  // 1 Welcome → Draft my profile → reading → Looks right
  await page.goto(BASE + '?demo=reset,fast&theme=dark');
  await page.waitForSelector('.welcome');
  const firstPaint = Date.now() - t0;
  startSampling();
  await hold(); await png(1, 'welcome');
  await page.click('button[data-act="draft"]');
  await page.waitForSelector('text=Check your profile', { timeout: 10000 });
  await hold();
  await page.click('button[data-act="finish"]');

  // 2 Feed
  await page.waitForSelector('.feed-list');
  await page.waitForFunction(() => document.querySelector('.pages-line').innerText.includes('777'), null, { timeout: 5000 });
  await hold(); await png(2, 'feed');

  // 3 Go tender → qualification check → a line → original sentence + translation + page
  await page.click('a.tcard[href="#/t/ell-schools"]');
  await page.waitForSelector('.vhead.v-go', { timeout: 8000 });
  await hold();
  await page.click('a.req[href="#/t/ell-schools/req/r1"]');
  await waitSheet(true);
  await hold(); await png(3, 'go-tender-citation');
  await page.goBack(); // the phone's Back closes the sheet to the detail
  await waitSheet(false);
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.feed-list');
  await hold(1000);

  // 4 Hohenau (No-go): missing ISO 27001 + the unclear line → sheet → We meet it
  await page.click('a.tcard[href="#/t/hoh-security"]');
  await page.waitForSelector('.vhead.v-nogo', { timeout: 8000 });
  await hold();
  await page.click('a.req[href="#/t/hoh-security/req/r3"]');
  await waitSheet(true);
  await hold(); await png(4, 'hohenau-needs-your-check');
  await page.click('.sheet button[data-confirm="pass"]');
  await waitSheet(false);
  await hold();

  // 5 Company → ISO 27001 → "Landkreis Hohenau: No-go → Go"
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.feed-list');
  await page.click('.tabbar a[href="#/company"]');
  await page.waitForSelector('.co-head');
  await hold();
  await page.click('button[data-cert="ISO 27001"]');
  await page.waitForSelector('.rescore[data-rescore]');
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await hold(); await png(5, 'company-rescore');

  // 6 Ask this tender → "Can we subcontract?" → answer with the page
  await page.click('.tabbar a[href="#/feed"]');
  await page.waitForSelector('.feed-list');
  await page.click('a.tcard[href="#/t/hoh-security"]');
  await page.waitForSelector('.vhead.v-go', { timeout: 8000 });
  await page.locator('#asks').scrollIntoViewIfNeeded();
  await hold(800);
  await page.click('button[data-ask="0"]');
  await page.waitForSelector('#ans-0 .cite', { timeout: 5000 });
  await hold(); await png(6, 'ask-this-tender');

  // 7 Skip the Dutch libraries tender with "Missing a certificate" → Bids
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.feed-list');
  await page.click('a.tcard[href="#/t/vli-libraries"]');
  await page.waitForSelector('.vhead.v-nogo', { timeout: 8000 });
  await hold(1200);
  await page.click('button[data-go="#/t/vli-libraries/skip"]');
  await waitSheet(true);
  await page.click('.opt[data-skip="Missing a certificate"]');
  await hold();
  await page.click('button[data-act="skip-confirm"]');
  await page.waitForSelector('.feed-list');
  await hold();
  await page.click('.tabbar a[href="#/bids"]');
  await page.waitForSelector('.bids-head');
  await hold(); await png(7, 'bids');
  await hold(1000);

  recording = false; await Promise.race([sampler, sleep(3000)]);
  if (!frames.length) throw new Error('no frames were sampled');
  await ctx.close();
  await browser.close();

  // Frames → H.264 MP4 at a constant 25 fps (yuv420p so iOS, QuickTime and PowerPoint play it). The video starts at the
  // first paint of Welcome; every 40 ms tick shows the most recent sampled frame.
  const FPS = 25, tick = 1000 / FPS;
  const start = Math.max(0, firstPaint - 100), end = frames[frames.length - 1].t;
  const list = [];
  let k = 0;
  for (let t = start; t <= end; t += tick) {
    while (k + 1 < frames.length && frames[k + 1].t <= t) k++;
    list.push("file '" + frames[k].file.replace(/'/g, "'\\''") + "'\nduration " + (tick / 1000).toFixed(4));
  }
  list.push("file '" + frames[frames.length - 1].file + "'"); // concat demuxer: repeat the last file so its duration counts
  const listFile = path.join(TMP, 'frames.txt');
  fs.writeFileSync(listFile, list.join('\n') + '\n');
  const mp4 = path.join(OUT, 'demo-path-390x844.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22',
    '-pix_fmt', 'yuv420p', '-vf', 'scale=' + (W * DSF) + ':' + (H * DSF) + ':flags=lanczos', '-r', String(FPS), '-movflags', '+faststart', '-an', mp4], { stdio: 'inherit' });
  fs.rmSync(TMP, { recursive: true, force: true });
  const mb = fs.statSync(mp4).size / 1048576;
  console.log('video   ' + path.relative(ROOT, mp4) + ' · ' + mb.toFixed(1) + ' MB · ' + frames.length + ' sampled frames over ' + ((end - start) / 1000).toFixed(1) + ' s (' + (frames.length / ((end - start) / 1000)).toFixed(0) + ' per second)');
  fs.readdirSync(OUT).filter((f) => /^step-\d-.*\.png$/.test(f)).sort().forEach((f) => console.log('png     docs/demo/' + f));
  if (problems.length) { console.error('Problems during the recording:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
  if (mb >= 10) { console.error('The video is ' + mb.toFixed(1) + ' MB (limit 10 MB)'); process.exitCode = 1; }
})().catch((e) => { console.error(e); process.exitCode = 1; });
