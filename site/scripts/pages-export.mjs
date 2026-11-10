// site/scripts/pages-export.mjs — the website as static files under ../website/, served by GitHub Pages from main
// (10 Nov 2026, pass 9, ADR-0005). Pages serves main's root as it is, so the export is committed, like the app.
//
//   cd site && node scripts/pages-export.mjs           build: a static export with basePath /ESCP-2627DT-C1/website
//                                                      and trailing slashes (/how → how/index.html),
//                                                      copied to ../website/, with robots.txt and sitemap.xml for the
//                                                      Pages URL and website/export.json (the fingerprint below)
//   node site/scripts/pages-export.mjs --check         writes nothing; exits 1 if the committed export is behind site/,
//                                                      behind the app copy its phone uses, or was edited by hand
//
// The check does not rebuild (a Next build is not byte-reproducible across machines). It compares fingerprints instead:
//   1. inputs   the sha-256 of every tracked file the build reads (site/src, site/public, the configs, the lockfile and
//               this script), recorded at build time. Any change to them, including a new app copy in
//               site/public/prototype/, makes the export stale until it is rebuilt.
//   2. prototype website/prototype/ equals the app's runtime files byte for byte (the allowlist of
//               scripts/vercel-app-dist.js), so the phone on Pages always runs today's app.
//   3. files    every file in website/ has the sha-256 recorded at build time: nothing added, removed or hand-edited.
// CI runs it through `node site/scripts/sync-shared.mjs --check` (the check job), so no workflow file had to change.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(site, '..');
const OUT_DIR = path.join(root, 'website');
const MANIFEST = 'export.json';
export const BASE_PATH = '/ESCP-2627DT-C1/website';
export const PAGES_ORIGIN = 'https://pioche8.github.io';
export const PAGES_SITE_URL = PAGES_ORIGIN + BASE_PATH;

// What the build reads. Test and recording scripts, the README and the Vercel/ESLint configs do not change the output.
const INPUT = (f) => /^site\/(src|public)\//.test(f) || /^site\/(next\.config\.ts|package\.json|package-lock\.json|tsconfig\.json|postcss\.config\.\w+)$/.test(f) || f === 'site/scripts/pages-export.mjs';
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const listFiles = (dir, base = dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? listFiles(path.join(dir, e.name), base) : [path.relative(base, path.join(dir, e.name)).split(path.sep).join('/')]).sort();

function inputsHash() {
  const tracked = execFileSync('git', ['ls-files', '-z', '--', 'site'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean).filter(INPUT).sort();
  const h = crypto.createHash('sha256');
  // A tracked file deleted from the working tree counts as missing (its name, no content), so a deletion changes the hash too.
  for (const f of tracked) { const abs = path.join(root, f); h.update(f + '\0' + (fs.existsSync(abs) ? sha(fs.readFileSync(abs)) : 'missing') + '\n'); }
  return { hash: h.digest('hex'), count: tracked.length };
}

function prototypeProblems() {
  const require = createRequire(import.meta.url);
  const dist = path.join(root, 'scripts/vercel-app-dist.js');
  if (!fs.existsSync(dist)) return [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-pages-proto-'));
  try {
    const { missing } = require(dist).build(tmp);
    if (missing.length) return ['the app references missing files: ' + missing.join(', ')];
    const want = listFiles(tmp), dir = path.join(OUT_DIR, 'prototype'), have = fs.existsSync(dir) ? listFiles(dir) : [];
    return want.filter((f) => !have.includes(f) || !fs.readFileSync(path.join(tmp, f)).equals(fs.readFileSync(path.join(dir, f)))).map((f) => 'website/prototype/' + f + ' differs from the app\'s ' + f)
      .concat(have.filter((f) => !want.includes(f)).map((f) => 'website/prototype/' + f + ' is not an app file'));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

export function check() {
  const problems = [];
  const mf = path.join(OUT_DIR, MANIFEST);
  if (!fs.existsSync(mf)) return ['website/' + MANIFEST + ' is missing (no Pages export)'];
  const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
  const now = inputsHash();
  if (m.inputs !== now.hash) problems.push('website/ is behind site/: the build inputs changed since the export (' + now.count + ' files)');
  if (m.basePath !== BASE_PATH) problems.push('website/ was built for basePath ' + m.basePath + ', not ' + BASE_PATH);
  problems.push(...prototypeProblems());
  const have = listFiles(OUT_DIR).filter((f) => f !== MANIFEST), want = Object.keys(m.files).sort();
  for (const f of want) if (!have.includes(f)) problems.push('website/' + f + ' is missing');
  for (const f of have) if (!(f in m.files)) problems.push('website/' + f + ' is not in the export');
  for (const f of want) if (have.includes(f) && sha(fs.readFileSync(path.join(OUT_DIR, f))) !== m.files[f]) problems.push('website/' + f + ' was changed after the export');
  return problems;
}

function build() {
  // The site's copies of the app first (engine, data, insights, fonts, public/prototype/), so the export carries today's app.
  execFileSync(process.execPath, [path.join(site, 'scripts/sync-shared.mjs'), '--check'], { stdio: 'inherit', env: { ...process.env, SKIP_PAGES_CHECK: '1' } });
  const env = { ...process.env, STATIC_EXPORT: '1', NEXT_PUBLIC_BASE_PATH: BASE_PATH, SITE_URL: PAGES_ORIGIN, NEXT_TELEMETRY_DISABLED: '1' };
  delete env.VERCEL_PROJECT_PRODUCTION_URL;
  // `next build` directly, not `npm run export`: prebuild would rewrite the tracked public/robots.txt and sitemap.xml
  // for the Pages URL. The Pages pair is written into website/ below instead.
  fs.rmSync(path.join(site, '.next'), { recursive: true, force: true });
  fs.rmSync(path.join(site, 'out'), { recursive: true, force: true });
  execFileSync(path.join(site, 'node_modules/.bin/next'), ['build'], { cwd: site, env, stdio: 'inherit' });
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.cpSync(path.join(site, 'out'), OUT_DIR, { recursive: true });
  // The plain static export (npm run export) still lands in out/ for the other site scripts; this one is not left there.
  fs.rmSync(path.join(site, 'out'), { recursive: true, force: true });
  fs.rmSync(path.join(site, '.next'), { recursive: true, force: true });
  const pages = [['/', '1.0'], ['/how/', '0.8']];
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map(([p, pr]) => '  <url><loc>' + PAGES_SITE_URL + p + '</loc><changefreq>weekly</changefreq><priority>' + pr + '</priority></url>').join('\n') + '\n</urlset>\n');
  // Crawlers read robots.txt at the domain root only, so this copy is informational; it names the sitemap.
  fs.writeFileSync(path.join(OUT_DIR, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + PAGES_SITE_URL + '/sitemap.xml\n');
  const files = Object.fromEntries(listFiles(OUT_DIR).filter((f) => f !== MANIFEST).map((f) => [f, sha(fs.readFileSync(path.join(OUT_DIR, f)))]));
  const { hash, count } = inputsHash();
  const manifest = {
    note: 'Generated by site/scripts/pages-export.mjs (ADR-0005). Do not edit website/ by hand: change site/ and run `cd site && node scripts/pages-export.mjs`.',
    basePath: BASE_PATH, siteUrl: PAGES_SITE_URL, inputs: hash, inputFiles: count, files,
  };
  fs.writeFileSync(path.join(OUT_DIR, MANIFEST), JSON.stringify(manifest, null, 1) + '\n');
  const bytes = Object.keys(files).reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0);
  console.log('pages-export: ' + Object.keys(files).length + ' files (' + (bytes / 1048576).toFixed(1) + ' MB) → website/, served at ' + PAGES_SITE_URL + '/');
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const problems = check();
    console.log(problems.length
      ? 'pages-export --check: the GitHub Pages export is out of date:\n  ' + problems.slice(0, 20).join('\n  ') + (problems.length > 20 ? '\n  … ' + (problems.length - 20) + ' more' : '') + '\n  Rebuild it: cd site && node scripts/pages-export.mjs, then commit website/.'
      : 'pages-export --check: website/ matches site/ and the app (' + JSON.parse(fs.readFileSync(path.join(OUT_DIR, MANIFEST), 'utf8')).inputFiles + ' input files, the app copy in website/prototype/, every exported file unchanged)');
    process.exit(problems.length ? 1 : 0);
  }
  build();
}
