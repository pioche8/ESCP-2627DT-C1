/*
 * design/figma/dry-run.js — runs every generated Figma script (design/figma/out/figma/NN-*.js) in order against a small
 * in-memory stand-in for the Figma Plugin API that models the current file (pages, variables, the iOS components, the
 * first-attempt frames and sections). It cannot prove Figma's own behaviour, but it catches script errors, missing
 * layers (every prototype link must find its node in the generated frames), photo checksum mismatches and what each
 * script would create or remove, before a real call is spent: the Starter plan caps MCP calls.
 *
 *   node design/figma/dry-run.js      (after capture.js and make-batches.js)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'figma.config.json'), 'utf8'));
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'shared', 'tokens.json'), 'utf8'));
const DIR = path.join(process.env.OUT || path.join(__dirname, 'out'), 'figma');

// ---------- the stand-in ----------
let seq = 1000;
const registry = new Map();
const CONTAINERS = new Set(['PAGE', 'FRAME', 'SECTION', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'GROUP']);
function node(type, id) {
  const n = { id: id || ('9:' + (seq++)), type, name: type.toLowerCase(), x: 0, y: 0, width: 100, height: 100, parent: null, fills: [], strokes: [], visible: true };
  registry.set(n.id, n);
  if (CONTAINERS.has(type)) {
    n.children = [];
    n.appendChild = (c) => { if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1); c.parent = n; n.children.push(c); };
    n.insertChild = (i, c) => { if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1); c.parent = n; n.children.splice(i, 0, c); };
    n.findAll = (pred) => { const out = []; const walk = (x) => { for (const c of x.children || []) { if (!pred || pred(c)) out.push(c); walk(c); } }; walk(n); return out; };
    n.findOne = (pred) => n.findAll(pred)[0] || null;
    n.findAllWithCriteria = (q) => n.findAll((c) => q.types.indexOf(c.type) !== -1);
  }
  n.remove = () => { if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1); n.parent = null; n.removed = true; };
  n.resize = n.resizeWithoutConstraints = (w, h) => { if (!(w > 0 && h > 0)) throw new Error('resize: ' + n.name + ' ' + w + '×' + h); n.width = w; n.height = h; };
  n.screenshot = async () => 'png';
  n.setReactionsAsync = async (r) => { for (const x of r) for (const a of x.actions) if (a.destinationId && !registry.has(a.destinationId)) throw new Error('reaction to unknown node ' + a.destinationId); n.reactions = r; };
  n.clone = () => { const c = node(n.type); for (const k of Object.keys(n)) if (!['id', 'parent', 'children', 'appendChild', 'insertChild', 'findAll', 'findOne', 'findAllWithCriteria', 'remove', 'resize', 'resizeWithoutConstraints', 'screenshot', 'setReactionsAsync', 'clone', 'setRangeFills', 'setRangeFontName', 'setRangeFontSize', 'setRangeTextDecoration', 'setRangeTextDecorationThickness', 'setRangeTextDecorationOffset', 'getStyledTextSegments', 'setTextStyleIdAsync', 'createInstance', 'loadAsync'].includes(k)) c[k] = JSON.parse(JSON.stringify(n[k] === undefined ? null : n[k])); if (n.children) for (const ch of n.children) c.appendChild(ch.clone()); if (n.type === 'TEXT') textApi(c); if (n.createInstance) c.createInstance = n.createInstance; n.parent && n.parent.appendChild(c); return c; };
  if (type === 'TEXT') textApi(n);
  if (type === 'PAGE') { n.loadAsync = async () => {}; n.flowStartingPoints = []; }
  if (type === 'COMPONENT') n.createInstance = () => { const i = n.clone(); i.type = 'INSTANCE'; i.parent && i.parent.children.splice(i.parent.children.indexOf(i), 1); i.parent = null; figma.currentPage.appendChild(i); return i; };
  return n;
}
function textApi(n) {
  n.characters = n.characters || ''; n.fontName = n.fontName || { family: 'Inter', style: 'Regular' }; n.segs = n.segs || [];
  const seg = (s, e, k, v) => { if (!figma._fonts.has(n.fontName.family + '|' + n.fontName.style) && k !== 'fontName') throw new Error('unloaded font ' + JSON.stringify(n.fontName) + ' on "' + n.characters.slice(0, 20) + '"'); if (e > n.characters.length || s < 0) throw new Error('range ' + s + '–' + e + ' outside "' + n.characters + '"'); n.segs.push({ s, e, k, v }); };
  n.setRangeFills = (s, e, v) => seg(s, e, 'fills', v);
  n.setRangeFontName = (s, e, v) => { if (!figma._fonts.has(v.family + '|' + v.style)) throw new Error('unloaded font ' + v.family + ' ' + v.style); seg(s, e, 'fontName', v); };
  n.setRangeFontSize = (s, e, v) => seg(s, e, 'fontSize', v);
  n.setRangeTextDecoration = (s, e, v) => seg(s, e, 'dec', v);
  n.setRangeTextDecorationThickness = (s, e, v) => seg(s, e, 'th', v);
  n.setRangeTextDecorationOffset = (s, e, v) => seg(s, e, 'off', v);
  n.getStyledTextSegments = (keys) => [{ start: 0, end: Math.max(1, n.characters.length), fills: n.fills.length ? n.fills : (n.segs.filter((x) => x.k === 'fills').map((x) => x.v)[0] || []), fontName: n.fontName }];
  n.setTextStyleIdAsync = async (id) => { n.textStyleId = id; };
  Object.defineProperty(n, 'width', { get() { return n.textAutoResize === 'WIDTH_AND_HEIGHT' ? n.characters.length * (n.fontSize || 12) * 0.55 : (n._w || 100); }, set(v) { n._w = v; }, configurable: true, enumerable: true });
}
const pages = { overview: node('PAGE', cfg.pages.overview), dark: node('PAGE', cfg.pages.dark), light: node('PAGE', cfg.pages.light) };
pages.overview.name = 'TenderScout app'; pages.dark.name = 'Page 2'; pages.light.name = 'Page 3';
const figma = {
  _fonts: new Set(['Inter|Regular']),
  root: { children: [pages.overview, pages.dark, pages.light] },
  currentPage: pages.overview,
  async setCurrentPageAsync(p) { if (!p || p.type !== 'PAGE') throw new Error('setCurrentPageAsync needs a page'); figma.currentPage = p; },
  async getNodeByIdAsync(id) { const n = registry.get(id); return n && !n.removed ? n : null; },
  async loadFontAsync(f) { figma._fonts.add(f.family + '|' + f.style); },
  createFrame() { const n = node('FRAME'); n.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; figma.currentPage.appendChild(n); return n; },
  createText() { const n = node('TEXT'); figma.currentPage.appendChild(n); return n; },
  createRectangle() { const n = node('RECTANGLE'); figma.currentPage.appendChild(n); return n; },
  createEllipse() { const n = node('ELLIPSE'); figma.currentPage.appendChild(n); return n; },
  createPolygon() { const n = node('POLYGON'); figma.currentPage.appendChild(n); return n; },
  createComponent() { const n = node('COMPONENT'); figma.currentPage.appendChild(n); return n; },
  createSection() { const n = node('SECTION'); figma.currentPage.appendChild(n); return n; },
  createAutoLayout(dir, props) { if (typeof dir === 'object') { props = dir; dir = 'HORIZONTAL'; } const n = figma.createFrame(); n.layoutMode = dir || 'HORIZONTAL'; Object.assign(n, props || {}); return n; },
  combineAsVariants(nodes, parent) { if (!nodes.length || nodes.some((c) => c.type !== 'COMPONENT')) throw new Error('combineAsVariants needs components'); const s = node('COMPONENT_SET'); parent.appendChild(s); nodes.forEach((c) => s.appendChild(c)); return s; },
  createTextStyle() { const s = { id: 'S:' + (seq++), name: '' }; figma._styles.push(s); return s; },
  _styles: [],
  async getLocalTextStylesAsync() { return figma._styles.slice(); },
  base64Decode(b64) { if (/[^A-Za-z0-9+/=]/.test(b64)) throw new Error('Invalid base64 string'); return new Uint8Array(Buffer.from(b64, 'base64')); },
  createImage(bytes) { if (!(bytes instanceof Uint8Array) || !bytes.length) throw new Error('createImage needs bytes'); return { hash: 'h' + bytes.length }; },
  variables: {
    _c: {}, _v: {},
    async getVariableCollectionByIdAsync(id) { return figma.variables._c[id] || null; },
    async getVariableByIdAsync(id) { return figma.variables._v[id] || null; },
    setBoundVariableForPaint(p, field, v) { if (!v || !v.id) throw new Error('setBoundVariableForPaint: no variable (check the token name)'); return Object.assign({}, p, { boundVariables: { color: { type: 'VARIABLE_ALIAS', id: v.id } } }); },
  },
};
// variables: nine colours per collection
for (const [scheme, cid] of [['dark', cfg.collections.dark], ['light', cfg.collections.light]]) {
  const modeId = cid + ':m';
  const c = figma.variables._c[cid] = { id: cid, name: scheme, modes: [{ modeId, name: scheme }], variableIds: [] };
  for (const [k, hex] of Object.entries(tokens.color.themes[scheme])) {
    const id = 'VariableID:' + scheme + ':' + k;
    figma.variables._v[id] = { id, name: 'color/' + k, variableCollectionId: cid, valuesByMode: { [modeId]: { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255, a: 1 } } };
    c.variableIds.push(id);
  }
}
// the current file: components, first-attempt sections, the first 11 frames on each iPhone page
figma.currentPage = pages.overview;
const compSection = node('SECTION', cfg.components.section); pages.overview.appendChild(compSection); compSection.name = 'Components · iOS chrome';
const sb = node('COMPONENT', cfg.components.statusBar); compSection.appendChild(sb); sb.name = 'iOS / Status bar';
const t = node('TEXT'); sb.appendChild(t); t.characters = '9:41'; t.name = 'Time'; t.fills = [{ type: 'SOLID', boundVariables: { color: { id: 'VariableID:dark:ink' } } }];
for (const nm of ['Signal', 'Wi-Fi', 'Battery']) { const f = node('FRAME'); sb.appendChild(f); f.name = nm; const v = node('VECTOR'); f.appendChild(v); v.fills = [{ type: 'SOLID', boundVariables: { color: { id: 'VariableID:dark:ink' } } }]; }
const hi = node('COMPONENT', cfg.components.homeIndicator); compSection.appendChild(hi); hi.name = 'iOS / Home indicator'; hi.fills = [{ type: 'SOLID', boundVariables: { color: { id: 'VariableID:dark:ink' } } }];
for (const r of cfg.cleanup) { const s = node(r.type, r.id); pages.overview.appendChild(s); s.name = r.name + ' (first attempt)'; }
const user = node('INSTANCE', '14:994'); pages.overview.appendChild(user); user.name = 'Context Menu';
for (const p of [pages.dark, pages.light]) for (const nm of cfg.legacyFrames) { const f = node('FRAME'); p.appendChild(f); f.name = nm; }

// ---------- run ----------
(async () => {
  if (!fs.existsSync(DIR)) { console.error('No scripts in ' + DIR + ': run capture.js and make-batches.js first.'); process.exit(2); }
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  let failed = 0;
  for (const f of fs.readdirSync(DIR).filter((x) => /^\d\d-.*\.js$/.test(x)).sort()) {
    const code = fs.readFileSync(path.join(DIR, f), 'utf8');
    try {
      figma.currentPage = pages.overview; // every use_figma call starts on the first page
      const res = await new AsyncFunction('figma', code)(figma);
      const flat = JSON.stringify(res);
      const problems = [];
      const scan = (o, at) => { if (!o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if ((k === 'errors' || k === 'missing' || k === 'bad') && Array.isArray(v) && v.length) problems.push(at + k + ': ' + v.slice(0, 6).join(' | ')); if (k === 'error') problems.push(at + 'error: ' + v); if (v && typeof v === 'object') scan(v, at + k + '.'); } };
      scan(res, '');
      if (problems.length) failed++;
      console.log((problems.length ? 'WARN ' : 'ok   ') + f + '  ' + flat.length + ' B result' + (problems.length ? '\n       ' + problems.join('\n       ') : ''));
    } catch (e) { failed++; console.log('FAIL ' + f + '  ' + String(e && e.stack || e).split('\n').slice(0, 3).join(' / ')); }
  }
  const frames = (p) => p.children.filter((c) => c.type === 'FRAME').map((c) => c.name);
  console.log('\nafter the run: dark page ' + frames(pages.dark).length + ' frames, light page ' + frames(pages.light).length + ' frames · pages: ' + figma.root.children.map((p) => p.name).join(' | '));
  console.log('first page: ' + pages.overview.children.map((c) => c.type + ' ' + c.name).join(' | '));
  const reactions = pages.dark.findAll((n) => n.reactions && n.reactions.length).length;
  const photos = pages.dark.findAll((n) => n.type === 'RECTANGLE' && /^photo · /.test(n.name) && n.fills[0] && n.fills[0].type === 'IMAGE').length;
  console.log('dark page: ' + reactions + ' layers with prototype links, ' + photos + ' photos placed · flow start: ' + JSON.stringify(pages.dark.flowStartingPoints));
  const stale = frames(pages.dark).filter((n) => cfg.legacyFrames.indexOf(n) !== -1 && !/^\d\d /.test(n)).length;
  if (failed || stale) process.exitCode = 1;
  console.log(failed ? failed + ' script(s) need attention' : 'all scripts ran cleanly against the stand-in');
})();
