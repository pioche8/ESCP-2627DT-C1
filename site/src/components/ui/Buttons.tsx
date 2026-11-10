'use client';
import { useRef } from 'react';
import { withBase } from '@/lib/site';

/**
 * Plain rectangular button or link: brand (primary) or surface (secondary), one 8 px radius. Since pass 5 each carries
 * one of the original 3 Nov fills, in solid colours and clipped to the button (no gradient, no rounded blob):
 *   fill="wave"    the primary links (header, film, Start): an ink ellipse rises from below on hover / focus (700 ms)
 *   fill="wipe"    the phone's Skip: a brand fill wipes in from the left and out to the right (450 ms)
 *   fill="radial"  the phone's Save to Bids: an ink circle grows from the pointer (550 ms)
 * The label sits above the fill and switches to the ground colour. Instant under reduced motion (the global rule).
 */
export function Button({ href, children, tone = 'primary', size = 'md', className = '', external = false, dim = false, onClick, ariaLabel, fill }: {
  href?: string; children: React.ReactNode; tone?: 'primary' | 'secondary'; size?: 'md' | 'lg'; className?: string; external?: boolean; dim?: boolean; onClick?: () => void; ariaLabel?: string; fill?: 'wave' | 'wipe' | 'radial' | 'none';
}) {
  const ref = useRef<HTMLElement>(null);
  const kind = fill ?? (tone === 'primary' && href ? 'wave' : 'none');
  const cls = `btn btn-${tone}${size === 'lg' ? ' btn-lg' : ''}${dim ? ' is-dim' : ''}${kind !== 'none' ? ' fx fx-' + kind : ''} ${className}`;
  const move = (e: React.PointerEvent) => {
    if (kind !== 'radial') return;
    const el = e.currentTarget as HTMLElement, r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
  };
  const inner = kind === 'none' ? children : <><span className="fx-fill" aria-hidden="true" /><span className="fx-label">{children}</span></>;
  if (href) {
    return <a ref={ref as React.RefObject<HTMLAnchorElement>} href={withBase(href)} className={cls} aria-label={ariaLabel} onPointerMove={move} onPointerEnter={move} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inner}</a>;
  }
  return <button ref={ref as React.RefObject<HTMLButtonElement>} type="button" onClick={onClick} className={cls} aria-label={ariaLabel} onPointerMove={move} onPointerEnter={move} onPointerDown={move}>{inner}</button>;
}
