'use client';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

const STEP = 24, DOT = 2.4, R_LIT = 340, R_HOT = 150; // the original's 24 px grid and 340 px spotlight

/**
 * The original "How it works" spotlight in solid colours (pass 5): a 24 px grid of small squares in the surface colour,
 * where the squares within 340 px of the cursor turn muted and those within 150 px turn brand. No gradient and no mask:
 * a canvas, viewport-tall and sticky inside the section, redrawn on mouse move and scroll (one rAF at a time), the grid
 * anchored to the section so it scrolls with the page. Without a mouse (touch) or under reduced motion the lit spot rests
 * where the original's did: half-way across, 30 % down the section.
 */
export function SpotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const cv = ref.current, sec = cv?.parentElement; if (!cv || !sec) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const col = { dot: css.getPropertyValue('--c-surface').trim(), lit: css.getPropertyValue('--c-muted').trim(), hot: css.getPropertyValue('--c-brand').trim() };
    let raf = 0, mouse: [number, number] | null = null, on = false;
    const draw = () => {
      raf = 0;
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const s = sec.getBoundingClientRect(), c = cv.getBoundingClientRect();
      const ox = (((s.left - c.left) % STEP) + STEP) % STEP, oy = (((s.top - c.top) % STEP) + STEP) % STEP;
      const [cx, cy] = mouse && !reduce ? [mouse[0] - c.left, mouse[1] - c.top] : [s.left + s.width * 0.5 - c.left, s.top + s.height * 0.3 - c.top];
      for (let y = oy; y < h; y += STEP) {
        for (let x = ox; x < w; x += STEP) {
          const d = Math.hypot(x - cx, y - cy);
          ctx.fillStyle = d < R_HOT ? col.hot : d < R_LIT ? col.lit : col.dot;
          ctx.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT);
        }
      }
    };
    const queue = () => { if (on && !raf) raf = requestAnimationFrame(draw); };
    const move = (e: MouseEvent) => { if (reduce) return; mouse = [e.clientX, e.clientY]; queue(); };
    const leave = () => { mouse = null; queue(); };
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; queue(); });
    io.observe(sec);
    sec.addEventListener('mousemove', move); sec.addEventListener('mouseleave', leave);
    window.addEventListener('scroll', queue, { passive: true }); window.addEventListener('resize', queue);
    return () => { io.disconnect(); sec.removeEventListener('mousemove', move); sec.removeEventListener('mouseleave', leave); window.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); if (raf) cancelAnimationFrame(raf); };
  }, [reduce]);
  return <canvas ref={ref} className="how-spot" aria-hidden="true" />;
}
