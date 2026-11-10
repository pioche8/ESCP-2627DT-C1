import { PhoneDemo } from '@/components/phone/PhoneDemo';
import { PROFILE, VERDICT_LABEL, evaluateOne, withCert } from '@/data/app';

// Landkreis Hohenau before and after the demo path ("We meet it" on the unclear line, then ISO 27001), from the engine.
const HOH = 'hoh-security';
const before = evaluateOne(HOH);
const after = evaluateOne(HOH, withCert(PROFILE, 'ISO 27001', true), { [HOH]: { r3: 'pass' } });

/** Copy on the left, the live phone on the right. The phone is the prototype itself (PhoneDemo: an iframe of the app). */
export function InTheApp() {
  const items: [string, string][] = [['Feed', 'tonight’s verdicts at a glance'], ['Bids', 'every tender you saved, and your win rate'], ['Company', 'change your profile and the verdicts follow'], ['Profile', 'the firm every tender is checked against'], ['Settings', 'appearance, the morning notification, what is real']];
  return (
    <section id="app" className="section" aria-labelledby="app-h">
      <div className="wrap inapp-grid">
        <div className="inapp-copy">
          <h2 id="app-h" className="h2">Five tabs in your pocket.</h2>
          <p className="body">This is the prototype itself. Open Landkreis Hohenau and answer the one line only you can answer, then switch on ISO 27001 in Company and watch it go from {VERDICT_LABEL[before.verdict]} {before.score} to {VERDICT_LABEL[after.verdict]} {after.score}.</p>
          <ul className="inapp-list">
            {items.map(([k, t]) => <li key={k}><b>{k}</b> · {t}</li>)}
          </ul>
        </div>
        <div className="inapp-phone"><PhoneDemo /></div>
      </div>
    </section>
  );
}
