'use client';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';

const STEP = 24, DOT = 2.4, R_LIT = 220, R_HOT = 90, PAD = 16; // the original's 24 px grid; a tighter spot than its 340 px soft glow, since solid tiers are louder than a fade

/**
 * The original "How it works" spotlight in solid colours (pass 5): a 24 px grid of small squares in the surface colour,
 * where the squares within 220 px of the cursor turn muted and those within 90 px turn brand. No gradient and no mask:
 * a canvas, viewport-tall and sticky inside the section, redrawn on mouse move and scroll (one rAF at a time), the grid
 * anchored to the section so it scrolls with the page. Squares behind the active step's text stay surface, so the lit dots
 * never sit between letters. Without a mouse (touch) or under reduced motion there is no lit spot: a spotlight follows a
 * pointer (the original rested half-way across, 30 % down, on top of the step text on a phone).
 */
export function SpotGrid({ active }: { active: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const redraw = useRef<() => void>(() => {});
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
      const spot = mouse && !reduce ? [mouse[0] - c.left, mouse[1] - c.top] : null;
      // the active step's title and body (not the whole 85vh step), so only the dots behind the words stay quiet
      const parts = Array.from(sec.querySelectorAll('.how-step.active .step-title, .how-step.active .step-body')).map((e) => e.getBoundingClientRect());
      const txt = parts.length ? [Math.min(...parts.map((r) => r.left)) - c.left - PAD, Math.min(...parts.map((r) => r.top)) - c.top - PAD, Math.max(...parts.map((r) => r.right)) - c.left + PAD, Math.max(...parts.map((r) => r.bottom)) - c.top + PAD] : null;
      for (let y = oy; y < h; y += STEP) {
        for (let x = ox; x < w; x += STEP) {
          const quiet = !spot || (txt && x > txt[0] && x < txt[2] && y > txt[1] && y < txt[3]);
          const d = quiet ? Infinity : Math.hypot(x - spot[0], y - spot[1]);
          ctx.fillStyle = d < R_HOT ? col.hot : d < R_LIT ? col.lit : col.dot;
          ctx.fillRect(x - DOT / 2, y - DOT / 2, DOT, DOT);
        }
      }
    };
    const queue = () => { if (on && !raf) raf = requestAnimationFrame(draw); };
    // a mouse only: a touch tap fires compatibility mouse events and no leave, which would park a lit patch on the screen
    const move = (e: PointerEvent) => { if (reduce || e.pointerType !== 'mouse') return; mouse = [e.clientX, e.clientY]; queue(); };
    const leave = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; mouse = null; queue(); };
    redraw.current = queue;
    const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; queue(); });
    io.observe(sec);
    sec.addEventListener('pointermove', move); sec.addEventListener('pointerleave', leave);
    window.addEventListener('scroll', queue, { passive: true }); window.addEventListener('resize', queue);
    return () => { io.disconnect(); sec.removeEventListener('pointermove', move); sec.removeEventListener('pointerleave', leave); window.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); if (raf) cancelAnimationFrame(raf); };
  }, [reduce]);
  useEffect(() => { redraw.current(); }, [active]); // the quiet area follows the active step's text
  return <canvas ref={ref} className="how-spot" aria-hidden="true" />;
}
