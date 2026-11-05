// tests/demo-golden.test.js — the numbers the live demo shows, pinned through engine.js only (5 Nov 2026).
// Run: node tests/demo-golden.test.js   (no dependencies; also runs in tests.html's shim)
//
// BRIEF.md's 75-second path: ?demo=reset,fast → Feed "6 new tenders · 1 Go · 2 Maybe · 3 No-go · 777 pages in 4 languages"
// → Landkreis Hohenau No-go 25 → Company → ISO 27001 → Maybe 90 → "We meet it" → Go 100. These numbers are spoken on
// stage and checked by tests/smoke.js; this file catches a change before a browser is involved.
(function () {
'use strict';
const assert = require('assert');
const E = require('../engine.js');
const D = require('../data.js');
const fs = typeof require === 'function' && typeof process !== 'undefined' && process.versions && process.versions.node ? require('fs') : null;
const path = fs ? require('path') : null;

const T = (id) => D.TENDERS.find((t) => t.id === id);
const P = D.PROFILE;
const TODAY = D.DEMO_TODAY;
const WITH_ISO = Object.assign({}, P, { certifications: P.certifications.concat(['ISO 27001']) });

const HOW_TO_CHANGE = [
  '',
  '    These numbers are the live demo (BRIEF.md, 75-second path) and tests/smoke.js pins the same values.',
  '    docs/START_HERE.md tasks T2 (a seventh tender) and T3 (an Italian or Polish tender) move them on purpose.',
  '    To change a pin deliberately: update the expected value in this test AND in tests/smoke.js AND in BRIEF.md',
  '    in the same pull request, and say in the PR body why the demo numbers moved. Never let a data change move them',
  '    as a side effect.'
].join('\n');

let passed = 0, failed = 0;
function test(name, fn, plain) {
  try { fn(); passed++; console.log('ok  ', name); }
  catch (e) { failed++; console.error('FAIL', name, '\n    ', e.message + (plain ? '' : HOW_TO_CHANGE)); if (typeof process !== 'undefined') process.exitCode = 1; }
}

test('Landkreis Hohenau opens as No-go 25 with the demo profile (BRIEF step 4)', () => {
  const r = E.evaluate(T('hoh-security'), P, TODAY);
  assert.strictEqual(r.verdict + ' ' + r.score, 'nogo 25');
  assert.strictEqual(r.checks.find((c) => c.id === 'r1').status, 'fail', 'ISO 27001 is the knock-out');
  assert.strictEqual(r.checks.find((c) => c.id === 'r3').status, 'review', '"comparable qualification" needs the owner');
  assert.strictEqual(E.headline(T('hoh-security'), P, r), '1 knock-out requirement: you don’t hold ISO 27001. One more needs your answer.');
});

test('ISO 27001 alone moves Hohenau to Maybe 90 (the honest intermediate state)', () => {
  const r = E.evaluate(T('hoh-security'), WITH_ISO, TODAY);
  assert.strictEqual(r.verdict + ' ' + r.score, 'maybe 90');
  const ch = E.whatIf(D.TENDERS, P, TODAY, {}, { certifications: WITH_ISO.certifications });
  assert.deepStrictEqual(ch.map((c) => [c.tenderId, c.from, c.to, c.fromScore, c.toScore]), [['hoh-security', 'nogo', 'maybe', 25, 90]]);
});

test('"We meet it" on the unclear line, then ISO 27001: Hohenau No-go 25 → Go 100 (BRIEF step 5, the hero moment)', () => {
  const overrides = { 'hoh-security': { r3: 'pass' } };
  assert.strictEqual(E.evaluate(T('hoh-security'), P, TODAY, overrides['hoh-security']).verdict, 'nogo', 'still No-go until ISO 27001');
  const r = E.evaluate(T('hoh-security'), WITH_ISO, TODAY, overrides['hoh-security']);
  assert.strictEqual(r.verdict + ' ' + r.score, 'go 100');
  const ch = E.whatIf(D.TENDERS, P, TODAY, overrides, { certifications: WITH_ISO.certifications });
  assert.deepStrictEqual(ch.map((c) => [c.tenderId, c.from, c.to, c.fromScore, c.toScore]), [['hoh-security', 'nogo', 'go', 25, 100]]);
});

test('the Feed after onboarding: 6 open tenders, 1 Go · 2 Maybe · 3 No-go, Ellerbach Go 100 first', () => {
  const ranked = E.rank(D.TENDERS, P, TODAY);
  assert.strictEqual(ranked.length, 6, '6 tenders');
  const counts = ranked.reduce((c, r) => { c[r.verdict] = (c[r.verdict] || 0) + 1; return c; }, {});
  assert.deepStrictEqual(counts, { go: 1, maybe: 2, nogo: 3 });
  assert.strictEqual(ranked[0].tenderId + ' ' + ranked[0].verdict + ' ' + ranked[0].score, 'ell-schools go 100');
  assert.strictEqual(ranked[0].daysLeft, 29, 'Ellerbach: 29 days left on Thu 5 Nov');
  assert.strictEqual(E.reasonLine(T('ell-schools'), P, ranked[0]), 'Meets all 4 requirements');
});

test('the pages line: "read 777 pages in 4 languages"', () => {
  const pages = D.TENDERS.reduce((s, t) => s + t.pages, 0);
  const langs = D.TENDERS.reduce((s, t) => (s.indexOf(t.language) === -1 ? s.concat([t.language]) : s), []).length;
  assert.strictEqual(pages + ' pages in ' + langs + ' languages', '777 pages in 4 languages');
  assert.strictEqual(D.SECTORS.length, 45, 'Welcome: "All 45 EU sectors"');
});

test('after the flip the Feed counts are 2 Go · 2 Maybe · 2 No-go', () => {
  const ranked = E.rank(D.TENDERS, WITH_ISO, TODAY, { 'hoh-security': { r3: 'pass' } });
  const counts = ranked.reduce((c, r) => { c[r.verdict] = (c[r.verdict] || 0) + 1; return c; }, {});
  assert.deepStrictEqual(counts, { go: 2, maybe: 2, nogo: 2 });
});

test('BRIEF step 7: the Dutch libraries tender is a No-go on a missing VCA certificate', () => {
  const r = E.evaluate(T('vli-libraries'), P, TODAY);
  assert.strictEqual(r.verdict, 'nogo');
  assert.strictEqual(E.reasonLine(T('vli-libraries'), P, r), 'VCA mandatory');
});

test('the demo date is Thu 5 Nov 2026 and every demo deadline is still open on it', () => {
  assert.strictEqual(TODAY, '2026-11-05');
  D.TENDERS.forEach((t) => assert.ok(E.daysBetween(TODAY, t.deadline) > 0, t.id + ' must not be closed on the demo date'));
});

// ---- Storage key and reset behaviour at unit level (source assertions on app.js and index.html; the smoke test proves
// ---- the behaviour in a browser). These only run under node: tests.html has no file system.
if (fs) {
  const ROOT = path.resolve(__dirname, '..');
  const app = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  test('the storage key is tenderscout.v2 in app.js and in the inline scheme script of index.html', () => {
    assert.ok(/var KEY = 'tenderscout\.v2';/.test(app), "app.js: var KEY = 'tenderscout.v2'");
    assert.ok(html.indexOf("localStorage.getItem('tenderscout.v2')") !== -1, 'index.html reads the same key before the first paint');
    assert.strictEqual((app.match(/tenderscout\.v\d/g) || []).filter((k) => k !== 'tenderscout.v2').length, 0, 'no other tenderscout.vN key in app.js');
  }, true);

  test('a fresh state (what ?demo=reset and "Reset demo" write) is the demo profile, not onboarded, with nothing saved', () => {
    const m = /function fresh\(\) \{\s*return (\{[\s\S]*?\});\s*\}/.exec(app);
    assert.ok(m, 'fresh() found in app.js');
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const state = new Function('D', 'clone', 'return ' + m[1] + ';')(D, clone); // eslint-disable-line no-new-func
    assert.deepStrictEqual(Object.keys(state).sort(), ['filter', 'onboarded', 'overrides', 'palette', 'profile', 'saved', 'skipped', 'theme', 'website'].sort(), 'tenderscout.v2 shape');
    assert.strictEqual(state.onboarded, false);
    assert.deepStrictEqual(state.profile, D.PROFILE, 'profile = the demo profile');
    assert.deepStrictEqual([state.overrides, state.saved, state.skipped], [{}, {}, {}]);
    assert.strictEqual(state.theme, 'dark', 'opens dark (CLAUDE.md §11.41)');
    assert.strictEqual(state.filter, 'all');
    assert.strictEqual(E.evaluate(T('hoh-security'), state.profile, TODAY).score, 25, 'a reset profile gives Hohenau 25 again');
  }, true);

  test('?demo=reset wipes the state, keeps ?demo=fast, drops "reset" from the address and lands on #/welcome/1', () => {
    const i = app.indexOf("demoFlags.indexOf('reset')");
    assert.ok(i > 0, 'the reset branch exists');
    const block = app.slice(i, i + 600);
    assert.ok(/S = fresh\(\);/.test(block), 'S = fresh()');
    assert.ok(/save\(\);/.test(block), 'the fresh state is written (a reload does not reset again)');
    assert.ok(/indexOf\('fast'\) !== -1\) params\.set\('demo', 'fast'\); else params\.delete\('demo'\)/.test(block), 'demo=fast survives, demo=reset is dropped');
    assert.ok(/history\.replaceState\([\s\S]*?'#\/welcome\/1'\);/.test(block), 'the address becomes #/welcome/1');
    assert.ok(/case 'reset':[\s\S]*?S = fresh\(\);[\s\S]*?replaceTo\('#\/welcome\/1'\)/.test(app), 'About → Reset demo does the same');
  }, true);
}

console.log('\n' + passed + ' demo pins hold' + (failed ? ', ' + failed + ' FAILED' : ''));
})();
