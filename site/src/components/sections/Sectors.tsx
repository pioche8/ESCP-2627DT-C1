'use client';
import { useState } from 'react';
import { featuredStrips, sectors } from '@/data/sectors';
import { Photo } from '@/components/ui/Photo';
import { SectionLabel } from '@/components/ui/Primitives';
import { SectorMarquee } from '@/components/ui/SectorMarquee';

/** A 5-strip accordion (hover or focus expands one strip to flex 5) and the two-row sector marquee. */
export function Sectors() {
  const [strip, setStrip] = useState(0);
  return (
    <section id="sectors" className="sectors" aria-labelledby="sectors-h">
      <div className="wrap sectors-head">
        <div className="sec-head">
          <SectionLabel n="06">SECTORS</SectionLabel>
          <h2 id="sectors-h" className="h2">All {sectors.length} EU sectors.</h2>
        </div>
        <p className="body sec-aside">Tenders are filed under EU <abbr title="Common Procurement Vocabulary">CPV</abbr> codes. Pick the ones you sell and we read every new tender in them. Weekly counts are illustrative.</p>
      </div>
      <div className="wrap">
        <div className="strips" role="list">
          {featuredStrips.map((s, i) => (
            <div
              key={s.code}
              role="listitem"
              tabIndex={0}
              onMouseEnter={() => setStrip(i)}
              onFocus={() => setStrip(i)}
              className={`strip${strip === i ? ' active' : ''}`}
              aria-label={`CPV ${s.code} ${s.title}: ${s.desc} ${s.open} open this week (illustrative).`}
            >
              <Photo src={s.img} sizes="(min-width: 1024px) 60vw, 100vw" className="strip-photo" />
              <div className="strip-fade" aria-hidden="true" />
              <span className="strip-code">CPV {s.code}</span>
              <div className="strip-text" aria-hidden={strip !== i}>
                <div className="strip-name">{s.title}</div>
                <p className="strip-desc">{s.desc} {s.open} open this week.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SectorMarquee sectors={sectors} />
    </section>
  );
}
