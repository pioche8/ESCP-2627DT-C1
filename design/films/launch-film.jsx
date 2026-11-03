// TenderScout · 45s launch film (1920×1080). Harbor night → Sky morning. Built on animations-v3.
const { useComposition, CompositionStage, animate, Easing } = window;

const C = {
  navy: '#0C1633', night: '#121A30', white: '#FFFFFF', nightMuted: '#BCD7E8', pink: '#D81E5B', sea: '#1A7AA3',
  cloud: '#EEF3F8', ink: '#0E1B2B', muted: '#4A5A6D', amber: '#F2643A', sky: '#5DB8F5', card: '#FFFFFF', line: '#DCE4ED',
  go: '#13724B', maybe: '#F5A524', maybeOn: '#1A1200', nogo: '#D23A2E', check: '#6145E0', blueText: '#0A6CBC'
};
const F = "'Hanken Grotesk', sans-serif", MONO = "'IBM Plex Mono', monospace", ICON = "'Material Symbols Rounded'";

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

const SECTORS = [['03','Agriculture & forestry'],['09','Fuel & energy'],['14','Mining & metals'],['15','Food & drink'],['16','Farm machinery'],['18','Clothing & footwear'],['19','Textiles & plastics'],['22','Printing'],['24','Chemicals'],['30','Office & computing'],['31','Electrical & lighting'],['32','Telecom equipment'],['33','Medical & pharma'],['34','Vehicles & transport'],['35','Security & defence'],['37','Sport & games'],['38','Lab & precision'],['39','Furniture'],['41','Water supply'],['42','Industrial machinery'],['43','Construction machinery'],['44','Building materials'],['45','Construction work'],['48','Software'],['50','Repair & maintenance'],['51','Installation'],['55','Hotels & catering'],['60','Transport services'],['63','Logistics & travel'],['64','Postal & telecom'],['65','Utilities'],['66','Finance & insurance'],['70','Real estate'],['71','Architecture & engineering'],['72','IT services'],['73','Research & development'],['75','Public administration'],['76','Oil & gas services'],['77','Landscaping'],['79','Business services'],['80','Education & training'],['85','Health & social care'],['90','Cleaning & environment'],['92','Culture & sport'],['98','Community services']];

function Backdrop({ T, CUES, total }) {
  const sky = MOTION.morph(T, CUES.Morning - 0.2, 1.6);
  const push = 1.04 + 0.05 * (T / total);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: C.navy }}>
      <img src="assets/harbor-dusk.png" style={{ position: 'absolute', inset: -40, width: 2000, height: 1160, objectFit: 'cover', transform: `scale(${push})` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(12,22,51,.92) 0%, rgba(12,22,51,.55) 55%, rgba(12,22,51,.25) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${(1 - sky) * 100}% 0 0 0)`, background: C.cloud }}>
        <img src="assets/sky-clouds.png" style={{ position: 'absolute', inset: -40, width: 2000, height: 1160, objectFit: 'cover', transform: `scale(${push})` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(238,243,248,.95) 0%, rgba(238,243,248,.7) 45%, rgba(238,243,248,.15) 100%)' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, height: 3, top: `${(1 - sky) * 100}%`, background: C.amber, opacity: sky > 0.02 && sky < 0.98 ? 1 : 0 }} />
    </div>
  );
}

function Marquee({ T, CUES }) {
  const o = vis(T, CUES.Night + 1.2, CUES.Morning - 0.4);
  const rows = [0, 1, 2, 3].map(r => SECTORS.filter((_, i) => i % 4 === r));
  const own = { '32': 1, '45': 1, '51': 1, '72': 1 };
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 640, opacity: o, WebkitMaskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)', maskImage: 'linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)' }}>
      {rows.map((items, i) => {
        const speed = [70, 52, 84, 60][i] * (i % 2 ? -1 : 1);
        const x = ((T * speed) % 1800 + 1800) % 1800;
        return (
          <div key={i} style={{ height: 70, display: 'flex', whiteSpace: 'nowrap', transform: `translateX(${-x}px)`, font: `300 44px/70px ${F}`, color: C.white, letterSpacing: '-.02em' }}>
            {[0, 1, 2].map(g => items.map(([c, t]) => (
              <span key={g + c} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, marginRight: 34, fontWeight: own[c] ? 700 : 300, opacity: own[c] ? 1 : .78 }}>
                <span style={{ font: `500 18px/1 ${MONO}`, opacity: .6 }}>{c}</span>{t}
              </span>
            )))}
          </div>
        );
      })}
    </div>
  );
}

function Headlines({ T, CUES }) {
  const sky = MOTION.morph(T, CUES.Morning - 0.2, 1.6);
  const ink = mix('#FFFFFF', C.ink, sky);
  const line = (text, a, b, y, extra = {}) => {
    const p = MOTION.enter(T, a, 0.8), q = MOTION.enter(T, b, 0.5);
    return (
      <div style={{ position: 'absolute', left: 140, top: y, width: 980, opacity: p * (1 - q), transform: `translateY(${(1 - p) * 40 - q * 30}px)`, font: `800 96px/100px ${F}`, letterSpacing: '-.045em', color: ink, textWrap: 'balance', ...extra }}>{text}</div>
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
    <div style={{ position: 'absolute', left: 140, top: 552, opacity: o, display: 'flex', alignItems: 'baseline', gap: 22, color: C.white }}>
      <span style={{ font: `800 72px/1 ${F}`, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
      <span style={{ font: `600 26px/1 ${F}`, color: C.nightMuted }}>pages · DE · ES · NL · FR</span>
    </div>
  );
}

function Phone({ T, CUES }) {
  const inP = MOTION.pop(T, CUES.Morning + 0.4, 0.8);
  const out = MOTION.morph(T, CUES.Number, 0.9);
  const lever = MOTION.morph(T, CUES.Lever + 2.2, 1.0);
  const expand = MOTION.morph(T, CUES.Proof + 0.2, 1.1);
  const counts = { go: lerp(1, 2, lever), maybe: 2, nogo: lerp(3, 2, lever) };
  const tiles = [['go', C.go, '#fff', 'Go', counts.go, Math.round(counts.go)], ['maybe', C.maybe, C.maybeOn, 'Maybe', 2, 2], ['nogo', C.nogo, '#fff', 'No-go', counts.nogo, Math.round(counts.nogo)]];
  const cards = [
    ['go', C.go, '#fff', 100, 'Structured cabling and Wi-Fi for 12 primary schools', 'Stadt Ellerbach · €480k · 29 d', 't-schools', 248],
    ['maybe', C.maybe, C.maybeOn, 90, 'Fibre-to-the-building rollout', 'Stadtwerke Kaltbrunn · €1.1M · 43 d', 't-fibre', 434]
  ];
  const r0 = { x: 16, y: 600, w: 358, h: 168, r: 24 }, r1 = { x: 0, y: 0, w: 390, h: 844, r: 0 };
  const R = k => lerp(r0[k], r1[k], expand);
  const headCol = mix(C.nogo, C.go, lever);
  const score = Math.round(lerp(25, 92, lever));
  const detail = MOTION.enter(T, CUES.Proof + 0.9, 0.6);
  return (
    <div style={{ position: 'absolute', left: 1240, top: 70, transform: `translateY(${(1 - inP) * 140 + out * 40}px) translateX(${out * 760}px) scale(${lerp(.9, 1, inP) * 1.12})`, transformOrigin: '50% 0', opacity: Math.min(1, inP * 1.4) * (1 - out) }}>
      <div style={{ position: 'absolute', left: -60, right: -60, bottom: -50, height: 140, background: 'radial-gradient(closest-side, rgba(10,30,60,.35), rgba(10,30,60,0))' }} />
      <div style={{ position: 'relative', width: 414, height: 868, boxSizing: 'border-box', padding: 11, borderRadius: 70, background: '#1B1C20' }}>
        <div style={{ position: 'relative', width: 390, height: 844, borderRadius: 58, overflow: 'hidden', background: C.cloud, fontFamily: F, color: C.ink }}>
          <div style={{ position: 'absolute', left: 20, top: 66, font: `700 14px/1 ${F}`, color: C.muted }}>Mon 2 Nov · read overnight</div>
          <div style={{ position: 'absolute', left: 20, top: 84, font: `800 30px/1.2 ${F}`, letterSpacing: '-.04em' }}>6 new tenders</div>
          <div style={{ position: 'absolute', left: 16, right: 16, top: 136, height: 92, display: 'flex', gap: 6 }}>
            {tiles.map(([k, bg, on, l, grow, n], i) => {
              const p = MOTION.pop(T, CUES.Morning + 1.0 + i * 0.08, 0.5);
              return (
                <div key={k} style={{ flex: grow, minWidth: 0, borderRadius: 22, background: bg, color: on, padding: '12px 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transform: `scale(${lerp(.6, 1, p)})`, opacity: Math.min(1, p * 1.5) }}>
                  <Shape k={k} s={10} />
                  <div><div style={{ font: `800 38px/1 ${F}`, letterSpacing: '-.05em' }}>{n}</div><div style={{ font: `700 13px/16px ${F}`, marginTop: 3 }}>{l}</div></div>
                </div>
              );
            })}
          </div>
          {cards.map(([k, bg, on, sc, title, meta, img, y], i) => {
            const p = MOTION.enter(T, CUES.Morning + 1.4 + i * 0.12, 0.7);
            return (
              <div key={i} style={{ position: 'absolute', left: 16, right: 16, top: y, borderRadius: 24, background: C.card, overflow: 'hidden', boxShadow: '0 10px 28px -12px rgba(30,80,140,.22)', opacity: p * (1 - expand * .6), transform: `translateY(${(1 - p) * 30}px)` }}>
                <img src={`assets/${img}.png`} style={{ display: 'block', width: '100%', height: 70, objectFit: 'cover' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 12, padding: '0 14px 14px' }}>
                  <div style={{ width: 52, height: 52, marginTop: -26, borderRadius: 16, background: bg, color: on, display: 'grid', placeItems: 'center', font: `800 20px/1 ${F}`, boxShadow: '0 0 0 4px #fff' }}>{sc}</div>
                  <div style={{ paddingTop: 10 }}><div style={{ font: `700 15px/19px ${F}` }}>{title}</div><div style={{ font: `500 12px/16px ${F}`, color: C.muted, marginTop: 4 }}>{meta}</div></div>
                </div>
              </div>
            );
          })}
          <div style={{ position: 'absolute', left: r0.x, top: r0.y, width: r0.w, height: r0.h, borderRadius: r0.r, boxShadow: 'inset 0 0 0 2px rgba(14,27,43,.18)', opacity: expand > 0.05 && expand < 0.999 ? 0.7 * (1 - lever) : 0 }} />
          <div style={{ position: 'absolute', left: R('x'), top: R('y'), width: R('w'), height: R('h'), borderRadius: R('r'), overflow: 'hidden', background: C.card, boxShadow: '0 10px 28px -12px rgba(30,80,140,.25)', opacity: MOTION.enter(T, CUES.Morning + 1.64, 0.7) }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: lerp(70, 400, expand), background: '#fff', overflow: 'hidden', isolation: 'isolate', borderRadius: `0 0 ${36 * expand}px ${36 * expand}px` }}>
              <div style={{ position: 'absolute', inset: 0, background: headCol, opacity: Math.min(1, expand * 1.6) }} />
              <img src="assets/t-audit.png" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: lerp(1, .5, expand), filter: `grayscale(${expand})` }} />
            </div>
            <div style={{ position: 'absolute', left: 14, right: 14, top: 70, display: 'grid', gridTemplateColumns: '52px 1fr', gap: 12, opacity: 1 - Math.min(1, expand * 3) }}>
              <div style={{ width: 52, height: 52, marginTop: -26, borderRadius: 16, background: C.nogo, color: '#fff', display: 'grid', placeItems: 'center', font: `800 20px/1 ${F}`, boxShadow: '0 0 0 4px #fff' }}>25</div>
              <div style={{ paddingTop: 10 }}><div style={{ font: `700 15px/19px ${F}` }}>IT security audit</div><div style={{ font: `500 12px/16px ${F}`, color: C.muted, marginTop: 4 }}>Landkreis Hohenau · €95k · 18 d</div></div>
            </div>
            <div style={{ position: 'absolute', left: 22, top: 112, color: '#fff', opacity: detail }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `700 16px/1 ${F}` }}><Shape k={lever > .5 ? 'go' : 'nogo'} s={11} color="#fff" />{lever > .5 ? 'Go' : 'No-go'}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 14 }}><span style={{ font: `800 140px/.78 ${F}`, letterSpacing: '-.075em', fontVariantNumeric: 'tabular-nums' }}>{score}</span><span style={{ font: `700 22px/1 ${F}` }}>/100</span></div>
              <div style={{ marginTop: 22, width: 340, font: `600 17px/24px ${F}` }}>{lever > .5 ? 'Meets 5 of 6 requirements. One more needs your answer.' : '1 knock-out requirement: you don’t hold ISO 27001.'}</div>
            </div>
            <div style={{ position: 'absolute', left: 20, top: 424, opacity: detail }}>
              <div style={{ font: `800 24px/30px ${F}`, letterSpacing: '-.03em' }}>IT security audit</div>
              <div style={{ font: `italic 400 14px/19px ${F}`, color: C.muted }}>IT-Sicherheitsaudit · Landkreis Hohenau</div>
            </div>
            <div style={{ position: 'absolute', left: 16, right: 16, top: 500, padding: '14px 16px', borderRadius: 22, background: '#fff', boxShadow: '0 10px 28px -12px rgba(30,80,140,.3), inset 0 0 0 1px #E4E8EE', opacity: MOTION.enter(T, CUES.Proof + 1.4, 0.6) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, font: `700 12px/16px ${F}`, color: lever > .5 ? '#0E5C3C' : '#A42A20' }}><Shape k={lever > .5 ? 'go' : 'nogo'} s={8} />{lever > .5 ? 'Met' : 'Fails · Knock-out'}</div>
              <div style={{ font: `700 16px/21px ${F}`, marginTop: 3 }}>ISO 27001 certification</div>
              <div style={{ font: `500 14px/19px ${F}`, color: C.muted }}>{lever > .5 ? 'In your profile since today.' : 'Not in your profile.'}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, height: 26, padding: '0 10px', borderRadius: 13, background: '#F4F7FB', font: `500 12px/1 ${MONO}`, color: C.blueText }}><Icon n="description" s={14} />Vergabeunterlagen p. 12</div>
            </div>
          </div>
          <div style={{ position: 'absolute', top: 11, left: 133, width: 124, height: 36, borderRadius: 20, background: '#000' }} />
        </div>
      </div>
    </div>
  );
}

function Quote({ T, CUES }) {
  const p = MOTION.enter(T, CUES.Proof + 2.4, 0.8), q = MOTION.enter(T, CUES.Lever, 0.5);
  const hl = MOTION.morph(T, CUES.Proof + 3.4, 0.9);
  return (
    <div style={{ position: 'absolute', left: 150, top: 470, width: 860, padding: '40px 40px 34px', borderRadius: 30, background: '#fff', boxShadow: '0 40px 80px -30px rgba(14,27,43,.45)', opacity: p * (1 - q), transform: `translate(${(1 - p) * -60 - q * 80}px, 0) rotate(-1.5deg)`, color: C.ink }}>
      <span style={{ position: 'absolute', top: -18, left: 32, height: 36, padding: '0 16px', borderRadius: 999, background: C.ink, color: '#fff', font: `600 15px/36px ${MONO}`, letterSpacing: '.08em' }}>ORIGINAL · GERMAN</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 18px/1 ${MONO}`, color: '#7A8899' }}><span>Vergabeunterlagen</span><span>p. 12 · §3.1</span></div>
      <div style={{ marginTop: 22, font: `500 34px/50px ${F}` }}>„Der Bieter muss eine gültige <span style={{ backgroundImage: `linear-gradient(rgba(93,184,245,.45), rgba(93,184,245,.45))`, backgroundSize: `${hl * 100}% 100%`, backgroundRepeat: 'no-repeat', boxShadow: `inset 0 -3px 0 ${hl > .99 ? C.blueText : 'transparent'}`, borderRadius: 6, padding: '0 4px' }}>Zertifizierung nach ISO/IEC 27001</span> nachweisen.“</div>
      <div style={{ marginTop: 18, paddingTop: 16, borderTop: '2px dashed #DCE4ED', font: `500 26px/36px ${F}`, color: C.muted }}>“The bidder must hold a valid ISO/IEC 27001 certification.”</div>
    </div>
  );
}

function Lever({ T, CUES }) {
  const p = MOTION.enter(T, CUES.Lever + 0.6, 0.8), q = MOTION.enter(T, CUES.Number, 0.5);
  const flip = MOTION.morph(T, CUES.Lever + 2.0, 0.35);
  const card = MOTION.pop(T, CUES.Lever + 2.6, 0.6);
  const cx = lerp(1300, 905, MOTION.morph(T, CUES.Lever + 1.0, 0.9)), cy = lerp(900, 560, MOTION.morph(T, CUES.Lever + 1.0, 0.9));
  const press = MOTION.enter(T, CUES.Lever + 1.9, 0.12) * (1 - MOTION.enter(T, CUES.Lever + 2.1, 0.2));
  const Row = ({ t, s, on, hint }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '22px 28px', borderTop: '1px solid #E4E8EE' }}>
      <div style={{ flex: 1 }}><div style={{ font: `700 30px/38px ${F}` }}>{t}</div><div style={{ font: `500 22px/30px ${F}`, color: C.muted }}>{s}</div>{hint}</div>
      <span style={{ width: 86, height: 52, borderRadius: 999, background: mix('#D7DEE7', C.sky, on), position: 'relative', flex: 'none' }}><span style={{ position: 'absolute', top: 5, left: lerp(5, 39, on), width: 42, height: 42, borderRadius: '50%', background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,.2)' }} /></span>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: p * (1 - q) }}>
      <div style={{ position: 'absolute', left: 150, top: 380, width: 820, borderRadius: 36, background: '#fff', boxShadow: '0 40px 80px -30px rgba(14,27,43,.4)', overflow: 'hidden', color: C.ink, transform: `translateY(${(1 - p) * 50}px)` }}>
        <div style={{ padding: '26px 28px 18px', font: `700 22px/1 ${F}`, color: C.muted }}>Company · Certificates</div>
        <Row t="ISO 9001" s="Quality management" on={1} />
        <Row t="ISO 27001" s="Information security" on={flip} hint={<div style={{ font: `700 20px/28px ${F}`, color: flip > .5 ? '#0E5C3C' : C.blueText, marginTop: 4 }}>{flip > .5 ? '✓ Unlocked Landkreis Hohenau' : 'Turn on → Landkreis Hohenau becomes Go'}</div>} />
      </div>
      <div style={{ position: 'absolute', left: 150, top: 800, display: 'flex', alignItems: 'center', gap: 22, padding: '22px 30px 22px 22px', borderRadius: 30, background: '#fff', boxShadow: '0 30px 60px -24px rgba(14,27,43,.45)', color: C.ink, opacity: Math.min(1, card * 1.4), transform: `translateY(${(1 - card) * -24}px) scale(${lerp(.94, 1, card)})`, transformOrigin: '0 0' }}>
        <span style={{ width: 64, height: 64, borderRadius: 20, background: C.go, color: '#fff', display: 'grid', placeItems: 'center' }}><Icon n="trending_up" s={36} /></span>
        <div><div style={{ font: `800 28px/34px ${F}` }}>Landkreis Hohenau</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, font: `700 20px/1 ${F}` }}>
            <span style={{ height: 34, padding: '0 12px', borderRadius: 10, background: C.nogo, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><Shape k="nogo" s={10} />No-go</span>
            <Icon n="arrow_forward" s={24} style={{ color: '#7A8899' }} />
            <span style={{ height: 34, padding: '0 12px', borderRadius: 10, background: C.go, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><Shape k="go" s={10} />Go</span>
            <span style={{ font: `500 20px/1 ${F}`, color: C.muted, marginLeft: 6 }}>just now</span></div></div>
      </div>
      <div style={{ position: 'absolute', left: cx, top: cy, width: 40, height: 40, transform: `scale(${1 - press * .15})`, opacity: 1 - MOTION.enter(T, CUES.Lever + 3.4, 0.5) }}>
        <svg width="40" height="40" viewBox="0 0 24 24"><path d="M4 2l16 11-7 1.5L9.5 21z" fill="#0E1B2B" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" /></svg>
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
            <span style={{ font: `800 168px/.9 ${F}`, letterSpacing: '-.06em', minWidth: 520, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
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
      <div style={{ font: `800 190px/1 ${F}`, letterSpacing: '-.06em', opacity: a, transform: `translateY(${(1 - a) * 40}px) scale(${lerp(.96, 1, a)})` }}>TenderScout</div>
      <div style={{ marginTop: 26, font: `600 48px/1.2 ${F}`, letterSpacing: '-.02em', color: C.muted, opacity: b, transform: `translateY(${(1 - b) * 24}px)` }}>Find public tenders you can actually win</div>
      <div style={{ marginTop: 56, height: 96, padding: '0 48px', borderRadius: 32, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', gap: 16, font: `700 38px/1 ${F}`, opacity: Math.min(1, c * 1.5), transform: `scale(${lerp(.85, 1, c)})` }}>Draft my profile<Icon n="arrow_forward" s={42} /></div>
    </div>
  );
}

function Film() {
  const { T, CUES, authoredTotal } = useComposition();
  const sky = MOTION.morph(T, CUES.Morning - 0.2, 1.6);
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: F }}>
      <Backdrop T={T} CUES={CUES} total={authoredTotal} />
      <div style={{ position: 'absolute', left: 140, top: 92, display: 'flex', alignItems: 'center', gap: 12, font: `800 30px/1 ${F}`, letterSpacing: '-.03em', color: mix('#FFFFFF', C.ink, sky), opacity: 1 - MOTION.enter(T, CUES.CTA, 0.4) }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: mix(C.pink, C.amber, sky) }} />TenderScout
      </div>
      <Marquee T={T} CUES={CUES} />
      <Headlines T={T} CUES={CUES} />
      <PageCounter T={T} CUES={CUES} />
      <Quote T={T} CUES={CUES} />
      <Lever T={T} CUES={CUES} />
      <Phone T={T} CUES={CUES} />
      <Numbers T={T} CUES={CUES} />
      <CTA T={T} CUES={CUES} />
      <div style={{ position: 'absolute', right: 60, bottom: 44, font: `500 18px/1 ${MONO}`, color: mix('#BCD7E8', C.muted, sky), letterSpacing: '.04em' }}>Prototype · fictional data</div>
    </div>
  );
}

function LaunchFilmApp() {
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
  return (
    <>
      <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#0C1633">
        <Film />
      </CompositionStage>
      <window.TweaksPanel>
        <window.TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
      </window.TweaksPanel>
    </>
  );
}
window.LaunchFilmApp = LaunchFilmApp;
