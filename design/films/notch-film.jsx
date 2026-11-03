// TenderScout · notch launch film (1920×1080), after the pack's apple-launch-film recipe.
// Original take: no Apple marks or "hello" script. The notch grows into one widget per scene.
const { useComposition, CompositionStage, animate, Easing } = window;
const F = "'Hanken Grotesk', sans-serif", MONO = "'IBM Plex Mono', monospace";
const MOTION = {
  enter: (T, s, d = 0.5) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeOutCubic })(T),
  morph: (T, s, d = 0.8) => animate({ from: 0, to: 1, start: s, end: s + d, ease: Easing.easeInOutQuart })(T),
  spring: (t, w = 9, z = 0.82) => { if (t <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }
};
const SC = ['Open', 'Night', 'Verdict', 'Proof', 'Lever', 'Bids', 'Close'];
const SIZE = { Rest: [210, 36], Open: [380, 72], Night: [640, 156], Verdict: [720, 230], Proof: [860, 212], Lever: [660, 176], Bids: [620, 168], Close: [210, 36] };
const WALL = {
  Open: '#000',
  Night: 'radial-gradient(120% 90% at 28% 18%, #2390BD 0%, #13224F 52%, #0A0F1E 100%)',
  Verdict: 'radial-gradient(120% 90% at 72% 8%, #BFE4FC 0%, #5DB8F5 42%, #1F6FB5 100%)',
  Proof: 'radial-gradient(120% 90% at 50% 0%, #FFFFFF 0%, #DCEFFD 48%, #8FC9F2 100%)',
  Lever: 'radial-gradient(120% 90% at 18% 82%, #D81E5B 0%, #5E1240 48%, #13224F 100%)',
  Bids: 'radial-gradient(120% 90% at 82% 26%, #F7A07E 0%, #F2643A 40%, #8A2A12 100%)',
  Close: '#000'
};
const CAP = {
  Open: ['Public tenders,', 'read for you.', '#FFFFFF', '#8FA2B8'],
  Night: ['Every new tender,', 'read overnight.', '#FFFFFF', '#7FC8E6'],
  Verdict: ['Know which ones', 'you can win.', '#FFFFFF', '#0E1B2B'],
  Proof: ['Every answer,', 'with its page.', '#0E1B2B', '#0A6CBC'],
  Lever: ['Change your profile.', 'It re-scores.', '#FFFFFF', '#FF8FB1'],
  Bids: ['Every bid,', 'on time.', '#FFFFFF', '#FFE0D2']
};
const Shape = ({ k, s, color }) => {
  const b = { width: s, height: s, background: color, display: 'inline-block', flex: 'none' };
  if (k === 'go') return <span style={{ ...b, borderRadius: '50%' }} />;
  if (k === 'maybe') return <span style={{ ...b, width: s * 1.1, clipPath: 'polygon(50% 0,100% 100%,0 100%)' }} />;
  return <span style={{ ...b, width: s * .9, height: s * .9 }} />;
};

function useNotch(T, CUES) {
  let w = SIZE.Rest[0], h = SIZE.Rest[1], prev = SIZE.Rest;
  SC.forEach(name => {
    const t = T - CUES[name], tgt = SIZE[name], closing = tgt[0] < prev[0];
    w += (tgt[0] - prev[0]) * MOTION.spring(t, 9, closing ? 1.0 - 1e-3 : 0.78);
    h += (tgt[1] - prev[1]) * MOTION.spring(t, 10, closing ? 1.0 - 1e-3 : 0.86);
    prev = tgt;
  });
  return { w, h, r: Math.min(h / 2, 46) };
}

function Widgets({ T, CUES, end }) {
  const v = (name) => MOTION.enter(T, CUES[name] + 0.32, 0.4) * (1 - MOTION.enter(T, end(name) - 0.28, 0.22));
  const box = (name, children) => <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: v(name), transform: `scale(${0.96 + 0.04 * v(name)})` }}>{children}</div>;
  const pages = Math.round(777 * MOTION.morph(T, CUES.Night + 0.4, 2.0));
  const ring = MOTION.morph(T, CUES.Night + 0.4, 2.0);
  const flip = MOTION.morph(T, CUES.Lever + 1.0, 0.3);
  const hl = MOTION.morph(T, CUES.Proof + 0.8, 0.9);
  return (
    <>
      {box('Open', <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#fff', font: `800 30px/1 ${F}`, letterSpacing: '-.03em' }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#D81E5B' }} />TenderScout</div>)}
      {box('Night', <div style={{ display: 'flex', alignItems: 'center', gap: 30, color: '#fff', padding: '0 40px', width: '100%', boxSizing: 'border-box' }}>
        <svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="8" /><circle cx="42" cy="42" r="34" fill="none" stroke="#5DB8F5" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${213.6 * ring} 213.6`} transform="rotate(-90 42 42)" /></svg>
        <div style={{ flex: 1 }}><div style={{ font: `800 50px/1 ${F}`, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums' }}>{pages}<span style={{ font: `600 24px/1 ${F}`, color: '#9AA6B8', marginLeft: 12 }}>pages read</span></div><div style={{ font: `500 20px/1 ${MONO}`, color: '#7FC8E6', marginTop: 12 }}>DE · AT · ES · NL · FR — 45 sectors</div></div>
      </div>)}
      {box('Verdict', <div style={{ display: 'flex', gap: 10, padding: 22, width: '100%', height: '100%', boxSizing: 'border-box' }}>
        {[['go', '#13724B', '#fff', 1, 'Go', 1], ['maybe', '#F5A524', '#1A1200', 2, 'Maybe', 2], ['nogo', '#D23A2E', '#fff', 3, 'No-go', 3]].map(([k, bg, on, n, l, f], i) => {
          const p = MOTION.enter(T, CUES.Verdict + 0.4 + i * 0.07, 0.45);
          return <div key={k} style={{ flex: f, borderRadius: 26, background: bg, color: on, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}><Shape k={k} s={14} color={on} /><div><div style={{ font: `800 74px/1 ${F}`, letterSpacing: '-.05em' }}>{n}</div><div style={{ font: `700 20px/1 ${F}`, marginTop: 6 }}>{l}</div></div></div>;
        })}
      </div>)}
      {box('Proof', <div style={{ padding: '0 44px', color: '#fff', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 18px/1 ${MONO}`, color: '#8FA2B8' }}><span>ORIGINAL · GERMAN</span><span>Vergabeunterlagen p. 12 · §3.1</span></div>
        <div style={{ marginTop: 18, font: `500 34px/46px ${F}` }}>„… eine gültige <span style={{ backgroundImage: 'linear-gradient(rgba(93,184,245,.55),rgba(93,184,245,.55))', backgroundSize: `${hl * 100}% 100%`, backgroundRepeat: 'no-repeat', borderRadius: 6, padding: '0 4px' }}>Zertifizierung nach ISO/IEC 27001</span> nachweisen.“</div>
      </div>)}
      {box('Lever', <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '0 40px', width: '100%', boxSizing: 'border-box', color: '#fff' }}>
        <span style={{ width: 96, height: 58, borderRadius: 999, background: flip > .5 ? '#5DB8F5' : '#3A3F4B', position: 'relative', flex: 'none' }}><span style={{ position: 'absolute', top: 5, left: 5 + 38 * flip, width: 48, height: 48, borderRadius: '50%', background: '#fff' }} /></span>
        <div style={{ flex: 1 }}><div style={{ font: `800 34px/1 ${F}` }}>ISO 27001</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, font: `700 20px/1 ${F}` }}><span>Landkreis Hohenau</span>
            <span style={{ height: 32, padding: '0 12px', borderRadius: 10, background: flip > .5 ? '#13724B' : '#D23A2E', display: 'flex', alignItems: 'center', gap: 8 }}><Shape k={flip > .5 ? 'go' : 'nogo'} s={10} color="#fff" />{flip > .5 ? 'Go' : 'No-go'}</span></div></div>
      </div>)}
      {box('Bids', <div style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '0 40px', width: '100%', boxSizing: 'border-box', color: '#fff' }}>
        <div style={{ width: 84, height: 84, borderRadius: 24, background: '#F5A524', color: '#1A1200', display: 'grid', placeItems: 'center', font: `800 34px/1 ${F}` }}>90</div>
        <div style={{ flex: 1 }}><div style={{ font: `800 30px/1.15 ${F}` }}>Fibre-to-the-building</div><div style={{ font: `500 20px/1 ${F}`, color: '#B8BEC9', marginTop: 10 }}>Stadtwerke Kaltbrunn · Bidding</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ font: `800 52px/1 ${F}`, letterSpacing: '-.04em' }}>{43 - Math.round(MOTION.morph(T, CUES.Bids + 0.6, 1.2) * 0)}</div><div style={{ font: `600 18px/1 ${F}`, color: '#B8BEC9', marginTop: 6 }}>days left</div></div>
      </div>)}
    </>
  );
}

function NotchFilm() {
  const { T, CUES, authoredTotal } = useComposition();
  const end = name => { const i = SC.indexOf(name); return i < SC.length - 1 ? CUES[SC[i + 1]] : authoredTotal; };
  const n = useNotch(T, CUES);
  const cur = [...SC].reverse().find(s => T >= CUES[s]) || 'Open';
  const lightBar = cur === 'Proof';
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000', fontFamily: F }}>
      {SC.map(s => {
        const r = MOTION.spring(T - CUES[s], 5, 0.95) * 2300;
        return <div key={s} style={{ position: 'absolute', inset: 0, background: WALL[s], clipPath: `circle(${r}px at 50% 0px)` }} />;
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 36, background: lightBar ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.28)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', font: `600 17px/1 ${F}`, color: lightBar ? '#0E1B2B' : '#fff' }}>
        <div style={{ display: 'flex', gap: 26 }}><span style={{ fontWeight: 800 }}>TenderScout</span><span>File</span><span>View</span><span>Window</span><span>Help</span></div>
        <div style={{ display: 'flex', gap: 22 }}><span>Mon 2 Nov</span><span>06:41</span></div>
      </div>
      <div style={{ position: 'absolute', left: (1920 - n.w) / 2, top: 0, width: n.w, height: n.h, background: '#000', borderRadius: `0 0 ${n.r}px ${n.r}px`, overflow: 'hidden', boxShadow: '0 20px 40px -20px rgba(0,0,0,.5)' }}>
        <Widgets T={T} CUES={CUES} end={end} />
      </div>
      {Object.keys(CAP).map(s => {
        const [a, b, c1, c2] = CAP[s];
        const o = MOTION.enter(T, CUES[s] + 0.5, 0.5) * (1 - MOTION.enter(T, end(s) - 0.3, 0.25));
        return <div key={s} style={{ position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', font: `800 84px/1.05 ${F}`, letterSpacing: '-.045em', color: c1, opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>{a} <span style={{ color: c2 }}>{b}</span></div>;
      })}
      {(() => {
        const a = MOTION.enter(T, CUES.Close + 0.6, 0.6), b = MOTION.enter(T, CUES.Close + 1.1, 0.6);
        return <div style={{ position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', color: '#fff' }}>
          <div style={{ font: `800 150px/1 ${F}`, letterSpacing: '-.06em', opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>TenderScout</div>
          <div style={{ marginTop: 24, font: `600 40px/1.2 ${F}`, color: '#B8C4D4', opacity: b }}>Find public tenders you can actually win</div>
          <div style={{ display: 'inline-flex', marginTop: 48, height: 84, padding: '0 40px', alignItems: 'center', borderRadius: 28, background: '#fff', color: '#0E1B2B', font: `700 32px/1 ${F}`, opacity: b }}>Draft my profile →</div>
        </div>;
      })()}
      <div style={{ position: 'absolute', right: 40, bottom: 34, font: `500 16px/1 ${MONO}`, color: lightBar ? '#4A5A6D' : 'rgba(255,255,255,.55)' }}>Prototype · fictional data</div>
    </div>
  );
}

function NotchApp() {
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
  return (
    <>
      <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#000"><NotchFilm /></CompositionStage>
      <window.TweaksPanel><window.TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} /></window.TweaksPanel>
    </>
  );
}
window.NotchApp = NotchApp;
