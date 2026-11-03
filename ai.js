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
 */
(function (root) {
  'use strict';
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  root.AI = {
    readTender: function (tender) {
      return wait(700).then(function () {
        return { simulated: true, summary: tender.ai.summary, requirements: tender.requirements, pagesRead: tender.pages };
      });
    },
    ask: function (tender, qIndex) {
      return wait(450).then(function () {
        var item = tender.ai.qa[qIndex];
        return { simulated: true, question: item.q, answer: item.a };
      });
    },
    draftProfile: function (website, demoProfile) {
      return wait(1200).then(function () {
        var p = JSON.parse(JSON.stringify(demoProfile));
        p.website = website;
        return { simulated: true, profile: p };
      });
    }
  };
})(this);
