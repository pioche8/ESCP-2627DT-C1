'use client';
import { statement } from '@/data/copy';
import { ScrollRevealText } from '@/components/ui/ScrollRevealText';

/** The statement lights up word by word (muted → ink) as it scrolls through the viewport. */
export function Statement() {
  return (
    <section id="statement" className="statement" aria-label="What TenderScout does">
      <ScrollRevealText text={statement} className="statement-text" />
    </section>
  );
}
