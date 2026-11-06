'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Engine, PROFILE, TODAY, WINLOSS, WINLOSS_MONTHS, counts, evaluateAll, evaluateOne, money, withCert, type Overrides, type TenderView } from '@/data/app';
import { Icon } from '@/components/ui/Icon';
import { Counter } from '@/components/ui/Counter';
import { SimulatedText } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Buttons';
import { CountsLine, ScoreTile, StatusLine } from '@/components/ui/VerdictTile';
import { C, VerdictShape, verdictLabel } from '@/components/ui/VerdictShape';
import tokens from '@/generated/tokens';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

const FEED_IDS = ['ell-schools', 'kal-fibre', 'hoh-security'];
const HOH = 'hoh-security';
const CERT = 'ISO 27001';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabel = (iso: string) => DAYS[new Date(iso + 'T00:00:00Z').getUTCDay()] + ' ' + Engine.shortDate(iso);
const tileVerdict = (v: TenderView['verdict']) => (v === 'closed' ? 'nogo' : v);

// The app's five tabs, in the app's order and with its icons (app.js TABS).
const TABS: [string, string][] = [['radar', 'Feed'], ['bookmarks', 'Bids'], ['domain', 'Company'], ['badge', 'Profile'], ['tune', 'Settings']];
// Settings → "About this prototype": the app's four statements, shortened for the phone (app.js settings()).
const ABOUT: [string, string][] = [
  ['AI output is simulated', 'Reading, translating and answers are played back. No model is called.'],
  ['The decision logic is real code', 'The check, score and verdict run in tested rules.'],
  ['All data is fictional', 'Every company, buyer and tender is invented.'],
  ['Built with AI assistance', 'Claude helped build it. The team made the product decisions.'],
];

/**
 * A 340 × 700 phone running the app's real decision rules on its demo data. The bottom tab bar switches the app's five
 * tabs: Feed / Bids / Company / Profile / Settings. In Company, the ISO 27001 switch re-scores Landkreis Hohenau exactly
 * as the app does: No-go 25 → Maybe 90 (one line still needs the owner's answer) → Go 100 after "We meet it". Feed, Bids
 * and Profile update with it (Profile shows the firm, Company changes it). Bids opens with the app's Win/loss row,
 * computed by the app's insights.js.
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
  const isoHint = iso ? (hoh.verdict === 'go' ? 'Unlocked Landkreis Hohenau' : `Hohenau moved up to ${verdictLabel(hoh.verdict)}`) : `Turn on → Hohenau becomes ${verdictLabel(ifIso.verdict)}`;
  const metHint = met ? 'Counted as met' : `Answer → Hohenau ${ifMet.verdict === hoh.verdict ? 'stays' : 'becomes'} ${verdictLabel(ifMet.verdict)}`;
  const hv = tileVerdict(hoh.verdict);
  const reduce = useReducedMotion();
  const stage = (v: TenderView) => (v.id === 'ell-schools' ? 'Bidding' : v.verdict === 'nogo' ? 'Not bidding' : 'Deciding');

  return (
    <div className="phone" role="group" aria-label="TenderScout app demo">
      <div className="phone-screen">
        <div className="pscreen" role="tabpanel" id="phone-panel" aria-labelledby={`dock-tab-${tab}`}>
          {tab === 0 && (
            <>
              <div className="phead">
                <div><p className="phead-title">{c.go + c.maybe + c.nogo} new tenders</p><p className="phead-sub">{dayLabel(TODAY)} · read overnight</p></div>
                <SimulatedText />
              </div>
              <CountsLine counts={c} />
              {rows.map((v) => (
                <div className="prow" key={v.id}>
                  <ScoreTile verdict={tileVerdict(v.verdict)} score={v.score} size={46} fontSize={17} />
                  <div className="prow-text">
                    <StatusLine verdict={tileVerdict(v.verdict)} size={7} />
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
                <div><p className="phead-title">Bids</p><p className="phead-sub">{rows.length} saved · next deadline in {nextDeadline} days</p></div>
                <SimulatedText />
              </div>
              <div className="pwl">
                <div className="prow-text"><p className="pwl-label">Win/loss insights</p><p className="prow-meta">{WINLOSS.won} of {WINLOSS.submitted} won · {WINLOSS.winRate}% in the last {WINLOSS_MONTHS} months</p></div>
                <Icon name="arrow_forward" size={20} className="pwl-arrow" />
              </div>
              {rows.map((v) => {
                const tv = tileVerdict(v.verdict), st = stage(v);
                return (
                  <div className="pbid" key={v.id}>
                    <div className="pbid-top">
                      <ScoreTile verdict={tv} score={v.score} size={50} fontSize={19} className="pbid-score" />
                      <div className="prow-text">
                        <StatusLine verdict={tv} />
                        <p className="pbid-title">{v.title}</p>
                      </div>
                    </div>
                    <div className="pbid-foot">
                      <span className="prow-meta">{v.buyer} · {v.daysLeft} d</span>
                      <span className={`stage stage-${st.replace(' ', '-').toLowerCase()}`}>{st}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {tab === 2 && (
            <>
              <div className="phead">
                <div><p className="phead-title">Company</p><p className="phead-sub">{PROFILE.name.replace(/\s*\(fictional\)/, '')}</p></div>
                <SimulatedText />
              </div>
              <div className="pgroup">
                <div className="pline">
                  <div className="pline-text"><p className="pline-label">ISO 9001</p><p className="pline-sub">Quality management</p></div>
                  <span className="pswitch on" role="switch" aria-checked="true" aria-disabled="true" aria-label="ISO 9001, held"><span className="pswitch-knob" /></span>
                </div>
                <div className="pline">
                  <div className="pline-text"><p className="pline-label">ISO 27001</p><p className={`pline-sub ${iso ? 'hint-ok' : 'hint-on'}`}>{isoHint}</p></div>
                  <button type="button" role="switch" aria-checked={iso} aria-label="ISO 27001" className={`pswitch${iso ? ' on' : ''}`} onClick={() => setIso((v) => !v)}><span className="pswitch-knob" /></button>
                </div>
                <div className="pline">
                  <div className="pline-text">
                    <p className="pline-label v-check"><VerdictShape verdict="check" size={9} className="pline-shape" />Staff with “comparable qualification”</p>
                    <p className={`pline-sub ${met ? 'hint-ok' : 'hint-on'}`}>{metHint}</p>
                  </div>
                  <button type="button" className={`meet-btn${met ? ' on' : ''}`} aria-pressed={met} onClick={() => setMet((v) => !v)}>{met ? <><Icon name="check" size={16} />Met</> : 'We meet it'}</button>
                </div>
              </div>
              <motion.div className={`pblock v-${hv}`} initial={false} animate={{ backgroundColor: C[hv] }} transition={reduce ? { duration: 0 } : { duration: tokens.duration.rescore.block / 1000, ease: EASE.enter }} aria-live="polite" aria-label={`Landkreis Hohenau: ${verdictLabel(hoh.verdict)}, score ${hoh.score} of 100`}>
                <div className="pblock-head">
                  <span className="pblock-verdict"><VerdictShape verdict={hv} size={10} />{verdictLabel(hoh.verdict)}</span>
                  <span className="pblock-buyer">{hoh.buyer}</span>
                </div>
                <div>
                  <p className="pblock-title">IT security audit</p>
                  <div className="pblock-score"><Counter value={hoh.score} /><span className="of">/100</span></div>
                </div>
              </motion.div>
              <div className="pbtns">
                <Button tone="secondary">Skip</Button>
                <Button>Save to Bids</Button>
              </div>
            </>
          )}
          {tab === 3 && (
            <>
              <div className="phead">
                <div><p className="phead-title">Profile</p><p className="phead-sub">What every tender is checked against</p></div>
              </div>
              <div className="pcard">
                <div><p className="pco">{profile.name}</p><p className="prow-meta">{profile.city}</p></div>
                <div className="pstats">
                  <div><b>{profile.staff}</b><span>Staff</span></div>
                  <div><b>{money(profile.turnover)}</b><span>Turnover</span></div>
                  <div><b>{profile.references}</b><span>References</span></div>
                </div>
                <dl className="pkv">
                  <dt>Sectors</dt><dd>{profile.sectorsLabel.join(', ')}</dd>
                  <dt>Certificates</dt><dd className={iso ? 'pkv-new' : undefined}>{profile.certifications.length ? profile.certifications.join(', ') : 'None yet'}</dd>
                  <dt>Bid languages</dt><dd>{profile.languages.map(Engine.langName).join(', ')}</dd>
                  <dt>Countries</dt><dd>{profile.countries.map(Engine.countryName).join(', ')}{profile.crossBorder ? ', cross-border' : ''}</dd>
                </dl>
              </div>
              <Button tone="secondary" className="pfull" onClick={() => setTab(2)}>Edit on Company</Button>
            </>
          )}
          {tab === 4 && (
            <>
              <div className="phead">
                <div><p className="phead-title">Settings</p></div>
              </div>
              <div className="pgroup psettings">
                <div className="pabout-row"><p className="pline-label">Appearance</p><p className="pline-sub">System, light or dark. This phone shows dark.</p></div>
                <div className="pabout-row"><p className="pline-label">Morning notification</p><p className="pline-sub">Once a day after the overnight read: how many new tenders you qualify for.</p></div>
              </div>
              <p className="pabout-h">About this prototype</p>
              <div className="pgroup pabout">
                {ABOUT.map(([t, d]) => (
                  <div key={t} className="pabout-row"><p className="pline-label">{t}{t.startsWith('AI') && <SimulatedText />}</p><p className="pline-sub">{d}</p></div>
                ))}
              </div>
            </>
          )}
        </div>
        <TabBar tab={tab} onTab={setTab} />
      </div>
    </div>
  );
}

/** Full-width bottom tab bar: icon + label; the active tab is brand-coloured with a filled icon and a bolder label. */
function TabBar({ tab, onTab }: { tab: number; onTab: (i: number) => void }) {
  const tabs = TABS;
  const onKey = (e: React.KeyboardEvent) => {
    if (!/^Arrow(Left|Right)$/.test(e.key)) return;
    e.preventDefault();
    const n = (tab + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onTab(n);
    (e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[n])?.focus();
  };
  return (
    <div className="ptabs" role="tablist" aria-label="App sections" onKeyDown={onKey}>
      {tabs.map(([icon, label], i) => {
        const on = i === tab;
        return (
          <button key={label} id={`dock-tab-${i}`} type="button" role="tab" aria-selected={on} aria-controls="phone-panel" tabIndex={on ? 0 : -1} onClick={() => onTab(i)} className={`ptab${on ? ' on' : ''}`}>
            <Icon name={icon} size={24} fill={on} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
