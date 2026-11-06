import { faqs } from '@/data/copy';
import { Accordion } from '@/components/ui/Accordion';
import { SectionLabel } from '@/components/ui/Primitives';

export function Questions() {
  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-h">
      <div className="wrap faq-grid">
        <div className="sec-head">
          <SectionLabel n="09">QUESTIONS</SectionLabel>
          <h2 id="faq-h" className="h2">Asked often.</h2>
        </div>
        <Accordion items={faqs} />
      </div>
    </section>
  );
}
