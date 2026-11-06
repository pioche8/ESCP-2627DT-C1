// Run: node tests/insights.test.js   (no dependencies)
// Win/loss insights (insights.js, 5 Nov 2026): plain arithmetic over the company's past bids. The demo numbers pinned at
// the end are the ones the Win/loss screen shows (38 %, 8 of 21, €2.3M, 6.8 %); tests/smoke.js checks them on screen.
// Wrapped in a function so tests.html can load it next to tests/engine.test.js (no shared top-level names).
(function () {
const assert = require('assert');
const I = require('../insights.js');
const D = require('../data.js');
const E = require('../engine.js');

const TODAY = D.DEMO_TODAY;
let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('ok  ', name); } catch (e) { console.error('FAIL', name, '\n    ', e.message); process.exitCode = 1; } }

const bid = (o) => Object.assign({ id: 'x', submitted: '2026-06-01', cpv: '72', ourPrice: 100000, outcome: 'won' }, o);

test('empty input: zeros, no division by zero, nulls where nothing can be computed', () => {
  const s = I.summary([], TODAY);
  assert.strictEqual(s.submitted, 0);
  assert.strictEqual(s.winRate, 0);
  assert.strictEqual(s.valueWon, 0);
  assert.strictEqual(s.priceGap, null);
  assert.strictEqual(s.topReason, null);
  assert.deepStrictEqual(s.byArea, []);
  assert.deepStrictEqual(s.reasons, []);
});

test('win rate is a whole percent of submitted bids, value won sums our price of won bids only', () => {
  const s = I.summary([bid({ id: 'a', ourPrice: 100000 }), bid({ id: 'b', outcome: 'lost', reason: 'price', winnerPrice: 90000 }), bid({ id: 'c', outcome: 'lost', reason: 'quality' })], TODAY);
  assert.strictEqual(s.submitted, 3);
  assert.strictEqual(s.won, 1);
  assert.strictEqual(s.lost, 2);
  assert.strictEqual(s.winRate, 33);
  assert.strictEqual(s.valueWon, 100000);
});

test('price gap: % above the winner, one decimal; negative when we were cheaper; null without both prices', () => {
  assert.strictEqual(I.priceGap(bid({ ourPrice: 107000, winnerPrice: 100000 })), 7);
  assert.strictEqual(I.priceGap(bid({ ourPrice: 268000, winnerPrice: 253000 })), 5.9);
  assert.strictEqual(I.priceGap(bid({ ourPrice: 95000, winnerPrice: 100000 })), -5);
  assert.strictEqual(I.priceGap(bid({ ourPrice: 95000, winnerPrice: null })), null);
  assert.strictEqual(I.priceGap(bid({ ourPrice: 0, winnerPrice: 100000 })), null);
});

test('the headline price gap averages only the bids lost on price that have both prices', () => {
  const s = I.summary([
    bid({ id: 'a', outcome: 'lost', reason: 'price', ourPrice: 110000, winnerPrice: 100000 }),  // +10
    bid({ id: 'b', outcome: 'lost', reason: 'price', ourPrice: 104000, winnerPrice: 100000 }),  // +4
    bid({ id: 'c', outcome: 'lost', reason: 'price', ourPrice: 104000, winnerPrice: null }),    // no notice price
    bid({ id: 'd', outcome: 'lost', reason: 'quality', ourPrice: 150000, winnerPrice: 100000 }) // not a price loss
  ], TODAY);
  assert.strictEqual(s.priceGap, 7);
  assert.strictEqual(s.reasons.find((r) => r.reason === 'price').count, 3);
});

test('only the 12 months before today count (today included, the same day a year ago excluded)', () => {
  const s = I.summary([
    bid({ id: 'a', submitted: '2025-11-05' }), bid({ id: 'b', submitted: '2025-11-06' }),
    bid({ id: 'c', submitted: '2026-11-05' }), bid({ id: 'd', submitted: '2026-11-06' })
  ], '2026-11-05');
  assert.strictEqual(s.submitted, 2);
  assert.strictEqual(s.from, '2025-11-05');
  assert.strictEqual(s.to, '2026-11-05');
  assert.strictEqual(I.summary([bid({ submitted: '2026-01-15' })], '2026-11-05', 6).submitted, 0);
});

test('monthsBefore keeps the calendar day and clamps to the end of a shorter month', () => {
  assert.strictEqual(I.monthsBefore('2026-11-05', 12), '2025-11-05');
  assert.strictEqual(I.monthsBefore('2026-03-31', 1), '2026-02-28');
  assert.strictEqual(I.monthsBefore('2026-01-15', 2), '2025-11-15');
});

test('areas are sorted by win rate, then by number of bids, then by code; rates are whole percents', () => {
  const s = I.summary([
    bid({ id: 'a', cpv: '45', outcome: 'won' }), bid({ id: 'b', cpv: '45', outcome: 'lost', reason: 'price' }),
    bid({ id: 'c', cpv: '32', outcome: 'won' }),
    bid({ id: 'd', cpv: '72', outcome: 'won' }), bid({ id: 'e', cpv: '72', outcome: 'lost', reason: 'price' }),
    bid({ id: 'f', cpv: '51', outcome: 'lost', reason: 'price' })
  ], TODAY);
  assert.deepStrictEqual(s.byArea.map((a) => a.cpv + ':' + a.won + '/' + a.total + '=' + a.rate), ['32:1/1=100', '45:1/2=50', '72:1/2=50', '51:0/1=0']);
});

test('loss reasons: most frequent first, ties in the fixed order, unknown or missing reasons count as "No feedback yet"', () => {
  const s = I.summary([
    bid({ id: 'a', outcome: 'lost', reason: 'reference' }), bid({ id: 'b', outcome: 'lost', reason: 'quality' }),
    bid({ id: 'c', outcome: 'lost' }), bid({ id: 'd', outcome: 'lost', reason: 'weather' }),
    bid({ id: 'e', outcome: 'lost', reason: 'price' })
  ], TODAY);
  assert.deepStrictEqual(s.reasons.map((r) => r.reason + ':' + r.count), ['unknown:2', 'price:1', 'quality:1', 'reference:1']);
  assert.strictEqual(s.reasons[0].label, 'No feedback yet');
  assert.strictEqual(s.topReason, 'unknown');
});

test('"cheaper" counts the lost bids of a group that were priced below the winner', () => {
  const s = I.summary([
    bid({ id: 'a', outcome: 'lost', reason: 'quality', ourPrice: 90000, winnerPrice: 100000 }),
    bid({ id: 'b', outcome: 'lost', reason: 'quality', ourPrice: 110000, winnerPrice: 100000 })
  ], TODAY);
  assert.strictEqual(s.reasons[0].cheaper, 1);
  assert.strictEqual(s.reasons[0].avgGap, 0);
});

test('deterministic and does not modify its input', () => {
  const input = JSON.parse(JSON.stringify(D.PAST_BIDS));
  const a = I.summary(input, TODAY), b = I.summary(input, TODAY);
  assert.deepStrictEqual(a, b);
  assert.deepStrictEqual(input, D.PAST_BIDS);
});

test('demo pins: 8 of 21 won (38 %), €2.3M won, 6.8 % above the winner on price, price is the top reason', () => {
  const s = I.summary(D.PAST_BIDS, TODAY);
  assert.strictEqual(s.submitted, 21);
  assert.strictEqual(s.won, 8);
  assert.strictEqual(s.winRate, 38);
  assert.strictEqual(s.valueWon, 2319700);
  assert.strictEqual('€' + E.fmt(s.valueWon), '€2.3M');
  assert.strictEqual(s.priceGap, 6.8);
  assert.strictEqual(s.topReason, 'price');
  assert.deepStrictEqual(s.byArea.map((a) => a.cpv + ' ' + a.won + '/' + a.total), ['32 2/4', '72 3/7', '51 2/6', '45 1/4']);
  assert.deepStrictEqual(s.reasons.map((r) => r.reason + ' ' + r.count), ['price 6', 'quality 4', 'reference 2', 'unknown 1']);
  assert.strictEqual(s.reasons.find((r) => r.reason === 'quality').cheaper, 3);
});

test('demo data: every past bid is fictional, inside the window, in one of the firm\'s areas, with a known outcome', () => {
  const codes = D.SECTORS.map((x) => x[0]);
  D.PAST_BIDS.forEach((b) => {
    assert.ok(/\(fictional\)$/.test(b.buyer), b.id + ' buyer is marked (fictional)');
    assert.ok(b.submitted > I.monthsBefore(TODAY, 12) && b.submitted <= TODAY, b.id + ' inside the 12 months');
    assert.ok(codes.indexOf(b.cpv) !== -1 && D.PROFILE.cpv.indexOf(b.cpv) !== -1, b.id + ' cpv is one of the firm\'s divisions');
    assert.ok(b.outcome === 'won' || (b.outcome === 'lost' && I.REASONS.indexOf(b.reason) !== -1), b.id + ' outcome and reason');
  });
});

// Test-session log (6 Nov 2026, pass 2): the north-star metric and its supporting metrics from the events app.js records.
const ev = (e, id, t, extra) => Object.assign({ e: e, t: t * 1000 }, id ? { id: id } : {}, extra || {});

test('test log: a check counts once per tender, only on a tender that was opened, and an undone skip does not count', () => {
  const log = [ev('start', null, 0), ev('open', 'a', 5, { v: 'go', q: [] }), ev('save', 'a', 9), ev('save', 'a', 10),
    ev('open', 'b', 12, { v: 'nogo', q: [] }), ev('skip', 'b', 15), ev('undo', 'b', 16, { d: false }), ev('skip', 'b', 17),
    ev('open', 'c', 20, { v: 'maybe', q: [] }), ev('skip', 'c', 21), ev('undo', 'c', 22, { d: false }),
    ev('skip', 'never-opened', 23)];
  const s = I.testLog(log);
  assert.strictEqual(s.checks, 2, 'a (saved twice) and b (skip, undo, skip); not c (undone), not the tender never opened');
  assert.strictEqual(s.opened, 3);
  assert.strictEqual(s.events, log.length);
});

test('test log: undoing a skip of a tender that was saved before keeps it decided', () => {
  const s = I.testLog([ev('open', 'a', 0, { v: 'go', q: [] }), ev('save', 'a', 1), ev('skip', 'a', 2), ev('undo', 'a', 3, { d: true })]);
  assert.strictEqual(s.checks, 1);
});

test('test log: "Needs your check" lines answered of those shown, Go verdicts saved of those opened', () => {
  const s = I.testLog([ev('start', null, 0), ev('open', 'h', 1, { v: 'nogo', q: ['r3'] }), ev('answer', 'h', 2, { r: 'r3', v: 'pass' }),
    ev('answer', 'h', 3, { r: 'r1', v: 'pass' }), ev('open', 'k', 4, { v: 'maybe', q: ['r2', 'r4'] }), ev('answer', 'k', 5, { r: 'r2', v: 'fail' }),
    ev('answer', 'k', 6, { r: 'r2', v: 'clear' }), ev('open', 'g', 7, { v: 'go', q: [] }), ev('open', 'g2', 8, { v: 'go', q: [] }), ev('save', 'g', 30)]);
  assert.strictEqual(s.reviewShown, 3, 'h:r3, k:r2, k:r4 (r1 was never a "Needs your check" line)');
  assert.strictEqual(s.reviewAnswered, 1, 'h:r3 answered; k:r2 answered then removed');
  assert.deepStrictEqual([s.goSaved, s.goOpened], [1, 2]);
  assert.strictEqual(s.firstGoSeconds, 30, 'from the first Feed to the first Go saved');
});

test('test log: no seconds when the log was recorded with the fast demo setting, or before any Go is saved', () => {
  assert.strictEqual(I.testLog([ev('start', null, 0, { f: 1 }), ev('open', 'g', 1, { v: 'go', q: [] }), ev('save', 'g', 2)]).firstGoSeconds, null);
  assert.strictEqual(I.testLog([ev('start', null, 0, { f: 1 })]).fast, true);
  assert.strictEqual(I.testLog([ev('start', null, 0), ev('open', 'm', 1, { v: 'maybe', q: [] }), ev('save', 'm', 2)]).firstGoSeconds, null);
  assert.ok(/not shown \(recorded with the fast demo setting/.test(I.testLogText([ev('start', null, 0, { f: 1 })])));
});

test('test log text: carries its caption and the fictional line, says "None recorded yet" when empty, does not modify its input', () => {
  const empty = I.testLogText([]);
  assert.ok(empty.indexOf(I.LOG_CAPTION) !== -1 && /fictional/.test(empty) && /None recorded yet\./.test(empty));
  assert.strictEqual(I.LOG_CAPTION, 'For a moderated test on this phone. Not analytics: nothing is sent, and Reset demo clears it.');
  const log = [ev('start', null, 0), ev('open', 'a', 5, { v: 'go', q: [] }), ev('save', 'a', 9)];
  const before = JSON.stringify(log);
  const text = I.testLogText(log, { name: (id) => 'Tender ' + id, label: (v) => v === 'go' ? 'Go' : v });
  assert.strictEqual(JSON.stringify(log), before);
  assert.ok(/Qualification checks completed: 1 /.test(text) && /\+5 s {2}Opened Tender a \(Go\)/.test(text) && /Time from the Feed to the first Go saved: 9 s/.test(text));
  assert.ok(!/\.js\b|\.md\b|\?demo=/.test(text), 'no file names or URL parameters in the exported text');
});

test('test log: flags a full log at the cap', () => {
  const log = []; for (let i = 0; i < I.LOG_MAX; i++) log.push(ev('start', null, i));
  assert.strictEqual(I.testLog(log).full, true);
  assert.ok(/then stopped at 500 events/.test(I.testLogText(log)));
});

console.log(`\n${passed} tests passed`);
})();
