#!/usr/bin/env node
/*
 * tests/data-check.js — validates data.js against what engine.js and app.js actually read (5 Nov 2026).
 *
 *   node tests/data-check.js            exit 1 on the first group of findings; every message names the record and the field
 *
 * The schema below is derived from the code, not from a guess:
 *   engine.js  evaluate() reads tender.requirements[].{id,type,value,confidence,subcontractAllowed,note,label,cite},
 *              tender.cpv, tender.value, tender.deadline, tender.language, tender.id; profile.{turnover,certifications,
 *              references,languages,countries,crossBorder,cpv,minValue,maxValue}; checkRequirement() switches on six
 *              requirement types and falls back to `other`; langName()/countryName() know the codes they can name.
 *   app.js     renders tender.{title,original,buyer,country,pages,doc,photo,ai.summary,ai.qa[].{q,a}},
 *              requirement.{src,tr,highlight}, the citation "p. N" (citeParts), profile.{name,city,staff,sectorsLabel},
 *              DEMO.{DEMO_TODAY,CERT_OPTIONS,SECTORS}; the honesty labels come from ai() and fiction().
 * Also checked: ids unique, dates ISO and parseable, every cited page inside the document, thresholds in range,
 * no TODO / lorem / placeholder strings, and the "Simulated AI" and "fictional" statements still where the smoke test's
 * declutter scan expects them (static look at app.js, which this file never edits).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const E = require('../engine.js');
const D = require('../data.js');
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

const problems = [];
const fail = (where, field, msg) => problems.push(where + (field ? ' → ' + field : '') + ': ' + msg);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isInt = (v) => Number.isInteger(v);
const isNum = (v) => typeof v === 'number' && isFinite(v);
const isISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
const PLACEHOLDER = /\b(TODO|FIXME|TBD|XXX|lorem|ipsum|placeholder|dummy text|insert here)\b/i;

function req(where, obj, field, pred, expect) {
  const v = obj[field];
  if (!pred(v)) fail(where, field, 'expected ' + expect + ', got ' + JSON.stringify(v));
  return v;
}
function strings(where, obj, skip) {
  // every string value inside a record, for the placeholder scan
  (function walk(o, p) {
    if (typeof o === 'string') { if (PLACEHOLDER.test(o) && !(skip && skip.test(p))) fail(where, p, 'placeholder text ' + JSON.stringify(o.slice(0, 60))); return; }
    if (Array.isArray(o)) { o.forEach((x, i) => walk(x, p + '[' + i + ']')); return; }
    if (o && typeof o === 'object') Object.keys(o).forEach((k) => walk(o[k], p ? p + '.' + k : k));
  })(obj, '');
}

/* ---------- DEMO module shape ---------- */
req('DEMO', D, 'DEMO_TODAY', isISO, 'an ISO date (YYYY-MM-DD)');
req('DEMO', D, 'PROFILE', (v) => v && typeof v === 'object', 'the company profile object');
req('DEMO', D, 'TENDERS', (v) => Array.isArray(v) && v.length > 0, 'a non-empty array of tenders');
req('DEMO', D, 'CERT_OPTIONS', (v) => Array.isArray(v) && v.length > 0 && v.every(isStr), 'a non-empty array of certificate names');
req('DEMO', D, 'SECTORS', (v) => Array.isArray(v) && v.length === 45, 'the 45 CPV divisions (Welcome says "All 45 EU sectors")');
const SECTOR_CODES = (D.SECTORS || []).map((s) => s[0]);
(D.SECTORS || []).forEach((s, i) => {
  if (!Array.isArray(s) || s.length !== 2 || !/^\d{2}$/.test(s[0]) || !isStr(s[1])) fail('SECTORS[' + i + ']', '', 'expected [two-digit code, name], got ' + JSON.stringify(s));
});
if (new Set(SECTOR_CODES).size !== SECTOR_CODES.length) fail('SECTORS', 'code', 'duplicate CPV division codes');

/* ---------- PROFILE (engine.js evaluate/checkRequirement + app.js checkProfile/company) ---------- */
const P = D.PROFILE || {};
const PW = 'PROFILE';
req(PW, P, 'name', isStr, 'the firm name');
if (isStr(P.name) && !/\(fictional\)/.test(P.name)) fail(PW, 'name', 'must carry "(fictional)" (CLAUDE.md §7.3; the profile card shows it)');
req(PW, P, 'city', isStr, 'city, country');
req(PW, P, 'staff', (v) => isInt(v) && v > 0, 'a positive integer (shown on the profile card)');
req(PW, P, 'turnover', (v) => isNum(v) && v >= 0, 'a number ≥ 0 in euros (min_turnover compares against it)');
req(PW, P, 'references', (v) => isInt(v) && v >= 0, 'an integer ≥ 0 (min_references compares against it)');
req(PW, P, 'certifications', (v) => Array.isArray(v) && v.every(isStr), 'an array of certificate names');
(P.certifications || []).forEach((c, i) => { if (D.CERT_OPTIONS.indexOf(c) === -1) fail(PW, 'certifications[' + i + ']', JSON.stringify(c) + ' is not in CERT_OPTIONS, so the Company screen could never switch it off'); });
req(PW, P, 'cpv', (v) => Array.isArray(v) && v.length > 0 && v.every((c) => /^\d{2}$/.test(c)), 'a non-empty array of two-digit CPV divisions');
(P.cpv || []).forEach((c, i) => { if (SECTOR_CODES.indexOf(c) === -1) fail(PW, 'cpv[' + i + ']', c + ' is not one of the 45 divisions in SECTORS'); });
req(PW, P, 'sectorsLabel', (v) => Array.isArray(v) && v.length > 0 && v.every(isStr), 'a non-empty array of sector labels');
req(PW, P, 'countries', (v) => Array.isArray(v) && v.length > 0 && v.every((c) => /^[A-Z]{2}$/.test(c)), 'a non-empty array of two-letter country codes');
(P.countries || []).forEach((c, i) => { if (E.countryName(c) === c) fail(PW, 'countries[' + i + ']', 'engine.js cannot name ' + c + ' (add it to COUNTRIES or use a known code)'); });
req(PW, P, 'crossBorder', (v) => typeof v === 'boolean', 'true or false');
req(PW, P, 'languages', (v) => Array.isArray(v) && v.length > 0 && v.every((l) => /^[a-z]{2}$/.test(l)), 'a non-empty array of two-letter language codes');
(P.languages || []).forEach((l, i) => { if (E.langName(l) === l) fail(PW, 'languages[' + i + ']', 'engine.js cannot name ' + l + ' (add it to LANGS or use a known code)'); });
req(PW, P, 'minValue', (v) => isNum(v) && v >= 0, 'a number ≥ 0');
req(PW, P, 'maxValue', (v) => isNum(v) && v >= 0, 'a number ≥ 0');
if (isNum(P.minValue) && isNum(P.maxValue) && P.minValue >= P.maxValue) fail(PW, 'minValue/maxValue', 'minValue must be below maxValue (size fit)');
strings(PW, P);

/* ---------- TENDERS ---------- */
const REQ_TYPES = ['min_turnover', 'certification', 'min_references', 'language', 'region', 'site_visit', 'other'];
const ids = new Set();
(D.TENDERS || []).forEach((t, ti) => {
  const W = 'TENDERS[' + (t && t.id ? t.id : '#' + ti) + ']';
  req(W, t, 'id', (v) => isStr(v) && /^[a-z0-9-]+$/.test(v), 'a kebab-case id (it is a URL segment, #/t/<id>)');
  if (ids.has(t.id)) fail(W, 'id', 'duplicate tender id'); ids.add(t.id);
  req(W, t, 'title', isStr, 'the English title');
  req(W, t, 'original', isStr, 'the title in the source language');
  req(W, t, 'buyer', isStr, 'the buyer name');
  if (isStr(t.buyer) && !/\(fictional\)$/.test(t.buyer)) fail(W, 'buyer', 'must end in "(fictional)" (CLAUDE.md §7.3; app.js strips it for the cards)');
  req(W, t, 'country', (v) => /^[A-Z]{2}$/.test(v || ''), 'a two-letter country code');
  if (t.country && E.countryName(t.country) === t.country) fail(W, 'country', 'engine.js cannot name ' + t.country);
  req(W, t, 'language', (v) => /^[a-z]{2}$/.test(v || ''), 'a two-letter language code');
  if (t.language && E.langName(t.language) === t.language) fail(W, 'language', 'engine.js cannot name ' + t.language + ' (the loading state says "Reading N pages (<language>)…")');
  req(W, t, 'value', (v) => isNum(v) && v > 0, 'a positive contract value in euros');
  req(W, t, 'deadline', isISO, 'an ISO date (YYYY-MM-DD)');
  if (isISO(t.deadline) && isISO(D.DEMO_TODAY) && E.daysBetween(D.DEMO_TODAY, t.deadline) <= 0) fail(W, 'deadline', t.deadline + ' is on or before DEMO_TODAY ' + D.DEMO_TODAY + ', so the tender is Closed in the demo (the Closed state is shown with ?today=, not with data)');
  req(W, t, 'cpv', (v) => Array.isArray(v) && v.length > 0 && v.every((c) => /^\d{8}$/.test(c)), 'a non-empty array of eight-digit CPV codes');
  (t.cpv || []).forEach((c, i) => { if (SECTOR_CODES.indexOf(String(c).slice(0, 2)) === -1) fail(W, 'cpv[' + i + ']', c + ' starts with a division that is not in SECTORS'); });
  req(W, t, 'pages', (v) => isInt(v) && v > 0, 'a positive page count');
  req(W, t, 'doc', isStr, 'the source document name (shown in every citation)');
  if (t.photo != null) {
    if (!isStr(t.photo)) fail(W, 'photo', 'if present, a file name without extension');
    else if (!fs.existsSync(path.join(ROOT, 'assets', 'img', t.photo + '.png'))) fail(W, 'photo', 'assets/img/' + t.photo + '.png does not exist');
  }
  req(W, t, 'requirements', (v) => Array.isArray(v) && v.length > 0, 'a non-empty array of requirements');
  req(W, t, 'ai', (v) => v && typeof v === 'object', 'the simulated AI block { summary, qa }');
  if (t.ai) {
    req(W + '.ai', t.ai, 'summary', isStr, 'the English summary');
    req(W + '.ai', t.ai, 'qa', Array.isArray, 'an array of { q, a } (may be empty)');
    (t.ai.qa || []).forEach((x, i) => {
      const QW = W + '.ai.qa[' + i + ']';
      req(QW, x, 'q', isStr, 'the question');
      req(QW, x, 'a', isStr, 'the answer');
      const m = /\(.*?p\.\s*(\d+)[^)]*\)\.?\s*$/.exec(x.a || '');
      if (m && +m[1] > t.pages) fail(QW, 'a', 'cites p. ' + m[1] + ' but the document has ' + t.pages + ' pages');
    });
  }
  const rids = new Set();
  (t.requirements || []).forEach((q, qi) => {
    const RW = W + '.requirements[' + (q && q.id ? q.id : '#' + qi) + ']';
    req(RW, q, 'id', (v) => isStr(v) && /^[a-z0-9]+$/.test(v), 'a short id (it is a URL segment, #/t/<id>/req/<rid>, and the overrides key)');
    if (rids.has(q.id)) fail(RW, 'id', 'duplicate requirement id inside ' + t.id); rids.add(q.id);
    req(RW, q, 'type', (v) => REQ_TYPES.indexOf(v) !== -1, 'one of ' + REQ_TYPES.join(' | ') + ' (engine.js checkRequirement)');
    req(RW, q, 'label', isStr, 'the English one-line label');
    req(RW, q, 'cite', (v) => isStr(v) && /p\.\s*\d+/.test(v), 'a citation containing "p. N" (app.js citeParts reads the page from it)');
    const pm = /p\.\s*(\d+)/.exec(q.cite || '');
    if (pm && isInt(t.pages) && +pm[1] > t.pages) fail(RW, 'cite', 'cites p. ' + pm[1] + ' but the document has ' + t.pages + ' pages');
    req(RW, q, 'confidence', (v) => isNum(v) && v >= 0 && v <= 1, 'a number between 0 and 1 (shown as 0–100 %; under ' + E.REVIEW_THRESHOLD + ' becomes "Needs your check")');
    req(RW, q, 'src', isStr, 'the original sentence');
    req(RW, q, 'tr', isStr, 'its English translation');
    req(RW, q, 'highlight', isStr, 'the decisive phrase');
    if (isStr(q.highlight) && isStr(q.src) && q.src.indexOf(q.highlight) === -1) fail(RW, 'highlight', 'is not a substring of src (the sheet underlines it inside the quote)');
    switch (q.type) {
      case 'min_turnover': req(RW, q, 'value', (v) => isNum(v) && v > 0, 'a turnover threshold in euros'); break;
      case 'min_references': req(RW, q, 'value', (v) => isInt(v) && v > 0, 'a reference count'); break;
      case 'certification':
        req(RW, q, 'value', isStr, 'a certificate name');
        if (isStr(q.value) && D.CERT_OPTIONS.indexOf(q.value) === -1) fail(RW, 'value', JSON.stringify(q.value) + ' is not in CERT_OPTIONS, so no switch on Company could ever satisfy it');
        if (q.subcontractAllowed != null && typeof q.subcontractAllowed !== 'boolean') fail(RW, 'subcontractAllowed', 'if present, true or false');
        break;
      case 'language':
        req(RW, q, 'value', (v) => /^[a-z]{2}$/.test(v || ''), 'a two-letter language code');
        if (q.value && E.langName(q.value) === q.value) fail(RW, 'value', 'engine.js cannot name ' + q.value);
        break;
      case 'region':
        req(RW, q, 'value', (v) => /^[A-Z]{2}$/.test(v || ''), 'a two-letter country code');
        if (q.value && E.countryName(q.value) === q.value) fail(RW, 'value', 'engine.js cannot name ' + q.value);
        break;
      case 'site_visit': req(RW, q, 'value', isStr, 'the date and time of the visit, as text'); break;
      case 'other': req(RW, q, 'note', isStr, 'a note (shown in the sheet when the AI is unsure)'); break;
    }
    if (q.subcontractAllowed != null && q.type !== 'certification') fail(RW, 'subcontractAllowed', 'only certification requirements read it');
  });
  strings(W, t);
});
if (D.TENDERS && !D.TENDERS.some((t) => t.id === 'hoh-security')) fail('TENDERS', 'hoh-security', 'the demo tender (BRIEF.md step 4–5) is gone; tests/demo-golden.test.js pins its numbers');

/* ---------- PAST_BIDS (insights.js summary() + app.js insightsScreen(), 5 Nov 2026) ---------- */
const I = require('../insights.js');
req('DEMO', D, 'PAST_BIDS', (v) => Array.isArray(v) && v.length > 0, 'a non-empty array of past bids (the Win/loss screen)');
const bidIds = new Set();
(D.PAST_BIDS || []).forEach((b, i) => {
  const W = 'PAST_BIDS[' + (b && b.id ? b.id : i) + ']';
  if (!b || typeof b !== 'object') { fail(W, '', 'expected an object'); return; }
  if (req(W, b, 'id', isStr, 'a non-empty string') && bidIds.has(b.id)) fail(W, 'id', 'duplicate id'); bidIds.add(b.id);
  req(W, b, 'title', isStr, 'a non-empty string');
  req(W, b, 'buyer', (v) => isStr(v) && /\(fictional\)$/.test(v), 'a buyer name ending in "(fictional)"');
  req(W, b, 'country', (v) => typeof v === 'string' && /^[A-Z]{2}$/.test(v), 'a two-letter country code');
  req(W, b, 'cpv', (v) => SECTOR_CODES.indexOf(v) !== -1, 'one of the 45 CPV division codes in SECTORS (the area name comes from there)');
  req(W, b, 'submitted', (v) => isISO(v) && v <= D.DEMO_TODAY, 'an ISO date on or before DEMO_TODAY');
  req(W, b, 'ourPrice', (v) => isInt(v) && v > 0, 'a positive whole number of euros');
  req(W, b, 'outcome', (v) => v === 'won' || v === 'lost', '"won" or "lost"');
  if (b.outcome === 'lost') {
    req(W, b, 'reason', (v) => I.REASONS.indexOf(v) !== -1, 'one of ' + I.REASONS.join(' | '));
    req(W, b, 'winnerPrice', (v) => v === null || (isInt(v) && v > 0), 'null or a positive whole number of euros');
  }
  strings(W, b);
});

/* ---------- engine thresholds (constants the data relies on) ---------- */
if (!(isNum(E.REVIEW_THRESHOLD) && E.REVIEW_THRESHOLD > 0 && E.REVIEW_THRESHOLD < 1)) fail('engine.js', 'REVIEW_THRESHOLD', 'must be between 0 and 1, got ' + E.REVIEW_THRESHOLD);
if (!(isInt(E.KNOCKOUT_CAP) && E.KNOCKOUT_CAP >= 0 && E.KNOCKOUT_CAP <= 100)) fail('engine.js', 'KNOCKOUT_CAP', 'must be within 0–100, got ' + E.KNOCKOUT_CAP);
// every tender's score must be within 0–100 with the demo profile (the four parts add up to at most 100)
(D.TENDERS || []).forEach((t) => {
  if (!t.requirements || !t.cpv || !t.deadline) return;
  try {
    const r = E.evaluate(t, P, D.DEMO_TODAY);
    if (!(r.score >= 0 && r.score <= 100)) fail('TENDERS[' + t.id + ']', 'score', 'evaluate() gives ' + r.score + ', outside 0–100');
  } catch (e) { fail('TENDERS[' + t.id + ']', 'evaluate()', 'throws: ' + e.message); }
});

/* ---------- honesty labels, where the smoke test's declutter scan expects them (static look at app.js) ---------- */
const need = [
  ['function ai()', '>Simulated AI<', 'the ai() helper must still render the literal "Simulated AI"'],
  ['function fiction()', 'All companies and tenders are fictional', 'the fiction() helper must still render the Feed / Detail / Bids line'],
  ['welcome()', 'all companies and tenders are fictional', 'the Welcome caption'],
  ['settings()', 'AI output is simulated', 'the About row on Settings'],
  ['settings()', 'All data is fictional', 'the About row on Settings']
];
need.forEach(([where, text, why]) => { if (appSrc.indexOf(text) === -1) fail('app.js', where, 'missing literal ' + JSON.stringify(text) + ' (' + why + ')'); });
[['feed', 'function feed()'], ['detail', 'function detail('], ['bids', 'function bids()'], ['loadingDetail', 'function loadingDetail('], ['reqSheet', 'function reqSheet('], ['readingScreen', 'function readingScreen()'], ['checkProfile', 'function checkProfile()']].forEach(([name, sig]) => {
  const i = appSrc.indexOf(sig); if (i === -1) { fail('app.js', name, 'render function not found'); return; }
  const body = appSrc.slice(i, appSrc.indexOf('\n  // ----------', i + 1) > 0 ? appSrc.indexOf('\n  // ----------', i + 1) : i + 6000);
  const wantsAI = ['detail', 'loadingDetail', 'reqSheet', 'readingScreen', 'checkProfile'].indexOf(name) !== -1;
  const wantsFiction = ['feed', 'detail', 'bids', 'loadingDetail'].indexOf(name) !== -1;
  if (wantsAI && body.indexOf('ai()') === -1) fail('app.js', name + '()', 'no longer renders the "Simulated AI" label (ai())');
  if (wantsFiction && body.indexOf('fiction()') === -1) fail('app.js', name + '()', 'no longer renders the fictional-data line (fiction())');
});
if (!/All .* EU sectors/.test(appSrc) || appSrc.indexOf('D.SECTORS.length') === -1) fail('app.js', 'welcome()', 'the sector line must stay derived from D.SECTORS.length');

/* ---------- report ---------- */
const nT = (D.TENDERS || []).length, nR = (D.TENDERS || []).reduce((s, t) => s + ((t.requirements || []).length), 0);
if (problems.length) {
  console.error('data-check: ' + problems.length + ' problem(s) in data.js (' + nT + ' tenders, ' + nR + ' requirements):');
  problems.forEach((p) => console.error('  FAIL ' + p));
  process.exitCode = 1;
} else {
  console.log('data-check: ok · ' + nT + ' tenders, ' + nR + ' requirements, profile, ' + D.CERT_OPTIONS.length + ' certificate options, ' + D.SECTORS.length + ' sectors · ids unique, dates ISO, citations inside their documents, thresholds in range, no placeholder text, honesty labels in place');
}
