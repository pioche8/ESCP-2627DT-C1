#!/usr/bin/env node
/*
 * TenderScout · shared/check-contrast.js — WCAG AA audit of shared/tokens.json.
 * Checks every text/background pair the site and the app use, in both schemes (the site uses the dark one).
 * Normal text needs 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) and UI parts 3:1. Exit code 1 on any failure.
 * Run: node shared/check-contrast.js
 */
'use strict';
const T = require('./tokens.json');

function parse(c) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(c).trim());
  if (!m) throw new Error('cannot parse colour ' + c + ' (only opaque hex colours exist in the token set)');
  return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
}
function lum([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(fg, bg) {
  const l1 = lum(parse(fg)), l2 = lum(parse(bg));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const rows = [];
let failures = 0;
function check(group, label, fg, bg, kind) {
  const r = ratio(fg, bg), need = kind === 'large' || kind === 'ui' ? 3 : 4.5, ok = r >= need;
  if (!ok) failures++;
  rows.push([ok ? 'ok  ' : 'FAIL', group, label, fg, 'on', bg, r.toFixed(2) + ':1', '(' + need + ')']);
}

const VERDICTS = ['go', 'maybe', 'nogo', 'check'];
Object.keys(T.color.themes).forEach((s) => {
  const t = T.color.themes[s], g = s + (s === T.color.site ? ' (site + app)' : ' (app)');
  ['bg', 'surface'].forEach((ground) => {
    check(g, 'ink on ' + ground, t.ink, t[ground]);
    check(g, 'muted on ' + ground, t.muted, t[ground]);
    check(g, 'brand text / links / active tab on ' + ground, t.brand, t[ground]);
    VERDICTS.forEach((v) => check(g, v + ' status text on ' + ground, t[v], t[ground]));
  });
  check(g, 'bg text on brand (primary button, selected option)', t.bg, t.brand);
  VERDICTS.forEach((v) => check(g, 'bg text on ' + v + ' fill (score tile, count tile)', t.bg, t[v]));
  check(g, 'bg text on ink (toast, primary hover)', t.bg, t.ink);
  check(g, 'bg text on muted fill (secondary button)', t.bg, t.muted);
  check(g, 'brand fill against bg (switch on, tab underline)', t.brand, t.bg, 'ui');
  check(g, 'muted fill against bg (switch off)', t.muted, t.bg, 'ui');
});

const w = rows.reduce((a, r) => r.map((c, i) => Math.max(a[i] || 0, String(c).length)), []);
rows.forEach((r) => console.log(r.map((c, i) => String(c).padEnd(w[i])).join('  ')));
console.log('\n' + rows.length + ' pairs · ' + failures + ' failure(s)');
process.exitCode = failures ? 1 : 0;
