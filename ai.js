/*
 * ai.js — SIMULATED AI LAYER. Nothing here calls a model.
 *
 * In the real product, three jobs need a language model (the "removal test":
 * take the AI out and the product stops working):
 *   1. readTender(pdf)   -> structured requirements with page citations + confidence,
 *                           from a 50-200 page tender pack in any of 24 EU languages
 *   2. ask(tender, q)    -> answer a question about the tender, citing the page
 *   3. draftProfile(url) -> first draft of the company profile from its website / past bids
 * Everything that DECIDES (knock-outs, score, verdict) is plain code in engine.js.
 *
 * Here each function returns pre-written demo output after a short delay,
 * and every result carries simulated: true so the UI can label it.
 * 2 Nov 2026: optional progress callbacks added for the DESIGN.md reading/loading states.
 * 4 Nov 2026: ?demo=fast (live presentation) shortens the simulated waits for profile drafting and tender reading to
 * about 300 ms in total. Output, labels and the progress callbacks are unchanged; without the parameter nothing changes.
 * Signatures and return values are otherwise unchanged.
 */
(function (root) {
  'use strict';
  var FAST = (function () { try { return /(^|,)fast(,|$)/.test(new URLSearchParams(root.location.search).get('demo') || ''); } catch (e) { return false; } })();
  var wait = function (ms, cap) { return new Promise(function (r) { setTimeout(r, FAST && cap ? Math.min(ms, cap) : ms); }); };

  root.AI = {
    // onProgress (optional): called with { page, pages, step } while "reading". step: 0 find, 1 translate, 2 check.
    readTender: function (tender, onProgress) {
      var ticks = 8, chain = Promise.resolve();
      for (var i = 1; i <= ticks; i++) {
        (function (i) {
          chain = chain.then(function () { return wait(i === 1 ? 120 : 190, 33); }).then(function () {
            if (onProgress) onProgress({ page: Math.round(tender.pages * i / ticks), pages: tender.pages, step: i <= 3 ? 0 : i <= 6 ? 1 : 2 });
          });
        })(i);
      }
      return chain.then(function () { return wait(200, 33); }).then(function () {
        return { simulated: true, summary: tender.ai.summary, requirements: tender.requirements, pagesRead: tender.pages };
      });
    },
    ask: function (tender, qIndex) {
      return wait(450).then(function () {
        var item = tender.ai.qa[qIndex];
        return { simulated: true, question: item.q, answer: item.a };
      });
    },
    // onStep (optional): called with (index, steps) as each reading step completes; index -1 = started.
    draftProfile: function (website, demoProfile, onStep) {
      var p = JSON.parse(JSON.stringify(demoProfile));
      p.website = website;
      var steps = [
        { label: 'Reading ' + (website || 'your website'), meta: '18 pages', found: p.city.replace(/,.*$/, '') + ' · ' + p.staff + ' staff' },
        { label: 'Finding public contracts you delivered', meta: p.references + ' found', found: p.references + ' comparable references' },
        { label: 'Checking certificates', meta: p.certifications.join(', '), found: p.certifications.join(', ') + ' certificate on file' },
        { label: 'Drafting your profile', meta: 'Done', found: 'Bid languages: ' + p.languages.map(function (l) { return l.toUpperCase(); }).join(', ') }
      ];
      if (onStep) onStep(-1, steps);
      var chain = Promise.resolve();
      steps.forEach(function (s, i) {
        chain = chain.then(function () { return wait(i === 0 ? 900 : 700, 60); }).then(function () { if (onStep) onStep(i, steps); });
      });
      return chain.then(function () { return wait(350, 60); }).then(function () {
        return { simulated: true, profile: p };
      });
    }
  };
})(this);
