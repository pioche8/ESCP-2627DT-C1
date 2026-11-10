// site/scripts/sync-shared.mjs — pulls the app's shared sources into the site before every build (`prebuild`).
// Copies are committed, so the site also builds on its own (Vercel Root Directory = site): when the app is not
// beside site/, the script only reports and exits 0. Run by hand: `npm run sync`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(site, '..');
const app = (p) => path.join(root, p);
const out = (p) => path.join(site, p);

// The site's verbatim CommonJS copies of the app's engine, demo data and win/loss arithmetic (step 2 below writes them;
// --check compares them). insights.js since 6 Nov: the phone demo's Bids row shows the app's own Win/loss summary.
const COPIES = [['engine.js', 'src/generated/engine.cjs'], ['data.js', 'src/generated/data.cjs'], ['insights.js', 'src/generated/insights.cjs']];
const copyOf = (src) => '/* Copied verbatim from ../' + src + ' by scripts/sync-shared.mjs. Do not edit: change the app file and run `npm run sync`. */\n' +
  fs.readFileSync(app(src), 'utf8').replace(/\}\)\(this\);\s*$/, '})({});'); // CommonJS: `this` may be undefined under a bundler

// The real app, byte for byte, for the phone on the landing page (since 10 Nov 2026, pass 8): the same allowlist that
// scripts/vercel-app-dist.js publishes for the app on Vercel, copied to public/prototype/. The phone is an iframe of it,
// so the site shows the app's own screens and cannot drift from them; --check fails the moment the app changes and the
// copy does not (CLAUDE.md §11, pass 8).
const PROTO = 'public/prototype';
const appDist = () => createRequire(import.meta.url)(app('scripts/vercel-app-dist.js'));
const listFiles = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? listFiles(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name))]).sort();
function staleProto() {
  if (!fs.existsSync(app('scripts/vercel-app-dist.js'))) return [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-proto-'));
  const { missing } = appDist().build(tmp);
  if (missing.length) return ['app references missing: ' + missing.join(', ')];
  const want = listFiles(tmp), have = fs.existsSync(out(PROTO)) ? listFiles(out(PROTO)) : [];
  const bad = want.filter((f) => !have.includes(f) || !fs.readFileSync(path.join(tmp, f)).equals(fs.readFileSync(out(path.join(PROTO, f)))))
    .concat(have.filter((f) => !want.includes(f))).map((f) => 'site/' + PROTO + '/' + f);
  fs.rmSync(tmp, { recursive: true, force: true });
  return bad;
}

// `node site/scripts/sync-shared.mjs --check` (CI): writes nothing, exits 1 if a committed copy differs from what this
// script would write, so a Vercel build that uses the committed copies cannot disagree with the app (ADR-0001).
if (process.argv.includes('--check')) {
  const stale = COPIES.filter(([src, dst]) => !fs.existsSync(out(dst)) || fs.readFileSync(out(dst), 'utf8') !== copyOf(src)).map(([, dst]) => 'site/' + dst)
    .concat(fs.readdirSync(app('fonts')).filter((f) => /\.woff2$/.test(f) && (!fs.existsSync(out('src/fonts/' + f)) || !fs.readFileSync(out('src/fonts/' + f)).equals(fs.readFileSync(app('fonts/' + f))))).map((f) => 'site/src/fonts/' + f))
    .concat(staleProto());
  console.log(stale.length ? 'sync-shared --check: out of date: ' + stale.join(', ') + ' (run `cd site && npm run sync` and commit)' : 'sync-shared --check: site/src/generated/engine.cjs, data.cjs, insights.cjs, src/fonts and public/prototype/ equal the app\'s engine.js, data.js, insights.js, fonts/ and runtime files');
  // The GitHub Pages export in ../website/ (since 10 Nov 2026, pass 9, ADR-0005): behind site/ or behind the app copy its
  // phone uses → fail. It runs here so CI's check job covers it without a workflow change (scripts/pages-export.mjs).
  let pages = [];
  if (!process.env.SKIP_PAGES_CHECK && fs.existsSync(path.join(root, 'website'))) {
    pages = (await import('./pages-export.mjs')).check();
    console.log(pages.length ? 'pages-export --check: the GitHub Pages export is out of date:\n  ' + pages.slice(0, 20).join('\n  ') + '\n  Rebuild it: cd site && node scripts/pages-export.mjs, then commit website/.' : 'pages-export --check: website/ matches site/ and the app');
  }
  process.exit(stale.length || pages.length ? 1 : 0);
}

if (!fs.existsSync(app('shared/tokens.json')) || !fs.existsSync(app('engine.js'))) {
  console.log('sync-shared: app sources not found beside site/ — using the committed copies in src/generated, src/fonts and public/assets');
  process.exit(0);
}

// 1. tokens → shared/tokens.css, src/styles/tokens.css, src/generated/tokens.ts
execFileSync(process.execPath, [app('shared/build-tokens.js')], { stdio: 'inherit' });
// 1b. the decision model → src/generated/how-it-decides.json and ../docs/HOW_IT_DECIDES.md (probed from engine.js + data.js)
execFileSync(process.execPath, [app('shared/how-it-decides.js')], { stdio: 'inherit' });
// 1c. Open Graph image and icons from the tokens (needs Playwright; keeps the committed files otherwise)
execFileSync(process.execPath, [path.join(site, 'scripts/brand-images.cjs')], { stdio: 'inherit' });

// 2. the real decision engine, the fictional demo data and the win/loss arithmetic, verbatim, as CommonJS modules
fs.mkdirSync(out('src/generated'), { recursive: true });
for (const [src, dst] of COPIES) fs.writeFileSync(out(dst), copyOf(src));

// 2b. the real app for the phone demo (public/prototype/, the Vercel app allowlist, byte for byte)
{ const { files, missing } = appDist().build(out(PROTO)); if (missing.length) throw new Error('sync-shared: the app references missing files: ' + missing.join(', ')); console.log('sync-shared: ' + files.length + ' app files → site/' + PROTO + '/'); }

// 3. fonts (the same vendored files as the app, so both render identically)
fs.mkdirSync(out('src/fonts'), { recursive: true });
for (const f of fs.readdirSync(app('fonts'))) if (/\.woff2$/.test(f)) fs.copyFileSync(app('fonts/' + f), out('src/fonts/' + f));

// 4. photos: 200 px Canva previews, upscaled 3× (Lanczos) to JPEG so next/image has something to serve at 2× DPR.
//    Replace with the full-resolution exports under the same names (public/assets/**.jpg) and delete the upscaling.
let sharp;
try { sharp = (await import('sharp')).default; } catch { console.log('sync-shared: sharp is not installed, keeping the committed photos'); process.exit(0); }
const jobs = [];
const addDir = (dir, sub) => { for (const f of fs.readdirSync(dir)) if (/\.png$/.test(f)) jobs.push([path.join(dir, f), out('public/assets/' + sub + f.replace(/\.png$/, '.jpg'))]); };
addDir(app('design/assets/sectors'), 'sectors/');
addDir(app('assets/img'), '');
jobs.push([app('design/assets/harbor-dusk.png'), out('public/assets/harbor-dusk.jpg')]); // the film still
fs.mkdirSync(out('public/assets/sectors'), { recursive: true });
let made = 0;
for (const [src, dst] of jobs) {
  if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  const meta = await sharp(src).metadata();
  await sharp(src).resize(meta.width * 3, meta.height * 3, { kernel: 'lanczos3' }).jpeg({ quality: 84, mozjpeg: true }).toFile(dst);
  made++;
}
console.log('sync-shared: engine.cjs, data.cjs, ' + fs.readdirSync(out('src/fonts')).length + ' font files, ' + jobs.length + ' photos (' + made + ' re-encoded)');
