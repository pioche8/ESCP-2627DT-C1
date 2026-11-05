/*
 * Playwright smoke test at 390×844, light and dark, plus prefers-reduced-motion.
 * Dev-only: the app itself has no dependencies.
 *
 *   node tests/smoke.js [screenshot-dir]          (needs Playwright + Chromium installed)
 *   SMOKE_URL=http://localhost:8000/ node tests/smoke.js   (test a server instead of file://)
 *   SMOKE_ONLY=light node tests/smoke.js          (one scheme while developing)
 *   SMOKE_BROWSER=webkit SMOKE_DEVICE="iPhone 13" node tests/smoke.js   (Safari engine with a Playwright device profile; also "iPhone SE")
 *
 * Path (CLAUDE.md §8.6 + the BRIEF.md 75-second demo):
 * welcome → reading → profile → feed → Go detail → requirement sheet → Hohenau detail →
 * "comparable qualification" sheet (Escape / scrim / Back close it) → "We meet it" →
 * Ask this tender → Company → ISO 27001 → re-score "Landkreis Hohenau: No-go → Go" →
 * feed → skip the Dutch libraries tender with a reason → save a tender → Bids → About.
 * Plus: ISO 27001 alone says "No-go → Maybe", closed (?today=), empty Bids, offline, not found, deep link, the appearance
 * switch on About (persisted), and under prefers-reduced-motion the instant reveal and count-up and no morph.
 * Every screen is scanned (tests/declutter-scan.js) for the 18 declutter patterns: negative tracking, uppercase, italics,
 * gradients, grain, monospace, borders, shadows, radius over 8 px, alpha colours, eyebrows, numbering, all-caps text,
 * pills / chips / tags / badges and code names in visible text. Fails on any console error, page error or failed request.
 */
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(2); }
const { scanCss, scanDom } = require('./declutter-scan');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.SMOKE_URL || 'file://' + ROOT + '/index.html';
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'screenshots'));
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(cond, msg) { if (cond) console.log('  ok   ' + msg); else { failures++; console.log('  FAIL ' + msg); } }

const BROWSER = process.env.SMOKE_BROWSER || 'chromium';
const DEVICE = process.env.SMOKE_DEVICE ? playwright.devices[process.env.SMOKE_DEVICE] : null;
if (process.env.SMOKE_DEVICE && !DEVICE) { console.error('Unknown device ' + process.env.SMOKE_DEVICE); process.exit(2); }
const contextOptions = (extra) => ({ ...(DEVICE || { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }), ...extra });

async function run(scheme) {
  console.log('\n== ' + scheme + ' · ' + BROWSER + (DEVICE ? ' · ' + process.env.SMOKE_DEVICE : '') + ' · ' + BASE);
  const browser = await playwright[BROWSER].launch();
  const ctx = await browser.newContext(contextOptions({ colorScheme: scheme }));
  const VW = (DEVICE ? DEVICE.viewport : { width: 390, height: 844 }).width, VH = (DEVICE ? DEVICE.viewport : { width: 390, height: 844 }).height;
  const problems = [];
  ctx.on('page', (p) => watch(p, problems));
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  let n = 0;
  const tag = scheme + (DEVICE ? '-' + process.env.SMOKE_DEVICE.replace(/\s+/g, '').toLowerCase() : '') + (BROWSER !== 'chromium' ? '-' + BROWSER : '');
  const shot = async (name, full) => {
    await page.waitForTimeout(450);
    await page.screenshot({ path: path.join(OUT, `${tag}-${String(++n).padStart(2, '0')}-${name}.png`), fullPage: !!full });
  };
  const url = (q, hash) => BASE + (q ? '?' + q : '') + (hash || '');
  const load = async (q, hash) => { await page.goto('about:blank'); await page.goto(url(q, hash)); }; // a real page load, not a same-document hash change
  const text = (sel) => page.locator(sel).first().innerText();
  const sheetOpen = () => page.locator('#sheet-root.open [role="dialog"][aria-modal="true"]').count();
  const waitSheet = async (open) => { await page.waitForFunction((o) => !!document.querySelector('#sheet-root.open') === o, open); await page.waitForTimeout(360); };
  const css = (sel, prop) => page.locator(sel).first().evaluate((el, p) => getComputedStyle(el)[p], prop);
  const token = (name) => page.evaluate((k) => getComputedStyle(document.documentElement).getPropertyValue(k).trim(), name);
  const rgb = (hex) => { const h = hex.replace('#', ''); return 'rgb(' + [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')'; };
  const scanned = [];
  const scan = async (name) => { const v = await scanDom(page); scanned.push(...v.map((x) => name + ': ' + x.pattern + ' · ' + x.el + (x.extra ? ' · ' + x.extra : '') + (x.text ? ' · "' + x.text + '"' : ''))); };

  // 01–03 Onboarding
  await page.goto(url('demo=reset&theme=' + scheme));
  await page.waitForSelector('.welcome');
  check(await page.evaluate(() => document.documentElement.getAttribute('data-scheme')) === scheme, 'html carries data-scheme="' + scheme + '" (?theme= deep link)');
  // ?demo=reset must leave a fresh tenderscout.v2 behind (every live run starts clean) and drop "reset" from the address
  const freshState = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('tenderscout.v2')); } catch (e) { return null; } });
  check(freshState && freshState.onboarded === false && Object.keys(freshState.overrides).length === 0 && Object.keys(freshState.saved).length === 0 && Object.keys(freshState.skipped).length === 0 && freshState.profile.certifications.join() === 'ISO 9001', '?demo=reset writes a fresh tenderscout.v2 (not onboarded, no answers, saved or skipped tenders, demo profile)');
  check(!page.url().includes('demo=') && page.url().endsWith('#/welcome/1'), '?demo=reset is removed from the address (a reload does not reset again)');
  check(!(await page.locator('.tabbar').count()), 'no tab bar during onboarding');
  check(await page.locator('.welcome img.photo').count() === 1 && await page.locator('.welcome img.photo').evaluate((el) => el.closest('h1, p, .btn') === null), 'welcome photo sits in its own block, no text on it');
  check((await text('.welcome-copy')).includes('Find public tenders you can actually win') && (await text('.welcome-copy')).includes('All 45 EU sectors · 6 new tenders tonight'), 'headline and the sector line (derived from the data)');
  check((await text('.welcome')).includes('all companies and tenders are fictional'), 'fictional line on Welcome');
  check(await css('.welcome .field', 'borderStyle') === 'none' && await css('.btn-primary', 'borderRadius') === '8px', 'input has no border; the primary button is a plain 8 px rectangle');
  check(await css('.btn-primary', 'backgroundColor') === rgb(await token('--c-brand')), 'primary button is the brand colour');
  const gap = await page.evaluate(() => document.querySelector('.welcome-form').getBoundingClientRect().top - document.querySelector('.welcome-copy').getBoundingClientRect().bottom);
  check(gap >= 8 && gap <= 40, 'the website field sits directly under the subtitle (gap ' + Math.round(gap) + ' px, no dead space)');
  await scan('welcome'); await shot('welcome');
  await page.click('button[data-act="draft"]');
  await page.waitForSelector('#rd-steps .step');
  check(await page.locator('.ai').count() > 0, 'reading screen shows "Simulated AI"');
  await page.waitForSelector('#rd-steps .step.done:nth-child(2)');
  await scan('reading'); await shot('reading');
  await page.waitForSelector('text=Check your profile', { timeout: 10000 });
  check((await text('.profile-card')).includes('(fictional)'), 'profile keeps "(fictional)" on the company name');
  await scan('profile'); await shot('check-profile');

  // 04 Feed
  await page.click('button[data-act="finish"]');
  await page.waitForSelector('.feed-list');
  check((await text('.feed-head h1')) === '6 new tenders', 'feed title "6 new tenders"');
  check(await page.locator('.feed-head h1 .w').count() === 3, 'word-by-word reveal on the headline (three words)');
  check(!(await page.locator('.eyebrow, .ai-pill, .ground, .grain, .glow, .vtiles, .dock').count()), 'no eyebrow, pill, grain, glow, count tiles or floating dock');
  await page.waitForFunction(() => document.querySelector('.pages-line').innerText.includes('777'), null, { timeout: 5000 });
  check((await text('.pages-line')).includes('Thu 5 Nov · read 777 pages in 4 languages') && await page.locator('.pages-line .ai').count() === 1 && !(await page.locator('.nav .ai').count()), 'pages line: "Thu 5 Nov · read 777 pages in 4 languages" with the "Simulated AI" label on it (not in the nav)');
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.querySelector('.nav').scrollWidth <= document.querySelector('.nav').clientWidth), 'the Feed header fits the viewport (no horizontal overflow at ' + VW + ' px)');
  check((await text('.tabs.filter')).replace(/\s+/g, ' ').includes('All 6 Go 1 Maybe 2 No-go 3'), 'filter tabs with counts (plain text, the active one underlined)');
  check(await css('.tabs.filter [aria-checked="true"]', 'textDecorationLine') === 'underline' && await css('.tabs.filter [aria-checked="true"]', 'color') === rgb(await token('--c-brand')), 'active filter tab is underlined in brand');
  check(!(await text('.feed-list')).includes('(fictional)'), 'bare buyer names on cards');
  check((await text('.screen')).includes('All companies and tenders are fictional'), 'fictional line on Feed');
  check(await page.locator('.tabbar a[aria-current="page"] span:not(.ms)').innerText() === 'Feed', 'tab bar shows Feed active');
  const bar = await page.locator('.tabbar').boundingBox();
  check(bar && Math.round(bar.width) === VW && Math.round(bar.height) >= 60 && Math.round(bar.y + bar.height) === VH, 'the tab bar is a full-width 60 px bar at the bottom of the ' + VW + '×' + VH + ' viewport');
  check(await css('.tabbar a[aria-current="page"]', 'color') === rgb(await token('--c-brand')) && await css('.tabbar a[aria-current="page"]', 'fontWeight') === '700' && (await css('.tabbar a[aria-current="page"] .ms', 'fontVariationSettings')).includes('"FILL" 1'), 'active tab = brand colour + filled icon + bolder label');
  check(await page.locator('.tcard img').count() === 0 && await page.locator('.tcard .flag, .tcard .orig, .tcard .why').count() === 0, 'cards carry no photo, flag, original title or reason');
  // Header appearance toggle: one tap flips the scheme, the next tap flips it back; About keeps System / Light / Dark
  const otherScheme = scheme === 'dark' ? 'light' : 'dark';
  const tgl = page.locator('.nav [data-act="theme-toggle"]');
  const tglBox = await tgl.boundingBox();
  check(await tgl.count() === 1 && tglBox && tglBox.width >= 44 && tglBox.height >= 44 && (await tgl.getAttribute('aria-label')) === 'Switch to ' + otherScheme + ' mode', 'header has a 44 px appearance toggle labelled "Switch to ' + otherScheme + ' mode"');
  await tgl.click(); await page.waitForTimeout(50);
  check(await page.evaluate(() => document.documentElement.getAttribute('data-scheme')) === otherScheme && (await page.locator('.nav [data-act="theme-toggle"]').getAttribute('aria-label')) === 'Switch to ' + scheme + ' mode', 'toggle switches to ' + otherScheme + ' and relabels itself');
  await page.locator('.nav [data-act="theme-toggle"]').click(); await page.waitForTimeout(50);
  check(await page.evaluate(() => document.documentElement.getAttribute('data-scheme')) === scheme, 'second tap returns to ' + scheme);
  const card0 = (await text('.tcard')).replace(/\s+/g, ' ');
  check(/^100 Go Structured cabling and Wi-Fi for 12 primary schools Stadt Ellerbach · €480k · 29 d$/.test(card0), 'card = verdict (shape + word + score), title, buyer, value, days left: "' + card0 + '"');
  const tileBox = await page.locator('.tcard .score').first().boundingBox();
  check(tileBox && Math.round(tileBox.width) === 48 && Math.round(tileBox.height) === 48 && await css('.tcard .score', 'borderRadius') === '8px', 'score tile is 48 × 48 with the 8 px radius');
  check(await css('.tcard', 'boxShadow') === 'none' && await css('.tcard', 'borderStyle') === 'none', 'cards are flat: no shadow, no border');
  await scan('feed'); await shot('feed');

  // Filter
  await page.click('.tabs.filter [data-filter="maybe"]');
  check(await page.locator('.feed-list .tcard').count() === 2, 'Maybe filter shows 2 cards');
  await page.click('.tabs.filter [data-filter="all"]');

  // 05 Go tender + requirement sheet (BRIEF step 3)
  await page.click('a.tcard[href="#/t/ell-schools"]');
  await page.waitForSelector('.vhead.loading');
  check((await text('.vhead.loading')).includes('Reading 146 pages (German)'), 'loading state "Reading 146 pages (German)…"');
  await scan('detail-loading'); await shot('detail-loading');
  await page.waitForSelector('.vhead.v-go', { timeout: 8000 });
  check(!(await page.locator('.tabbar').count()), 'no tab bar on detail');
  check((await text('.vhead')).includes('You meet all 4 requirements'), 'Go header reason');
  check((await text('.facts')).replace(/\s+/g, ' ') === 'Value €480k Deadline 4 Dec · 29 days left', 'facts keep value and deadline only');
  check(await css('.action-bar .btn-secondary', 'backgroundColor') === rgb(await token('--c-muted')) && await css('.action-bar .btn-secondary', 'color') === rgb(await token('--c-bg')) && await css('.action-bar .btn-primary', 'backgroundColor') === rgb(await token('--c-brand')), 'action bar: secondary = muted fill with ground text, primary = brand');
  const barBtns = await page.locator('.action-bar .btn').evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.height), Math.round(r.width)]; }));
  check(barBtns.length === 2 && barBtns.every((b) => b[0] === 52) && barBtns[1][1] > barBtns[0][1] * 1.6, 'action bar buttons are 52 px tall, Save about twice as wide as Skip: ' + JSON.stringify(barBtns));
  check(await page.locator('.detail-photo').count() === 1 && await page.locator('.detail-photo').evaluate((el) => el.previousElementSibling.classList.contains('vhead')), 'the photo is its own block under the verdict header');
  await scan('detail-go'); await shot('detail-go');
  await page.click('a.req[href="#/t/ell-schools/req/r1"]');
  await waitSheet(true);
  check(await sheetOpen() === 1, 'requirement sheet is a modal dialog');
  check((await text('.sheet .quote-head')).includes('Original (German) · Vergabeunterlagen, p. 23, §4.2'), 'quote caption "Original (German) · Vergabeunterlagen, p. 23, §4.2" in regular text');
  check(await page.locator('.sheet blockquote[lang="de"] mark').count() === 1 && await css('.sheet blockquote mark', 'backgroundColor') === 'rgba(0, 0, 0, 0)', 'quote has lang="de" and an underlined phrase (no tinted mark)');
  check(await css('.sheet', 'borderTopLeftRadius') === '8px' && await css('.sheet', 'boxShadow') === 'none', 'sheet: 8 px top corners, no shadow');
  await scan('sheet-go'); await shot('sheet-go');
  await page.goBack(); // system Back closes the sheet to its parent
  await waitSheet(false);
  check(page.url().endsWith('#/t/ell-schools'), 'Back closes the sheet to the detail');
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.feed-list');
  check(page.url().endsWith('#/feed'), 'detail ‹ returns to the Feed');

  // 06 Hohenau: open check, Escape and scrim close the sheet, then "We meet it" (BRIEF step 4)
  await page.click('a.tcard[href="#/t/hoh-security"]');
  await page.waitForSelector('.vhead.v-nogo', { timeout: 8000 });
  check((await text('.vhead')).includes('1 knock-out requirement: you don’t hold ISO 27001. One more needs your answer.'), 'No-go header reason');
  check(await css('.vhead-score .num', 'color') === rgb(await token('--c-nogo')) && await css('.vhead-score .num', 'letterSpacing') === 'normal', 'score in the verdict colour with no negative tracking');
  check(await css('.vhead', 'backgroundColor') === 'rgba(0, 0, 0, 0)', 'the verdict header is plain text on the ground (no block, no glass)');
  check(await page.locator('.in-short.reveal .w').count() > 10, 'In short is a word-by-word reveal');
  check((await text('.sec-h h2')).length > 0 && (await page.locator('.sec-h').nth(1).innerText()).replace(/\s+/g, ' ') === 'Can you qualify? 1 of 3 met', '"Can you qualify?" with "1 of 3 met"');
  const order = await page.locator('a.req .status b').allInnerTexts();
  check(order.join(' > ') === 'Fails > Needs your check > Meets', 'requirement order fail → check → met');
  check((await page.locator('a.req .cite').first().innerText()) === 'Vergabeunterlagen, p. 12, §3.1', 'citation as regular text "Vergabeunterlagen, p. 12, §3.1"');
  const cta = await page.locator('a.req[href="#/t/hoh-security/req/r3"] .req-cta').boundingBox();
  check(cta && cta.height >= 44 && (await page.locator('a.req[href="#/t/hoh-security/req/r3"] .req-cta').innerText()).startsWith('Check') && await page.locator('a.req .req-cta').count() === 1, 'the "Needs your check" line shows a 44 px "Check" call to action, the other lines do not');
  check(await page.locator('a.req[href="#/t/hoh-security/req/r3"] .status .shape.diamond').count() === 1 && await page.locator('.shape:not(.circle):not(.tri):not(.square):not(.diamond)').count() === 0, 'the "Needs your check" line carries the ◆ diamond, and every shape has a kind');
  const photoBox = await page.locator('.detail-photo').boundingBox();
  check(photoBox && Math.round(photoBox.x) === 16 && Math.round(photoBox.x + photoBox.width) === VW - 16, 'the tender photo keeps the 16 px gutter on both sides (' + (photoBox ? Math.round(photoBox.x) + '–' + Math.round(photoBox.x + photoBox.width) : 'missing') + ' of ' + VW + ')');
  await scan('detail-nogo'); await shot('detail-nogo'); await shot('detail-nogo-full', true);
  const reqSel = 'a.req[href="#/t/hoh-security/req/r3"]';
  await page.click(reqSel); await waitSheet(true);
  await page.keyboard.press('Escape'); await waitSheet(false);
  check(page.url().endsWith('#/t/hoh-security'), 'Escape closes the sheet');
  await page.click(reqSel); await waitSheet(true);
  const sheetTop = await page.locator('#sheet-root .sheet').evaluate((el) => el.getBoundingClientRect().top);
  if (sheetTop >= 40) { // the scrim is visible above the sheet
    await page.locator('#sheet-root .scrim').click({ position: { x: Math.round(VW / 2), y: Math.round(sheetTop / 2) } }); await waitSheet(false); // a real tap on the scrim (coordinates through the element, which mobile emulation hit-tests correctly)
    check(page.url().endsWith('#/t/hoh-security'), 'scrim tap closes the sheet');
  } else { // on a short viewport the sheet fills the screen: Back and Escape are the ways out (checked above and below)
    console.log('  info the sheet fills this ' + VW + '×' + VH + ' viewport (top ' + Math.round(sheetTop) + ' px), no scrim to tap');
    await page.keyboard.press('Escape'); await waitSheet(false);
  }
  await page.click(reqSel); await waitSheet(true);
  check(await page.locator('.sheet .btn-check').count() === 2, 'unresolved sheet: both answers equal weight, none preselected');
  const pairW = await page.locator('.sheet .row-btns .btn').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
  check(pairW.length === 2 && Math.abs(pairW[0] - pairW[1]) <= 1 && await css('.sheet .row-btns .btn', 'backgroundColor') === rgb(await token('--c-muted')), 'unresolved answers are the same width and both secondary (muted fill): ' + pairW.join(' / '));
  check((await text('.sheet .confidence')).includes('58%'), 'confidence readout 58%');
  check((await text('.sheet .sheet-top')).includes('Needs your check') && (await text('.sheet .sheet-top')).includes('Simulated AI'), 'status and "Simulated AI" as plain text in the sheet');
  await scan('sheet-check'); await shot('sheet-check');
  await page.click('.sheet button[data-confirm="pass"]');
  await waitSheet(false);
  check(page.url().endsWith('#/t/hoh-security'), '"We meet it" closes the sheet');
  check((await text('#toast-root')).includes('Answer saved · now No-go'), 'toast: answer saved, still No-go');
  check((await text('.vhead')).includes('1 knock-out requirement: you don’t hold ISO 27001.'), 'still No-go until ISO 27001');

  // Ask this tender (BRIEF step 6)
  await page.click('button[data-ask="0"]');
  await page.waitForSelector('#ans-0 .cite', { timeout: 5000 });
  check((await text('#ans-0 .cite')) === 'Vergabeunterlagen, p. 12', 'answer cites the page in regular text');
  await scan('ask'); await shot('ask');

  // 09 Company: ISO 27001 → Hohenau No-go → Go (BRIEF step 5, the hero moment)
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.feed-list');
  await page.evaluate(() => window.scrollTo(0, 300)); await page.waitForTimeout(100); // leave the Feed scrolled, to check it is remembered
  await page.click('.tabbar a[href="#/company"]');
  await page.waitForSelector('.co-head');
  check(await page.locator('.co-head img').count() === 0, 'no photo behind the Company title');
  check((await text('#co-tiles')).replace(/\s+/g, ' ') === '1 Go 2 Maybe 3 No-go', 'counts as plain text "1 Go 2 Maybe 3 No-go"');
  const hint = await page.locator('[data-hint="cert:ISO 27001"]').innerText();
  check(hint.includes('Turn on → Landkreis Hohenau becomes Go'), 'impact hint before toggling: ' + hint);
  check((await page.locator('[data-hint="cert:VCA"]').innerText()).includes('Gemeente Vlietdam becomes Maybe'), 'VCA hint: Vlietdam becomes Maybe');
  check(await page.locator('[role="switch"][data-lang]').count() === 5, 'bid languages are rows with switches');
  await scan('company'); await shot('company');
  await page.click('button[data-cert="ISO 27001"]');
  check(await page.waitForSelector('.morph-ghost', { timeout: 1500 }).then(() => true).catch(() => false), 'a dashed ghost is left on the switch while the re-score card grows out of it');
  await page.waitForSelector('.rescore[data-rescore]');
  await page.waitForTimeout(700);
  const sr = await page.locator('#rescore .sr-only').innerText();
  check(sr.startsWith('Landkreis Hohenau: No-go → Go'), 're-score card: "' + sr + '"');
  check((await page.locator('#rescore .change-row').innerText()).replace(/\s+/g, ' ').includes('No-go → Go'), 'visible "No-go → Go" (shape + word, plain text)');
  check(await page.locator('button[data-cert="ISO 27001"][aria-checked="true"]').count() === 1, 'switch is on (role=switch, aria-checked)');
  check((await page.locator('#co-tiles b').allInnerTexts()).join(',') === '2,2,2', 'company counts move to 2 : 2 : 2');
  check((await page.locator('[data-hint="cert:ISO 27001"]').innerText()).includes('Unlocked Landkreis Hohenau'), 'hint becomes "Unlocked Landkreis Hohenau"');
  await page.evaluate(() => window.scrollTo(0, 0)); // show the re-score card
  await scan('company-rescore'); await shot('company-rescore');

  // Feed after the change
  await page.click('.tabbar a[href="#/feed"]');
  await page.waitForSelector('.feed-list');
  check((await text('.tabs.filter')).replace(/\s+/g, ' ').includes('All 6 Go 2 Maybe 2 No-go 2'), 'feed filter counts 2 · 2 · 2');
  check(await page.locator('a.tcard[href="#/t/hoh-security"].v-go').count() === 1, 'Hohenau card is now Go');
  check(await page.evaluate(() => window.scrollY) > 0, 'the Feed tab remembers its scroll position');
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot('feed-after');

  // 07 Skip the Dutch libraries tender with a reason (BRIEF step 7)
  await page.click('a.tcard[href="#/t/vli-libraries"]');
  await page.waitForSelector('.vhead.v-nogo', { timeout: 8000 });
  await page.click('button[data-go="#/t/vli-libraries/skip"]');
  await waitSheet(true);
  await page.click('.opt[data-skip="Missing a certificate"]'); await page.waitForTimeout(250);
  check(await page.locator('.opt[data-skip="Missing a certificate"][aria-pressed="true"]').count() === 1 && await css('.opt[aria-pressed="true"]', 'backgroundColor') === rgb(await token('--c-brand')), 'skip reason selected (plain rectangle, brand when on)');
  await scan('skip-sheet'); await shot('skip-sheet');
  await page.click('button[data-act="skip-confirm"]');
  await page.waitForSelector('.feed-list');
  await page.waitForTimeout(400);
  check(page.url().endsWith('#/feed'), 'skip returns to the Feed');
  check(await page.locator('a.tcard[href="#/t/vli-libraries"]').count() === 0, 'skipped card is gone');
  check((await text('#toast-root')).includes('Skipped. Reason saved.'), 'toast "Skipped. Reason saved."');
  await shot('feed-skipped');

  // Save a tender, then Bids
  await page.click('a.tcard[href="#/t/ell-schools"]');
  await page.waitForSelector('.vhead.v-go', { timeout: 8000 });
  await page.click('button[data-act="save"]');
  await page.waitForSelector('button[data-go="#/bids"]');
  check((await text('.action-bar button[data-go="#/bids"]')).includes('In Bids · Deciding'), 'Save becomes "In Bids · Deciding"');
  check((await text('#toast-root')).includes('Saved to Bids'), 'toast "Saved to Bids"');
  await shot('saved');
  await page.click('button[data-act="back"]');
  await page.waitForSelector('.tabbar');
  check((await text('.feed-list')).includes('Saved'), 'the saved card carries a plain "Saved" marker');
  await page.click('.tabbar a[href="#/bids"]');
  await page.waitForSelector('.bids-head');
  check(await page.locator('.tabbar a[aria-current="page"] span:not(.ms)').innerText() === 'Bids' && !(await page.locator('.tabbar .dock-badge, .tabbar .badge').count()), 'tab bar shows Bids active, no badge');
  check((await text('.bids-head .sub')).includes('1 saved · next deadline in 29 days'), 'Bids sub line');
  check(await page.locator('.bid-card img').count() === 0 && await page.locator('.bid-card .tabs.stage [role="radio"]').count() === 3, 'bid card: no thumbnail, stages as text tabs');
  check((await text('.skipped')).includes('Missing a certificate'), 'skipped row shows the reason');
  await page.click('button[data-stage="Bidding"][data-id="ell-schools"]');
  check(await page.locator('button[data-stage="Bidding"][data-id="ell-schools"][aria-checked="true"]').count() === 1, 'stage switch to Bidding');
  check((await text('.screen')).includes('All companies and tenders are fictional'), 'fictional line on Bids');
  await scan('bids'); await shot('bids');

  // 10 About
  await page.click('.nav button[data-go="#/about"]');
  await page.waitForSelector('.about-row');
  const about = await text('.screen');
  check(about.includes('AI output is simulated') && about.includes('real code') && about.includes('All data is fictional') && about.includes('Built with AI assistance'), 'About explains simulated / real / fictional / AI-assisted');
  check(!/engine\.js|ai\.js|data\.js|README|\?demo=/.test(about), 'About names no files or dev notes');
  check(!(await page.locator('[data-act="palette"]').count()), 'no palette switch (Brand only)');
  await scan('about'); await shot('about');
  // Appearance switch (persisted)
  const other = scheme === 'dark' ? 'light' : 'dark';
  await page.click('[data-act="theme"][data-value="' + other + '"]');
  check(await page.evaluate(() => document.documentElement.getAttribute('data-scheme')) === other, 'appearance switch applies data-scheme=' + other);
  await load('', '#/about');
  await page.waitForSelector('.about-row');
  check(await page.evaluate(() => document.documentElement.getAttribute('data-scheme')) === other && await page.locator('[data-act="theme"][data-value="' + other + '"][aria-checked="true"]').count() === 1, 'appearance persists across a reload');
  await shot('about-' + other);
  await page.click('[data-act="theme"][data-value="' + scheme + '"]');

  // Deep link after onboarding
  await load('', '#/t/kal-fibre');
  await page.waitForSelector('.vhead.v-maybe', { timeout: 8000 });
  check((await text('.vhead')).includes('No knock-outs, but 2 risks: short by 1 reference, mandatory site visit.'), 'deep link #/t/kal-fibre works (Maybe)');
  await scan('detail-maybe'); await shot('detail-maybe');

  // Closed state (test-only ?today=)
  await page.goto(url('today=2026-12-23', '#/t/ell-schools'));
  await page.waitForSelector('.vhead.v-closed', { timeout: 8000 });
  check((await text('.vhead')).includes('The deadline passed on 4 Dec.'), 'closed header');
  check(await page.locator('.action-bar button[disabled]').count() === 1 && (await text('.action-bar')).includes('Closed tenders can’t be saved'), 'Save disabled with the lock line');
  await scan('detail-closed'); await shot('detail-closed');
  await page.goto(url('today=2026-12-23', '#/feed'));
  await page.waitForSelector('.tcard.is-closed');
  check(await css('.tcard.is-closed .score', 'opacity') === '1', 'closed cards use solid tokens, not opacity');
  await scan('feed-closed'); await shot('feed-closed');

  // Offline note and not found
  await page.goto(url('offline=1', '#/feed'));
  await page.waitForSelector('.banner');
  await scan('feed-offline'); await shot('feed-offline');
  await load('', '#/nope');
  await page.waitForSelector('text=Page not found');
  await scan('not-found'); await shot('not-found');

  // Empty Bids and the honest "ISO 27001 alone" case, from a reset
  await page.goto(url('demo=reset'));
  await page.waitForSelector('.welcome');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tenderscout.v2')); s.onboarded = true; localStorage.setItem('tenderscout.v2', JSON.stringify(s)); });
  await load('', '#/bids');
  await page.waitForSelector('text=No bids yet');
  await scan('bids-empty'); await shot('bids-empty');
  await load('', '#/company');
  await page.waitForSelector('.co-head');
  check((await page.locator('[data-hint="cert:ISO 27001"]').innerText()).includes('Landkreis Hohenau becomes Maybe'), 'without the answer the hint says Maybe');
  await page.click('button[data-cert="ISO 27001"]');
  await page.waitForSelector('.rescore[data-rescore]');
  check((await page.locator('#rescore .sr-only').innerText()).startsWith('Landkreis Hohenau: No-go → Maybe'), 'ISO 27001 alone: re-score card says No-go → Maybe');
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot('company-iso-alone');

  // ?demo=fast: the simulated waits shrink (tender reading in about 300 ms) and nothing else changes
  await page.goto(url('demo=reset,fast'));
  await page.waitForSelector('.welcome');
  check(page.url().includes('demo=fast') && !page.url().includes('reset'), '?demo=reset,fast resets and keeps demo=fast in the address');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tenderscout.v2')); s.onboarded = true; localStorage.setItem('tenderscout.v2', JSON.stringify(s)); });
  await load('demo=fast', '#/t/hoh-security');
  const t0 = Date.now();
  await page.waitForSelector('.vhead.v-nogo', { timeout: 8000 });
  const readMs = Date.now() - t0;
  check(readMs < 1200 && await page.locator('.vhead .ai').count() === 1, 'fast mode: the tender is read in ' + readMs + ' ms with the "Simulated AI" label in place');

  // iPhone home-screen insets (viewport-fit=cover, 47 px top / 34 px bottom): the top inset is applied once
  const inset = await ctx.newPage();
  await inset.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = ':root{--safe-top:47px !important;--safe-bottom:34px !important}'; document.head.appendChild(s); }); });
  await inset.goto(url('demo=fast', '#/feed')); await inset.waitForSelector('.feed-list');
  const feedNav = await inset.locator('.nav').first().boundingBox();
  const insetBar = await inset.locator('.tabbar').boundingBox();
  await inset.goto(url('demo=fast', '#/t/ell-schools')); await inset.waitForSelector('.vhead.v-go', { timeout: 8000 });
  const backRow = await inset.locator('.vhead-nav').first().boundingBox();
  check(feedNav && Math.round(feedNav.y) === 47 && backRow && Math.round(backRow.y) === 53 && insetBar && Math.round(insetBar.height) === 94, 'with iPhone insets the Feed header starts at 47 px, the tender back row at ' + (backRow ? Math.round(backRow.y) : '?') + ' px (47 + 6, inset applied once) and the tab bar is 60 + 34 px');
  await inset.close();
  // Morning notification (simulated lock screen, once a day; CLAUDE.md §11 item 120)
  await load('', '#/feed'); await page.waitForSelector('.feed-list');
  check(!(await page.locator('.lockscreen').count()), 'morning notification: not shown again on the day a fresh state was written');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tenderscout.v2')); s.notifiedOn = '2026-11-04'; localStorage.setItem('tenderscout.v2', JSON.stringify(s)); });
  await load('', '#/feed'); await page.waitForSelector('.lockscreen');
  check(await page.locator('.lockscreen[role="dialog"][aria-modal="true"]').count() === 1 && (await text('.lockscreen')).includes('Simulated notification') && (await text('.lockscreen')).includes('Thursday 5 November'), 'morning notification: first Feed open of a new day shows the simulated lock screen (dialog, "Simulated notification", the date)');
  check((await page.locator('.notif').innerText()).replace(/\s+/g, ' ').includes('TenderScout now 1 Go 2 Maybe 3 No-go') && await page.locator('.notif .shape').count() === 3, 'morning notification: "1 Go · 2 Maybe · 3 No-go" from the engine, each with its shape');
  await scan('morning-notification'); await shot('morning-notification');
  await page.click('.notif'); await page.waitForTimeout(100);
  check(!(await page.locator('.lockscreen').count()) && page.url().endsWith('#/feed'), 'morning notification: tapping it opens the Feed');
  await load('', '#/feed'); await page.waitForSelector('.feed-list');
  check(!(await page.locator('.lockscreen').count()), 'morning notification: once a day (a reload the same day does not show it again)');
  await load('', '#/about'); await page.click('[data-act="morning"]'); await page.waitForSelector('.lockscreen');
  await page.keyboard.press('Escape');
  check(!(await page.locator('.lockscreen').count()), 'morning notification: About replays it and Escape closes it');

  // Touch targets: interactive elements smaller than 44 px (pseudo-element hit areas are not measured here)
  const small = await page.evaluate(() => Array.from(document.querySelectorAll('button, a, input, [role="switch"]'))
    .map((el) => { const r = el.getBoundingClientRect(); return { el: el.outerHTML.slice(0, 60), w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter((x) => x.w && x.h && (x.w < 44 || x.h < 44)));
  console.log('  info elements under 44 px on Company (box only): ' + JSON.stringify(small));

  check(scanned.length === 0, 'declutter scan: none of the 18 patterns on any screen' + (scanned.length ? ':\n       ' + scanned.join('\n       ') : ''));
  check(problems.length === 0, 'no console errors, page errors or failed requests' + (problems.length ? ':\n       ' + problems.join('\n       ') : ''));
  await browser.close();
}

function watch(page, problems) {
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url() + ' ' + ((r.failure() || {}).errorText || '')));
}

async function reducedMotion() {
  console.log('\n== reduced motion · ' + BROWSER + ' · ' + BASE);
  const browser = await playwright[BROWSER].launch();
  const ctx = await browser.newContext(contextOptions({ colorScheme: 'light', reducedMotion: 'reduce' }));
  const problems = [];
  const page = await ctx.newPage();
  watch(page, problems);
  await page.goto(BASE + '?demo=reset&theme=light');
  await page.waitForSelector('.welcome');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('tenderscout.v2')); s.onboarded = true; localStorage.setItem('tenderscout.v2', JSON.stringify(s)); });
  await page.goto('about:blank'); await page.goto(BASE + '#/company');
  await page.waitForSelector('.co-head');
  await page.click('button[data-cert="ISO 27001"]');
  await page.waitForSelector('.rescore[data-rescore]');
  await page.waitForTimeout(200);
  const live = await page.evaluate(() => document.getAnimations().filter((a) => (a.effect.getComputedTiming().duration || 0) > 0).length);
  check(await page.locator('.morph-ghost').count() === 0 && live === 0, 're-score card appears without morph, ghost or any non-zero-duration animation under reduced motion (' + live + ' live)');
  await page.goto('about:blank'); await page.goto(BASE + '#/feed');
  await page.waitForSelector('.pages-line');
  check(await page.locator('.pages-line b').innerText() === '777', 'the 777 count-up is instant under reduced motion');
  check(await page.evaluate(() => Array.from(document.querySelectorAll('.feed-head h1 .w')).every((w) => getComputedStyle(w).animationDuration === '0s')), 'the word reveal is instant under reduced motion');
  check(await page.evaluate(() => document.getAnimations().filter((a) => (a.effect.getComputedTiming().duration || 0) > 0).length) === 0, 'no running animation on the Feed under reduced motion');
  check(problems.length === 0, 'no console errors under reduced motion' + (problems.length ? ':\n       ' + problems.join('\n       ') : ''));
  await browser.close();
}

(async () => {
  const appCss = ['styles.css', 'shared/tokens.css'].flatMap(scanCss);
  console.log('== static CSS scan (styles.css, shared/tokens.css)');
  check(appCss.length === 0, 'no declutter pattern in the app stylesheets' + (appCss.length ? ':\n       ' + appCss.map((v) => v.file + ' · ' + v.pattern + ' · ' + v.match).join('\n       ') : ''));
  const schemes = ['dark', 'light'].filter((s) => !process.env.SMOKE_ONLY || process.env.SMOKE_ONLY === s);
  try { for (const s of schemes) await run(s); await reducedMotion(); }
  catch (e) { failures++; console.error('\nCrashed: ' + (e && e.stack || e)); }
  console.log('\n' + (failures ? failures + ' check(s) failed' : 'Smoke test passed') + ' · screenshots in ' + OUT);
  process.exitCode = failures ? 1 : 0;
})();
