// site/scripts/sync-shared.mjs — pulls the app's shared sources into the site before every build (`prebuild`).
// Copies are committed, so the site also builds on its own (Vercel Root Directory = site): when the app is not
// beside site/, the script only reports and exits 0. Run by hand: `npm run sync`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(site, '..');
const app = (p) => path.join(root, p);
const out = (p) => path.join(site, p);

if (!fs.existsSync(app('shared/tokens.json')) || !fs.existsSync(app('engine.js'))) {
  console.log('sync-shared: app sources not found beside site/ — using the committed copies in src/generated, src/fonts and public/assets');
  process.exit(0);
}

// 1. tokens → shared/tokens.css, src/styles/tokens.css, src/generated/tokens.ts
execFileSync(process.execPath, [app('shared/build-tokens.js')], { stdio: 'inherit' });

// 2. the real decision engine and the fictional demo data, verbatim, as CommonJS modules
fs.mkdirSync(out('src/generated'), { recursive: true });
for (const [src, dst] of [['engine.js', 'src/generated/engine.cjs'], ['data.js', 'src/generated/data.cjs']]) {
  const code = fs.readFileSync(app(src), 'utf8').replace(/\}\)\(this\);\s*$/, '})({});'); // CommonJS: `this` may be undefined under a bundler
  fs.writeFileSync(out(dst), '/* Copied verbatim from ../' + src + ' by scripts/sync-shared.mjs. Do not edit: change the app file and run `npm run sync`. */\n' + code);
}

// 3. fonts (the same vendored files as the app, so both render identically)
fs.mkdirSync(out('src/fonts'), { recursive: true });
for (const f of fs.readdirSync(app('fonts'))) if (/\.woff2$/.test(f)) fs.copyFileSync(app('fonts/' + f), out('src/fonts/' + f));

// 4. photos: 200 px Canva previews, upscaled 3× (Lanczos) to JPEG so next/image has something to serve at 2× DPR.
//    Replace with the full-resolution exports under the same names (public/assets/**.jpg) and delete the upscaling.
const sharp = (await import('sharp')).default;
const jobs = [];
const addDir = (dir, sub) => { for (const f of fs.readdirSync(dir)) if (/\.png$/.test(f)) jobs.push([path.join(dir, f), out('public/assets/' + sub + f.replace(/\.png$/, '.jpg'))]); };
addDir(app('design/assets/sectors'), 'sectors/');
addDir(app('assets/img'), '');
for (const f of ['harbor-dusk', 'sky-clouds', 'sky-tokens', 'harbor-tokens']) jobs.push([app('design/assets/' + f + '.png'), out('public/assets/' + f + '.jpg')]);
fs.mkdirSync(out('public/assets/sectors'), { recursive: true });
let made = 0;
for (const [src, dst] of jobs) {
  if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) continue;
  const meta = await sharp(src).metadata();
  await sharp(src).resize(meta.width * 3, meta.height * 3, { kernel: 'lanczos3' }).jpeg({ quality: 84, mozjpeg: true }).toFile(dst);
  made++;
}
console.log('sync-shared: engine.cjs, data.cjs, ' + fs.readdirSync(out('src/fonts')).length + ' font files, ' + jobs.length + ' photos (' + made + ' re-encoded)');
