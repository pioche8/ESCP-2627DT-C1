import { languagesTile } from '@/data/copy';

/**
 * Two plain tiles: "Bid." and the one sentence about languages. The original's motion in solid colours (pass 5): the
 * photo that panned inside "Bid." becomes one brand-coloured letter travelling B → i → d → i (24 s, the original's 12 s each
 * way), and the light sweep across the lines becomes one brand-coloured word sweeping across the sentence (4.5 s).
 */
export function Languages() {
  const words = languagesTile.lines.split(' ');
  return (
    <section id="languages" className="section" aria-label="Languages">
      <div className="wrap lang-grid">
        <div className="lang-tile">
          <p className="lang-bid"><span className="sr-only">Bid.</span><span aria-hidden="true"><span className="pan-a">B</span><span className="pan-i">i</span><span className="pan-a pan-d">d</span><span className="pan-dot">.</span></span></p>
          <p className="lang-foot">{languagesTile.codes}</p>
        </div>
        <div className="lang-tile">
          <p className="lang-lines">
            <span className="sr-only">{languagesTile.lines}</span>
            <span aria-hidden="true">{words.map((w, i) => <span key={i} className="sweep-w" style={{ animationDelay: `${(-(4.5 - (i / words.length) * 0.8 * 4.5)).toFixed(2)}s` }}>{w} </span>)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
