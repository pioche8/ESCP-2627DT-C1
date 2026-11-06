'use client';
import { useEffect, useRef, useState } from 'react';
import tokens from '@/generated/tokens';
import type { Sector } from '@/data/sectors';

/** Two rows of all 45 CPV chips moving in opposite directions (110 s / 92 s), pausing on hover. The firm's sectors are filled sky. */
export function SectorMarquee({ sectors }: { sectors: Sector[] }) {
  const rows = [0, 1].map((r) => sectors.filter((_, i) => i % 2 === r));
  const dur = tokens.duration.marquee.siteRows;
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
        <div className="marq-row" key={r} style={{ animationDuration: dur[r], animationDirection: r ? 'reverse' : 'normal' }}>
          {[0, 1].map((copy) => (
            <div className="marq-group" key={copy} aria-hidden={copy ? true : undefined}>
              {items.map((s) => (
                <span key={s.code} role={copy ? undefined : 'listitem'} className={`marq-chip${s.own ? ' own' : ''}`}>
                  <span className="marq-code" aria-hidden="true">{s.code}</span>
                  <span className="sr-only">CPV {s.code} </span>{s.name}{s.own ? <span className="sr-only"> (your sector)</span> : null}
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
