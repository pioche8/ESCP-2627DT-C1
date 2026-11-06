import { Icon } from './Icon';

/** "0X — NAME" section label in IBM Plex Mono. */
export function SectionLabel({ n, children, className = '' }: { n: string; children: React.ReactNode; className?: string }) {
  return <p className={`label ${className}`}>{n} — {children}</p>;
}

/** The wordmark: "TenderScout" in Hanken Grotesk 800, −.03em, with a 10 px sky dot. No logo mark. Shared with the app. */
export function Wordmark({ as: Tag = 'span', size = 20, className = '' }: { as?: 'span' | 'a' | 'h1'; size?: number; className?: string }) {
  return (
    <Tag className={`wordmark ${className}`} style={{ fontSize: size }} {...(Tag === 'a' ? { href: '#top' } : {})}>
      <span className="wordmark-dot" aria-hidden="true" />TenderScout
    </Tag>
  );
}

/** 52 px round button (carousel arrows). `tone="solid"` is the white next button. */
export function CircleButton({ icon, label, onClick, tone = 'glass', className = '' }: { icon: string; label: string; onClick?: () => void; tone?: 'glass' | 'solid'; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`circle-btn circle-btn-${tone} ${className}`}>
      <Icon name={icon} size={22} />
    </button>
  );
}

/** Segmented progress (one bar per item, lit up to the active index). */
export function ProgressBars({ count, active, light = false }: { count: number; active: number; light?: boolean }) {
  return (
    <div className="pbars" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <span key={i} className={i <= active ? (light ? 'on light' : 'on') : ''} />)}
    </div>
  );
}

/** The "Simulated AI" pill: on every element that shows what a language model would produce. */
export function SimulatedPill({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return <span className={`ai-pill ${dark ? 'ai-pill-dark' : ''} ${className}`} title="AI output is simulated in this prototype">Simulated AI</span>;
}
