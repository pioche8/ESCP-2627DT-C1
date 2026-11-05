// design/figma/cleanup.figma.js — Figma Plugin API code. Removes only the listed nodes, and only when the node still has
// the expected type and name (so a node the team renamed or reused is left alone). Constants: PAGE, REMOVE [{ id, type, name }].
const page = await figma.getNodeByIdAsync(PAGE);
await figma.setCurrentPageAsync(page);
const removed = [], kept = [];
for (const r of REMOVE) {
  const n = await figma.getNodeByIdAsync(r.id);
  if (n && n.type === r.type && n.name.indexOf(r.name) === 0) { removed.push(r.id + ' ' + n.name); n.remove(); } else kept.push(r.id + (n ? ' (now "' + n.name + '", kept)' : ' (already gone)'));
}
return { removed, kept, remaining: page.children.map((c) => c.type + ' ' + c.name) };
