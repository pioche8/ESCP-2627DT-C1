'use client';
import { useCallback, useRef } from 'react';
import { statement } from '@/data/copy';
import { GlowBlob } from '@/components/ui/GlowBlob';
import { ScrollRevealText } from '@/components/ui/ScrollRevealText';

/** The 34-word statement lights up word by word; the drifting "dawn ribbon" blobs brighten with the same progress. */
export function Statement() {
  const ref = useRef<HTMLElement>(null);
  const onProgress = useCallback((p: number) => { ref.current?.style.setProperty('--rev', (0.2 + 0.8 * p).toFixed(2)); }, []);
  return (
    <section id="statement" ref={ref} className="statement" aria-label="What TenderScout does">
      <GlowBlob gradient="sea" blur={50} drift="d1" className="st-g1" />
      <GlowBlob gradient="sky" blur={55} drift="d2" className="st-g2" />
      <GlowBlob gradient="white" blur={34} drift="d3" className="st-g3" />
      <GlowBlob gradient="amber" blur={40} opacity={0.35} className="st-g4" />
      <ScrollRevealText text={statement} onProgress={onProgress} className="statement-text" />
    </section>
  );
}
