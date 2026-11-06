'use client';
import { useEffect, useRef, useState } from 'react';
import tokens from '@/generated/tokens';
import { easeOutCubic } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Count-up written to the DOM over 650 ms with easeOutCubic (the same curve as the app's re-score). Instant under reduced
 * motion. Used by the phone demo's re-score and by the map's counts. It writes straight to the span, so wrap it in an
 * aria-hidden element and give screen readers the settled number separately.
 */
export function Counter({ value, duration = tokens.duration.rescore.countUp }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const [initial] = useState(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const from = prev.current, to = value; prev.current = value;
    if (reduce || from === to) { el.textContent = String(to); return; }
    const t0 = performance.now(); let id = 0;
    const step = (t: number) => { const p = Math.min(1, (t - t0) / duration); el.textContent = String(Math.round(from + (to - from) * easeOutCubic(p))); if (p < 1) id = requestAnimationFrame(step); };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value, duration, reduce]);
  return <span ref={ref} className="counter-val">{initial}</span>;
}
