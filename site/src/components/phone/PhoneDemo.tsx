'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Engine, PROFILE, TODAY, WINLOSS, WINLOSS_MONTHS, counts, evaluateAll, evaluateOne, money, withCert, type Overrides, type TenderView } from '@/data/app';
import { Icon } from '@/components/ui/Icon';
import { Counter } from '@/components/ui/Counter';
import { SimulatedPill } from '@/components/ui/Primitives';
import { RadialFillButton, WipeButton } from '@/components/ui/Buttons';
import { ScoreTile, StatusLine, VerdictTile } from '@/components/ui/VerdictTile';
import { VERDICT, VerdictShape, verdictLabel } from '@/components/ui/VerdictShape';
import tokens from '@/generated/tokens';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

const FEED_IDS = ['ell-schools', 'kal-fibre', 'hoh-security'];
const HOH = 'hoh-security';
const CERT = 'ISO 27001';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabel = (iso: string) => DAYS[new Date(iso + 'T00:00:00Z').getUTCDay()] + ' ' + Engine.shortDate(iso);
const tileVerdict = (v: TenderView['verdict']) => (v === 'closed' ? 'nogo' : v);
// The app's five tabs, in the app's order and with its icons (app.js TABS); since 6 Nov 2026, CLAUDE.md §11 item 140.
const TABS: [string, string][] = [['radar', 'Feed'], ['bookmarks', 'Bids'], ['domain', 'Company'], ['badge', 'Profile'], ['tune', 'Settings']];
// Settings → "About this prototype": the app's four statements (app.js settings()), shortened to one line for the phone.
const ABOUT: [string, string][] = [
  ['AI output is simulated', 'Played back from pre-written output. No model is called.'],
  ['The decision logic is real code', 'Check, score and verdict run in tested rules.'],
  ['All data is fictional', 'Every company, buyer and tender is invented.'],
  ['Built with AI assistance', 'Claude helped build it. The team decided.'],
];

/**
 * A 340 × 700 phone in dark mode running the app's real engine.js on data.js. The floating dock switches the app's five tabs:
 * Feed / Bids / Company / Profile / Settings. In Company, the ISO 27001 switch re-scores Landkreis Hohenau exactly as the app
 * does: No-go 25 → Maybe 90 (one line still needs the owner's answer) → Go 100 after "We meet it". Feed, Bids and Profile
 * update with it (Profile shows the firm, Company changes it). Bids opens with the app's Win/loss row, from insights.js.
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
  // The screen scrolls when a tab is taller than it; every tab opens at its top, like the app.
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (panelRef.current) panelRef.current.scrollTop = 0; }, [tab]);
  // "Edit on Company" switches tabs: focus follows it to the Company tab, so a keyboard user is not dropped on <body>.
  const editOnCompany = () => { setTab(2); document.getElementById('dock-tab-2')?.focus(); };

  return (
    <div className="phone-wrap">
      <div className="phone" role="group" aria-label="TenderScout app demo">
        <div className="phone-screen">
          <div className="notch" aria-hidden="true" />
          <div ref={panelRef} className="pscreen" role="tabpanel" id="phone-panel" aria-labelledby={`dock-tab-${tab}`} tabIndex={0}>
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
                <div className="pwl">
                  <div className="prow-text"><p className="pwl-label">Win/loss insights</p><p className="prow-meta">{WINLOSS.won} of {WINLOSS.submitted} won · {WINLOSS.winRate}% in the last {WINLOSS_MONTHS} months</p></div>
                  <Icon name="arrow_forward" size={20} className="pwl-arrow" />
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
            {tab === 3 && (
              <>
                <div className="phead">
                  <div><p className="phead-sub">What every tender is checked against</p><p className="phead-title">Profile</p></div>
                </div>
                <div className="pgroup pcard">
                  <div><p className="pco">{profile.name}</p><p className="prow-meta">{profile.city}</p></div>
                  <div className="pstats">
                    <div><b>{profile.staff}</b><span>Staff</span></div>
                    <div><b>{money(profile.turnover)}</b><span>Turnover</span></div>
                    <div><b>{profile.references}</b><span>References</span></div>
                  </div>
                  <dl className="pkv">
                    <dt>Sectors</dt><dd>{profile.sectorsLabel.join(', ')}</dd>
                    <dt>Certificates</dt><dd style={iso ? { color: tokens.verdict.go.onDark, fontWeight: 700 } : undefined}>{profile.certifications.length ? profile.certifications.join(', ') : 'None yet'}</dd>
                    <dt>Bid languages</dt><dd>{profile.languages.map(Engine.langName).join(', ')}</dd>
                    <dt>Countries</dt><dd>{profile.countries.map(Engine.countryName).join(', ')}{profile.crossBorder ? ', cross-border' : ''}</dd>
                  </dl>
                </div>
                <WipeButton className="pbtn-full" onClick={editOnCompany}>Edit on Company</WipeButton>
              </>
            )}
            {tab === 4 && (
              <>
                <div className="phead">
                  <div><p className="phead-sub">Appearance, notification, what is real</p><p className="phead-title">Settings</p></div>
                </div>
                <div className="pgroup">
                  <div className="pline"><div className="pline-text"><p className="pline-label">Appearance</p><p className="pline-sub">System, light or dark. This phone shows dark.</p></div></div>
                  <div className="pline"><div className="pline-text"><p className="pline-label">Morning notification</p><p className="pline-sub">Once a day: how many new tenders you qualify for.</p></div></div>
                </div>
                <p className="pabout-h">About this prototype</p>
                <div className="pgroup">
                  {ABOUT.map(([t, d], i) => (
                    <div key={t} className="pline"><div className="pline-text"><p className="pline-label">{t}</p><p className="pline-sub">{d}</p></div>{i === 0 && <SimulatedPill dark />}</div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="pfade" aria-hidden="true" />
          <FloatingDock tab={tab} onTab={setTab} badge={tab === 1 ? 0 : rows.length} />
        </div>
      </div>
      <p className="phone-caption">Live: the app’s own decision rules on the fictional demo data · the “Simulated AI” reading is played back</p>
    </div>
  );
}

/**
 * Navy glass dock with the sliding sky pill and the amber-red count badge on Bids (hidden while Bids is active). Five tabs
 * since 6 Nov 2026: the active tab takes the width the four 44 px icon tabs leave (106 px in the desktop phone's 296 px
 * dock) and shows its label; on a phone too narrow for the label the pill keeps the icon only, so every tab stays at least
 * 44 px wide. The first render assumes the desktop width (296 px), so the server markup matches the widest real dock.
 */
const DOCK_INSET = 7, DOCK_MIN = 44, DOCK_LABEL_MIN = 100;
function FloatingDock({ tab, onTab, badge }: { tab: number; onTab: (i: number) => void; badge: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [dw, setDw] = useState(296);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setDw(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const tabs = TABS;
  const active = Math.max(DOCK_MIN, dw - 2 * DOCK_INSET - (tabs.length - 1) * DOCK_MIN);
  const label = active >= DOCK_LABEL_MIN;
  const widths = tabs.map((_, i) => (i === tab ? active : DOCK_MIN));
  const lefts = widths.reduce<number[]>((a, _, i) => { a.push(i ? a[i - 1] + widths[i - 1] : DOCK_INSET); return a; }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (!/^Arrow(Left|Right)$/.test(e.key)) return;
    e.preventDefault();
    const n = (tab + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onTab(n);
    (e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[n])?.focus();
  };
  return (
    <div ref={ref} className="dock" role="tablist" aria-label="App sections" onKeyDown={onKey}>
      <motion.span className="dock-pill" aria-hidden="true" initial={false} animate={{ left: lefts[tab], width: active }} transition={reduce ? { duration: 0 } : { duration: tokens.duration.spring / 1000, ease: EASE.spring }} />
      {tabs.map(([icon, name], i) => {
        const on = i === tab;
        return (
          <button key={name} id={`dock-tab-${i}`} type="button" role="tab" aria-selected={on} aria-controls="phone-panel" aria-label={name + (i === 1 && badge ? `, ${badge} saved` : '')} tabIndex={on ? 0 : -1} onClick={() => onTab(i)}
            className={`dock-tab${on ? ' on' : ''}`} style={{ left: lefts[i], width: widths[i] }}>
            <span className="dock-icon"><Icon name={icon} size={23} fill={on} />{i === 1 && badge ? <span className="dock-badge" aria-hidden="true">{badge}</span> : null}</span>
            <span className="dock-label" aria-hidden="true" style={{ maxWidth: on && label ? 80 : 0, opacity: on && label ? 1 : 0 }}>{name}</span>
          </button>
        );
      })}
    </div>
  );
}
