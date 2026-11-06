#!/usr/bin/env node
/*
 * tests/docs-check.js — keeps the flow, IA and story documents in step with the code and the evidence (6 Nov 2026).
 *
 *   node tests/docs-check.js            exit 1 with one line per finding; every message names the file and the item
 *
 * No dependencies. Every list below is derived from the sources, not typed here:
 *   (a) Routes and tabs. Every route parse() in app.js accepts (its h[0] === '…' and h[2] === '…' comparisons, the array
 *       literal of top-level routes before .indexOf(h[0]), the welcome steps from `step: +(h[1] || N)` and render()'s
 *       r.step === N, and the Not found fallback) appears in docs/NAVIGATION.md and in SKELETON.md as #/<route>, with
 *       :id for h[1] and any :name for h[3] (#/t/:id/req/:rid). Every tab in app.js TABS has a row in NAVIGATION.md's
 *       Structure table (**Label** and its route), the number word before "tabs" in that section equals TABS.length,
 *       and every `[tab bar]` line in SKELETON.md lists the tab labels in TABS order (the active one marked *).
 *   (b) Named checks. In docs/design/USER_STORIES.md and docs/NAVIGATION.md a check is written as its kind followed by
 *       its exact name in backticks: smoke `…` (a check message in tests/smoke.js), engine `…`, golden `…` or
 *       insights `…` (a test name in tests/engine.test.js, tests/demo-golden.test.js, tests/insights.test.js).
 *       Several names may follow one kind: smoke `A`, `B` and `C`. Each name must exist verbatim. For a smoke message
 *       built at run time ('injected ' + kind + ': plain screen …'), name one of its fixed parts (12 characters or more).
 *       Skipped: the placeholder `…` (where the convention is described), a route (`#/…`) and a file name. A kind
 *       followed by a straight-quoted name (smoke "…") is flagged, so the unchecked form cannot come back. The invariants
 *       and the data check build their messages at run time, so stories describe them in words; they are not checked here.
 *   (c) Interview citations. Every "Interview N", "interview #N" or "Interviews N and M" in docs/design/*.md must be a
 *       filled row of evidence.md §1 (a row whose Role cell is not empty). Today no row is filled and nothing cites one.
 *   (d) Participant quotes. Curly double quotes “…” in docs/design/*.md are reserved for a participant's own words: the
 *       text inside must appear verbatim in evidence.md (whitespace collapsed). On a line that attributes words to a
 *       participant (Interview N, interview #N, S1 said / wrote / answered / told us, respondent S1, (S1)), straight-quoted
 *       text "…" outside backticks must appear verbatim too, and so must a blockquote that opens with a quotation mark
 *       (> "…"). App copy is quoted with straight quotes; a user story is a blockquote that opens with "As the owner".
 *       So "Interview 3 said “…”" fails twice until interview 3 and its quote are logged in evidence.md.
 * The conventions for writers are at the top of docs/design/USER_STORIES.md.
 * A self-test runs first, on small in-memory fixtures (one good set, one bad set): the good set must pass every check and
 * the bad set must fail each of them, so a check that can no longer fail is caught too.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const squash = (s) => String(s).replace(/\s+/g, ' ').trim();
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- a small JavaScript tokenizer: strings (with their fixed parts), identifiers, punctuation ---------- */
function tokens(src) {
  const out = [];
  let i = 0, prev = null;
  const n = src.length;
  const push = (tok) => { out.push(tok); prev = tok; };
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1, v = '';
      while (j < n && src[j] !== c) {
        if (src[j] === '\\') { const e = src[j + 1]; v += e === 'n' ? '\n' : e === 't' ? '\t' : e; j += 2; continue; }
        if (c === '`' && src[j] === '$' && src[j + 1] === '{') { // a template expression is a run-time part
          let depth = 1; j += 2;
          while (j < n && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
          v += '\u0000'; continue;
        }
        v += src[j]; j++;
      }
      push({ t: 'str', v: v, parts: v.split('\u0000') }); i = j + 1; continue;
    }
    const regexStart = c === '/' && (!prev || (prev.t === 'p' && /[(,=:[!&|?{};+\-*%<>~^]/.test(prev.v)) || (prev.t === 'id' && /^(return|typeof|case|in|of|void|else)$/.test(prev.v)));
    if (regexStart) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== '\n') { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; j++; }
      j++; while (j < n && /[a-z]/i.test(src[j])) j++;
      push({ t: 're', v: src.slice(i, j) }); i = j; continue;
    }
    if (/[A-Za-z_$]/.test(c)) { let j = i; while (j < n && /[\w$]/.test(src[j])) j++; push({ t: 'id', v: src.slice(i, j) }); i = j; continue; }
    if (/[0-9]/.test(c)) { let j = i; while (j < n && /[\w.]/.test(src[j])) j++; push({ t: 'num', v: src.slice(i, j) }); i = j; continue; }
    push({ t: 'p', v: c }); i++;
  }
  return out;
}
// Every call of `name(…)` (not a definition, not a method): an array of arguments, each an array of tokens.
function calls(toks, name) {
  const found = [];
  for (let k = 0; k < toks.length - 1; k++) {
    if (toks[k].t !== 'id' || toks[k].v !== name || toks[k + 1].t !== 'p' || toks[k + 1].v !== '(') continue;
    const before = toks[k - 1];
    if (before && ((before.t === 'id' && before.v === 'function') || (before.t === 'p' && before.v === '.'))) continue;
    const args = [[]];
    let depth = 0;
    for (let j = k + 1; j < toks.length; j++) {
      const t = toks[j];
      if (t.t === 'p' && '([{'.indexOf(t.v) !== -1) { depth++; if (depth === 1) continue; }
      else if (t.t === 'p' && ')]}'.indexOf(t.v) !== -1) { depth--; if (depth === 0) break; }
      else if (t.t === 'p' && t.v === ',' && depth === 1) { args.push([]); continue; }
      args[args.length - 1].push(t);
    }
    found.push(args);
  }
  return found;
}
const trimSep = (s) => s.replace(/^[\s:·,;("'—–-]+|[\s:·,;("'—–=-]+$/g, '');
// The names a smoke check can be cited by: the whole message when it is one literal, else each fixed part of 12
// characters or more (without the separators around it), so a stray "of" or ")" never counts as a check.
function smokeNames(src) {
  const names = new Set();
  calls(tokens(src), 'check').forEach((args) => {
    if (args.length < 2) return;
    const msg = args[args.length - 1];
    if (msg.length === 1 && msg[0].t === 'str' && msg[0].parts.length === 1) { names.add(msg[0].v.trim()); return; }
    msg.filter((t) => t.t === 'str').forEach((t) => t.parts.forEach((p) => {
      [p.trim(), trimSep(p)].forEach((x) => { if (x.length >= 12) names.add(x); });
    }));
  });
  return names;
}
// Test names: the first argument of test('…', …) when it is a single literal.
function testNames(src) {
  const names = new Set();
  calls(tokens(src), 'test').forEach((args) => { if (args[0] && args[0].length === 1 && args[0][0].t === 'str') names.add(args[0][0].v); });
  return names;
}

/* ---------- (a) routes and tabs ---------- */
function deriveRoutes(appSrc) {
  const start = appSrc.indexOf('function parse()');
  if (start === -1) return { error: 'function parse() not found' };
  const open = appSrc.indexOf('{', start);
  let depth = 0, end = open;
  for (; end < appSrc.length; end++) { if (appSrc[end] === '{') depth++; else if (appSrc[end] === '}' && --depth === 0) break; }
  const body = appSrc.slice(open, end + 1);
  const routes = []; // { doc, re }
  const add = (doc, re) => { if (!routes.some((r) => r.doc === doc)) routes.push({ doc: doc, re: re }); };
  const top = [];
  body.replace(/h\[0\] === '([\w-]+)'/g, (m, x) => { if (top.indexOf(x) === -1) top.push(x); return m; });
  body.replace(/\[([^\]]*)\]\.indexOf\(h\[0\]\)/g, (m, list) => { list.replace(/'([\w-]+)'/g, (m2, x) => { if (top.indexOf(x) === -1) top.push(x); return m2; }); return m; });
  const withId = [];
  body.replace(/h\[0\] === '([\w-]+)' && h\[1\]/g, (m, x) => { withId.push(x); return m; });
  const stepped = {};
  body.replace(/h\[0\] === '([\w-]+)'\) return \{[^}]*step: \+\(h\[1\] \|\| (\d+)\)/g, (m, x, d) => { stepped[x] = [+d]; return m; });
  const steps = [];
  appSrc.replace(/\br\.step === (\d+)/g, (m, d) => { if (steps.indexOf(+d) === -1) steps.push(+d); return m; });
  top.forEach((x) => {
    if (stepped[x]) {
      stepped[x].concat(steps).sort((u, v) => u - v).forEach((s) => add('#/' + x + '/' + s, new RegExp('#/' + reEsc(x) + '/' + s + '(?!\\d)')));
    } else if (withId.indexOf(x) !== -1) {
      add('#/' + x + '/:id', new RegExp('#/' + reEsc(x) + '/:id(?![\\w/])'));
    } else {
      add('#/' + x, new RegExp('#/' + reEsc(x) + '(?![\\w-])'));
    }
  });
  // sub-routes: each h[2] === '…' belongs to the nearest h[0] === '…' && h[1] before it
  let parent = null;
  body.replace(/h\[0\] === '([\w-]+)' && h\[1\]|h\[2\] === '([\w-]+)'( && h\[3\])?/g, (m, p, sub, deeper) => {
    if (p) { parent = p; return m; }
    if (!parent) return m;
    add('#/' + parent + '/:id/' + sub + (deeper ? '/:rid' : ''), new RegExp('#/' + reEsc(parent) + '/:id/' + reEsc(sub) + (deeper ? '/:\\w+' : '(?![\\w/])')));
    return m;
  });
  const notFound = /name: 'notfound'/.test(body);
  const tabs = [];
  const tm = /var TABS = (\[[\s\S]*?\]\]);/.exec(appSrc);
  if (tm) tm[1].replace(/\['([\w-]+)', '([^']+)', '([\w-]+)', '([^']+)'\]/g, (m, key, route, ic, label) => { tabs.push({ key: key, route: route, label: label }); return m; });
  return { routes: routes, notFound: notFound, tabs: tabs, tabsFound: !!tm };
}
function section(md, heading) {
  const m = heading.exec(md);
  if (!m) return null;
  const rest = md.slice(m.index + m[0].length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
function checkRoutes(src) {
  const problems = [];
  const d = deriveRoutes(src.app);
  if (d.error) return { problems: ['app.js: ' + d.error], derived: d };
  if (!d.routes.length) problems.push('app.js: parse() yields no routes (the derivation no longer matches the router)');
  [['docs/NAVIGATION.md', src.nav], ['SKELETON.md', src.skeleton]].forEach(([file, md]) => {
    d.routes.forEach((r) => { if (!r.re.test(md)) problems.push(file + ': route ' + r.doc + ' (accepted by parse() in app.js) is not mentioned'); });
  });
  if (d.notFound && !/not found/i.test(src.nav)) problems.push('docs/NAVIGATION.md: parse() falls back to Not found for any other route, but the page never says "Not found"');
  if (!d.tabsFound || !d.tabs.length) { problems.push('app.js: var TABS = [[key, route, icon, label], …] not found'); return { problems: problems, derived: d }; }
  const structure = section(src.nav, /^## Structure[^\n]*$/m);
  if (structure === null) problems.push('docs/NAVIGATION.md: no "## Structure" section (the tab table lives there)');
  else {
    const rows = structure.split('\n').filter((l) => /^\|/.test(l));
    d.tabs.forEach((t) => {
      if (!rows.some((l) => l.indexOf('**' + t.label + '**') !== -1 && l.indexOf(t.route) !== -1)) problems.push('docs/NAVIGATION.md: the Structure table has no row for the ' + t.label + ' tab (**' + t.label + '** and `' + t.route + '`, from TABS in app.js)');
    });
    const word = /\b(one|two|three|four|five|six|seven|eight|nine|ten) tabs\b/i.exec(structure);
    if (!word) problems.push('docs/NAVIGATION.md: the Structure section does not say how many tabs there are ("' + NUMBER_WORDS[d.tabs.length] + ' tabs")');
    else if (NUMBER_WORDS.indexOf(word[1].toLowerCase()) !== d.tabs.length) problems.push('docs/NAVIGATION.md: the Structure section says "' + word[0] + '" but TABS in app.js has ' + d.tabs.length);
  }
  const want = d.tabs.map((t) => t.label).join(' | ');
  let bars = 0;
  src.skeleton.split('\n').forEach((line, i) => {
    const m = /^\[tab bar\]\s+(.*)$/.exec(line);
    if (!m) return;
    bars++;
    const got = m[1].split(/\s{2,}/)[0].split('|').map((x) => x.trim().replace(/\*$/, '')).join(' | ');
    if (got !== want) problems.push('SKELETON.md:' + (i + 1) + ': [tab bar] lists "' + got + '", TABS in app.js is "' + want + '"');
  });
  if (!bars) problems.push('SKELETON.md: no [tab bar] line in any wireframe');
  return { problems: problems, derived: d };
}

/* ---------- (b) named checks ---------- */
const NOT_A_NAME = /^(…|\.\.\.)$|^#\/|\.(js|md|json|css|html)$/;
const KIND_FILE = { smoke: 'tests/smoke.js', engine: 'tests/engine.test.js', golden: 'tests/demo-golden.test.js', insights: 'tests/insights.test.js' };
function checkNamedChecks(docs, known) {
  const problems = [], counts = { smoke: 0, engine: 0, golden: 0, insights: 0 };
  Object.keys(docs).forEach((file) => {
    const md = docs[file];
    const named = /\b(smoke|engine|golden|insights) (`[^`\n]+`(?:(?:,? and |, | or )`[^`\n]+`)*)/g;
    let m;
    while ((m = named.exec(md))) {
      const kind = m[1], at = lineOf(md, m.index);
      m[2].replace(/`([^`\n]+)`/g, (all, name) => {
        if (NOT_A_NAME.test(name)) return all; // the placeholder `…`, a route (Win/loss insights `#/insights`) or a file (the engine `engine.js`)
        counts[kind]++;
        if (!known[kind].has(name)) problems.push(file + ':' + at + ': ' + kind + ' `' + name + '` is not a ' + (kind === 'smoke' ? 'check message' : 'test name') + ' in ' + KIND_FILE[kind]);
        return all;
      });
    }
    const old = /\b(smoke|engine|golden|insights) "/g;
    while ((m = old.exec(md))) problems.push(file + ':' + lineOf(md, m.index) + ': write the ' + m[1] + ' check name in backticks (' + m[1] + ' `…`), so this file can check it');
  });
  return { problems: problems, counts: counts };
}

/* ---------- (c) interview citations and (d) participant quotes ---------- */
function interviewRows(evidence) {
  const sec = section(evidence, /^## 1\. Interview log[^\n]*$/m);
  if (sec === null) return null;
  const rows = sec.split('\n').filter((l) => /^\|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  if (!rows.length) return {};
  const head = rows[0], num = head.indexOf('#'), role = head.indexOf('Role');
  const out = {};
  rows.slice(1).forEach((r) => { if (/^-+$/.test(r[0] || '')) return; if (/^\d+$/.test(r[num] || '')) out[r[num]] = (r[role] || '') !== ''; });
  return out;
}
const CITE = /\binterviews?\s*#?\s*(\d+)((?:\s*(?:,|and|&|or|to|–|-)\s*#?\s*\d+)*)/gi;
function citedNumbers(m) {
  const nums = [+m[1]];
  let last = +m[1];
  (m[2] || '').replace(/\s*(,|and|&|or|to|–|-)\s*#?\s*(\d+)/gi, (all, sep, d) => {
    if (/^(to|–|-)$/i.test(sep)) for (let k = last + 1; k < +d; k++) nums.push(k);
    nums.push(+d); last = +d; return all;
  });
  return nums;
}
function checkInterviewCitations(design, evidence) {
  const problems = [];
  const rows = interviewRows(evidence);
  let cited = 0;
  if (rows === null) return { problems: ['evidence.md: no "## 1. Interview log" section, so interview citations cannot be checked'], cited: 0 };
  Object.keys(design).forEach((file) => {
    const md = design[file];
    let m;
    CITE.lastIndex = 0;
    while ((m = CITE.exec(md))) {
      citedNumbers(m).forEach((n) => {
        cited++;
        if (!(String(n) in rows)) problems.push(file + ':' + lineOf(md, m.index) + ': cites interview ' + n + ', but evidence.md §1 has no row ' + n);
        else if (!rows[String(n)]) problems.push(file + ':' + lineOf(md, m.index) + ': cites interview ' + n + ', but row ' + n + ' of evidence.md §1 is empty (no Role): log the interview before citing it');
      });
    }
  });
  return { problems: problems, cited: cited };
}
const ATTRIBUTED = /\binterviews?\s*#?\s*\d+|\brespondent\s+S\d+\b|\bS\d+\s+(?:said|says|wrote|writes|answered|answers|told)\b|\(S\d+\)/i;
function checkParticipantQuotes(design, evidence) {
  const problems = [], ev = squash(evidence);
  let quotes = 0;
  const need = (file, at, text, how) => {
    const q = squash(text); if (!q) return;
    quotes++;
    if (ev.indexOf(q) === -1) problems.push(file + ':' + at + ': ' + how + ' "' + q.slice(0, 80) + (q.length > 80 ? '…' : '') + '" is not in evidence.md word for word');
  };
  Object.keys(design).forEach((file) => {
    const md = design[file];
    let m;
    const curly = /“([^”]*)”/g;
    while ((m = curly.exec(md))) need(file, lineOf(md, m.index), m[1], 'the participant quote');
    md.split('\n').forEach((line, i) => {
      const bq = /^\s*>\s*"([^"\n]+)"/.exec(line); // a blockquote that opens with a quotation mark is a quote (stories open with "As the owner")
      if (bq) need(file, i + 1, bq[1], 'the quoted blockquote');
      if (!ATTRIBUTED.test(line)) return;
      line.replace(/`[^`]*`/g, '').replace(/"([^"\n]+)"/g, (all, q) => { if (!bq || q !== bq[1]) need(file, i + 1, q, 'the quote attributed on this line'); return all; });
    });
  });
  return { problems: problems, quotes: quotes };
}

function runAll(src) {
  const known = { smoke: smokeNames(src.smoke), engine: testNames(src.engine), golden: testNames(src.golden), insights: testNames(src.insights) };
  const a = checkRoutes(src);
  const b = checkNamedChecks(src.named, known);
  const c = checkInterviewCitations(src.design, src.evidence);
  const d = checkParticipantQuotes(src.design, src.evidence);
  return { a: a, b: b, c: c, d: d, known: known };
}

/* ---------- self-test: the checks pass on a good fixture and fail on a bad one ---------- */
function selfTest() {
  const app = [
    "var TABS = [['feed', '#/feed', 'radar', 'Feed'], ['bids', '#/bids', 'bookmarks', 'Bids']];",
    'function parse() {',
    "  var h = location.hash.replace(/^#\\/?/, '').split('/').filter(Boolean);",
    "  if (h[0] === 'welcome') return { name: 'onb', step: +(h[1] || 1) };",
    "  if (h[0] === 't' && h[1]) {",
    "    if (h[2] === 'req' && h[3]) return { name: 'detail', id: h[1], sub: { kind: 'req', id: h[3] } };",
    "    if (h.length === 2) return { name: 'detail', id: h[1] };",
    '  }',
    "  if (h.length === 1 && ['feed', 'bids'].indexOf(h[0]) !== -1) return { name: h[0] };",
    "  return { name: 'notfound' };",
    '}',
    "function render(r) { return r.step === 2 ? 'reading' : 'welcome'; }"
  ].join('\n');
  const smoke = "check(a === 1, 'feed title \"6 new tenders\"');\ncheck(b, 'injected ' + kind + ': plain screen with Restart');\nfunction check(c, m) {}";
  const engine = "test('clean match is Go', () => {});";
  const evidence = [
    '## 1. Interview log', '| # | Role | Sector |', '|---|---|---|', '| 1 | Owner / MD | IT |', '| 2 | | |', '',
    '## 2. Interview notes', 'Quotes:', '  - "We check every tender by hand."'
  ].join('\n');
  const routesDoc = '`#/welcome/1` `#/welcome/2` `#/t/:id` `#/t/:id/req/:rid` Not found';
  const good = {
    app: app, smoke: smoke, engine: engine, golden: '', insights: '', evidence: evidence,
    nav: '## Structure\nTwo tabs:\n| Tab | Question | Route |\n|---|---|---|\n| **Feed** | q | `#/feed` |\n| **Bids** | q | `#/bids` |\n\n## Screen list\n' + routesDoc + '\n',
    skeleton: '### Feed · `#/feed` and `#/bids`\n' + routesDoc + '\n[tab bar]   Feed* | Bids        (before onboarding: none)\n',
    named: { 'USER_STORIES.md': 'Locked by smoke `feed title "6 new tenders"` and `plain screen with Restart`, and engine `clean match is Go`. Win/loss insights `#/insights`; the engine `engine.js`; smoke `…`.' },
    design: { 'X.md': 'Interview 1 said “We check every tender by hand.” S1 wrote "We check every tender by hand."\n> "We check every tender by hand." (interview #1)\n> As the owner, I want a story, so that it is not a quote.\nApp copy such as "Save to Bids" is not a quote here.' }
  };
  const bad = {
    app: app, smoke: smoke, engine: engine, golden: '', insights: '', evidence: evidence,
    nav: '## Structure\nThree tabs:\n| Tab | Question | Route |\n|---|---|---|\n| **Feed** | q | `#/feed` |\n\n## Screen list\n`#/welcome/1` `#/t/:id` `#/bids`\n',
    skeleton: '### Feed · `#/feed` `#/bids` ' + routesDoc + '\n[tab bar]   Feed | Settings*\n',
    named: { 'USER_STORIES.md': 'Locked by smoke `a check nobody wrote` and engine `no such test`, and smoke "feed title".' },
    design: { 'X.md': 'Interview 2 said “We never read French tenders.”\nInterviews 7 and 9 agree.\nS1 wrote "We bid every week."\n> "Portals never tell us if we qualify." (owner, 12 staff)\n> As the owner, I want a story, so that it is not a quote.' }
  };
  const fails = [];
  const g = runAll(good);
  ['a', 'b', 'c', 'd'].forEach((k) => { if (g[k].problems.length) fails.push('(' + k + ') flags the good fixture: ' + g[k].problems.join(' | ')); });
  const routesGot = g.a.derived.routes.map((r) => r.doc).join(' ');
  if (routesGot !== '#/welcome/1 #/welcome/2 #/t/:id #/feed #/bids #/t/:id/req/:rid') fails.push('(a) derives "' + routesGot + '" from the fixture router');
  const b2 = runAll(bad);
  const expect = {
    a: ['route #/welcome/2', 'route #/t/:id/req/:rid', 'no row for the Bids tab', 'says "Three tabs" but TABS in app.js has 2', '[tab bar] lists "Feed | Settings"'],
    b: ['smoke `a check nobody wrote`', 'engine `no such test`', 'write the smoke check name in backticks'],
    c: ['row 2 of evidence.md §1 is empty', 'no row 7', 'no row 9'],
    d: ['"We never read French tenders."', '"We bid every week."', 'the quoted blockquote "Portals never tell us if we qualify."']
  };
  Object.keys(expect).forEach((k) => expect[k].forEach((s) => {
    if (!b2[k].problems.some((p) => p.indexOf(s) !== -1)) fails.push('(' + k + ') does not flag ' + s + ' on the bad fixture (got: ' + (b2[k].problems.join(' | ') || 'nothing') + ')');
  }));
  return fails;
}

/* ---------- run ---------- */
const problems = [];
const self = selfTest();
self.forEach((p) => problems.push('self-test: ' + p));

const STORY = 'docs/design/USER_STORIES.md', NAV = 'docs/NAVIGATION.md';
const designDir = path.join(ROOT, 'docs', 'design');
const design = {};
fs.readdirSync(designDir).filter((f) => /\.md$/.test(f)).sort().forEach((f) => { design['docs/design/' + f] = read('docs/design/' + f); });
const src = {
  app: read('app.js'), nav: read(NAV), skeleton: read('SKELETON.md'), evidence: read('evidence.md'),
  smoke: read('tests/smoke.js'), engine: read('tests/engine.test.js'), golden: read('tests/demo-golden.test.js'), insights: read('tests/insights.test.js'),
  named: { [STORY]: read(STORY), [NAV]: read(NAV) }, design: design
};
const r = runAll(src);
['a', 'b', 'c', 'd'].forEach((k) => r[k].problems.forEach((p) => problems.push('(' + k + ') ' + p)));

if (problems.length) {
  console.error('docs-check: ' + problems.length + ' problem(s):');
  problems.forEach((p) => console.error('  FAIL ' + p));
  process.exitCode = 1;
} else {
  const n = r.b.counts;
  console.log('docs-check: ok · (a) ' + r.a.derived.routes.length + ' routes from parse() (' + r.a.derived.routes.map((x) => x.doc).join(', ') + ', Not found) in ' + NAV + ' and SKELETON.md, ' +
    r.a.derived.tabs.length + ' tabs from TABS (' + r.a.derived.tabs.map((t) => t.label).join(', ') + ') · (b) ' + n.smoke + ' smoke, ' + n.engine + ' engine, ' + n.golden + ' golden and ' + n.insights + ' insights check names found verbatim · (c) ' +
    r.c.cited + ' interview citations · (d) ' + r.d.quotes + ' participant quotes · self-test: every check passes the good fixture and fails the bad one');
}
