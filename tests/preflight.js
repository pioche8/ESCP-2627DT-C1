#!/usr/bin/env node
/*
 * tests/preflight.js — every gate, in order, one line each (5 Nov 2026).
 *
 *   npm run preflight              (or: node tests/preflight.js)
 *   npm run preflight -- --quick   node-only gates (what CI's "check" job runs), about two seconds
 *   npm run preflight -- --no-site skip the website build (when site/node_modules is not installed)
 *
 * Prints one line per gate: ok / FAIL / skip, the time it took, and the exact command to rerun it alone. Exit 1 if any
 * gate failed. The browser gates need Playwright + Chromium (npm i --no-save playwright && npx playwright install chromium);
 * the site gate needs `cd site && npm ci` once.
 */
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const quick = args.indexOf('--quick') !== -1;
const noSite = args.indexOf('--no-site') !== -1;
const hasPlaywright = (() => { try { require.resolve('playwright', { paths: [ROOT] }); return true; } catch (e) { return false; } })();
const hasSiteDeps = fs.existsSync(path.join(ROOT, 'site', 'node_modules'));

const GATES = [
  { name: 'Engine tests (24)', cmd: 'node tests/engine.test.js' },
  { name: 'Win/loss insights tests (insights.js)', cmd: 'node tests/insights.test.js' },
  { name: 'Data check (data.js against what engine.js and app.js read)', cmd: 'node tests/data-check.js' },
  { name: 'Demo pins (Hohenau 25 → 90 → 100, storage key, reset)', cmd: 'node tests/demo-golden.test.js' },
  { name: 'Engine invariants (seeded property test)', cmd: 'node tests/engine-invariants.test.js' },
  { name: 'Declutter scan (static, five stylesheets)', cmd: 'node tests/declutter-scan.js' },
  { name: 'WCAG AA audit of shared/tokens.json', cmd: 'node shared/check-contrast.js' },
  { name: 'Generated token files match shared/tokens.json', cmd: 'node shared/build-tokens.js && git diff --exit-code --stat -- shared/tokens.css site/src/styles/tokens.css site/src/generated/tokens.ts' },
  { name: 'Generated decision model matches engine.js and data.js', cmd: 'node shared/how-it-decides.js && git diff --exit-code --stat -- site/src/generated/how-it-decides.json docs/HOW_IT_DECIDES.md' },
  { name: 'Site copies of engine.js and data.js are current', cmd: 'node site/scripts/sync-shared.mjs --check' },
  { name: 'Vercel app build: the app files only, byte-identical', cmd: 'node tests/vercel-dist.test.js' },
  { name: 'tests.html in Chromium (file:// and HTTP)', cmd: 'node tests/browser-tests.js', browser: true },
  { name: 'Smoke 390×844 (dark + light + reduced motion, declutter scan on every screen)', cmd: 'node tests/smoke.js', browser: true },
  { name: 'Smoke iPhone 13', cmd: 'SMOKE_DEVICE="iPhone 13" node tests/smoke.js', browser: true },
  { name: 'Smoke iPhone SE', cmd: 'SMOKE_DEVICE="iPhone SE" node tests/smoke.js', browser: true },
  { name: 'Website: lint, typecheck, build', cmd: 'cd site && rm -rf .next && npm run check', site: true }, // a .next left by a build of another branch would fail the typecheck
  { name: 'Website: static export, the "How it decides" page check, Lighthouse ≥ 95 (median of 3) and axe', cmd: 'cd site && npm run audit', site: true, browser: true }
];

let failed = 0;
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
console.log('preflight · ' + (quick ? 'node-only gates' : 'all gates') + ' · ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '\n');
GATES.forEach((g) => {
  let skip = null;
  if (quick && (g.browser || g.site)) skip = 'quick mode';
  else if (g.browser && !hasPlaywright) skip = 'Playwright not installed (npm i --no-save playwright && npx playwright install chromium)';
  else if (g.site && (noSite || !hasSiteDeps)) skip = noSite ? '--no-site' : 'site/node_modules missing (cd site && npm ci)';
  if (skip) { console.log(pad('skip', 5) + pad(g.name, 78) + ' ' + pad('', 7) + ' ' + g.cmd + '   (' + skip + ')'); return; }
  const t0 = Date.now();
  const r = spawnSync(g.cmd, { cwd: ROOT, shell: '/bin/bash', encoding: 'utf8', env: Object.assign({}, process.env, { FORCE_COLOR: '0' }), maxBuffer: 64 * 1024 * 1024 });
  const secs = ((Date.now() - t0) / 1000).toFixed(1) + 's';
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(pad(ok ? 'ok' : 'FAIL', 5) + pad(g.name, 78) + ' ' + pad(secs, 7) + ' ' + g.cmd);
  if (!ok) {
    const tail = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter((l) => /FAIL|Error|error|failed|problem/.test(l)).slice(-12);
    tail.forEach((l) => console.log('       ' + l.trim().slice(0, 160)));
  }
});
console.log('\n' + (failed ? failed + ' gate(s) failed. Rerun each with the command on its line.' : 'All gates green.'));
process.exitCode = failed ? 1 : 0;
