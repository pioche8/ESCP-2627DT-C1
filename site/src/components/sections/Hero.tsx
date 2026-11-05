'use client';
import { useEffect, useRef, useState } from 'react';
import { HONESTY, hero } from '@/data/copy';
import { Grain } from '@/components/ui/Grain';
import { Icon } from '@/components/ui/Icon';
import { useRaf } from '@/lib/useRaf';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Header } from './Header';

/**
 * Black hero with the glow blob drifting in an ellipse and easing toward the cursor (lerp .05 per frame). The giant wordmark is
 * filled with a radial gradient centred on the same x. The loop writes --gx/--gy on the section; React never re-renders per frame.
 */
export function Hero({ menuOpen, onMenu, count, menuRef }: { menuOpen: boolean; onMenu: () => void; count: number; menuRef: React.RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const g = useRef({ x: 50, y: 75, tx: 50, ty: 75, mouse: false, w: 0, h: 0, frame: 0 });
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const size = () => { g.current.w = el.clientWidth; g.current.h = el.clientHeight; };
    size(); window.addEventListener('resize', size);
    return () => { io.disconnect(); window.removeEventListener('resize', size); };
  }, []);
  useRaf((t) => {
    const h = g.current, glow = glowRef.current, mark = markRef.current; if (!glow || !mark) return;
    if (!h.mouse) { h.tx = 50 + 24 * Math.sin(t / 3800); h.ty = 74 + 8 * Math.cos(t / 5100); }
    h.x += (h.tx - h.x) * 0.05; h.y += (h.ty - h.y) * 0.05;
    glow.style.transform = `translate3d(${(h.x / 100) * h.w}px, ${(h.y / 100) * h.h}px, 0)`; // compositor only: no layout, no repaint
    if (h.frame++ % 3 === 0) mark.style.setProperty('--gx', h.x.toFixed(1) + '%'); // the text gradient repaints: 20 fps is plenty
  }, !reduce && visible);
  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect(), h = g.current;
    h.mouse = true; h.tx = ((e.clientX - r.left) / r.width) * 100; h.ty = Math.max(55, ((e.clientY - r.top) / r.height) * 100);
  };
  return (
    <section id="top" ref={ref} className="hero" onMouseMove={onMove} onMouseLeave={() => { g.current.mouse = false; }} aria-label="TenderScout">
      <div ref={glowRef} className="hero-glow" aria-hidden="true" />
      <Grain opacity={0.2} />
      <div ref={markRef} className="hero-wordmark" aria-hidden="true">TENDERSCOUT</div>
      <Header open={menuOpen} onMenu={onMenu} count={count} menuRef={menuRef} />
      <h1 className="hero-tagline">{hero.tagline}</h1>
      <div className="hero-meta">
        <div className="hero-meta-left">
          <span>{hero.meta}</span>
          <span className="hero-time"><Icon name="light_mode" size={16} />{hero.time}</span>
          <span className="hero-honesty">{HONESTY}</span>
        </div>
        <a href="#statement" className="hero-scroll">{hero.scroll}<Icon name="arrow_downward" size={16} /></a>
      </div>
    </section>
  );
}
