'use client';
import { sectors, OPEN_COUNTS_NOTE } from '@/data/sectors';
import { CircleButton, SectionLabel } from '@/components/ui/Primitives';
import { SectorFolderCard } from '@/components/ui/SectorFolderCard';
import { useCarousel } from '@/components/ui/useCarousel';
import { GlowBlob } from '@/components/ui/GlowBlob';
import { Grain } from '@/components/ui/Grain';

/** All 45 CPV folder cards in a scroll-snap carousel with an NN / 45 counter and a progress bar. */
export function BuiltFor() {
  const { ref: trackRef, index, onScroll, prev, next } = useCarousel(296, sectors.length, 592);
  return (
    <section id="who" className="who" aria-labelledby="who-h">
      <GlowBlob gradient="sea" blur={90} opacity={0.35} className="who-g" />
      <Grain />
      <div className="wrap who-head">
        <div className="who-copy">
          <SectionLabel n="04">BUILT FOR</SectionLabel>
          <h2 id="who-h" className="h2">Firms of 5 to 50, in all {sectors.length} sectors.</h2>
          <p className="body">Every EU tender is filed under one of {sectors.length} <abbr title="Common Procurement Vocabulary">CPV</abbr> divisions. Your sectors are marked; the rest are one tap away. {OPEN_COUNTS_NOTE}.</p>
        </div>
        <div className="car-btns">
          <span className="label counter-label" aria-live="polite">{String(index + 1).padStart(2, '0')} / {sectors.length}</span>
          <CircleButton icon="arrow_back" label="Previous sectors" onClick={prev} />
          <CircleButton icon="arrow_forward" label="Next sectors" onClick={next} tone="solid" />
        </div>
      </div>
      <div ref={trackRef} onScroll={onScroll} className="track track-folders" role="list" aria-label="EU CPV divisions">
        {sectors.map((s) => <div role="listitem" key={s.code} className="track-item"><SectorFolderCard s={s} /></div>)}
      </div>
      <div className="wrap who-foot">
        <div className="pbar" aria-hidden="true"><div style={{ width: `${(((index + 1) / sectors.length) * 100).toFixed(1)}%` }} /></div>
        <span className="label">EU CPV DIVISIONS · WEEKLY COUNTS ILLUSTRATIVE</span>
      </div>
    </section>
  );
}
