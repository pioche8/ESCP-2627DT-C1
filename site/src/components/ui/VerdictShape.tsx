import tokens from '@/generated/tokens';

export type VerdictKey = 'go' | 'maybe' | 'nogo' | 'check';
export const VERDICT = tokens.verdict;
/** The site's colours: the dark scheme of the shared token set. Text on a verdict fill is always `bg`. */
export const C = tokens.color.themes[tokens.color.site];

/** ● Go · ▲ Maybe · ■ No-go · ◆ Needs your check. The shape always travels with the word. Colour comes from the parent's --v. */
export function VerdictShape({ verdict, size = 8, color, className = '' }: { verdict: VerdictKey; size?: number; color?: string; className?: string }) {
  const base: React.CSSProperties = { display: 'inline-block', flex: 'none', width: size, height: size, background: color ?? 'var(--v, currentColor)' };
  const style: React.CSSProperties =
    verdict === 'go' ? { ...base, borderRadius: '50%' }
    : verdict === 'maybe' ? { ...base, width: Math.round(size * 1.1), clipPath: tokens.verdict.maybe.clip }
    : verdict === 'nogo' ? { ...base, borderRadius: 1 }
    : { ...base, width: Math.round(size * 0.85), height: Math.round(size * 0.85), transform: 'rotate(45deg)', margin: '0 1px', borderRadius: 1 };
  return <span className={`vshape vshape-${verdict} ${className}`} style={style} aria-hidden="true" />;
}
export function verdictLabel(v: VerdictKey | 'closed') { return v === 'closed' ? 'Closed' : tokens.verdict[v].label; }
