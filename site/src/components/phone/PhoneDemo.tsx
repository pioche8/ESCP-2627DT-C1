'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Engine, PROFILE, TODAY, counts, evaluateAll, evaluateOne, money, withCert, type Overrides, type TenderView } from '@/data/app';
import { Icon } from '@/components/ui/Icon';
import { SimulatedPill } from '@/components/ui/Primitives';
import { RadialFillButton, WipeButton } from '@/components/ui/Buttons';
import { ScoreTile, StatusLine, VerdictTile } from '@/components/ui/VerdictTile';
import { VERDICT, VerdictShape, verdictLabel } from '@/components/ui/VerdictShape';
import tokens from '@/generated/tokens';
import { EASE, easeOutCubic } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

const FEED_IDS = ['ell-schools', 'kal-fibre', 'hoh-security'];
const HOH = 'hoh-security';
const CERT = 'ISO 27001';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabel = (iso: string) => DAYS[new Date(iso + 'T00:00:00Z').getUTCDay()] + ' ' + Engine.shortDate(iso);
const tileVerdict = (v: TenderView['verdict']) => (v === 'closed' ? 'nogo' : v);

/**
 * A 340 × 700 phone in dark mode running the app's real engine.js on data.js. The floating dock switches Feed / Bids / Company.
 * In Company, the ISO 27001 switch re-scores Landkreis Hohenau exactly as the app does: No-go 25 → Maybe 90 (one line still
 * needs the owner's answer) → Go 100 after "We meet it". Feed and Bids update with it.
 */
export function PhoneDemo() {
  const [tab, setTab] = useState(1);
  const [iso, setIso] = useState(false);
  const [met, setMet] = useState(false);
  const profile = useMemo(() => withCert(PROFILE, CERT, iso), [iso]);
  const overrides = useMemo<Overrides>(() => { const o: Overrides = {}; if (met) o[HOH] = { r3: 'pass' }; return o; }, [met]);
  const views = useMemo(() => evaluateAll(profile, overrides), [profile, overrides]);
  const byId = (id: string) => views.find((v) => v.id === id)!;
  const c = counts(views);
  const rows = FEED_IDS.map(byId);
  const hoh = byId(HOH);
  const nextDeadline = Math.min(...rows.map((v) => v.daysLeft));
  const ifIso = evaluateOne(HOH, withCert(PROFILE, CERT, true), overrides);
  const ifMet = evaluateOne(HOH, profile, { [HOH]: { r3: 'pass' } });
  const isoHint = iso ? (hoh.verdict === 'go' ? '✓ Unlocked Landkreis Hohenau' : `✓ Hohenau moved up to ${verdictLabel(hoh.verdict)}`) : `Turn on → Hohenau becomes ${verdictLabel(ifIso.verdict)}`;
  const metHint = met ? '✓ Counted as met' : `Answer → Hohenau ${ifMet.verdict === hoh.verdict ? 'stays' : 'becomes'} ${verdictLabel(ifMet.verdict)}`;
  const hv = tileVerdict(hoh.verdict);
  const reduce = useReducedMotion();
  const stage = (v: TenderView) => (v.id === 'ell-schools' ? 'Bidding' : v.verdict === 'nogo' ? 'Not bidding' : 'Deciding');

  return (
    <div className="phone-wrap">
      <div className="phone" role="group" aria-label="TenderScout app demo">
        <div className="phone-screen">
          <div className="notch" aria-hidden="true" />
          <div className="pscreen" role="tabpanel" id="phone-panel" aria-labelledby={`dock-tab-${tab}`}>
            {tab === 0 && (
              <>
                <div className="phead">
                  <div><p className="phead-sub">{dayLabel(TODAY)} · read overnight</p><p className="phead-title">{c.go + c.maybe + c.nogo} new tenders</p></div>
                  <SimulatedPill dark />
                </div>
                <div className="ptiles">
                  <VerdictTile verdict="go" count={c.go} size="sm" />
                  <VerdictTile verdict="maybe" count={c.maybe} size="sm" />
                  <VerdictTile verdict="nogo" count={c.nogo} size="sm" />
                </div>
                {rows.map((v) => (
                  <div className="prow" key={v.id}>
                    <ScoreTile verdict={tileVerdict(v.verdict)} score={v.score} size={46} radius={14} fontSize={17} />
                    <div className="prow-text">
                      <StatusLine verdict={tileVerdict(v.verdict)} size={7} className="status-sm" />
                      <p className="prow-title">{v.title}</p>
                      <p className="prow-meta">{v.buyer} · {money(v.value)} · {v.daysLeft} d</p>
                    </div>
                  </div>
                ))}
              </>
            )}
            {tab === 1 && (
              <>
                <div className="phead">
                  <div><p className="phead-sub">{rows.length} saved · next deadline in {nextDeadline} days</p><p className="phead-title">Bids</p></div>
                  <SimulatedPill dark />
                </div>
                {rows.map((v) => {
                  const tv = tileVerdict(v.verdict), st = stage(v);
                  return (
                    <div className="pbid" key={v.id} style={{ boxShadow: `inset 0 0 0 1px ${VERDICT[tv].ring}` }}>
                      <div className="pbid-top">
                        <ScoreTile verdict={tv} score={v.score} size={50} radius={15} fontSize={19} className="pbid-score" />
                        <div className="prow-text">
                          <StatusLine verdict={tv} why={v.why} />
                          <p className="pbid-title">{v.title}</p>
                        </div>
                      </div>
                      <div className="pbid-foot">
                        <span className="prow-meta">{v.buyer} · {v.daysLeft} d</span>
                        <span className={`stage-pill stage-${st.replace(' ', '-').toLowerCase()}`}>{st}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {tab === 2 && (
              <>
                <div className="phead">
                  <div><p className="phead-sub">{PROFILE.name.replace(/\s*\(fictional\)/, '')}</p><p className="phead-title">Company</p></div>
                  <SimulatedPill dark />
                </div>
                <div className="pgroup">
                  <div className="pline">
                    <div className="pline-text"><p className="pline-label">ISO 9001</p><p className="pline-sub">Quality management</p></div>
                    <span className="pswitch on" role="switch" aria-checked="true" aria-disabled="true" aria-label="ISO 9001, held"><span className="pswitch-knob" /></span>
                  </div>
                  <div className="pline">
                    <div className="pline-text"><p className="pline-label">ISO 27001</p><p className="pline-sub" style={{ color: iso ? tokens.verdict.go.onDark : tokens.color.site.skyLink }}>{isoHint}</p></div>
                    <button type="button" role="switch" aria-checked={iso} aria-label="ISO 27001" className={`pswitch${iso ? ' on' : ''}`} onClick={() => setIso((v) => !v)}><span className="pswitch-knob" /></button>
                  </div>
                  <div className="pline">
                    <div className="pline-text">
                      <p className="pline-label"><VerdictShape verdict="check" size={9} color={tokens.verdict.check.onDark} className="pline-shape" />Staff with “comparable qualification”</p>
                      <p className="pline-sub" style={{ color: met ? tokens.verdict.go.onDark : tokens.color.site.skyLink }}>{metHint}</p>
                    </div>
                    <button type="button" className={`meet-btn${met ? ' on' : ''}`} aria-pressed={met} onClick={() => setMet((v) => !v)}>{met ? <><Icon name="check" size={16} />Met</> : 'We meet it'}</button>
                  </div>
                </div>
                <motion.div className="pblock" initial={false} animate={{ backgroundColor: VERDICT[hv].solid, color: VERDICT[hv].on }} transition={reduce ? { duration: 0 } : { duration: tokens.duration.rescore.block / 1000, ease: EASE.enter }} aria-live="polite" aria-label={`Landkreis Hohenau: ${verdictLabel(hoh.verdict)}, score ${hoh.score} of 100`}>
                  <div className="pblock-head">
                    <span className="pblock-verdict"><VerdictShape verdict={hv} size={10} color={VERDICT[hv].on} />{verdictLabel(hoh.verdict)}</span>
                    <span className="pblock-buyer">{hoh.buyer}</span>
                  </div>
                  <div>
                    <p className="pblock-title">IT security audit</p>
                    <div className="pblock-score"><Counter value={hoh.score} /><span className="of">/100</span></div>
                  </div>
                </motion.div>
                <div className="pbtns">
                  <WipeButton className="pbtn-skip">Skip</WipeButton>
                  <RadialFillButton className="pbtn-save">Save to Bids</RadialFillButton>
                </div>
              </>
            )}
          </div>
          <div className="pfade" aria-hidden="true" />
          <FloatingDock tab={tab} onTab={setTab} badge={tab === 1 ? 0 : rows.length} />
        </div>
      </div>
      <p className="phone-caption">Live: the app’s engine.js on the fictional demo data · the “Simulated AI” reading is played back</p>
    </div>
  );
}

/** Navy glass dock with the sliding sky pill and the amber-red count badge on Bids (hidden while Bids is active). */
function FloatingDock({ tab, onTab, badge }: { tab: number; onTab: (i: number) => void; badge: number }) {
  const reduce = useReducedMotion();
  const tabs = [['radar', 'Feed'], ['bookmarks', 'Bids'], ['domain', 'Company']];
  const widths = tabs.map((_, i) => (i === tab ? 132 : 65));
  const lefts = widths.reduce<number[]>((a, _, i) => { a.push(i ? a[i - 1] + widths[i - 1] : 7); return a; }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (!/^Arrow(Left|Right)$/.test(e.key)) return;
    e.preventDefault();
    const n = (tab + (e.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
    onTab(n);
    (e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[n])?.focus();
  };
  return (
    <div className="dock" role="tablist" aria-label="App sections" onKeyDown={onKey}>
      <motion.span className="dock-pill" aria-hidden="true" initial={false} animate={{ left: lefts[tab] }} transition={reduce ? { duration: 0 } : { duration: tokens.duration.spring / 1000, ease: EASE.spring }} />
      {tabs.map(([icon, label], i) => {
        const on = i === tab;
        return (
          <button key={label} id={`dock-tab-${i}`} type="button" role="tab" aria-selected={on} aria-controls="phone-panel" tabIndex={on ? 0 : -1} onClick={() => onTab(i)}
            className={`dock-tab${on ? ' on' : ''}`} style={{ left: lefts[i], width: widths[i] }}>
            <span className="dock-icon"><Icon name={icon} size={23} fill={on} />{i === 1 && badge ? <span className="dock-badge" aria-label={`${badge} saved`}>{badge}</span> : null}</span>
            <span className="dock-label" style={{ maxWidth: on ? 80 : 0, opacity: on ? 1 : 0 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Count-up written to the DOM over 650 ms with easeOutCubic (the same curve as the app's re-score). Instant under reduced motion. */
export function Counter({ value, duration = tokens.duration.rescore.countUp }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const [initial] = useState(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const from = prev.current, to = value; prev.current = value;
    if (reduce || from === to) { el.textContent = String(to); return; }
    const t0 = performance.now(); let id = 0;
    const step = (t: number) => { const p = Math.min(1, (t - t0) / duration); el.textContent = String(Math.round(from + (to - from) * easeOutCubic(p))); if (p < 1) id = requestAnimationFrame(step); };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value, duration, reduce]);
  return <span ref={ref} className="counter-val">{initial}</span>;
}
