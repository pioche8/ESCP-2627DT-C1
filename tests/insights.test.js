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

console.log(`\n${passed} tests passed`);
})();
