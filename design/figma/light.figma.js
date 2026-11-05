// design/figma/light.figma.js — Figma Plugin API code. Copies the dark iPhone frames named in NAMES onto the light page
// and rebinds every colour from the dark TenderScout variables to the light ones (frames, text ranges, strokes, and the
// layers inside the status-bar and home-indicator instances). Screens whose light rendering differs in structure
// (make-batches.js compares the two captures) are built from the light capture instead, so they are not in NAMES.
// Constants prepended by make-batches.js: DARK_PAGE, LIGHT_PAGE, LIGHT_PAGE_NAME, DARK_COLL, LIGHT_COLL, NAMES, REPLACE.
const darkPage = await figma.getNodeByIdAsync(DARK_PAGE);
const lightPage = await figma.getNodeByIdAsync(LIGHT_PAGE);
await figma.setCurrentPageAsync(lightPage);
if (LIGHT_PAGE_NAME) lightPage.name = LIGHT_PAGE_NAME;
await darkPage.loadAsync();
const dark = await figma.variables.getVariableCollectionByIdAsync(DARK_COLL);
const light = await figma.variables.getVariableCollectionByIdAsync(LIGHT_COLL);
const byName = {};
for (const id of light.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); byName[v.name] = v; }
const map = {};
for (const id of dark.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); if (byName[v.name]) map[v.id] = byName[v.name]; }
const frames = darkPage.children.filter((n) => n.type === 'FRAME' && NAMES.indexOf(n.name) !== -1);
const fontKeys = new Map();
for (const f of frames) for (const t of f.findAllWithCriteria({ types: ['TEXT'] })) for (const s of t.getStyledTextSegments(['fontName'])) fontKeys.set(s.fontName.family + '|' + s.fontName.style, s.fontName);
await Promise.all([...fontKeys.values()].map((f) => figma.loadFontAsync(f)));
function swap(paints) {
  let changed = false;
  const out = paints.map((p) => { const b = p.boundVariables && p.boundVariables.color; if (b && map[b.id]) { changed = true; return figma.variables.setBoundVariableForPaint(p, 'color', map[b.id]); } return p; });
  return changed ? out : null;
}
function rebind(n) {
  if (n.type === 'TEXT') { for (const s of n.getStyledTextSegments(['fills'])) { const np = swap(s.fills); if (np) n.setRangeFills(s.start, s.end, np); } }
  else if ('fills' in n && Array.isArray(n.fills) && n.fills.length) { const np = swap(n.fills); if (np) n.fills = np; }
  if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length) { const np = swap(n.strokes); if (np) n.strokes = np; }
}
for (const old of lightPage.children.filter((c) => c.type === 'FRAME' && (NAMES.indexOf(c.name) !== -1 || REPLACE.indexOf(c.name) !== -1))) old.remove();
const out = []; const errors = [];
for (const f of frames) {
  const c = f.clone(); lightPage.appendChild(c); c.x = f.x; c.y = f.y; c.name = f.name;
  for (const n of [c].concat(c.findAll(() => true))) { try { rebind(n); } catch (e) { errors.push(c.name + ' / ' + n.name + ': ' + String(e.message || e).slice(0, 100)); } }
  // second pass for instance sublayers (a fresh clone does not always expose them to the first walk)
  for (const inst of c.findAllWithCriteria({ types: ['INSTANCE'] })) for (const n of inst.findAll(() => true)) { try { if (n.type !== 'FRAME') rebind(n); } catch (e) { errors.push(n.name + ': ' + String(e.message || e).slice(0, 100)); } }
  out.push(c.name);
}
return { copied: out.length, names: out, errors: errors.slice(0, 10) };
