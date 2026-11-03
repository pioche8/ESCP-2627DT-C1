#!/usr/bin/env node
/*
 * TenderScout · shared/check-contrast.js — WCAG AA audit of shared/tokens.json.
 * Checks every text/background pair the site and the app actually use, in every app theme and on the site's dark ground.
 * Normal text needs 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) and UI parts 3:1. Exit code 1 on any failure.
 * Run: node shared/check-contrast.js
 */
'use strict';
const T = require('./tokens.json');

function parse(c) {
  c = String(c).trim();
  let m;
  if ((m = /^#([0-9a-f]{6})$/i.exec(c))) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
  if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i.exec(c))) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]];
  throw new Error('cannot parse colour ' + c);
}
function over(fg, bg) { // alpha-composite fg over an opaque bg
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}
function lum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg, base) {
  let b = parse(bg); if (b[3] < 1) b = over(b, parse(base || '#FFFFFF'));
  let f = parse(fg); if (f[3] < 1) f = over(f, b);
  const l1 = lum(f), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const rows = [];
let failures = 0;
function check(group, label, fg, bg, kind, base) {
  const r = ratio(fg, bg, base), need = kind === 'large' ? 3 : kind === 'ui' ? 3 : 4.5, ok = r >= need;
  if (!ok) failures++;
  rows.push([ok ? 'ok  ' : 'FAIL', group, label, fg, 'on', bg, r.toFixed(2) + ':1', '(' + need + ')']);
}

/* ---- site (dark ground) ---- */
const S = T.color.site, V = T.verdict;
check('site', 'body text-2', S.text2, S.bg);
check('site', 'meta text-3', S.text3, S.bg);
check('site', 'text-3 on surface', S.text3, S.surface);
check('site', 'text-3 on surface-2', S.text3, S.surface2);
check('site', 'menu numbers / footer headers text-4', S.text4, S.bg);
check('site', 'text-4 on black footer', S.text4, S.black);
check('site', 'sky link', S.skyLink, S.surface2);
check('site', 'pale text (start sub)', S.textPale, S.bg);
check('site', 'faint mono (pages read)', S.textFaint, S.bg);
check('site', 'menu pill count', S.text3, S.menuPill, 'normal', S.bg);
check('site', 'ink on sky (buttons, dock pill, own chips)', S.ink, S.sky);
check('site', 'ink-2 on white (folder "open tenders", translation)', S.ink2, '#FFFFFF');
check('site', 'ink-3 on white (citation, placeholder)', S.ink3, '#FFFFFF');
check('site', 'dock inactive icon', S.dockIcon, S.dock, 'normal', S.surface);
check('site', 'chip text on chip', S.textSoft, S.chip);
check('site', 'badge text on amber-red', S.amberRedOn, S.amberRed);
check('site', 'white on metal face', '#F4F5F7', S.metal.face);
check('site', 'map label', S.map.label, S.map.land);
check('site', 'map label on home fill', S.map.label, S.map.home);
check('site', 'map label off', S.map.labelOff, S.map.land);
check('site', 'map credit', S.map.credit, S.map.bg);
check('site', 'map tooltip ink-2', S.ink2, S.map.tooltipBg);
['go', 'maybe', 'nogo'].forEach((v) => {
  check('site', V[v].label + ' label on tile (12 px)', V[v].on, V[v].solid);
  check('site', V[v].label + ' text on dark', V[v].onDark, S.surface2);
  check('site', V[v].label + ' text on bg', V[v].onDark, S.bg);
});
check('site', 'Go small (map pin, decorative) vs bg', V.go.solidSmall, S.bg, 'ui');
check('site', 'No-go tile edge vs bg', V.nogo.solid, S.bg, 'ui');

/* ---- app themes ---- */
Object.keys(T.color.app.themes).forEach((p) => ['light', 'dark'].forEach((s) => {
  const t = T.color.app.themes[p][s], g = p + ' ' + s;
  const bg = t.bg, card = t.card, c2 = t['card-2'];
  check(g, 'ink on bg', t.ink, bg); check(g, 'ink-2 on bg', t['ink-2'], bg); check(g, 'ink-3 on bg', t['ink-3'], bg);
  check(g, 'ink on card', t.ink, card); check(g, 'ink-2 on card', t['ink-2'], card); check(g, 'ink-3 on card', t['ink-3'], card);
  check(g, 'ink-3 on card-2', t['ink-3'], c2, 'normal', card); check(g, 'ink-2 on card-2', t['ink-2'], c2, 'normal', card);
  check(g, 'ink-2 on track (AI pill)', t['ink-2'], t.track, 'normal', card);
  check(g, 'brand-text on bg (links)', t['brand-text'], bg); check(g, 'brand-text on card', t['brand-text'], card); check(g, 'brand-text on card-2 (cite chip)', t['brand-text'], c2, 'normal', card);
  check(g, 'brand-text on brand-soft (tonal)', t['brand-text'], t['brand-soft'], 'normal', card);
  check(g, 'brand-on on brand (primary button)', t['brand-on'], t.brand); check(g, 'brand-sub on brand', t['brand-sub'], t.brand);
  check(g, 'brand-on on brand glass', t['brand-on'], t['brand-glass'], 'normal', t.brand);
  check(g, 'dock icon', t['dock-icon'], t.dock); check(g, 'dock active text', t['dock-active-on'], t['dock-active']);
  check(g, 'dock badge', t['dock-badge-on'], t['dock-badge']);
  check(g, 'toast text (bg on ink)', bg, t.ink); check(g, 'toast action', t['toast-action'], t.ink);
  ['go', 'maybe', 'nogo', 'check'].forEach((v) => {
    check(g, v + '-on on ' + v + ' (12 px labels)', t[v + '-on'], t[v]);
    check(g, v + '-ink on ' + v + '-soft (status pill)', t[v + '-ink'], t[v + '-soft'], 'normal', card);
    check(g, v + '-ink on card (status line)', t[v + '-ink'], card);
    check(g, v + '-ink on bg', t[v + '-ink'], bg);
    const glass = (v === 'go' && t['go-glass'] === 'light') || v === 'maybe' ? t['glass-light'] : t['glass-dark'];
    const glassInk = (v === 'go' && t['go-glass'] === 'light') || v === 'maybe' ? t[v + '-on'] : '#FFFFFF';
    check(g, 'AI pill on ' + v + ' block (glass)', glassInk, glass, 'normal', t[v]);
  });
  check(g, 'ink on check-soft (unresolved card)', t.ink, t['check-soft'], 'normal', card);
  check(g, 'bg (button-dark text) on ink', bg, t.ink);
  check(g, 'maybe-ink as "soon" on card', t['maybe-ink'], card);
}));

const w = rows.reduce((a, r) => r.map((c, i) => Math.max(a[i] || 0, String(c).length)), []);
rows.forEach((r) => console.log(r.map((c, i) => String(c).padEnd(w[i])).join('  ')));
console.log('\n' + rows.length + ' pairs · ' + failures + ' failure(s)');
process.exitCode = failures ? 1 : 0;
