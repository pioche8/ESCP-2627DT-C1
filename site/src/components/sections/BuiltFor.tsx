'use client';
import { sectors, OPEN_COUNTS_NOTE } from '@/data/sectors';
import { SquareButton } from '@/components/ui/Primitives';
import { SectorFolderCard } from '@/components/ui/SectorFolderCard';
import { useCarousel } from '@/components/ui/useCarousel';

/** All 45 CPV division cards in a scroll-snap carousel with an "n of 45 divisions" counter and a progress bar. The heading
 * claims every sector, not "45 sectors": CPV 2008 has 45 divisions, each split into groups, classes and categories. The body
 * says how they are numbered (03 to 98, with gaps), so "45" does not read as an undercount next to a code such as 98; the
 * count and both ends come from the app's list (pass 9b). */
export function BuiltFor() {
  const { ref: trackRef, index, onScroll, prev, next } = useCarousel(276, sectors.length, 552);
  return (
    <section id="who" className="section" aria-labelledby="who-h">
      <div className="wrap who-head">
        <div className="who-copy">
          <h2 id="who-h" className="h2">Firms of 5 to 50, in every sector.</h2>
          <p className="body">Every EU tender carries <abbr title="Common Procurement Vocabulary">CPV</abbr> codes. They fall into {sectors.length} divisions, numbered {sectors[0].code} to {sectors[sectors.length - 1].code} with gaps. Yours are marked; the rest are one tap away.</p>
        </div>
        <div className="car-btns">
          <span className="counter-label" aria-live="polite">{index + 1} of {sectors.length} divisions</span>
          <SquareButton icon="arrow_back" label="Previous sectors" onClick={prev} />
          <SquareButton icon="arrow_forward" label="Next sectors" onClick={next} />
        </div>
      </div>
      <div ref={trackRef} onScroll={onScroll} className="track track-folders" role="list" aria-label="EU CPV divisions">
        {sectors.map((s) => <div role="listitem" key={s.code} className="track-item"><SectorFolderCard s={s} /></div>)}
      </div>
      <div className="wrap who-foot">
        <div className="pbar" aria-hidden="true"><div style={{ width: `${(((index + 1) / sectors.length) * 100).toFixed(1)}%` }} /></div>
        <span className="who-note">{OPEN_COUNTS_NOTE}</span>
      </div>
    </section>
  );
}
