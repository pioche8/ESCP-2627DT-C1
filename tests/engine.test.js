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

// ---- Added 2 Nov 2026 for the DESIGN.md restyle: new functions only, the 14 tests above are unchanged ----

test('evaluate() return shape is unchanged', () => {
  const r = E.evaluate(T('hoh-security'), P, TODAY);
  assert.deepStrictEqual(Object.keys(r), ['tenderId', 'score', 'verdict', 'reason', 'checks', 'count', 'daysLeft', 'effortHours']);
});

test('reason lines match the DESIGN.md status lines', () => {
  const line = (id, p = P, o) => E.reasonLine(T(id), p, E.evaluate(T(id), p, TODAY, o));
  assert.strictEqual(line('ell-schools'), 'Meets all 4 requirements');
  assert.strictEqual(line('kal-fibre'), 'Short by 1 reference · mandatory site visit');
  assert.strictEqual(line('val-dc'), 'Bid must be in Spanish · work in Spain');
  assert.strictEqual(line('hoh-security'), 'ISO 27001 mandatory · 1 to check');
  assert.strictEqual(line('vli-libraries'), 'VCA mandatory');
  assert.strictEqual(line('mor-support'), 'Needs €5M turnover');
});

test('detail headline explains the knock-out and the open question', () => {
  const r = E.evaluate(T('hoh-security'), P, TODAY);
  assert.strictEqual(E.headline(T('hoh-security'), P, r), '1 knock-out requirement: you don’t hold ISO 27001. One more needs your answer.');
  const k = E.evaluate(T('kal-fibre'), P, TODAY);
  assert.strictEqual(E.headline(T('kal-fibre'), P, k), 'No knock-outs, but 2 risks: short by 1 reference, mandatory site visit.');
});

test('closed tender: reason and headline give the deadline date', () => {
  const r = E.evaluate(T('ell-schools'), P, '2026-12-10');
  assert.strictEqual(E.reasonLine(T('ell-schools'), P, r), 'Deadline passed 4 Dec');
  assert.strictEqual(E.headline(T('ell-schools'), P, r), 'The deadline passed on 4 Dec. You can’t bid on this one any more.');
});

test('whatIf: ISO 27001 alone moves Hohenau No-go → Maybe (honest, open question remains)', () => {
  const ch = E.whatIf(D.TENDERS, P, TODAY, {}, { certifications: ['ISO 9001', 'ISO 27001'] });
  assert.deepStrictEqual(ch.map((c) => [c.tenderId, c.from, c.to, c.direction]), [['hoh-security', 'nogo', 'maybe', 'up']]);
});

test('whatIf: after "We meet it" on the unclear line, ISO 27001 flips Hohenau No-go → Go', () => {
  const ch = E.whatIf(D.TENDERS, P, TODAY, { 'hoh-security': { r3: 'pass' } }, { certifications: ['ISO 9001', 'ISO 27001'] });
  assert.deepStrictEqual(ch.map((c) => [c.tenderId, c.from, c.to]), [['hoh-security', 'nogo', 'go']]);
});

test('whatIf: VCA unlocks Vlietdam as Maybe; Spanish unlocks Valdemora as Go; +1 reference unlocks Kaltbrunn', () => {
  const to = (patch) => E.whatIf(D.TENDERS, P, TODAY, {}, patch).map((c) => c.tenderId + ':' + c.to).join(',');
  assert.strictEqual(to({ certifications: ['ISO 9001', 'VCA'] }), 'vli-libraries:maybe');
  assert.strictEqual(to({ languages: ['de', 'en', 'es'] }), 'val-dc:go');
  assert.strictEqual(to({ references: 5 }), 'kal-fibre:go');
});

test('diff: turning cross-border off only produces drops', () => {
  const ch = E.whatIf(D.TENDERS, P, TODAY, {}, { crossBorder: false });
  assert.ok(ch.length > 0);
  ch.forEach((c) => assert.strictEqual(c.direction, 'down'));
  assert.ok(ch.some((c) => c.tenderId === 'val-dc' && c.to === 'nogo'));
});

test('whatIf does not change the profile it is given', () => {
  const p = JSON.parse(JSON.stringify(P));
  E.whatIf(D.TENDERS, p, TODAY, {}, { certifications: ['ISO 9001', 'ISO 27001'], references: 9 });
  assert.deepStrictEqual(p, P);
});

test('demo data: every requirement highlight is inside its original sentence; every tender names its document', () => {
  D.TENDERS.forEach((t) => {
    assert.ok(t.doc, t.id + ' has doc');
    t.requirements.forEach((q) => assert.ok(q.highlight && q.src.indexOf(q.highlight) !== -1, t.id + '/' + q.id));
  });
});

console.log(`\n${passed} tests passed`);
