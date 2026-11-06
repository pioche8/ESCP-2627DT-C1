/*
 * tests/vercel-dist.test.js — the Vercel app build serves exactly the app (docs/adr/0001-vercel-hosting.md).
 *
 *   node tests/vercel-dist.test.js
 *
 * Builds scripts/vercel-app-dist.js into a temp directory and asserts: every file is byte-identical to the file GitHub
 * Pages serves from the repository; nothing from tests/, docs/, site/, design/, scripts/, .github/ or a dotfile is in
 * it; every local reference of index.html, the stylesheets, app.js, data.js and the manifest resolves; and the two
 * vercel.json files say what the ADR says (output directory, ignore step, no framework for the app, Next.js for the site).
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
  assert.ok(/ -- \.$/.test(v.ignoreCommand), 'ignoreCommand watches site/ itself');
});
test('both commands fit the Vercel API limit (256 characters)', () => {
  [path.join(ROOT, 'vercel.json'), path.join(ROOT, 'site/vercel.json')].forEach((f) => {
    const v = JSON.parse(fs.readFileSync(f, 'utf8'));
    ['buildCommand', 'ignoreCommand', 'installCommand'].forEach((k) => { if (v[k]) assert.ok(v[k].length <= 256, path.relative(ROOT, f) + ' ' + k + ' is ' + v[k].length + ' characters'); });
  });
});
test('dist/ is ignored by git', () => {
  assert.ok(/^\/?dist\/?$/m.test(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8')));
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
