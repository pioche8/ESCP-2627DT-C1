import { languagesTile } from '@/data/copy';

/** Two plain tiles: "Bid." and the one sentence about languages. */
export function Languages() {
  return (
    <section id="languages" className="section" aria-label="Languages">
      <div className="wrap lang-grid">
        <div className="lang-tile">
          <p className="lang-bid">Bid<span>.</span></p>
          <p className="lang-foot">{languagesTile.codes}</p>
        </div>
        <div className="lang-tile">
          <p className="lang-lines">{languagesTile.lines}</p>
        </div>
      </div>
    </section>
  );
}
