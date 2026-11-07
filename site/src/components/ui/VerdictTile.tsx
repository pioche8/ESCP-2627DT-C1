import { VERDICT, VerdictShape, type VerdictKey } from './VerdictShape';

/**
 * The verdict tile shared by the site and the app: solid verdict colour, the shape in the corner, a count and the label.
 * Width is proportional to the count (flex: count), so 1 : 2 : 3 reads at a glance.
 */
export function VerdictTile({ verdict, count, flex = count, size = 'sm', className = '' }: {
  verdict: Exclude<VerdictKey, 'check'>; count: number; flex?: number; size?: 'sm' | 'lg'; className?: string;
}) {
  const v = VERDICT[verdict];
  return (
    <div className={`vtile vtile-${size} v-${verdict} ${className}`} style={{ flex: `${Math.max(flex, 0.6)} 1 0` }} role="group" aria-label={`${count} ${v.label}`}>
      <VerdictShape verdict={verdict} size={size === 'lg' ? 16 : 8} />
      <div>
        <div className="vtile-count" aria-hidden="true">{count}</div>
        <div className="vtile-label" aria-hidden="true">{v.label}</div>
      </div>
    </div>
  );
}

/** The square score tile (48 px on cards, smaller in the phone). */
export function ScoreTile({ verdict, score, size = 48, fontSize = 20, className = '' }: {
  verdict: Exclude<VerdictKey, 'check'>; score: number | string; size?: number; fontSize?: number; className?: string;
}) {
  return <div className={`score-tile v-${verdict} ${className}`} style={{ width: size, height: size, fontSize }} aria-hidden="true">{score}</div>;
}

/** "● Go": shape + word in the verdict's colour, then (optionally) the reason in muted ink. */
export function StatusLine({ verdict, why, size = 8, className = '', label }: { verdict: VerdictKey; why?: string; size?: number; className?: string; label?: string }) {
  const v = VERDICT[verdict];
  return (
    <div className={`status-line v-${verdict} ${className}`}>
      <VerdictShape verdict={verdict} size={size} />
      <b>{label ?? v.label}</b>
      {why ? <span className="status-why">· {why}</span> : null}
    </div>
  );
}

/** "1 Go · 2 Maybe · 3 No-go" as plain text, each count in its verdict colour. */
export function CountsLine({ counts, className = '' }: { counts: { go: number; maybe: number; nogo: number }; className?: string }) {
  return (
    <p className={`counts ${className}`} aria-label={`${counts.go} Go, ${counts.maybe} Maybe, ${counts.nogo} No-go`}>
      {(['go', 'maybe', 'nogo'] as const).map((k) => (
        <span key={k} className={`v-${k}`} aria-hidden="true"><VerdictShape verdict={k} size={8} /><b>{counts[k]}</b>{VERDICT[k].label}</span>
      ))}
    </p>
  );
}
