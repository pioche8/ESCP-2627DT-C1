import { Icon } from './Icon';

/** The wordmark: "TenderScout" in Hanken Grotesk 800 with a 10 px brand dot. No logo mark. Shared with the app. */
export function Wordmark({ as: Tag = 'span', size = 20, className = '' }: { as?: 'span' | 'a' | 'h1'; size?: number; className?: string }) {
  return (
    <Tag className={`wordmark ${className}`} style={{ fontSize: size }} {...(Tag === 'a' ? { href: '#top' } : {})}>
      <span className="wordmark-dot" aria-hidden="true" />TenderScout
    </Tag>
  );
}

/** 44 px square icon button (carousel arrows). */
export function SquareButton({ icon, label, onClick, className = '' }: { icon: string; label: string; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`sq-btn ${className}`}>
      <Icon name={icon} size={22} />
    </button>
  );
}

/** Segmented progress (one bar per item, lit up to the active index). */
export function ProgressBars({ count, active }: { count: number; active: number }) {
  return (
    <div className="pbars" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <span key={i} className={i <= active ? 'on' : ''} />)}
    </div>
  );
}

/** "Simulated AI": plain text on every element that shows what a language model would produce. */
export function SimulatedText({ className = '' }: { className?: string }) {
  return <span className={`ai ${className}`} title="AI output is simulated in this prototype">Simulated AI</span>;
}
