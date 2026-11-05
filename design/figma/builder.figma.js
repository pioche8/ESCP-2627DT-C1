// design/figma/builder.figma.js — Figma Plugin API code (runs inside Figma through the MCP use_figma tool, not in node).
// make-batches.js prepends the constants below and writes ready-to-run scripts to design/figma/out/figma/.
//   PAGE     page id to build on                COLL  variable collection id (dark or light TenderScout colours)
//   SB, HI   'iOS / Status bar' and 'iOS / Home indicator' component ids
//   S        screens: { name, H, bg, ch } from capture.js     REPLACE  frame names this script may replace on PAGE
// Every colour is bound to a variable; nothing is a raw hex unless capture.js found a colour outside the tokens.
// Only frames whose names are in REPLACE are removed, so the script is safe to re-run and never touches other layers.
const page = await figma.getNodeByIdAsync(PAGE);
await figma.setCurrentPageAsync(page);
if (PAGE_NAME) page.name = PAGE_NAME;
const sbC = await figma.getNodeByIdAsync(SB), hiC = await figma.getNodeByIdAsync(HI);
const coll = await figma.variables.getVariableCollectionByIdAsync(COLL);
const V = {};
for (const id of coll.variableIds) { const v = await figma.variables.getVariableByIdAsync(id); V[v.name.split('/').pop()] = v; }
const HW = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };
const fontOf = (s) => (s[4] ? { family: 'Material Symbols Rounded', style: 'Regular' } : { family: 'Hanken Grotesk', style: HW[s[2]] || 'Regular' });
const fonts = new Map();
const walkF = (n) => { if (n.k === 'T') n.sg.forEach((s) => { const f = fontOf(s); fonts.set(f.family + '|' + f.style, f); }); (n.ch || []).forEach(walkF); };
S.forEach((s) => s.ch.forEach(walkF));
await Promise.all([...fonts.values()].map((f) => figma.loadFontAsync(f)));
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
function paint(c) {
  let a = 1; if (Array.isArray(c)) { a = c[1]; c = c[0]; }
  if (c[0] === '#') return { type: 'SOLID', color: hex(c), opacity: a };
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: a }, 'color', V[c]);
}
function rad(node, r) { if (!r) return; if (Array.isArray(r)) { node.topLeftRadius = r[0]; node.topRightRadius = r[1]; node.bottomRightRadius = r[2]; node.bottomLeftRadius = r[3]; } else node.cornerRadius = r; }
const errors = []; const images = []; let count = 0;
function build(n, parent, ox, oy, inF, fixed) {
  try {
    let node; const ax = ox + (n.x || 0), ay = oy + (n.y || 0);
    if (n.k === 'F') {
      node = figma.createFrame(); parent.appendChild(node); node.name = n.n || 'frame';
      node.resizeWithoutConstraints(Math.max(n.w, 0.01), Math.max(n.h, 0.01)); node.x = n.x; node.y = n.y;
      node.fills = n.f ? [paint(n.f)] : []; rad(node, n.r); node.clipsContent = !!n.c;
      if (n.o) node.opacity = n.o;
      if (n.s) { node.strokes = [paint(n.s[0])]; node.strokeWeight = n.s[1]; node.strokeAlign = 'INSIDE'; }
      if (n.fx && !inF) fixed.push([node, ax, ay]);
      (n.ch || []).forEach((c) => build(c, node, ax, ay, inF || !!n.fx, fixed));
    } else if (n.k === 'T') {
      node = figma.createText(); parent.appendChild(node);
      node.fontName = fontOf(n.sg[0]);
      node.characters = n.sg.map((s) => s[0]).join('');
      let i = 0;
      for (const s of n.sg) {
        const e = i + s[0].length;
        if (e > i) {
          node.setRangeFontName(i, e, fontOf(s)); node.setRangeFontSize(i, e, s[1]); node.setRangeFills(i, e, [paint(s[3])]);
          if (s[5]) { node.setRangeTextDecoration(i, e, 'UNDERLINE'); try { node.setRangeTextDecorationThickness(i, e, { unit: 'PIXELS', value: s[5][0] }); node.setRangeTextDecorationOffset(i, e, { unit: 'PIXELS', value: s[5][1] }); } catch (err) {} }
        }
        i = e;
      }
      node.lineHeight = { unit: 'PIXELS', value: n.lh };
      if (n.tr) { node.textAutoResize = 'NONE'; node.resize(n.w, n.h); node.textTruncation = 'ENDING'; node.x = n.x; }
      else if (n.ws) { node.textAutoResize = 'WIDTH_AND_HEIGHT'; const d = node.width - n.w; node.x = n.w ? n.x - d / 2 : n.x; }
      else { node.resize(n.w, n.h); node.textAutoResize = 'HEIGHT'; if (n.al) node.textAlignHorizontal = n.al === 'C' ? 'CENTER' : 'RIGHT'; node.x = n.x; }
      node.y = n.y;
      if (n.fx && !inF) fixed.push([node, ax, ay]);
    } else if (n.k === 'V') {
      node = figma.createPolygon(); parent.appendChild(node); node.name = 'shape ▲'; node.pointCount = 3;
      node.resize(n.w, n.h); node.x = n.x; node.y = n.y; node.fills = [paint(n.f)];
    } else if (n.k === 'D') {
      node = figma.createRectangle(); parent.appendChild(node); node.name = 'shape ◆';
      node.resize(n.s, n.s); node.fills = [paint(n.f)]; if (n.r) node.cornerRadius = 1;
      const c = Math.SQRT1_2; node.relativeTransform = [[c, -c, n.cx], [c, c, n.cy - c * n.s]];
    } else if (n.k === 'I') {
      node = figma.createRectangle(); parent.appendChild(node); node.name = 'photo · ' + n.img;
      node.resize(n.w, n.h); node.x = n.x; node.y = n.y; rad(node, n.r); node.fills = [paint('surface')];
      images.push([n.img, node.id]);
    }
    count++;
  } catch (e) { errors.push((n.n || n.k) + ': ' + String(e.message || e).slice(0, 140)); }
}
const out = [];
for (const s of S) {
  for (const old of page.children.filter((c) => c.type === 'FRAME' && (c.name === s.name || REPLACE.indexOf(c.name) !== -1))) old.remove();
  const idx = parseInt(s.name, 10);
  const fr = figma.createFrame(); fr.name = s.name; fr.resize(390, 844);
  fr.x = ((idx - 1) % 10) * 470; fr.y = Math.floor((idx - 1) / 10) * 1000;
  fr.fills = [paint(s.bg || 'bg')]; fr.clipsContent = true;
  const fixed = [];
  s.ch.forEach((c) => build(c, fr, 0, 0, false, fixed));
  for (const [node, ax, ay] of fixed) { fr.appendChild(node); node.x = ax; node.y = ay; }
  const sbI = sbC.createInstance(); fr.appendChild(sbI); sbI.x = 0; sbI.y = 0;
  const hiI = hiC.createInstance(); fr.appendChild(hiI); hiI.x = 128; hiI.y = 831;
  if (s.H > 844) fr.overflowDirection = 'VERTICAL';
  fr.numberOfFixedChildren = fixed.length + 2;
  out.push({ id: fr.id, name: fr.name, scroll: s.H > 844, pinned: fixed.length });
}
// one small screenshot of the batch's first screen, so each call carries its own visual check
if (out.length) await (await figma.getNodeByIdAsync(out[0].id)).screenshot({ scale: 0.5 });
return { screens: out, nodes: count, images, errors: errors.slice(0, 20) };
