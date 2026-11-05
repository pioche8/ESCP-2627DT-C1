/*
 * tests/declutter-scan.js — proves the 18 declutter patterns (4 Nov 2026) are absent from the CSS and the rendered DOM.
 *
 *   node tests/declutter-scan.js                  static scan of the app's and the site's stylesheets
 *   require('./declutter-scan').scanDom(page)     Playwright: scan the current document (used by tests/smoke.js and site/scripts/shots.cjs)
 *
 * Patterns: negative letter-spacing, uppercase, italic, gradients (and the SVG grain), monospace, borders and shadows on
 * cards / panels / inputs, radius over 8 px (switches and the 8 px verdict circle excepted), alpha colours and element
 * opacity (the sheet scrim excepted: one solid colour at 60 %), eyebrow / numbering / all-caps text, pill / chip / tag /
 * badge class names, and code names in visible text.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// The app only: since 5 Nov 2026 the website is back to its original 3 Nov design, which the declutter brief does not cover
// (CLAUDE.md §11 item 103).
const CSS_FILES = ['styles.css', 'shared/tokens.css'];

/* ---------- static CSS scan ---------- */
function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }
function scanCss(file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return [];
  const css = stripComments(fs.readFileSync(abs, 'utf8'));
  const out = [];
  const add = (pattern, m) => out.push({ file, pattern, match: m.trim().slice(0, 80) });
  (css.match(/letter-spacing\s*:\s*-[^;}]*/g) || []).forEach((m) => add('negative letter-spacing', m));
  (css.match(/text-transform\s*:\s*uppercase/g) || []).forEach((m) => add('uppercase', m));
  (css.match(/font-style\s*:\s*(italic|oblique)|font\s*:\s*italic/g) || []).forEach((m) => add('italic', m));
  (css.match(/[a-z-]*gradient\([^;]*/g) || []).forEach((m) => add('gradient', m));
  (css.match(/feTurbulence|grain/gi) || []).forEach((m) => add('grain', m));
  (css.match(/(IBM Plex|ui-monospace|SFMono|Menlo|monospace|--font-mono)[^;]*/g) || []).forEach((m) => add('monospace', m));
  (css.match(/rgba?\([^)]*\)|hsla?\([^)]*\)/g) || []).forEach((m) => add('alpha colour', m));
  // element opacity between 0 and 1 outside @keyframes (fade starts) and the scrim
  const rules = css.split('}');
  rules.forEach((r) => {
    const sel = (r.split('{')[0] || '').trim(), body = r.split('{').slice(1).join('{');
    if (!sel || /^@keyframes|^\s*(from|to|\d+%)/.test(sel) || /\.scrim/.test(sel)) return;
    (body.match(/(?:^|[;\s])opacity\s*:\s*0?\.\d+/g) || []).forEach((m) => add('element opacity', sel + ' { ' + m));
    (body.match(/box-shadow\s*:\s*(?!none)[^;]+/g) || []).forEach((m) => add('box-shadow', sel + ' { ' + m));
    (body.match(/(?:^|[;\s])border(?:-(?:top|right|bottom|left))?\s*:(?!\s*(?:0\b|none))[^;]+/g) || []).forEach((m) => { if (!/^(\.sr-only|:focus-visible)/.test(sel)) add('border', sel + ' { ' + m); });
    (body.match(/border-radius\s*:[^;]+/g) || []).forEach((m) => {
      if (/switch|\.sw\b|sw-knob|\.shape\.circle|\.wordmark::before|wordmark-dot|\.vshape/.test(sel)) return;
      const vals = m.split(':')[1].split(/[\s/]+/).filter(Boolean);
      const big = vals.some((v) => /^\d/.test(v) && (v.endsWith('%') || v.startsWith('999') || parseFloat(v) > 8));
      if (big) add('radius over 8px', sel + ' { ' + m);
    });
  });
  (css.match(/\.[a-z-]*(pill|chip|badge|tag)\b[a-z-]*/gi) || []).forEach((m) => add('pill/chip/tag/badge class', m));
  (css.match(/\.(eyebrow|label)\b[^{]*\{[^}]*text-transform/g) || []).forEach((m) => add('eyebrow', m));
  return out;
}
function scanAllCss() { return CSS_FILES.flatMap(scanCss); }

/* ---------- rendered DOM scan (runs inside the page) ---------- */
function domScanScript() {
  return () => {
    const out = [];
    const CODE = /\b(engine|data|ai|app|styles)\.js\b|tokens\.json|world-atlas|Natural Earth|\bLive:|\.cjs\b|\.tsx?\b|localStorage|\?demo=|README|npm |d3-geo|topojson|Next\.js|Tailwind|Framer/;
    const seen = new Set();
    const add = (pattern, el, extra) => {
      const key = pattern + '|' + (el.className && el.className.baseVal != null ? el.className.baseVal : el.className) + '|' + (extra || '');
      if (seen.has(key)) return; seen.add(key);
      out.push({ pattern, el: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), text: (el.textContent || '').trim().slice(0, 50), extra });
    };
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const ownText = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim();
    const alpha = (c) => { const m = /rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/.exec(c); return m ? parseFloat(m[1]) : 1; };
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('script, style, noscript, [aria-hidden="true"].sr-only')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || !visible(el)) continue;
      const txt = ownText(el);
      const cls = typeof el.className === 'string' ? el.className : '';
      if (/\b[a-z-]*(pill|chip|badge|tag)\b/i.test(cls)) add('pill/chip/tag/badge class', el);
      if (txt) {
        if (parseFloat(cs.letterSpacing) < 0) add('negative letter-spacing', el, cs.letterSpacing);
        if (cs.textTransform === 'uppercase') add('uppercase', el);
        if (cs.fontStyle !== 'normal') add('italic', el, cs.fontStyle);
        if (/mono|plex|menlo|courier|sfmono/i.test(cs.fontFamily) && !/Material Symbols/.test(cs.fontFamily)) add('monospace', el, cs.fontFamily.slice(0, 40));
        if (/^\d{2}\s*[\/—–-]\s*\S/.test(txt) || /^0\d$/.test(txt)) add('section numbering', el, txt);
        const caps = txt.match(/[A-Za-z]{3,}/g) || [];
        if (caps.length >= 2 && caps.every((w) => w === w.toUpperCase())) add('all-caps text', el, txt);
        if (CODE.test(txt)) add('code name in visible text', el, txt);
        if (alpha(cs.color) < 1) add('alpha text colour', el, cs.color);
      }
      const isSwitch = el.getAttribute('role') === 'switch' || el.closest('[role="switch"]');
      const r = el.getBoundingClientRect(), small = r.width <= 16 && r.height <= 16;
      if (!isSwitch && !small && !/\bshape\b|vshape|wordmark-dot/.test(cls)) {
        const maxR = Math.max(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map((v) => (v.endsWith('%') ? (parseFloat(v) / 100) * Math.min(r.width, r.height) : parseFloat(v) || 0)));
        if (maxR > 8.5) add('radius over 8px', el, maxR + 'px');
      }
      if (/gradient\(/.test(cs.backgroundImage) || /gradient\(/.test(cs.maskImage || cs.webkitMaskImage || '')) add('gradient', el, cs.backgroundImage.slice(0, 40));
      if (/feTurbulence|data:image\/svg/.test(cs.backgroundImage)) add('grain', el);
      if (cs.boxShadow && cs.boxShadow !== 'none') add('box-shadow', el, cs.boxShadow.slice(0, 40));
      const bw = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => cs['border' + s + 'Style'] !== 'none' && parseFloat(cs['border' + s + 'Width']) > 0);
      if (bw.length && el !== document.activeElement) add('border', el, bw.join(','));
      if (el.tagName === 'HR') add('divider', el);
      if (alpha(cs.backgroundColor) < 1 && alpha(cs.backgroundColor) > 0) add('alpha background', el, cs.backgroundColor);
      if (parseFloat(cs.opacity) < 1 && parseFloat(cs.opacity) > 0 && !/\bscrim\b/.test(cls) && !el.getAnimations().length && !el.closest('.entering, .morph, .enter, .collapsing, .toast')) add('element opacity', el, cs.opacity);
    }
    return out;
  };
}
async function scanDom(page) { return page.evaluate(domScanScript()); }

module.exports = { scanCss, scanAllCss, scanDom, CSS_FILES };

if (require.main === module) {
  const all = scanAllCss();
  all.forEach((v) => console.log('  ' + v.file + ' · ' + v.pattern + ' · ' + v.match));
  console.log('\nstatic CSS scan: ' + all.length + ' finding(s) in ' + CSS_FILES.length + ' files');
  process.exitCode = all.length ? 1 : 0;
}
