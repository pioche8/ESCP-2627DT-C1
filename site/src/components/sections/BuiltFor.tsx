'use client';
import { sectors, OPEN_COUNTS_NOTE } from '@/data/sectors';
import { SquareButton } from '@/components/ui/Primitives';
import { SectorFolderCard } from '@/components/ui/SectorFolderCard';
import { useCarousel } from '@/components/ui/useCarousel';

/** All 45 CPV sector cards in a scroll-snap carousel with an "n of 45" counter and a progress bar. */
export function BuiltFor() {
  const { ref: trackRef, index, onScroll, prev, next } = useCarousel(276, sectors.length, 552);
  return (
    <section id="who" className="section" aria-labelledby="who-h">
      <div className="wrap who-head">
        <div className="who-copy">
          <h2 id="who-h" className="h2">Firms of 5 to 50, in all {sectors.length} sectors.</h2>
          <p className="body">Every EU tender is filed under one of {sectors.length} <abbr title="Common Procurement Vocabulary">CPV</abbr> divisions. Yours are marked, the rest are one tap away.</p>
        </div>
        <div className="car-btns">
          <span className="counter-label" aria-live="polite">{index + 1} of {sectors.length}</span>
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
