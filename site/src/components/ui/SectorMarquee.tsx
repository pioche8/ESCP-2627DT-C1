'use client';
import { useEffect, useRef, useState } from 'react';
import type { Sector } from '@/data/sectors';

/**
 * The original's two rows of all 45 CPV divisions moving in opposite directions (110 s / 92 s), pausing on hover, on
 * focus and off-screen. Since pass 5 they are plain text ("CPV 45" in muted, the name in ink, yours in brand), no chips. Under
 * reduced motion they stand still, and the row stays inside its own box, so the page never scrolls sideways.
 */
export function SectorMarquee({ sectors }: { sectors: Sector[] }) {
  const rows = [0, 1].map((r) => sectors.filter((_, i) => i % 2 === r));
  const ref = useRef<HTMLDivElement>(null);
  const [off, setOff] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`marq${off ? ' is-off' : ''}`} role="list" aria-label="All 45 EU CPV divisions">
      {rows.map((items, r) => (
        <div className={`marq-row marq-row-${r + 1}`} key={r}>
          {[0, 1].map((copy) => (
            <div className="marq-group" key={copy} aria-hidden={copy ? true : undefined}>
              {items.map((s) => (
                <span key={s.code} role={copy ? undefined : 'listitem'} className={`marq-item${s.own ? ' own' : ''}`}>
                  <span className="marq-code">CPV {s.code}</span> {s.name}{s.own ? <span className="sr-only"> (your sector)</span> : null}
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
