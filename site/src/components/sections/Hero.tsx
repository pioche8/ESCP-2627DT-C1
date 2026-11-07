'use client';
import { useEffect, useRef, useState } from 'react';
import { HONESTY, hero } from '@/data/copy';
import { Icon } from '@/components/ui/Icon';
import { SM } from '@/lib/motion';
import { useRaf } from '@/lib/useRaf';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Header } from './Header';

const WORD = 'TenderScout';
const D = SM.heroDrift;
// Letter colours by distance from the disc's centre, in letters: the original's radial gradient (white → sky → dark,
// centred on the glow's x) as solid steps.
const STEPS: string[] = ['lit-0', 'lit-1', 'lit-2'];

/**
 * The hero: header, the tagline, one meta line, and the original's two moving parts in solid colours (pass 5). A solid
 * surface-coloured disc drifts in the original's ellipse and eases toward the cursor (lerp .05 per frame); the large
 * wordmark at the bottom lights the letters nearest the disc's x in ink, brand and muted, the rest stay in the surface
 * colour. One rAF loop writes the transform and, at 20 fps, the letter classes; React never re-renders per frame. Paused
 * off-screen; static (centred) under reduced motion.
 */
export function Hero({ menuOpen, onMenu, menuRef }: { menuOpen: boolean; onMenu: () => void; menuRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const g = useRef({ x: D.centreX as number, y: D.centreY as number, tx: D.centreX as number, ty: D.centreY as number, mouse: false, w: 0, h: 0, frame: 0, r: 0, letters: [] as { el: HTMLSpanElement; cx: number; w: number; step: number }[] });
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);

  // Measure the hero, the disc and every letter's centre (relative to the hero); light the letters for a given x.
  const paint = (x: number, y: number) => {
    const h = g.current, disc = discRef.current; if (!disc) return;
    disc.style.transform = `translate3d(${(x / 100) * h.w - h.r}px, ${(y / 100) * h.h - h.r}px, 0)`;
  };
  const light = (x: number) => {
    const h = g.current, px = (x / 100) * h.w;
    h.letters.forEach((l) => {
      // over the disc a letter is at least muted, so it never vanishes into the disc's surface colour
      const d = Math.abs(l.cx - px) / l.w, step = d < 0.6 ? 0 : d < 1.6 ? 1 : d < 2.6 || Math.abs(l.cx - px) < h.r ? 2 : 3;
      if (step !== l.step) { if (l.step < 3) l.el.classList.remove(STEPS[l.step]); if (step < 3) l.el.classList.add(STEPS[step]); l.step = step; }
    });
  };
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const size = () => {
      const h = g.current, box = el.getBoundingClientRect();
      h.w = el.clientWidth; h.h = el.clientHeight; h.r = Math.max(110, Math.min(h.w, h.h * 1.6) * 0.24);
      if (discRef.current) { discRef.current.style.width = discRef.current.style.height = 2 * h.r + 'px'; }
      const spans = markRef.current ? Array.from(markRef.current.querySelectorAll<HTMLSpanElement>('span')) : [];
      h.letters = spans.map((s) => { const r = s.getBoundingClientRect(); return { el: s, cx: r.left - box.left + r.width / 2, w: Math.max(1, r.width), step: 3 }; });
      spans.forEach((s) => s.classList.remove(...STEPS));
      paint(h.x, h.y); light(h.x);
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(el);
    document.fonts?.ready.then(size).catch(() => {});
    return () => { io.disconnect(); ro.disconnect(); };
  }, []);
  useEffect(() => { // reduced motion: the disc and the lit letters sit at the original's starting point
    if (!reduce) return;
    const h = g.current; h.x = h.tx = D.centreX; h.y = h.ty = D.centreY; paint(h.x, h.y); light(h.x);
  }, [reduce]);
  useRaf((t) => {
    const h = g.current;
    if (!h.mouse) { h.tx = D.centreX + D.amplitudeX * Math.sin(t / D.periodX); h.ty = D.centreY + D.amplitudeY * Math.cos(t / D.periodY); }
    h.x += (h.tx - h.x) * D.lerp; h.y += (h.ty - h.y) * D.lerp;
    paint(h.x, h.y); // compositor only: no layout
    if (h.frame++ % 3 === 0) light(h.x); // letter classes at 20 fps, as the original's gradient
  }, !reduce && visible);
  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect(), h = g.current;
    h.mouse = true; h.tx = ((e.clientX - r.left) / r.width) * 100; h.ty = Math.max(D.minCursorY, ((e.clientY - r.top) / r.height) * 100);
  };
  return (
    <section id="top" ref={ref} className="hero" onMouseMove={onMove} onMouseLeave={() => { g.current.mouse = false; }} aria-label="TenderScout">
      <div ref={discRef} className="hero-disc" aria-hidden="true" />
      <div className="wrap hero-inner">
        <Header open={menuOpen} onMenu={onMenu} menuRef={menuRef} />
        <h1 className="hero-tagline">{hero.tagline}</h1>
        <div className="hero-meta">
          <div className="hero-meta-left">
            <span>{hero.meta}</span>
            <span>{HONESTY}</span>
          </div>
          <a href="#statement" className="hero-scroll">{hero.scroll}<Icon name="arrow_downward" size={16} /></a>
        </div>
      </div>
      <div ref={markRef} className="hero-wordmark" aria-hidden="true">{WORD.split('').map((ch, i) => <span key={i}>{ch}</span>)}</div>
    </section>
  );
}
