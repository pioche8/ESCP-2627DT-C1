'use client';
import type { TenderView } from '@/data/app';
import { rollWords } from '@/data/copy';
import { GlowBlob } from '@/components/ui/GlowBlob';
import { Grain } from '@/components/ui/Grain';
import { CircleButton, ProgressBars, SectionLabel } from '@/components/ui/Primitives';
import { RollingWord } from '@/components/ui/RollingWord';
import { TenderCard } from '@/components/ui/TenderCard';
import { VerdictShape } from '@/components/ui/VerdictShape';
import { useCarousel } from '@/components/ui/useCarousel';
import tokens from '@/generated/tokens';

/** Label row with the verdict-hop pill, the rolling question, and the six-card scroll-snap carousel with a 6-segment progress bar. */
export function Tonight({ tenders, count }: { tenders: TenderView[]; count: number }) {
  const { ref: trackRef, index, onScroll, prev, next } = useCarousel(316, tenders.length);
  const matched = tenders.length;
  return (
    <section id="tonight" className="tonight" aria-labelledby="tonight-h">
      <GlowBlob gradient="sapphire" blur={80} opacity={0.55} className="tn-g1" />
      <GlowBlob gradient="sky" blur={80} opacity={0.22} className="tn-g2" />
      <Grain />
      <div className="wrap tonight-head">
        <div className="tonight-copy">
          <div className="label-row">
            <SectionLabel n="01">TONIGHT’S READ</SectionLabel>
            <span className="hop-pill">
              <span className="hop" aria-hidden="true">
                <VerdictShape verdict="go" size={8} color={tokens.verdict.go.solidSmall} />
                <VerdictShape verdict="maybe" size={8} color={tokens.verdict.maybe.solid} />
                <VerdictShape verdict="nogo" size={7} color={tokens.verdict.nogo.solid} />
              </span>
              Scoring {count} new tenders
            </span>
          </div>
          <h2 id="tonight-h" className="h2-lg">Can we bid on <RollingWord words={rollWords} /></h2>
          <p className="body tonight-sub">{matched === 6 ? 'Six' : matched} new tenders matched your sectors last night. Each one has a verdict, a score and the reasons behind it.</p>
        </div>
        <div className="car-btns">
          <CircleButton icon="arrow_back" label="Previous tender" onClick={prev} />
          <CircleButton icon="arrow_forward" label="Next tender" onClick={next} tone="solid" />
        </div>
      </div>
      <div ref={trackRef} onScroll={onScroll} className="track track-tenders" role="list" aria-label="Tonight’s tenders" tabIndex={0}>
        {tenders.map((t) => <div role="listitem" key={t.id} className="track-item"><TenderCard t={t} /></div>)}
      </div>
      <div className="wrap"><ProgressBars count={tenders.length} active={index} /></div>
    </section>
  );
}
