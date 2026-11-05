/*
 * TenderScout — win/loss insights (deterministic, no AI). Added 5 Nov 2026.
 *
 * Turns the firm's past bids into the numbers on the Win/loss screen (#/insights): win rate, value won, win rate by
 * area (CPV division) and why bids were lost, with the price gap to the winner. Plain arithmetic, unit-tested in
 * tests/insights.test.js; it never changes engine.js or a verdict.
 * In the real product the outcome and the winner's price would come from the EU's award notices (matched to the bid)
 * and the reason from the owner's debrief note. In this prototype every past bid is fictional (data.js PAST_BIDS).
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

  var Insights = { summary: summary, priceGap: priceGap, monthsBefore: monthsBefore,
                   REASONS: REASONS, REASON_LABEL: REASON_LABEL, WINDOW_MONTHS: WINDOW_MONTHS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Insights;
  else root.Insights = Insights;
})(this);
