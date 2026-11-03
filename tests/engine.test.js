// Run: node tests/engine.test.js   (no dependencies)
const assert = require('assert');
const E = require('../engine.js');
const D = require('../data.js');

const T = (id) => D.TENDERS.find((t) => t.id === id);
const P = D.PROFILE;
const TODAY = D.DEMO_TODAY;
let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('ok  ', name); } catch (e) { console.error('FAIL', name, '\n    ', e.message); process.exitCode = 1; } }

test('clean match is Go', () => {
  const r = E.evaluate(T('ell-schools'), P, TODAY);
  assert.strictEqual(r.verdict, 'go');
  assert.strictEqual(r.count.fail, 0);
});

test('turnover below minimum is a knock-out, score capped', () => {
  const r = E.evaluate(T('mor-support'), P, TODAY);
  assert.strictEqual(r.verdict, 'nogo');
  assert.ok(r.score <= E.KNOCKOUT_CAP);
  assert.strictEqual(r.checks.find((c) => c.id === 'r1').status, 'fail');
});

test('missing mandatory certificate is a knock-out', () => {
  const r = E.evaluate(T('vli-libraries'), P, TODAY);
  assert.strictEqual(r.checks.find((c) => c.id === 'r1').status, 'fail');
  assert.strictEqual(r.verdict, 'nogo');
});

test('low AI confidence becomes review, never pass', () => {
  const r = E.evaluate(T('hoh-security'), P, TODAY);
  const c = r.checks.find((x) => x.id === 'r3');
  assert.strictEqual(c.status, 'review');
});

test('adding the certificate + confirming the unclear line flips Hohenau to Go', () => {
  const p = { ...P, certifications: ['ISO 9001', 'ISO 27001'] };
  assert.strictEqual(E.evaluate(T('hoh-security'), p, TODAY).verdict, 'maybe'); // review still open
  assert.strictEqual(E.evaluate(T('hoh-security'), p, TODAY, { r3: 'pass' }).verdict, 'go');
});

test('user can confirm a requirement as fail', () => {
  const p = { ...P, certifications: ['ISO 9001', 'ISO 27001'] };
  assert.strictEqual(E.evaluate(T('hoh-security'), p, TODAY, { r3: 'fail' }).verdict, 'nogo');
});

test('short by exactly one reference is a risk, by two is a fail', () => {
  const kal = T('kal-fibre');
  assert.strictEqual(E.evaluate(kal, P, TODAY).checks.find((c) => c.id === 'r2').status, 'risk');
  assert.strictEqual(E.evaluate(kal, { ...P, references: 3 }, TODAY).checks.find((c) => c.id === 'r2').status, 'fail');
});

test('foreign bid language is a risk and adds effort', () => {
  const r = E.evaluate(T('val-dc'), P, TODAY);
  assert.strictEqual(r.checks.find((c) => c.id === 'r3').status, 'risk');
  const rDe = E.evaluate(T('val-dc'), { ...P, languages: ['de', 'en', 'es'] }, TODAY);
  assert.ok(r.effortHours > rDe.effortHours);
});

test('no cross-border appetite makes foreign delivery a fail', () => {
  const r = E.evaluate(T('val-dc'), { ...P, crossBorder: false }, TODAY);
  assert.strictEqual(r.checks.find((c) => c.id === 'r4').status, 'fail');
});

test('past deadline is closed with score 0', () => {
  const r = E.evaluate(T('ell-schools'), P, '2026-12-10');
  assert.strictEqual(r.verdict, 'closed');
  assert.strictEqual(r.score, 0);
});

test('sector mismatch is No-go', () => {
  const r = E.evaluate(T('ell-schools'), { ...P, cpv: ['79'] }, TODAY);
  assert.strictEqual(r.verdict, 'nogo');
});

test('ranking: Go before Maybe before No-go', () => {
  const order = E.rank(D.TENDERS, P, TODAY).map((r) => r.verdict);
  const w = { go: 0, maybe: 1, nogo: 2, closed: 3 };
  for (let i = 1; i < order.length; i++) assert.ok(w[order[i - 1]] <= w[order[i]]);
});

test('deterministic: same input, same output', () => {
  assert.deepStrictEqual(E.rank(D.TENDERS, P, TODAY), E.rank(D.TENDERS, P, TODAY));
});

test('daysBetween counts calendar days', () => {
  assert.strictEqual(E.daysBetween('2026-11-05', '2026-11-14'), 9);
});

console.log(`\n${passed} tests passed`);
