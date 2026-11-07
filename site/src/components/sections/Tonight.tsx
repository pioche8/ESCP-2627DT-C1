'use client';
import type { TenderView } from '@/data/app';
import { rollWords } from '@/data/copy';
import { ProgressBars, SquareButton } from '@/components/ui/Primitives';
import { RollingWord } from '@/components/ui/RollingWord';
import { TenderCard } from '@/components/ui/TenderCard';
import { VerdictShape } from '@/components/ui/VerdictShape';
import { useCarousel } from '@/components/ui/useCarousel';

/**
 * The rolling question, the original's three hopping verdict shapes ("Scoring 6 new tenders", plain text since pass 5,
 * no pill), and the six-card scroll-snap carousel with a 6-segment progress bar.
 */
export function Tonight({ tenders }: { tenders: TenderView[] }) {
  const { ref: trackRef, index, onScroll, prev, next } = useCarousel(316, tenders.length);
  return (
    <section id="tonight" className="section" aria-labelledby="tonight-h">
      <div className="wrap tonight-head">
        <div className="tonight-copy">
          <h2 id="tonight-h" className="h2">Can we bid on <RollingWord words={rollWords} /></h2>
          <p className="body tonight-sub">{tenders.length} new tenders matched your sectors last night, each with a verdict and a score.</p>
          <p className="hop-line">
            <span className="hop" aria-hidden="true">
              <VerdictShape verdict="go" size={9} className="v-go" />
              <VerdictShape verdict="maybe" size={9} className="v-maybe" />
              <VerdictShape verdict="nogo" size={8} className="v-nogo" />
            </span>
            Scoring {tenders.length} new tenders
          </p>
        </div>
        <div className="car-btns">
          <SquareButton icon="arrow_back" label="Previous tender" onClick={prev} />
          <SquareButton icon="arrow_forward" label="Next tender" onClick={next} />
        </div>
      </div>
      <div ref={trackRef} onScroll={onScroll} className="track track-tenders" role="list" aria-label="Tonight’s tenders" tabIndex={0}>
        {tenders.map((t) => <div role="listitem" key={t.id} className="track-item"><TenderCard t={t} /></div>)}
      </div>
      <div className="wrap"><ProgressBars count={tenders.length} active={index} /></div>
    </section>
  );
}
