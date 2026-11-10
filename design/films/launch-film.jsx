// TenderScout · 45s launch film (1920×1080). Built on animations-v3. Restyled 4 Nov 2026 to the decluttered token set:
// the dark scheme's nine colours, one typeface, one 8 px radius, no gradients, shadows, pills, mono or text on photos.
// 10 Nov 2026 (pass 8): the phone and the lever redrawn to the app as it is since pass 5 (five tabs, proof first on a tender,
// the score on the re-score card, the answer pair in the sheet). Same story, same 45 s, same numbers (Hohenau 25 → 90 → 100).
const { useComposition, CompositionStage, animate, Easing } = window;

const C = { bg: '#02040A', surface: '#0B111C', ink: '#FFFFFF', muted: '#8A93A3', brand: '#5DB8F5', go: '#5ED69C', maybe: '#F7C25E', nogo: '#FF8B80', check: '#B3A5FF' };
const F = "'Hanken Grotesk', sans-serif", ICON = "'Material Symbols Rounded'", R = 8;

// The three motion helpers (MOTION.md): enter, morph, pop. Each returns progress 0..1 at T.
const MOTION = {
  enter: (T, s, d = 0.7) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeOutCubic })(T),
  morph: (T, s, d = 1) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeInOutQuart })(T),
  pop: (T, s, d = 0.5) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeOutBack })(T)
};
const lerp = (a, b, p) => a + (b - a) * p;
const vis = (T, a, b) => MOTION.enter(T, a, 0.6) * (1 - MOTION.enter(T, b, 0.5));
const mix = (c1, c2, p) => {
  const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const [a, b] = [h(c1), h(c2)];
  return 'rgb(' + a.map((v, i) => Math.round(lerp(v, b[i], p))).join(',') + ')';
};
const Shape = ({ k, s = 12, color = 'currentColor' }) => {
  const base = { width: s, height: s, background: color, display: 'inline-block', flex: 'none' };
  if (k === 'go') return <span style={{ ...base, borderRadius: '50%' }} />;
  if (k === 'maybe') return <span style={{ ...base, width: s * 1.1, clipPath: 'polygon(50% 0,100% 100%,0 100%)' }} />;
  if (k === 'check') return <span style={{ ...base, width: s * .8, height: s * .8, transform: 'rotate(45deg)' }} />;
  return <span style={{ ...base, width: s * .9, height: s * .9 }} />;
};
const Icon = ({ n, s = 20, style }) => <span style={{ fontFamily: ICON, fontSize: s, lineHeight: 1, fontWeight: 400, ...style }}>{n}</span>;
const Status = ({ k, label, s = 11, size = 16 }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: `700 ${size}px/1 ${F}`, color: C[k] }}><Shape k={k} s={s} color={C[k]} />{label}</span>;

const SECTORS = [['03','Agriculture & forestry'],['09','Fuel & energy'],['14','Mining & metals'],['15','Food & drink'],['16','Farm machinery'],['18','Clothing & footwear'],['19','Textiles & plastics'],['22','Printing'],['24','Chemicals'],['30','Office & computing'],['31','Electrical & lighting'],['32','Telecom equipment'],['33','Medical & pharma'],['34','Vehicles & transport'],['35','Security & defence'],['37','Sport & games'],['38','Lab & precision'],['39','Furniture'],['41','Water supply'],['42','Industrial machinery'],['43','Construction machinery'],['44','Building materials'],['45','Construction work'],['48','Software'],['50','Repair & maintenance'],['51','Installation'],['55','Hotels & catering'],['60','Transport services'],['63','Logistics & travel'],['64','Postal & telecom'],['65','Utilities'],['66','Finance & insurance'],['70','Real estate'],['71','Architecture & engineering'],['72','IT services'],['73','Research & development'],['75','Public administration'],['76','Oil & gas services'],['77','Landscaping'],['79','Business services'],['80','Education & training'],['85','Health & social care'],['90','Cleaning & environment'],['92','Culture & sport'],['98','Community services']];

// Opening: the harbour photo in its own block on the right (no text on it), gone before the phone lands.
function Opening({ T, CUES }) {
  const o = vis(T, CUES.Night + 0.1, CUES.Morning - 0.6);
  const push = 1 + 0.04 * Math.min(1, Math.max(0, (T - CUES.Night) / 10));
  return (
    <div style={{ position: 'absolute', left: 1180, top: 140, width: 600, height: 800, borderRadius: R, overflow: 'hidden', background: C.surface, opacity: o }}>
      <img src="assets/harbor-dusk.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${push})` }} />
    </div>
  );
}

function Marquee({ T, CUES }) {
  const o = vis(T, CUES.Night + 1.2, CUES.Morning - 0.6);
  const rows = [0, 1, 2].map(r => SECTORS.filter((_, i) => i % 3 === r));
  const own = { '32': 1, '45': 1, '51': 1, '72': 1 };
  return (
    <div style={{ position: 'absolute', left: 140, width: 980, top: 660, opacity: o, overflow: 'hidden' }}>
      {rows.map((items, i) => {
        const speed = [70, 52, 84][i] * (i % 2 ? -1 : 1);
        const x = ((T * speed) % 1800 + 1800) % 1800;
        return (
          <div key={i} style={{ height: 64, display: 'flex', whiteSpace: 'nowrap', transform: `translateX(${-x}px)`, font: `400 38px/64px ${F}`, color: C.muted }}>
            {[0, 1, 2].map(g => items.map(([c, t]) => (
              <span key={g + c} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, marginRight: 34, fontWeight: own[c] ? 700 : 400, color: own[c] ? C.ink : C.muted }}>
                <span style={{ font: `500 18px/1 ${F}`, color: C.muted }}>{c}</span>{t}
              </span>
            )))}
          </div>
        );
      })}
    </div>
  );
}

function Headlines({ T, CUES }) {
  const line = (text, a, b, y, extra = {}) => {
    const p = MOTION.enter(T, a, 0.8), q = MOTION.enter(T, b, 0.5);
    return (
      <div style={{ position: 'absolute', left: 140, top: y, width: 980, opacity: p * (1 - q), transform: `translateY(${(1 - p) * 40 - q * 30}px)`, font: `800 96px/100px ${F}`, color: C.ink, textWrap: 'balance', ...extra }}>{text}</div>
    );
  };
  const nightUp = MOTION.morph(T, CUES.Reading, 0.8);
  return (
    <>
      {line('Every night,', CUES.Night + 0.3, CUES.Morning - 0.6, lerp(300, 200, nightUp))}
      {line('we read every new EU tender.', CUES.Reading + 0.2, CUES.Morning - 0.6, 310)}
      {line('By morning, you know which ones you can win.', CUES.Morning + 1.0, CUES.Proof, 300, { width: 940 })}
      {line('With the page that proves it.', CUES.Proof + 0.4, CUES.Lever, 180, { width: 900 })}
      {line('Change your profile. Every verdict updates.', CUES.Lever + 0.3, CUES.Number, 150, { width: 940, fontSize: 84, lineHeight: '90px' })}
    </>
  );
}

function PageCounter({ T, CUES }) {
  const o = vis(T, CUES.Reading + 0.6, CUES.Morning + 0.2);
  const n = Math.round(777 * MOTION.enter(T, CUES.Reading + 0.8, 4.2));
  return (
    <div style={{ position: 'absolute', left: 140, top: 552, opacity: o, display: 'flex', alignItems: 'baseline', gap: 22, color: C.ink }}>
      <span style={{ font: `800 72px/1 ${F}`, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
      <span style={{ font: `600 26px/1 ${F}`, color: C.muted }}>pages in German, Spanish, Dutch and French</span>
    </div>
  );
}

// The phone: the app as it is since pass 5 (redrawn 10 Nov 2026, pass 8): the Feed with its filter tabs and the five-tab
// bar, the Hohenau card growing into the tender, which opens on its proof ("Can you qualify?", knock-outs first, the
// citation in the brand colour), and the verdict re-scoring as the lever scene changes the profile and answers the line.
function Phone({ T, CUES }) {
  const inP = MOTION.pop(T, CUES.Morning + 0.4, 0.8);
  const out = MOTION.morph(T, CUES.Number, 0.9);
  const iso = MOTION.morph(T, CUES.Lever + 2.2, 0.8);     // ISO 27001 on: No-go 25 → Maybe 90
  const met = MOTION.morph(T, CUES.Lever + 4.6, 0.3);     // "We meet it" on the unclear line: Maybe 90 → Go 100 (with the lever's tap)
  const expand = MOTION.morph(T, CUES.Proof + 0.2, 1.1);
  const cards = [
    ['go', 100, 'Structured cabling and Wi-Fi for 12 primary schools', 'Stadt Ellerbach · €480k · 29 d', 230],
    ['maybe', 90, 'Fibre-to-the-building rollout, municipal utility', 'Stadtwerke Kaltbrunn · €1.1M · 43 d', 346],
    ['maybe', 85, 'Data centre cabling, lot 2 (university campus)', 'Universidad de Valdemora · €310k · 9 d', 462]
  ];
  const r0 = { x: 16, y: 578, w: 358, h: 106, r: R }, r1 = { x: 0, y: 0, w: 390, h: 844, r: 0 };
  const Rk = k => lerp(r0[k], r1[k], expand);
  const verdict = met > .5 ? 'go' : iso > .5 ? 'maybe' : 'nogo';
  const label = { go: 'Go', maybe: 'Maybe', nogo: 'No-go' }[verdict];
  const score = Math.round(met > .5 ? lerp(90, 100, met) : lerp(25, 90, iso));
  const detail = MOTION.enter(T, CUES.Proof + 0.9, 0.6);
  const headline = verdict === 'go' ? 'You meet all 3 requirements.' : verdict === 'maybe' ? 'No knock-outs. One line needs your answer.' : '1 knock-out requirement: you don’t hold ISO 27001. One more needs your answer.';
  const metCount = verdict === 'go' ? 3 : verdict === 'maybe' ? 2 : 1;
  const card = (st, kind, title, line, lineColor, cite, citeColor, extra) => (
    <div style={{ borderRadius: R, background: C.surface, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: `700 13px/18px ${F}` }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C[st.v] }}><Shape k={st.v} s={8} color={C[st.v]} />{st.l}</span><span style={{ color: C.muted, fontWeight: 500 }}>· {kind}</span></span>
      <div style={{ font: `700 16px/21px ${F}` }}>{title}</div>
      <div style={{ font: `500 14px/20px ${F}`, color: lineColor }}>{line}</div>
      <div style={{ font: `600 13px/18px ${F}`, color: citeColor }}>{cite}</div>
      {extra}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 1240, top: 70, transform: `translateY(${(1 - inP) * 140 + out * 40}px) translateX(${out * 760}px) scale(${lerp(.9, 1, inP) * 1.12})`, transformOrigin: '50% 0', opacity: Math.min(1, inP * 1.4) * (1 - out) }}>
      <div style={{ position: 'relative', width: 414, height: 868, boxSizing: 'border-box', padding: 12, borderRadius: R, background: C.surface }}>
        <div style={{ position: 'relative', width: 390, height: 844, borderRadius: R, overflow: 'hidden', background: C.bg, fontFamily: F, color: C.ink }}>
          <div style={{ opacity: 1 - Math.min(1, expand * 2) }}>
            <div style={{ position: 'absolute', left: 20, top: 26, display: 'flex', alignItems: 'center', gap: 9, font: `800 20px/1 ${F}` }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: C.brand }} />TenderScout</div>
            {[['contrast', 290], ['info', 340]].map(([ic, x]) => <span key={ic} style={{ position: 'absolute', left: x, top: 12, width: 44, height: 44, borderRadius: R, background: C.surface, display: 'grid', placeItems: 'center' }}><Icon n={ic} s={22} /></span>)}
            <div style={{ position: 'absolute', left: 20, top: 74, font: `800 34px/1.1 ${F}` }}><span style={{ color: C.brand }}>6</span> new tenders</div>
            <div style={{ position: 'absolute', left: 20, top: 118, width: 300, font: `500 14px/20px ${F}`, color: C.muted }}>Thu 5 Nov · read <b style={{ color: C.ink }}>777</b> pages in 4 languages · <span style={{ fontSize: 11 }}>Simulated AI</span></div>
            <div style={{ position: 'absolute', left: 20, right: 20, top: 178, display: 'flex', justifyContent: 'space-between', font: `600 15px/1 ${F}` }}>
              {[['all', 'All', 6], ['go', 'Go', 1], ['maybe', 'Maybe', 2], ['nogo', 'No-go', 3]].map(([k, l, n], i) => {
                const p = MOTION.pop(T, CUES.Morning + 1.0 + i * 0.08, 0.5);
                return <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottom: k === 'all' ? `2px solid ${C.brand}` : '2px solid transparent', color: k === 'all' ? C.brand : C.muted, opacity: Math.min(1, p * 1.5), transform: `scale(${lerp(.8, 1, p)})` }}>{k === 'all' ? null : <Shape k={k} s={8} color={C[k]} />}{l} {n}</span>;
              })}
            </div>
            {cards.map(([k, sc, title, meta, y], i) => {
              const p = MOTION.enter(T, CUES.Morning + 1.4 + i * 0.12, 0.7);
              return (
                <div key={i} style={{ position: 'absolute', left: 16, right: 16, top: y, borderRadius: R, background: C.surface, padding: 14, display: 'grid', gridTemplateColumns: '48px 1fr', gap: 14, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
                  <div style={{ width: 48, height: 48, borderRadius: R, background: C[k], color: C.bg, display: 'grid', placeItems: 'center', font: `800 20px/1 ${F}` }}>{sc}</div>
                  <div><Status k={k} label={{ go: 'Go', maybe: 'Maybe' }[k]} s={8} size={13} /><div style={{ font: `700 16px/21px ${F}`, marginTop: 4 }}>{title}</div><div style={{ font: `500 13px/18px ${F}`, color: C.muted, marginTop: 6 }}>{meta}</div></div>
                </div>
              );
            })}
          </div>
          <div style={{ position: 'absolute', left: r0.x, top: r0.y, width: r0.w, height: r0.h, borderRadius: r0.r, outline: `1.5px dashed ${C.muted}`, outlineOffset: -1, opacity: expand > 0.05 && expand < 0.999 ? 0.7 : 0 }} />
          <div style={{ position: 'absolute', left: Rk('x'), top: Rk('y'), width: Rk('w'), height: Rk('h'), borderRadius: Rk('r'), overflow: 'hidden', background: mix(C.surface, C.bg, expand), opacity: MOTION.enter(T, CUES.Morning + 1.76, 0.7) }}>
            <div style={{ position: 'absolute', left: 14, right: 14, top: 14, display: 'grid', gridTemplateColumns: '48px 1fr', gap: 14, opacity: 1 - Math.min(1, expand * 3) }}>
              <div style={{ width: 48, height: 48, borderRadius: R, background: C.nogo, color: C.bg, display: 'grid', placeItems: 'center', font: `800 20px/1 ${F}` }}>25</div>
              <div><Status k="nogo" label="No-go" s={8} size={13} /><div style={{ font: `700 16px/21px ${F}`, marginTop: 4 }}>IT security audit and hardening for district administration</div><div style={{ font: `500 13px/18px ${F}`, color: C.muted, marginTop: 6 }}>Landkreis Hohenau · €95k · 22 d</div></div>
            </div>
            <div style={{ opacity: detail }}>
              <span style={{ position: 'absolute', left: 16, top: 12, width: 44, height: 44, borderRadius: R, background: C.surface, display: 'grid', placeItems: 'center' }}><Icon n="chevron_left" s={24} /></span>
              <span style={{ position: 'absolute', right: 20, top: 27, font: `500 13px/1 ${F}`, color: C.muted }}>Simulated AI</span>
              <div style={{ position: 'absolute', left: 20, top: 74 }}>
                <Status k={verdict} label={label} s={12} size={17} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, color: C[verdict] }}><span style={{ font: `800 64px/1 ${F}`, fontVariantNumeric: 'tabular-nums' }}>{score}</span><span style={{ font: `700 20px/1 ${F}`, color: C.muted }}>/100</span></div>
                <div style={{ marginTop: 10, width: 340, font: `600 17px/24px ${F}`, color: C.ink }}>{headline}</div>
              </div>
              <div style={{ position: 'absolute', left: 20, right: 20, top: 248 }}>
                <div style={{ font: `800 22px/28px ${F}` }}>IT security audit and hardening for district administration</div>
                <div style={{ font: `500 13px/18px ${F}`, color: C.muted, marginTop: 4 }}>IT-Sicherheitsaudit und Härtung der Kreisverwaltung · Landkreis Hohenau · Germany</div>
                <div style={{ display: 'flex', gap: 40, marginTop: 12 }}>
                  {[['Value', '€95k'], ['Deadline', '27 Nov · 22 days left']].map(([k, v]) => <div key={k}><div style={{ font: `500 13px/18px ${F}`, color: C.muted }}>{k}</div><div style={{ font: `700 16px/22px ${F}` }}>{v}</div></div>)}
                </div>
              </div>
              <div style={{ position: 'absolute', left: 20, right: 20, top: 434, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: `800 20px/1 ${F}` }}>Can you qualify?</span><span style={{ font: `500 14px/1 ${F}`, color: C.muted }}>{metCount} of 3 met</span>
              </div>
              <div style={{ position: 'absolute', left: 16, right: 16, top: 466, display: 'flex', flexDirection: 'column', gap: 10, opacity: MOTION.enter(T, CUES.Proof + 1.4, 0.6) }}>
                {iso > .5
                  ? card({ v: 'go', l: 'Meets' }, 'Certificate', 'ISO 27001 information security', 'You hold ISO 27001', C.muted, 'Vergabeunterlagen, p. 12, §3.1', C.brand)
                  : card({ v: 'nogo', l: 'Fails' }, 'Knock-out', 'ISO 27001 information security', 'Missing ISO 27001 (mandatory)', C.muted, 'Vergabeunterlagen, p. 12, §3.1', C.brand)}
                {met > .5
                  ? card({ v: 'go', l: 'Meets' }, 'Your answer', 'Staff with “comparable qualification”', 'You said you meet it', C.muted, 'Vergabeunterlagen, p. 14, §3.4', C.brand)
                  : card({ v: 'check', l: 'Needs your check' }, 'Unclear wording', 'Staff with “comparable qualification”', '58% sure. Only you can answer.', C.check, 'Vergabeunterlagen, p. 14, §3.4', C.muted, <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: `700 14px/20px ${F}`, color: C.brand }}>Check<Icon n="arrow_forward" s={16} /></span>)}
              </div>
              <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', gap: 12 }}>
                <span style={{ flex: 1, height: 52, borderRadius: R, background: C.muted, color: C.bg, display: 'grid', placeItems: 'center', font: `700 17px/1 ${F}` }}>Skip</span>
                <span style={{ flex: 2, height: 52, borderRadius: R, background: C.brand, color: C.bg, display: 'grid', placeItems: 'center', font: `700 17px/1 ${F}` }}>Save to Bids</span>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: C.surface, display: 'flex', opacity: 1 - Math.min(1, expand * 2) }}>
            {[['radar', 'Feed', 1], ['bookmarks', 'Bids', 0], ['domain', 'Company', 0], ['badge', 'Profile', 0], ['tune', 'Settings', 0]].map(([ic, l, on]) => (
              <span key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, font: `${on ? 700 : 600} 11px/14px ${F}`, color: on ? C.brand : C.muted }}><Icon n={ic} s={24} />{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// The proof: the original sentence and its translation, the decisive phrase underlined in the check colour.
function Quote({ T, CUES }) {
  const p = MOTION.enter(T, CUES.Proof + 2.4, 0.8), q = MOTION.enter(T, CUES.Lever, 0.5);
  const hl = MOTION.morph(T, CUES.Proof + 3.4, 0.9);
  return (
    <div style={{ position: 'absolute', left: 150, top: 470, width: 860, padding: '34px 40px', borderRadius: R, background: C.surface, opacity: p * (1 - q), transform: `translate(${(1 - p) * -60 - q * 80}px, 0)`, color: C.ink }}>
      <div style={{ font: `500 20px/1 ${F}`, color: C.muted }}>Original (German) · Vergabeunterlagen, p. 12, §3.1</div>
      <div style={{ marginTop: 22, font: `400 34px/50px ${F}` }}>„Der Bieter muss eine gültige <span style={{ position: 'relative', display: 'inline-block', fontWeight: 700, color: mix(C.ink, C.check, hl) }}>Zertifizierung nach ISO/IEC 27001<span style={{ position: 'absolute', left: 0, bottom: 2, height: 3, width: `${hl * 100}%`, background: C.check }} /></span> nachweisen.“</div>
      <div style={{ marginTop: 18, font: `500 26px/36px ${F}`, color: C.muted }}>“The bidder must hold a valid ISO/IEC 27001 certification.”</div>
    </div>
  );
}

// The lever, as in the app since pass 5: Company's re-score card with the score ("Landkreis Hohenau · 25 → 90"), the
// certificate switches with their hints (the target verdict as shape + word, the hint text muted), then the line only
// the owner can answer, in the requirement sheet: the answer pair in the check colour, "We meet it" → 25 → 100, Go.
function Lever({ T, CUES }) {
  const p = MOTION.enter(T, CUES.Lever + 0.6, 0.8), q = MOTION.enter(T, CUES.Number, 0.5);
  const flip = MOTION.morph(T, CUES.Lever + 2.0, 0.35);
  const met = MOTION.morph(T, CUES.Lever + 4.6, 0.3);
  const card = MOTION.pop(T, CUES.Lever + 2.3, 0.6);
  const sheet = MOTION.enter(T, CUES.Lever + 3.1, 0.6) * (1 - MOTION.enter(T, CUES.Lever + 5.2, 0.5));
  const to = met > .5 ? 'go' : 'maybe';
  const toScore = Math.round(met > .5 ? lerp(90, 100, met) : lerp(25, 90, MOTION.enter(T, CUES.Lever + 2.4, 0.6)));
  const toCursor = MOTION.morph(T, CUES.Lever + 1.0, 0.9), toAnswer = MOTION.morph(T, CUES.Lever + 3.6, 0.7);
  const cx = lerp(1300, 890, toCursor) + lerp(0, -140, toAnswer);
  const cy = lerp(900, 755, toCursor) + lerp(0, 35, toAnswer);
  const press = MOTION.enter(T, CUES.Lever + 1.9, 0.12) * (1 - MOTION.enter(T, CUES.Lever + 2.1, 0.2)) + MOTION.enter(T, CUES.Lever + 4.5, 0.12) * (1 - MOTION.enter(T, CUES.Lever + 4.7, 0.2));
  const Switch = ({ on }) => (
    <span style={{ width: 86, height: 52, borderRadius: 26, background: mix(C.muted, C.brand, on), position: 'relative', flex: 'none' }}><span style={{ position: 'absolute', top: 5, left: lerp(5, 39, on), width: 42, height: 42, borderRadius: '50%', background: mix(C.surface, C.bg, on) }} /></span>
  );
  const V = ({ k, l }) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C[k], fontWeight: 700 }}><Shape k={k} s={11} color={C[k]} />{l}</span>;
  const Row = ({ t, s, control, hint }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 28px' }}>
      <div style={{ flex: 1 }}><div style={{ font: `700 30px/38px ${F}` }}>{t}</div>{s ? <div style={{ font: `500 22px/30px ${F}`, color: C.muted }}>{s}</div> : null}<div style={{ font: `500 20px/28px ${F}`, color: C.muted, marginTop: 4 }}>{hint}</div></div>
      {control}
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: p * (1 - q) }}>
      <div style={{ position: 'absolute', left: 150, top: 350, width: 820, padding: '22px 28px', borderRadius: R, background: C.surface, color: C.ink, boxSizing: 'border-box', transform: `translateY(${(1 - p) * 50}px)` }}>
        {card < 0.02
          ? <><div style={{ font: `700 28px/34px ${F}` }}>Change anything below</div><div style={{ font: `500 22px/30px ${F}`, color: C.muted, marginTop: 6 }}>Every tender re-scores at once.</div></>
          : <div style={{ opacity: Math.min(1, card * 1.4), transform: `scale(${lerp(.96, 1, card)})`, transformOrigin: '0 50%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ font: `700 28px/34px ${F}` }}>Landkreis Hohenau</span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12 }}><span style={{ font: `600 24px/1 ${F}`, color: C.muted }}>25</span><Icon n="arrow_forward" s={24} style={{ color: C.muted }} /><span style={{ font: `800 48px/1 ${F}`, color: C[to], fontVariantNumeric: 'tabular-nums', minWidth: 78, textAlign: 'right' }}>{toScore}</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, font: `500 22px/1 ${F}` }}><V k="nogo" l="No-go" /><Icon n="arrow_forward" s={22} style={{ color: C.muted }} /><V k={to} l={to === 'go' ? 'Go' : 'Maybe'} /><span style={{ color: C.muted, marginLeft: 4 }}>just now</span></div>
            </div>}
      </div>
      <div style={{ position: 'absolute', left: 150, top: 510, width: 820, borderRadius: R, background: C.surface, color: C.ink, transform: `translateY(${(1 - p) * 50}px)`, padding: '8px 0', opacity: 1 - sheet * .7 }}>
        <div style={{ padding: '16px 28px 4px', font: `800 26px/1 ${F}` }}>Certificates</div>
        <Row t="ISO 9001" s="Quality management" control={<Switch on={1} />} hint={<>Turn off → Stadt Ellerbach drops to <V k="nogo" l="No-go" /> · +1 more</>} />
        <Row t="ISO 27001" s="Information security" control={<Switch on={flip} />} hint={flip > .5 ? <>Landkreis Hohenau moved up to <V k="maybe" l="Maybe" /> · 25 → 90</> : <>Turn on → Landkreis Hohenau becomes <V k="maybe" l="Maybe" /></>} />
      </div>
      <div style={{ position: 'absolute', left: 150, top: 600, width: 820, padding: '26px 30px', boxSizing: 'border-box', borderRadius: R, background: C.surface, color: C.ink, opacity: sheet, transform: `translateY(${(1 - sheet) * 120}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, font: `700 22px/1 ${F}` }}><V k="check" l="Needs your check" /><span style={{ font: `500 18px/1 ${F}`, color: C.muted }}>Simulated AI</span><span style={{ marginLeft: 'auto', font: `600 20px/1 ${F}`, color: C.ink }}>58% AI confidence</span></div>
        <div style={{ font: `800 34px/42px ${F}`, marginTop: 14 }}>Staff with “comparable qualification”</div>
        <div style={{ font: `500 22px/30px ${F}`, color: C.muted, marginTop: 6 }}>„Das eingesetzte Personal verfügt über <span style={{ color: C.check, textDecoration: 'underline', fontWeight: 700 }}>eine vergleichbare Qualifikation</span>.“ · p. 14, §3.4</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 22 }}>
          <span style={{ flex: 1, height: 64, borderRadius: R, background: C.check, color: C.bg, display: 'grid', placeItems: 'center', font: `700 24px/1 ${F}`, opacity: 1 - met * .5 }}>We don’t meet it</span>
          <span style={{ flex: 1, height: 64, borderRadius: R, background: met > .5 ? C.brand : C.check, color: C.bg, display: 'grid', placeItems: 'center', font: `700 24px/1 ${F}` }}>We meet it</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: cx, top: cy, width: 40, height: 40, transform: `scale(${1 - press * .15})`, opacity: 1 - MOTION.enter(T, CUES.Lever + 5.6, 0.5) }}>
        <svg width="40" height="40" viewBox="0 0 24 24"><path d="M4 2l16 11-7 1.5L9.5 21z" fill={C.ink} stroke={C.bg} strokeWidth="1.5" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
}

function Numbers({ T, CUES }) {
  const q = MOTION.enter(T, CUES.CTA, 0.5);
  const stats = [['777', 'pages read tonight'], ['4', 'languages, translated'], ['< 60 s', 'to a verdict, with proof']];
  return (
    <div style={{ position: 'absolute', left: 140, top: 170, display: 'flex', flexDirection: 'column', gap: 34, opacity: 1 - q }}>
      {stats.map(([n, l], i) => {
        const p = MOTION.enter(T, CUES.Number + 0.4 + i * 0.5, 0.8);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 30, opacity: p, transform: `translateX(${(1 - p) * -60}px)`, color: C.ink }}>
            <span style={{ font: `800 168px/.9 ${F}`, minWidth: 560, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
            <span style={{ font: `600 40px/1.1 ${F}`, color: C.muted }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
}

function CTA({ T, CUES }) {
  const a = MOTION.enter(T, CUES.CTA + 0.3, 0.9), b = MOTION.enter(T, CUES.CTA + 0.9, 0.8), c = MOTION.pop(T, CUES.CTA + 1.5, 0.6);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.ink, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36, font: `800 190px/1 ${F}`, opacity: a, transform: `translateY(${(1 - a) * 40}px) scale(${lerp(.96, 1, a)})` }}><span style={{ width: 56, height: 56, borderRadius: '50%', background: C.brand, display: 'inline-block' }} />TenderScout</div>
      <div style={{ marginTop: 26, font: `600 48px/1.2 ${F}`, color: C.muted, opacity: b, transform: `translateY(${(1 - b) * 24}px)` }}>Find public tenders you can actually win</div>
      <div style={{ marginTop: 56, height: 96, padding: '0 48px', borderRadius: R, background: C.brand, color: C.bg, display: 'flex', alignItems: 'center', font: `700 38px/1 ${F}`, opacity: Math.min(1, c * 1.5), transform: `scale(${lerp(.85, 1, c)})` }}>Draft my profile</div>
    </div>
  );
}

function Film() {
  const { T, CUES } = useComposition();
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: F, background: C.bg }}>
      <div style={{ position: 'absolute', left: 140, top: 92, display: 'flex', alignItems: 'center', gap: 12, font: `800 30px/1 ${F}`, color: C.ink, opacity: 1 - MOTION.enter(T, CUES.CTA, 0.4) }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: C.brand }} />TenderScout
      </div>
      <Opening T={T} CUES={CUES} />
      <Marquee T={T} CUES={CUES} />
      <Headlines T={T} CUES={CUES} />
      <PageCounter T={T} CUES={CUES} />
      <Quote T={T} CUES={CUES} />
      <Lever T={T} CUES={CUES} />
      <Phone T={T} CUES={CUES} />
      <Numbers T={T} CUES={CUES} />
      <CTA T={T} CUES={CUES} />
      <div style={{ position: 'absolute', left: 140, bottom: 44, font: `500 18px/1 ${F}`, color: C.muted }}>Prototype · real rules, fictional companies and tenders</div>
    </div>
  );
}

function LaunchFilmApp() {
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
  return (
    <>
      <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#02040A">
        <Film />
      </CompositionStage>
      <window.TweaksPanel>
        <window.TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
      </window.TweaksPanel>
    </>
  );
}
window.LaunchFilmApp = LaunchFilmApp;
