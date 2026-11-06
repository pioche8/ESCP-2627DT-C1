'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Icon } from './Icon';

/** One item open at a time; the answer grows with grid-template-rows 0fr → 1fr and the + rotates 45°. */
export function Accordion({ items, defaultOpen = 0 }: { items: { q: string; a: string }[]; defaultOpen?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  return (
    <div className="faq">
      {items.map((it, i) => {
        const o = open === i, id = `faq-a-${i}`, bid = `faq-q-${i}`;
        return (
          <div className="faq-item" key={i}>
            <h3 className="faq-h">
              <button type="button" id={bid} aria-expanded={o} aria-controls={id} onClick={() => setOpen(o ? -1 : i)} className="faq-q">
                <span>{it.q}</span>
                <span className={`faq-plus${o ? ' open' : ''}`} aria-hidden="true"><Icon name="add" size={24} /></span>
              </button>
            </h3>
            <motion.div id={id} role="region" aria-labelledby={bid} className="faq-a" initial={false} animate={{ height: o ? 'auto' : 0 }} transition={reduce ? { duration: 0 } : { duration: 0.45, ease: EASE.enter }} style={{ overflow: 'hidden' }} aria-hidden={!o}>
              <div><p>{it.a}</p></div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
