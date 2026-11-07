'use client';
import { statement } from '@/data/copy';
import { ScrollRevealText } from '@/components/ui/ScrollRevealText';

/**
 * The statement lights up word by word (muted → ink) as it scrolls through the viewport. Behind it, the original's three
 * drifting glows as two solid surface-coloured discs on the original's 16 s and 20 s drifts (pass 5); they stop under
 * reduced motion.
 */
export function Statement() {
  return (
    <section id="statement" className="statement" aria-label="What TenderScout does">
      <div className="st-band st-b1" aria-hidden="true" />
      <div className="st-band st-b2" aria-hidden="true" />
      <ScrollRevealText text={statement} className="statement-text" />
    </section>
  );
}
