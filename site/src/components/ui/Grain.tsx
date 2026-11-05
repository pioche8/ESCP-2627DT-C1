/** SVG feTurbulence grain overlay (fractalNoise, baseFrequency .9, 2 octaves), opacity .18, mix-blend overlay. */
export function Grain({ opacity, className = '' }: { opacity?: number; className?: string }) {
  return <div aria-hidden="true" className={`grain ${className}`} style={opacity != null ? { opacity } : undefined} />;
}
