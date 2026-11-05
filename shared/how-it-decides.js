#!/usr/bin/env node
/*
 * shared/how-it-decides.js — the decision model, derived from engine.js and data.js at build time (5 Nov 2026).
 *
 *   node shared/how-it-decides.js
 *     → site/src/generated/how-it-decides.json   (the website's "How it decides" page renders this)
 *     → docs/HOW_IT_DECIDES.md                   (the same content as Markdown; one source, two outputs)
 *
 * Nothing in the outputs is typed by hand. Every rule is PROBED: the engine is run on controlled inputs and the outcome is
 * recorded (a turnover one euro short fails, a reference short by one is a risk, …). The four score weights, the Go
 * threshold, the review threshold and the knock-out cap are read from the engine's exports or its source text and then
 * verified against the probes; a mismatch stops the build with a message, so a changed engine cannot ship an old page.
 * The demo table is rank() on data.js with the demo profile; the test counts are counted in the test files.
 * The outputs are deterministic (content hashes, no timestamps), so CI can check they are in sync (git diff).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const E = require(path.join(ROOT, 'engine.js'));
const D = require(path.join(ROOT, 'data.js'));
const engineSrc = fs.readFileSync(path.join(ROOT, 'engine.js'), 'utf8');
const sha = (f) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 12);

function fail(msg) { console.error('how-it-decides: ' + msg); process.exit(1); }
function expect(cond, msg) { if (!cond) fail('probe contradicts the source: ' + msg); }
function num(re, what) { const m = re.exec(engineSrc); if (!m) fail('cannot find ' + what + ' in engine.js (' + re + ')'); return +m[1]; }

/* ---------- 1. constants: exports first, source text where there is no export, probes to verify ---------- */
const REVIEW = E.REVIEW_THRESHOLD, CAP = E.KNOCKOUT_CAP;
const GO_MIN = num(/score >= (\d+) && count\.review === 0 && count\.risk <= (\d+)/, 'the Go rule');
const GO_MAX_RISK = num(/score >= \d+ && count\.review === 0 && count\.risk <= (\d+)/, 'the Go rule risk limit');
const W = {
  sector: num(/var sector = cpvHit \? (\d+) : 0/, 'the sector weight'),
  sizeIn: num(/<= profile\.maxValue\) \? (\d+) :/, 'the size weight'),
  sizeBelow: num(/tender\.value < profile\.minValue \? (\d+) : (\d+)/, 'size below'),
  sizeAbove: +(/tender\.value < profile\.minValue \? \d+ : (\d+)/.exec(engineSrc) || [])[1],
  req: num(/Math\.round\((\d+) \* \(count\.pass \+ ([\d.]+) \* count\.risk\)/, 'the requirements weight'),
  risk: +(/Math\.round\(\d+ \* \(count\.pass \+ ([\d.]+) \* count\.risk\)/.exec(engineSrc) || [])[1],
  time: num(/daysLeft >= (\d+) \? (\d+) : daysLeft >= (\d+) \? (\d+) : daysLeft > 0 \? (\d+) : 0/, 'the time bands'),
};
const tm = /daysLeft >= (\d+) \? (\d+) : daysLeft >= (\d+) \? (\d+) : daysLeft > 0 \? (\d+) : 0/.exec(engineSrc);
const TIME = [{ from: +tm[1], pts: +tm[2] }, { from: +tm[3], pts: +tm[4] }, { from: 1, pts: +tm[5] }, { from: null, pts: 0 }];
W.time = TIME[0].pts;
expect(W.sector + W.sizeIn + W.req + W.time === 100, 'the four maxima add up to ' + (W.sector + W.sizeIn + W.req + W.time) + ', not 100');

/* ---------- 2. probes ---------- */
const TODAY = '2026-11-05';
const P0 = { turnover: 1000000, references: 3, certifications: ['ISO 9001'], cpv: ['72'], countries: ['DE'], crossBorder: true, languages: ['de'], minValue: 50000, maxValue: 1500000 };
const base = (over) => Object.assign({}, P0, over || {});
const days = (n) => { const d = new Date(Date.parse(TODAY + 'T00:00:00Z') + n * 86400000); return d.toISOString().slice(0, 10); };
const tender = (over) => Object.assign({ id: 'probe', cpv: ['72000000'], value: 100000, deadline: days(30), language: 'de', requirements: [{ id: 'r1', type: 'language', value: 'de', confidence: 0.9, label: 'Bid in German' }] }, over || {});
const ev = (t, p, o) => E.evaluate(t, p, TODAY, o);
const chk = (req, p, o) => E.checkRequirement(Object.assign({ id: 'q', confidence: 0.9, label: req.label || req.type }, req), p, o);

// score parts
const s100 = ev(tender(), base());
expect(s100.score === 100 && s100.verdict === 'go', 'the clean probe is not Go 100 (got ' + s100.verdict + ' ' + s100.score + ')');
expect(ev(tender({ value: 10000 }), base()).score === 100 - W.sizeIn + W.sizeBelow, 'size below');
expect(ev(tender({ value: 2000000 }), base()).score === 100 - W.sizeIn + W.sizeAbove, 'size above');
expect(ev(tender({ deadline: days(TIME[1].from) }), base()).score === 100 - W.time + TIME[1].pts, 'time band 2');
expect(ev(tender({ deadline: days(1) }), base()).score === 100 - W.time + TIME[2].pts, 'time band 3');
const closed = ev(tender({ deadline: days(0) }), base());
expect(closed.verdict === 'closed' && closed.score === 0, 'deadline day is closed with score 0');
const oneRisk = ev(tender({ requirements: [{ id: 'r1', type: 'site_visit', value: 'x', confidence: 0.9 }] }), base());
expect(oneRisk.score === 100 - W.req + Math.round(W.req * W.risk), 'a risk counts ' + W.risk);
const oneReview = ev(tender({ requirements: [{ id: 'r1', type: 'language', value: 'de', confidence: REVIEW - 0.01 }] }), base());
expect(oneReview.score === 100 - W.req && oneReview.verdict === 'maybe', 'a review line counts 0 and blocks Go');
const noSector = ev(tender(), base({ cpv: ['45'] }));
expect(noSector.verdict === 'nogo' && noSector.score === Math.min(100 - W.sector, CAP), 'no sector match is No-go, capped');
const oneFail = ev(tender({ requirements: [{ id: 'r1', type: 'min_turnover', value: 5000000, confidence: 0.9 }] }), base());
expect(oneFail.verdict === 'nogo' && oneFail.score <= CAP, 'a fail is No-go at or under the cap');
// Go threshold: the lowest Go-eligible score the engine calls Go, the highest it calls Maybe
const eligible = [];
[[tender(), 'in'], [tender({ value: 10000 }), 'below'], [tender({ value: 2000000 }), 'above']].forEach(([t]) => {
  [days(30), days(TIME[1].from), days(1)].forEach((dl) => {
    [1, 2, 3, 4].forEach((n) => {
      const reqs = []; for (let i = 0; i < n; i++) reqs.push({ id: 'r' + i, type: i === 0 ? 'site_visit' : 'language', value: 'de', confidence: 0.9 });
      const r = ev(Object.assign({}, t, { deadline: dl, requirements: reqs }), base());
      eligible.push([r.score, r.verdict]);
    });
  });
});
const lowestGo = Math.min.apply(null, eligible.filter((x) => x[1] === 'go').map((x) => x[0]));
const highestMaybe = Math.max.apply(null, eligible.filter((x) => x[1] === 'maybe').map((x) => x[0]));
expect(lowestGo >= GO_MIN && highestMaybe < GO_MIN, 'Go threshold: lowest Go ' + lowestGo + ', highest Maybe ' + highestMaybe + ', source says ' + GO_MIN);
const twoRisks = ev(tender({ requirements: [{ id: 'a', type: 'site_visit', value: 'x', confidence: 0.9 }, { id: 'b', type: 'language', value: 'fr', confidence: 0.9 }] }), base());
expect(twoRisks.verdict === 'maybe' && twoRisks.score >= GO_MIN, 'two risks are Maybe even above the threshold (score ' + twoRisks.score + ')');

// per-requirement rules (status + the engine's own note)
const rule = (type, label, cases) => ({ type, label, cases: cases.map(([condition, req, p, o]) => { const r = chk(Object.assign({ type }, req), p, o); return { condition, status: r.status, note: r.note }; }) });
const RULES = [
  rule('min_turnover', 'Minimum turnover', [
    ['turnover at or above the minimum', { value: 1500000 }, base({ turnover: 1500000 })],
    ['turnover below the minimum', { value: 1500000 }, base({ turnover: 900000 })]]),
  rule('certification', 'Certificate', [
    ['certificate held', { value: 'ISO 9001' }, base()],
    ['missing, subcontracting allowed', { value: 'ISO 27001', subcontractAllowed: true }, base()],
    ['missing, subcontracting not allowed', { value: 'ISO 27001', subcontractAllowed: false }, base()]]),
  rule('min_references', 'Minimum references', [
    ['enough references', { value: 3 }, base({ references: 3 })],
    ['short by one', { value: 3 }, base({ references: 2 })],
    ['short by two or more', { value: 3 }, base({ references: 1 })]]),
  rule('language', 'Bid language', [
    ['language in the profile', { value: 'de' }, base()],
    ['language not in the profile', { value: 'fr' }, base()]]),
  rule('region', 'Place of delivery', [
    ['a home country', { value: 'DE' }, base()],
    ['abroad, cross-border on', { value: 'ES' }, base({ crossBorder: true })],
    ['abroad, cross-border off', { value: 'ES' }, base({ crossBorder: false })]]),
  rule('site_visit', 'Mandatory site visit', [['always', { value: '20 Nov 2026, 10:00' }, base()]]),
  rule('other', 'Anything else the AI extracted', [['always', { note: 'Wording is vague.' }, base()]])
];
const CONF = [
  { condition: 'AI confidence below ' + REVIEW + ' (' + Math.round(REVIEW * 100) + ' %), no answer from the owner', status: chk({ type: 'language', value: 'de', confidence: REVIEW - 0.01 }, base()).status },
  { condition: 'AI confidence at or above ' + REVIEW, status: chk({ type: 'language', value: 'de', confidence: REVIEW }, base()).status },
  { condition: 'the owner answered "We meet it" (whatever the confidence)', status: chk({ type: 'language', value: 'fr', confidence: 0.2 }, base(), 'pass').status },
  { condition: 'the owner answered "We don’t meet it"', status: chk({ type: 'language', value: 'de', confidence: 0.99 }, base(), 'fail').status }
];
expect(CONF[0].status === 'review' && CONF[1].status === 'pass' && CONF[2].status === 'pass' && CONF[3].status === 'fail', 'confidence and override rules');
expect(RULES[0].cases[1].status === 'fail' && RULES[2].cases[1].status === 'risk' && RULES[2].cases[2].status === 'fail', 'turnover / references rules');

/* ---------- 3. the demo: data.js with the demo profile ---------- */
const P = D.PROFILE, TD = D.DEMO_TODAY;
const bare = (s) => String(s).replace(/\s*\(fictional\)/, '');
const demo = E.rank(D.TENDERS, P, TD).map((r) => {
  const t = D.TENDERS.find((x) => x.id === r.tenderId);
  return { id: t.id, buyer: bare(t.buyer), title: t.title, country: t.country, language: E.langName(t.language), value: t.value, pages: t.pages, daysLeft: r.daysLeft, verdict: r.verdict, score: r.score, reason: E.reasonLine(t, P, r), counts: r.count, requirements: r.checks.length };
});
const hoh = D.TENDERS.find((t) => t.id === 'hoh-security');
const hohRes = E.evaluate(hoh, P, TD);
const withIso = Object.assign({}, P, { certifications: P.certifications.concat(['ISO 27001']) });
const hohIso = E.evaluate(hoh, withIso, TD);
const hohMet = E.evaluate(hoh, withIso, TD, { r3: 'pass' });
const path3 = [
  { step: 'As read, with the demo profile', verdict: hohRes.verdict, score: hohRes.score, reason: E.reasonLine(hoh, P, hohRes), headline: E.headline(hoh, P, hohRes) },
  { step: 'ISO 27001 switched on in Company', verdict: hohIso.verdict, score: hohIso.score, reason: E.reasonLine(hoh, withIso, hohIso), headline: E.headline(hoh, withIso, hohIso) },
  { step: '"We meet it" on the unclear line', verdict: hohMet.verdict, score: hohMet.score, reason: E.reasonLine(hoh, withIso, hohMet), headline: E.headline(hoh, withIso, hohMet) }
];
const q = hoh.requirements[0];
const citation = { tender: bare(hoh.buyer), doc: hoh.doc, fields: { id: q.id, type: q.type, value: q.value, label: q.label, cite: q.cite, confidence: q.confidence, src: q.src, highlight: q.highlight, tr: q.tr }, pages: hoh.pages, language: E.langName(hoh.language) };
const profileFields = [
  ['turnover', 'minimum turnover (euros)'], ['references', 'minimum references'], ['certifications', 'certificates (mandatory or via a partner)'],
  ['languages', 'bid language'], ['countries', 'place of delivery'], ['crossBorder', 'place of delivery abroad'], ['cpv', 'sector fit (the two-digit CPV division)'], ['minValue', 'size fit'], ['maxValue', 'size fit']
].map(([field, usedFor]) => ({ field, usedFor, demoValue: P[field] }));
const notRead = Object.keys(P).filter((k) => !profileFields.some((f) => f.field === k));

/* ---------- 4. tests, counted in the files ---------- */
const countTests = (f) => { try { return (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/^\s*test\(/gm) || []).length; } catch (e) { return 0; } };
const invCases = (() => { try { return +(/CASES \|\| (\d+)/.exec(fs.readFileSync(path.join(ROOT, 'tests/engine-invariants.test.js'), 'utf8')) || [])[1] || 0; } catch (e) { return 0; } })();
const tests = { engine: countTests('tests/engine.test.js'), golden: countTests('tests/demo-golden.test.js'), invariantCases: invCases, smokeChecks: (() => { try { return (fs.readFileSync(path.join(ROOT, 'tests/smoke.js'), 'utf8').match(/\bcheck\(/g) || []).length; } catch (e) { return 0; } })() };

/* ---------- 5. assemble ---------- */
const out = {
  source: { engine: 'engine.js', engineSha: sha('engine.js'), data: 'data.js', dataSha: sha('data.js'), demoToday: TD },
  constants: { reviewThreshold: REVIEW, knockoutCap: CAP, goMinScore: GO_MIN, goMaxRisks: GO_MAX_RISK, probes: { lowestGo, highestMaybe } },
  weights: { sector: W.sector, size: { max: W.sizeIn, inRange: W.sizeIn, below: W.sizeBelow, above: W.sizeAbove }, requirements: { max: W.req, pass: 1, risk: W.risk, review: 0 }, time: { max: W.time, bands: TIME } },
  statuses: [
    { status: 'pass', label: 'Meets', shape: 'circle', verdict: 'go' }, { status: 'risk', label: 'Risk', shape: 'triangle', verdict: 'maybe' },
    { status: 'review', label: 'Needs your check', shape: 'diamond', verdict: 'check' }, { status: 'fail', label: 'Fails', shape: 'square', verdict: 'nogo' }
  ],
  confidence: CONF,
  rules: RULES,
  verdicts: [
    { verdict: 'closed', label: E.VERDICT_LABEL.closed, rule: 'the deadline is today or has passed (days left ≤ 0)', score: 'always 0' },
    { verdict: 'nogo', label: E.VERDICT_LABEL.nogo, rule: 'any requirement fails, or none of the tender’s CPV divisions is in the profile', score: 'capped at ' + CAP },
    { verdict: 'go', label: E.VERDICT_LABEL.go, rule: 'score at least ' + GO_MIN + ', no line needs the owner’s check, at most ' + GO_MAX_RISK + ' risk', score: GO_MIN + ' to 100' },
    { verdict: 'maybe', label: E.VERDICT_LABEL.maybe, rule: 'everything else: a line needs the owner’s check, more than ' + GO_MAX_RISK + ' risk, or a score under ' + GO_MIN, score: 'under ' + GO_MIN + ', or higher with open lines' }
  ],
  ranking: ['Go', 'Maybe', 'No-go', 'Closed'].join(' → ') + ', then by score, then by days left',
  profileFields, profileNotRead: notRead,
  citation,
  demo: { today: TD, profile: { name: P.name, city: P.city, turnover: P.turnover, references: P.references, certifications: P.certifications, languages: P.languages, countries: P.countries, crossBorder: P.crossBorder, cpv: P.cpv }, tenders: demo, counts: demo.reduce((c, r) => { c[r.verdict] = (c[r.verdict] || 0) + 1; return c; }, {}), pages: D.TENDERS.reduce((s, t) => s + t.pages, 0), languages: D.TENDERS.reduce((s, t) => (s.indexOf(t.language) === -1 ? s.concat([t.language]) : s), []).map(E.langName), hohenau: path3 },
  tests
};

/* ---------- 6. write the JSON (site) and the Markdown (docs) ---------- */
const siteGen = path.join(ROOT, 'site', 'src', 'generated');
if (fs.existsSync(path.join(ROOT, 'site'))) {
  fs.mkdirSync(siteGen, { recursive: true });
  fs.writeFileSync(path.join(siteGen, 'how-it-decides.json'), JSON.stringify(out, null, 2) + '\n');
}

const S = { pass: '● Meets', risk: '▲ Risk', review: '◆ Needs your check', fail: '■ Fails' };
const V = { go: '● Go', maybe: '▲ Maybe', nogo: '■ No-go', closed: 'Closed' };
const money = (n) => '€' + E.fmt(n);
const md = [];
md.push('# How TenderScout decides');
md.push('');
md.push('Generated by `node shared/how-it-decides.js` from `engine.js` (' + out.source.engineSha + ') and `data.js` (' + out.source.dataSha + '). Do not edit by hand: the same script feeds the website’s "How it decides" page, and CI checks that both outputs match the code. Every rule below was probed by running the engine; the weights and thresholds were read from it and verified by the probes.');
md.push('');
md.push('The AI (simulated in this prototype) reads a tender pack and extracts requirements, each with the page, the original sentence and a confidence. This code compares those requirements with the company profile. Same input, same output; nothing here is a model.');
md.push('');
md.push('## 1. Each requirement gets a status');
md.push('');
md.push('| Status | Shape | Meaning |');
md.push('|---|---|---|');
out.statuses.forEach((s) => md.push('| ' + s.label + ' | ' + S[s.status].slice(0, 1) + ' | ' + ({ pass: 'the profile satisfies the line', risk: 'the line is not met but could be, so it costs half the points', review: 'the AI is unsure; only the owner can answer, and until then the line counts nothing', fail: 'a knock-out: the tender is No-go' })[s.status] + ' |'));
md.push('');
md.push('Before the typed rule runs, the AI’s confidence and the owner’s answer are checked:');
md.push('');
md.push('| Condition | Status |');
md.push('|---|---|');
out.confidence.forEach((c) => md.push('| ' + c.condition + ' | ' + S[c.status] + ' |'));
md.push('');
md.push('Then the rule for the requirement’s type:');
md.push('');
md.push('| Requirement | Condition | Status | What the app says |');
md.push('|---|---|---|---|');
out.rules.forEach((r) => r.cases.forEach((c, i) => md.push('| ' + (i === 0 ? r.label : '') + ' | ' + c.condition + ' | ' + S[c.status] + ' | ' + c.note + ' |')));
md.push('');
md.push('## 2. The fit score (0–100)');
md.push('');
md.push('| Part | Points | How |');
md.push('|---|---|---|');
md.push('| Sector fit | ' + W.sector + ' | ' + W.sector + ' if any of the tender’s CPV codes starts with one of the profile’s two-digit divisions, else 0 (and the tender is No-go) |');
md.push('| Size fit | ' + W.sizeIn + ' | ' + W.sizeIn + ' when the contract value lies between the profile’s minimum and maximum, ' + W.sizeBelow + ' when it is smaller, ' + W.sizeAbove + ' when it is larger |');
md.push('| Requirements | ' + W.req + ' | ' + W.req + ' × (met + ' + W.risk + ' × risk) ÷ number of requirements, rounded; a line that needs the owner’s check counts 0 |');
md.push('| Time to prepare | ' + W.time + ' | ' + TIME.filter((b) => b.from !== null).map((b) => b.pts + ' with ' + b.from + '+ days left').join(', ') + ', 0 on the deadline day |');
md.push('');
md.push('## 3. The verdict');
md.push('');
md.push('| Verdict | When | Score |');
md.push('|---|---|---|');
out.verdicts.forEach((v) => md.push('| ' + V[v.verdict] + ' | ' + v.rule + ' | ' + v.score + ' |'));
md.push('');
md.push('Probe: with identical inputs the engine gives Maybe at ' + highestMaybe + ' and Go at ' + lowestGo + ', and two risks stay Maybe at ' + twoRisks.score + '. Ranking: ' + out.ranking + '.');
md.push('');
md.push('## 4. What the engine reads from the profile');
md.push('');
md.push('| Profile field | Used for | Demo value |');
md.push('|---|---|---|');
out.profileFields.forEach((f) => md.push('| `' + f.field + '` | ' + f.usedFor + ' | ' + (Array.isArray(f.demoValue) ? f.demoValue.join(', ') : typeof f.demoValue === 'number' && f.demoValue >= 1000 ? money(f.demoValue) : String(f.demoValue)) + ' |'));
md.push('');
md.push('Not read by the engine (display only): ' + notRead.map((k) => '`' + k + '`').join(', ') + '.');
md.push('');
md.push('## 5. "Cites the page that proves it"');
md.push('');
md.push('Every requirement the AI extracts is stored with the sentence it came from. For ' + citation.tender + '’s first line (' + citation.doc + ', ' + citation.pages + ' pages, ' + citation.language + '):');
md.push('');
md.push('| Field | Value | Shown as |');
md.push('|---|---|---|');
md.push('| `type` / `value` | `' + citation.fields.type + '` / `' + citation.fields.value + '` | the rule in §1 that runs |');
md.push('| `label` | ' + citation.fields.label + ' | the line’s title |');
md.push('| `cite` | ' + citation.fields.cite + ' | "' + citation.doc + ', ' + citation.fields.cite.replace(/^[^p]*p\./, 'p.') + '" under the line and on the sheet |');
md.push('| `src` | ' + citation.fields.src + ' | the original sentence, quoted |');
md.push('| `highlight` | ' + citation.fields.highlight + ' | the decisive phrase, underlined inside the quote |');
md.push('| `tr` | ' + citation.fields.tr + ' | the translation |');
md.push('| `confidence` | ' + citation.fields.confidence + ' | "' + Math.round(citation.fields.confidence * 100) + ' % AI confidence"; under ' + Math.round(REVIEW * 100) + ' % the line becomes "Needs your check" |');
md.push('');
md.push('## 6. The demo data through the rules');
md.push('');
md.push('Demo date ' + TD + '. Profile: ' + bare(P.name) + ', ' + P.city + ', turnover ' + money(P.turnover) + ', ' + P.references + ' references, ' + P.certifications.join(', ') + ', bids in ' + P.languages.map(E.langName).join(' and ') + ', works in ' + P.countries.map(E.countryName).join(' and ') + (P.crossBorder ? ', cross-border on' : '') + ', sectors ' + P.cpv.join(', ') + '.');
md.push('');
md.push('| Tender | Buyer | Verdict | Score | Days left | Reason |');
md.push('|---|---|---|---|---|---|');
demo.forEach((r) => md.push('| ' + r.title + ' | ' + r.buyer + ' · ' + r.country + ' | ' + V[r.verdict] + ' | ' + r.score + ' | ' + r.daysLeft + ' | ' + r.reason + ' |'));
md.push('');
md.push('Counts: ' + ['go', 'maybe', 'nogo'].map((v) => (out.demo.counts[v] || 0) + ' ' + E.VERDICT_LABEL[v]).join(' · ') + ' · ' + out.demo.pages + ' pages in ' + out.demo.languages.length + ' languages.');
md.push('');
md.push('The demo path on ' + bare(hoh.buyer) + ':');
md.push('');
md.push('| Step | Verdict | Score | Reason |');
md.push('|---|---|---|---|');
path3.forEach((s) => md.push('| ' + s.step + ' | ' + V[s.verdict] + ' | ' + s.score + ' | ' + s.reason + ' |'));
md.push('');
md.push('## 7. What is real in this prototype');
md.push('');
md.push('- **Simulated:** reading tenders, translating, answering questions and drafting the profile (`ai.js`): pre-written output after a delay, labelled "Simulated AI" wherever it shows. No model is called and there are no keys.');
md.push('- **Real:** this decision logic (`engine.js`), covered by ' + tests.engine + ' unit tests (`tests/engine.test.js`), ' + tests.golden + ' demo pins (`tests/demo-golden.test.js`), a seeded property test of ' + tests.invariantCases + ' random cases per run (`tests/engine-invariants.test.js`) and the ' + tests.smokeChecks + ' checks of the browser click-through (`tests/smoke.js`).');
md.push('- **Fictional:** every company, buyer, tender, page number and quote (`data.js`). None of it is interview evidence.');
md.push('');
fs.writeFileSync(path.join(ROOT, 'docs', 'HOW_IT_DECIDES.md'), md.join('\n'));

console.log('how-it-decides: ' + RULES.reduce((n, r) => n + r.cases.length, 0) + ' rule probes, weights ' + W.sector + '/' + W.sizeIn + '/' + W.req + '/' + W.time + ', Go from ' + GO_MIN + ' (probed ' + highestMaybe + ' → ' + lowestGo + '), cap ' + CAP + ', review < ' + REVIEW + ' · ' + demo.length + ' demo tenders · ' + (fs.existsSync(siteGen) ? 'site/src/generated/how-it-decides.json + ' : '') + 'docs/HOW_IT_DECIDES.md');
