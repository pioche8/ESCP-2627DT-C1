/*
 * tests/monkey.js — off-script monkey test (5 Nov 2026). Dev-only: Playwright + Chromium, like tests/smoke.js.
 *
 *   MONKEY=1 node tests/smoke.js                 the smoke suite runs it after its own checks (CI never sets MONKEY)
 *   node tests/monkey.js                         standalone: all three profiles, 10 minutes each
 *   MONKEY_MINUTES=2 MONKEY_SEED=7 MONKEY_PROFILES="iPhone SE" node tests/monkey.js
 *
 * A seeded walker starts from ?demo=reset and, until the time is up, taps a random visible interactive element (buttons,
 * links, inputs, switches, radios), favouring ones it has not tapped yet, and now and then presses Back or Escape,
 * scrolls, types into the focused field, accepts or dismisses a confirm dialog, or jumps to a random route (every screen
 * of docs/NAVIGATION.md plus a wrong one), so every reachable screen is visited. After every step it asserts:
 *   · no console error, page error or failed request;
 *   · the screen (or the open sheet) shows some text;
 *   · nothing is wider than the viewport (no horizontal scroll, no element past the right edge);
 *   · every visible tap target is at least 44 × 44 px (the switch counts its ::after hit area).
 * A finding is printed with the seed, the step, the route, the last ten actions, and a screenshot in screenshots/.
 * The same seed and profile replay the same walk as long as the app's timing is the same.
 */
'use strict';
const path = require('path');
const fs = require('fs');
let playwright;
try { playwright = require('playwright'); } catch (e) { console.error('Playwright is not installed: npm i --no-save playwright && npx playwright install chromium'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.SMOKE_URL || 'file://' + ROOT + '/index.html';
const OUT = path.resolve(process.env.MONKEY_OUT || path.join(ROOT, 'screenshots'));
const SEED = +(process.env.MONKEY_SEED || 20261105);
const MINUTES = +(process.env.MONKEY_MINUTES || 10);
const PROFILES = (process.env.MONKEY_PROFILES || '390x844,iPhone 13,iPhone SE').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_FINDINGS = +(process.env.MONKEY_MAX || 6);
const D = require(path.join(ROOT, 'data.js'));

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const ROUTES = ['#/feed', '#/bids', '#/insights', '#/company', '#/profile', '#/settings', '#/about', '#/welcome/1', '#/welcome/3', '#/nope', '#/t/none']
  .concat(D.TENDERS.flatMap((t) => ['#/t/' + t.id, '#/t/' + t.id + '/skip'].concat(t.requirements.map((q) => '#/t/' + t.id + '/req/' + q.id))));

// Runs in the page: visible interactive elements with a stable signature and their box (switch ::after hit area included).
const PAGE_TARGETS = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const out = [];
  const roots = [document.getElementById('screen'), document.getElementById('tabbar-root'), document.getElementById('sheet-root'), document.getElementById('toast-root')].filter(Boolean);
  const sheetOpen = !!document.querySelector('#sheet-root.open');
  for (const root of roots) {
    if (sheetOpen && (root.id === 'screen' || root.id === 'tabbar-root')) continue; // inert behind the sheet
    for (const el of root.querySelectorAll('a[href], button, input, [role="switch"], [role="radio"], [role="tab"]')) {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[inert]')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      let top = r.top, bottom = r.bottom, left = r.left, right = r.right;
      const after = getComputedStyle(el, '::after');
      if (after.content !== 'none' && after.position === 'absolute') {
        const px = (v) => (/^-?[\d.]+px$/.test(v) ? parseFloat(v) : 0);
        top += px(after.top); bottom -= px(after.bottom); left += px(after.left); right -= px(after.right);
      }
      const sig = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '|' + (el.getAttribute('data-act') || el.getAttribute('data-go') || el.getAttribute('href') || el.getAttribute('data-filter') || el.getAttribute('data-cert') || el.getAttribute('data-lang') || el.getAttribute('data-ref') || el.getAttribute('data-stage') || el.getAttribute('data-skip') || el.getAttribute('data-confirm') || el.getAttribute('data-ask') || el.getAttribute('data-unskip') || el.getAttribute('data-value') || el.getAttribute('data-field') || el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 24));
      const label = (el.getAttribute('aria-label') || (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) || el.tagName.toLowerCase());
      out.push({ sig, label, x: r.left + r.width / 2, y: r.top + r.height / 2, w: right - left, h: bottom - top, inView: r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw, isInput: el.tagName === 'INPUT' });
    }
  }
  return out;
};
const PAGE_STATE = () => {
  const vw = window.innerWidth;
  const sheetOpen = !!document.querySelector('#sheet-root.open');
  const textRoot = sheetOpen ? document.querySelector('#sheet-root') : document.getElementById('screen');
  const text = textRoot ? (textRoot.innerText || '').trim() : '';
  const wide = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.sr-only, script, style') || el.classList.contains('sr-only')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed' && el.classList.contains('morph-ghost')) continue;
    const r = el.getBoundingClientRect();
    if (r.width && r.right > vw + 1 && r.left >= 0 && !el.closest('.collapsing, .sheet:not(.open .sheet), #sheet-root:not(.open)')) wide.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' right=' + Math.round(r.right));
    if (wide.length > 3) break;
  }
  return { hash: location.hash, sheetOpen, textLen: text.length, scrollWidth: document.documentElement.scrollWidth, vw, wide, title: document.title };
};

async function runProfile(name, seed, minutes) {
  const rand = rng(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const device = name === '390x844' ? null : playwright.devices[name];
  if (name !== '390x844' && !device) throw new Error('Unknown device ' + name);
  const scheme = rand() < 0.5 ? 'dark' : 'light';
  const reduce = rand() < 0.25;
  const browser = await playwright.chromium.launch();
  const ctx = await browser.newContext({ ...(device || { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), colorScheme: scheme, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('requestfailed: ' + r.url()));
  let dialogs = 0;
  page.on('dialog', (d) => { dialogs++; (rand() < 0.5 ? d.accept() : d.dismiss()).catch(() => {}); });
  const findings = [];
  const seen = new Map(); // sig → taps
  const actions = [];
  const visited = new Set();
  console.log('\n== monkey · ' + name + ' · ' + scheme + (reduce ? ' · reduced motion' : '') + ' · seed ' + seed + ' · ' + minutes + ' min · ' + BASE);
  await page.goto(BASE + '?demo=reset&theme=' + scheme);
  await page.waitForSelector('.welcome');
  const t0 = Date.now(), until = t0 + minutes * 60000;
  let step = 0;
  const finding = async (what, extra) => {
    const key = what.split(':')[0] + '|' + (extra || '').slice(0, 60);
    if (findings.some((f) => f.key === key)) return;
    const st = await page.evaluate(PAGE_STATE).catch(() => ({}));
    const shot = path.join(OUT, 'monkey-' + name.replace(/\s+/g, '').toLowerCase() + '-' + seed + '-' + step + '.png');
    await page.screenshot({ path: shot }).catch(() => {});
    findings.push({ key, what, extra, step, route: st.hash, actions: actions.slice(-10), shot });
    console.log('  FIND ' + what + (extra ? ' · ' + extra : '') + '\n       seed ' + seed + ' · step ' + step + ' · ' + st.hash + (st.sheetOpen ? ' (sheet open)' : '') + '\n       last actions: ' + actions.slice(-10).join(' › ') + '\n       ' + shot);
  };
  while (Date.now() < until && findings.length < MAX_FINDINGS) {
    step++;
    const targets = await page.evaluate(PAGE_TARGETS).catch(() => []);
    const r = rand();
    let did = '';
    try {
      if (r < 0.06) { did = 'back'; await page.goBack({ timeout: 3000 }).catch(() => {}); }
      else if (r < 0.09) { did = 'escape'; await page.keyboard.press('Escape'); }
      else if (r < 0.14) { const route = pick(ROUTES); did = 'go ' + route; await page.evaluate((h) => { location.hash = h; }, route); }
      else if (r < 0.19) { const dy = Math.round((rand() - 0.3) * 900); did = 'scroll ' + dy; await page.mouse.wheel(0, dy); }
      else if (r < 0.205) { did = 'reload'; await page.reload(); }
      else if (targets.length) {
        const fresh = targets.filter((t) => !seen.has(t.sig));
        const pool = fresh.length && rand() < 0.75 ? fresh : targets;
        const t = pick(pool);
        seen.set(t.sig, (seen.get(t.sig) || 0) + 1);
        if (!t.inView) { await page.evaluate((sig) => { /* scroll the target into view by re-finding it */ }, t.sig); }
        const box = await page.evaluate((sig) => { const el = Array.from(document.querySelectorAll('a[href], button, input, [role="switch"], [role="radio"], [role="tab"]')).find((e) => { const s = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '|' + (e.getAttribute('data-act') || e.getAttribute('data-go') || e.getAttribute('href') || e.getAttribute('data-filter') || e.getAttribute('data-cert') || e.getAttribute('data-lang') || e.getAttribute('data-ref') || e.getAttribute('data-stage') || e.getAttribute('data-skip') || e.getAttribute('data-confirm') || e.getAttribute('data-ask') || e.getAttribute('data-unskip') || e.getAttribute('data-value') || e.getAttribute('data-field') || e.getAttribute('aria-label') || (e.textContent || '').trim().slice(0, 24)); return s === sig; }); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'nearest' }); const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, t.sig);
        if (!box) { did = 'gone ' + t.label; }
        else if (t.isInput) {
          did = 'type ' + t.label;
          await page.mouse.click(box.x, box.y);
          const v = pick(['', '0', '1.5', '12', '0,8', 'abc', '-3', '99999', 'nordlicht-netzwerk.example', '  ']);
          await page.keyboard.press('Control+A'); await page.keyboard.type(v, { delay: 5 });
          if (rand() < 0.5) await page.keyboard.press('Enter'); else await page.keyboard.press('Tab');
        } else {
          did = 'tap ' + t.label;
          if (device && device.hasTouch) await page.touchscreen.tap(box.x, box.y); else await page.mouse.click(box.x, box.y);
        }
      } else { did = 'idle'; await page.waitForTimeout(200); }
    } catch (e) { did += ' !' + String(e.message).split('\n')[0].slice(0, 60); }
    actions.push(did);
    await page.waitForTimeout(reduce ? 120 : 280);
    const st = await page.evaluate(PAGE_STATE).catch((e) => ({ error: e.message }));
    if (st.error) { await finding('page unreachable: ' + st.error); await page.goto(BASE + '#/feed').catch(() => {}); continue; }
    visited.add((st.hash || '').replace(/\/t\/[^/]+/, '/t/:id').replace(/\/req\/[^/]+/, '/req/:rid'));
    if (problems.length) { const p = problems.splice(0); await finding('error: ' + p[0], p.slice(1, 3).join(' | ')); }
    if (st.textLen === 0) await finding('screen without text', st.hash);
    if (st.scrollWidth > st.vw || st.wide.length) await finding('wider than the viewport: ' + (st.scrollWidth > st.vw ? 'scrollWidth ' + st.scrollWidth + ' > ' + st.vw : ''), st.wide.join(', '));
    const small = (await page.evaluate(PAGE_TARGETS).catch(() => [])).filter((t) => t.inView && (t.w < 43.5 || t.h < 43.5));
    if (small.length) await finding('tap target under 44 px', small.slice(0, 4).map((t) => t.label + ' ' + Math.round(t.w) + '×' + Math.round(t.h)).join(', '));
  }
  const secs = Math.round((Date.now() - t0) / 1000);
  console.log('  ' + step + ' steps in ' + secs + ' s · ' + seen.size + ' distinct targets tapped · ' + dialogs + ' dialogs · routes: ' + Array.from(visited).sort().join(' '));
  console.log('  ' + (findings.length ? findings.length + ' finding(s)' : 'no findings'));
  await browser.close();
  return findings;
}

async function run(opts) {
  opts = opts || {};
  fs.mkdirSync(OUT, { recursive: true });
  const all = [];
  for (const [i, p] of (opts.profiles || PROFILES).entries()) all.push(...await runProfile(p, (opts.seed || SEED) + i, opts.minutes || MINUTES));
  return all;
}
module.exports = { run, runProfile };

if (require.main === module) {
  run().then((f) => { console.log('\n' + (f.length ? 'monkey: ' + f.length + ' finding(s)' : 'monkey: no findings') + ' · seed ' + SEED); process.exitCode = f.length ? 1 : 0; })
    .catch((e) => { console.error(e); process.exit(1); });
}
