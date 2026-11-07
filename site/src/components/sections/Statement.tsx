'use client';
import { statement } from '@/data/copy';
import { ScrollRevealText } from '@/components/ui/ScrollRevealText';

/**
 * The statement lights up word by word (muted → ink) as it scrolls through the viewport. Behind it, the original's three
 * drifting glows as three solid surface-coloured bands on the same 16 s / 20 s / 12 s drifts (pass 5); they stop under
 * reduced motion.
 */
export function Statement() {
  return (
    <section id="statement" className="statement" aria-label="What TenderScout does">
      <div className="st-band st-b1" aria-hidden="true" />
      <div className="st-band st-b2" aria-hidden="true" />
      <div className="st-band st-b3" aria-hidden="true" />
      <ScrollRevealText text={statement} className="statement-text" />
    </section>
  );
}
