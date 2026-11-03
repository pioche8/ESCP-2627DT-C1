/*
 * TenderScout — fit engine (deterministic, no AI).
 *
 * The AI's job (simulated in this prototype, see ai.js) is to READ a tender pack
 * in any EU language and extract structured requirements with page citations
 * and a confidence score. This file is plain code: it compares those
 * requirements with the company profile and produces a verdict.
 * Same input -> same output, so it is unit-tested (tests/engine.test.js).
 */
(function (root) {
  'use strict';

  var REVIEW_THRESHOLD = 0.7;   // AI confidence below this -> a human must confirm
  var KNOCKOUT_CAP = 25;        // max score when any hard requirement fails

  function daysBetween(fromISO, toISO) {
    var a = Date.parse(fromISO.slice(0, 10) + 'T00:00:00Z');
    var b = Date.parse(toISO.slice(0, 10) + 'T00:00:00Z');
    return Math.round((b - a) / 86400000);
  }

  function has(list, x) { return (list || []).indexOf(x) !== -1; }

  // Evaluate one requirement against the profile.
  // Returns { id, status: 'pass'|'risk'|'fail'|'review', note }
  function checkRequirement(req, profile, override) {
    var r = { id: req.id, label: req.label, cite: req.cite, confidence: req.confidence, type: req.type };

    if (override === 'pass' || override === 'fail') {
      r.status = override; r.note = 'Confirmed by you'; r.confirmed = true; return r;
    }
    if (typeof req.confidence === 'number' && req.confidence < REVIEW_THRESHOLD) {
      r.status = 'review'; r.note = 'AI is unsure how to read this. Check the source.'; return r;
    }

    switch (req.type) {
      case 'min_turnover':
        if (profile.turnover >= req.value) { r.status = 'pass'; r.note = 'Your turnover €' + fmt(profile.turnover) + ' ≥ €' + fmt(req.value); }
        else { r.status = 'fail'; r.note = 'Needs €' + fmt(req.value) + ' turnover, you have €' + fmt(profile.turnover); }
        break;
      case 'certification':
        if (has(profile.certifications, req.value)) { r.status = 'pass'; r.note = 'You hold ' + req.value; }
        else if (req.subcontractAllowed) { r.status = 'risk'; r.note = 'Missing ' + req.value + '. Subcontracting is allowed, so a partner could cover it'; }
        else { r.status = 'fail'; r.note = 'Missing ' + req.value + ' (mandatory)'; }
        break;
      case 'min_references':
        var gap = req.value - profile.references;
        if (gap <= 0) { r.status = 'pass'; r.note = profile.references + ' comparable references ≥ ' + req.value; }
        else if (gap === 1) { r.status = 'risk'; r.note = 'Short by 1 reference. A consortium partner could close the gap'; }
        else { r.status = 'fail'; r.note = 'Needs ' + req.value + ' references, you have ' + profile.references; }
        break;
      case 'language':
        if (has(profile.languages, req.value)) { r.status = 'pass'; r.note = 'Bid language ' + langName(req.value) + ' is covered'; }
        else { r.status = 'risk'; r.note = 'Bid must be written in ' + langName(req.value) + '. Translation adds effort'; }
        break;
      case 'region':
        if (has(profile.countries, req.value)) { r.status = 'pass'; r.note = 'You already work in ' + req.value; }
        else if (profile.crossBorder) { r.status = 'risk'; r.note = 'Work is delivered in ' + req.value + ', which is new for you'; }
        else { r.status = 'fail'; r.note = 'Delivery in ' + req.value + ', and you do not take cross-border work'; }
        break;
      case 'site_visit':
        r.status = 'risk'; r.note = 'Mandatory site visit: ' + req.value;
        break;
      default:
        r.status = 'risk'; r.note = req.note || 'Check this requirement';
    }
    return r;
  }

  function evaluate(tender, profile, today, overrides) {
    overrides = overrides || {};
    var checks = tender.requirements.map(function (q) { return checkRequirement(q, profile, overrides[q.id]); });
    var count = { pass: 0, risk: 0, fail: 0, review: 0 };
    checks.forEach(function (c) { count[c.status]++; });

    // 1) Sector fit (40): overlap between tender CPV divisions and profile sectors
    var cpvHit = tender.cpv.some(function (c) { return has(profile.cpv, c.slice(0, 2)); });
    var sector = cpvHit ? 40 : 0;

    // 2) Contract size fit (20)
    var size = (tender.value >= profile.minValue && tender.value <= profile.maxValue) ? 20 :
               (tender.value < profile.minValue ? 8 : 5);

    // 3) Requirements (30): pass = full, risk = half, review = 0 (not yet known)
    var n = checks.length || 1;
    var reqScore = Math.round(30 * (count.pass + 0.5 * count.risk) / n);

    // 4) Time to prepare (10)
    var daysLeft = daysBetween(today, tender.deadline);
    var time = daysLeft >= 21 ? 10 : daysLeft >= 10 ? 5 : daysLeft > 0 ? 2 : 0;

    var score = sector + size + reqScore + time;
    var verdict, reason;

    if (daysLeft <= 0) { verdict = 'closed'; reason = 'Deadline has passed'; score = 0; }
    else if (count.fail > 0) {
      verdict = 'nogo'; score = Math.min(score, KNOCKOUT_CAP);
      reason = count.fail + ' knock-out requirement' + (count.fail > 1 ? 's' : '');
    } else if (!cpvHit) { verdict = 'nogo'; reason = 'Outside your sectors'; score = Math.min(score, KNOCKOUT_CAP); }
    else if (score >= 70 && count.review === 0 && count.risk <= 1) { verdict = 'go'; reason = 'You meet every hard requirement'; }
    else if (count.review > 0) { verdict = 'maybe'; reason = count.review + ' requirement' + (count.review > 1 ? 's' : '') + ' to check'; }
    else { verdict = 'maybe'; reason = count.risk + ' risk' + (count.risk > 1 ? 's' : '') + ' to weigh'; }

    // Rough bid effort (hours) — illustrative heuristic, NOT validated
    var effort = 12 + 3 * checks.length +
      (has(profile.languages, tender.language) ? 0 : 10) +
      (tender.value > 1000000 ? 16 : 0);

    return { tenderId: tender.id, score: score, verdict: verdict, reason: reason,
             checks: checks, count: count, daysLeft: daysLeft, effortHours: effort };
  }

  function rank(tenders, profile, today, overridesById) {
    var order = { go: 0, maybe: 1, nogo: 2, closed: 3 };
    return tenders.map(function (t) { return evaluate(t, profile, today, (overridesById || {})[t.id]); })
      .sort(function (a, b) { return (order[a.verdict] - order[b.verdict]) || (b.score - a.score) || (a.daysLeft - b.daysLeft); });
  }

  function fmt(n) {
    if (n >= 1000000) return (Math.round(n / 100000) / 10) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
  }
  var LANGS = { en: 'English', de: 'German', fr: 'French', nl: 'Dutch', es: 'Spanish', it: 'Italian', pl: 'Polish' };
  function langName(c) { return LANGS[c] || c; }

  var Engine = { evaluate: evaluate, rank: rank, checkRequirement: checkRequirement, daysBetween: daysBetween,
                 fmt: fmt, langName: langName, REVIEW_THRESHOLD: REVIEW_THRESHOLD, KNOCKOUT_CAP: KNOCKOUT_CAP };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(this);
