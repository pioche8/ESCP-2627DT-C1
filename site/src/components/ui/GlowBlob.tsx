import tokens from '@/generated/tokens';

type Gradient = keyof Omit<typeof tokens.glow, 'blur' | 'opacity' | 'orbs' | 'heroWordmark' | 'app'>; // glow.app = the app's per-screen blobs
/** The signature glow: a blurred radial blob over the dark ground. Positioned by the caller through `className`/`style`. */
export function GlowBlob({ gradient = 'core', blur = 80, opacity = 0.45, drift, className = '', style }: {
  gradient?: Gradient; blur?: number; opacity?: number; drift?: 'd1' | 'd2' | 'd3'; className?: string; style?: React.CSSProperties;
}) {
  const driftDur = { d1: tokens.duration.drift[0], d2: tokens.duration.drift[1], d3: tokens.duration.drift[2] };
  return (
    <div
      aria-hidden="true"
      className={`glow ${className}`}
      style={{ background: tokens.glow[gradient], filter: `blur(${blur}px)`, opacity, animation: drift ? `ts-${drift} ${driftDur[drift]} ease-in-out infinite` : undefined, ...style }}
    />
  );
}
