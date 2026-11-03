// TenderScout · 8s loop cover (1080×1350): six score bars morph into the three verdict tiles and back.
const { useComposition, CompositionStage, animate, Easing } = window;
const F = "'Hanken Grotesk', sans-serif", MONO = "'IBM Plex Mono', monospace";
const MOTION = {
  enter: (T, s, d = 0.6) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeOutCubic })(T),
  morph: (T, s, d = 1) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeInOutQuart })(T),
  pop: (T, s, d = 0.5) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeOutBack })(T)
};
const lerp = (a, b, p) => a + (b - a) * p;
const PAL = {
  Sky: { bg: '#EEF3F8', img: 'assets/sky-clouds.png', veil: 'rgba(238,243,248,.82)', ink: '#0E1B2B', muted: '#4A5A6D', accent: '#F2643A', nogo: '#E04A2F' },
  Harbor: { bg: '#0C1633', img: 'assets/harbor-dusk.png', veil: 'rgba(12,22,51,.78)', ink: '#FFFFFF', muted: '#BCD7E8', accent: '#D81E5B', nogo: '#C93A22' }
};
const ROWS = [['go', 100, 'Stadt Ellerbach', 'DE'], ['maybe', 90, 'Stadtwerke Kaltbrunn', 'AT'], ['maybe', 85, 'Universidad de Valdemora', 'ES'], ['nogo', 25, 'Landkreis Hohenau', 'DE'], ['nogo', 25, 'Gemeente Vlietdam', 'NL'], ['nogo', 25, 'Centre Hospitalier de Morlanne', 'FR']];
const Shape = ({ k, s, color }) => {
  const b = { width: s, height: s, background: color, display: 'inline-block', flex: 'none' };
  if (k === 'go') return <span style={{ ...b, borderRadius: '50%' }} />;
  if (k === 'maybe') return <span style={{ ...b, width: s * 1.1, clipPath: 'polygon(50% 0,100% 100%,0 100%)' }} />;
  return <span style={{ ...b, width: s * .9, height: s * .9 }} />;
};

function Loop({ palette }) {
  const { T, CUES, authoredTotal } = useComposition();
  const P = PAL[palette] || PAL.Sky;
  const COL = { go: ['#13724B', '#fff'], maybe: ['#F5A524', '#1A1200'], nogo: [P.nogo, '#fff'] };
  const grow = k => MOTION.enter(T, 0.15 + k * 0.08, 0.7) * (1 - MOTION.morph(T, CUES.Return + 0.5, 0.85));
  const m = MOTION.morph(T, 1.15, 1.0) * (1 - MOTION.morph(T, CUES.Return, 0.7));
  const tileW = { go: 146, maybe: 292, nogo: 438 }, tileX = { go: 90, maybe: 248, nogo: 552 };
  const idx = { go: 0, maybe: 0, nogo: 0 }, cnt = { go: 1, maybe: 2, nogo: 3 };
  const top = 430, H = 640;
  const hold = MOTION.enter(T, CUES.Hold, 0.6) * (1 - MOTION.enter(T, CUES.Return, 0.4));
  const pulse = 0.5 + 0.5 * Math.sin((T - CUES.Hold) * 2.4);
  const drift = (T / authoredTotal) * 1400;
  return (
    <div data-screen-label={`t=${T.toFixed(0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: P.bg, fontFamily: F, color: P.ink }}>
      <img src={P.img} style={{ position: 'absolute', inset: -30, width: 1140, height: 1410, objectFit: 'cover', transform: `scale(${1.04 + 0.03 * Math.sin(T / authoredTotal * Math.PI * 2)})` }} />
      <div style={{ position: 'absolute', inset: 0, background: P.veil }} />
      <div style={{ position: 'absolute', left: 90, top: 90, display: 'flex', alignItems: 'center', gap: 12, font: `800 36px/1 ${F}`, letterSpacing: '-.03em' }}><span style={{ width: 13, height: 13, borderRadius: '50%', background: P.accent }} />TenderScout</div>
      <div style={{ position: 'absolute', left: 90, top: 190, width: 900, height: 200 }}>
        <div style={{ position: 'absolute', inset: 0, font: `800 84px/88px ${F}`, letterSpacing: '-.045em', opacity: 1 - MOTION.enter(T, 1.0, 0.4) * (1 - MOTION.enter(T, CUES.Return + 0.7, 0.5)) }}>6 tenders read tonight.</div>
        <div style={{ position: 'absolute', inset: 0, font: `800 84px/88px ${F}`, letterSpacing: '-.045em', opacity: MOTION.enter(T, 1.45, 0.5) * (1 - MOTION.enter(T, CUES.Return, 0.4)), transform: `translateY(${(1 - MOTION.enter(T, 1.45, 0.5)) * 20}px)` }}>Which ones can you win?</div>
      </div>
      {ROWS.map(([k, sc, buyer, cc], i) => {
        const bar = { x: 90, y: top + i * 108, w: 9 * sc * grow(i), h: 92, r: 20 };
        const slot = idx[k]++, h = H / cnt[k];
        const tile = { x: tileX[k], y: top + slot * h, w: tileW[k], h: h + (slot < cnt[k] - 1 ? 3 : 0), r: 0 };
        const R = key => lerp(bar[key], tile[key], m);
        const pad = Math.min(22, R('w') / 5);
        return (
          <div key={i} style={{ position: 'absolute', left: R('x'), top: R('y'), width: R('w'), height: R('h'), background: COL[k][0], color: COL[k][1], borderRadius: lerp(20, 0, m), overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14, padding: `0 ${pad}px`, boxSizing: 'border-box', whiteSpace: 'nowrap', opacity: Math.max(m, Math.min(1, grow(i) * 6)) }}>
            <span style={{ font: `800 34px/1 ${F}`, letterSpacing: '-.03em', opacity: 1 - m }}>{sc}</span>
            <span style={{ font: `600 24px/1 ${F}`, opacity: (1 - m) * Math.min(1, grow(i) * 2) }}>{buyer} · {cc}</span>
          </div>
        );
      })}
      {['go', 'maybe', 'nogo'].map((k, i) => (
        <div key={k} style={{ position: 'absolute', left: tileX[k], top, width: tileW[k], height: H, borderRadius: 34, boxShadow: `0 0 0 ${lerp(0, 10, m)}px ${P.bg}`, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 22, bottom: 26, color: COL[k][1], opacity: hold }}>
            <Shape k={k} s={18} color={COL[k][1]} />
            <div style={{ font: `800 ${k === 'go' ? 88 : 120}px/1 ${F}`, letterSpacing: '-.05em', marginTop: 14, transform: `scale(${1 + (k === 'go' ? 0.04 * pulse : 0)})`, transformOrigin: '0 100%' }}>{[1, 2, 3][i]}</div>
            <div style={{ font: `700 ${k === 'go' ? 24 : 30}px/1 ${F}`, marginTop: 8 }}>{['Go', 'Maybe', 'No-go'][i]}</div>
          </div>
        </div>
      ))}
      <div style={{ position: 'absolute', left: 90, top: top - 6, width: 900, height: H + 12, borderRadius: 34, boxShadow: `inset 0 0 0 ${lerp(0, 8, m)}px ${P.bg}`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, whiteSpace: 'nowrap', font: `300 34px/1 ${F}`, color: P.muted, transform: `translateX(${-drift}px)`, opacity: 0.85 }}>
        {'Construction work · IT services · Installation · Telecom equipment · Cleaning · Health & social care · Software · Architecture & engineering · Transport services · Education & training · Utilities · Security & defence · Construction work · IT services · Installation · Telecom equipment · Cleaning · Health & social care · Software'}
      </div>
      <div style={{ position: 'absolute', left: 90, right: 90, bottom: 70, display: 'flex', justifyContent: 'space-between', font: `500 20px/1 ${MONO}`, color: P.muted }}><span>Read overnight · with the page that proves it</span><span>Prototype · fictional data</span></div>
    </div>
  );
}

function LoopApp() {
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
  return (
    <>
      <CompositionStage width={1080} height={1350} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={(PAL[t.palette] || PAL.Sky).bg}>
        <Loop palette={t.palette} />
      </CompositionStage>
      <window.TweaksPanel>
        <window.TweakRadio label="Palette" value={t.palette} options={['Sky', 'Harbor']} onChange={v => setTweak('palette', v)} />
        <window.TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
      </window.TweaksPanel>
    </>
  );
}
window.LoopApp = LoopApp;
