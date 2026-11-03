/* TenderScout prototype — UI + hash router. Depends on engine.js, data.js, ai.js. */
(function () {
  'use strict';
  var E = window.Engine, D = window.DEMO, AI = window.AI;
  var KEY = 'tenderscout.v1';
  var mem = null; // in-memory fallback when storage is blocked

  // ---------- state ----------
  function fresh() {
    return { onboarded: false, profile: JSON.parse(JSON.stringify(D.PROFILE)), overrides: {}, saved: {}, skipped: {}, filter: 'all' };
  }
  function load() {
    try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) { if (mem) return mem; }
    return mem || fresh();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { mem = S; } }
  var S = load();
  if (/[?&]demo=reset/.test(location.search)) { S = fresh(); save(); history.replaceState(null, '', location.pathname + '#/'); }

  var readCache = {}; // tenderId -> true once the (simulated) AI has "read" it this session

  // ---------- helpers ----------
  var $app = document.getElementById('app');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tender(id) { return D.TENDERS.filter(function (t) { return t.id === id; })[0]; }
  function evalT(t) { return E.evaluate(t, S.profile, D.DEMO_TODAY, S.overrides[t.id]); }
  function ranked() { return E.rank(D.TENDERS, S.profile, D.DEMO_TODAY, S.overrides); }
  var VERDICT = { go: 'Go', maybe: 'Maybe', nogo: 'No-go', closed: 'Closed' };
  var ICON = { pass: '✓', risk: '!', fail: '✕', review: '?' };
  var FLAG = { DE: '🇩🇪', AT: '🇦🇹', ES: '🇪🇸', NL: '🇳🇱', FR: '🇫🇷' };
  function chip(v) { return '<span class="chip v-' + v + '">' + VERDICT[v] + '</span>'; }
  function money(n) { return '€' + E.fmt(n); }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  }
  function header(title, opts) {
    opts = opts || {};
    return '<header class="top">' +
      (opts.back ? '<button class="back" aria-label="Back" data-act="back">‹</button>' : '') +
      '<h1>' + esc(title) + '</h1>' +
      (opts.sim ? '<span class="badge-sim" title="AI output is simulated in this prototype">Simulated AI</span>' : '') +
      (opts.info !== false ? '<button class="info" aria-label="About this prototype" data-go="#/about">ⓘ</button>' : '') +
      '</header>';
  }
  function tabs(active) {
    var n = Object.keys(S.saved).length;
    function a(href, i, label, key, extra) {
      return '<a href="' + href + '"' + (active === key ? ' aria-current="page"' : '') + '><span class="i" aria-hidden="true">' + i + '</span><span>' + label + (extra || '') + '</span></a>';
    }
    return '<nav class="tabs" aria-label="Main">' +
      a('#/feed', '◎', 'Feed', 'feed') +
      a('#/bids', '▤', 'Bids', 'bids', n ? '<span class="count">' + n + '</span>' : '') +
      a('#/company', '◧', 'Company', 'company') + '</nav>';
  }

  // ---------- screens ----------
  function onboarding(step) {
    document.body.classList.add('no-tabs');
    var bars = '<div class="steps">' + [1, 2, 3].map(function (i) { return '<span class="' + (i <= step ? 'on' : '') + '"></span>'; }).join('') + '</div>';
    if (step === 1) {
      return header('Welcome', { info: true }) + '<main>' + bars +
        '<h2 style="text-transform:none;font-size:22px;color:inherit;margin-top:0">Find public tenders you can actually win</h2>' +
        '<p class="muted">Every morning TenderScout reads new EU public tenders in any language and tells you, in one line, whether your company qualifies, with the page that proves it.</p>' +
        '<label class="f" for="web">Your company website</label>' +
        '<input id="web" type="url" inputmode="url" value="nordlicht-netzwerk.example" autocomplete="url">' +
        '<p class="small muted">We draft your profile from it. You check every field next.</p>' +
        '<div class="actions"><button class="btn primary" data-act="draft">Draft my profile</button></div></main>';
    }
    if (step === 2) {
      return header('Reading your website', { sim: true, info: false }) + '<main>' + bars +
        '<div class="reading"><div class="spinner" aria-hidden="true"></div><p>Reading your site, past references and certificates…</p></div></main>';
    }
    var p = S.profile;
    return header('Check your profile', { sim: true }) + '<main>' + bars +
      '<p class="muted small">Drafted by AI. Fix anything that is wrong: every verdict depends on it.</p>' +
      '<div class="card"><div class="t"><strong>' + esc(p.name) + '</strong></div>' +
      '<div class="meta"><span>' + esc(p.city) + '</span><span>' + p.staff + ' staff</span><span>' + money(p.turnover) + ' turnover</span></div>' +
      '<div class="meta"><span>Sectors: ' + esc(p.sectorsLabel.join(', ')) + '</span></div>' +
      '<div class="meta"><span>Certificates: ' + esc(p.certifications.join(', ')) + '</span><span>References: ' + p.references + '</span></div>' +
      '<div class="meta"><span>Bid languages: ' + p.languages.map(E.langName).join(', ') + '</span><span>Countries: ' + p.countries.join(', ') + '</span></div></div>' +
      '<div class="actions"><button class="btn" data-go="#/company">Edit</button><button class="btn primary" data-act="finish">Looks right</button></div></main>';
  }

  function feed() {
    var all = ranked().filter(function (r) { return !S.skipped[r.tenderId]; });
    var counts = { go: 0, maybe: 0, nogo: 0 };
    all.forEach(function (r) { if (counts[r.verdict] != null) counts[r.verdict]++; });
    var pages = D.TENDERS.reduce(function (s, t) { return s + t.pages; }, 0);
    var list = all.filter(function (r) { return S.filter === 'all' || r.verdict === S.filter || (S.filter === 'nogo' && r.verdict === 'closed'); });
    var f = function (k, label) { return '<button aria-pressed="' + (S.filter === k) + '" data-filter="' + k + '">' + label + '</button>'; };
    var skippedN = Object.keys(S.skipped).length;
    return header('Today · 5 Nov', { sim: true }) + '<main>' +
      '<div class="hero"><div class="small muted">New tenders matched to ' + esc(S.profile.name.replace(' (fictional)', '')) + '</div>' +
      '<strong>' + counts.go + ' Go · ' + counts.maybe + ' Maybe · ' + counts.nogo + ' No-go</strong>' +
      '<div class="small muted">Read ' + pages + ' pages in 4 languages so you don’t have to.</div></div>' +
      '<div class="filters" role="group" aria-label="Filter">' + f('all', 'All') + f('go', 'Go') + f('maybe', 'Maybe') + f('nogo', 'No-go') + '</div>' +
      (list.length ? list.map(card).join('') : '<div class="empty">Nothing here.</div>') +
      (skippedN ? '<p class="small muted" style="text-align:center">' + skippedN + ' skipped · <a href="#/bids">see in Bids</a></p>' : '') +
      '</main>' + tabs('feed');
  }

  function card(r) {
    var t = tender(r.tenderId), saved = S.saved[t.id];
    return '<button class="card tap" data-go="#/t/' + t.id + '" aria-label="' + esc(VERDICT[r.verdict] + ': ' + t.title) + '">' +
      '<div class="row">' + chip(r.verdict) + '<span class="score">' + r.score + '</span><span class="small muted">/100</span><span class="spacer"></span>' +
      (saved ? '<span class="small" style="color:var(--brand);font-weight:700">Saved</span>' : '') + '</div>' +
      '<h3>' + esc(t.title) + '</h3><div class="orig">' + esc(t.original) + '</div>' +
      '<div class="meta"><span>' + (FLAG[t.country] || '') + ' ' + esc(t.buyer) + '</span></div>' +
      '<div class="meta"><span>' + money(t.value) + '</span><span>' + (r.daysLeft > 0 ? r.daysLeft + ' days left' : 'closed') + '</span><span>' + esc(r.reason) + '</span></div>' +
      '</button>';
  }

  function detail(id, sub) {
    var t = tender(id); if (!t) return notFound();
    if (!readCache[id]) {
      AI.readTender(t).then(function () { readCache[id] = true; render(); });
      return header('Reading tender', { back: true, sim: true }) + '<main><div class="reading"><div class="spinner" aria-hidden="true"></div>' +
        '<p>Reading ' + t.pages + ' pages (' + E.langName(t.language) + ')…</p><p class="small muted">Extracting requirements and the page each one comes from</p></div></main>';
    }
    var r = evalT(t), saved = S.saved[id];
    var order = { fail: 0, review: 1, risk: 2, pass: 3 };
    var checks = r.checks.slice().sort(function (a, b) { return order[a.status] - order[b.status]; });
    var html = header(VERDICT[r.verdict] + ' · ' + r.score + '/100', { back: true, sim: true }) + '<main>' +
      '<div class="card"><div class="row">' + chip(r.verdict) + '<span class="small muted">' + esc(r.reason) + '</span></div>' +
      '<h3>' + esc(t.title) + '</h3><div class="orig">' + esc(t.original) + '</div>' +
      '<div class="meta"><span>' + (FLAG[t.country] || '') + ' ' + esc(t.buyer) + '</span><span>' + money(t.value) + '</span></div>' +
      '<div class="meta"><span>Deadline ' + t.deadline + ' (' + r.daysLeft + ' days)</span><span>Est. bid effort ~' + r.effortHours + ' h*</span></div></div>' +
      '<h2>In short</h2><div class="card"><p style="margin:0">' + esc(t.ai.summary) + '</p></div>' +
      '<h2>Can you qualify?</h2><div class="card" style="padding:4px 14px">' +
      checks.map(function (c) {
        return '<button class="req" data-go="#/t/' + id + '/req/' + c.id + '">' +
          '<span class="ico ' + c.status + '" aria-hidden="true">' + ICON[c.status] + '</span>' +
          '<span><span class="t">' + esc(c.label) + '</span><br><span class="n">' + esc(c.note) + '</span><br>' +
          '<span class="c">' + esc(c.cite) + (c.confirmed ? ' · confirmed' : '') + ' ›</span></span></button>';
      }).join('') + '</div>' +
      (t.ai.qa.length ? '<h2>Ask this tender</h2><div class="qa">' + t.ai.qa.map(function (q, i) {
        return '<button data-ask="' + i + '">' + esc(q.q) + '</button><div class="answer" id="ans-' + i + '" hidden></div>';
      }).join('') + '</div>' : '') +
      '<p class="small muted">* Effort is a rough heuristic, not validated.</p>' +
      '<div class="actions"><button class="btn" data-go="#/t/' + id + '/skip">Skip</button>' +
      (saved ? '<button class="btn" data-go="#/bids">In Bids: ' + saved + '</button>' :
        '<button class="btn primary" data-act="save" data-id="' + id + '"' + (r.verdict === 'closed' ? ' disabled' : '') + '>Save to Bids</button>') +
      '</div></main>';
    if (sub && sub.kind === 'req') html += reqSheet(t, r, sub.id);
    if (sub && sub.kind === 'skip') html += skipSheet(t);
    return html;
  }

  function reqSheet(t, r, rid) {
    var q = t.requirements.filter(function (x) { return x.id === rid; })[0]; if (!q) return '';
    var c = r.checks.filter(function (x) { return x.id === rid; })[0];
    var conf = Math.round((q.confidence || 0) * 100);
    return '<div class="scrim" data-act="close-sheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="Requirement source" data-stop>' +
      '<div class="grab"></div><div class="row"><span class="ico ' + c.status + ' chip" style="width:auto;padding:4px 10px">' + ICON[c.status] + ' ' + c.status + '</span>' +
      '<span class="spacer"></span><span class="small muted">AI confidence ' + conf + '%</span></div>' +
      '<h3 style="margin:10px 0 4px">' + esc(q.label) + '</h3><div class="small" style="color:var(--brand)">' + esc(q.cite) + '</div>' +
      '<div class="quote"><div class="lang">Original · ' + E.langName(t.language) + '</div>' + esc(q.src) + '</div>' +
      '<div class="quote"><div class="lang">Translation</div>' + esc(q.tr) + '</div>' +
      (q.note ? '<p class="small muted">' + esc(q.note) + '</p>' : '') +
      '<p class="small">' + esc(c.note) + '</p>' +
      '<div class="actions"><button class="btn" data-confirm="fail" data-t="' + t.id + '" data-r="' + rid + '">We don’t meet it</button>' +
      '<button class="btn primary" data-confirm="pass" data-t="' + t.id + '" data-r="' + rid + '">We meet it</button></div>' +
      (c.confirmed ? '<div class="actions"><button class="btn ghost" data-confirm="clear" data-t="' + t.id + '" data-r="' + rid + '">Undo my answer</button></div>' : '') +
      '</div></div>';
  }

  function skipSheet(t) {
    var reasons = ['Too big for us', 'Missing a certificate', 'Wrong region', 'Not enough time', 'Price-only, can’t compete', 'Other'];
    return '<div class="scrim" data-act="close-sheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="Why skip?" data-stop>' +
      '<div class="grab"></div><h3 style="margin-top:0">Why skip this one?</h3><p class="small muted">Your reasons tune tomorrow’s feed.</p>' +
      '<div class="toggles">' + reasons.map(function (x) { return '<button data-skip="' + esc(x) + '" data-id="' + t.id + '">' + esc(x) + '</button>'; }).join('') + '</div></div></div>';
  }

  function bids() {
    var ids = Object.keys(S.saved), sk = Object.keys(S.skipped);
    var stages = ['Deciding', 'Bidding', 'Submitted'];
    return header('Bids') + '<main>' +
      (ids.length ? stages.map(function (st) {
        var inSt = ids.filter(function (id) { return S.saved[id] === st; });
        if (!inSt.length) return '';
        return '<h2>' + st + '</h2>' + inSt.map(function (id) {
          var t = tender(id), r = evalT(t);
          return '<div class="card"><div class="row">' + chip(r.verdict) + '<span class="small muted">' + r.daysLeft + ' days left</span></div>' +
            '<h3><a href="#/t/' + id + '" style="color:inherit;text-decoration:none">' + esc(t.title) + '</a></h3>' +
            '<div class="toggles" role="group" aria-label="Stage">' + stages.map(function (s) {
              return '<button aria-pressed="' + (s === st) + '" data-stage="' + s + '" data-id="' + id + '">' + s + '</button>';
            }).join('') + '</div></div>';
        }).join('');
      }).join('') : '<div class="empty">No saved tenders yet.<br>Save a Go or Maybe from the Feed.</div>') +
      (sk.length ? '<h2>Skipped</h2>' + sk.map(function (id) {
        var t = tender(id);
        return '<div class="card"><div class="row"><span class="small muted">' + esc(S.skipped[id]) + '</span><span class="spacer"></span>' +
          '<button class="btn ghost" style="flex:none;min-height:40px;padding:0 12px" data-unskip="' + id + '">Restore</button></div>' +
          '<div style="font-weight:600">' + esc(t.title) + '</div></div>';
      }).join('') : '') +
      '</main>' + tabs('bids');
  }

  var lastVerdicts = null;
  function company() {
    var p = S.profile;
    var tg = function (list, opts, attr) {
      return '<div class="toggles">' + opts.map(function (o) {
        var v = o.v || o, l = o.l || o;
        return '<button aria-pressed="' + (list.indexOf(v) !== -1) + '" data-' + attr + '="' + esc(v) + '">' + esc(l) + '</button>';
      }).join('') + '</div>';
    };
    var langs = ['de', 'en', 'fr', 'es', 'nl'].map(function (c) { return { v: c, l: E.langName(c) }; });
    var delta = lastVerdicts ? diffVerdicts(lastVerdicts) : '';
    return header('Company profile') + '<main>' +
      '<p class="small muted">Change anything and every tender is re-checked instantly. This part is plain code, not AI.</p>' +
      (delta ? '<div class="delta" role="status">' + delta + '</div>' : '') +
      '<label class="f" for="to">Annual turnover (€)</label><input id="to" type="number" inputmode="numeric" step="100000" value="' + p.turnover + '" data-field="turnover">' +
      '<label class="f">Comparable references (last 3 years)</label><div class="stepper">' +
      '<button aria-label="Fewer references" data-ref="-1">−</button><output>' + p.references + '</output><button aria-label="More references" data-ref="1">+</button></div>' +
      '<label class="f">Certificates</label>' + tg(p.certifications, D.CERT_OPTIONS, 'cert') +
      '<label class="f">Languages you can bid in</label>' + tg(p.languages, langs, 'lang') +
      '<label class="f">Cross-border work</label><div class="toggles"><button aria-pressed="' + p.crossBorder + '" data-act="xb">' + (p.crossBorder ? 'Yes, outside ' + p.countries.join('/') : 'No, home market only') + '</button></div>' +
      '<div class="actions" style="margin-top:20px">' + (S.onboarded ? '<button class="btn primary" data-go="#/feed">See updated feed</button>' :
        '<button class="btn primary" data-act="finish">Save and see my feed</button>') + '</div></main>' + (S.onboarded ? tabs('company') : '');
  }
  function snapshot() { var m = {}; ranked().forEach(function (r) { m[r.tenderId] = r.verdict; }); return m; }
  function diffVerdicts(before) {
    var now = snapshot(), out = [];
    Object.keys(now).forEach(function (id) { if (before[id] !== now[id]) out.push(esc(tender(id).buyer.replace(' (fictional)', '')) + ': ' + VERDICT[before[id]] + ' → <strong>' + VERDICT[now[id]] + '</strong>'); });
    return out.join('<br>');
  }

  function about() {
    return header('About this prototype', { back: true, info: false }) + '<main><div class="card">' +
      '<p><strong>TenderScout</strong> is a university prototype (ESCP Digital Transformation, Digital Product Design, 2026). Working name.</p>' +
      '<p><span class="badge-sim">Simulated AI</span> Reading tenders, translating, answering questions and drafting the profile are <em>simulated</em> with pre-written output (ai.js). No model is called and no data leaves your phone.</p>' +
      '<p><strong>Real code:</strong> the qualification check, score and verdict (engine.js) run live and are unit-tested.</p>' +
      '<p><strong>Demo data:</strong> every company, buyer, tender, page number and quote is fictional. None of it is interview evidence.</p>' +
      '<p class="small muted">Built with AI assistance (Claude for the v0 scaffold; the team for evidence and changes). See README → AI use.</p></div>' +
      '<div class="actions"><button class="btn" data-act="reset">Reset demo</button></div></main>';
  }
  function notFound() { return header('Not found', { back: true }) + '<main><div class="empty">That page does not exist. <a href="#/feed">Go to Feed</a></div></main>'; }

  // ---------- router ----------
  function parse() {
    var h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!h.length) return { name: S.onboarded ? 'feed' : 'onb', step: 1 };
    if (h[0] === 'welcome') return { name: 'onb', step: +(h[1] || 1) };
    if (h[0] === 't' && h[1]) {
      if (h[2] === 'req' && h[3]) return { name: 'detail', id: h[1], sub: { kind: 'req', id: h[3] } };
      if (h[2] === 'skip') return { name: 'detail', id: h[1], sub: { kind: 'skip' } };
      return { name: 'detail', id: h[1] };
    }
    return { name: h[0] };
  }
  function render() {
    var r = parse(); document.body.classList.remove('no-tabs');
    if (!S.onboarded && ['onb', 'company', 'about'].indexOf(r.name) === -1) { location.replace('#/welcome/1'); return; }
    var html;
    switch (r.name) {
      case 'onb': html = onboarding(r.step); break;
      case 'feed': html = feed(); break;
      case 'detail': html = detail(r.id, r.sub); break;
      case 'bids': html = bids(); break;
      case 'company': html = company(); if (!S.onboarded) document.body.classList.add('no-tabs'); break;
      case 'about': html = about(); break;
      default: html = notFound();
    }
    $app.innerHTML = html;
    var h1 = $app.querySelector('h1'); if (h1) document.title = h1.textContent + ' · TenderScout';
  }
  function parentOf(hash) { // sheets close to their parent, details back to feed
    var m = hash.match(/^#\/t\/([^/]+)\/(req|skip)/); if (m) return '#/t/' + m[1];
    if (/^#\/(t|about)/.test(hash)) return '#/feed';
    return '#/feed';
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go],[data-act],[data-filter],[data-confirm],[data-ask],[data-skip],[data-stage],[data-unskip],[data-cert],[data-lang],[data-ref]');
    if (!el) return;
    if (el.dataset.act === 'close-sheet' && e.target.closest('[data-stop]')) return; // click inside sheet
    var d = el.dataset;
    if (d.go) { location.hash = d.go; return; }
    if (d.filter) { S.filter = d.filter; save(); render(); return; }
    if (d.confirm) {
      S.overrides[d.t] = S.overrides[d.t] || {};
      if (d.confirm === 'clear') delete S.overrides[d.t][d.r]; else S.overrides[d.t][d.r] = d.confirm;
      save(); location.hash = '#/t/' + d.t; return;
    }
    if (d.ask != null) {
      var id = parse().id, box = document.getElementById('ans-' + d.ask);
      box.hidden = false; box.textContent = 'Reading…';
      AI.ask(tender(id), +d.ask).then(function (res) { box.textContent = res.answer; });
      return;
    }
    if (d.skip) { S.skipped[d.id] = d.skip; delete S.saved[d.id]; save(); toast('Skipped. Tomorrow’s feed learns from it'); location.hash = '#/feed'; return; }
    if (d.unskip) { delete S.skipped[d.unskip]; save(); render(); return; }
    if (d.stage) { S.saved[d.id] = d.stage; save(); render(); return; }
    if (d.cert || d.lang || d.ref) {
      lastVerdicts = snapshot();
      var p = S.profile;
      if (d.cert) toggle(p.certifications, d.cert);
      if (d.lang) toggle(p.languages, d.lang);
      if (d.ref) p.references = Math.max(0, p.references + (+d.ref));
      save(); render(); return;
    }
    switch (d.act) {
      case 'back': location.hash = parentOf(location.hash); break;
      case 'draft':
        location.hash = '#/welcome/2';
        AI.draftProfile(document.getElementById('web') ? document.getElementById('web').value : '', D.PROFILE)
          .then(function (res) { S.profile = res.profile; save(); location.replace('#/welcome/3'); });
        break;
      case 'finish': S.onboarded = true; save(); location.hash = '#/feed'; break;
      case 'save': S.saved[d.id] = 'Deciding'; delete S.skipped[d.id]; save(); toast('Saved to Bids'); render(); break;
      case 'xb': lastVerdicts = snapshot(); S.profile.crossBorder = !S.profile.crossBorder; save(); render(); break;
      case 'close-sheet': location.hash = parentOf(location.hash); break;
      case 'reset': S = fresh(); readCache = {}; save(); location.hash = '#/welcome/1'; break;
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.dataset.field === 'turnover') {
      lastVerdicts = snapshot(); S.profile.turnover = Math.max(0, +e.target.value || 0); save(); render();
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.querySelector('.scrim')) location.hash = parentOf(location.hash); });
  function toggle(list, v) { var i = list.indexOf(v); if (i === -1) list.push(v); else list.splice(i, 1); }

  window.addEventListener('hashchange', function () { if (parse().name !== 'company') lastVerdicts = null; var r = parse(); render(); if (!r.sub) window.scrollTo(0, 0); });
  render();
})();
