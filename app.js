/* TenderScout prototype — UI + hash router. Depends on engine.js, data.js, ai.js.
 * Visual design: DESIGN.md ("Bold", v2.0) restyled 2 Nov 2026; the website's language applied 3 Nov 2026; decluttered
 * 4 Nov 2026 (flat surfaces, nine colours, one radius, one typeface, plain text statuses, a standard bottom tab bar).
 * engine.js decides every verdict; this file only renders and stores state. */
(function () {
  'use strict';
  var E = window.Engine, D = window.DEMO, AI = window.AI, I = window.Insights;
  var KEY = 'tenderscout.v2';          // v2: skipped = { id: { reasons: [], at } }, plus theme (and a palette field kept for shape stability), plus notifiedOn (5 Nov, additive)
  var STAGES = ['Deciding', 'Bidding', 'Submitted'];
  var SKIP_REASONS = ['Too big for us', 'Missing a certificate', 'Wrong region', 'Not enough time', 'Price-only', 'Other'];
  var LANG_OPTIONS = ['de', 'en', 'es', 'fr', 'nl'];
  var V = E.VERDICT_LABEL;             // go → 'Go', maybe → 'Maybe', nogo → 'No-go', closed → 'Closed'
  var SHAPE = { go: 'circle', maybe: 'tri', nogo: 'square', check: 'diamond' };   // check = ◆ Needs your check (status lines)
  // Requirement status → colour, shape and label. UI only: engine.js keeps pass/risk/fail/review.
  var STATUS = {
    fail:   { v: 'nogo',  shape: 'square',  label: 'Fails' },
    review: { v: 'check', shape: 'diamond', label: 'Needs your check' },
    risk:   { v: 'maybe', shape: 'tri',     label: 'Risk' },
    pass:   { v: 'go',    shape: 'circle',  label: 'Meets' }
  };
  var ORDER = { fail: 0, review: 1, risk: 2, pass: 3 };   // detail list: fail → check → risk → met
  var KIND = { min_turnover: 'Turnover', certification: 'Certificate', min_references: 'References', language: 'Bid language', region: 'Place of work', site_visit: 'Site visit', other: 'Unclear wording' };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---------- URL parameters (demo and test only) ----------
  var params = new URLSearchParams(location.search);
  var TODAY = /^\d{4}-\d{2}-\d{2}$/.test(params.get('today') || '') ? params.get('today') : D.DEMO_TODAY; // ?today= test-only
  var forceOffline = params.get('offline') === '1';
  var THEMES = ['system', 'light', 'dark'];
  var themeParam = params.get('theme');       // ?theme=system|light|dark: demo and test deep link for Appearance (dark first)
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- state ----------
  var mem = null; // in-memory fallback when storage is blocked
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // notifiedOn = the day the morning notification last showed. A fresh state counts as notified today, so it first shows
  // on the next day the app is opened (in the prototype "today" is fixed, so use ?demo=morning or About to see it).
  function fresh() {
    return { onboarded: false, profile: clone(D.PROFILE), website: '', overrides: {}, saved: {}, skipped: {}, filter: 'all', theme: 'dark', palette: 'brand', notifiedOn: TODAY, log: [] };
  }
  function load() {
    try { var s = localStorage.getItem(KEY); if (s) { var o = fresh(), p = JSON.parse(s); Object.keys(p).forEach(function (k) { o[k] = p[k]; }); return o; } }
    catch (e) { if (mem) return mem; }
    return mem || fresh();
  }
  var dirty = true;
  function save() { dirty = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { mem = S; } }
  function saveQuiet() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { mem = S; } } // persist without forcing a re-render
  var S = load();
  if (THEMES.indexOf(themeParam) !== -1) { S.theme = themeParam; save(); }
  var demoFlags = (params.get('demo') || '').split(','); // ?demo=reset wipes the state · ?demo=fast shortens the simulated AI waits (ai.js) · ?demo=reset,fast does both · ?demo=morning shows the morning notification once
  if (demoFlags.indexOf('reset') !== -1) {
    S = fresh(); if (THEMES.indexOf(themeParam) !== -1) S.theme = themeParam; save();
    if (demoFlags.indexOf('fast') !== -1) params.set('demo', 'fast'); else params.delete('demo');
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + '#/welcome/1');
  }
  if (demoFlags.indexOf('morning') !== -1) { // demo: play this morning's notification once, then drop the flag so a reload does not replay it
    S.notifiedOn = ''; save();
    var mf = demoFlags.filter(function (x) { return x && x !== 'morning'; });
    if (mf.length) params.set('demo', mf.join(',')); else params.delete('demo');
    var mqs = params.toString();
    history.replaceState(null, '', location.pathname + (mqs ? '?' + mqs : '') + (location.hash || '#/feed'));
  }

  // session-only UI state
  var readCache = {};   // tenderId -> true once the (simulated) AI has "read" it this session
  var reading = {};     // tenderId -> true while reading
  var answers = {};     // 'tenderId:i' -> answer text from AI.ask
  var openAsk = null;   // 'tenderId:i' of the expanded question (one at a time)
  var skipDraft = {};   // tenderId -> [reasons] while the skip sheet is open
  var lastChange = null;// { lever, changes } for the Company re-score card
  var pulse = {};       // tenderId -> true: pulse its score tile on the next Feed visit
  var collapseId = null;// tenderId just skipped: its card collapses out of the Feed
  var drafting = false;
  var logText = null;   // the test-session log, shown as selectable text after a copy that failed

  // Test-session log (6 Nov 2026): what a moderated test needs to read the north-star metric on this phone (insights.js
  // testLog). Real-clock times, at most I.LOG_MAX events, cleared by ?demo=reset and Reset demo. Nothing is sent.
  var FAST = demoFlags.indexOf('fast') !== -1, logged = {};
  function logEvent(e, id, extra, quiet) {
    if (!S.log || !S.log.push) S.log = [];
    if (S.log.length >= I.LOG_MAX) return;
    var x = { e: e, t: Date.now() };
    if (id) x.id = id;
    if (extra) Object.keys(extra).forEach(function (k) { x[k] = extra[k]; });
    S.log.push(x);
    if (quiet) saveQuiet(); else save();
  }
  function logScreen(r) { // once per page load: the Feed, and each tender's qualification check
    if (!S.onboarded) return;
    if (r.name === 'feed' && !logged.start) { logged.start = true; logEvent('start', null, FAST ? { f: 1 } : null, true); }
    if (r.name === 'detail' && readCache[r.id] && !logged['open:' + r.id]) {
      var t = tender(r.id); if (!t) return;
      var ev = evalT(t);
      logged['open:' + r.id] = true;
      logEvent('open', r.id, { v: ev.verdict, q: ev.checks.filter(function (c) { return c.status === 'review'; }).map(function (c) { return c.id; }) }, true);
    }
  }
  function copyLog() {
    var text = I.testLogText(S.log, { name: function (id) { var t = tender(id); return t ? bare(t.buyer) : id; }, label: function (v) { return V[v] || v; } });
    var n = I.testLog(S.log).checks;
    var failed = function () { logText = text; render(true); toast('Could not copy · the log is shown below'); };
    var done = function () { logText = null; render(true); toast('Copied · ' + plural(n, 'decision') + ' on this phone'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, failed);
      else failed();
    } catch (e) { failed(); }
  }

  // ---------- DOM ----------
  var $app = document.getElementById('app');
  $app.innerHTML = '<div id="screen"></div><div id="tabbar-root"></div><div id="sheet-root" class="sheet-root" hidden></div>' +
    '<div id="toast-root" class="toast-root" role="status" aria-live="polite"></div><div id="notify-root" class="notify-root" hidden></div>';
  var $screen = document.getElementById('screen'), $tabs = document.getElementById('tabbar-root'),
      $sheet = document.getElementById('sheet-root'), $toast = document.getElementById('toast-root'), $notify = document.getElementById('notify-root');

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tender(id) { return D.TENDERS.filter(function (t) { return t.id === id; })[0]; }
  function evalT(t) { return E.evaluate(t, S.profile, TODAY, S.overrides[t.id]); }
  function ranked() { return E.rank(D.TENDERS, S.profile, TODAY, S.overrides); }
  function reqOf(t, id) { return t.requirements.filter(function (q) { return q.id === id; })[0]; }
  function bare(name) { return String(name).replace(/\s*\(fictional\)/, ''); }
  function money(n) { return '€' + E.fmt(n); }
  function icon(name, cls) { return '<span class="ms' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + name + '</span>'; }
  function shape(kind, cls) { return '<span class="shape ' + kind + (cls ? ' ' + cls : '') + '" aria-hidden="true"></span>'; }
  function vShape(v, cls) { return v === 'closed' ? '' : shape(SHAPE[v], cls); }
  // "● Go" (shape + word, in the verdict colour), optionally followed by a reason in muted ink
  function status(v, label, why) { return '<span class="status v-' + v + '">' + vShape(v) + '<b>' + esc(label) + '</b>' + (why ? '<span class="why">· ' + esc(why) + '</span>' : '') + '</span>'; }
  function ai() { return '<span class="ai" title="AI output is simulated in this prototype">Simulated AI</span>'; }
  // Word-by-word reveal: each word is a span with its index; styles.css lights them up once per screen load.
  function words(text, firstCls) {
    return String(text).split(' ').map(function (w, i) { return '<span class="w' + (i === 0 && firstCls ? ' ' + firstCls : '') + '" style="--k:' + i + '">' + esc(w) + '</span>'; }).join(' ');
  }
  // "1 Go · 2 Maybe · 3 No-go" as plain text. `live` marks the counts the Company screen counts up after a change.
  function countsLine(c, live) {
    return '<p class="counts" id="co-tiles" aria-label="Your feed right now: ' + c.go + ' Go, ' + c.maybe + ' Maybe, ' + c.nogo + ' No-go">' + ['go', 'maybe', 'nogo'].map(function (v) {
      return '<span class="v-' + v + '"' + (live ? ' data-tile="' + v + '"' : '') + '>' + shape(SHAPE[v]) + '<b>' + c[v] + '</b>' + V[v] + '</span>';
    }).join('') + '</p>';
  }
  function fiction() { return '<p class="caption fiction">All companies and tenders are fictional</p>'; }
  // Photos: four tenders have a 200 px preview in assets/img/, shown in its own block on the detail (never under text).
  function photoSrc(t) { return t.photo ? 'assets/img/' + t.photo + '.png' : null; }
  function has(list, x) { return (list || []).indexOf(x) !== -1; }
  function toggle(list, v) { var i = list.indexOf(v); if (i === -1) list.push(v); else list.splice(i, 1); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function dayLabel(iso) { return DAYS[new Date(iso + 'T00:00:00Z').getUTCDay()] + ' ' + E.shortDate(iso); }
  function offline() { return forceOffline || navigator.onLine === false; }
  function citeParts(t, q) {
    var m = /p\.\s*(\d+)(?:,\s*(.+))?/.exec(q.cite || '');
    return { doc: t.doc || '', page: m ? m[1] : '', section: m && m[2] ? m[2] : '' };
  }
  function cite(doc, page, section) { return '<span class="cite">' + esc(doc + ', p. ' + page + (section ? ', ' + section : '')) + '</span>'; }
  function quoteHTML(src, hl) {
    var i = hl ? src.indexOf(hl) : -1;
    if (i < 0) return esc(src);
    return esc(src.slice(0, i)) + '<mark>' + esc(hl) + '</mark>' + esc(src.slice(i + hl.length));
  }
  // "… (p. 41, §7.1)." → { text, page } so the page becomes a citation line
  function splitAnswer(a) {
    var m = /\s*\(((?:[^()]*?\s)?p\.\s*(\d+)[^()]*)\)\.?\s*$/.exec(a);
    if (!m) return { text: a, page: null };
    return { text: a.slice(0, m.index).replace(/[\s,]+$/, '') + '.', page: m[2] };
  }
  function openCounts() {
    var c = { go: 0, maybe: 0, nogo: 0 };
    ranked().forEach(function (r) { if (!S.skipped[r.tenderId] && c[r.verdict] != null) c[r.verdict]++; });
    return c;
  }
  function haptic(kind) {
    try { if (navigator.vibrate) navigator.vibrate(kind === 'success' ? [12, 40, 12] : kind === 'warning' ? [30, 60, 30] : kind === 'select' ? 5 : 8); } catch (e) { /* not supported */ }
  }

  // ---------- shared chrome ----------
  function navRow(right) {
    return '<div class="nav"><span class="wordmark">TenderScout</span>' + (right || '') + '</div>';
  }
  function infoBtn() { return '<button class="icon-btn" data-go="#/settings" aria-label="Settings and about this prototype">' + icon('info', 's22') + '</button>'; }
  // Light / dark in one tap from the header (Settings → Appearance keeps the three-way choice incl. System).
  function themeBtn() {
    var next = effectiveScheme() === 'dark' ? 'light' : 'dark';
    return '<button class="icon-btn" data-act="theme-toggle" aria-label="Switch to ' + next + ' mode" title="Switch to ' + next + ' mode">' + icon('contrast', 's22') + '</button>';
  }
  function backBtn() { return '<button class="icon-btn" data-act="back" aria-label="Back">' + icon('chevron_left', 's22') + '</button>'; }
  // The bottom tab bar: full width, icon + label; the active tab is brand-coloured with a filled icon and a bolder label.
  var TABS = [['feed', '#/feed', 'radar', 'Feed'], ['bids', '#/bids', 'bookmarks', 'Bids'], ['company', '#/company', 'domain', 'Company'], ['profile', '#/profile', 'badge', 'Profile'], ['settings', '#/settings', 'tune', 'Settings']];
  function setTabs(active) {
    if (!active) { $tabs.innerHTML = ''; return; }
    if (!$tabs.querySelector('.tabbar')) {
      $tabs.innerHTML = '<nav class="tabbar" aria-label="Main">' + TABS.map(function (t) {
        return '<a href="' + t[1] + '" data-tab="' + t[0] + '">' + icon(t[2], 's24') + '<span>' + t[3] + '</span></a>';
      }).join('') + '</nav>';
    }
    TABS.forEach(function (t) {
      var a = $tabs.querySelector('a[data-tab="' + t[0] + '"]');
      if (t[0] === active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function emptyState(title, text, extra) {
    return '<div class="empty"><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p>' + (extra || '') + '</div>';
  }
  function offlineBanner() { return offline() ? '<p class="banner" role="note">Offline. Showing last night’s results.</p>' : ''; }

  // ---------- 01 Welcome ----------
  function welcome() {
    var open = ranked().filter(function (r) { return r.verdict !== 'closed'; });
    return '<div class="screen welcome">' +
      navRow('<span class="spacer"></span>' + themeBtn() + infoBtn()) +
      '<img class="photo" src="assets/img/app-welcome.png" alt="">' +
      '<div class="welcome-copy"><h1 class="screen-title" tabindex="-1">Find public tenders you can actually win</h1>' +
        '<p class="welcome-sub">New EU tenders, read overnight in any language. Each answer cites its page.</p>' +
        '<p class="meta-text" style="margin-top:10px">All ' + D.SECTORS.length + ' EU sectors · ' + plural(open.length, 'new tender') + ' tonight</p></div>' +
      '<form class="welcome-form" id="welcome-form" novalidate>' +
        '<label class="label-text" for="web">Company website</label>' +
        '<div class="field"><input id="web" type="text" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" value="' + esc(S.website || 'nordlicht-netzwerk.example') + '"></div>' +
        '<button type="button" class="btn btn-primary btn-block" data-act="draft">Draft my profile</button>' +
        '<p class="caption">Prototype · all companies and tenders are fictional</p>' +
      '</form></div>';
  }

  // ---------- 02 Reading ----------
  function readingScreen() {
    return '<div class="screen">' + navRow('<span class="spacer"></span>' + ai()) +
      '<div class="reading">' +
        '<h1 class="screen-title" tabindex="-1">Reading your site, references and certificates…</h1>' +
        '<div class="progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="5" id="rd-progress"><span id="rd-bar" style="--p:5%"></span></div>' +
        '<ol class="steps" id="rd-steps"></ol>' +
        '<div class="found" id="rd-found" aria-live="polite"><b>Found so far</b><span id="rd-found-list">—</span></div>' +
        '<p class="caption">About 20 seconds</p>' +
      '</div></div>';
  }
  function startDraft() {
    if (drafting) return;
    drafting = true;
    var found = [];
    AI.draftProfile(S.website || 'nordlicht-netzwerk.example', D.PROFILE, function (i, steps) {
      var ol = document.getElementById('rd-steps'); if (!ol) return;
      if (i >= 0) found.push(steps[i].found);
      ol.innerHTML = steps.map(function (s, k) {
        var st = k <= i ? 'done' : k === i + 1 ? 'active' : 'pending';
        return '<li class="step ' + st + '"><span class="lbl">' + esc(s.label) + '</span>' + (st === 'done' ? '<span class="meta-text">' + esc(s.meta) + '</span>' : '') +
          '<span class="sr-only">' + (st === 'done' ? 'done' : st === 'active' ? 'in progress' : 'waiting') + '</span></li>';
      }).join('');
      var pct = Math.round(((i + 1) / steps.length) * 100) || 5;
      var bar = document.getElementById('rd-bar'); if (bar) bar.style.setProperty('--p', pct + '%');
      var pr = document.getElementById('rd-progress'); if (pr) pr.setAttribute('aria-valuenow', pct);
      var fl = document.getElementById('rd-found-list'); if (fl && found.length) fl.innerHTML = found.map(esc).join('<br>');
    }).then(function (res) {
      drafting = false;
      S.profile = res.profile; save();
      if (/^#\/welcome\/2/.test(location.hash)) replaceTo('#/welcome/3');
    });
  }

  // ---------- 03 Check your profile ----------
  function checkProfile() {
    var p = S.profile;
    return '<div class="screen has-bar">' +
      '<div class="nav back-nav">' + backBtn() + '<span class="spacer"></span>' + ai() + '<span style="width:12px"></span></div>' +
      '<div class="gutter"><h1 class="screen-title" tabindex="-1">Check your profile</h1>' +
      '<p class="sub">Drafted from ' + esc(S.website || p.website || 'your website') + '. Fix anything that’s off.</p></div>' +
      profileCard(p, 'Drafted company profile', true) +
      '</div>' +
      '<div class="action-bar"><button class="btn btn-secondary" data-go="#/company">Edit</button><button class="btn btn-primary" data-act="finish">Looks right</button></div>';
  }

  // The company profile card: on Check your profile (with the AI's sources) and on the Profile tab (without them).
  function profileCard(p, label, withSources) {
    var kv = function (k, v) { return '<div class="kv"><p class="k">' + k + '</p><p class="v">' + esc(v) + '</p></div>'; };
    return '<section class="card profile-card" aria-label="' + label + '">' +
        '<div><p class="co-name">' + esc(p.name) + '</p><p class="meta-text">' + esc(p.city) + '</p></div>' +
        '<div class="stat-row"><div><b>' + p.staff + '</b><span>Staff</span></div><div><b>' + money(p.turnover) + '</b><span>Turnover</span></div><div><b>' + p.references + '</b><span>References</span></div></div>' +
        kv('Sectors', p.sectorsLabel.join(', ')) +
        kv('Certificates', p.certifications.length ? p.certifications.join(', ') : 'None yet') +
        kv('Bid languages', p.languages.map(E.langName).join(', ')) +
        kv('Countries', p.countries.map(E.countryName).join(', ') + (p.crossBorder ? ', cross-border' : '')) +
        (withSources ? '<p class="meta-text">Sources: ' + esc(S.website || 'nordlicht-netzwerk.example') + ', 18 pages, ' + plural(p.references, 'award notice') + ' (fictional)</p>' : '') +
      '</section>';
  }

  // ---------- Profile (4th tab): the company profile at a glance; changes happen on Company ----------
  function profile() {
    return '<div class="screen has-tabs">' +
      navRow('<span class="spacer"></span>' + themeBtn() + infoBtn()) +
      '<div class="gutter"><h1 class="screen-title" tabindex="-1">Profile</h1>' +
      '<p class="sub">What TenderScout checks every tender against.</p></div>' +
      profileCard(S.profile, 'Company profile', false) +
      '<div class="about-actions"><button class="btn btn-secondary btn-block" data-go="#/company">Edit on Company</button></div>' +
      '</div>';
  }

  // ---------- 04 Feed ----------
  function feed() {
    var all = ranked().filter(function (r) { return !S.skipped[r.tenderId] || r.tenderId === collapseId; });
    var visible = all.filter(function (r) { return !S.skipped[r.tenderId]; });
    var counts = { go: 0, maybe: 0, nogo: 0, closed: 0 };
    visible.forEach(function (r) { counts[r.verdict]++; });
    var open = counts.go + counts.maybe + counts.nogo;
    var pages = D.TENDERS.reduce(function (s, t) { return s + t.pages; }, 0);
    var langs = D.TENDERS.reduce(function (s, t) { if (s.indexOf(t.language) === -1) s.push(t.language); return s; }, []).length;
    var f = S.filter;
    var list = all.filter(function (r) { return f === 'all' || r.verdict === f || (f === 'nogo' && r.verdict === 'closed'); });
    var filterN = { all: visible.length, go: counts.go, maybe: counts.maybe, nogo: counts.nogo + counts.closed };
    var tab = function (k, label) {
      return '<button role="radio" aria-checked="' + (f === k) + '" data-filter="' + k + '"' + (k !== 'all' ? ' class="v-' + k + '"' : '') + ' aria-label="' + label + ', ' + filterN[k] + '">' +
        (k !== 'all' ? shape(SHAPE[k]) : '') + label + ' ' + filterN[k] + '</button>';
    };
    var skippedN = Object.keys(S.skipped).length;
    var body;
    if (!visible.length) {
      body = emptyState('Nothing new tonight', 'You skipped every tender. Restore any of them from Bids.',
        '<button class="btn btn-secondary" data-go="#/company">Widen your profile</button>');
    } else if (!list.length) {
      body = '<div class="empty compact"><p>No ' + V[f] + ' tenders tonight.</p><button class="text-btn" data-filter="all">Show all</button></div>';
    } else {
      body = '<div class="cards feed-list">' + list.map(function (r, i) { return card(r, i); }).join('') + '</div>';
    }
    pulse = {};
    return '<div class="screen has-tabs">' +
      navRow('<span class="spacer"></span>' + themeBtn() + infoBtn()) +
      '<div class="feed-head"><h1 class="screen-title reveal" tabindex="-1">' + (open ? words(plural(open, 'new tender'), 'accent') : words('No open tenders')) + '</h1>' +
      // "Simulated AI" labels the overnight reading itself (it used to sit in the nav, which overflows a 320 px phone with two header buttons)
      '<p class="pages-line">' + esc(dayLabel(TODAY)) + ' · read <b class="count-up" data-n="' + pages + '">' + pages + '</b> pages in ' + langs + ' languages<span class="nowrap"> · ' + ai() + '</span></p></div>' +
      offlineBanner() +
      '<div class="tabs filter" role="radiogroup" aria-label="Filter tenders">' + tab('all', 'All') + tab('go', 'Go') + tab('maybe', 'Maybe') + tab('nogo', 'No-go') + '</div>' +
      body +
      (skippedN ? '<p class="caption skipped-note">' + plural(skippedN, 'tender') + ' skipped · <a class="link" href="#/bids">see in Bids</a></p>' : '') +
      fiction() + '</div>';
  }

  // Tender card: verdict (shape + word + score), title, buyer, value, days left. Nothing else.
  function card(r, i) {
    var t = tender(r.tenderId), v = r.verdict, closed = v === 'closed', saved = S.saved[t.id];
    var soon = !closed && r.daysLeft <= 10;
    var label = (closed ? 'Closed' : V[v] + ', score ' + r.score + ' of 100') + '. ' + t.title + ', ' + bare(t.buyer) + ', ' + money(t.value) + ', ' + (closed ? 'closed' : plural(r.daysLeft, 'day') + ' left') + '.' + (saved ? ' Saved.' : '');
    var wasPulse = pulse[t.id];
    return '<div class="tcard-wrap" data-id="' + t.id + '" style="--i:' + ((i || 0) + 1) + '"><div>' +
      '<a class="tcard v-' + v + (closed ? ' is-closed' : '') + '" href="#/t/' + t.id + '" aria-label="' + esc(label) + '">' +
        '<span class="score' + (wasPulse ? ' pulse' : '') + '" aria-hidden="true">' + r.score + '</span>' +
        '<span class="tcard-body">' +
          status(v, V[v]) +
          '<span class="tcard-title">' + esc(t.title) + '</span>' +
          '<span class="meta-row"><span class="buyer">' + esc(bare(t.buyer)) + '</span>' +
            '<span class="nowrap">· ' + money(t.value) + ' · <span class="' + (soon ? 'soon' : '') + '">' + (closed ? 'closed' : r.daysLeft + ' d') + '</span></span>' +
            (saved ? '<span class="saved">Saved</span>' : '') + '</span>' +
        '</span></a></div></div>';
  }

  // ---------- 05 Tender detail ----------
  function detail(id) {
    var t = tender(id); if (!t) return notFound();
    if (!readCache[id]) return loadingDetail(t);
    var r = evalT(t), v = r.verdict, closed = v === 'closed', saved = S.saved[id], skipped = S.skipped[id];
    var checks = r.checks.slice().sort(function (a, b) { return ORDER[a.status] - ORDER[b.status]; });
    var head = closed
      ? '<p class="closed-word">Closed</p>'
      : '<p class="vhead-verdict">' + shape(SHAPE[v], 'lg') + V[v] + '</p>' +
        '<p class="vhead-score" aria-label="Score ' + r.score + ' of 100"><span class="num" aria-hidden="true">' + r.score + '</span><span class="of" aria-hidden="true">/100</span></p>';
    var qa = t.ai.qa || [];
    var actions;
    if (skipped) actions = '<button class="btn btn-secondary" data-unskip="' + id + '">Restore</button>';
    else actions = '<button class="btn btn-secondary" data-go="#/t/' + id + '/skip">Skip</button>';
    if (closed) actions += '<button class="btn grow-2" disabled>Save to Bids</button>';
    else if (saved) actions += '<button class="btn btn-secondary grow-2" data-go="#/bids">In Bids · ' + esc(saved) + '</button>';
    else actions += '<button class="btn btn-primary" data-act="save" data-id="' + id + '">Save to Bids</button>';
    var src = photoSrc(t);
    return '<div class="screen has-bar">' +
      '<header class="vhead v-' + v + '">' +
        '<div class="vhead-nav">' + backBtn() + ai() + '</div>' + head +
        '<p class="vhead-reason">' + esc(E.headline(t, S.profile, r)) + '</p>' +
      '</header>' +
      '<div class="detail-head"><h1 class="detail-title" tabindex="-1">' + esc(t.title) + '</h1>' +
        '<p class="orig" lang="' + esc(t.language) + '">' + esc(t.original) + '</p>' +
        '<p class="meta-row"><span class="buyer">' + esc(bare(t.buyer)) + ' · ' + esc(E.countryName(t.country)) + '</span>' + (skipped ? '<span class="nowrap">· skipped</span>' : '') + '</p></div>' +
      '<div class="facts">' +
        fact('Value', money(t.value)) +
        fact('Deadline', E.shortDate(t.deadline) + (closed ? ' · passed' : ' · ' + plural(r.daysLeft, 'day') + ' left'), !closed && r.daysLeft <= 10) +
      '</div>' +
      (offline() ? '<div style="margin-top:12px">' + offlineBanner() + '</div>' : '') +
      // Proof first (pass 5): the checklist, knock-outs on top, comes before the summary, and the photo moves to the end,
      // so the first requirement is on screen without a scroll on a 390 × 844 phone.
      '<div class="sec-h"><h2>Can you qualify?</h2><span class="aside">' + r.count.pass + ' of ' + r.checks.length + ' met</span></div>' +
      '<div class="cards">' + checks.map(function (c) { return reqCard(t, c, closed); }).join('') + '</div>' +
      '<div class="sec-h"><h2>In short</h2>' + ai() + '</div><p class="in-short reveal">' + words(t.ai.summary) + '</p>' +
      (qa.length ? '<div class="sec-h"><h2>Ask this tender</h2>' + ai() + '</div><div class="asks" id="asks">' + asksHTML(t) + '</div>' : '') +
      competitionHTML(t, r) +
      (src && !closed ? '<img class="photo detail-photo" src="' + src + '" alt="">' : '') +
      fiction() + '</div>' +
      '<div class="action-bar">' + (closed ? '<p class="bar-note">Closed tenders can’t be saved</p>' : '') + actions + '</div>';
  }
  // Competition: who bid on similar contracts and who is likely to bid now (simulated AI reading of past award notices,
  // fictional data in data.js), plus a rough chance to win from plain rules. Display only: the score and verdict
  // come from engine.js and are not touched.
  function chanceToWin(t, r) {
    var c = D.COMPETITION && D.COMPETITION[t.id]; if (!c) return null;
    if (r.verdict === 'nogo') return { level: 'Qualify first', odds: '', why: ['You miss a knock-out above, so a bid would be excluded before price or quality count.'] };
    var counts = c.past.map(function (a) { return a.bidders; });
    var avg = counts.reduce(function (a, b) { return a + b; }, 0) / counts.length, p = 1 / avg;
    var lo = Math.min.apply(null, counts), hi = Math.max.apply(null, counts);
    var why = ['Similar contracts drew ' + (lo === hi ? lo : lo + ' to ' + hi) + ' bidders.'];
    var wins = {}; c.past.forEach(function (a) { wins[a.winner] = (wins[a.winner] || 0) + 1; });
    var top = c.rivals.slice().sort(function (a, b) { return (wins[b.id] || 0) - (wins[a.id] || 0); })[0];
    if ((wins[top.id] || 0) >= 2) { p *= 0.7; why.push(bare(top.name) + ' won ' + wins[top.id] + ' of the last ' + c.past.length + '.'); }
    var strongest = c.rivals.slice().sort(function (a, b) { return b.refs - a.refs; })[0], mine = S.profile.references;
    if (mine > strongest.refs) { p *= 1.2; why.push('You have more comparable references (' + mine + ') than any rival.'); }
    else if (mine < strongest.refs) { p *= 0.8; why.push(bare(strongest.name) + ' has more references (' + strongest.refs + ' vs your ' + mine + ').'); }
    else why.push('Your references (' + mine + ') match the strongest rival.');
    if (r.verdict === 'maybe') why.push('Only once you clear the open points above.');
    return { level: p >= 0.25 ? 'Good chance' : p >= 0.15 ? 'Fair chance' : 'Low chance', odds: 'About 1 in ' + Math.max(2, Math.round(1 / p)), why: why };
  }
  function competitionHTML(t, r) {
    var c = D.COMPETITION && D.COMPETITION[t.id]; if (!c || r.verdict === 'closed') return '';
    var ch = chanceToWin(t, r);
    var wins = {}; c.past.forEach(function (a) { wins[a.winner] = (wins[a.winner] || 0) + 1; });
    var name = function (id) { var x = c.rivals.filter(function (v) { return v.id === id; })[0]; return x ? bare(x.name) : id; };
    var row = function (title, meta) { return '<div class="row"><div class="txt"><p class="row-label">' + esc(title) + '</p><p class="meta-text">' + esc(meta) + '</p></div></div>'; };
    return '<div class="sec-h"><h2>Competition</h2>' + ai() + '</div>' +
      '<div class="group comp-chance">' +
        '<p class="comp-level">' + esc(ch.level) + (ch.odds ? '<span class="comp-odds"> · ' + esc(ch.odds) + '</span>' : '') + '</p>' +
        '<ul class="comp-why">' + ch.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' +
        '<p class="meta-text">Rough estimate from past awards with plain rules, not AI. It does not change the score.</p>' +
      '</div>' +
      '<p class="label-text comp-h">Likely bidders</p><div class="group">' +
        c.rivals.map(function (v) { return row(bare(v.name), 'Won ' + (wins[v.id] || 0) + ' of the last ' + c.past.length + ' · ' + plural(v.refs, 'reference')); }).join('') +
      '</div>' +
      '<p class="label-text comp-h">Similar past awards</p><div class="group">' +
        c.past.map(function (a) { return row(a.title, bare(a.buyer) + ', ' + a.year + ' · won by ' + name(a.winner) + ' · ' + plural(a.bidders, 'bidder') + ' · ' + money(a.value)); }).join('') +
      '</div>';
  }
  function fact(k, v, soon) { return '<div class="fact"><p class="k">' + k + '</p><p class="v' + (soon ? ' soon' : '') + '">' + esc(v) + '</p></div>'; }

  // closed: the tender can no longer be bid on, so its checklist is a record: no "Check →" and the citation stays muted.
  function reqCard(t, c, closed) {
    var q = reqOf(t, c.id), st = STATUS[c.status], cp = citeParts(t, q), unresolved = c.status === 'review';
    var kind = c.confirmed ? 'Your answer' : c.status === 'fail' ? 'Knock-out' : (KIND[q.type] || 'Requirement');
    var line = c.confirmed ? (c.status === 'pass' ? 'You said you meet it' : 'You said you don’t meet it')
      : unresolved ? Math.round(q.confidence * 100) + '% sure. Only you can answer.' : c.note;
    var label = st.label + ', ' + kind.toLowerCase() + '. ' + q.label + '. ' + line + '. Source: ' + cp.doc + ' page ' + cp.page + '.';
    return '<a class="req v-' + st.v + (closed ? ' req-record' : '') + '" href="#/t/' + t.id + '/req/' + c.id + '" aria-label="' + esc(label) + '">' +
      status(st.v, st.label, kind) +
      '<span class="req-title">' + esc(q.label) + '</span>' +
      '<span class="' + (unresolved ? 'req-sure' : 'req-check') + '">' + esc(line) + '</span>' +
      cite(cp.doc, cp.page, cp.section) +
      (unresolved && !closed ? '<span class="req-cta">Check' + icon('arrow_forward', 's18') + '</span>' : '') + '</a>';
  }

  function asksHTML(t) {
    return (t.ai.qa || []).map(function (q, i) {
      var key = t.id + ':' + i, open = openAsk === key, ans = answers[key], inner = '';
      if (open) {
        if (ans == null) inner = '<p class="typing">Reading the tender…</p>';
        else { var a = splitAnswer(ans); inner = '<p>' + esc(a.text) + '</p>' + (a.page ? cite(t.doc, a.page) : ''); }
      }
      return '<div class="ask' + (open ? ' open' : '') + '"><button data-ask="' + i + '" aria-expanded="' + open + '" aria-controls="ans-' + i + '">' +
        '<span>' + esc(q.q) + '</span>' + icon('add') + '</button>' +
        '<div class="answer" id="ans-' + i + '"' + (open ? '' : ' hidden') + '>' + inner + '</div></div>';
    }).join('');
  }
  function toggleAsk(i) {
    var id = parse().id, t = tender(id); if (!t) return;
    var key = id + ':' + i;
    openAsk = openAsk === key ? null : key;
    var box = document.getElementById('asks'); if (box) box.innerHTML = asksHTML(t);
    if (openAsk && answers[key] == null) {
      AI.ask(t, i).then(function (res) {
        answers[key] = res.answer;
        var b = document.getElementById('asks'); if (b && parse().id === id) b.innerHTML = asksHTML(t);
      });
    }
  }

  // Loading state: first open of a tender in this session
  function loadingDetail(t) {
    var lang = E.langName(t.language), n = t.requirements.length;
    if (!reading[t.id]) {
      reading[t.id] = true;
      AI.readTender(t, function (p) {
        var bar = document.getElementById('ld-bar'), pg = document.getElementById('ld-page'), steps = document.getElementById('ld-steps');
        if (bar) bar.style.setProperty('--p', Math.round(100 * p.page / p.pages) + '%');
        if (pg) pg.textContent = 'p. ' + p.page + ' of ' + p.pages;
        if (steps) steps.innerHTML = loadSteps(n, p.step);
      }).then(function () {
        readCache[t.id] = true; reading[t.id] = false;
        if (parse().id === t.id) render(true);
      });
    }
    return '<div class="screen has-bar">' +
      '<header class="vhead loading">' +
        '<div class="vhead-nav">' + backBtn() + ai() + '</div>' +
        '<p class="loading-title">Reading ' + t.pages + ' pages (' + lang + ')…</p>' +
        '<p class="loading-page" id="ld-page">p. 0 of ' + t.pages + '</p>' +
        '<div class="progress" style="margin-top:12px"><span id="ld-bar" style="--p:3%"></span></div>' +
        '<ul class="load-steps" id="ld-steps">' + loadSteps(n, 0) + '</ul>' +
      '</header>' +
      '<div class="detail-head"><h1 class="detail-title" tabindex="-1">' + esc(t.title) + '</h1>' +
        '<p class="orig" lang="' + esc(t.language) + '">' + esc(t.original) + '</p>' +
        '<p class="meta-row"><span class="buyer">' + esc(bare(t.buyer)) + ' · ' + esc(E.countryName(t.country)) + '</span></p></div>' +
      '<div class="skel-block" aria-hidden="true"><div class="skel h22 w50"></div><div class="skel w90"></div><div class="skel w70"></div><div class="skel w90"></div><div class="skel h22 w50"></div><div class="skel w70"></div></div>' +
      fiction() + '</div>' +
      '<div class="action-bar"><button class="btn btn-secondary" data-go="#/t/' + t.id + '/skip">Skip</button>' +
      (S.saved[t.id] ? '<button class="btn btn-secondary grow-2" data-go="#/bids">In Bids · ' + esc(S.saved[t.id]) + '</button>'
        : '<button class="btn btn-primary" data-act="save" data-id="' + t.id + '">Save to Bids</button>') + '</div>';
  }
  function loadSteps(n, step) {
    var labels = [step > 0 ? 'Found ' + plural(n, 'requirement') : 'Finding requirements', 'Translating the key clauses', 'Checking them against your profile'];
    return labels.map(function (l, i) {
      var st = i < step ? 'done' : i === step ? 'active' : 'pending';
      return '<li class="load-step ' + st + '">' + esc(l) + '<span class="sr-only"> (' + (st === 'done' ? 'done' : st === 'active' ? 'in progress' : 'waiting') + ')</span></li>';
    }).join('');
  }

  // ---------- 06 Requirement sheet ----------
  function reqSheet(t, rid) {
    var q = reqOf(t, rid); if (!q) return null;
    var r = evalT(t), c = r.checks.filter(function (x) { return x.id === rid; })[0];
    var st = STATUS[c.status], unresolved = c.status === 'review' && !c.confirmed, cp = citeParts(t, q);
    var callout;
    if (c.confirmed) callout = c.status === 'pass' ? 'You said you meet this. It counts as met.' : 'You said you don’t meet this. It counts as a knock-out.';
    else if (c.status === 'review') callout = (q.note ? q.note + ' ' : 'The tender is unclear here. ') + 'Only you can answer.';
    else callout = c.note + '.';
    var lang = E.langName(t.language);
    return '<div class="scrim" data-act="close-sheet"></div>' +
      '<div class="sheet v-' + st.v + '" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-stop>' +
      '<div class="sheet-body">' +
        '<div class="sheet-top">' + status(st.v, st.label) + ai() +
          '<p class="confidence"><b>' + Math.round((q.confidence || 0) * 100) + '%</b> AI confidence</p></div>' +
        '<h2 class="sheet-title" id="sheet-title" tabindex="-1">' + esc(q.label) + '</h2>' +
        '<p class="callout">' + esc(callout) + '</p>' +
        '<figure class="quote">' +
          '<figcaption class="quote-head">Original (' + esc(lang) + ') · ' + esc(cp.doc) + ', p. ' + esc(cp.page) + (cp.section ? ', ' + esc(cp.section) : '') + '</figcaption>' +
          '<blockquote lang="' + esc(t.language) + '">' + quoteHTML(q.src, q.highlight) + '</blockquote></figure>' +
        '<div><p class="translation-k">Translation</p><p class="translation">' + esc(q.tr) + '</p></div>' +
      '</div>' +
      '<div class="sheet-foot">' +
        (c.confirmed ? '<p class="answered">You answered: ' + (c.status === 'pass' ? 'We meet it' : 'We don’t meet it') +
          ' · <button class="text-btn" data-confirm="clear" data-t="' + t.id + '" data-r="' + rid + '">Undo</button></p>' : '') +
        '<div class="row-btns pair">' +
          '<button class="btn btn-secondary' + (unresolved ? ' btn-check' : '') + '" data-confirm="fail" data-t="' + t.id + '" data-r="' + rid + '">We don’t meet it</button>' +
          '<button class="btn ' + (unresolved ? 'btn-secondary btn-check' : 'btn-primary grow-2') + '" data-confirm="pass" data-t="' + t.id + '" data-r="' + rid + '">We meet it</button>' +
        '</div></div></div>';
  }

  // ---------- 07 Skip sheet ----------
  function skipSheet(t) {
    var sel = skipDraft[t.id] || (skipDraft[t.id] = []);
    return '<div class="scrim" data-act="close-sheet"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-stop>' +
      '<div class="sheet-body">' +
        '<div><h2 class="sheet-title" id="sheet-title" tabindex="-1">Why skip this one?</h2>' +
        '<p class="sheet-sub">' + esc(t.title) + ' · ' + esc(bare(t.buyer)) + '</p></div>' +
        '<div class="opt-grid" role="group" aria-label="Reasons, optional">' + SKIP_REASONS.map(function (x) {
          return '<button class="opt" aria-pressed="' + has(sel, x) + '" data-skip="' + esc(x) + '" data-id="' + t.id + '">' + esc(x) + '</button>';
        }).join('') + '</div>' +
        '<p class="tune-note">Reasons tune tomorrow’s feed. Skipping without one is fine.</p>' +
      '</div>' +
      '<div class="sheet-foot"><div class="row-btns">' +
        '<button class="btn btn-secondary" data-act="close-sheet">Cancel</button>' +
        '<button class="btn btn-primary grow-2" data-act="skip-confirm" data-id="' + t.id + '">Skip tender</button>' +
      '</div></div></div>';
  }

  // ---------- 08 Bids ----------
  function bids() {
    var ids = Object.keys(S.saved), sk = Object.keys(S.skipped);
    var results = {}; ids.forEach(function (id) { results[id] = evalT(tender(id)); });
    var openDays = ids.map(function (id) { return results[id]; }).filter(function (r) { return r.verdict !== 'closed'; }).map(function (r) { return r.daysLeft; });
    var sub = ids.length ? plural(ids.length, 'saved', 'saved') + (openDays.length ? ' · next deadline in ' + plural(Math.min.apply(null, openDays), 'day') : '') : 'Nothing saved yet';
    var body;
    if (!ids.length && !sk.length) {
      body = emptyState('No bids yet', 'Save a tender from the Feed and it lands here.',
        '<button class="btn btn-primary" data-go="#/feed">Open Feed</button>');
    } else {
      body = STAGES.map(function (stage) {
        var inSt = ids.filter(function (id) { return S.saved[id] === stage; });
        return '<div class="sec-h"><h2>' + stage + ' <span class="aside">' + inSt.length + '</span></h2></div>' +
          (inSt.length ? '<div class="cards">' + inSt.map(function (id, i) { return bidCard(tender(id), results[id], stage, i); }).join('') + '</div>'
            : '<p class="placeholder">Nothing here yet</p>');
      }).join('') +
      (sk.length ? '<div class="sec-h"><h2>Skipped <span class="aside">' + sk.length + '</span></h2></div><div class="skipped">' + sk.map(function (id) {
        var t = tender(id), why = (S.skipped[id] && S.skipped[id].reasons) || [];
        return '<div class="skip-row"><div class="txt"><p class="t">' + esc(t.title) + '</p><p class="r">' + esc(bare(t.buyer)) + ' · ' + esc(why.length ? why.join(', ') : 'No reason given') + '</p></div>' +
          '<button class="btn btn-secondary btn-sm" data-unskip="' + id + '" aria-label="Restore ' + esc(t.title) + '">Restore</button></div>';
      }).join('') + '</div>' : '');
    }
    return '<div class="screen has-tabs">' + navRow('<span class="spacer"></span>' + themeBtn() + infoBtn()) +
      '<div class="bids-head"><h1 class="screen-title" tabindex="-1">Bids</h1><p class="sub">' + esc(sub) + '</p></div>' +
      insightsLink() + body + fiction() + '</div>';
  }
  // The way into Win/loss insights: past results belong next to the pipeline, so it sits at the top of Bids.
  function insightsLink() {
    var s = I.summary(D.PAST_BIDS, TODAY);
    return '<a class="insights-link" href="#/insights"><span class="txt"><span class="row-label">Win/loss insights</span>' +
      '<span class="row-sub">' + s.won + ' of ' + s.submitted + ' won · ' + s.winRate + '% in the last 12 months</span></span>' +
      icon('arrow_forward', 's22') + '</a>';
  }

  // ---------- 08b Win/loss insights (#/insights) ----------
  // Win rate by area and why bids were lost, from the company's past bids. insights.js does the arithmetic (no AI);
  // every past bid is fictional (data.js PAST_BIDS). The tab bar stays, with Bids active: this is a page of Bids.
  var REASON_HINT = { reference: 'The buyer asked for a reference you did not have', unknown: 'Add the buyer’s feedback when it arrives' };
  function sectorName(cpv) { var x = D.SECTORS.filter(function (s) { return s[0] === cpv; })[0]; return x ? x[1] : cpv; }
  function insightsScreen() {
    var s = I.summary(D.PAST_BIDS, TODAY);
    var kpi = function (n, k) { return '<div class="kpi"><p class="n">' + esc(n) + '</p><p class="k">' + esc(k) + '</p></div>'; };
    var areas = s.byArea.map(function (a) {
      var name = sectorName(a.cpv);
      return '<li class="area-row"><div class="area-top"><span class="area-name">' + esc(name) + '</span>' +
        '<span class="area-n">' + a.won + ' of ' + a.total + ' won · ' + a.rate + '%</span></div>' +
        '<div class="area-bar" aria-hidden="true"><span style="width:' + a.rate + '%"></span></div></li>';
    }).join('');
    var reasons = s.reasons.map(function (r) {
      var sub = r.reason === 'price' && r.avgGap !== null ? r.avgGap + '% above the winner on average'
        : r.reason === 'quality' && r.cheaper ? 'You were the cheaper bid in ' + r.cheaper + ' of ' + r.count
        : REASON_HINT[r.reason] || '';
      return '<div class="row"><div class="txt"><p class="row-label">' + esc(r.label) + '</p>' + (sub ? '<p class="row-sub">' + esc(sub) + '</p>' : '') + '</div>' +
        '<p class="reason-n">' + r.count + '<span class="sr-only"> ' + (r.count === 1 ? 'bid' : 'bids') + '</span></p></div>';
    }).join('');
    var top = s.reasons[0];
    var note = !top ? '' : top.reason === 'price' && s.priceGap !== null
      ? 'You lose most often on <b>price</b>: ' + top.count + ' of ' + s.lost + ' lost bids, on average ' + s.priceGap + '% above the winner.'
      : 'Most lost bids: <b>' + esc(top.label.toLowerCase()) + '</b>, ' + top.count + ' of ' + s.lost + '.';
    var body = !s.submitted ? emptyState('No results yet', 'Win/loss insights appear once you have submitted bids and the results are out.')
      : '<div class="kpis">' +
          kpi(s.winRate + '%', 'Win rate · ' + s.won + ' of ' + s.submitted + ' won') +
          kpi(money(s.valueWon), 'Contract value won') +
          kpi(String(s.lost), s.lost === 1 ? 'Bid lost' : 'Bids lost') +
          kpi(s.priceGap === null ? '–' : s.priceGap + '%', 'Above the winner when you lost on price') +
        '</div>' +
        '<div class="sec-h"><h2>Win rate by area</h2><span class="aside">won of submitted</span></div>' +
        '<ul class="group" aria-label="Win rate by area">' + areas + '</ul>' +
        (s.lost ? '<div class="sec-h"><h2>Why you lost</h2><span class="aside">' + plural(s.lost, 'bid') + '</span></div>' +
          '<p class="insight-note">' + note + '</p><div class="group">' + reasons + '</div>' : '');
    return '<div class="screen has-tabs"><div class="nav back-nav">' + backBtn() + '</div>' +
      '<div class="bids-head"><h1 class="screen-title" tabindex="-1">Win/loss insights</h1>' +
      '<p class="sub">' + plural(s.submitted, 'bid') + ' submitted in the last 12 months</p></div>' + body +
      '<p class="caption insights-foot">In the full product the results come from the EU’s award notices and the reasons from your own debrief notes. The numbers are plain arithmetic, not AI. All past bids, buyers and prices are fictional.</p>' +
      '</div>';
  }
  var enteringId = null;
  function bidCard(t, r, stage, i) {
    var v = r.verdict, closed = v === 'closed';
    return '<article class="bid-card v-' + v + (enteringId === t.id ? ' entering' : '') + '" style="--i:' + ((i || 0) + 1) + '" aria-label="' + esc(t.title) + '">' +
      '<a class="top" href="#/t/' + t.id + '"><span class="score" aria-hidden="true">' + r.score + '</span>' +
      '<span class="min0">' + status(v, V[v]) +
      '<span class="tcard-title">' + esc(t.title) + '</span><span class="meta-row"><span class="buyer">' + esc(bare(t.buyer)) + '</span>' +
      '<span class="nowrap">· ' + (closed ? 'closed' : '<span class="' + (r.daysLeft <= 10 ? 'soon' : '') + '">' + r.daysLeft + ' d</span>') + '</span></span>' +
      '<span class="sr-only">' + (closed ? 'Closed' : 'score ' + r.score + ' of 100') + '</span></span></a>' +
      '<div class="tabs stage" role="radiogroup" aria-label="Stage">' + STAGES.map(function (s) {
        return '<button role="radio" aria-checked="' + (s === stage) + '" data-stage="' + s + '" data-id="' + t.id + '">' + s + '</button>';
      }).join('') + '</div></article>';
  }

  // ---------- 09 Company (the lever) ----------
  function company() {
    var p = S.profile, c = openCounts();
    var countries = p.countries.map(E.countryName).join(' and ');
    var certRows = D.CERT_OPTIONS.map(function (cert, i) {
      return '<div class="row"><div class="txt"><p class="row-label" id="cert-' + i + '">' + esc(cert) + '</p><p class="hint" data-hint="cert:' + esc(cert) + '"></p></div>' +
        '<button class="switch" role="switch" aria-checked="' + has(p.certifications, cert) + '" aria-labelledby="cert-' + i + '" data-cert="' + esc(cert) + '"></button></div>';
    }).join('');
    var langRows = LANG_OPTIONS.map(function (l, i) {
      return '<div class="row"><div class="txt"><p class="row-label" id="lang-' + i + '">' + esc(E.langName(l)) + '</p><p class="hint" data-hint="lang:' + l + '"></p></div>' +
        '<button class="switch" role="switch" aria-checked="' + has(p.languages, l) + '" aria-labelledby="lang-' + i + '" data-lang="' + l + '"></button></div>';
    }).join('');
    var html = '<div class="screen ' + (S.onboarded ? 'has-tabs' : 'has-bar') + '">' +
      navRow('<span class="spacer"></span>' + themeBtn() + infoBtn()) +
      '<header class="co-head">' +
        '<h1 class="screen-title" tabindex="-1">Company</h1>' +
        '<p class="sub">' + esc(p.name) + ' · ' + esc(p.city) + '</p>' +
        '<p class="label-text" style="margin-top:18px">Your feed right now</p>' + countsLine(c, true) +
      '</header>' +
      '<div id="rescore" aria-live="polite">' + rescoreCard(false) + '</div>' +
      '<div class="sec-h"><h2>Size</h2></div><div class="group">' +
        '<div class="row"><div class="txt"><p class="row-label"><label for="turnover">Turnover</label></p><p class="row-sub">Last full year, in € millions</p></div>' +
          '<label class="money-field" for="turnover"><span class="unit" aria-hidden="true">€</span><input id="turnover" data-field="turnover" inputmode="decimal" autocomplete="off" value="' + (p.turnover / 1e6) + '"><span class="unit" aria-hidden="true">M</span></label></div>' +
        '<div class="row"><div class="txt"><p class="row-label" id="lbl-ref">References</p><p class="row-sub">Comparable, last 3 years</p><p class="hint" data-hint="ref"></p></div>' +
          '<div class="stepper" role="group" aria-labelledby="lbl-ref"><button class="minus" data-ref="-1" aria-label="Fewer references">' + icon('remove') + '</button>' +
          '<output id="ref-out" aria-live="polite">' + p.references + '</output><button class="plus" data-ref="1" aria-label="More references">' + icon('add') + '</button></div></div>' +
      '</div>' +
      '<div class="sec-h"><h2>Certificates</h2></div><div class="group">' + certRows + '</div>' +
      '<div class="sec-h"><h2>Bid languages</h2></div><div class="group" role="group" aria-label="Bid languages">' + langRows + '</div>' +
      '<div class="sec-h"><h2>Where you bid</h2></div><div class="group">' +
        '<div class="row"><div class="txt"><p class="row-label" id="lbl-xb">Bid outside ' + esc(countries) + '</p><p class="hint" data-hint="xb"></p></div>' +
        '<button class="switch" role="switch" aria-checked="' + !!p.crossBorder + '" aria-labelledby="lbl-xb" data-act="xb"></button></div>' +
      '</div>' +
      '<p class="caption fiction">Re-scoring is plain rules, not AI. All companies and tenders are fictional.</p>' +
      '</div>' +
      (S.onboarded ? '' : '<div class="action-bar"><button class="btn btn-primary" data-act="finish">Save and see my feed</button></div>');
    return html;
  }
  function rescoreCard(enter) {
    var neutral = function (title, text) {
      return '<div class="rescore neutral' + (enter ? ' enter' : '') + '"><p class="rescore-buyer">' + esc(title) + '</p><p class="rescore-text">' + esc(text) + '</p></div>';
    };
    if (!lastChange) return neutral('Change anything below', 'Every tender re-scores at once.');
    var ch = lastChange.changes;
    if (!ch.length) return neutral('Re-scored ' + plural(D.TENDERS.length, 'tender') + '.', 'No verdict changed.');
    var c = ch[0], t = tender(c.tenderId), more = ch.length > 1 ? ' · +' + (ch.length - 1) + ' more' : '';
    // The score is the payoff (pass 5): "25 → 100" with the new score in the new verdict's colour, from Engine.diff.
    return '<div class="rescore' + (enter ? ' enter' : '') + '" data-rescore="' + c.tenderId + ':' + c.from + ':' + c.to + '">' +
      '<div class="rescore-top"><p class="rescore-buyer" aria-hidden="true">' + esc(bare(t.buyer)) + '</p>' +
        '<p class="rescore-score" aria-hidden="true"><span class="from">' + c.fromScore + '</span><span class="arrow">→</span><b class="to v-' + c.to + '" data-from="' + c.fromScore + '">' + c.toScore + '</b></p></div>' +
      '<p class="change-row" aria-hidden="true">' + status(c.from, V[c.from]) + '<span class="arrow">→</span>' + status(c.to, V[c.to]) + '<span>just now' + esc(more) + '</span></p>' +
      '<p class="sr-only">' + esc(bare(t.buyer)) + ': ' + V[c.from] + ' → ' + V[c.to] + ', score ' + c.fromScore + ' → ' + c.toScore + esc(more) + '</p></div>';
  }
  // Unlock hints: "Turn on → Gemeente Vlietdam becomes Maybe". Computed by Engine.whatIf (no state change).
  function hintText(changes, lead, verb) {
    var c = changes[0];
    return esc(lead + ' → ' + bare(tender(c.tenderId).buyer) + ' ' + verb + ' ') + status(c.to, V[c.to]) + (changes.length > 1 ? esc(' +' + (changes.length - 1) + ' more') : '');
  }
  function whatIf(patch) {
    return E.whatIf(D.TENDERS, S.profile, TODAY, S.overrides, patch).filter(function (c) { return !S.skipped[c.tenderId]; });
  }
  function ups(list) { return list.filter(function (c) { return c.direction === 'up'; }); }
  function unlockedHint(lever) {
    if (!lastChange || lastChange.lever !== lever) return null;
    var u = ups(lastChange.changes); if (!u.length) return null;
    var c = u[0], name = bare(tender(c.tenderId).buyer);
    return { ok: true, text: esc(c.to === 'go' ? 'Unlocked ' + name + ' · ' : name + ' moved up to ') + status(c.to, V[c.to]) + (u.length > 1 ? esc(' +' + (u.length - 1) + ' more') : '') };
  }
  function hints() {
    var p = S.profile, out = {};
    D.CERT_OPTIONS.forEach(function (cert) {
      var on = has(p.certifications, cert), key = 'cert:' + cert;
      var next = p.certifications.slice(); toggle(next, cert);
      var ch = whatIf({ certifications: next });
      out[key] = unlockedHint(key) ||
        (!on && ups(ch).length ? { text: hintText(ups(ch), 'Turn on', 'becomes') } :
         on && ch.length ? { down: true, text: hintText(ch, 'Turn off', 'drops to') } : null);
    });
    var ref = whatIf({ references: p.references + 1 });
    out.ref = unlockedHint('ref') || (ups(ref).length ? { text: hintText(ups(ref), '+1 reference', 'becomes') } : null);
    LANG_OPTIONS.forEach(function (l) { // each language's hint sits on its own row (pass 5; it used to sit under German)
      var key = 'lang:' + l, u = has(p.languages, l) ? [] : ups(whatIf({ languages: p.languages.concat([l]) }));
      out[key] = unlockedHint(key) || (u.length ? { text: hintText(u, 'Turn on', 'becomes') } : null);
    });
    var xb = whatIf({ crossBorder: !p.crossBorder });
    out.xb = unlockedHint('xb') || (p.crossBorder ? (xb.length ? { down: true, text: hintText(xb, 'Turn off', 'drops to') } : null)
      : (ups(xb).length ? { text: hintText(ups(xb), 'Turn on', 'becomes') } : null));
    return out;
  }
  function paintHints() {
    var h = hints();
    Array.prototype.forEach.call($screen.querySelectorAll('[data-hint]'), function (el) {
      var x = h[el.getAttribute('data-hint')];
      el.className = 'hint' + (x && x.ok ? ' ok' : x && x.down ? ' down' : '');
      el.innerHTML = x ? x.text : ''; // escaped in hintText / unlockedHint; the verdict is shape + word
      el.hidden = !x;
    });
  }
  // Apply a profile change and re-score live, without re-rendering (so switches and counts animate).
  function applyLever(lever, mutate, fromEl) {
    var before = E.verdicts(D.TENDERS, S.profile, TODAY, S.overrides);
    mutate(S.profile); save();
    var changes = E.diff(before, E.verdicts(D.TENDERS, S.profile, TODAY, S.overrides)).filter(function (c) { return !S.skipped[c.tenderId]; });
    lastChange = { lever: lever, changes: changes };
    changes.forEach(function (c) { pulse[c.tenderId] = true; });
    haptic('light');
    if (changes.length) setTimeout(function () { haptic(changes[0].direction === 'up' ? 'success' : 'warning'); }, 60);
    if (parse().name !== 'company') { render(true); return; }
    var p = S.profile;
    Array.prototype.forEach.call($screen.querySelectorAll('[data-cert]'), function (el) { el.setAttribute('aria-checked', has(p.certifications, el.getAttribute('data-cert'))); });
    Array.prototype.forEach.call($screen.querySelectorAll('[data-lang]'), function (el) { el.setAttribute('aria-checked', has(p.languages, el.getAttribute('data-lang'))); });
    var xb = $screen.querySelector('[data-act="xb"]'); if (xb) xb.setAttribute('aria-checked', !!p.crossBorder);
    var out = document.getElementById('ref-out'); if (out) out.textContent = p.references;
    var to = document.getElementById('turnover'); if (to && document.activeElement !== to) to.value = p.turnover / 1e6;
    var c = openCounts();
    setTimeout(function () {
      Array.prototype.forEach.call($screen.querySelectorAll('[data-tile]'), function (el) {
        var v = el.getAttribute('data-tile'), b = el.querySelector('b'), from = +b.textContent;
        countUp(b, from, c[v]);
      });
      var line = document.getElementById('co-tiles'); if (line) line.setAttribute('aria-label', 'Your feed right now: ' + c.go + ' Go, ' + c.maybe + ' Maybe, ' + c.nogo + ' No-go');
      mountRescore(fromEl);
    }, reduceMotion ? 0 : 60);
    paintHints();
  }
  // Re-score card = one object changing shape (design/MOTION.md rule 2): the card grows out of the control that changed
  // (FLIP, 700 ms --ease-morph) while its contents fade in over the second half, and a faint dashed ghost stays on the
  // control. Plain pop (480 ms easeOutBack) when the card is off-screen, when the Web Animations API is missing, or under
  // prefers-reduced-motion.
  var EASE_MORPH = 'cubic-bezier(.77,0,.18,1)';
  function mountRescore(fromEl) {
    var rs = document.getElementById('rescore'); if (!rs) return;
    rs.innerHTML = rescoreCard(true);
    var card = rs.firstElementChild;
    var to = card && card.querySelector('.rescore-score .to');
    if (to) { var target = +to.textContent; to.textContent = to.getAttribute('data-from'); setTimeout(function () { countUp(to, +to.getAttribute('data-from'), target); }, reduceMotion ? 0 : 315); }
    if (!card || !fromEl) return;
    var a = fromEl.getBoundingClientRect(), b = card.getBoundingClientRect();
    // Short screens (iPhone 13 / SE): the card can sit just above the fold when the switch is tapped. Bring it back in
    // (an instant scroll, at most one screen) so the re-score is seen; further away, the hint next to the control tells.
    if (b.bottom < 0 && b.top > -window.innerHeight) { // up to one screen (it was 0.6: on iPhone SE the card sat at −342 of −341 px, pass 5)
      window.scrollBy(0, b.top - 12);
      a = fromEl.getBoundingClientRect(); b = card.getBoundingClientRect();
    }
    if (reduceMotion || typeof card.animate !== 'function') return;
    if (!a.width || !a.height || !b.width || b.bottom < 0 || b.top > window.innerHeight || a.bottom < 0 || a.top > window.innerHeight) return; // card or control off-screen: keep the pop
    card.classList.remove('enter'); card.classList.add('morph');
    var sx = a.width / b.width, sy = a.height / b.height;
    var r = parseFloat(getComputedStyle(fromEl).borderTopLeftRadius) || 8;
    card.style.transformOrigin = '0 0';
    card.animate([
      { transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + sx + ',' + sy + ')', borderRadius: (r / sx) + 'px / ' + (r / sy) + 'px' },
      { transform: 'none', borderRadius: '8px' }
    ], { duration: 700, easing: EASE_MORPH, fill: 'both' });
    Array.prototype.forEach.call(card.children, function (ch) {
      ch.animate([{ opacity: 0 }, { opacity: 0, offset: .45 }, { opacity: 1 }], { duration: 700, easing: 'ease-out', fill: 'both' });
    });
    ghostAt(a, r);
  }
  function ghostAt(rect, radius) {
    var g = document.createElement('span');
    g.className = 'morph-ghost'; g.setAttribute('aria-hidden', 'true');
    g.style.cssText = 'left:' + rect.left + 'px;top:' + rect.top + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;border-radius:' + radius + 'px';
    document.body.appendChild(g);
    var remove = function () { if (g.parentNode) g.parentNode.removeChild(g); };
    if (typeof g.animate === 'function') g.animate([{ opacity: .7 }, { opacity: 0 }], { duration: 700, easing: 'ease-out', fill: 'forwards' }).onfinish = remove;
    setTimeout(remove, 900);
  }
  // Count-up timing is shared with the website's PhoneDemo: --dur-rescore-count-up (650 ms) with easeOutCubic.
  var COUNT_MS = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dur-rescore-count-up'), 10) || 650;
  var PAGES_MS = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dur-pages-count-up'), 10) || 2800; // the site's 777 counter
  function countUp(el, from, to, ms) {
    if (reduceMotion || from === to) { el.textContent = to; return; }
    var t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / (ms || COUNT_MS));
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  // ---------- 10 Settings (the 4th tab; was About, reachable from the header ⓘ and #/about) ----------
  function settings() {
    var seg = function (k, label) { return '<button role="radio" aria-checked="' + (S.theme === k) + '" data-act="theme" data-value="' + k + '">' + label + '</button>'; };
    var row = function (title, text, extra) {
      return '<div class="about-row"><h3>' + title + (extra || '') + '</h3><p>' + text + '</p></div>';
    };
    // Before onboarding there is no tab bar, so the screen keeps its Back button; after it, it is a tab like the others.
    return '<div class="screen' + (S.onboarded ? ' has-tabs' : '') + '">' +
      (S.onboarded ? navRow() : '<div class="nav back-nav">' + backBtn() + '</div>') +
      '<div class="about-intro"><h1 class="screen-title" tabindex="-1">Settings</h1></div>' +
      '<div class="sec-h"><h2>Appearance</h2></div><div class="group theme-row">' +
        '<p class="label-text" id="lbl-theme">Light or dark</p><div class="tabs" role="radiogroup" aria-labelledby="lbl-theme">' + seg('system', 'System') + seg('light', 'Light') + seg('dark', 'Dark') + '</div></div>' +
      '<div class="sec-h"><h2>Morning notification</h2></div><div class="group notify-row">' +
        '<p>Once a day, after the overnight read, TenderScout tells you how many new tenders you qualify for. In this prototype it is shown inside the app, not sent to your phone.</p>' +
        '<button class="btn btn-secondary btn-block" data-act="morning">Show this morning’s notification</button></div>' +
      '<div class="sec-h"><h2>Demo</h2></div>' +
      '<div class="about-actions settings-demo"><button class="btn btn-secondary btn-danger btn-block" data-act="reset">Reset demo</button>' +
      '<p class="caption">Clears your profile, answers, saved and skipped tenders.</p></div>' +
      // the test-session log: the same pattern as the morning notification (text, then its one action), apart from Reset
      '<div class="group notify-row log-row"><p>' + esc(I.LOG_CAPTION) + '</p>' +
        '<button class="btn btn-secondary btn-block" data-act="copy-log">Copy test-session log</button>' +
        (logText !== null ? '<label class="sr-only" for="log-text">Test-session log</label><textarea id="log-text" class="log-text" readonly rows="12">' + esc(logText) + '</textarea>' : '') +
      '</div>' +
      '<div class="sec-h"><h2>About this prototype</h2></div>' +
      '<div class="about-intro"><p>A university prototype (ESCP Digital Product Design, 2026). TenderScout is a working name.</p></div>' +
      '<div class="group" style="margin-top:12px">' +
        row('AI output is simulated', 'Reading tenders, translating, answering questions and drafting your profile are played back from pre-written output. No model is called, there are no keys, and no data leaves your phone.', ai()) +
        row('The decision logic is real code', 'The qualification check, score and Go / Maybe / No-go verdict run live in tested rules, not in the AI.') +
        row('All data is fictional', 'Every company, buyer, tender, page number and quote is invented. None of it is interview evidence.') +
        row('Built with AI assistance', 'Claude (Anthropic) helped build the prototype. The team ran the interviews and made the product decisions.') +
      '</div>' +
      '</div>';
  }
  function notFound() {
    return '<div class="screen"><div class="nav back-nav">' + backBtn() + '</div>' +
      '<h1 class="sr-only" tabindex="-1">Not found</h1>' +
      emptyState('Page not found', 'That link matches no screen in TenderScout.', '<button class="btn btn-primary" data-go="#/feed">Open Feed</button>') + '</div>';
  }

  // ---------- morning notification (simulated) ----------
  // Once a day, after the overnight read, a lock-screen notification gives the day's counts: Go (you qualify),
  // Maybe (something small is missing) and No-go (you don't qualify). Counts come from engine.js through openCounts().
  // Simulated: shown inside the app as a lock screen; no push, no service worker, nothing leaves the phone.
  var LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var NOTIFY_TIME = '7:00';   // the notification goes out once the overnight read is done
  var notifyShown = false, notifyFocus = null;
  function longDate(iso) { var d = new Date(iso + 'T00:00:00Z'); return LONG_DAYS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]; }
  function morningHTML() {
    var c = openCounts(), n = c.go + c.maybe + c.nogo;
    var item = function (v, label) { return '<span class="n-count v-' + v + '">' + shape(SHAPE[v]) + c[v] + ' ' + label + '</span>'; };
    var spoken = 'TenderScout, now. ' + plural(n, 'new tender') + ' read overnight: ' + c.go + ' you qualify for (Go), ' +
      c.maybe + ' missing something small (Maybe), ' + c.nogo + ' you don’t qualify for (No-go). Open the Feed.';
    return '<div class="lockscreen" role="dialog" aria-modal="true" aria-labelledby="ls-time" data-act="notify-close">' +
      '<div class="ls-top" data-stop><p class="ls-sim">Simulated notification</p>' +
        '<button class="icon-btn ls-close" data-act="notify-close" aria-label="Close notification">' + icon('close', 's22') + '</button></div>' +
      '<div class="ls-clock" data-stop><p class="ls-date">' + esc(longDate(TODAY)) + '</p><p class="ls-time" id="ls-time" tabindex="-1" aria-label="' + esc(longDate(TODAY)) + ', ' + NOTIFY_TIME + '">' + NOTIFY_TIME + '</p></div>' +
      '<button class="notif" data-act="notify-open" aria-label="' + esc(spoken) + '">' +
        '<span class="notif-icon" aria-hidden="true">' + icon('radar', 's24') + '</span>' +
        '<span class="notif-body" aria-hidden="true"><span class="notif-head"><b>TenderScout</b><span class="notif-when">now</span></span>' +
          '<span class="notif-counts">' + item('go', 'Go') + item('maybe', 'Maybe') + item('nogo', 'No-go') + '</span></span>' +
      '</button>' +
      '<p class="caption ls-foot" data-stop>Tap the notification to open your Feed · all tenders are fictional</p>' +
    '</div>';
  }
  function showMorning() {
    if (notifyShown) return;
    notifyShown = true;
    S.notifiedOn = TODAY; save();
    notifyFocus = document.activeElement;
    $notify.innerHTML = morningHTML(); $notify.hidden = false;
    $screen.inert = true; $tabs.inert = true; $sheet.inert = true;
    document.documentElement.classList.add('sheet-open');
    void $notify.offsetHeight;
    $notify.classList.add('open');
    var t = document.getElementById('ls-time'); if (t) t.focus({ preventScroll: true });
  }
  function hideMorning(then) {
    if (!notifyShown) return;
    notifyShown = false;
    $notify.classList.remove('open'); $notify.hidden = true; $notify.innerHTML = '';
    $screen.inert = false; $tabs.inert = false; $sheet.inert = false;
    if (!sheetKey) document.documentElement.classList.remove('sheet-open');
    if (then) { then(); return; }
    if (notifyFocus && document.body.contains(notifyFocus)) notifyFocus.focus({ preventScroll: true });
    notifyFocus = null;
  }
  // Due once per day: onboarded, on the Feed, and not yet shown today. Not with the test-only ?today= (Closed state checks).
  function morningDue(r) { return S.onboarded && r.name === 'feed' && S.notifiedOn !== TODAY && !params.get('today'); }

  // ---------- router ----------
  function parse() {
    var h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!h.length) return { name: S.onboarded ? 'feed' : 'onb', step: 1 };
    if (h[0] === 'welcome') return { name: 'onb', step: +(h[1] || 1) };
    if (h[0] === 't' && h[1]) {
      if (h[2] === 'req' && h[3]) return { name: 'detail', id: h[1], sub: { kind: 'req', id: h[3] } };
      if (h[2] === 'skip') return { name: 'detail', id: h[1], sub: { kind: 'skip' } };
      if (h.length === 2) return { name: 'detail', id: h[1] };
      return { name: 'notfound' };
    }
    if (h.length === 1 && (h[0] === 'about' || h[0] === 'settings')) return { name: 'settings' }; // #/about stays a working deep link
    if (h.length === 1 && ['feed', 'bids', 'company', 'profile', 'insights'].indexOf(h[0]) !== -1) return { name: h[0] };
    return { name: 'notfound' };
  }
  // History bookkeeping, so in-app Back, sheet close and Skip go *back* instead of stacking new entries.
  var stack = [location.hash || '#/'], replacing = false, pendingPops = 0, wasPop = false;
  function go(hash) { if (location.hash === hash) render(true); else location.hash = hash; }
  function replaceTo(hash) { if (location.hash === hash) { render(true); return; } replacing = true; location.replace(hash); }
  function backTo(target, maxSteps) {
    for (var i = 1; i <= maxSteps && i < stack.length; i++) {
      if (stack[stack.length - 1 - i] === target) { pendingPops = i; history.go(-i); return true; }
    }
    replaceTo(target); return false;
  }
  window.addEventListener('hashchange', function () {
    var h = location.hash || '#/';
    wasPop = false;
    if (pendingPops) { stack.length = Math.max(1, stack.length - pendingPops); stack[stack.length - 1] = h; pendingPops = 0; wasPop = true; }
    else if (replacing) { stack[stack.length - 1] = h; replacing = false; }
    else if (stack.length > 1 && stack[stack.length - 2] === h) { stack.pop(); wasPop = true; }
    else stack.push(h);
    render();
  });
  function back() {
    var r = parse(), prev = stack[stack.length - 2];
    if (r.name === 'detail') { if (prev === '#/feed' || prev === '#/bids') backTo(prev, 1); else replaceTo('#/feed'); return; }
    if (r.name === 'onb' && r.step === 3) { backTo('#/welcome/1', 1); return; }
    if (r.name === 'insights') { if (prev === '#/bids') backTo('#/bids', 1); else replaceTo('#/bids'); return; } // a page of Bids
    if (stack.length > 1) { pendingPops = 1; history.back(); return; }
    replaceTo(S.onboarded ? '#/feed' : '#/welcome/1');
  }
  function closeSheet() { var r = parse(); if (r.sub) backTo('#/t/' + r.id, 1); }

  var curKey = null, scrollPos = {}, firstRender = true;
  // One key per screen: a tender's sheets share its key, so a toast raised in a sheet stays on the tender it closes to.
  function screenKey(r) { return r.name === 'detail' ? 'detail:' + r.id : r.name + (r.step ? ':' + r.step : ''); }
  function render(force) {
    if (crashed) return; // the error screen stays until Restart
    var r = parse();
    if (!S.onboarded && ['onb', 'company', 'settings'].indexOf(r.name) === -1) { replaceTo('#/welcome/1'); return; }
    var key = screenKey(r);
    var isNew = key !== curKey;
    // A toast belongs to the screen that raised it (pass 5): leaving that screen removes it at once, so an Undo can never
    // sit over a control on the next screen (the ISO 27001 switch in demo step 5, Restore on Bids).
    if (isNew && toastScope && toastScope !== key) hideToast(true);
    if (force || dirty || isNew) {
      if (curKey && isNew) scrollPos[curKey] = window.scrollY;
      var html;
      switch (r.name) {
        case 'onb': html = r.step === 2 ? readingScreen() : r.step === 3 ? checkProfile() : welcome(); break;
        case 'feed': html = feed(); break;
        case 'detail': html = detail(r.id); break;
        case 'bids': html = bids(); break;
        case 'insights': html = insightsScreen(); break;
        case 'company': html = company(); break;
        case 'profile': html = profile(); break;
        case 'settings': html = settings(); break;
        default: html = notFound();
      }
      var top = wasPop && scrollPos[key] ? scrollPos[key] : 0;
      // One-shot entrances: only when a new screen opens at the top. Same-screen re-renders and returns to a remembered
      // scroll position don't replay them (cards would sit invisible during their stagger).
      $screen.classList.toggle('entering', isNew && top === 0);
      $screen.innerHTML = html;
      dirty = false; curKey = key;
      var tabbed = S.onboarded && ['feed', 'bids', 'company', 'profile', 'settings', 'insights'].indexOf(r.name) !== -1;
      setTabs(tabbed ? (r.name === 'insights' ? 'bids' : r.name) : null); // Win/loss insights is a page of Bids
      $toast.style.setProperty('--toast-offset', (tabbed ? 76 : $screen.querySelector('.action-bar') ? 96 : 24) + 'px');
      if (isNew) {
        window.scrollTo(0, top);
        var h1 = $screen.querySelector('h1');
        if (h1 && !firstRender && !r.sub) h1.focus({ preventScroll: true });
      }
      afterRender(r);
    }
    logScreen(r);
    syncSheet(r);
    if (morningDue(r)) showMorning();
    var h1t = $screen.querySelector('h1');
    document.title = (h1t ? h1t.textContent + ' · ' : '') + 'TenderScout';
    firstRender = false;
  }
  function afterRender(r) {
    if (r.name === 'onb' && r.step === 2) startDraft();
    if ($screen.classList.contains('entering')) { // the 777 counter: the pages line counts up once per Feed load
      Array.prototype.forEach.call($screen.querySelectorAll('.count-up'), function (el) { countUp(el, 0, +el.getAttribute('data-n'), PAGES_MS); });
    }
    if (r.name === 'company') paintHints();
    if (r.name === 'feed' && collapseId) {
      var w = $screen.querySelector('.tcard-wrap[data-id="' + collapseId + '"]'); collapseId = null;
      if (w) requestAnimationFrame(function () { w.classList.add('collapsing'); setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, reduceMotion ? 0 : 260); });
    }
    enteringId = null;
    paintThemeColor();
  }

  // ---------- bottom sheets ----------
  var sheetKey = null, sheetTimer = null, lastFocus = null;
  function syncSheet(r) {
    var want = r.sub ? r.id + ':' + r.sub.kind + ':' + (r.sub.id || '') : null;
    if (!want) { if (sheetKey) hideSheet(); return; }
    if (want === sheetKey) return;
    var t = tender(r.id);
    var html = t ? (r.sub.kind === 'req' ? reqSheet(t, r.sub.id) : skipSheet(t)) : null;
    if (!html) { replaceTo(t ? '#/t/' + r.id : '#/feed'); return; }
    hideToast(true); // a sheet is modal: a toast raised on the screen behind it goes (its Undo would act outside the sheet)
    clearTimeout(sheetTimer);
    if (!sheetKey) lastFocus = document.activeElement;
    sheetKey = want;
    $sheet.innerHTML = html; $sheet.hidden = false;
    $screen.inert = true; $tabs.inert = true;
    document.documentElement.classList.add('sheet-open');
    void $sheet.offsetHeight; // start the slide-in from the off-screen position
    $sheet.classList.add('open');
    var title = document.getElementById('sheet-title'); if (title) title.focus({ preventScroll: true });
  }
  function hideSheet() {
    sheetKey = null;
    $sheet.classList.remove('open');
    $screen.inert = false; $tabs.inert = false;
    document.documentElement.classList.remove('sheet-open');
    clearTimeout(sheetTimer);
    sheetTimer = setTimeout(function () { $sheet.hidden = true; $sheet.innerHTML = ''; }, reduceMotion ? 0 : 330);
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    else { var h1 = $screen.querySelector('h1'); if (h1) h1.focus({ preventScroll: true }); }
    lastFocus = null;
  }

  // ---------- toast ----------
  var toastTimer = null, toastFn = null, toastScope = null;
  // scope: the screen key the toast belongs to (default: the screen showing now; Skip passes 'feed', where it lands).
  function toast(msg, action, scope) {
    clearTimeout(toastTimer);
    toastFn = action ? action.fn : null;
    toastScope = scope || curKey;
    $toast.innerHTML = '<div class="toast"><span class="msg">' + esc(msg) + '</span>' +
      (action ? '<button type="button" data-act="toast-action">' + esc(action.label) + '</button>' : '') + '</div>';
    var el = $toast.firstChild;
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
    toastTimer = setTimeout(hideToast, 4000);
  }
  function hideToast(now) {
    clearTimeout(toastTimer); toastScope = null; toastFn = null;
    var el = $toast.firstChild; if (!el) return;
    if (now) { $toast.removeChild(el); return; } // the screen changed: gone at once, no fade over the new screen
    el.classList.remove('show');
    setTimeout(function () { if (el.parentNode === $toast) $toast.removeChild(el); }, reduceMotion ? 0 : 250);
  }

  // ---------- actions ----------
  function answer(tid, rid, val) {
    S.overrides[tid] = S.overrides[tid] || {};
    var prev = S.overrides[tid][rid];
    if (val === 'clear') delete S.overrides[tid][rid]; else S.overrides[tid][rid] = val;
    logEvent('answer', tid, { r: rid, v: val });
    var now = evalT(tender(tid)).verdict;
    closeSheet();
    toast(val === 'clear' ? 'Answer removed · now ' + V[now] : 'Answer saved · now ' + V[now], { label: 'Undo', fn: function () {
      S.overrides[tid] = S.overrides[tid] || {};
      if (prev) S.overrides[tid][rid] = prev; else delete S.overrides[tid][rid];
      logEvent('answer', tid, { r: rid, v: prev || 'clear' }); render(true);
    } });
  }
  function skipConfirm(id) {
    var reasons = (skipDraft[id] || []).slice(), prevSaved = S.saved[id];
    S.skipped[id] = { reasons: reasons, at: TODAY }; delete S.saved[id]; logEvent('skip', id);
    skipDraft[id] = [];
    collapseId = id;
    backTo('#/feed', 2);
    toast(reasons.length ? 'Skipped. Reason saved.' : 'Skipped.', { label: 'Undo', fn: function () {
      delete S.skipped[id]; if (prevSaved) S.saved[id] = prevSaved; logEvent('undo', id, { d: !!prevSaved }); render(true);
    } }, 'feed');
  }
  function restore(id) {
    delete S.skipped[id]; S.saved[id] = 'Deciding'; enteringId = id; logEvent('restore', id); render(true);
    toast('Restored to Deciding');
  }
  function setStage(id, stage) {
    if (S.saved[id] === stage) return;
    S.saved[id] = stage; enteringId = id; save(); haptic('select'); render(true);
  }

  // ---------- error fallback (5 Nov 2026) ----------
  // An uncaught error or an unhandled rejection replaces the screen with one plain message and a Restart button; the
  // error itself goes to the console. Restart reloads the app on its home route. tenderscout.v2 is not touched, so the
  // profile, answers, saved and skipped tenders survive.
  var crashed = false;
  function crash(err) {
    try { console.error('TenderScout: unexpected error', err); } catch (e1) { /* no console */ }
    if (crashed) return;
    crashed = true;
    try {
      clearTimeout(sheetTimer); sheetKey = null;
      $sheet.classList.remove('open'); $sheet.hidden = true; $sheet.innerHTML = '';
      document.documentElement.classList.remove('sheet-open');
      $screen.inert = false; $tabs.inert = false; $tabs.innerHTML = ''; $toast.innerHTML = '';
      $screen.className = '';
      $screen.innerHTML = '<div class="screen">' + navRow() +
        emptyState('Something went wrong', 'Your profile, answers and saved tenders are kept.',
          '<button class="btn btn-primary" data-act="restart">Restart</button>') + '</div>';
      document.title = 'TenderScout';
    } catch (e2) { /* the DOM itself is broken; the handler below still restarts */ }
  }
  function restart() {
    var home = S.onboarded ? '#/feed' : '#/welcome/1';
    location.replace(location.pathname + location.search + home);
    location.reload();
  }
  window.addEventListener('error', function (e) { crash(e && (e.error || e.message)); });
  window.addEventListener('unhandledrejection', function (e) { crash(e && e.reason); });

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go],[data-act],[data-filter],[data-confirm],[data-ask],[data-skip],[data-stage],[data-unskip],[data-cert],[data-lang],[data-ref]');
    if (!el) return;
    var d = el.dataset;
    if (d.act === 'notify-close' && el.classList.contains('lockscreen') && e.target.closest('[data-stop],.notif')) return; // a tap on the clock or caption keeps it open
    if (d.act === 'close-sheet') { var stop = e.target.closest('[data-stop]'); if (stop && el.contains(stop)) return; } // click inside the sheet
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (d.go) { e.preventDefault(); go(d.go); return; }
    if (d.filter) { S.filter = d.filter; save(); render(true); return; }
    if (d.confirm) { answer(d.t, d.r, d.confirm); return; }
    if (d.ask != null) { toggleAsk(+d.ask); return; }
    if (d.skip) {
      var sel = skipDraft[d.id] || (skipDraft[d.id] = []);
      toggle(sel, d.skip);
      el.setAttribute('aria-pressed', has(sel, d.skip));
      return;
    }
    if (d.stage) { setStage(d.id, d.stage); return; }
    if (d.unskip) { restore(d.unskip); return; }
    if (d.cert) { applyLever('cert:' + d.cert, function (p) { toggle(p.certifications, d.cert); }, el); return; }
    if (d.lang) { applyLever('lang:' + d.lang, function (p) { toggle(p.languages, d.lang); }, el); return; }
    if (d.ref) { if (S.profile.references + (+d.ref) < 0) return; applyLever('ref', function (p) { p.references = p.references + (+d.ref); }, el.closest('.stepper') || el); return; }
    switch (d.act) {
      case 'back': back(); break;
      case 'restart': restart(); break;
      case 'draft': draft(); break;
      case 'finish': S.onboarded = true; save(); go('#/feed'); break;
      case 'save':
        S.saved[d.id] = 'Deciding'; delete S.skipped[d.id]; logEvent('save', d.id); render(true);
        toast('Saved to Bids', { label: 'View', fn: function () { go('#/bids'); } });
        break;
      case 'xb': applyLever('xb', function (p) { p.crossBorder = !p.crossBorder; }, el); break;
      case 'close-sheet': closeSheet(); break;
      case 'morning': notifyShown = false; showMorning(); break;
      case 'copy-log': copyLog(); break;
      case 'notify-close': hideMorning(); break;
      case 'notify-open': hideMorning(function () { S.filter = 'all'; save(); if (parse().name === 'feed') render(true); else go('#/feed'); }); break;
      case 'skip-confirm': skipConfirm(d.id); break;
      case 'toast-action': var fn = toastFn; hideToast(); if (fn) fn(); break;
      case 'theme': S.theme = d.value; save(); applyTheme(); render(true); break;
      case 'theme-toggle': S.theme = effectiveScheme() === 'dark' ? 'light' : 'dark'; save(); applyTheme(); haptic('select'); render(true); break;
      case 'reset':
        if (!window.confirm('Reset the demo? This clears your profile, answers, saved and skipped tenders.')) break;
        S = fresh(); readCache = {}; answers = {}; openAsk = null; skipDraft = {}; lastChange = null; pulse = {}; logged = {}; logText = null;
        save(); applyTheme(); stack = [location.hash]; replaceTo('#/welcome/1');
        break;
    }
  });
  // Card → detail morph: the tapped card's shape grows into the verdict header while its contents cross-fade, and a
  // dashed ghost stays where the card was. View Transitions API with feature detection; without it (or under reduced
  // motion) the link is a plain hash change.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.tcard');
    if (!a || !document.startViewTransition || reduceMotion || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var href = a.getAttribute('href');
    e.preventDefault();
    a.style.viewTransitionName = 'card';
    var wrap = a.closest('.tcard-wrap'); if (wrap) wrap.style.viewTransitionName = 'card-ghost';
    try {
      var vt = document.startViewTransition(function () { location.hash = href; render(); });
      // A transition can abort (Safari and mobile browsers when the viewport changes mid-way); the navigation is already
      // done by then, so the abort only means "no morph this time". Swallow the rejections so they never surface as errors.
      ['ready', 'finished', 'updateCallbackDone'].forEach(function (k) { if (vt && vt[k] && vt[k].catch) vt[k].catch(function () {}); });
    } catch (err) { go(href); }
  }, true);
  function draft() {
    var web = document.getElementById('web');
    S.website = (web && web.value.trim()) || 'nordlicht-netzwerk.example'; save();
    go('#/welcome/2');
  }
  document.addEventListener('submit', function (e) { if (e.target.id === 'welcome-form') { e.preventDefault(); draft(); } });
  document.addEventListener('change', function (e) {
    if (e.target.dataset.field === 'turnover') {
      var v = parseFloat(String(e.target.value).replace(',', '.'));
      if (!isFinite(v) || v < 0) { e.target.value = S.profile.turnover / 1e6; return; }
      applyLever('turnover', function (p) { p.turnover = Math.round(v * 1e6); }, e.target.closest('.money-field') || e.target);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && notifyShown) { e.preventDefault(); hideMorning(); return; }
    if (e.key === 'Escape' && sheetKey) { e.preventDefault(); closeSheet(); return; }
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.field === 'turnover') { e.target.blur(); return; }
    // Arrow keys move between options in radio groups (filter, stage, appearance)
    var radio = e.target.closest && e.target.closest('[role="radio"]');
    if (radio && /^Arrow(Left|Right|Up|Down)$/.test(e.key)) {
      var all = Array.prototype.slice.call(radio.parentNode.querySelectorAll('[role="radio"]:not([disabled])'));
      var i = all.indexOf(radio) + (/Right|Down/.test(e.key) ? 1 : -1);
      var next = all[(i + all.length) % all.length], nd = next.dataset;
      var sel = nd.filter ? '[role="radio"][data-filter="' + nd.filter + '"]'
        : nd.stage ? '[data-stage="' + nd.stage + '"][data-id="' + nd.id + '"]'
        : '[data-act="' + nd.act + '"][data-value="' + nd.value + '"]';
      e.preventDefault(); next.click();
      var again = document.querySelector(sel); if (again) again.focus(); // the group re-renders; keep focus on the new choice
    }
  });
  window.addEventListener('online', function () { render(true); });
  window.addEventListener('offline', function () { render(true); });

  // Theme (light / dark / system) lives on <html> as data-scheme (shared/tokens.json).
  var darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function effectiveScheme() { return S.theme === 'light' || S.theme === 'dark' ? S.theme : (darkMQ && darkMQ.matches ? 'dark' : 'light'); }
  function applyTheme() {
    document.documentElement.setAttribute('data-scheme', effectiveScheme());
    paintThemeColor();
  }
  function paintThemeColor() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim() || getComputedStyle(document.body).backgroundColor);
  }
  if (darkMQ) { var onMQ = function () { if (S.theme !== 'light' && S.theme !== 'dark') applyTheme(); }; if (darkMQ.addEventListener) darkMQ.addEventListener('change', onMQ); else if (darkMQ.addListener) darkMQ.addListener(onMQ); }
  applyTheme();
  render();
})();
