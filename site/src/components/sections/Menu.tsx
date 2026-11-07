'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { EASE } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { APP_URL, HONESTY, menuItems } from '@/data/copy';
import { Icon } from '@/components/ui/Icon';
import { Wordmark } from '@/components/ui/Primitives';
import { CountsLine } from '@/components/ui/VerdictTile';

/**
 * Full-screen menu: slides down over 750 ms (the `menu` curve), six links (on hover or focus a link moves right and its
 * arrow appears, as on the original), tonight's counts and the next deadline as plain text. It is a modal dialog: focus moves in, Tab cycles inside, Escape or a link closes it, focus returns.
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
  return (
    <motion.div id="site-menu" ref={ref} className={`menu${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open} {...(!open ? { inert: true } : {})}
      initial={false} animate={{ y: open ? '0%' : '-101%' }} transition={reduce ? { duration: 0 } : { duration: 0.75, ease: EASE.menu }}>
      <div className="menu-top">
        <Wordmark size={20} />
        <button ref={closeRef} type="button" className="btn btn-secondary menu-close" onClick={onClose}>Close<Icon name="close" size={18} /></button>
      </div>
      <div className="menu-body">
        <nav className="menu-nav" aria-label="Sections">
          {menuItems.map((m) => (
            <a key={m.href} href={m.href} onClick={onClose} className="menu-link">{m.label}<Icon name="arrow_forward" size={36} className="menu-arrow" /></a>
          ))}
        </nav>
        <aside className="menu-card" aria-label="Tonight’s read">
          <p className="label">Tonight, {dateLabel}</p>
          <CountsLine counts={counts} />
          {nextDeadline ? <p className="menu-deadline">Next deadline: {nextDeadline.buyer} in {nextDeadline.days} days.</p> : null}
        </aside>
      </div>
      <div className="menu-foot"><span>{HONESTY}</span><a href={APP_URL} target="_blank" rel="noopener noreferrer">Try the prototype</a></div>
    </motion.div>
  );
}
