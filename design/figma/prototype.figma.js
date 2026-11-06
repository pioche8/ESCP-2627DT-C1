// design/figma/prototype.figma.js — Figma Plugin API code. Wires the iPhone frames on PAGE into a clickable prototype
// that follows the BRIEF.md demo path (Welcome → profile → Feed → Go tender → Hohenau → "We meet it" → Company →
// ISO 27001 → No-go → Go → Feed → skip → save → Bids), with the tab bar, Back, About and the side screens.
// Layers are found by the names capture.js gives them (CSS selectors such as 'a.tcard.v-go') and by their text, so the
// script survives a re-capture. Constants: PAGE, FLOW_NAME. Returns the links it could not place.
const page = await figma.getNodeByIdAsync(PAGE);
await figma.setCurrentPageAsync(page);
const F = {};
for (const f of page.children) if (f.type === 'FRAME' && /^\d\d /.test(f.name)) F[f.name.slice(0, 2)] = f;
const hasText = (n, s) => 'findOne' in n && !!n.findOne((t) => t.type === 'TEXT' && t.characters.indexOf(s) !== -1);
const isText = (n, s) => n.type === 'TEXT' && n.characters === s;
const byName = (k, name, i) => (F[k] ? F[k].findAll((n) => n.name === name)[i || 0] : null) || null;
const button = (k, label) => (F[k] ? F[k].findOne((n) => /^button/.test(n.name) && hasText(n, label)) : null);
const iconButton = (k, glyph) => (F[k] ? F[k].findOne((n) => n.name === 'button.icon-btn' && 'findOne' in n && !!n.findOne((t) => isText(t, glyph))) : null);
const card = (k, buyer) => (F[k] ? F[k].findOne((n) => /^a\.tcard/.test(n.name) && hasText(n, buyer)) : null);
const req = (k, cls) => byName(k, 'a.req.' + cls);
const text = (k, s) => (F[k] ? F[k].findOne((n) => isText(n, s)) : null);
const placed = [], missing = [];
async function link(label, node, dest) {
  if (!node || !F[dest]) { missing.push(label); return; }
  const action = { type: 'NODE', destinationId: F[dest].id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 }, preserveScrollPosition: false };
  await node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [action] }]);
  placed.push(label);
}
async function after(label, from, dest, seconds) {
  if (!F[from] || !F[dest]) { missing.push(label); return; }
  const action = { type: 'NODE', destinationId: F[dest].id, navigation: 'NAVIGATE', transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.3 }, preserveScrollPosition: false };
  try { await F[from].setReactionsAsync([{ trigger: { type: 'AFTER_TIMEOUT', timeout: seconds }, actions: [action] }]); placed.push(label); }
  catch (e) { missing.push(label + ' (' + String(e.message || e).slice(0, 60) + ')'); }
}
// tab bar: the three items are flattened icon + label pairs, so add an invisible tap area over each
const TAB = { early: { Feed: '04', Bids: '06', Company: '16' }, late: { Feed: '18', Bids: '25', Company: '17' } };
for (const k of Object.keys(F)) {
  const bar = F[k].children.find((n) => n.name === 'nav.tabbar');
  if (!bar) continue;
  const targets = parseInt(k, 10) >= 17 && parseInt(k, 10) <= 26 ? TAB.late : TAB.early;
  ['Feed', 'Bids', 'Company'].forEach((label, i) => {
    let hs = bar.children.find((n) => n.name === 'tap · ' + label);
    if (!hs) { hs = figma.createFrame(); bar.appendChild(hs); hs.name = 'tap · ' + label; hs.fills = []; hs.resizeWithoutConstraints(130, 60); hs.x = i * 130; hs.y = 0; }
  });
  for (const label of ['Feed', 'Bids', 'Company']) await link(k + ' tab ' + label, bar.children.find((n) => n.name === 'tap · ' + label), targets[label]);
}
for (const k of Object.keys(F)) { const b = iconButton(k, 'info'); if (b) await link(k + ' ⓘ → About', b, '26'); }
// onboarding
await link('Welcome → Reading', button('01', 'Draft my profile'), '02');
await after('Reading → Check your profile (2 s)', '02', '03', 2);
await link('Profile back', iconButton('03', 'chevron_left'), '01');
await link('Profile → Feed', button('03', 'Looks right'), '04');
// Feed and the six tenders
await link('Feed: Ellerbach', card('04', 'Stadt Ellerbach'), '07');
await link('Feed: Kaltbrunn', card('04', 'Stadtwerke Kaltbrunn'), '10');
await link('Feed: Valdemora', card('04', 'Universidad de Valdemora'), '11');
await link('Feed: Hohenau', card('04', 'Landkreis Hohenau'), '12');
await link('Feed: Vlietdam', card('04', 'Gemeente Vlietdam'), '20');
await link('Feed: Morlanne', card('04', 'Centre Hospitalier de Morlanne'), '23');
await link('Feed: Maybe filter', byName('04', 'button.v-maybe'), '05');
await link('Maybe filter: All', text('05', 'All 6'), '04');
await link('Maybe filter: Kaltbrunn', card('05', 'Stadtwerke Kaltbrunn'), '10');
await link('Maybe filter: Valdemora', card('05', 'Universidad de Valdemora'), '11');
await after('Reading the pack → Go tender (1.5 s)', '07', '08', 1.5);
await link('Go tender back', iconButton('08', 'chevron_left'), '04');
await link('Go tender: Turnover line → sheet', req('08', 'v-go'), '09');
await link('Go tender: Save → saved', button('08', 'Save to Bids'), '24');
await link('Meets sheet: scrim → tender', byName('09', 'div.scrim'), '08');
for (const k of ['10', '11', '23']) await link(k + ' back', iconButton(k, 'chevron_left'), parseInt(k, 10) === 23 ? '22' : '04');
await link('Hohenau back', iconButton('12', 'chevron_left'), '04');
await link('Hohenau: check line → sheet', req('12', 'v-check'), '13');
await link('Sheet: We meet it', button('13', 'We meet it'), '14');
await link('Sheet: We don’t meet it', button('13', 'We don’t meet it'), '12');
await link('Sheet: scrim', byName('13', 'div.scrim'), '12');
await after('Answer saved → Ask this tender (2 s)', '14', '15', 2);
await link('Ask answer back → Feed', iconButton('15', 'chevron_left'), '04');
// the hero moment
await link('Company: ISO 27001 switch → re-score', (function () { if (!F['16']) return null; const row = F['16'].findAll((n) => n.name === 'div.row').find((r) => hasText(r, 'ISO 27001')); return row ? row.findOne((n) => n.name === 'button.switch') : null; })(), '17');
await link('After re-score: Hohenau (now Go)', card('18', 'Landkreis Hohenau'), '19');
await link('After re-score: Vlietdam', card('18', 'Gemeente Vlietdam'), '20');
await link('Hohenau Go back', iconButton('19', 'chevron_left'), '18');
await link('Vlietdam back', iconButton('20', 'chevron_left'), '18');
await link('Vlietdam: Skip → reasons', button('20', 'Skip'), '21');
await link('Skip sheet: Cancel', button('21', 'Cancel'), '20');
await link('Skip sheet: Skip tender', button('21', 'Skip tender'), '22');
await link('Skip sheet: scrim', byName('21', 'div.scrim'), '20');
await link('Skipped feed: Morlanne', card('22', 'Centre Hospitalier de Morlanne'), '23');
await link('Skipped feed: Ellerbach', card('22', 'Stadt Ellerbach'), '24');
await link('Saved back', iconButton('24', 'chevron_left'), '22');
await link('Saved: In Bids', button('24', 'In Bids'), '25');
await link('About back', iconButton('26', 'chevron_left'), '04');
await link('Closed back', iconButton('27', 'chevron_left'), '28');
await link('Not found → Feed', F['30'] ? F['30'].findOne((n) => n.type === 'TEXT' && /Feed/.test(n.characters)) : null, '04');
page.flowStartingPoints = F['01'] ? [{ nodeId: F['01'].id, name: FLOW_NAME }] : [];
return { placed: placed.length, missing };
