// Motion vocabulary shared with the app: curves and durations come from shared/tokens.json.
import tokens from '@/generated/tokens';

const bez = (s: string) => s.replace(/^cubic-bezier\(|\)$/g, '').split(',').map(Number) as [number, number, number, number];
export const EASE = {
  enter: bez(tokens.easing.enter),
  outCubic: bez(tokens.easing.outCubic),
  spring: bez(tokens.easing.spring),
  menu: bez(tokens.easing.menu),
  roll: bez(tokens.easing.roll),
  morph: bez(tokens.easing.morph),
  pop: bez(tokens.easing.pop),
};
export const DUR = tokens.duration;
export const sec = (ms: number) => ms / 1000;
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
