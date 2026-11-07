import { featuredStrips, sectors } from '@/data/sectors';
import { Photo } from '@/components/ui/Photo';

/** Five featured sectors: a photo block each, with the name, a line and the weekly count beneath it. */
export function Sectors() {
  return (
    <section id="sectors" className="section" aria-labelledby="sectors-h">
      <div className="wrap sectors-head">
        <div className="sec-head">
          <h2 id="sectors-h" className="h2">All {sectors.length} EU sectors.</h2>
        </div>
        <p className="body sec-aside">Tenders are filed under EU <abbr title="Common Procurement Vocabulary">CPV</abbr> codes. Pick the ones you sell and we read every new tender in them. Weekly counts are illustrative.</p>
      </div>
      <div className="wrap">
        <div className="strips" role="list">
          {featuredStrips.map((s) => (
            <div key={s.code} role="listitem" className="strip" aria-label={`CPV ${s.code} ${s.title}: ${s.desc} ${s.open} open this week (illustrative).`}>
              <Photo src={s.img} sizes="(min-width: 1024px) 20vw, 50vw" className="strip-photo" />
              <span className="strip-code">CPV {s.code}</span>
              <h3 className="strip-name">{s.title}</h3>
              <p className="strip-desc">{s.desc} {s.open} open this week.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
