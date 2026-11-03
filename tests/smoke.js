/*
 * Playwright smoke test at 390×844, light and dark. Dev-only: the app itself has no dependencies.
 *
 *   node tests/smoke.js [screenshot-dir]          (needs Playwright + Chromium installed)
 *   SMOKE_URL=http://localhost:8000/ node tests/smoke.js   (test a server instead of file://)
 *
 * Path (CLAUDE.md §8.6 + the BRIEF.md 75-second demo):
 * welcome → reading → profile → feed → Go detail → requirement sheet → Hohenau detail →
 * "comparable qualification" sheet (Escape / scrim / Back close it) → "We meet it" →
 * Ask this tender → Company → ISO 27001 → re-score "Landkreis Hohenau: No-go → Go" →
 * feed → skip the Dutch libraries tender with a reason → save a tender → Bids → About.
 * Plus: ISO 27001 alone says "No-go → Maybe", closed (?today=), empty Bids, offline, not found, deep link.
 * Fails on any console error, page error or failed request.
 */
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.SMOKE_URL || 'file://' + ROOT + '/index.html';
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'screenshots'));
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(cond, msg) { if (cond) console.log('  ok   ' + msg); else { failures++; console.log('  FAIL ' + msg); } }

async function run(scheme) {
  console.log('\n== ' + scheme + ' · ' + BASE);
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, hasTouch: true });
  const problems = [];
  ctx.on('page', (p) => watch(p, problems));
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  let n = 0;
  const shot = async (name, full) => {
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT, `${scheme}-${String(++n).padStart(2, '0')}-${name}.png`), fullPage: !!full });
  };
  const url = (q, hash) => BASE + (q ? '?' + q : '') + (hash || '');
  const load = async (q, hash) => { await page.goto('about:blank'); await page.goto(url(q, hash)); }; // a real page load, not a same-document hash change
  const text = (sel) => page.locator(sel).first().innerText();
  const sheetOpen = () => page.locator('#sheet-root.open [role="dialog"][aria-modal="true"]').count();
  const waitSheet = async (open) => { await page.waitForFunction((o) => !!document.querySelector('#sheet-root.open') === o, open); await page.waitForTimeout(360); };

  // 01–03 Onboarding
  await page.goto(url('demo=reset'));
  await page.waitForSelector('.welcome-hero');
  check(!(await page.locator('.dock').count()), 'no dock during onboarding');
  await shot('welcome');
  await page.click('button[data-act="draft"]');
  await page.waitForSelector('#rd-steps .step');
  check(await page.locator('.ai-pill').count() > 0, 'reading screen shows the Simulated AI pill');
  await page.waitForSelector('#rd-steps .step.done:nth-child(2)');
  await shot('reading');
  await page.waitForSelector('text=Check your profile', { timeout: 10000 });
  check((await text('.profile-card')).includes('(fictional)'), 'profile keeps "(fictional)" on the company name');
  await shot('check-profile');

  // 04 Feed
  await page.click('button[data-act="finish"]');
  await page.waitForSelector('.vtiles');
  check((await text('.feed-head')).includes('Thu 5 Nov · read overnight'), 'feed date line "Thu 5 Nov · read overnight"');
  check((await text('.feed-head h1')) === '6 new tenders', 'feed title "6 new tenders"');
  const tiles = await page.locator('.vtile .count').allInnerTexts();
  check(tiles.join(',') === '1,2,3', 'summary tiles 1 Go · 2 Maybe · 3 No-go');
  check((await text('.pages-line')).includes('Read 777 pages in 4 languages'), 'pages line');
  check((await text('.seg.filter')).replace(/\s+/g, ' ').includes('All 6 Go 1 Maybe 2 No-go 3'), 'filter labels with counts');
  check(!(await text('.feed-list')).includes('(fictional)'), 'bare buyer names on cards');
  check((await text('.screen')).includes('All buyers and tenders are fictional'), 'fictional line on Feed');
  check(await page.locator('.dock a[aria-current="page"] span:not(.ms)').innerText() === 'Feed', 'dock shows Feed active');
  await shot('feed');

  // Filter
  await page.click('.seg.filter [data-filter="maybe"]');
  check(await page.locator('.feed-list .tcard').count() === 2, 'Maybe filter shows 2 cards');
  await page.click('.seg.filter [data-filter="all"]');

  // 05 Go tender + requirement sheet (BRIEF step 3)
  await page.click('a.tcard[href="#/t/ell-schools"]');
  await page.waitForSelector('.vblock.loading');
  check((await text('.vblock.loading')).includes('Reading 146 pages (German)'), 'loading state "Reading 146 pages (German)…"');
  await shot('detail-loading');
  await page.waitForSelector('.vblock.v-go', { timeout: 8000 });
  check(!(await page.locator('.dock').count()), 'no dock on detail');
  check((await text('.vblock')).includes('You meet all 4 requirements'), 'Go header reason');
  await shot('detail-go');
  await page.click('a.req[href="#/t/ell-schools/req/r1"]');
  await waitSheet(true);
  check(await sheetOpen() === 1, 'requirement sheet is a modal dialog');
  check((await text('.sheet')).includes('ORIGINAL · GERMAN') || (await text('.sheet .quote-tag')).toUpperCase().includes('ORIGINAL · GERMAN'), 'quote card tag "ORIGINAL · GERMAN"');
  check(await page.locator('.sheet blockquote[lang="de"] mark').count() === 1, 'quote has lang="de" and a highlighted phrase');
  await shot('sheet-go');
  await page.goBack(); // system Back closes the sheet to its parent
  await waitSheet(false);
  check(page.url().endsWith('#/t/ell-schools'), 'Back closes the sheet to the detail');
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.vtiles');
  check(page.url().endsWith('#/feed'), 'detail ‹ returns to the Feed');

  // 06 Hohenau: open check, Escape and scrim close the sheet, then "We meet it" (BRIEF step 4)
  await page.click('a.tcard[href="#/t/hoh-security"]');
  await page.waitForSelector('.vblock.v-nogo', { timeout: 8000 });
  check((await text('.vblock')).includes('1 knock-out requirement: you don’t hold ISO 27001. One more needs your answer.'), 'No-go header reason');
  check((await text('.sec-h .aside')) === '1 of 3 met', '"1 of 3 met"');
  const order = await page.locator('a.req .status-line b').allInnerTexts();
  check(order.join(' > ') === 'Fails > Needs your check > Meets', 'requirement order fail → check → met');
  await shot('detail-nogo');
  await shot('detail-nogo-full', true);
  const reqSel = 'a.req[href="#/t/hoh-security/req/r3"]';
  await page.click(reqSel); await waitSheet(true);
  await page.keyboard.press('Escape'); await waitSheet(false);
  check(page.url().endsWith('#/t/hoh-security'), 'Escape closes the sheet');
  await page.click(reqSel); await waitSheet(true);
  await page.mouse.click(195, 30); await waitSheet(false); // scrim, above the sheet
  check(page.url().endsWith('#/t/hoh-security'), 'scrim tap closes the sheet');
  await page.click(reqSel); await waitSheet(true);
  check(await page.locator('.sheet .btn-check').count() === 2, 'unresolved sheet: both buttons outlined in check, none preselected');
  check((await text('.sheet .confidence')).includes('58%'), 'confidence readout 58%');
  await shot('sheet-check');
  await page.click('.sheet button[data-confirm="pass"]');
  await waitSheet(false);
  check(page.url().endsWith('#/t/hoh-security'), '"We meet it" closes the sheet');
  check((await text('#toast-root')).includes('Answer saved · now No-go'), 'toast: answer saved, still No-go');
  check((await text('.vblock')).includes('1 knock-out requirement: you don’t hold ISO 27001.'), 'still No-go until ISO 27001');

  // Ask this tender (BRIEF step 6)
  await page.click('button[data-ask="0"]');
  await page.waitForSelector('#ans-0 .cite-chip', { timeout: 5000 });
  check((await text('#ans-0')).includes('Vergabeunterlagen p. 12'), 'answer has a citation chip with the page');
  await shot('ask');

  // 09 Company: ISO 27001 → Hohenau No-go → Go (BRIEF step 5, the hero moment)
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.vtiles');
  await page.click('.dock a[href="#/company"]');
  await page.waitForSelector('.co-head');
  const hint = await page.locator('[data-hint="cert:ISO 27001"]').innerText();
  check(hint.includes('Turn on → Landkreis Hohenau becomes Go'), 'impact hint before toggling: ' + hint);
  check((await page.locator('[data-hint="cert:VCA"]').innerText()).includes('Gemeente Vlietdam becomes Maybe'), 'VCA hint: Vlietdam becomes Maybe');
  await shot('company');
  await page.click('button[data-cert="ISO 27001"]');
  await page.waitForSelector('.rescore[data-rescore]');
  await page.waitForTimeout(700);
  const sr = await page.locator('#rescore .sr-only').innerText();
  check(sr.startsWith('Landkreis Hohenau: No-go → Go'), 're-score card: "' + sr + '"');
  check((await page.locator('#rescore .change-row').innerText()).replace(/\s+/g, ' ').includes('No-go → Go'), 'visible chips No-go → Go');
  check(await page.locator('button[data-cert="ISO 27001"][aria-checked="true"]').count() === 1, 'switch is on (role=switch, aria-checked)');
  check((await page.locator('#co-tiles b').allInnerTexts()).join(',') === '2,2,2', 'company tiles re-flex to 2 : 2 : 2');
  check((await page.locator('[data-hint="cert:ISO 27001"]').innerText()).includes('Unlocked Landkreis Hohenau'), 'hint becomes "Unlocked Landkreis Hohenau"');
  await page.evaluate(() => window.scrollTo(0, 0)); // show the re-score card
  await shot('company-rescore');

  // Feed after the change
  await page.click('.dock a[href="#/feed"]');
  await page.waitForSelector('.vtiles');
  check((await page.locator('.vtile .count').allInnerTexts()).join(',') === '2,2,2', 'feed tiles 2 · 2 · 2');
  check(await page.locator('a.tcard[href="#/t/hoh-security"].v-go').count() === 1, 'Hohenau card is now Go');
  await shot('feed-after');

  // 07 Skip the Dutch libraries tender with a reason (BRIEF step 7)
  await page.click('a.tcard[href="#/t/vli-libraries"]');
  await page.waitForSelector('.vblock.on-solid', { timeout: 8000 });
  await page.click('button[data-go="#/t/vli-libraries/skip"]');
  await waitSheet(true);
  await page.click('.chip[data-skip="Missing a certificate"]');
  check(await page.locator('.chip[data-skip="Missing a certificate"][aria-pressed="true"]').count() === 1, 'skip reason chip selected');
  await shot('skip-sheet');
  await page.click('button[data-act="skip-confirm"]');
  await page.waitForSelector('.vtiles');
  await page.waitForTimeout(400);
  check(page.url().endsWith('#/feed'), 'skip returns to the Feed');
  check(await page.locator('a.tcard[href="#/t/vli-libraries"]').count() === 0, 'skipped card is gone');
  check((await text('#toast-root')).includes('Skipped. Reason saved.'), 'toast "Skipped. Reason saved."');
  await shot('feed-skipped');

  // Save a tender, then Bids
  await page.click('a.tcard[href="#/t/ell-schools"]');
  await page.waitForSelector('.vblock.v-go', { timeout: 8000 });
  await page.click('button[data-act="save"]');
  await page.waitForSelector('.btn-tonal');
  check((await text('.btn-tonal')).includes('In Bids · Deciding'), 'Save becomes "In Bids · Deciding"');
  check((await text('#toast-root')).includes('Saved to Bids'), 'toast "Saved to Bids"');
  await shot('saved');
  await page.click('button[data-act="back"]');
  await page.click('.dock a[href="#/bids"]');
  await page.waitForSelector('.bids-head');
  check((await text('.bids-head .sub')).includes('1 saved · next deadline in 29 days'), 'Bids sub line');
  check((await text('.skipped')).includes('Missing a certificate'), 'skipped row shows the reason');
  await page.click('button[data-stage="Bidding"][data-id="ell-schools"]');
  check(await page.locator('button[data-stage="Bidding"][data-id="ell-schools"][aria-checked="true"]').count() === 1, 'stage switch to Bidding');
  check((await text('.screen')).includes('All buyers and tenders are fictional'), 'fictional line on Bids');
  await shot('bids');

  // 10 About
  await page.click('.nav button[data-go="#/about"]');
  await page.waitForSelector('.about-row');
  check((await text('.screen')).includes('AI output is simulated') && (await text('.screen')).includes('All data is fictional') && (await text('.screen')).includes('Built with AI assistance'), 'About explains simulated / real / fictional / AI-assisted');
  await shot('about');

  // Deep link after onboarding
  await load('', '#/t/kal-fibre');
  await page.waitForSelector('.vblock.v-maybe', { timeout: 8000 });
  check((await text('.vblock')).includes('No knock-outs, but 2 risks: short by 1 reference, mandatory site visit.'), 'deep link #/t/kal-fibre works (Maybe, dark text on amber)');
  await shot('detail-maybe');

  // Closed state (test-only ?today=)
  await page.goto(url('today=2026-12-23', '#/t/ell-schools'));
  await page.waitForSelector('.vblock.v-closed', { timeout: 8000 });
  check((await text('.vblock')).includes('The deadline passed on 4 Dec.'), 'closed header');
  check(await page.locator('.action-bar button[disabled]').count() === 1 && (await text('.action-bar')).includes('Closed tenders can’t be saved'), 'Save disabled with lock line');
  await shot('detail-closed');
  await page.goto(url('today=2026-12-23', '#/feed'));
  await page.waitForSelector('.tcard.is-closed');
  await shot('feed-closed');

  // Offline banner and not found
  await page.goto(url('offline=1', '#/feed'));
  await page.waitForSelector('.banner');
  await shot('feed-offline');
  await load('', '#/nope');
  await page.waitForSelector('text=Page not found');
  await shot('not-found');

  // Empty Bids and the honest "ISO 27001 alone" case, from a reset
  await page.goto(url('demo=reset'));
  await page.waitForSelector('.welcome-hero');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tenderscout.v2')); s.onboarded = true; localStorage.setItem('tenderscout.v2', JSON.stringify(s)); });
  await load('', '#/bids');
  await page.waitForSelector('text=No bids yet');
  await shot('bids-empty');
  await load('', '#/company');
  await page.waitForSelector('.co-head');
  check((await page.locator('[data-hint="cert:ISO 27001"]').innerText()).includes('Landkreis Hohenau becomes Maybe'), 'without the answer the hint says Maybe');
  await page.click('button[data-cert="ISO 27001"]');
  await page.waitForSelector('.rescore[data-rescore]');
  check((await page.locator('#rescore .sr-only').innerText()).startsWith('Landkreis Hohenau: No-go → Maybe'), 'ISO 27001 alone: re-score card says No-go → Maybe');
  await page.evaluate(() => window.scrollTo(0, 0)); // show the re-score card
  await shot('company-iso-alone');

  // Touch targets: interactive elements smaller than 44 px (pseudo-element hit areas are not measured here)
  const small = await page.evaluate(() => Array.from(document.querySelectorAll('button, a, input, [role="switch"]'))
    .map((el) => { const r = el.getBoundingClientRect(); return { el: el.outerHTML.slice(0, 60), w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter((x) => x.w && x.h && (x.w < 44 || x.h < 44)));
  console.log('  info elements under 44 px on Company (box only): ' + JSON.stringify(small));

  check(problems.length === 0, 'no console errors, page errors or failed requests' + (problems.length ? ':\n       ' + problems.join('\n       ') : ''));
  await browser.close();
}

function watch(page, problems) {
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url() + ' ' + ((r.failure() || {}).errorText || '')));
}

(async () => {
  try { await run('light'); await run('dark'); }
  catch (e) { failures++; console.error('\nCrashed: ' + (e && e.stack || e)); }
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'Smoke test passed') + ' · screenshots in ' + OUT);
  process.exitCode = failures ? 1 : 0;
})();
