import { VERDICT, VerdictShape, type VerdictKey } from './VerdictShape';

/**
 * The verdict tile shared by the site and the app: solid verdict colour, the shape in the corner, a count and the label.
 * Width is proportional to the count (flex: count), so 1 : 2 : 3 reads at a glance. Variants: 'stack' puts the label under the
 * number (phone Feed, How-it-works), 'inline' puts it beside (menu card).
 */
export function VerdictTile({ verdict, count, flex = count, variant = 'stack', size = 'md', className = '' }: {
  verdict: Exclude<VerdictKey, 'check'>; count: number; flex?: number; variant?: 'stack' | 'inline'; size?: 'sm' | 'md' | 'lg'; className?: string;
}) {
  const v = VERDICT[verdict];
  return (
    <div
      className={`vtile vtile-${size} vtile-${variant} ${className}`}
      style={{ flex: `${Math.max(flex, 0.6)} 1 0`, background: v.solid, color: v.on }}
      role="group"
      aria-label={`${count} ${v.label}`}
    >
      <VerdictShape verdict={verdict} size={size === 'lg' ? 16 : size === 'md' ? 9 : 8} color={v.on} />
      <div className="vtile-num">
        <span className="vtile-count" aria-hidden="true">{count}</span>
        <span className="vtile-label" aria-hidden="true">{v.label}</span>
      </div>
    </div>
  );
}

/** The square score tile (56 px on cards, smaller in the phone). */
export function ScoreTile({ verdict, score, size = 56, radius = 17, fontSize = 21, className = '', ring }: {
  verdict: Exclude<VerdictKey, 'check'>; score: number | string; size?: number; radius?: number; fontSize?: number; className?: string; ring?: string;
}) {
  const v = VERDICT[verdict];
  return (
    <div className={`score-tile ${className}`} style={{ width: size, height: size, borderRadius: radius, background: v.solid, color: v.on, fontSize, boxShadow: ring ? `0 0 0 4px ${ring}` : undefined }} aria-hidden="true">
      {score}
    </div>
  );
}

/** "● Go · Meets all 4 requirements": shape + label in the verdict's text colour, then the reason in grey. */
export function StatusLine({ verdict, why, size = 8, className = '', label }: { verdict: Exclude<VerdictKey, 'check'> | 'check'; why?: string; size?: number; className?: string; label?: string }) {
  const v = VERDICT[verdict];
  return (
    <div className={`status-line ${className}`} style={{ color: v.onDark }}>
      <VerdictShape verdict={verdict} size={size} />
      <b>{label ?? v.label}</b>
      {why ? <span className="status-why">· {why}</span> : null}
    </div>
  );
}
