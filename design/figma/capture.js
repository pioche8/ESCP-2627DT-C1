/*
 * design/figma/capture.js — renders every TenderScout screen and state the way an iPhone 13/14 shows it (390 × 844,
 * 47 px status-bar inset, 34 px home-indicator inset, as on a home-screen install with viewport-fit=cover) and writes
 * one compact layer tree per screen. design/figma/make-batches.js turns those trees into Figma Plugin API scripts that
 * rebuild the screens as editable layers (docs/FIGMA.md). Dev-only, like tests/smoke.js: needs Playwright + Chromium.
 *
 *   node design/figma/capture.js                 dark + light into design/figma/out/{dark,light}/
 *   node design/figma/capture.js dark            one scheme
 *   OUT=/tmp/x node design/figma/capture.js      another output folder
 *
 * Per screen: NN-slug.json (the tree) and NN-slug.png (a full-page reference screenshot, never imported into Figma).
 * Tree format (keys kept short so a Figma call can carry several screens):
 *   frame { k:'F', n:name, x,y,w,h, f:fill, r:radius|[tl,tr,br,bl], c:clips, o:opacity, fx:pinned, s:[stroke,w], ch:[…] }
 *   text  { k:'T', x,y,w,h, lh, ws:single-line, tr:ellipsis, al:'C'|'R', sg:[[text,size,weight,colour,icon,underline]] }
 *   image { k:'I', n, x,y,w,h, r, img:'assets/img basename' }   triangle { k:'V', x,y,w,h, f }   diamond { k:'D', cx,cy,s,f }
 * Colours are token names (bg, surface, ink, muted, brand, go, maybe, nogo, check) or [token, alpha]; a raw hex means a
 * colour outside shared/tokens.json, which the batcher reports. Coordinates are relative to the parent layer.
 */
'use strict';
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright is not installed: npm i --no-save playwright'); process.exit(2); }

const ROOT = path.resolve(__dirname, '..', '..');
const BASE = 'file://' + ROOT + '/index.html';
const OUT = process.env.OUT || path.join(__dirname, 'out');
const TOKENS = (() => {
  const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared', 'tokens.json'), 'utf8')).color.themes;
  const inv = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v.toUpperCase(), k]));
  return { dark: inv(t.dark), light: inv(t.light) };
})();
const INSETS = ':root{--safe-top:47px !important;--safe-bottom:34px !important}';

// ---------- in-page serializer (runs in the browser) ----------
function serialize(args) {
  const TOK = args.tok;
  const st = document.createElement('style');
  st.textContent = '[data-hp-before]::before{content:none!important}[data-hp-after]::after{content:none!important}';
  document.head.appendChild(st);
  // painted pseudo-elements (the wordmark dot, the switch knob) become real elements so they have boxes
  const props = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius', 'backgroundColor', 'transform', 'flex', 'flexShrink', 'margin', 'display', 'alignSelf', 'zIndex'];
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    for (const which of ['before', 'after']) {
      const cs = getComputedStyle(el, '::' + which);
      if (!cs || cs.content === 'none' || cs.content === 'normal') continue;
      if (!cs.backgroundColor || /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) continue;
      const i = document.createElement('i');
      i.className = 'pseudo-' + which;
      for (const p of props) i.style[p] = cs[p];
      el.setAttribute('data-hp-' + which, '');
      if (which === 'before') el.insertBefore(i, el.firstChild); else el.appendChild(i);
    }
  }
  const rootH = args.vp ? window.innerHeight : Math.max(document.documentElement.scrollHeight, window.innerHeight);
  const rootW = window.innerWidth;
  const R = (n) => Math.round(n * 10) / 10;
  function col(c) {
    if (!c) return null;
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1; if (a === 0) return null;
    const hex = '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
    const v = TOK[hex] || hex;
    return a < 1 ? [v, +a.toFixed(3)] : v;
  }
  function skipped(el) { return !args.toast && el.closest && el.closest('#toast-root'); }
  function visible(el, cs) {
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    if (el.classList.contains('sr-only') || skipped(el)) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) return true; // zero-size wrappers (#tabbar-root, #toast-root) still hold pinned children
    return !(r.top >= rootH || r.bottom <= 0 || r.left >= rootW || r.right <= 0);
  }
  function nameOf(el) {
    if (el.id) return '#' + el.id;
    if (/^pseudo-/.test(el.className)) return el.className.replace('pseudo-', '::');
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter((c) => c && !/^pseudo/.test(c)).slice(0, 2) : [];
    return el.tagName.toLowerCase() + (cls.length ? '.' + cls.join('.') : '');
  }
  function radius(cs, w, h) {
    const px = (v) => (/%$/.test(v) ? Math.min(w, h) * parseFloat(v) / 100 : parseFloat(v) || 0);
    const r = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(px).map((v) => R(Math.min(v, Math.min(w, h) / 2)));
    if (r.every((v) => v === 0)) return 0;
    return r.every((v) => v === r[0]) ? r[0] : r;
  }
  const isInline = (el, cs) => cs.display === 'inline' && !['IMG', 'INPUT', 'SVG', 'svg'].includes(el.tagName) && !el.classList.contains('shape');
  const WEIGHT = (w) => Math.min(800, Math.max(400, Math.round(parseInt(w, 10) / 100) * 100)); // the vendored Hanken Grotesk covers 400–800
  function underline(el) {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.textDecorationLine && cs.textDecorationLine.includes('underline')) {
        const th = parseFloat(cs.textDecorationThickness), off = parseFloat(cs.textUnderlineOffset);
        return [isNaN(th) ? 1 : th, isNaN(off) ? 0 : off];
      }
      if (e !== el && (cs.display === 'inline-block' || cs.position === 'absolute' || cs.position === 'fixed')) break;
    }
    return 0;
  }
  // consecutive inline nodes → one text layer with styled segments
  function textRun(nodes, container) {
    const texts = [];
    const walk = (n) => {
      if (n.nodeType === 3) { texts.push(n); return; }
      if (n.nodeType !== 1) return;
      if (n.tagName === 'BR') { texts.push(n); return; }
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || n.classList.contains('sr-only') || !isInline(n, cs)) return;
      for (const c of n.childNodes) walk(c);
    };
    nodes.forEach(walk);
    const segs = []; let str = '';
    for (const t of texts) {
      if (t.nodeType === 1) { segs.push(['\n']); str += '\n'; continue; }
      const p = t.parentElement, cs = getComputedStyle(p);
      let s = t.data.replace(/\s+/g, ' ');
      if (/(^|[ \n])$/.test(str) && s.startsWith(' ')) s = s.slice(1);
      if (!s) continue;
      const icon = /Material Symbols/.test(cs.fontFamily) ? 1 : 0;
      segs.push([s, R(parseFloat(cs.fontSize)), icon ? 400 : WEIGHT(cs.fontWeight), col(cs.color), icon, underline(p)]);
      str += s;
    }
    while (segs.length && /^\s*$/.test(segs[0][0])) segs.shift();
    while (segs.length && /^\s*$/.test(segs[segs.length - 1][0])) segs.pop();
    if (!segs.length) return null;
    segs[0][0] = segs[0][0].replace(/^\s+/, '');
    segs[segs.length - 1][0] = segs[segs.length - 1][0].replace(/\s+$/, '');
    const merged = [];
    for (const s of segs) {
      const prev = merged[merged.length - 1];
      if (s.length === 1) { if (prev) prev[0] += '\n'; continue; }
      if (prev && JSON.stringify(prev.slice(1)) === JSON.stringify(s.slice(1))) prev[0] += s[0]; else merged.push(s.slice());
    }
    const rects = [];
    for (const t of texts) {
      if (t.nodeType !== 3 || !t.data.trim()) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      for (const r of rg.getClientRects()) if (r.width > 0.5) rects.push(r);
    }
    if (!rects.length) return null;
    const left = Math.min(...rects.map((r) => r.left)), right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top)), bottom = Math.max(...rects.map((r) => r.bottom));
    // lines: distinct baselines (segments of different sizes on one line share a bottom, not a top)
    const bots = []; for (const r of rects) if (!bots.some((b) => Math.abs(b - r.bottom) < 4)) bots.push(r.bottom);
    const lines = bots.length;
    const ccs = getComputedStyle(container);
    const contentH = Math.max(...rects.map((r) => r.height));
    let lh = parseFloat(ccs.lineHeight);
    if (isNaN(lh)) lh = lines > 1 ? (bottom - top - contentH) / (lines - 1) || contentH : contentH;
    const node = { k: 'T', y: R(top - (lh - contentH) / 2), lh: R(lh), sg: merged };
    if (lines === 1) { node.x = R(left); node.w = R(right - left); node.ws = 1; }
    else {
      const cr = container.getBoundingClientRect();
      const pl = parseFloat(ccs.paddingLeft) || 0, pr = parseFloat(ccs.paddingRight) || 0;
      node.x = R(cr.left + pl - 1); node.w = R(cr.width - pl - pr + 2);
      if (ccs.textAlign === 'center') node.al = 'C'; else if (ccs.textAlign === 'right' || ccs.textAlign === 'end') node.al = 'R';
    }
    node.h = R(lh * lines);
    if (ccs.textOverflow === 'ellipsis' && ccs.overflow !== 'visible') {
      const cr = container.getBoundingClientRect();
      const pl = parseFloat(ccs.paddingLeft) || 0, pr = parseFloat(ccs.paddingRight) || 0;
      node.x = R(cr.left + pl); node.w = R(cr.width - pl - pr); node.tr = 1; delete node.ws; delete node.al;
    }
    return node;
  }
  function ser(el) {
    const cs = getComputedStyle(el);
    if (!visible(el, cs)) return [];
    const r = el.getBoundingClientRect();
    if (cs.display === 'contents' || r.width < 0.5 || r.height < 0.5) {
      const out = []; for (const c of el.children) out.push(...ser(c));
      if (cs.position === 'fixed') out.forEach((n) => { n.fx = 1; }); // children of a pinned zero-size root are pinned too
      return out;
    }
    const box = { x: R(r.left), y: R(r.top), w: R(r.width), h: R(r.height) };
    const fill = col(cs.backgroundColor), rad = radius(cs, r.width, r.height), op = parseFloat(cs.opacity);
    if (el.classList.contains('shape')) {
      const f = fill || col(cs.color);
      if (el.classList.contains('tri')) return [{ k: 'V', ...box, f }];
      if (el.classList.contains('diamond')) return [{ k: 'D', cx: R(r.left + r.width / 2), cy: R(r.top + r.height / 2), s: R(el.offsetWidth), f, r: rad ? 1 : 0 }];
      return [{ k: 'F', n: 'shape', ...box, f, r: rad }];
    }
    if (el.tagName === 'IMG') return [{ k: 'I', n: nameOf(el), ...box, r: rad, img: (el.getAttribute('src') || '').split('/').pop().replace(/\.\w+$/, '') }];
    const node = { k: 'F', n: nameOf(el), ...box };
    if (fill) node.f = fill;
    if (rad) node.r = rad;
    if (op < 1) node.o = +op.toFixed(2);
    if (cs.position === 'fixed') node.fx = 1;
    if (cs.overflow !== 'visible' && (fill || rad) && !el.classList.contains('ms')) node.c = 1;
    const bw = parseFloat(cs.borderTopWidth);
    if (bw > 0 && cs.borderTopStyle !== 'none' && col(cs.borderTopColor)) node.s = [col(cs.borderTopColor), bw];
    const kids = [];
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const s = el.value || el.getAttribute('placeholder') || '';
      if (s) {
        const pcs = el.value ? cs : getComputedStyle(el, '::placeholder');
        const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        kids.push({ k: 'T', x: R(r.left + (parseFloat(cs.paddingLeft) || 0)), y: R(r.top + (r.height - lh) / 2), w: 0, h: R(lh), lh: R(lh), ws: 1, sg: [[s, R(parseFloat(cs.fontSize)), WEIGHT(cs.fontWeight), col(pcs.color) || col(cs.color), 0, 0]] });
      }
    } else {
      let run = [];
      const flush = () => { if (run.length) { const t = textRun(run, el); if (t) kids.push(t); run = []; } };
      for (const c of el.childNodes) {
        if (c.nodeType === 3) { run.push(c); continue; }
        if (c.nodeType !== 1 || ['SCRIPT', 'STYLE', 'TEMPLATE'].includes(c.tagName)) continue;
        const ccs = getComputedStyle(c);
        if (c.tagName === 'BR' || isInline(c, ccs)) {
          run.push(c);
          for (const a of c.querySelectorAll('*')) { const acs = getComputedStyle(a); if (!isInline(a, acs) && a.tagName !== 'BR' && !a.closest('.sr-only')) kids.push(...ser(a)); }
          continue;
        }
        flush();
        kids.push(...ser(c));
      }
      flush();
    }
    if (kids.length) node.ch = kids;
    const painted = fill || node.s || node.c || node.fx;
    if (!painted && !node.o && !/[.#:]/.test(node.n) && kids.length) return kids; // anonymous unpainted wrapper
    if (!painted && !kids.length) return [];
    return [node];
  }
  const kids = [];
  for (const c of document.body.children) kids.push(...ser(c));
  const rel = (nodes, ox, oy) => {
    for (const n of nodes) {
      if (n.k === 'D') { n.cx = R(n.cx - ox); n.cy = R(n.cy - oy); continue; }
      const ax = n.x, ay = n.y; n.x = R(n.x - ox); n.y = R(n.y - oy);
      if (n.ch) rel(n.ch, ax, ay);
    }
  };
  rel(kids, 0, 0);
  return { w: rootW, h: window.innerHeight, H: Math.round(rootH), bg: col(getComputedStyle(document.body).backgroundColor) || col(getComputedStyle(document.documentElement).backgroundColor), ch: kids };
}

// ---------- the screens (one continuous demo session, then a few deep links) ----------
async function run(scheme) {
  const dir = path.join(OUT, scheme);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, reducedMotion: 'reduce', colorScheme: scheme });
  await ctx.addInitScript((css) => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }); }, INSETS);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const settle = (ms) => page.waitForTimeout(ms || 450);
  const waitSheet = async (open) => { await page.waitForFunction((o) => !!document.querySelector('#sheet-root.open') === o, open); await settle(400); };
  const toastGone = () => page.waitForFunction(() => !document.querySelector('#toast-root .toast.show'), null, { timeout: 8000 }).catch(() => {});
  const tab = async (href) => { await page.click('.tabbar a[href="' + href + '"]'); await settle(); };
  const back = async () => { await page.click('button[data-act="back"]'); await settle(); };
  const openCard = async (id, sel) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.click('a.tcard[href="#/t/' + id + '"]'); await page.waitForSelector(sel || '.vhead:not(.loading)', { timeout: 10000 }); await settle(); };
  const list = [];
  async function grab(name, opts) {
    opts = opts || {};
    await settle();
    if (!opts.keepScroll) { await page.evaluate(() => window.scrollTo(0, 0)); await settle(150); }
    const data = await page.evaluate(serialize, { tok: TOKENS[scheme], vp: !!opts.viewportOnly, toast: !!opts.toast });
    data.name = name;
    data.route = page.url().replace(/^.*index\.html/, '');
    const file = name.slice(0, 2) + '-' + name.slice(3).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    fs.writeFileSync(path.join(dir, file + '.json'), JSON.stringify(data));
    await page.screenshot({ path: path.join(dir, file + '.png'), fullPage: !opts.viewportOnly && !opts.keepScroll });
    await page.evaluate(() => { document.querySelectorAll('i.pseudo-before, i.pseudo-after').forEach((n) => n.remove()); document.querySelectorAll('[data-hp-before],[data-hp-after]').forEach((n) => { n.removeAttribute('data-hp-before'); n.removeAttribute('data-hp-after'); }); });
    list.push({ file, name, route: data.route, height: data.H });
    console.log('  ' + scheme + ' ' + name + ' (' + data.H + ' px)');
  }

  await page.goto(BASE + '?demo=reset&theme=' + scheme);
  await page.waitForSelector('.welcome');
  await grab('01 Welcome');
  await page.click('button[data-act="draft"]');
  await page.waitForSelector('#rd-steps .step.done:nth-child(2)', { timeout: 15000 });
  await grab('02 Reading your website', { viewportOnly: true });
  await page.waitForSelector('text=Check your profile', { timeout: 15000 });
  await grab('03 Check your profile');
  await page.click('button[data-act="finish"]');
  await page.waitForSelector('.feed-list');
  await page.waitForFunction(() => document.querySelector('.pages-line').innerText.includes('777'), null, { timeout: 10000 });
  await grab('04 Feed');
  await page.click('.tabs.filter [data-filter="maybe"]');
  await grab('05 Feed · Maybe filter');
  await page.click('.tabs.filter [data-filter="all"]');
  await tab('#/bids');
  await grab('06 Bids · empty');
  await tab('#/feed');

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('a.tcard[href="#/t/ell-schools"]');
  await page.waitForSelector('.vhead.loading');
  await grab('07 Tender · reading the pack', { viewportOnly: true });
  await page.waitForSelector('.vhead.v-go', { timeout: 15000 });
  await grab('08 Tender · Go (Stadt Ellerbach)');
  await page.click('a.req[href="#/t/ell-schools/req/r1"]'); await waitSheet(true);
  await grab('09 Requirement sheet · Meets', { viewportOnly: true });
  await page.goBack(); await waitSheet(false);
  await back();
  await openCard('kal-fibre', '.vhead.v-maybe');
  await grab('10 Tender · Maybe (Stadtwerke Kaltbrunn)');
  await back();
  await openCard('val-dc', '.vhead.v-maybe');
  await grab('11 Tender · Maybe (Universidad de Valdemora)');
  await back();
  await openCard('hoh-security', '.vhead.v-nogo');
  await grab('12 Tender · No-go (Landkreis Hohenau)');
  await page.click('a.req[href="#/t/hoh-security/req/r3"]'); await waitSheet(true);
  await grab('13 Requirement sheet · Needs your check', { viewportOnly: true });
  await page.click('.sheet button[data-confirm="pass"]'); await waitSheet(false);
  await grab('14 Tender · answer saved', { viewportOnly: true, keepScroll: true, toast: true });
  await toastGone();
  await page.click('button[data-ask="0"]');
  await page.waitForSelector('#ans-0 .cite', { timeout: 8000 });
  await grab('15 Ask this tender · answer');
  await back();
  await tab('#/company');
  await grab('16 Company');
  await page.click('button[data-cert="ISO 27001"]');
  await page.waitForSelector('.rescore[data-rescore]');
  await settle(900);
  await grab('17 Company · re-score (No-go → Go)');
  await tab('#/feed');
  await grab('18 Feed · after the re-score');
  await openCard('hoh-security', '.vhead.v-go');
  await grab('19 Tender · Go after the change (Landkreis Hohenau)');
  await back();
  await openCard('vli-libraries', '.vhead.v-nogo');
  await grab('20 Tender · No-go (Gemeente Vlietdam)');
  await page.click('button[data-go="#/t/vli-libraries/skip"]'); await waitSheet(true);
  await page.click('.opt[data-skip="Missing a certificate"]'); await settle(300);
  await grab('21 Skip reason sheet', { viewportOnly: true });
  await page.click('button[data-act="skip-confirm"]');
  await page.waitForSelector('.feed-list');
  await grab('22 Feed · skipped', { toast: true });
  await toastGone();
  await openCard('mor-support', '.vhead.v-nogo');
  await grab('23 Tender · No-go (Centre Hospitalier de Morlanne)');
  await back();
  await openCard('ell-schools', '.vhead.v-go');
  await page.click('button[data-act="save"]');
  await page.waitForSelector('button[data-go="#/bids"]');
  await grab('24 Tender · saved to Bids', { toast: true });
  await toastGone();
  await back();
  await tab('#/bids');
  await grab('25 Bids');
  await page.click('.nav button[data-go="#/about"]');
  await page.waitForSelector('.about-row');
  await grab('26 About');

  await page.goto(BASE + '?today=2026-12-23#/t/ell-schools');
  await page.waitForSelector('.vhead.v-closed', { timeout: 10000 });
  await grab('27 Tender · Closed');
  await page.goto(BASE + '?today=2026-12-23#/feed');
  await page.waitForSelector('.tcard.is-closed');
  await grab('28 Feed · closed tenders');
  await page.goto(BASE + '?offline=1#/feed');
  await page.waitForSelector('.banner');
  await grab('29 Feed · offline');
  await page.goto('about:blank'); await page.goto(BASE + '#/nope');
  await page.waitForSelector('text=Page not found');
  await grab('30 Not found');

  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(list, null, 1));
  await browser.close();
  if (errors.length) { console.error(scheme + ': console/page errors:\n  ' + errors.join('\n  ')); process.exitCode = 1; }
  return list;
}

(async () => {
  const which = process.argv[2] && process.argv[2] !== 'both' ? [process.argv[2]] : ['dark', 'light'];
  for (const s of which) { console.log('capture ' + s + ' → ' + path.relative(ROOT, path.join(OUT, s))); await run(s); }
})().catch((e) => { console.error(e); process.exit(1); });
