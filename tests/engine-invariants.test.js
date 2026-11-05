// tests/engine-invariants.test.js — seeded property test of engine.js (5 Nov 2026). No dependencies.
// Run: node tests/engine-invariants.test.js            (default: 3000 random cases, seed 20261105)
//      SEED=123 CASES=20000 node tests/engine-invariants.test.js
//
// A hand-rolled generator builds random tenders, profiles, overrides and "today" dates, and every case must satisfy:
//   1. a failed knock-out (any check with status fail) on an open tender always gives No-go, score ≤ KNOCKOUT_CAP;
//   2. the score is an integer within 0–100;
//   3. meeting one more requirement (an override of a non-pass line to pass) never lowers the score or the verdict;
//   4. the verdict is consistent with the score and the counts: go ⇔ score ≥ 70, no fail, no review, ≤ 1 risk, a
//      sector match and days left; nogo ⇒ a fail or no sector match; closed ⇔ days left ≤ 0 (score 0);
//   5. per-requirement rules: confidence < REVIEW_THRESHOLD → review unless overridden; an override wins; the six
//      typed rules of CLAUDE.md §4; rank() is sorted go → maybe → nogo → closed, then score, then days left; and
//      evaluate() is deterministic and never mutates its inputs.
// On failure the message carries the seed and the case number, so the same case can be replayed.
'use strict';
const assert = require('assert');
const E = require('../engine.js');

const SEED = +(process.env.SEED || 20261105);
const CASES = +(process.env.CASES || 3000);

// mulberry32: small, seedable, good enough for test data
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(SEED);
const int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const pick = (arr) => arr[int(0, arr.length - 1)];
const some = (arr, max) => { const n = int(0, Math.min(max == null ? arr.length : max, arr.length)); const copy = arr.slice(); const out = []; for (let i = 0; i < n; i++) out.push(copy.splice(int(0, copy.length - 1), 1)[0]); return out; };
const maybe = (p) => rand() < p;

const CERTS = ['ISO 9001', 'ISO 27001', 'VCA', 'ISO 14001', 'SCC'];
const LANGS = ['de', 'en', 'fr', 'nl', 'es', 'it', 'pl'];
const COUNTRIES = ['DE', 'AT', 'ES', 'NL', 'FR', 'IT', 'PL', 'BE'];
const DIVISIONS = ['32', '45', '51', '72', '79', '90', '30', '48'];
const TYPES = ['min_turnover', 'certification', 'min_references', 'language', 'region', 'site_visit', 'other'];
const TODAY_BASE = Date.parse('2026-11-05T00:00:00Z');
const iso = (dayOffset) => new Date(TODAY_BASE + dayOffset * 86400000).toISOString().slice(0, 10);

function genProfile() {
  return {
    turnover: pick([0, 250000, 900000, 1500000, 3200000, 6000000, int(0, 10000000)]),
    references: int(0, 8),
    certifications: some(CERTS),
    cpv: some(DIVISIONS, 4),
    countries: some(COUNTRIES, 3),
    crossBorder: maybe(0.5),
    languages: some(LANGS, 4),
    minValue: pick([0, 50000, 100000]),
    maxValue: pick([500000, 1500000, 5000000])
  };
}
function genRequirement(i) {
  const type = pick(TYPES);
  const q = { id: 'r' + (i + 1), type, label: type + ' ' + (i + 1), cite: 'p. ' + int(1, 200), confidence: maybe(0.25) ? +rand().toFixed(2) : +(0.7 + rand() * 0.3).toFixed(2) };
  switch (type) {
    case 'min_turnover': q.value = pick([500000, 1000000, 1500000, 2000000, 5000000]); break;
    case 'certification': q.value = pick(CERTS); if (maybe(0.5)) q.subcontractAllowed = maybe(0.5); break;
    case 'min_references': q.value = int(1, 6); break;
    case 'language': q.value = pick(LANGS); break;
    case 'region': q.value = pick(COUNTRIES); break;
    case 'site_visit': q.value = '20 Nov 2026, 10:00'; break;
    default: q.note = 'Wording is vague.';
  }
  return q;
}
function genTender(n) {
  const reqs = []; for (let i = 0; i < int(1, 6); i++) reqs.push(genRequirement(i));
  const divs = some(DIVISIONS, 3); if (!divs.length) divs.push(pick(DIVISIONS));
  return {
    id: 't' + n, title: 'Tender ' + n, buyer: 'Buyer ' + n + ' (fictional)', country: pick(COUNTRIES), language: pick(LANGS),
    value: pick([20000, 95000, 310000, 480000, 1100000, 2400000, int(1000, 9000000)]),
    deadline: iso(int(-10, 60)), cpv: divs.map((d) => d + '000000'), pages: int(10, 300), requirements: reqs
  };
}
function genOverrides(tender) {
  const o = {};
  tender.requirements.forEach((q) => { if (maybe(0.2)) o[q.id] = pick(['pass', 'fail']); });
  return o;
}

const RANK = { closed: 0, nogo: 1, maybe: 2, go: 3 };
const ORDER = { go: 0, maybe: 1, nogo: 2, closed: 3 };
let checked = 0;

function ctx(n, tender, profile, today, overrides) {
  return '\n    seed ' + SEED + ', case ' + n + ' (replay: SEED=' + SEED + ' CASES=' + (n + 1) + ' node tests/engine-invariants.test.js)' +
    '\n    tender ' + JSON.stringify(tender) + '\n    profile ' + JSON.stringify(profile) + '\n    today ' + today + ' overrides ' + JSON.stringify(overrides);
}

for (let n = 0; n < CASES; n++) {
  const tender = genTender(n), profile = genProfile(), today = iso(int(-3, 3)), overrides = genOverrides(tender);
  const where = () => ctx(n, tender, profile, today, overrides);
  const tSnap = JSON.stringify(tender), pSnap = JSON.stringify(profile), oSnap = JSON.stringify(overrides);
  const r = E.evaluate(tender, profile, today, overrides);
  const daysLeft = E.daysBetween(today, tender.deadline);
  const cpvHit = tender.cpv.some((c) => profile.cpv.indexOf(c.slice(0, 2)) !== -1);

  // inputs untouched, deterministic
  assert.strictEqual(JSON.stringify(tender) + JSON.stringify(profile) + JSON.stringify(overrides), tSnap + pSnap + oSnap, 'evaluate() mutated its inputs' + where());
  assert.deepStrictEqual(E.evaluate(tender, profile, today, overrides), r, 'evaluate() is not deterministic' + where());

  // 2. score within 0–100, an integer
  assert.ok(Number.isInteger(r.score) && r.score >= 0 && r.score <= 100, 'score ' + r.score + ' outside 0–100' + where());
  assert.strictEqual(r.daysLeft, daysLeft, 'daysLeft' + where());
  assert.strictEqual(r.checks.length, tender.requirements.length, 'one check per requirement' + where());

  // 5. per-requirement rules
  r.checks.forEach((c, i) => {
    const q = tender.requirements[i];
    assert.strictEqual(c.id, q.id, 'check order follows the requirements' + where());
    assert.ok(['pass', 'risk', 'fail', 'review'].indexOf(c.status) !== -1, 'unknown status ' + c.status + where());
    const o = overrides[q.id];
    if (o === 'pass' || o === 'fail') { assert.strictEqual(c.status, o, 'an override wins (' + q.id + ')' + where()); assert.strictEqual(c.confirmed, true, 'confirmed flag' + where()); return; }
    if (q.confidence < E.REVIEW_THRESHOLD) { assert.strictEqual(c.status, 'review', 'confidence ' + q.confidence + ' < ' + E.REVIEW_THRESHOLD + ' must be review, never pass (' + q.id + ')' + where()); return; }
    let want;
    switch (q.type) {
      case 'min_turnover': want = profile.turnover >= q.value ? 'pass' : 'fail'; break;
      case 'certification': want = profile.certifications.indexOf(q.value) !== -1 ? 'pass' : q.subcontractAllowed ? 'risk' : 'fail'; break;
      case 'min_references': { const gap = q.value - profile.references; want = gap <= 0 ? 'pass' : gap === 1 ? 'risk' : 'fail'; break; }
      case 'language': want = profile.languages.indexOf(q.value) !== -1 ? 'pass' : 'risk'; break;
      case 'region': want = profile.countries.indexOf(q.value) !== -1 ? 'pass' : profile.crossBorder ? 'risk' : 'fail'; break;
      case 'site_visit': want = 'risk'; break;
      default: want = 'risk';
    }
    assert.strictEqual(c.status, want, q.type + ' rule (' + q.id + ')' + where());
  });
  const count = { pass: 0, risk: 0, fail: 0, review: 0 };
  r.checks.forEach((c) => count[c.status]++);
  assert.deepStrictEqual(r.count, count, 'count matches the checks' + where());

  // 4. verdict consistent with score, counts and dates
  if (daysLeft <= 0) {
    assert.strictEqual(r.verdict, 'closed', 'deadline passed must be closed' + where());
    assert.strictEqual(r.score, 0, 'closed score is 0' + where());
  } else {
    assert.notStrictEqual(r.verdict, 'closed', 'open tender must not be closed' + where());
    // 1. a failed knock-out always gives No-go
    if (count.fail > 0) { assert.strictEqual(r.verdict, 'nogo', 'a fail must give No-go' + where()); assert.ok(r.score <= E.KNOCKOUT_CAP, 'No-go score capped at ' + E.KNOCKOUT_CAP + where()); }
    if (!cpvHit) { assert.strictEqual(r.verdict, 'nogo', 'no sector match must give No-go' + where()); assert.ok(r.score <= E.KNOCKOUT_CAP, 'capped' + where()); }
    if (r.verdict === 'nogo') assert.ok(count.fail > 0 || !cpvHit, 'No-go needs a fail or no sector match' + where());
    if (r.verdict === 'go') assert.ok(r.score >= 70 && count.fail === 0 && count.review === 0 && count.risk <= 1 && cpvHit, 'Go needs score ≥ 70, no fail, no review, ≤ 1 risk, a sector match' + where());
    if (r.verdict === 'maybe') assert.ok(count.fail === 0 && cpvHit && (r.score < 70 || count.review > 0 || count.risk > 1), 'Maybe is the rest' + where());
    if (count.fail === 0 && cpvHit && r.score >= 70 && count.review === 0 && count.risk <= 1) assert.strictEqual(r.verdict, 'go', 'the Go rule must fire' + where());
  }

  // 3. meeting one more requirement never lowers the score or the verdict
  const notPass = r.checks.filter((c) => c.status !== 'pass');
  if (notPass.length) {
    const c = pick(notPass);
    const better = Object.assign({}, overrides); better[c.id] = 'pass';
    const r2 = E.evaluate(tender, profile, today, better);
    assert.ok(r2.score >= r.score, 'overriding ' + c.id + ' (' + c.status + ') to pass lowered the score ' + r.score + ' → ' + r2.score + where());
    assert.ok(RANK[r2.verdict] >= RANK[r.verdict], 'overriding ' + c.id + ' to pass lowered the verdict ' + r.verdict + ' → ' + r2.verdict + where());
  }
  checked++;
}

// rank(): sorted go → maybe → nogo → closed, then by score, then by days left; same results as evaluate()
for (let n = 0; n < 200; n++) {
  const tenders = []; for (let i = 0; i < int(2, 8); i++) tenders.push(genTender(n * 10 + i));
  const profile = genProfile(), today = iso(int(-3, 3));
  const byId = {}; tenders.forEach((t) => { byId[t.id] = genOverrides(t); });
  const ranked = E.rank(tenders, profile, today, byId);
  assert.strictEqual(ranked.length, tenders.length, 'rank keeps every tender');
  for (let i = 1; i < ranked.length; i++) {
    const a = ranked[i - 1], b = ranked[i];
    const key = (x) => [ORDER[x.verdict], -x.score, x.daysLeft];
    const ka = key(a), kb = key(b);
    const le = ka[0] < kb[0] || (ka[0] === kb[0] && (ka[1] < kb[1] || (ka[1] === kb[1] && ka[2] <= kb[2])));
    assert.ok(le, 'rank order broken between ' + a.tenderId + ' and ' + b.tenderId + ' (seed ' + SEED + ', rank case ' + n + ')');
  }
  ranked.forEach((x) => assert.deepStrictEqual(x, E.evaluate(tenders.find((t) => t.id === x.tenderId), profile, today, byId[x.tenderId]), 'rank() result equals evaluate()'));
}

console.log('engine invariants hold on ' + checked + ' random cases + 200 rankings (seed ' + SEED + ')');
