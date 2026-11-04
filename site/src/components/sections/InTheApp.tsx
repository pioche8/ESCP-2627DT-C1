import { PhoneDemo } from '@/components/phone/PhoneDemo';

/** Copy on the left, the live phone on the right. The phone runs the same decision rules as the prototype. */
export function InTheApp() {
  const items: [string, string][] = [['Feed', 'tonight’s verdicts at a glance'], ['Bids', 'every tender you saved, with its reason'], ['Company', 'change your profile and the verdicts follow']];
  return (
    <section id="app" className="section" aria-labelledby="app-h">
      <div className="wrap inapp-grid">
        <div className="inapp-copy">
          <h2 id="app-h" className="h2">Feed, Bids and Company in your pocket.</h2>
          <p className="body">Tap the tabs on the phone. In Company, switch on ISO 27001 and watch Hohenau re-score, then answer the one line only you can answer.</p>
          <ul className="inapp-list">
            {items.map(([k, t]) => <li key={k}><b>{k}</b> · {t}</li>)}
          </ul>
        </div>
        <div className="inapp-phone"><PhoneDemo /></div>
      </div>
    </section>
  );
}
