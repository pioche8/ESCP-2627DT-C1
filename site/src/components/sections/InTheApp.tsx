import { SectionLabel } from '@/components/ui/Primitives';
import { GlowBlob } from '@/components/ui/GlowBlob';
import { Grain } from '@/components/ui/Grain';
import { PhoneDemo } from '@/components/phone/PhoneDemo';

/** Copy on the left, the live phone on the right. The phone runs the app's engine.js on data.js. */
export function InTheApp() {
  const items = ['Feed · tonight’s verdicts at a glance', 'Bids · Go, Maybe and No-go, each with its reason', 'Company · change your profile, verdicts follow'];
  return (
    <section id="app" className="inapp" aria-labelledby="app-h">
      <GlowBlob gradient="core" blur={90} opacity={0.38} className="app-g1" />
      <GlowBlob gradient="sapphire" blur={70} opacity={0.6} className="app-g2" />
      <Grain />
      <div className="wrap-full inapp-grid">
        <div className="inapp-copy">
          <SectionLabel n="05">IN THE APP</SectionLabel>
          <h2 id="app-h" className="h2">Feed, Bids and Company in your pocket.</h2>
          <p className="body">Tap the dock on the phone. Bids keeps every Go, Maybe and No-go you saved. In Company, switch on ISO 27001 and watch Hohenau re-score, then answer the one line only you can answer.</p>
          <ol className="inapp-list">
            {items.map((t, i) => <li key={i}><span className="num-badge" aria-hidden="true">0{i + 1}</span>{t}</li>)}
          </ol>
        </div>
        <div className="inapp-phone"><PhoneDemo /></div>
      </div>
    </section>
  );
}
