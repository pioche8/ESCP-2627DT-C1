'use client';
import { useMemo, useState } from 'react';
import { DEMO, Engine, PROFILE, TODAY, tenderById, type Profile, type Result } from '@/data/app';
import { StatusLine } from '@/components/ui/VerdictTile';
import { VerdictShape, verdictLabel, type VerdictKey } from '@/components/ui/VerdictShape';
import { Icon } from '@/components/ui/Icon';

const TENDER_ID = 'hoh-security';
const LANGS = ['de', 'en', 'es', 'fr', 'nl'];
const COUNTRIES = ['DE', 'AT', 'ES', 'NL', 'FR'];
const STATUS_V: Record<string, VerdictKey> = { pass: 'go', risk: 'maybe', review: 'check', fail: 'nogo' };
const STATUS_LABEL: Record<string, string> = { pass: 'Meets', risk: 'Risk', review: 'Needs your check', fail: 'Fails' };
const KIND: Record<string, string> = { min_turnover: 'Turnover', certification: 'Certificate', min_references: 'References', language: 'Bid language', region: 'Place of work', site_visit: 'Site visit', other: 'Unclear wording' };
type Answer = 'pass' | 'fail' | undefined;

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const money = (n: number) => '€' + Engine.fmt(n);

function Switch({ on, label, onChange, id }: { on: boolean; label: string; onChange: () => void; id?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} id={id} className={`pswitch${on ? ' on' : ''}`} onClick={onChange}>
      <span className="pswitch-knob" />
    </button>
  );
}

/**
 * The real decision code in the browser, on the workshop's tender (Landkreis Hohenau). Every input below is one the
 * engine reads; staff, city and name are not, so they are not offered. The row whose status changed with the last
 * edit is marked, and the change line says what moved.
 */
export function TryTheRules() {
  const tender = tenderById(TENDER_ID)!;
  const [profile, setProfile] = useState<Profile>(PROFILE);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [prev, setPrev] = useState<Result | null>(null);
  const [lastLever, setLastLever] = useState<string>('');
  const [resets, setResets] = useState(0); // the number fields are uncontrolled: a reset remounts them with the demo values
  const sectors = useMemo(() => Array.from(new Set([...PROFILE.cpv, ...tender.cpv.map((c) => c.slice(0, 2))])).sort(), [tender]);
  const overrides = useMemo(() => { const o: Record<string, 'pass' | 'fail'> = {}; Object.keys(answers).forEach((k) => { if (answers[k]) o[k] = answers[k]!; }); return o; }, [answers]);
  const result = useMemo(() => Engine.evaluate(tender, profile, TODAY, overrides), [tender, profile, overrides]);
  const headline = Engine.headline(tender, profile, result);
  const reason = Engine.reasonLine(tender, profile, result);
  const v = result.verdict;
  const vk: VerdictKey | null = v === 'closed' ? null : v;

  const apply = (lever: string, next: Profile) => { setPrev(result); setLastLever(lever); setProfile(next); };
  const answer = (rid: string, a: Answer) => { setPrev(result); setLastLever('answer:' + rid); setAnswers((s) => ({ ...s, [rid]: s[rid] === a ? undefined : a })); };
  const reset = () => { setPrev(null); setLastLever(''); setProfile(PROFILE); setAnswers({}); setResets((n) => n + 1); };

  const flipped = new Set<string>();
  if (prev) result.checks.forEach((c) => { const p = prev.checks.find((x) => x.id === c.id); if (p && p.status !== c.status) flipped.add(c.id); });
  const changeLine = (() => {
    if (!prev) return 'Change a fact below. The verdict, the score and the line that moved update at once.';
    const moved = result.checks.filter((c) => flipped.has(c.id)).map((c) => { const p = prev.checks.find((x) => x.id === c.id)!; const q = tender.requirements.find((r) => r.id === c.id)!; return `${q.label}: ${STATUS_LABEL[p.status]} → ${STATUS_LABEL[c.status]}`; });
    const verdictPart = prev.verdict !== v || prev.score !== result.score ? `${verdictLabel(prev.verdict)} ${prev.score} → ${verdictLabel(v)} ${result.score}` : 'verdict and score unchanged';
    return (moved.length ? moved.join(' · ') + ' · ' : 'no line changed status · ') + verdictPart;
  })();
  const sorted = [...result.checks].sort((a, b) => ({ fail: 0, review: 1, risk: 2, pass: 3 } as Record<string, number>)[a.status] - ({ fail: 0, review: 1, risk: 2, pass: 3 } as Record<string, number>)[b.status]);
  const dim = (lever: string) => (lastLever === lever ? ' is-last' : '');

  return (
    <div className="try" data-verdict={v} data-score={result.score}>
      <div className="try-out" aria-live="polite">
        <p className="try-tender">{tender.title}<span className="how-muted"> · {tender.buyer.replace(/\s*\(fictional\)/, '')} · {money(tender.value)} · {result.daysLeft} days left · a fictional tender and company, real rules</span></p>
        <p className="try-verdict">
          {vk ? <VerdictShape verdict={vk} size={18} className={`try-shape v-${vk}`} color={`var(--c-${vk})`} /> : null}
          <b className={`try-word${vk ? ` v-${vk}` : ''}`}>{verdictLabel(v)}</b>
          <span className={`try-score${vk ? ` v-${vk}` : ''}`}><b>{result.score}</b><span className="of">/100</span></span>
        </p>
        <p className="try-headline">{headline}</p>
        <p className="try-change" data-change>{changeLine}</p>
        <ul className="try-reqs" aria-label="Requirements">
          {sorted.map((c) => {
            const q = tender.requirements.find((r) => r.id === c.id)!;
            const sv = STATUS_V[c.status];
            return (
              <li key={c.id} className={`try-req${flipped.has(c.id) ? ' flipped' : ''}`} data-req={c.id} data-status={c.status}>
                <StatusLine verdict={sv} label={STATUS_LABEL[c.status]} size={9} className="how-status" why={c.confirmed ? 'your answer' : c.status === 'fail' ? 'knock-out' : KIND[q.type]} />
                <p className="try-req-title">{q.label}</p>
                <p className="try-req-note">{c.confirmed ? (c.status === 'pass' ? 'You said you meet it.' : 'You said you don’t meet it.') : c.status === 'review' ? `${Math.round((q.confidence ?? 0) * 100)} % sure. Only the owner can answer.` : c.note}</p>
                <p className="try-req-cite">{tender.doc}, {q.cite.replace(/^[^p]*p\./, 'p.')}</p>
                {flipped.has(c.id) ? <p className="try-req-moved">This line moved</p> : null}
                {q.type === 'other' || (typeof q.confidence === 'number' && q.confidence < Engine.REVIEW_THRESHOLD) ? (
                  <div className="try-answer" role="group" aria-label={`Your answer to “${q.label}”`}>
                    <button type="button" className={`btn btn-secondary${answers[c.id] === 'fail' ? ' is-on' : ''}`} aria-pressed={answers[c.id] === 'fail'} data-answer="fail" data-req={c.id} onClick={() => answer(c.id, 'fail')}>We don’t meet it</button>
                    <button type="button" className={`btn ${answers[c.id] === 'pass' ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={answers[c.id] === 'pass'} data-answer="pass" data-req={c.id} onClick={() => answer(c.id, 'pass')}>We meet it</button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="how-muted try-reason">In the feed this reads: {reason}.</p>
      </div>

      <div className="try-in">
        <h3 className="how-h3">The company’s facts</h3>
        <p className="how-muted">Only what the decision code reads. Staff size, city and name are not inputs.</p>

        <div className="try-group" role="group" aria-label="Certificates">
          <p className="try-group-title">Certificates</p>
          {DEMO.CERT_OPTIONS.map((cert) => (
            <div key={cert} className={`try-row${dim('cert:' + cert)}`}>
              <span className="try-row-label" id={`try-cert-${cert.replace(/\W+/g, '-')}`}>{cert}</span>
              <Switch on={profile.certifications.includes(cert)} label={cert} onChange={() => apply('cert:' + cert, { ...profile, certifications: toggle(profile.certifications, cert) })} />
            </div>
          ))}
        </div>

        <div className="try-group" role="group" aria-label="Size">
          <p className="try-group-title">Size</p>
          <div className={`try-row${dim('references')}`}>
            <span className="try-row-label" id="try-ref">References, comparable, last 3 years</span>
            <span className="try-stepper" role="group" aria-labelledby="try-ref">
              <button type="button" className="sq-btn" aria-label="Fewer references" onClick={() => profile.references > 0 && apply('references', { ...profile, references: profile.references - 1 })}><Icon name="remove" size={20} /></button>
              <output aria-live="polite" data-ref>{profile.references}</output>
              <button type="button" className="sq-btn" aria-label="More references" onClick={() => apply('references', { ...profile, references: profile.references + 1 })}><Icon name="add" size={20} /></button>
            </span>
          </div>
          <div className={`try-row${dim('turnover')}`}>
            <label className="try-row-label" htmlFor="try-turnover">Turnover, last full year, € millions</label>
            <span className="try-field"><input key={`turnover-${resets}`} id="try-turnover" inputMode="decimal" defaultValue={profile.turnover / 1e6} onBlur={(e) => { const n = parseFloat(e.target.value.replace(',', '.')); if (isFinite(n) && n >= 0) apply('turnover', { ...profile, turnover: Math.round(n * 1e6) }); else e.target.value = String(profile.turnover / 1e6); }} /></span>
          </div>
          <div className={`try-row${dim('minValue')}`}>
            <label className="try-row-label" htmlFor="try-min">Smallest contract you take, € thousands</label>
            <span className="try-field"><input key={`min-${resets}`} id="try-min" inputMode="numeric" defaultValue={profile.minValue / 1e3} onBlur={(e) => { const n = parseFloat(e.target.value); if (isFinite(n) && n >= 0) apply('minValue', { ...profile, minValue: Math.round(n * 1e3) }); else e.target.value = String(profile.minValue / 1e3); }} /></span>
          </div>
          <div className={`try-row${dim('maxValue')}`}>
            <label className="try-row-label" htmlFor="try-max">Largest contract you take, € thousands</label>
            <span className="try-field"><input key={`max-${resets}`} id="try-max" inputMode="numeric" defaultValue={profile.maxValue / 1e3} onBlur={(e) => { const n = parseFloat(e.target.value); if (isFinite(n) && n >= 0) apply('maxValue', { ...profile, maxValue: Math.round(n * 1e3) }); else e.target.value = String(profile.maxValue / 1e3); }} /></span>
          </div>
        </div>

        <div className="try-group" role="group" aria-label="Sectors">
          <p className="try-group-title">Sectors, two-digit CPV divisions</p>
          {sectors.map((code) => {
            const name = (DEMO.SECTORS as unknown as [string, string][]).find((s) => s[0] === code)?.[1] ?? code;
            return (
              <div key={code} className={`try-row${dim('cpv:' + code)}`}>
                <span className="try-row-label">{code} · {name}{tender.cpv.some((c) => c.startsWith(code)) ? <span className="how-muted"> · this tender</span> : null}</span>
                <Switch on={profile.cpv.includes(code)} label={`Sector ${code} ${name}`} onChange={() => apply('cpv:' + code, { ...profile, cpv: toggle(profile.cpv, code) })} />
              </div>
            );
          })}
        </div>

        <div className="try-group" role="group" aria-label="Bid languages">
          <p className="try-group-title">Bid languages</p>
          {LANGS.map((l) => (
            <div key={l} className={`try-row${dim('lang:' + l)}`}>
              <span className="try-row-label">{Engine.langName(l)}</span>
              <Switch on={profile.languages.includes(l)} label={Engine.langName(l)} onChange={() => apply('lang:' + l, { ...profile, languages: toggle(profile.languages, l) })} />
            </div>
          ))}
        </div>

        <div className="try-group" role="group" aria-label="Where you work">
          <p className="try-group-title">Where you work</p>
          {COUNTRIES.map((k) => (
            <div key={k} className={`try-row${dim('country:' + k)}`}>
              <span className="try-row-label">{Engine.countryName(k)}</span>
              <Switch on={profile.countries.includes(k)} label={Engine.countryName(k)} onChange={() => apply('country:' + k, { ...profile, countries: toggle(profile.countries, k) })} />
            </div>
          ))}
          <div className={`try-row${dim('crossBorder')}`}>
            <span className="try-row-label">Bid outside those countries</span>
            <Switch on={!!profile.crossBorder} label="Bid outside your countries" onChange={() => apply('crossBorder', { ...profile, crossBorder: !profile.crossBorder })} />
          </div>
        </div>

        <p className="how-muted">Today is fixed at the demo date, {TODAY}, so days left do not drift. Re-scoring is plain rules, not AI.</p>
        <button type="button" className="btn btn-secondary" onClick={reset} data-reset>Back to the demo profile</button>
      </div>
    </div>
  );
}
