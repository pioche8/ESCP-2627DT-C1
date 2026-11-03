'use client';
import { useRef } from 'react';
import { Icon } from './Icon';

/** White pill; on hover a sky ellipse rises from below over .7 s (header CTA, "Watch the film"). */
export function WaveButton({ href, children, icon = 'north_east', size = 'md', className = '', external = false }: {
  href: string; children: React.ReactNode; icon?: string; size?: 'md' | 'lg'; className?: string; external?: boolean;
}) {
  return (
    <a href={href} className={`wave-btn wave-btn-${size} ${className}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span className="wave" aria-hidden="true" />
      <span className="wave-label">{children}</span>
      <Icon name={icon} size={size === 'lg' ? 20 : 18} fill={icon === 'play_arrow'} />
    </a>
  );
}

/** Dark pill with a chrome gradient border and a slowly rotating conic ring around the arrow (Start section). */
export function LiquidMetalButton({ href, children, dim = false, external = false }: { href: string; children: React.ReactNode; dim?: boolean; external?: boolean }) {
  return (
    <a href={href} className={`metal-btn${dim ? ' is-dim' : ''}`} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      <span className="metal-ring" aria-hidden="true">
        <span className="metal-spin" />
        <span className="metal-core" />
        <Icon name="arrow_forward" size={20} className="metal-icon" />
      </span>
      {children}
    </a>
  );
}

/** A sapphire disc grows from the cursor position on hover (phone demo "Save to Bids"). */
export function RadialFillButton({ children, onClick, className = '', ariaLabel }: { children: React.ReactNode; onClick?: () => void; className?: string; ariaLabel?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const move = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  };
  return (
    <button ref={ref} type="button" onMouseMove={move} onMouseEnter={move} onClick={onClick} className={`radial-btn ${className}`} aria-label={ariaLabel}>
      <span className="radial-fill" aria-hidden="true" />
      {children}
    </button>
  );
}

/** White wipe from the left on hover, sliding out to the right on leave (phone demo "Skip"). */
export function WipeButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`wipe-btn ${className}`}>
      <span className="wipe-fill" aria-hidden="true" />
      {children}
    </button>
  );
}
