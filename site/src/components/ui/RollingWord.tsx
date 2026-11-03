'use client';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** One word rolls up every 2 s (700 ms, the `roll` curve). Under reduced motion the word swaps without moving. */
export function RollingWord({ words, interval = 2000 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  const [anim, setAnim] = useState(true);
  const reduce = useReducedMotion();
  useEffect(() => {
    const id = setInterval(() => setI((n) => n + 1), interval);
    return () => clearInterval(id);
  }, [interval]);
  // The list ends with a copy of the first word: after rolling onto it, snap back to 0 without a transition.
  useEffect(() => {
    if (reduce || i < words.length) return;
    const t = setTimeout(() => {
      setAnim(false); setI(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    }, 720);
    return () => clearTimeout(t);
  }, [i, words.length, reduce]);
  const idx = reduce ? i % words.length : Math.min(i, words.length);
  const list = [...words, words[0]];
  return (
    <div className="roll">
      <span className="sr-only" aria-live="off">{words[i % words.length]}</span>
      <div className="roll-track" aria-hidden="true" style={{ transform: `translateY(calc(${idx} * -1 * var(--roll-h)))`, transition: anim && !reduce ? 'transform .7s var(--ease-roll)' : 'none' }}>
        {list.map((w, k) => <span key={k} className="roll-word">{w}</span>)}
      </div>
    </div>
  );
}
