import { languagesTile } from '@/data/copy';

/** Two tiles: "Bid." filled with a slowly panning photo (period in sky), and three tilted lines with a moving light sweep. */
export function Languages() {
  return (
    <section id="languages" className="languages" aria-label="Languages">
      <div className="wrap-full lang-grid">
        <div className="lang-tile lang-mask">
          <div className="lang-bid" aria-hidden="true">Bid<span>.</span></div>
          <span className="sr-only">Bid.</span>
          <div className="lang-foot"><span>02 — LANGUAGES</span><span>{languagesTile.codes}</span></div>
        </div>
        <div className="lang-tile lang-sweep">
          <div className="sweep-lines" aria-hidden="true">
            {languagesTile.lines.map((l, i) => <span key={i} style={{ animationDelay: `${i * 0.25}s` }}>{l}</span>)}
          </div>
          <p className="sr-only">{languagesTile.lines.join(' ')}</p>
        </div>
      </div>
    </section>
  );
}
