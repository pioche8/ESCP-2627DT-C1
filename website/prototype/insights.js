/*
 * TenderScout — win/loss insights (deterministic, no AI). Added 5 Nov 2026.
 *
 * Turns the firm's past bids into the numbers on the Win/loss screen (#/insights): win rate, value won, win rate by
 * area (CPV division) and why bids were lost, with the price gap to the winner. Plain arithmetic, unit-tested in
 * tests/insights.test.js; it never changes engine.js or a verdict.
 * In the real product the outcome and the winner's price would come from the EU's award notices (matched to the bid)
 * and the reason from the owner's debrief note. In this prototype every past bid is fictional (data.js PAST_BIDS).
 * Also (6 Nov 2026): the test-session log, the north-star metric and its supporting metrics for a moderated test,
 * from the events app.js records on the phone (testLog, testLogText).
 * ES5 throughout, like the app's other scripts.
 */
(function (root) {
  'use strict';

  var WINDOW_MONTHS = 12;
  // Loss reasons the owner can record after a debrief. Order = tie-break order on the screen.
  var REASONS = ['price', 'quality', 'reference', 'unknown'];
  var REASON_LABEL = {
    price: 'Price',
    quality: 'Quality score on the concept',
    reference: 'Missing a reference',
    unknown: 'No feedback yet'
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // The same calendar day `months` earlier (clamped to the month's last day), as YYYY-MM-DD.
  function monthsBefore(iso, months) {
    var p = iso.slice(0, 10).split('-'), y = +p[0], m = +p[1] - 1 - months, d = +p[2];
    while (m < 0) { m += 12; y--; }
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return y + '-' + pad(m + 1) + '-' + pad(Math.min(d, last));
  }
  function round1(x) { return Math.round(x * 10) / 10; }
  // How far our price was above (+) or below (−) the winner's, in % of the winner's price, one decimal.
  function priceGap(bid) {
    if (!bid || !(bid.winnerPrice > 0) || !(bid.ourPrice > 0)) return null;
    return round1((bid.ourPrice - bid.winnerPrice) / bid.winnerPrice * 100);
  }
  function reasonOf(bid) { return REASONS.indexOf(bid.reason) !== -1 ? bid.reason : 'unknown'; }

  /**
   * Summary of the bids submitted in the `months` before `today` (today included; default 12).
   * Returns { from, to, submitted, won, lost, winRate, valueWon, priceGap, byArea[], reasons[], topReason }.
   *   winRate   whole percent of submitted bids that were won (0 when there are none)
   *   priceGap  average % above the winner over the bids lost on price that have both prices (null if none)
   *   byArea    [{ cpv, won, total, rate }] sorted by rate, then by bids, then by code
   *   reasons   [{ reason, label, count, avgGap, cheaper }] for lost bids, most frequent first; avgGap = average
   *             price gap of that group (null without prices), cheaper = how many of them were priced below the winner
   * Does not modify its input.
   */
  function summary(bids, today, months) {
    var to = today.slice(0, 10), from = monthsBefore(to, months == null ? WINDOW_MONTHS : months);
    var list = (bids || []).filter(function (b) { return b && b.submitted > from && b.submitted <= to; });
    var won = 0, valueWon = 0, areas = {}, groups = {};
    list.forEach(function (b) {
      var a = areas[b.cpv] || (areas[b.cpv] = { cpv: b.cpv, won: 0, total: 0, rate: 0 });
      a.total++;
      if (b.outcome === 'won') { won++; a.won++; valueWon += b.ourPrice || 0; return; }
      var r = reasonOf(b), g = groups[r] || (groups[r] = { reason: r, label: REASON_LABEL[r], count: 0, gaps: [], cheaper: 0 });
      g.count++;
      var gap = priceGap(b);
      if (gap !== null) { g.gaps.push(gap); if (gap < 0) g.cheaper++; }
    });
    var byArea = Object.keys(areas).map(function (k) {
      var a = areas[k]; a.rate = Math.round(a.won * 100 / a.total); return a;
    }).sort(function (x, y) {
      return (y.won / y.total - x.won / x.total) || (y.total - x.total) || (x.cpv < y.cpv ? -1 : x.cpv > y.cpv ? 1 : 0);
    });
    var reasons = Object.keys(groups).map(function (k) {
      var g = groups[k], sum = g.gaps.reduce(function (s, x) { return s + x; }, 0);
      return { reason: g.reason, label: g.label, count: g.count, avgGap: g.gaps.length ? round1(sum / g.gaps.length) : null, cheaper: g.cheaper };
    }).sort(function (x, y) { return (y.count - x.count) || (REASONS.indexOf(x.reason) - REASONS.indexOf(y.reason)); });
    var price = reasons.filter(function (r) { return r.reason === 'price'; })[0];
    return {
      from: from, to: to,
      submitted: list.length, won: won, lost: list.length - won,
      winRate: list.length ? Math.round(won * 100 / list.length) : 0,
      valueWon: valueWon,
      priceGap: price ? price.avgGap : null,
      byArea: byArea,
      reasons: reasons,
      topReason: reasons.length ? reasons[0].reason : null
    };
  }

  // ---------- test-session log (6 Nov 2026, pass 2) ----------
  // The north-star metric and its three supporting metrics as the product brief defines them ("Product objectives and
  // success metric"), read from the events app.js records on this phone (tenderscout.v2 `log`) during a moderated test.
  // Plain arithmetic like the rest of this file: nothing is sent anywhere, and nothing here touches a verdict.
  //   start   {e:'start', t, f?}      the Feed was shown (once per page load); f = recorded with ?demo=fast
  //   open    {e:'open', id, t, v, q} a tender's qualification check was shown; v = its verdict then, q = its
  //                                   "Needs your check" line ids then
  //   save    {e:'save', id, t} · skip {e:'skip', id, t} · restore {e:'restore', id, t} (a skipped tender back to Bids)
  //   undo    {e:'undo', id, t, d}    a skip was undone; d = whether the tender is still decided (it was saved before)
  //   answer  {e:'answer', id, r, v, t} the owner answered line r (v = 'pass' | 'fail'), or removed the answer (v = 'clear')
  var LOG_MAX = 500;
  function testLog(events) {
    var ev = (events || []).filter(function (x) { return x && typeof x.e === 'string' && typeof x.t === 'number'; });
    var opened = {}, decided = {}, shown = {}, answered = {}, goOpened = {}, goSaved = {};
    var start = null, fast = false, firstGo = null;
    ev.forEach(function (x) {
      if (x.e === 'start') { if (start === null) start = x.t; if (x.f) fast = true; }
      else if (x.e === 'open') {
        opened[x.id] = true;
        if (x.v === 'go') goOpened[x.id] = true;
        (x.q || []).forEach(function (r) { shown[x.id + ':' + r] = true; });
      }
      else if (x.e === 'save' || x.e === 'restore' || x.e === 'skip') {
        if (opened[x.id]) decided[x.id] = true; // a check counts only on a tender the owner opened
        if (x.e === 'save' && goOpened[x.id]) { goSaved[x.id] = true; if (firstGo === null) firstGo = x.t; }
      }
      else if (x.e === 'undo') { if (x.d) decided[x.id] = true; else delete decided[x.id]; }
      else if (x.e === 'answer') {
        var k = x.id + ':' + x.r;
        if (x.v === 'clear') delete answered[k]; else if (shown[k]) answered[k] = true;
      }
    });
    var n = function (o) { return Object.keys(o).length; };
    return {
      events: ev.length, full: ev.length >= LOG_MAX,
      from: ev.length ? ev[0].t : null, to: ev.length ? ev[ev.length - 1].t : null,
      checks: n(decided),                 // the north star: qualification checks completed, each tender once
      opened: n(opened),
      reviewShown: n(shown), reviewAnswered: n(answered),
      goOpened: n(goOpened), goSaved: n(goSaved),
      fast: fast,                         // ?demo=fast caps the simulated waits, so the time is not shown
      firstGoSeconds: !fast && start !== null && firstGo !== null ? Math.round((firstGo - start) / 1000) : null
    };
  }
  function utc(t) { return new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; }
  var LOG_CAPTION = 'For a moderated test on this phone. Not analytics: nothing is sent, and Reset demo clears it.';
  // The text the "Copy test-session log" button copies. opts.name(id) → a tender's name; opts.label(v) → a verdict word.
  function testLogText(events, opts) {
    opts = opts || {};
    var name = opts.name || function (id) { return id; }, label = opts.label || function (v) { return v; };
    var s = testLog(events), ev = (events || []).filter(function (x) { return x && typeof x.e === 'string' && typeof x.t === 'number'; });
    var plural = function (k, one) { return k + ' ' + one + (k === 1 ? '' : 's'); };
    var lines = ['TenderScout test-session log', LOG_CAPTION, 'All companies and tenders are fictional.', ''];
    if (!ev.length) { lines.push('None recorded yet.'); return lines.join('\n'); }
    lines.push('Recorded ' + utc(s.from) + ' to ' + utc(s.to) + ' (this phone\u2019s clock)' + (s.full ? ', then stopped at ' + LOG_MAX + ' events' : '') + '.');
    lines.push('Qualification checks completed: ' + s.checks + ' (a Save or Skip on a tender you opened, each tender once)');
    lines.push('Time from the Feed to the first Go saved: ' + (s.fast ? 'not shown (recorded with the fast demo setting, which shortens the waits)' : s.firstGoSeconds === null ? 'no Go tender saved yet' : s.firstGoSeconds + ' s'));
    lines.push('\u201cNeeds your check\u201d lines answered: ' + s.reviewAnswered + ' of ' + plural(s.reviewShown, 'line') + ' shown');
    lines.push('Go verdicts saved to Bids: ' + s.goSaved + ' of ' + s.goOpened + ' opened');
    lines.push('', 'Events (seconds after the first):');
    var ANSWER = { pass: 'We meet it', fail: 'We don\u2019t meet it', clear: 'answer removed' };
    ev.forEach(function (x) {
      var what = x.e === 'start' ? 'Feed'
        : x.e === 'open' ? 'Opened ' + name(x.id) + (x.v ? ' (' + label(x.v) + ')' : '')
        : x.e === 'save' ? 'Saved to Bids: ' + name(x.id)
        : x.e === 'skip' ? 'Skipped: ' + name(x.id)
        : x.e === 'restore' ? 'Restored: ' + name(x.id)
        : x.e === 'undo' ? 'Undo: ' + name(x.id)
        : x.e === 'answer' ? 'Answered a line on ' + name(x.id) + ': ' + (ANSWER[x.v] || x.v)
        : x.e;
      lines.push('+' + Math.round((x.t - s.from) / 1000) + ' s  ' + what);
    });
    return lines.join('\n');
  }

  var Insights = { summary: summary, priceGap: priceGap, monthsBefore: monthsBefore,
                   REASONS: REASONS, REASON_LABEL: REASON_LABEL, WINDOW_MONTHS: WINDOW_MONTHS,
                   testLog: testLog, testLogText: testLogText, LOG_MAX: LOG_MAX, LOG_CAPTION: LOG_CAPTION };
  if (typeof module !== 'undefined' && module.exports) module.exports = Insights;
  else root.Insights = Insights;
})(this);
