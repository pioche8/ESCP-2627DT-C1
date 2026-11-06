/*
 * tests/vercel-dist.test.js — the Vercel app build serves exactly the app (docs/adr/0001-vercel-hosting.md).
 *
 *   node tests/vercel-dist.test.js
 *
 * Builds scripts/vercel-app-dist.js into a temp directory and asserts: every file is byte-identical to the file GitHub
 * Pages serves from the repository; nothing from tests/, docs/, site/, design/, scripts/, .github/ or a dotfile is in
 * it; every local reference of index.html, the stylesheets, app.js, data.js and the manifest resolves; and the two
 * vercel.json files say what the ADR says (output directory, ignore step, no framework for the app, Next.js for the site).
 * Since pass 3 (docs/adr/0003-vercel-from-github-actions.md) also: Git-triggered deploys are off in both files (only the
 * workflow deploys); scripts/vercel-changed.js reads the same paths as the ignore steps; scripts/vercel-deploy.js creates
 * the projects escp-2627dt-c1 and escp-2627dt-c1-site with their vercel.json settings and Node 22.x; the workflows use
 * only the two Vercel secrets, an exact Vercel CLI version and actions pinned to commit SHAs.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const dist = require('../scripts/vercel-app-dist.js');

const ROOT = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); } catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-dist-'));
const { files, missing } = dist.build(tmp);
const walk = (d, rel) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name), rel + e.name + '/') : [rel + e.name]);
const served = walk(tmp, '').sort();

console.log('Vercel app build (' + served.length + ' files)');
test('the build copies the app shell and its scripts', () => {
  ['index.html', 'engine.js', 'data.js', 'ai.js', 'insights.js', 'app.js', 'styles.css', 'shared/tokens.css'].forEach((f) => assert.ok(served.includes(f), f + ' missing'));
});
test('every served file is byte-identical to the repository file (what GitHub Pages serves)', () => {
  served.forEach((f) => assert.ok(fs.readFileSync(path.join(tmp, f)).equals(fs.readFileSync(path.join(ROOT, f))), f + ' differs'));
});
test('only allowlisted paths are served: no tests, docs, site, design, scripts, CI or dotfiles', () => {
  const bad = served.filter((f) => /^(tests|docs|site|design|scripts|marketing|\.github|\.claude|node_modules)\//.test(f) || /(^|\/)\./.test(f) || /\.(md|json)$/.test(f) && !/^fonts\/LICENSES\.md$/.test(f));
  assert.deepStrictEqual(bad, []);
  assert.deepStrictEqual(served, files.slice().sort(), 'the output holds exactly the listed files');
});
test('every local reference the app makes resolves inside the build', () => {
  assert.deepStrictEqual(missing, []);
  assert.ok(dist.references().length >= 10, 'the reference scan found ' + dist.references().length + ' references (expected the scripts, the stylesheets, three fonts and the photos)');
});
test('the app project config: no framework, build into dist/, ignore step on the app files', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.strictEqual(v.framework, null);
  assert.strictEqual(v.outputDirectory, 'dist');
  assert.ok(/vercel-app-dist\.js/.test(v.buildCommand), 'buildCommand runs the dist script');
  ['index.html', 'app.js', 'engine.js', 'data.js', 'ai.js', 'insights.js', 'styles.css', 'shared', 'fonts', 'assets', 'vercel.json'].forEach((p) => assert.ok(v.ignoreCommand.split(/\s+/).includes(p), 'ignoreCommand watches ' + p));
});
test('the site project config: Next.js, ignore step on site/ (it builds from its committed, CI-checked copies)', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/vercel.json'), 'utf8'));
  assert.strictEqual(v.framework, 'nextjs');
  assert.ok(/ -- \. \|\| exit 1$/.test(v.ignoreCommand), 'ignoreCommand watches site/ itself');
});
test('both ignore steps map every non-zero outcome to 1 (Vercel documents only 0 = skip, 1 = build)', () => {
  ['vercel.json', 'site/vercel.json'].forEach((f) => assert.ok(/ \|\| exit 1$/.test(JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')).ignoreCommand), f));
});
test('both commands fit the Vercel API limit (256 characters)', () => {
  [path.join(ROOT, 'vercel.json'), path.join(ROOT, 'site/vercel.json')].forEach((f) => {
    const v = JSON.parse(fs.readFileSync(f, 'utf8'));
    ['buildCommand', 'ignoreCommand', 'installCommand'].forEach((k) => { if (v[k]) assert.ok(v[k].length <= 256, path.relative(ROOT, f) + ' ' + k + ' is ' + v[k].length + ' characters'); });
  });
});
test('Git-triggered deploys are off in both projects: only .github/workflows/vercel.yml deploys (ADR-0003 point 8)', () => {
  ['vercel.json', 'site/vercel.json'].forEach((f) => assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')).git, { deploymentEnabled: false }, f));
});
test('the workflow deploys a project when, and only when, a path of its ignore step changed', () => {
  const changed = require('../scripts/vercel-changed.js');
  assert.deepStrictEqual(changed.watched('site'), ['site']);
  const app = changed.watched('app');
  ['index.html', 'app.js', 'styles.css', 'shared', 'fonts', 'assets', 'vercel.json', 'scripts/vercel-app-dist.js'].forEach((p) => assert.ok(app.includes(p), 'app watches ' + p));
  assert.ok(changed.touches('shared/tokens.css', app) && changed.touches('assets/img/x.jpg', app) && !changed.touches('docs/DEPLOY.md', app) && !changed.touches('app.json', app));
  assert.ok(changed.touches('site/src/app/page.tsx', ['site']) && !changed.touches('sitemap.xml', ['site']));
  assert.deepStrictEqual(changed.changed('', 'HEAD'), ['app', 'site'], 'an unknown base deploys both');
  assert.deepStrictEqual(changed.changed('0000000000000000000000000000000000000000', 'HEAD'), ['app', 'site'], 'a new branch deploys both');
});
test('the deploy script creates escp-2627dt-c1 and escp-2627dt-c1-site with their vercel.json settings and Node 22.x', () => {
  const deploy = require('../scripts/vercel-deploy.js');
  const app = deploy.settings('app'), site = deploy.settings('site');
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.deepStrictEqual([app.name, site.name], ['escp-2627dt-c1', 'escp-2627dt-c1-site']);
  assert.deepStrictEqual([app.framework, app.rootDirectory, app.buildCommand, app.outputDirectory, app.installCommand], [null, null, v.buildCommand, 'dist', v.installCommand]);
  assert.deepStrictEqual([site.framework, site.rootDirectory], ['nextjs', 'site']);
  assert.ok(app.nodeVersion === '22.x' && site.nodeVersion === '22.x');
});
test('the workflows use only VERCEL_TOKEN and VERCEL_ORG_ID, an exact Vercel CLI and actions pinned to commit SHAs', () => {
  const wf = (f) => fs.readFileSync(path.join(ROOT, '.github/workflows', f), 'utf8');
  const vercel = wf('vercel.yml');
  const secrets = Array.from(new Set((vercel.match(/secrets\.[A-Z_]+/g) || []))).sort();
  assert.deepStrictEqual(secrets, ['secrets.VERCEL_ORG_ID', 'secrets.VERCEL_TOKEN']);
  assert.ok(/VERCEL_CLI_VERSION: \d+\.\d+\.\d+\n/.test(vercel), 'the Vercel CLI version is exact');
  assert.ok(/SITE_URL: https:\/\/escp-2627dt-c1-site\.vercel\.app\n/.test(vercel), 'SITE_URL is the site project\'s domain');
  ['vercel.yml', 'post-deploy.yml', 'webkit.yml'].forEach((f) => {
    const uses = (wf(f).match(/^\s*(?:-\s*)?uses:\s*(\S+)/gm) || []).map((u) => u.replace(/^\s*(?:-\s*)?uses:\s*/, ''));
    uses.filter((u) => !u.startsWith('./')).forEach((u) => assert.ok(/@[0-9a-f]{40}$/.test(u), f + ': ' + u + ' is not pinned to a commit SHA'));
  });
});
test('dist/ is ignored by git', () => {
  assert.ok(/^\/?dist\/?$/m.test(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')));
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
