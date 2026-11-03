'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { APP_URL, menuItems } from '@/data/copy';
import { GlowBlob } from '@/components/ui/GlowBlob';
import { Grain } from '@/components/ui/Grain';
import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import { Wordmark } from '@/components/ui/Primitives';
import { VerdictTile } from '@/components/ui/VerdictTile';

/**
 * Full-screen menu: slides down over 750 ms (the `menu` curve), six numbered links, a glass card with tonight's tiles and
 * the next deadline. It is a modal dialog: focus moves in, Tab cycles inside, Escape or a link closes it, focus returns.
 */
export function Menu({ open, onClose, counts, nextDeadline, dateLabel, returnTo }: {
  open: boolean; onClose: () => void; counts: { go: number; maybe: number; nogo: number }; nextDeadline: { buyer: string; days: number } | null; dateLabel: string;
  returnTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const root = ref.current!;
    const back = returnTo.current;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; back?.focus(); };
  }, [open, onClose, returnTo]);
  const total = counts.go + counts.maybe + counts.nogo;
  return (
    <motion.div id="site-menu" ref={ref} className={`menu${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open} {...(!open ? { inert: true } : {})}
      initial={false} animate={{ y: open ? '0%' : '-101%' }} transition={reduce ? { duration: 0 } : { duration: 0.75, ease: EASE.menu }}>
      <GlowBlob gradient="core" blur={90} opacity={0.42} className="menu-glow" />
      <Grain />
      <div className="menu-top">
        <Wordmark size={20} />
        <button ref={closeRef} type="button" className="menu-close" onClick={onClose}>Close<Icon name="close" size={18} /></button>
      </div>
      <div className="menu-body">
        <nav className="menu-nav" aria-label="Sections">
          {menuItems.map((m, i) => (
            <a key={m.href} href={m.href} onClick={onClose} className="menu-link">
              <span className="menu-n" aria-hidden="true">0{i + 1}</span>{m.label}<Icon name="arrow_forward" size={36} className="menu-arrow" />
            </a>
          ))}
        </nav>
        <aside className="menu-card" aria-label="Tonight’s read">
          <Photo src="/assets/sectors/cpv-51.jpg" sizes="340px" className="menu-photo">
            <span className="menu-photo-label">CPV 51 · INSTALLATION</span>
          </Photo>
          <div className="menu-meta"><span>TONIGHT · {dateLabel.toUpperCase()}</span><span>{total} READ</span></div>
          <div className="menu-tiles">
            <VerdictTile verdict="go" count={counts.go} variant="inline" size="sm" />
            <VerdictTile verdict="maybe" count={counts.maybe} variant="inline" size="sm" />
            <VerdictTile verdict="nogo" count={counts.nogo} variant="inline" size="sm" />
          </div>
          {nextDeadline ? <p className="menu-deadline">Next deadline: {nextDeadline.buyer} in {nextDeadline.days} days.</p> : null}
        </aside>
      </div>
      <div className="menu-foot"><span>Prototype · ESCP · fictional data</span><a href={APP_URL} target="_blank" rel="noopener noreferrer">Try the prototype ↗</a></div>
    </motion.div>
  );
}
