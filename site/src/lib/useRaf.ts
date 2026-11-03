'use client';
import { useEffect, useRef } from 'react';

/** One requestAnimationFrame loop per component; the callback writes to refs/DOM, never to React state. */
export function useRaf(cb: (t: number, dt: number) => void, active = true) {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; });
  useEffect(() => {
    if (!active) return;
    let id = 0, last = 0;
    const loop = (t: number) => {
      id = requestAnimationFrame(loop);
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      ref.current(t, dt);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}
