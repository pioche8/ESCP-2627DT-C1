/* Copied verbatim from ../engine.js by scripts/sync-shared.mjs. Do not edit: change the app file and run `npm run sync`. */
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

  // ---------------------------------------------------------------------------
  // Added for the DESIGN.md restyle (2 Nov 2026). Pure functions on top of
  // evaluate(); evaluate() and rank() and their return shapes are unchanged.
  // ---------------------------------------------------------------------------

  var VERDICT_LABEL = { go: 'Go', maybe: 'Maybe', nogo: 'No-go', closed: 'Closed' };
  var VERDICT_RANK = { closed: 0, nogo: 1, maybe: 2, go: 3 };
  var COUNTRIES = { DE: 'Germany', AT: 'Austria', ES: 'Spain', NL: 'the Netherlands', FR: 'France', IT: 'Italy', PL: 'Poland', BE: 'Belgium' };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function countryName(c) { return COUNTRIES[c] || c; }
  /** '2026-12-04' -> '4 Dec' */
  function shortDate(iso) { var p = iso.slice(0, 10).split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1]; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  // Lower-case the first letter unless it starts an acronym ("ISO 27001 …" stays).
  function lowerFirst(s) { return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }

  function reqOf(tender, check) {
    return tender.requirements.filter(function (q) { return q.id === check.id; })[0] || {};
  }
  function riskLabel(req, profile) {
    switch (req.type) {
      case 'certification': return req.value + ' via a partner';
      case 'min_references': return 'Short by ' + plural(req.value - profile.references, 'reference');
      case 'language': return 'Bid must be in ' + langName(req.value);
      case 'region': return 'Work in ' + countryName(req.value);
      case 'site_visit': return 'Mandatory site visit';
      default: return req.label;
    }
  }
  function failLabel(req, check, profile) {
    if (check.confirmed) return req.label;
    switch (req.type) {
      case 'min_turnover': return 'Needs €' + fmt(req.value) + ' turnover';
      case 'certification': return req.value + ' mandatory';
      case 'min_references': return 'Short by ' + plural(req.value - profile.references, 'reference');
      case 'region': return 'Delivery in ' + countryName(req.value);
      default: return req.label;
    }
  }
  function failSentence(req, check, profile) {
    if (check.confirmed) return 'you answered no to “' + req.label.replace(/[“”"]/g, '') + '”';
    switch (req.type) {
      case 'min_turnover': return 'it needs €' + fmt(req.value) + ' turnover and you have €' + fmt(profile.turnover);
      case 'certification': return 'you don’t hold ' + req.value;
      case 'min_references': return 'it needs ' + req.value + ' references and you have ' + profile.references;
      case 'region': return 'the work is in ' + countryName(req.value) + ' and you don’t take cross-border work';
      default: return lowerFirst(req.label);
    }
  }
  function split(tender, result) {
    var g = { pass: [], risk: [], fail: [], review: [] };
    result.checks.forEach(function (c) { g[c.status].push({ check: c, req: reqOf(tender, c) }); });
    return g;
  }

  /**
   * Short reason for a status line, e.g. "Short by 1 reference · mandatory site visit".
   * Derived only from evaluate()'s result, the tender and the profile.
   */
  function reasonLine(tender, profile, result) {
    var g = split(tender, result), parts;
    if (result.verdict === 'closed') return 'Deadline passed ' + shortDate(tender.deadline);
    if (result.verdict === 'nogo') {
      if (!g.fail.length) return 'Outside your sectors';
      parts = [g.fail.length === 1 ? failLabel(g.fail[0].req, g.fail[0].check, profile) : plural(g.fail.length, 'knock-out requirement')];
      if (g.review.length) parts.push(g.review.length + ' to check');
    } else if (result.verdict === 'maybe') {
      parts = g.risk.map(function (x) { return riskLabel(x.req, profile); });
      if (g.review.length) parts.push(g.review.length + ' to check');
      if (!parts.length) return 'Fit score under 70';
      if (parts.length > 2) parts = parts.slice(0, 2).concat(['+' + (parts.length - 2) + ' more']);
    } else {
      if (!g.risk.length) return 'Meets all ' + plural(result.checks.length, 'requirement');
      parts = ['Meets ' + g.pass.length + ' of ' + result.checks.length].concat(g.risk.map(function (x) { return riskLabel(x.req, profile); }));
    }
    return parts.map(function (p, i) { return i ? lowerFirst(p) : p; }).join(' · ');
  }

  /**
   * One or two plain sentences for the detail header, e.g.
   * "1 knock-out requirement: you don't hold ISO 27001. One more needs your answer."
   */
  function headline(tender, profile, result) {
    var g = split(tender, result);
    var nReview = g.review.length;
    var reviewSentence = nReview === 1 ? 'One more needs your answer.' : nReview > 1 ? nReview + ' more need your answer.' : '';
    if (result.verdict === 'closed') return 'The deadline passed on ' + shortDate(tender.deadline) + '. You can’t bid on this one any more.';
    if (result.verdict === 'nogo') {
      if (!g.fail.length) return 'Outside your sectors: none of its CPV codes match your profile.';
      return plural(g.fail.length, 'knock-out requirement') + ': ' +
        g.fail.map(function (x) { return failSentence(x.req, x.check, profile); }).join('; ') + '.' +
        (reviewSentence ? ' ' + reviewSentence : '');
    }
    if (result.verdict === 'maybe') {
      var risks = g.risk.map(function (x) { return lowerFirst(riskLabel(x.req, profile)); });
      var ask = nReview === 1 ? 'One line needs your answer.' : nReview > 1 ? nReview + ' lines need your answer.' : '';
      if (risks.length) return 'No knock-outs, but ' + (risks.length === 1 ? 'one risk' : risks.length + ' risks') + ': ' + risks.join(', ') + '.' + (ask ? ' ' + ask : '');
      if (ask) return 'No knock-outs. ' + ask;
      return 'No knock-outs, but the fit score is under 70.';
    }
    if (!g.risk.length) return 'You meet all ' + plural(result.checks.length, 'requirement') + '.';
    return 'You meet ' + g.pass.length + ' of ' + result.checks.length + '. One risk: ' + lowerFirst(riskLabel(g.risk[0].req, profile)) + '.';
  }

  /** { tenderId: { verdict, score } } for every tender. */
  function verdicts(tenders, profile, today, overridesById) {
    var m = {};
    tenders.forEach(function (t) {
      var r = evaluate(t, profile, today, (overridesById || {})[t.id]);
      m[t.id] = { verdict: r.verdict, score: r.score };
    });
    return m;
  }

  /** Verdict changes between two verdicts() maps. Improvements first. Closed tenders are ignored. */
  function diff(before, after) {
    var out = [];
    Object.keys(after).forEach(function (id) {
      var a = before[id], b = after[id];
      if (!a || !b || a.verdict === 'closed' || b.verdict === 'closed' || a.verdict === b.verdict) return;
      out.push({ tenderId: id, from: a.verdict, to: b.verdict, fromScore: a.score, toScore: b.score,
                 direction: VERDICT_RANK[b.verdict] > VERDICT_RANK[a.verdict] ? 'up' : 'down' });
    });
    return out.sort(function (x, y) { return (x.direction === y.direction) ? 0 : (x.direction === 'up' ? -1 : 1); });
  }

  /** "What would flip this": changes if the profile were patched. Changes nothing. */
  function whatIf(tenders, profile, today, overridesById, patch) {
    var next = {};
    Object.keys(profile).forEach(function (k) { next[k] = profile[k]; });
    Object.keys(patch || {}).forEach(function (k) { next[k] = patch[k]; });
    return diff(verdicts(tenders, profile, today, overridesById), verdicts(tenders, next, today, overridesById));
  }

  function fmt(n) {
    if (n >= 1000000) return (Math.round(n / 100000) / 10) + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'k';
    return String(n);
  }
  var LANGS = { en: 'English', de: 'German', fr: 'French', nl: 'Dutch', es: 'Spanish', it: 'Italian', pl: 'Polish' };
  function langName(c) { return LANGS[c] || c; }

  var Engine = { evaluate: evaluate, rank: rank, checkRequirement: checkRequirement, daysBetween: daysBetween,
                 fmt: fmt, langName: langName, REVIEW_THRESHOLD: REVIEW_THRESHOLD, KNOCKOUT_CAP: KNOCKOUT_CAP,
                 // added for the DESIGN.md restyle
                 reasonLine: reasonLine, headline: headline, verdicts: verdicts, diff: diff, whatIf: whatIf,
                 countryName: countryName, shortDate: shortDate, VERDICT_LABEL: VERDICT_LABEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})({});