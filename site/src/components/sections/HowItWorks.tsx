'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PAGES_TOTAL, LANGUAGES, type TenderView } from '@/data/app';
import { steps } from '@/data/copy';
import { Icon } from '@/components/ui/Icon';
import { SimulatedText } from '@/components/ui/Primitives';
import { StatusLine, VerdictTile } from '@/components/ui/VerdictTile';
import tokens from '@/generated/tokens';
import { EASE, SM, easeOutCubic } from '@/lib/motion';
import { SpotGrid } from '@/components/ui/SpotGrid';
import { useRaf } from '@/lib/useRaf';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** One step's visual: crossfades and scales .92 → 1 when its step is active. */
function StepVisual({ i, active, children }: { i: number; active: number; children: React.ReactNode }) {
  const on = active === i, reduce = useReducedMotion();
  return (
    <motion.div className="how-vis" aria-hidden={!on} initial={false} animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.92 }}
      transition={reduce ? { duration: 0 } : { opacity: { duration: 0.5 }, scale: { duration: 0.6, ease: EASE.enter } }}>{children}</motion.div>
  );
}

/**
 * A sticky left column shows one idea per step (counter, tiles, quote, re-score); the right column holds the four steps.
 * The active step is the one nearest the viewport centre. Step 1's counter counts 0 → 777 over 2.8 s while its ring fills,
 * and replays when step 1 re-enters; the counter and the ring are written inside one rAF loop. Since pass 5 the original's
 * other motion is back in solid colours: a dot grid whose dots near the cursor light up (the spotlight), a surface disc
 * behind the visual that changes size and place per step (the orb, 800 ms), and four step bars lit up to the active step.
 */
export function HowItWorks({ counts, quote }: { counts: { go: number; maybe: number; nogo: number }; quote: TenderView }) {
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const stickyRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const activeRef = useRef(0);
  const progress = useRef(0);
  const reduce = useReducedMotion();
  const req = quote.tender.requirements[0];
  const hl = req.highlight ? req.src.indexOf(req.highlight) : -1;

  // Below 1024 px the visual is a sticky band at the top, so the steps centre in the space under it.
  const centreY = (vh: number) => { const s = window.innerWidth < 1024 ? (stickyRef.current?.offsetHeight ?? 0) : 0; return s + (vh - s) / 2; };
  useRaf((_, dt) => {
    const vh = window.innerHeight, cy = centreY(vh);
    let best = activeRef.current, bd = Infinity;
    stepRefs.current.forEach((el, i) => { if (!el) return; const r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - cy); if (d < bd) { bd = d; best = i; } });
    if (best !== activeRef.current) { activeRef.current = best; setActive(best); }
    const s0 = stepRefs.current[0], r0 = s0?.getBoundingClientRect(), vis0 = !!r0 && r0.top < vh && r0.bottom > 0;
    progress.current = activeRef.current === 0 && vis0 ? Math.min(1, progress.current + dt / (tokens.duration.pagesCountUp / 1000)) : 0;
    const e = easeOutCubic(progress.current);
    if (numRef.current) numRef.current.textContent = String(Math.round(PAGES_TOTAL * e));
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(SM.ring.circumference * (1 - e));
  }, !reduce && visible);
  useEffect(() => {
    if (!reduce) return; // reduced motion: final values, active step from scroll position only
    if (numRef.current) numRef.current.textContent = String(PAGES_TOTAL);
    if (ringRef.current) ringRef.current.style.strokeDashoffset = '0';
    const onScroll = () => {
      const vh = window.innerHeight, cy = centreY(vh); let best = 0, bd = Infinity;
      stepRefs.current.forEach((el, i) => { if (!el) return; const r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - cy); if (d < bd) { bd = d; best = i; } });
      setActive(best);
    };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduce]);
  return (
    <section id="how" ref={sectionRef} className="how" aria-labelledby="how-h">
      <SpotGrid />
      <div className="wrap how-head">
        <h2 id="how-h" className="h2 how-title">From {PAGES_TOTAL} pages to one answer.</h2>
        <p className="body"><a className="how-link" href="/how">Every rule, weight and threshold, derived from the decision code, and a live block to try them</a>.</p>
      </div>
      <div className="wrap how-grid">
        <div className="how-sticky-col">
          <div className="how-sticky" ref={stickyRef}>
            <div className={`how-orb orb-${active}`} aria-hidden="true" />
            <StepVisual i={0} active={active}>
              <div className="counter">
                <svg viewBox="0 0 220 220" className="ring-svg" aria-hidden="true">
                  <circle cx="110" cy="110" r="94" className="ring-track" />
                  <circle ref={ringRef} cx="110" cy="110" r="94" className="ring-fill" style={{ strokeDasharray: SM.ring.circumference, strokeDashoffset: SM.ring.circumference }} />
                </svg>
                <div className="counter-text">
                  <div ref={numRef} className="counter-num">0</div>
                  <div className="counter-sub">pages read in {LANGUAGES.length} languages</div>
                </div>
              </div>
            </StepVisual>
            <StepVisual i={1} active={active}>
              <div className="tiles-lg">
                <VerdictTile verdict="go" count={counts.go} size="lg" />
                <VerdictTile verdict="maybe" count={counts.maybe} size="lg" />
                <VerdictTile verdict="nogo" count={counts.nogo} size="lg" />
              </div>
            </StepVisual>
            <StepVisual i={2} active={active}>
              <figure className="quote">
                <figcaption className="quote-head">Original (German) · {quote.doc}, {req.cite.replace(/^[^p]*p\./, 'p.')}</figcaption>
                <blockquote lang={quote.language}>
                  „{hl >= 0 ? <>{req.src.slice(0, hl)}<mark>{req.highlight}</mark>{req.src.slice(hl + (req.highlight?.length ?? 0))}</> : req.src}“
                </blockquote>
                <div className="quote-tr"><span>{req.tr}</span><SimulatedText /></div>
              </figure>
            </StepVisual>
            <StepVisual i={3} active={active}>
              <div className="rescore-card">
                <div className="rescore-buyer">{quote.buyer}</div>
                <div className="rescore-row">
                  <StatusLine verdict="nogo" size={12} />
                  <Icon name="arrow_forward" size={22} className="rescore-arrow" />
                  <StatusLine verdict="go" size={12} />
                </div>
              </div>
            </StepVisual>
            <div className="step-bars" aria-hidden="true">{steps.map((_, i) => <span key={i} className={i <= active ? 'on' : ''} />)}</div>
          </div>
        </div>
        <ol className="how-steps">
          {steps.map((s, i) => (
            <li key={s.title} ref={(el) => { stepRefs.current[i] = el; }} className={`how-step${active === i ? ' active' : ''}`} aria-current={active === i ? 'step' : undefined}>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-body">{s.body(PAGES_TOTAL)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
