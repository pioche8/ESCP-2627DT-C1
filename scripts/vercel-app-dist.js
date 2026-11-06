#!/usr/bin/env node
/*
 * scripts/vercel-app-dist.js — the build step of the Vercel project "escp-2627dt-c1" (docs/adr/0001-vercel-hosting.md).
 *
 *   node scripts/vercel-app-dist.js            writes dist/ (what Vercel serves)
 *   node scripts/vercel-app-dist.js <dir>      writes <dir> instead (tests/vercel-dist.test.js uses a temp dir)
 *
 * Copies an explicit allowlist of the app's runtime files, byte for byte, into the output directory. Only that
 * directory is public on Vercel, so tests/, docs/, site/, design/ and everything else in the repository can never be
 * served by accident (GitHub Pages, the fallback, still serves the whole repository as before).
 * Then checks that every local file the app references (index.html src/href, url() in the stylesheets, assets/ paths in
 * app.js and data.js, the manifest's icons) is in the output, and exits 1 if one is missing. No dependencies.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(ROOT, process.argv[2] || 'dist');

// The app's runtime files. Directories are copied recursively with the extension filter.
const FILES = ['index.html', 'engine.js', 'data.js', 'ai.js', 'insights.js', 'app.js', 'styles.css', 'shared/tokens.css'];
const OPTIONAL = ['manifest.webmanifest']; // home-screen install (overnight C3); copied when present
const DIRS = [
  { dir: 'fonts', ext: /\.(woff2|md)$/ }, // the vendored fonts and their licences
  { dir: 'assets/img', ext: /\.(png|jpe?g|webp|svg)$/ },
  { dir: 'assets/icons', ext: /\.(png|svg)$/, optional: true }
];

function list() {
  const out = FILES.slice();
  OPTIONAL.forEach((f) => { if (fs.existsSync(path.join(ROOT, f))) out.push(f); });
  DIRS.forEach((d) => {
    const abs = path.join(ROOT, d.dir);
    if (!fs.existsSync(abs)) { if (d.optional) return; throw new Error('missing directory ' + d.dir); }
    (function walk(rel) {
      fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true }).forEach((e) => {
        const r = rel + '/' + e.name;
        if (e.isDirectory()) walk(r); else if (d.ext.test(e.name)) out.push(r);
      });
    })(d.dir);
  });
  return out.sort();
}

// Every local reference the running app makes, read from the sources themselves.
function references() {
  const refs = new Set();
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const local = (u) => u && !/^(https?:|data:|#|mailto:|\/\/)/.test(u);
  const html = read('index.html');
  (html.match(/\s(?:src|href)="([^"]+)"/g) || []).forEach((m) => { const u = m.replace(/^\s(?:src|href)="|"$/g, '').split(/[?#]/)[0]; if (local(u)) refs.add(u); });
  ['styles.css', 'shared/tokens.css'].forEach((f) => {
    (read(f).match(/url\(\s*["']?([^"')]+)["']?\s*\)/g) || []).forEach((m) => {
      const u = m.replace(/^url\(\s*["']?|["']?\s*\)$/g, '');
      if (local(u)) refs.add(path.posix.normalize(path.posix.join(path.posix.dirname(f), u)));
    });
  });
  ['app.js', 'data.js'].forEach((f) => { (read(f).match(/assets\/img\/[A-Za-z0-9_.-]+\.(?:png|jpe?g|webp|svg)/g) || []).forEach((u) => refs.add(u)); });
  if (fs.existsSync(path.join(ROOT, 'manifest.webmanifest'))) {
    (JSON.parse(read('manifest.webmanifest')).icons || []).forEach((i) => { if (local(i.src)) refs.add(i.src); });
  }
  return Array.from(refs).sort();
}

function build(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  const files = list();
  files.forEach((f) => {
    fs.mkdirSync(path.dirname(path.join(outDir, f)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, f), path.join(outDir, f));
  });
  const missing = references().filter((r) => !fs.existsSync(path.join(outDir, r)));
  return { files, missing };
}

if (require.main === module) {
  const { files, missing } = build(OUT);
  files.forEach((f) => console.log(crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT, f))).digest('hex').slice(0, 12) + '  ' + f));
  if (missing.length) { console.error('vercel-app-dist: referenced but not copied: ' + missing.join(', ')); process.exit(1); }
  console.log('vercel-app-dist: ' + files.length + ' files → ' + path.relative(ROOT, OUT) + '/ (every reference resolves)');
}

module.exports = { list, references, build };
