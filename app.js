/* TenderScout prototype — UI + hash router. Depends on engine.js, data.js, ai.js.
 * Visual design: DESIGN.md ("Bold", v2.0) restyled 2 Nov 2026; the marketing website's language (shared/tokens.json,
 * the PhoneDemo dock, glow + grain ground, mono eyebrows, two-tone headlines) applied 3 Nov 2026.
 * engine.js decides every verdict; this file only renders and stores state. */
(function () {
  'use strict';
  var E = window.Engine, D = window.DEMO, AI = window.AI;
  var KEY = 'tenderscout.v2';          // v2: skipped = { id: { reasons: [], at } }, plus theme and palette ('brand' | 'sky' | 'harbor')
  var PALETTES = ['brand', 'sky', 'harbor']; // Brand (default) = the website's palette; Sky and Harbor = design/HANDOFF_V2.md
  var STAGES = ['Deciding', 'Bidding', 'Submitted'];
  var SKIP_REASONS = ['Too big for us', 'Missing a certificate', 'Wrong region', 'Not enough time', 'Price-only', 'Other'];
  var LANG_OPTIONS = ['de', 'en', 'es', 'fr', 'nl'];
  var V = E.VERDICT_LABEL;             // go → 'Go', maybe → 'Maybe', nogo → 'No-go', closed → 'Closed'
  var SHAPE = { go: 'circle', maybe: 'tri', nogo: 'square' };
  // Requirement status → DESIGN.md palette, shape and label. UI only: engine.js keeps pass/risk/fail/review.
  var STATUS = {
    fail:   { v: 'nogo',  shape: 'square',  label: 'Fails',            icon: 'cancel' },
    review: { v: 'check', shape: 'diamond', label: 'Needs your check', icon: 'help' },
    risk:   { v: 'maybe', shape: 'tri',     label: 'Risk',             icon: 'warning' },
    pass:   { v: 'go',    shape: 'circle',  label: 'Meets',            icon: 'check_circle' }
  };
  var ORDER = { fail: 0, review: 1, risk: 2, pass: 3 };   // detail list: fail → check → risk → met
  var KIND = { min_turnover: 'Turnover', certification: 'Certificate', min_references: 'References', language: 'Bid language', region: 'Place of work', site_visit: 'Site visit', other: 'Unclear wording' };
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ---------- URL parameters (demo and test only) ----------
  var params = new URLSearchParams(location.search);
  var TODAY = /^\d{4}-\d{2}-\d{2}$/.test(params.get('today') || '') ? params.get('today') : D.DEMO_TODAY; // ?today= test-only
  var forceOffline = params.get('offline') === '1';
  var paletteParam = params.get('palette');   // ?palette=brand|sky|harbor: demo and test deep link, persisted like the About switch
  var THEMES = ['system', 'light', 'dark'];
  var themeParam = params.get('theme');       // ?theme=system|light|dark: the same for Appearance (the app is dark first, like the website)
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- state ----------
  var mem = null; // in-memory fallback when storage is blocked
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function fresh() {
    return { onboarded: false, profile: clone(D.PROFILE), website: '', overrides: {}, saved: {}, skipped: {}, filter: 'all', theme: 'dark', palette: 'brand' }; // dark first: the website is dark-only
  }
  function load() {
    try { var s = localStorage.getItem(KEY); if (s) { var o = fresh(), p = JSON.parse(s); Object.keys(p).forEach(function (k) { o[k] = p[k]; }); return o; } }
    catch (e) { if (mem) return mem; }
    return mem || fresh();
  }
  var dirty = true;
  function save() { dirty = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { mem = S; } }
  var S = load();
  if (PALETTES.indexOf(S.palette) === -1) S.palette = 'brand';   // default (and anything unknown, including the old 'sky' default) is Brand
  if (PALETTES.indexOf(paletteParam) !== -1) { S.palette = paletteParam; save(); }
  if (THEMES.indexOf(themeParam) !== -1) { S.theme = themeParam; save(); }
  if (params.get('demo') === 'reset') {
    S = fresh(); if (PALETTES.indexOf(paletteParam) !== -1) S.palette = paletteParam; if (THEMES.indexOf(themeParam) !== -1) S.theme = themeParam; save();
    params.delete('demo');
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + '#/welcome/1');
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

  // ---------- DOM ----------
  var $app = document.getElementById('app');
  $app.innerHTML = '<div class="ground" aria-hidden="true"><span class="glow"></span><span class="grain"></span></div>' +
    '<div id="screen"></div><div id="dock-root"></div><div id="sheet-root" class="sheet-root" hidden></div>' +
    '<div id="toast-root" class="toast-root" role="status" aria-live="polite"></div>';
  var $screen = document.getElementById('screen'), $dock = document.getElementById('dock-root'),
      $sheet = document.getElementById('sheet-root'), $toast = document.getElementById('toast-root');

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
  function vShape(v, cls) { return v === 'closed' ? icon('event_busy', 's14') : shape(SHAPE[v], cls); }
  function flag(c) { return '<span class="flag flag-' + esc(c) + '" aria-hidden="true"></span>'; }
  function aiPill(cls) { return '<span class="ai-pill' + (cls ? ' ' + cls : '') + '" title="AI output is simulated in this prototype">Simulated AI</span>'; }
  function btnIc(name) { return icon(name, 'btn-ic'); } // the site's pill buttons carry a trailing icon (arrow by default)
  // Word-by-word reveal (the site's statement): each word is a span with its index; styles.css lights them up once per screen load.
  function words(text, firstCls) {
    return String(text).split(' ').map(function (w, i) { return '<span class="w' + (i === 0 && firstCls ? ' ' + firstCls : '') + '" style="--k:' + i + '">' + esc(w) + '</span>'; }).join(' ');
  }
  // The count row: the site's "Where you bid" tiles (1 : 2 : 3 by count). `tag` is button (Feed: tap = filter) or div (Company).
  function countTile(v, n, tag, attrs) {
    return '<' + tag + ' class="vtile v-' + v + ' on-solid" style="--n:' + n + '"' + (attrs || '') + '><b class="count">' + n + '</b><span class="lbl">' + shape(SHAPE[v]) + V[v] + '</span></' + tag + '>';
  }
  function fiction() { return '<p class="caption fiction">All buyers and tenders are fictional</p>'; }
  // Photos (HANDOFF_V2 §2): four tenders have a 200 px Canva preview in assets/img/; the others show a document placeholder.
  function photoSrc(t) { return t.photo ? 'assets/img/' + t.photo + '.png' : null; }
  function photo(t, cls) {
    var src = photoSrc(t);
    if (src) return '<img class="' + cls + '" src="' + src + '" alt="" decoding="async">';
    return '<span class="' + cls + ' photo-ph" aria-hidden="true">' + icon('description', 's24') + '<span class="photo-ph-doc">' + esc(t.doc || 'Tender documents') + ' · ' + t.pages + ' p.</span></span>';
  }
  // The 45 EU CPV divisions (HANDOFF_V2 §5) live in data.js (DEMO.SECTORS, shared with the website). The firm's own divisions (profile.cpv) are bold.
  var SECTORS = D.SECTORS;
  function marquee() {
    var own = {}; (S.profile.cpv || []).forEach(function (c) { own[c] = true; });
    var rows = [[], []], speeds = [110, 92]; // the site's marquee: two rows, opposite directions, 110 s / 92 s
    SECTORS.forEach(function (x, i) { rows[i % 2].push(x); });
    return rows.map(function (items, i) {
      var group = '<span class="mq-group">' + items.map(function (x) {
        return '<span class="mq-item' + (own[x[0]] ? ' own' : '') + '"><span class="mq-code">' + x[0] + '</span>' + esc(x[1]) + '</span>';
      }).join('') + '</span>';
      return '<div class="mq-row"><div class="mq-track" style="--d:' + speeds[i] + 's">' + group + group + '</div></div>';
    }).join('');
  }
  function has(list, x) { return (list || []).indexOf(x) !== -1; }
  function toggle(list, v) { var i = list.indexOf(v); if (i === -1) list.push(v); else list.splice(i, 1); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function dayLabel(iso) { return DAYS[new Date(iso + 'T00:00:00Z').getUTCDay()] + ' ' + E.shortDate(iso); }
  function effort(h) { return h < 8 ? '~' + h + ' h' : '~' + Math.round(h / 8) + ' d'; }
  function offline() { return forceOffline || navigator.onLine === false; }
  function citeParts(t, q) {
    var m = /p\.\s*(\d+)(?:,\s*(.+))?/.exec(q.cite || '');
    return { doc: t.doc || '', page: m ? m[1] : '', section: m && m[2] ? m[2] : '' };
  }
  function citeChip(doc, page) {
    return '<span class="cite-chip">' + icon('description', 's14') + '<span>' + esc(doc + ' p. ' + page) + '</span></span>';
  }
  function quoteHTML(src, hl) {
    var i = hl ? src.indexOf(hl) : -1;
    if (i < 0) return esc(src);
    return esc(src.slice(0, i)) + '<mark>' + esc(hl) + '</mark>' + esc(src.slice(i + hl.length));
  }
  // "… (p. 41, §7.1)." → { text, page, section } so the page becomes a citation chip
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
  function infoBtn(cls) { return '<button class="icon-btn' + (cls ? ' ' + cls : '') + '" data-go="#/about" aria-label="About this prototype">' + icon('info', 's22') + '</button>'; }
  function backBtn(cls) { return '<button class="' + (cls || 'icon-btn') + '" data-act="back" aria-label="Back">' + icon('chevron_left', 's22') + '</button>'; }
  // The floating dock = the website's PhoneDemo dock: 276 × 62 glass, the active tab 132 px wide with its label, the others
  // 65 px, a 7 px inset, and the brand pill sliding between them (450 ms spring). Mounted once; route changes only move it.
  var DOCK_TABS = [['feed', '#/feed', 'radar', 'Feed'], ['bids', '#/bids', 'bookmarks', 'Bids'], ['company', '#/company', 'domain', 'Company']];
  function setDock(active) {
    if (!active) { $dock.innerHTML = ''; return; }
    var nSaved = Object.keys(S.saved).length, x = 7;
    if (!$dock.querySelector('.dock')) {
      $dock.innerHTML = '<div class="dock-wrap"><nav class="dock" aria-label="Main"><span class="dock-pill" aria-hidden="true"></span>' + DOCK_TABS.map(function (t) {
        return '<a href="' + t[1] + '" data-tab="' + t[0] + '"><span class="dock-ic">' + icon(t[2], 's23') + '<span class="dock-badge" aria-hidden="true" hidden></span></span><span class="dock-label">' + t[3] + '</span></a>';
      }).join('') + '</nav></div>';
    }
    DOCK_TABS.forEach(function (t) {
      var a = $dock.querySelector('a[data-tab="' + t[0] + '"]'), on = t[0] === active, w = on ? 132 : 65;
      var badge = t[0] === 'bids' && !on && nSaved; // the site's amber-red count badge on Bids
      a.style.left = x + 'px'; a.style.width = w + 'px';
      if (on) { $dock.querySelector('.dock-pill').style.cssText = 'left:' + x + 'px;width:' + w + 'px'; }
      x += w;
      a.classList.toggle('on', on);
      if (on) { a.setAttribute('aria-current', 'page'); a.removeAttribute('aria-label'); }
      else { a.removeAttribute('aria-current'); a.setAttribute('aria-label', t[3] + (badge ? ', ' + plural(nSaved, 'saved bid') : '')); }
      var b = a.querySelector('.dock-badge'); b.hidden = !badge; b.textContent = badge ? nSaved : '';
    });
  }
  function emptyState(ic, title, text, extra) {
    return '<div class="empty"><div class="disc">' + icon(ic, 's32') + '</div><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p>' + (extra || '') + '</div>';
  }
  function offlineBanner() { return offline() ? '<div class="banner" role="note">' + icon('cloud_off') + '<span>Offline. Showing last night’s results.</span></div>' : ''; }

  // ---------- 01 Welcome (HANDOFF_V2 §4: photo header, moving sector band, pill, preview card, headline, form) ----------
  function welcome() {
    var open = ranked().filter(function (r) { return r.verdict !== 'closed'; });
    var r0 = open[0] || ranked()[0], t0 = tender(r0.tenderId), v0 = r0.verdict, q0 = t0.requirements[0], cp0 = citeParts(t0, q0);
    var reason0 = E.reasonLine(t0, S.profile, r0);
    return '<div class="screen no-top welcome-v2">' +
      '<header class="welcome-hero v2">' +
        '<img class="hero-photo" src="assets/img/app-welcome.png" alt="">' +
        '<span class="hero-tint" aria-hidden="true"></span><span class="hero-fade" aria-hidden="true"></span><span class="hero-grain" aria-hidden="true"></span>' +
        '<span class="mq-scrim" aria-hidden="true"></span>' +
        '<div class="mq" aria-hidden="true">' + marquee() + '</div>' +
        '<div class="hero-top"><span class="wordmark">TenderScout</span>' + infoBtn('on-brand glass') + '</div>' +
        '<p class="hero-pill">' + icon('menu_book', 's15') + '<span>All ' + SECTORS.length + ' EU sectors · ' + plural(open.length, 'new tender') + ' tonight</span></p>' +
      '</header>' +
      '<section class="preview-card v-' + v0 + '" aria-label="Example from tonight: ' + esc(V[v0]) + ', score ' + r0.score + ' of 100. ' + esc(t0.title) + ', ' + esc(bare(t0.buyer)) + '. ' + esc(reason0) + '.">' +
        '<div class="preview-row">' + photo(t0, 'preview-photo') +
          '<div class="min0"><span class="status-line">' + vShape(v0) + '<b>' + V[v0] + '</b><span class="reason">· ' + esc(reason0) + '</span></span>' +
          '<p class="preview-title">' + esc(t0.title) + '</p></div>' +
          '<span class="score-tile" aria-hidden="true">' + r0.score + '</span></div>' +
        '<div class="preview-foot"><span class="cite-chip">' + icon('description', 's14') + '<span>p. ' + esc(cp0.page) + (cp0.section ? ' · ' + esc(cp0.section) : '') + '</span></span>' +
          '<span class="meta-text">' + esc(bare(t0.buyer)) + ' · ' + r0.daysLeft + ' d</span></div>' +
      '</section>' +
      '<div class="welcome-copy"><h1 class="welcome-title" tabindex="-1">Find public tenders you can actually <span class="accent">win</span></h1>' +
        '<p class="welcome-sub">Every new EU tender, read overnight in any language, with the page that proves each answer.</p></div>' +
      '<form class="welcome-form" id="welcome-form" novalidate>' +
        '<label class="eyebrow" for="web">Company website</label>' +
        '<div class="input-pill"><div class="input">' + icon('language') + '<input id="web" type="text" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" value="' + esc(S.website || 'nordlicht-netzwerk.example') + '"></div>' +
        '<button type="button" class="btn btn-metal btn-block" data-act="draft"><span class="metal-ring" aria-hidden="true"><span class="metal-spin"></span><span class="metal-core"></span>' + icon('arrow_forward') + '</span>Draft my profile</button></div>' +
        '<p class="caption">Prototype · all companies and tenders are fictional</p>' +
      '</form></div>';
  }

  // ---------- 02 Reading ----------
  function readingScreen() {
    return '<div class="screen">' + navRow('<span class="spacer"></span>' + aiPill()) +
      '<div class="reading">' +
        '<h1 class="screen-title" tabindex="-1">Reading your site, past references and certificates…</h1>' +
        '<div class="progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="5" id="rd-progress"><span id="rd-bar" style="--p:5%"></span></div>' +
        '<ol class="steps" id="rd-steps"></ol>' +
        '<div class="found" id="rd-found" aria-live="polite"><b>FOUND SO FAR</b><span id="rd-found-list">—</span></div>' +
        '<p class="caption">Usually takes about 20 seconds</p>' +
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
        var ind = st === 'done' ? '<span class="v-go">' + shape('circle', 'md') + '</span>' : st === 'active' ? '<span class="spinner" aria-hidden="true"></span>' : '<span class="ring" aria-hidden="true"></span>';
        return '<li class="step ' + st + '">' + ind + '<span class="lbl">' + esc(s.label) + '</span>' + (st === 'done' ? '<span class="meta-text">' + esc(s.meta) + '</span>' : '') +
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
    var chips = function (list) { return '<div class="chips-row">' + list.map(function (x) { return '<span class="tchip">' + esc(x) + '</span>'; }).join('') + '</div>'; };
    return '<div class="screen has-bar">' +
      '<div class="nav back-nav">' + backBtn() + '<span class="spacer"></span>' + aiPill() + '<span style="width:12px"></span></div>' +
      '<div class="gutter"><p class="eyebrow">Drafted from ' + esc(S.website || p.website || 'your website') + '</p>' +
      '<h1 class="screen-title" tabindex="-1" style="margin-top:8px">Check your <span class="accent">profile</span></h1>' +
      '<p class="sub">Fix anything that’s off.</p></div>' +
      '<section class="profile-card" aria-label="Drafted company profile">' +
        '<div><p class="co-name">' + esc(p.name) + '</p><p class="co-place meta-text">' + flag('DE') + esc(p.city.replace(/,.*$/, '')) + '</p></div>' +
        '<div class="stat-row"><div><b>' + p.staff + '</b><span>Staff</span></div><div><b>' + money(p.turnover) + '</b><span>Turnover</span></div><div><b>' + p.references + '</b><span>References</span></div></div>' +
        '<div class="kv"><p class="k">Sectors</p>' + chips(p.sectorsLabel) + '</div>' +
        '<div class="kv"><p class="k">Certificates</p>' + chips(p.certifications.length ? p.certifications : ['None yet']) + '</div>' +
        '<div class="kv"><p class="k">Bid languages</p>' + chips(p.languages.map(E.langName)) + '</div>' +
        '<div class="kv"><p class="k">Countries</p><div class="chips-row">' + p.countries.map(function (c) { return '<span class="tchip">' + flag(c) + esc(c) + '</span>'; }).join('') +
          (p.crossBorder ? '<span class="tchip">+ cross-border</span>' : '') + '</div></div>' +
        '<p class="mono-meta sources">SOURCES · ' + esc(S.website || 'nordlicht-netzwerk.example') + ' · 18 pages · ' + p.references + ' award notices (fictional)</p>' +
      '</section></div>' +
      '<div class="action-bar"><button class="btn btn-outline" data-go="#/company">Edit</button><button class="btn btn-primary" data-act="finish">Looks right' + btnIc('arrow_forward') + '</button></div>';
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
    var seg = function (k, label) { return '<button role="radio" aria-checked="' + (f === k) + '" data-filter="' + k + '">' + label + ' ' + filterN[k] + '</button>'; };
    var tile = function (v) { return countTile(v, counts[v], 'button', ' data-filter="' + v + '" aria-label="' + counts[v] + ' ' + V[v] + '. Show only ' + V[v] + '"'); };
    var skippedN = Object.keys(S.skipped).length;
    var body;
    if (!visible.length) {
      body = emptyState('radar', 'Nothing new tonight', 'You’ve skipped every tender from last night. You can restore any of them from Bids.',
        '<p class="eyebrow">Next read · tonight 02:00</p><button class="btn btn-outline btn-md" data-go="#/company">Widen your profile</button>');
    } else if (!list.length) {
      body = '<div class="empty compact"><p>No ' + V[f] + ' tenders tonight.</p><button class="text-btn" data-filter="all">Show all</button></div>';
    } else {
      body = '<div class="cards feed-list">' + list.map(function (r, i) { return card(r, i); }).join('') + '</div>';
    }
    pulse = {};
    return '<div class="screen has-dock">' +
      navRow(aiPill() + '<span class="spacer"></span>' + infoBtn()) +
      '<div class="feed-head"><p class="eyebrow">Tonight’s read · ' + dayLabel(TODAY) + '</p>' +
      '<h1 class="screen-title reveal" tabindex="-1">' + (open ? words(plural(open, 'new tender'), 'accent') : words('No open tenders')) + '</h1></div>' +
      '<div class="vtiles" role="group" aria-label="Summary">' + tile('go') + tile('maybe') + tile('nogo') + '</div>' +
      '<p class="pages-line">' + icon('menu_book', 's18') + '<span>Read <b class="count-up" data-n="' + pages + '">' + pages + '</b> pages in ' + langs + ' languages so you don’t have to</span></p>' +
      offlineBanner() +
      '<div class="seg filter" role="radiogroup" aria-label="Filter tenders">' + seg('all', 'All') + seg('go', 'Go') + seg('maybe', 'Maybe') + seg('nogo', 'No-go') + '</div>' +
      body +
      (skippedN ? '<p class="caption skipped-note">' + plural(skippedN, 'tender') + ' skipped · <a class="link" href="#/bids">see in Bids</a></p>' : '') +
      fiction() + '</div>';
  }

  function card(r, i) {
    var t = tender(r.tenderId), v = r.verdict, closed = v === 'closed', saved = S.saved[t.id];
    var reason = E.reasonLine(t, S.profile, r);
    var soon = !closed && r.daysLeft <= 10;
    var label = (closed ? 'Closed' : V[v] + ', score ' + r.score + ' of 100') + '. ' + t.title + ', ' + bare(t.buyer) + '. ' + reason + '.' + (saved ? ' Saved.' : '');
    var wasPulse = pulse[t.id];
    return '<div class="tcard-wrap" data-id="' + t.id + '" style="--i:' + ((i || 0) + 1) + '"><div>' +
      '<a class="tcard glowable v-' + v + (closed ? ' is-closed' : '') + '" href="#/t/' + t.id + '" aria-label="' + esc(label) + '">' +
        photo(t, 'tcard-photo') + '<span class="photo-tint" aria-hidden="true"></span><span class="tcard-fade" aria-hidden="true"></span>' +
        '<span class="score-tile' + (wasPulse ? ' pulse' : '') + '" aria-hidden="true">' + (closed ? icon('event_busy', 's21') : r.score) + '</span>' +
        '<span class="tcard-body">' +
          '<span class="status-line">' + vShape(v) + '<b>' + V[v] + '</b><span class="reason">· ' + esc(reason) + '</span></span>' +
          '<span class="tcard-title">' + esc(t.title) + '</span>' +
          '<span class="orig" lang="' + esc(t.language) + '">' + esc(t.original) + '</span>' +
          '<span class="meta-row">' + flag(t.country) + '<span class="buyer">' + esc(bare(t.buyer)) + '</span>' +
            '<span class="nowrap">· ' + money(t.value) + ' · <span class="' + (soon ? 'soon' : '') + '">' + (closed ? 'closed' : r.daysLeft + ' d') + '</span></span>' +
            (saved ? icon('bookmark', 'fill s18 saved') : '') + '</span>' +
        '</span></a></div></div>';
  }

  // ---------- 05 Tender detail ----------
  function detail(id) {
    var t = tender(id); if (!t) return notFound();
    if (!readCache[id]) return loadingDetail(t);
    var r = evalT(t), v = r.verdict, closed = v === 'closed', saved = S.saved[id], skipped = S.skipped[id];
    var checks = r.checks.slice().sort(function (a, b) { return ORDER[a.status] - ORDER[b.status]; });
    var head = closed
      ? '<p class="vblock-verdict">' + icon('event_busy', 's18') + 'Closed</p><p class="closed-word">Closed</p>'
      : '<p class="vblock-verdict">' + shape(SHAPE[v], 'lg') + V[v] + '</p>' +
        '<p class="vblock-score" aria-label="Score ' + r.score + ' of 100"><span class="num" aria-hidden="true">' + r.score + '</span><span class="of" aria-hidden="true">/100</span></p>';
    var qa = t.ai.qa || [];
    var actions;
    if (skipped) actions = '<button class="btn btn-outline" data-unskip="' + id + '">' + icon('undo') + 'Restore</button>';
    else actions = '<button class="btn btn-outline" data-go="#/t/' + id + '/skip">Skip</button>';
    if (closed) actions += '<button class="btn grow-2" disabled>' + icon('lock') + 'Save to Bids</button>';
    else if (saved) actions += '<button class="btn btn-tonal grow-2" data-go="#/bids">' + icon('bookmark', 'fill') + 'In Bids · ' + esc(saved) + '</button>';
    else actions += '<button class="btn btn-primary" data-act="save" data-id="' + id + '">Save to Bids' + btnIc('bookmark_add') + '</button>';
    var withPhoto = !!t.photo && !closed;
    return '<div class="screen has-bar no-top">' +
      '<header class="vblock v-' + v + (withPhoto ? ' has-photo' : '') + '">' +
        (withPhoto ? '<img class="vphoto" src="' + photoSrc(t) + '" alt=""><span class="vphoto-fade" aria-hidden="true"></span>' : '') +
        '<div class="vblock-nav">' + backBtn('circle-btn') + aiPill('on') + '</div>' + head +
        '<p class="vblock-reason">' + esc(E.headline(t, S.profile, r)) + '</p>' +
      '</header>' +
      '<div class="detail-head"><h1 class="detail-title" tabindex="-1">' + esc(t.title) + '</h1>' +
        '<p class="orig" lang="' + esc(t.language) + '">' + esc(t.original) + '</p>' +
        '<p class="meta-row">' + flag(t.country) + '<span class="buyer">' + esc(bare(t.buyer)) + '</span>' + (skipped ? '<span class="nowrap">· skipped</span>' : '') + '</p></div>' +
      '<div class="facts">' +
        fact('Value', money(t.value)) + fact('Days left', closed ? '0' : String(r.daysLeft), !closed && r.daysLeft <= 10) +
        fact('Effort*', effort(r.effortHours)) + fact('Pages', String(t.pages)) +
      '</div><p class="facts-note">* Effort is a rough heuristic, not validated.</p>' +
      (offline() ? '<div style="margin-top:12px">' + offlineBanner() + '</div>' : '') +
      '<div class="sec-h"><h2>In short</h2>' + aiPill() + '</div><p class="in-short reveal">' + words(t.ai.summary) + '</p>' +
      '<div class="sec-h"><h2>Can you <span class="accent">qualify?</span></h2><span class="aside">' + r.count.pass + ' of ' + r.checks.length + ' met</span></div>' +
      '<div class="cards">' + checks.map(function (c, i) { return reqCard(t, c, i); }).join('') + '</div>' +
      (qa.length ? '<div class="sec-h"><h2>Ask this tender</h2></div><div class="asks" id="asks">' + asksHTML(t) + '</div>' : '') +
      fiction() + '</div>' +
      '<div class="action-bar">' + (closed ? '<p class="bar-note">' + icon('lock', 's15') + 'Closed tenders can’t be saved</p>' : '') + actions + '</div>';
  }
  function fact(k, v, soon) { return '<div class="fact"><p class="k">' + k + '</p><p class="v' + (soon ? ' soon' : '') + '">' + esc(v) + '</p></div>'; }

  function reqCard(t, c, i) {
    var q = reqOf(t, c.id), st = STATUS[c.status], cp = citeParts(t, q), unresolved = c.status === 'review';
    var kind = c.confirmed ? 'Your answer' : c.status === 'fail' ? 'Knock-out' : (KIND[q.type] || 'Requirement');
    var line = c.confirmed ? (c.status === 'pass' ? 'You confirmed you meet it' : 'You said you don’t meet it')
      : unresolved ? Math.round(q.confidence * 100) + '% sure. Only you can answer this.' : c.note;
    var label = st.label + ', ' + kind.toLowerCase() + '. ' + q.label + '. ' + line + '. Source: ' + cp.doc + ' page ' + cp.page + '.';
    var y = 8 + (+cp.page % 5) * 6;
    return '<a class="req glowable v-' + st.v + (unresolved ? ' unresolved' : '') + '" href="#/t/' + t.id + '/req/' + c.id + '" aria-label="' + esc(label) + '">' +
      '<span class="req-body">' +
        '<span class="status-line">' + shape(st.shape) + '<b>' + st.label + '</b><span class="reason">· ' + esc(kind) + '</span></span>' +
        '<span class="req-title">' + esc(q.label) + '</span>' +
        '<span class="' + (unresolved ? 'req-sure' : 'req-check') + '">' + esc(line) + '</span>' +
        citeChip(cp.doc, cp.page) +
      '</span>' +
      '<span class="thumb" style="--rot:' + (i % 2 ? '-3.5deg' : '3deg') + ';--y:' + y + 'px" aria-hidden="true"></span></a>';
  }

  function asksHTML(t) {
    return (t.ai.qa || []).map(function (q, i) {
      var key = t.id + ':' + i, open = openAsk === key, ans = answers[key], inner = '';
      if (open) {
        if (ans == null) inner = '<p class="typing"><span class="spinner" aria-hidden="true"></span>Reading the tender…</p>';
        else { var a = splitAnswer(ans); inner = '<p>' + esc(a.text) + '</p>' + (a.page ? citeChip(t.doc, a.page) : ''); }
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
    return '<div class="screen has-bar no-top">' +
      '<header class="vblock loading">' +
        '<div class="vblock-nav">' + backBtn('circle-btn') + aiPill() + '</div>' +
        '<p class="loading-title"><span class="spinner lg" aria-hidden="true"></span><span>Reading ' + t.pages + ' pages (' + lang + ')…</span></p>' +
        '<p class="mono-meta" id="ld-page" style="margin-top:6px">p. 0 of ' + t.pages + '</p>' +
        '<div class="progress" style="margin-top:12px"><span id="ld-bar" style="--p:3%"></span></div>' +
        '<ul class="load-steps" id="ld-steps">' + loadSteps(n, 0) + '</ul>' +
      '</header>' +
      '<div class="detail-head"><h1 class="detail-title" tabindex="-1">' + esc(t.title) + '</h1>' +
        '<p class="orig" lang="' + esc(t.language) + '">' + esc(t.original) + '</p>' +
        '<p class="meta-row">' + flag(t.country) + '<span class="buyer">' + esc(bare(t.buyer)) + '</span></p></div>' +
      '<div class="skel-block" aria-hidden="true"><div class="skel h22 w50"></div><div class="skel w90"></div><div class="skel w70"></div><div class="skel w90"></div><div class="skel h22 w50"></div><div class="skel w70"></div></div>' +
      fiction() + '</div>' +
      '<div class="action-bar"><button class="btn btn-outline" data-go="#/t/' + t.id + '/skip">Skip</button>' +
      (S.saved[t.id] ? '<button class="btn btn-tonal grow-2" data-go="#/bids">' + icon('bookmark', 'fill') + 'In Bids · ' + esc(S.saved[t.id]) + '</button>'
        : '<button class="btn btn-primary" data-act="save" data-id="' + t.id + '">Save to Bids' + btnIc('bookmark_add') + '</button>') + '</div>';
  }
  function loadSteps(n, step) {
    var labels = [step > 0 ? 'Found ' + plural(n, 'requirement') : 'Finding requirements', 'Translating the key clauses', 'Checking them against your profile'];
    return labels.map(function (l, i) {
      var st = i < step ? 'done' : i === step ? 'active' : 'pending';
      var ind = st === 'done' ? '<span class="v-go">' + shape('circle') + '</span>' : st === 'active' ? '<span class="spinner" aria-hidden="true"></span>' : '<span class="ring" aria-hidden="true"></span>';
      return '<li class="load-step ' + st + '">' + ind + '<span>' + esc(l) + '</span></li>';
    }).join('');
  }

  // ---------- 06 Requirement sheet ----------
  function reqSheet(t, rid) {
    var q = reqOf(t, rid); if (!q) return null;
    var r = evalT(t), c = r.checks.filter(function (x) { return x.id === rid; })[0];
    var st = STATUS[c.status], unresolved = c.status === 'review' && !c.confirmed, cp = citeParts(t, q);
    var callout;
    if (c.confirmed) callout = [c.status === 'pass' ? 'check_circle' : 'cancel', c.status === 'pass' ? 'You confirmed you meet this. The verdict counts it as met.' : 'You said you don’t meet this. It counts as a knock-out.'];
    else if (c.status === 'review') callout = ['help', (q.note ? q.note + ' ' : 'The tender is unclear here. ') + 'Only you can answer this.'];
    else callout = [st.icon, c.note + '.'];
    var lang = E.langName(t.language);
    return '<div class="scrim" data-act="close-sheet"></div>' +
      '<div class="sheet v-' + st.v + '" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-stop>' +
      '<div class="grabber" aria-hidden="true"></div>' +
      '<div class="sheet-body">' +
        '<div class="sheet-top"><span class="status-pill">' + shape(st.shape) + st.label + '</span>' + aiPill() +
          '<div class="confidence"><b>' + Math.round((q.confidence || 0) * 100) + '%</b><span>AI confidence</span></div></div>' +
        '<h2 class="sheet-title" id="sheet-title" tabindex="-1">' + esc(q.label) + '</h2>' +
        '<div class="callout">' + icon(callout[0]) + '<p>' + esc(callout[1]) + '</p></div>' +
        '<figure class="quote"><span class="quote-tag">Original · ' + esc(lang) + '</span>' +
          '<div class="quote-head"><span>' + esc(cp.doc) + '</span><span>p. ' + esc(cp.page) + (cp.section ? ' · ' + esc(cp.section) : '') + '</span></div>' +
          '<div class="ph w85" aria-hidden="true"></div><div class="ph w60" aria-hidden="true"></div>' +
          '<blockquote lang="' + esc(t.language) + '">' + quoteHTML(q.src, q.highlight) + '</blockquote>' +
          '<div class="ph" aria-hidden="true"></div><div class="ph w40" aria-hidden="true"></div></figure>' +
        '<div><p class="mono-label">Translation · English</p><p class="translation">' + esc(q.tr) + '</p></div>' +
      '</div>' +
      '<div class="sheet-foot">' +
        (c.confirmed ? '<p class="answered">You answered: ' + (c.status === 'pass' ? 'We meet it' : 'We don’t meet it') +
          ' · <button class="text-btn" data-confirm="clear" data-t="' + t.id + '" data-r="' + rid + '">' + icon('undo', 's18') + 'Undo</button></p>' : '') +
        '<div class="row-btns pair">' +
          '<button class="btn ' + (unresolved ? 'btn-check' : 'btn-outline') + '" data-confirm="fail" data-t="' + t.id + '" data-r="' + rid + '">We don’t meet it</button>' +
          '<button class="btn ' + (unresolved ? 'btn-check' : 'btn-primary') + ' grow-2" data-confirm="pass" data-t="' + t.id + '" data-r="' + rid + '">We meet it' + btnIc('check') + '</button>' +
        '</div></div></div>';
  }

  // ---------- 07 Skip sheet ----------
  function skipSheet(t) {
    var sel = skipDraft[t.id] || (skipDraft[t.id] = []);
    return '<div class="scrim" data-act="close-sheet"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-stop>' +
      '<div class="grabber" aria-hidden="true"></div>' +
      '<div class="sheet-body">' +
        '<div><h2 class="sheet-title" id="sheet-title" tabindex="-1">Why skip this one?</h2>' +
        '<p class="sheet-sub">' + esc(t.title) + ' · ' + esc(bare(t.buyer)) + '</p></div>' +
        '<div class="chip-grid" role="group" aria-label="Reasons, optional">' + SKIP_REASONS.map(function (x) {
          var on = has(sel, x);
          return '<button class="chip" aria-pressed="' + on + '" data-skip="' + esc(x) + '" data-id="' + t.id + '">' + (on ? icon('check', 's18') : '') + esc(x) + '</button>';
        }).join('') + '</div>' +
        '<p class="tune-note">' + icon('tune') + '<span><strong>Your reasons tune tomorrow’s feed.</strong> Skipping without a reason is fine.</span></p>' +
      '</div>' +
      '<div class="sheet-foot"><div class="row-btns">' +
        '<button class="btn btn-outline" data-act="close-sheet">Cancel</button>' +
        '<button class="btn btn-primary grow-2" data-act="skip-confirm" data-id="' + t.id + '">Skip tender' + btnIc('arrow_forward') + '</button>' +
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
      body = emptyState('bookmarks', 'No bids yet', 'Save a tender from your feed and it lands here, ready to move from Deciding to Submitted.',
        '<button class="btn btn-primary btn-md" data-go="#/feed">Open Feed' + btnIc('arrow_forward') + '</button>');
    } else {
      body = STAGES.map(function (stage) {
        var inSt = ids.filter(function (id) { return S.saved[id] === stage; });
        return '<div class="sec-h"><h2>' + stage + '<span class="count-pill">' + inSt.length + '</span></h2></div>' +
          (inSt.length ? '<div class="cards">' + inSt.map(function (id, i) { return bidCard(tender(id), results[id], stage, i); }).join('') + '</div>'
            : '<div class="placeholder">Nothing here yet</div>');
      }).join('') +
      (sk.length ? '<div class="sec-h"><h2>Skipped<span class="count-pill">' + sk.length + '</span></h2></div><div class="skipped">' + sk.map(function (id) {
        var t = tender(id), why = (S.skipped[id] && S.skipped[id].reasons) || [];
        return '<div class="skip-row"><div class="txt"><p class="t">' + esc(t.title) + '</p><p class="r">' + esc(bare(t.buyer)) + ' · ' + esc(why.length ? why.join(', ') : 'No reason given') + '</p></div>' +
          '<button class="btn btn-outline btn-sm" data-unskip="' + id + '" aria-label="Restore ' + esc(t.title) + '">' + icon('undo', 's18') + 'Restore</button></div>';
      }).join('') + '</div>' : '');
    }
    return '<div class="screen has-dock">' + navRow('<span class="spacer"></span>' + infoBtn()) +
      '<div class="bids-head"><p class="eyebrow">Your pipeline · ' + dayLabel(TODAY) + '</p><h1 class="screen-title" tabindex="-1">Bids</h1><p class="sub">' + esc(sub) + '</p></div>' +
      body + fiction() + '</div>';
  }
  var enteringId = null;
  function bidCard(t, r, stage, i) {
    var v = r.verdict, closed = v === 'closed', reason = E.reasonLine(t, S.profile, r);
    return '<article class="bid-card glowable v-' + v + (enteringId === t.id ? ' entering' : '') + '" style="--i:' + ((i || 0) + 1) + '" aria-label="' + esc(t.title) + '">' +
      '<a class="top" href="#/t/' + t.id + '"><span class="score-tile sm" aria-hidden="true">' + (closed ? icon('event_busy', 's18') : r.score) + '</span>' +
      '<span class="min0"><span class="status-line">' + vShape(v) + '<b>' + V[v] + '</b><span class="reason">· ' + esc(reason) + '</span></span>' + // the site's bid card: shape + label + reason over the title
      '<span class="tcard-title">' + esc(t.title) + '</span><span class="meta-row">' + flag(t.country) + '<span class="buyer">' + esc(bare(t.buyer)) + '</span>' +
      '<span class="nowrap">· ' + (closed ? 'closed' : '<span class="' + (r.daysLeft <= 10 ? 'soon' : '') + '">' + r.daysLeft + ' d</span>') + '</span></span>' +
      '<span class="sr-only">' + (closed ? 'Closed' : 'score ' + r.score + ' of 100') + '</span></span>' + photo(t, 'bid-thumb') + '</a>' +
      '<div class="seg stage" role="radiogroup" aria-label="Stage">' + STAGES.map(function (s) {
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
    var langChips = LANG_OPTIONS.map(function (l) {
      var on = has(p.languages, l);
      return '<button class="chip" aria-pressed="' + on + '" data-lang="' + l + '">' + (on ? icon('check', 's18') : '') + E.langName(l) + '</button>';
    }).join('');
    var html = '<div class="screen no-top ' + (S.onboarded ? 'has-dock' : 'has-bar') + '">' +
      '<header class="co-head">' +
        '<img class="co-photo" src="assets/img/app-company.png" alt=""><span class="co-photo-tint" aria-hidden="true"></span><span class="co-photo-fade" aria-hidden="true"></span>' +
        '<div class="co-top"><span class="wordmark">TenderScout</span>' + infoBtn('glass') + '</div>' +
        '<p class="eyebrow">Your profile · ' + esc(p.city) + '</p>' +
        '<h1 class="screen-title" tabindex="-1">Company</h1>' +
        '<p class="sub">' + esc(p.name) + '</p>' +
        '<p class="eyebrow feed-now">Your feed right now</p>' +
        '<div class="vtiles co-tiles" id="co-tiles" role="group" aria-label="Your feed right now">' + ['go', 'maybe', 'nogo'].map(function (v) { return countTile(v, c[v], 'div', ' data-tile="' + v + '"'); }).join('') + '</div>' +
      '</header>' +
      '<div id="rescore">' + rescoreCard(false) + '</div>' +
      '<div class="sec-h"><h2>Size</h2></div><div class="group">' +
        '<div class="row"><div class="txt"><p class="row-label"><label for="turnover">Turnover</label></p><p class="row-sub">Last full year, in € millions</p></div>' +
          '<label class="money-field" for="turnover"><span class="unit" aria-hidden="true">€</span><input id="turnover" data-field="turnover" inputmode="decimal" autocomplete="off" value="' + (p.turnover / 1e6) + '"><span class="unit" aria-hidden="true">M</span></label></div>' +
        '<div class="row"><div class="txt"><p class="row-label" id="lbl-ref">References</p><p class="row-sub">Comparable, last 3 years</p><p class="hint" data-hint="ref"></p></div>' +
          '<div class="stepper" role="group" aria-labelledby="lbl-ref"><button class="minus" data-ref="-1" aria-label="Fewer references">' + icon('remove') + '</button>' +
          '<output id="ref-out" aria-live="polite">' + p.references + '</output><button class="plus" data-ref="1" aria-label="More references">' + icon('add') + '</button></div></div>' +
      '</div>' +
      '<div class="sec-h"><h2>Certificates</h2></div><div class="group">' + certRows + '</div>' +
      '<div class="sec-h"><h2>Bid languages</h2></div><div class="group lang-block"><div class="chip-grid" role="group" aria-label="Bid languages">' + langChips + '</div><p class="hint" data-hint="lang"></p></div>' +
      '<div class="sec-h"><h2>Where you bid</h2></div><div class="group">' +
        '<div class="row"><div class="txt"><p class="row-label" id="lbl-xb">Bid outside ' + esc(countries) + '</p><p class="hint" data-hint="xb"></p></div>' +
        '<button class="switch" role="switch" aria-checked="' + !!p.crossBorder + '" aria-labelledby="lbl-xb" data-act="xb"></button></div>' +
      '</div>' +
      '<p class="caption fiction">Plain code, not AI: engine.js re-scores every tender the moment you change something.</p>' +
      '</div>' +
      (S.onboarded ? '' : '<div class="action-bar"><button class="btn btn-primary" data-act="finish">Save and see my feed' + btnIc('arrow_forward') + '</button></div>');
    return html;
  }
  function rescoreCard(enter) {
    var neutral = function (title, text) {
      return '<div class="rescore neutral' + (enter ? ' enter' : '') + '"><span class="rescore-tile" aria-hidden="true">' + icon('tune') + '</span>' +
        '<div><p class="rescore-buyer">' + esc(title) + '</p><p class="rescore-text">' + esc(text) + '</p></div></div>';
    };
    if (!lastChange) return neutral('Change anything below', 'Every tender in your feed re-scores instantly.');
    var ch = lastChange.changes;
    if (!ch.length) return neutral('Re-scored ' + plural(D.TENDERS.length, 'tender') + '.', 'No verdict changed.');
    var c = ch[0], t = tender(c.tenderId), up = c.direction === 'up', more = ch.length > 1 ? ' · +' + (ch.length - 1) + ' more' : '';
    var mini = function (v) { return '<span class="mini v-' + v + '">' + vShape(v) + V[v] + '</span>'; };
    return '<div class="rescore' + (enter ? ' enter' : '') + ' ' + (up ? 'v-go' : 'v-maybe') + '" data-rescore="' + c.tenderId + ':' + c.from + ':' + c.to + '">' +
      '<span class="rescore-tile on-solid" aria-hidden="true">' + icon(up ? 'trending_up' : 'trending_down', 's22') + '</span>' +
      '<div><p class="rescore-buyer" aria-hidden="true">' + esc(bare(t.buyer)) + '</p>' +
      '<p class="change-row" aria-hidden="true">' + mini(c.from) + '<span class="arrow">→</span>' + mini(c.to) + '<span>just now' + esc(more) + '</span></p>' +
      '<p class="sr-only">' + esc(bare(t.buyer)) + ': ' + V[c.from] + ' → ' + V[c.to] + esc(more) + '</p></div></div>';
  }
  // Unlock hints: "Turn on → Gemeente Vlietdam becomes Maybe". Computed by Engine.whatIf (no state change).
  function hintText(changes, lead, verb) {
    var c = changes[0];
    return lead + ' → ' + bare(tender(c.tenderId).buyer) + ' ' + verb + ' ' + V[c.to] + (changes.length > 1 ? ' +' + (changes.length - 1) + ' more' : '');
  }
  function whatIf(patch) {
    return E.whatIf(D.TENDERS, S.profile, TODAY, S.overrides, patch).filter(function (c) { return !S.skipped[c.tenderId]; });
  }
  function ups(list) { return list.filter(function (c) { return c.direction === 'up'; }); }
  function unlockedHint(lever) {
    if (!lastChange || lastChange.lever !== lever) return null;
    var u = ups(lastChange.changes); if (!u.length) return null;
    var c = u[0], name = bare(tender(c.tenderId).buyer);
    return { ok: true, text: (c.to === 'go' ? 'Unlocked ' + name : name + ' moved up to ' + V[c.to]) + (u.length > 1 ? ' +' + (u.length - 1) + ' more' : '') };
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
    var langHint = null;
    LANG_OPTIONS.some(function (l) {
      if (has(p.languages, l)) return false;
      var u = ups(whatIf({ languages: p.languages.concat([l]) }));
      if (u.length) { langHint = { text: hintText(u, 'Add ' + E.langName(l), 'becomes') }; return true; }
      return false;
    });
    var lastLang = lastChange && /^lang:/.test(lastChange.lever) ? unlockedHint(lastChange.lever) : null;
    out.lang = lastLang || langHint;
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
      el.innerHTML = x ? (x.ok ? icon('check', 's14') : '') + esc(x.text) : '';
      el.hidden = !x;
    });
  }
  // Apply a profile change and re-score live, without re-rendering (so toggles and tiles animate).
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
    Array.prototype.forEach.call($screen.querySelectorAll('[data-lang]'), function (el) {
      var on = has(p.languages, el.getAttribute('data-lang'));
      el.setAttribute('aria-pressed', on); el.innerHTML = (on ? icon('check', 's18') : '') + E.langName(el.getAttribute('data-lang'));
    });
    var xb = $screen.querySelector('[data-act="xb"]'); if (xb) xb.setAttribute('aria-checked', !!p.crossBorder);
    var out = document.getElementById('ref-out'); if (out) out.textContent = p.references;
    var to = document.getElementById('turnover'); if (to && document.activeElement !== to) to.value = p.turnover / 1e6;
    var c = openCounts();
    setTimeout(function () {
      Array.prototype.forEach.call($screen.querySelectorAll('[data-tile]'), function (el) {
        var v = el.getAttribute('data-tile'), b = el.querySelector('b'), from = +b.textContent;
        el.style.setProperty('--n', c[v]);
        countUp(b, from, c[v]);
      });
      mountRescore(fromEl);
    }, reduceMotion ? 0 : 60);
    paintHints();
  }
  // Re-score card = one object changing shape (design/MOTION.md rule 2, motion-effects 03): the card grows out of the
  // control that changed (FLIP, 700 ms --ease-morph) while its contents fade in over the second half, and a faint
  // dashed ghost stays on the control. Plain pop (480 ms easeOutBack) when the card is off-screen, when the Web
  // Animations API is missing, or under prefers-reduced-motion.
  var EASE_MORPH = 'cubic-bezier(.77,0,.18,1)';
  function mountRescore(fromEl) {
    var rs = document.getElementById('rescore'); if (!rs) return;
    rs.innerHTML = rescoreCard(true);
    var card = rs.firstElementChild;
    if (!card || !fromEl || reduceMotion || typeof card.animate !== 'function') return;
    var a = fromEl.getBoundingClientRect(), b = card.getBoundingClientRect();
    if (!a.width || !a.height || !b.width || b.bottom < 0 || b.top > window.innerHeight) return; // card off-screen: keep the pop
    card.classList.remove('enter'); card.classList.add('morph');
    var sx = a.width / b.width, sy = a.height / b.height;
    var r = parseFloat(getComputedStyle(fromEl).borderTopLeftRadius) || 16;
    card.style.transformOrigin = '0 0';
    card.animate([
      { transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + sx + ',' + sy + ')', borderRadius: (r / sx) + 'px / ' + (r / sy) + 'px', boxShadow: '0 0 0 0 rgba(0,0,0,0)' },
      { transform: 'none', borderRadius: '24px' }
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

  // ---------- 10 About ----------
  function about() {
    var seg = function (k, label) { return '<button role="radio" aria-checked="' + (S.theme === k) + '" data-act="theme" data-value="' + k + '">' + label + '</button>'; };
    var pal = function (k, label) { return '<button role="radio" aria-checked="' + (S.palette === k) + '" data-act="palette" data-value="' + k + '">' + label + '</button>'; };
    var row = function (ic, title, text, extra) {
      return '<div class="about-row"><span class="icon-tile" aria-hidden="true">' + icon(ic, 's21') + '</span><div><h3>' + title + (extra || '') + '</h3><p>' + text + '</p></div></div>';
    };
    return '<div class="screen">' +
      '<div class="nav back-nav">' + backBtn() + '</div>' +
      '<div class="about-intro"><p class="eyebrow">Prototype · ESCP · fictional data</p><h1 class="screen-title" tabindex="-1">About <span class="accent">TenderScout</span></h1>' +
      '<p>A university prototype for ESCP Digital Transformation (MG34), Digital Product Design, 2026. TenderScout is a working name.</p></div>' +
      '<div class="group" style="margin-top:20px">' +
        row('science', 'AI output is simulated', 'Reading tenders, translating, answering questions and drafting your profile are played back from pre-written output (ai.js). No model is called, there are no API keys, and no data leaves your phone. This pill marks every screen that shows it.', aiPill()) +
        row('rule', 'The decision logic is real code', 'The qualification check, score and Go / Maybe / No-go verdict run live in engine.js and are unit-tested. The effort estimate is a rough heuristic, not validated.') +
        row('badge', 'All data is fictional', 'Every company, buyer, tender, page number and quote is invented. None of it is interview evidence.') +
        row('code', 'Built with AI assistance', 'Claude helped build the v0 scaffold and this restyle (Claude Code). The team ran the interviews and made the product decisions. See README → AI use.') +
      '</div>' +
      '<div class="sec-h"><h2>Appearance</h2></div><div class="group theme-row">' +
        '<p class="label-text" id="lbl-theme">Light or dark</p><div class="seg" role="radiogroup" aria-labelledby="lbl-theme">' + seg('system', 'System') + seg('light', 'Light') + seg('dark', 'Dark') + '</div>' +
        '<p class="label-text" id="lbl-pal" style="margin-top:14px">Palette</p><div class="seg" role="radiogroup" aria-labelledby="lbl-pal">' + pal('brand', 'Brand') + pal('sky', 'Sky') + pal('harbor', 'Harbor') + '</div>' +
        '<p class="row-sub" style="margin-top:8px">Brand is the website’s night and sky, Sky is cloud white and sky blue, Harbor is navy and sea blue. The app is dark first, like the website; Light and System are yours to pick.</p></div>' +
      '<div class="about-actions"><button class="btn btn-danger btn-block" data-act="reset">' + icon('restart_alt') + 'Reset demo</button>' +
      '<p class="caption">Clears your profile, answers, saved and skipped tenders. Same as adding ?demo=reset to the address.</p></div>' +
      '</div>';
  }
  function notFound() {
    return '<div class="screen"><div class="nav back-nav">' + backBtn() + '</div>' +
      '<h1 class="sr-only" tabindex="-1">Not found</h1>' +
      emptyState('radar', 'Page not found', 'That link doesn’t match any screen in TenderScout.', '<button class="btn btn-primary btn-md" data-go="#/feed">Open Feed' + btnIc('arrow_forward') + '</button>') + '</div>';
  }

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
    if (h.length === 1 && ['feed', 'bids', 'company', 'about'].indexOf(h[0]) !== -1) return { name: h[0] };
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
    if (stack.length > 1) { pendingPops = 1; history.back(); return; }
    replaceTo(S.onboarded ? '#/feed' : '#/welcome/1');
  }
  function closeSheet() { var r = parse(); if (r.sub) backTo('#/t/' + r.id, 1); }

  var curKey = null, scrollPos = {}, firstRender = true;
  function render(force) {
    var r = parse();
    if (!S.onboarded && ['onb', 'company', 'about'].indexOf(r.name) === -1) { replaceTo('#/welcome/1'); return; }
    var key = r.name === 'detail' ? 'detail:' + r.id : r.name + (r.step ? ':' + r.step : '');
    var isNew = key !== curKey;
    if (force || dirty || isNew) {
      if (curKey && isNew) scrollPos[curKey] = window.scrollY;
      var html;
      switch (r.name) {
        case 'onb': html = r.step === 2 ? readingScreen() : r.step === 3 ? checkProfile() : welcome(); break;
        case 'feed': html = feed(); break;
        case 'detail': html = detail(r.id); break;
        case 'bids': html = bids(); break;
        case 'company': html = company(); break;
        case 'about': html = about(); break;
        default: html = notFound();
      }
      var top = wasPop && scrollPos[key] ? scrollPos[key] : 0;
      // One-shot entrances (HANDOFF_V2 §6): only when a new screen opens at the top. Same-screen re-renders and
      // returns to a remembered scroll position don't replay them (cards would sit invisible during their stagger).
      $screen.classList.toggle('entering', isNew && top === 0);
      $screen.innerHTML = html;
      dirty = false; curKey = key;
      $app.setAttribute('data-mood', mood(r)); // tints the ground's glow blob: the screen's mood, the verdict on a tender detail
      var docked = S.onboarded && ['feed', 'bids', 'company'].indexOf(r.name) !== -1;
      setDock(docked ? r.name : null);
      $toast.style.setProperty('--toast-offset', (docked ? 104 : $screen.querySelector('.action-bar') ? 102 : 24) + 'px');
      if (isNew) {
        window.scrollTo(0, top);
        var h1 = $screen.querySelector('h1');
        if (h1 && !firstRender && !r.sub) h1.focus({ preventScroll: true });
      }
      afterRender(r);
    }
    syncSheet(r);
    var h1t = $screen.querySelector('h1');
    document.title = (h1t ? h1t.textContent + ' · ' : '') + 'TenderScout';
    firstRender = false;
  }
  function mood(r) {
    if (r.name === 'detail') { var t = tender(r.id); return t && readCache[r.id] ? evalT(t).verdict : 'about'; }
    return r.name === 'onb' ? 'welcome' : ['feed', 'bids', 'company'].indexOf(r.name) !== -1 ? r.name : 'about';
  }
  function afterRender(r) {
    if (r.name === 'onb' && r.step === 2) startDraft();
    if ($screen.classList.contains('entering')) { // the site's 777 counter: the pages line counts up once per Feed load
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
    clearTimeout(sheetTimer);
    if (!sheetKey) lastFocus = document.activeElement;
    sheetKey = want;
    $sheet.innerHTML = html; $sheet.hidden = false;
    $screen.inert = true; $dock.inert = true;
    document.documentElement.classList.add('sheet-open');
    void $sheet.offsetHeight; // start the slide-in from the off-screen position
    $sheet.classList.add('open');
    var title = document.getElementById('sheet-title'); if (title) title.focus({ preventScroll: true });
  }
  function hideSheet() {
    sheetKey = null;
    $sheet.classList.remove('open');
    $screen.inert = false; $dock.inert = false;
    document.documentElement.classList.remove('sheet-open');
    clearTimeout(sheetTimer);
    sheetTimer = setTimeout(function () { $sheet.hidden = true; $sheet.innerHTML = ''; }, reduceMotion ? 0 : 330);
    if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    else { var h1 = $screen.querySelector('h1'); if (h1) h1.focus({ preventScroll: true }); }
    lastFocus = null;
  }

  // ---------- toast ----------
  var toastTimer = null, toastFn = null;
  function toast(msg, action) {
    clearTimeout(toastTimer);
    toastFn = action ? action.fn : null;
    $toast.innerHTML = '<div class="toast"><span class="dot" aria-hidden="true"></span><span class="msg">' + esc(msg) + '</span>' +
      (action ? '<button type="button" data-act="toast-action">' + esc(action.label) + '</button>' : '') + '</div>';
    var el = $toast.firstChild;
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
    toastTimer = setTimeout(hideToast, 4000);
  }
  function hideToast() {
    var el = $toast.firstChild; if (!el) return;
    el.classList.remove('show');
    setTimeout(function () { if (el.parentNode === $toast) $toast.removeChild(el); }, reduceMotion ? 0 : 250);
    toastFn = null;
  }

  // ---------- actions ----------
  function answer(tid, rid, val) {
    S.overrides[tid] = S.overrides[tid] || {};
    var prev = S.overrides[tid][rid];
    if (val === 'clear') delete S.overrides[tid][rid]; else S.overrides[tid][rid] = val;
    save();
    var now = evalT(tender(tid)).verdict;
    closeSheet();
    toast(val === 'clear' ? 'Answer removed · now ' + V[now] : 'Answer saved · now ' + V[now], { label: 'Undo', fn: function () {
      S.overrides[tid] = S.overrides[tid] || {};
      if (prev) S.overrides[tid][rid] = prev; else delete S.overrides[tid][rid];
      save(); render(true);
    } });
  }
  function skipConfirm(id) {
    var reasons = (skipDraft[id] || []).slice(), prevSaved = S.saved[id];
    S.skipped[id] = { reasons: reasons, at: TODAY }; delete S.saved[id]; save();
    skipDraft[id] = [];
    collapseId = id;
    backTo('#/feed', 2);
    toast(reasons.length ? 'Skipped. Reason saved.' : 'Skipped.', { label: 'Undo', fn: function () {
      delete S.skipped[id]; if (prevSaved) S.saved[id] = prevSaved; save(); render(true);
    } });
  }
  function restore(id) {
    delete S.skipped[id]; S.saved[id] = 'Deciding'; enteringId = id; save(); render(true);
    toast('Restored to Deciding');
  }
  function setStage(id, stage) {
    if (S.saved[id] === stage) return;
    S.saved[id] = stage; enteringId = id; save(); haptic('select'); render(true);
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go],[data-act],[data-filter],[data-confirm],[data-ask],[data-skip],[data-stage],[data-unskip],[data-cert],[data-lang],[data-ref]');
    if (!el) return;
    var d = el.dataset;
    if (d.act === 'close-sheet') { var stop = e.target.closest('[data-stop]'); if (stop && el.contains(stop)) return; } // click inside the sheet
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (d.go) { e.preventDefault(); go(d.go); return; }
    if (d.filter) { S.filter = d.filter; save(); render(true); return; }
    if (d.confirm) { answer(d.t, d.r, d.confirm); return; }
    if (d.ask != null) { toggleAsk(+d.ask); return; }
    if (d.skip) {
      var sel = skipDraft[d.id] || (skipDraft[d.id] = []);
      toggle(sel, d.skip);
      var on = has(sel, d.skip);
      el.setAttribute('aria-pressed', on); el.innerHTML = (on ? icon('check', 's18') : '') + esc(d.skip);
      return;
    }
    if (d.stage) { setStage(d.id, d.stage); return; }
    if (d.unskip) { restore(d.unskip); return; }
    if (d.cert) { applyLever('cert:' + d.cert, function (p) { toggle(p.certifications, d.cert); }, el); return; }
    if (d.lang) { applyLever('lang:' + d.lang, function (p) { toggle(p.languages, d.lang); }, el); return; }
    if (d.ref) { if (S.profile.references + (+d.ref) < 0) return; applyLever('ref', function (p) { p.references = p.references + (+d.ref); }, el.closest('.stepper') || el); return; }
    switch (d.act) {
      case 'back': back(); break;
      case 'draft': draft(); break;
      case 'finish': S.onboarded = true; save(); go('#/feed'); break;
      case 'save':
        S.saved[d.id] = 'Deciding'; delete S.skipped[d.id]; save(); render(true);
        toast('Saved to Bids', { label: 'View', fn: function () { go('#/bids'); } });
        break;
      case 'xb': applyLever('xb', function (p) { p.crossBorder = !p.crossBorder; }, el); break;
      case 'close-sheet': closeSheet(); break;
      case 'skip-confirm': skipConfirm(d.id); break;
      case 'toast-action': var fn = toastFn; hideToast(); if (fn) fn(); break;
      case 'theme': S.theme = d.value; save(); applyTheme(); render(true); break;
      case 'palette': S.palette = PALETTES.indexOf(d.value) !== -1 ? d.value : 'brand'; save(); applyTheme(); render(true); break;
      case 'reset':
        if (!window.confirm('Reset the demo? This clears your profile, answers, saved and skipped tenders.')) break;
        S = fresh(); readCache = {}; answers = {}; openAsk = null; skipDraft = {}; lastChange = null; pulse = {};
        save(); applyTheme(); stack = [location.hash]; replaceTo('#/welcome/1');
        break;
    }
  });
  // Card → detail morph (motion-effects 03 "Card → workspace"): the tapped card's shape grows into the colour-block
  // header while its contents cross-fade, and a dashed ghost stays where the card was. View Transitions API with
  // feature detection; without it (or under reduced motion) the link is a plain hash change.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a.tcard');
    if (!a || !document.startViewTransition || reduceMotion || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var href = a.getAttribute('href');
    e.preventDefault();
    a.style.viewTransitionName = 'card';
    var wrap = a.closest('.tcard-wrap'); if (wrap) wrap.style.viewTransitionName = 'card-ghost';
    try {
      document.startViewTransition(function () { location.hash = href; render(); });
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
  // Touch glow (the phone's version of the site's cursor glow): a soft brand radial where the finger lands on a card, fading out on release.
  if (!reduceMotion && window.PointerEvent) {
    document.addEventListener('pointerdown', function (e) {
      var el = e.target.closest && e.target.closest('.glowable'); if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      el.classList.add('touched');
    }, { passive: true });
    var untouch = function () { Array.prototype.forEach.call(document.querySelectorAll('.glowable.touched'), function (el) { el.classList.remove('touched'); }); };
    document.addEventListener('pointerup', untouch, { passive: true });
    document.addEventListener('pointercancel', untouch, { passive: true });
  }
  window.addEventListener('online', function () { render(true); });
  window.addEventListener('offline', function () { render(true); });

  // Theme (light / dark / system) and palette (brand / sky / harbor) live on <html> as data-v3 and data-palette (HANDOFF_V2 §1 + shared/tokens.json).
  var darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme() {
    var t = S.theme === 'light' || S.theme === 'dark' ? S.theme : (darkMQ && darkMQ.matches ? 'dark' : 'light');
    var d = document.documentElement;
    d.setAttribute('data-v3', t); d.setAttribute('data-palette', PALETTES.indexOf(S.palette) !== -1 ? S.palette : 'brand');
    paintThemeColor();
  }
  function paintThemeColor() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--v-bg').trim() || getComputedStyle(document.body).backgroundColor);
  }
  if (darkMQ) { var onMQ = function () { if (S.theme !== 'light' && S.theme !== 'dark') applyTheme(); }; if (darkMQ.addEventListener) darkMQ.addEventListener('change', onMQ); else if (darkMQ.addListener) darkMQ.addListener(onMQ); }
  applyTheme();
  render();
})();
