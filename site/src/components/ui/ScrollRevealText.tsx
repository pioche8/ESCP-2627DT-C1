'use client';
import { useEffect, useRef } from 'react';
import { clamp } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * A paragraph that lights up word by word (unlit grey → white) as it scrolls through the viewport. Progress = how far the
 * block has travelled through the lower 80 % of the viewport. Written straight to the DOM from one scroll handler, no state.
 * `onProgress` lets the section drive its glow opacity. Under reduced motion every word is lit at once.
 */
export function ScrollRevealText({ text, onProgress, className = '' }: { text: string; onProgress?: (p: number) => void; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const cb = useRef(onProgress);
  useEffect(() => { cb.current = onProgress; });
  const reduce = useReducedMotion();
  const words = text.split(' ');
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>('span[data-w]'));
    if (reduce) { spans.forEach((s) => s.classList.add('lit')); cb.current?.(1); return; }
    let lastN = -1, raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const p = clamp((vh * 0.8 - r.top) / (r.height * 0.75), 0, 1);
      const n = Math.round(p * spans.length);
      if (n !== lastN) { lastN = n; spans.forEach((s, i) => s.classList.toggle('lit', i < n)); cb.current?.(p); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce]);
  return (
    <p ref={ref} className={`reveal ${className}`}>
      {words.map((w, i) => <span key={i} data-w="">{w} </span>)}
    </p>
  );
}
