// design/figma/photos.figma.js — Figma Plugin API code. Puts the app's photos into every rectangle named
// 'photo · <basename>' on the iPhone pages. The bytes travel inline as base64 (JPEG re-encodes of assets/img/*.png made
// by make-batches.js) because the asset upload endpoint (mcp.figma.com) may be unreachable from a build container.
// Each image carries its byte length and byte sum; a mismatch means the script text was altered on the way, and that
// image is skipped and reported instead of placing a broken picture.
// Constants prepended by make-batches.js: PAGES (ids, first one becomes current), IMAGES { name: { b64, len, sum } }.
const first = await figma.getNodeByIdAsync(PAGES[0]);
await figma.setCurrentPageAsync(first);
const pages = [first];
for (const id of PAGES.slice(1)) { const p = await figma.getNodeByIdAsync(id); await p.loadAsync(); pages.push(p); }
const hashes = {}; const bad = [];
for (const k of Object.keys(IMAGES)) {
  const im = IMAGES[k];
  try {
    const bytes = figma.base64Decode(im.b64);
    let sum = 0; for (let i = 0; i < bytes.length; i++) sum = (sum + bytes[i]) >>> 0;
    if (bytes.length !== im.len || sum !== im.sum) { bad.push(k + ' (length ' + bytes.length + '/' + im.len + ', sum ' + sum + '/' + im.sum + ')'); continue; }
    hashes[k] = figma.createImage(bytes).hash;
  } catch (e) { bad.push(k + ': ' + String(e.message || e).slice(0, 80)); }
}
let placed = 0; const missing = [];
for (const p of pages) {
  for (const n of p.findAll((n) => n.type === 'RECTANGLE' && n.name.indexOf('photo · ') === 0)) {
    const k = n.name.slice(8);
    if (hashes[k]) { n.fills = [{ type: 'IMAGE', imageHash: hashes[k], scaleMode: 'FILL' }]; placed++; } else missing.push(p.name + ' / ' + n.name);
  }
}
return { placed, bad, missing: missing.slice(0, 10) };
