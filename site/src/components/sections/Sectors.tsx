'use client';
import { useState } from 'react';
import { featuredStrips, sectors } from '@/data/sectors';
import { Photo } from '@/components/ui/Photo';
import { SectorMarquee } from '@/components/ui/SectorMarquee';

/**
 * Five featured sectors, each a photo block with its code and name beneath. The original's accordion is back (pass 5): on
 * hover, focus or tap one strip widens (flex 1 → 2.2 over 700 ms; on a phone its photo grows taller) and shows its line and
 * the weekly count. Under them, the original's two rows of all 45 divisions drift in opposite directions as plain text.
 */
export function Sectors() {
  const [strip, setStrip] = useState(0);
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
          {featuredStrips.map((s, i) => (
            <div key={s.code} role="listitem" tabIndex={0} onMouseEnter={() => setStrip(i)} onFocus={() => setStrip(i)} onClick={() => setStrip(i)}
              className={`strip${strip === i ? ' active' : ''}`} aria-label={`CPV ${s.code} ${s.title}: ${s.desc} ${s.open} open this week (illustrative).`}>
              <Photo src={s.img} sizes="(min-width: 1024px) 40vw, 100vw" className="strip-photo" />
              <span className="strip-code" aria-hidden="true">CPV {s.code}</span>
              <div className="strip-name" aria-hidden="true">{s.title}</div>
              <p className="strip-desc" aria-hidden="true">{s.desc} {s.open} open this week.</p>
            </div>
          ))}
        </div>
      </div>
      <SectorMarquee sectors={sectors} />
    </section>
  );
}
