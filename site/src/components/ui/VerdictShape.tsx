import tokens from '@/generated/tokens';

export type VerdictKey = 'go' | 'maybe' | 'nogo' | 'check';
export const VERDICT = tokens.verdict;

/** ● Go · ▲ Maybe · ■ No-go · ◆ Needs your check. Shape and label always travel with the colour. */
export function VerdictShape({ verdict, size = 8, color = 'currentColor', className = '' }: { verdict: VerdictKey; size?: number; color?: string; className?: string }) {
  const base: React.CSSProperties = { display: 'inline-block', flex: 'none', width: size, height: size, background: color };
  const style: React.CSSProperties =
    verdict === 'go' ? { ...base, borderRadius: '50%' }
    : verdict === 'maybe' ? { ...base, width: Math.round(size * 1.1), clipPath: tokens.verdict.maybe.clip }
    : verdict === 'nogo' ? { ...base, borderRadius: 1 }
    : { ...base, width: Math.round(size * 0.85), height: Math.round(size * 0.85), transform: 'rotate(45deg)', margin: '0 1px', borderRadius: 1 };
  return <span className={`vshape vshape-${verdict} ${className}`} style={style} aria-hidden="true" />;
}
export function verdictLabel(v: VerdictKey | 'closed') { return v === 'closed' ? 'Closed' : tokens.verdict[v].label; }
