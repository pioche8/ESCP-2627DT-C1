import { faqs } from '@/data/copy';
import { Accordion } from '@/components/ui/Accordion';

export function Questions() {
  return (
    <section id="faq" className="section" aria-labelledby="faq-h">
      <div className="wrap faq-grid">
        <div className="sec-head">
          <h2 id="faq-h" className="h2">Asked often.</h2>
        </div>
        <Accordion items={faqs} />
      </div>
    </section>
  );
}
