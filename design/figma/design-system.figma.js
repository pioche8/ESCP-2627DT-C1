// design/figma/design-system.figma.js — Figma Plugin API code. Builds the 'Design system · TenderScout' section on PAGE
// from shared/tokens.json (make-batches.js prepends TYPE = tokens.type.app and the collection ids):
//   · the nine colours per scheme as swatches bound to the variables (with their hex values)
//   · one local text style per app type role ('App/Screen title' …) and a sample of each
//   · component sets: Status (● Go ▲ Maybe ■ No-go ◆ Needs your check), Score tile (Go / Maybe / No-go), Button (Primary / Secondary)
// Re-running replaces the section (found by its exact name) and updates the text styles in place.
// Constants: PAGE, DARK_COLL, LIGHT_COLL, TYPE, SECTION_NAME.
const page = await figma.getNodeByIdAsync(PAGE);
await figma.setCurrentPageAsync(page);
const vars = async (id) => { const c = await figma.variables.getVariableCollectionByIdAsync(id); const o = {}; for (const v of c.variableIds) { const x = await figma.variables.getVariableByIdAsync(v); o[x.name.split('/').pop()] = { v: x, mode: c.modes[0].modeId }; } return o; };
const D = await vars(DARK_COLL), L = await vars(LIGHT_COLL);
const STYLE = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };
for (const s of ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']) await figma.loadFontAsync({ family: 'Hanken Grotesk', style: s });
const bound = (set, k) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', set[k].v);
const hexOf = (set, k) => { const c = set[k].v.valuesByMode[set[k].mode]; return '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase(); };
function txt(parent, s, size, weight, set, colour) {
  const t = figma.createText(); parent.appendChild(t);
  t.fontName = { family: 'Hanken Grotesk', style: STYLE[weight] }; t.characters = s; t.fontSize = size; t.fills = [bound(set, colour)];
  return t;
}
function col(parent, gap, name) { const f = figma.createAutoLayout('VERTICAL', { name, itemSpacing: gap }); f.fills = []; parent.appendChild(f); return f; }
function row(parent, gap, name) { const f = figma.createAutoLayout('HORIZONTAL', { name, itemSpacing: gap }); f.fills = []; parent.appendChild(f); return f; }
for (const old of page.children.filter((n) => n.type === 'SECTION' && n.name === SECTION_NAME)) old.remove();
let maxX = 0; for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);
const section = figma.createSection(); section.name = SECTION_NAME; section.x = maxX + 200; section.y = 0;
const ids = [];
// ---- colours
const panels = [];
for (const [label, set] of [['Dark', D], ['Light', L]]) {
  const p = figma.createAutoLayout('VERTICAL', { name: 'Colours · ' + label.toLowerCase(), itemSpacing: 16 });
  section.appendChild(p); p.paddingLeft = p.paddingRight = p.paddingTop = p.paddingBottom = 32; p.cornerRadius = 8; p.fills = [bound(set, 'bg')];
  txt(p, 'Colours · ' + label + ' (nine per scheme, shared/tokens.json)', 20, 700, set, 'ink');
  const r = row(p, 16, 'swatches');
  for (const k of ['bg', 'surface', 'ink', 'muted', 'brand', 'go', 'maybe', 'nogo', 'check']) {
    const c = col(r, 6, 'color/' + k);
    const sw = figma.createRectangle(); c.appendChild(sw); sw.name = 'swatch'; sw.resize(96, 64); sw.cornerRadius = 8; sw.fills = [bound(set, k)];
    if (k === 'bg') { sw.strokes = [bound(set, 'muted')]; sw.strokeWeight = 1; }
    txt(c, k, 13, 600, set, 'ink'); txt(c, hexOf(set, k), 13, 500, set, 'muted');
  }
  panels.push(p); ids.push(p.id);
}
// ---- text styles
const existing = await figma.getLocalTextStylesAsync();
const typeP = figma.createAutoLayout('VERTICAL', { name: 'Type · app', itemSpacing: 14 });
section.appendChild(typeP); typeP.paddingLeft = typeP.paddingRight = typeP.paddingTop = typeP.paddingBottom = 32; typeP.cornerRadius = 8; typeP.fills = [bound(D, 'bg')];
txt(typeP, 'Type · Hanken Grotesk, tabular figures, no negative tracking (text styles App/…)', 20, 700, D, 'ink');
const SAMPLE = { wordmark: 'TenderScout', screenTitle: '6 new tenders', sectionTitle: 'Can you qualify?', detailTitle: 'IT security audit and hardening', score: '25', cardTitle: 'Structured cabling and Wi-Fi', body: 'Thu 5 Nov · read 777 pages in 4 languages', meta: 'Stadt Ellerbach · €480k · 29 d', label: 'Company website', button: 'Draft my profile' };
const styles = [];
for (const key of Object.keys(TYPE)) {
  const spec = TYPE[key];
  const name = 'App/' + key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
  let st = existing.find((s) => s.name === name) || figma.createTextStyle();
  st.name = name; st.fontName = { family: 'Hanken Grotesk', style: STYLE[spec.weight] }; st.fontSize = parseFloat(spec.size);
  st.lineHeight = /px$/.test(spec.line) ? { unit: 'PIXELS', value: parseFloat(spec.line) } : { unit: 'PERCENT', value: parseFloat(spec.line) * 100 };
  st.description = spec.size + ' / ' + spec.line + ' / ' + spec.weight + ' (shared/tokens.json type.app.' + key + ')';
  styles.push(st.name);
  const r = row(typeP, 24, name); r.counterAxisAlignItems = 'CENTER';
  const lab = txt(r, name.slice(4) + ' · ' + spec.size + '/' + spec.line + ' · ' + spec.weight, 13, 500, D, 'muted'); lab.resize(220, lab.height); lab.textAutoResize = 'HEIGHT';
  const sample = txt(r, SAMPLE[key] || key, parseFloat(spec.size), spec.weight, D, key === 'score' ? 'nogo' : 'ink');
  try { await sample.setTextStyleIdAsync(st.id); } catch (e) { try { sample.textStyleId = st.id; } catch (e2) {} }
}
ids.push(typeP.id);
// ---- components (dark scheme variables; the light page rebinds instances to the light set)
const compP = figma.createAutoLayout('VERTICAL', { name: 'Components', itemSpacing: 24 });
section.appendChild(compP); compP.paddingLeft = compP.paddingRight = compP.paddingTop = compP.paddingBottom = 32; compP.cornerRadius = 8; compP.fills = [bound(D, 'bg')];
txt(compP, 'Components · verdicts are always shape + word + colour', 20, 700, D, 'ink');
function shape(kind, colour, size) {
  let s;
  if (kind === 'circle') { s = figma.createEllipse(); s.resize(size, size); }
  else if (kind === 'tri') { s = figma.createPolygon(); s.pointCount = 3; s.resize(size * 1.1, size); }
  else if (kind === 'diamond') { s = figma.createRectangle(); s.resize(size * 0.85, size * 0.85); s.cornerRadius = 1; s.rotation = 45; }
  else { s = figma.createRectangle(); s.resize(size, size); s.cornerRadius = 1; }
  s.name = 'shape ' + ({ circle: '●', tri: '▲', square: '■', diamond: '◆' })[kind]; s.fills = [bound(D, colour)];
  return s;
}
const VERD = [['Go', 'go', 'circle', '100'], ['Maybe', 'maybe', 'tri', '90'], ['No-go', 'nogo', 'square', '25'], ['Needs your check', 'check', 'diamond', null]];
const statusComps = VERD.map(([label, colour, kind]) => {
  const c = figma.createComponent(); c.name = 'Verdict=' + label; c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO'; c.itemSpacing = 6; c.counterAxisAlignItems = 'CENTER'; c.fills = [];
  c.appendChild(shape(kind, colour, 8)); txt(c, label, 13, 800, D, colour); return c;
});
const statusSet = figma.combineAsVariants(statusComps, compP); statusSet.name = 'Status'; statusSet.layoutMode = 'HORIZONTAL'; statusSet.itemSpacing = 24; statusSet.paddingLeft = statusSet.paddingRight = statusSet.paddingTop = statusSet.paddingBottom = 16; statusSet.fills = [bound(D, 'surface')]; statusSet.cornerRadius = 8;
statusSet.description = 'Requirement / verdict status. Never colour alone: shape + label + colour (CLAUDE.md §7.5).';
const tileComps = VERD.filter((v) => v[3]).map(([label, colour, , num]) => {
  const c = figma.createComponent(); c.name = 'Verdict=' + label; c.layoutMode = 'HORIZONTAL'; c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.resize(48, 48); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; c.cornerRadius = 8; c.fills = [bound(D, colour)];
  txt(c, num, 20, 800, D, 'bg'); return c;
});
const tileSet = figma.combineAsVariants(tileComps, compP); tileSet.name = 'Score tile'; tileSet.layoutMode = 'HORIZONTAL'; tileSet.itemSpacing = 16; tileSet.paddingLeft = tileSet.paddingRight = tileSet.paddingTop = tileSet.paddingBottom = 16; tileSet.fills = [bound(D, 'surface')]; tileSet.cornerRadius = 8;
tileSet.description = '48 × 48, the one 8 px radius, ground-coloured number on the verdict fill (tender cards, Bids).';
const btnComps = [['Primary', 'brand', 'Save to Bids'], ['Secondary', 'muted', 'Skip']].map(([kind, fill, label]) => {
  const c = figma.createComponent(); c.name = 'Kind=' + kind; c.layoutMode = 'HORIZONTAL'; c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.paddingLeft = c.paddingRight = 20; c.resize(kind === 'Primary' ? 217 : 129, 52); c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED'; c.cornerRadius = 8; c.fills = [bound(D, fill)];
  txt(c, label, 16, 700, D, 'bg'); return c;
});
const btnSet = figma.combineAsVariants(btnComps, compP); btnSet.name = 'Button'; btnSet.layoutMode = 'HORIZONTAL'; btnSet.itemSpacing = 12; btnSet.paddingLeft = btnSet.paddingRight = btnSet.paddingTop = btnSet.paddingBottom = 16; btnSet.fills = [bound(D, 'surface')]; btnSet.cornerRadius = 8;
btnSet.description = '52 px, 8 px radius, no border or shadow. Primary = brand, Secondary = muted; label in the ground colour. Pressed = ink.';
ids.push(compP.id, statusSet.id, tileSet.id, btnSet.id);
// lay the panels out in the section
let y = 120; for (const p of [panels[0], panels[1], typeP, compP]) { p.x = 80; p.y = y; y += p.height + 80; }
let w = 0; for (const p of [panels[0], panels[1], typeP, compP]) w = Math.max(w, p.width);
section.resizeWithoutConstraints(w + 160, y + 40);
return { section: section.id, textStyles: styles, createdNodeIds: ids };
