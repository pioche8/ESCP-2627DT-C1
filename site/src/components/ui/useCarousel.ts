'use client';
import { useCallback, useRef, useState } from 'react';

/** Scroll-snap carousel state: the index is derived from scrollLeft / stride; prev/next scroll by one page. */
export function useCarousel(stride: number, count: number, page = stride) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const i = Math.max(0, Math.min(count - 1, Math.round(e.currentTarget.scrollLeft / stride)));
    setIndex((prev) => (prev === i ? prev : i));
  }, [stride, count]);
  const by = (dx: number) => ref.current?.scrollBy({ left: dx, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  return { ref, index, onScroll, prev: () => by(-page), next: () => by(page) };
}
