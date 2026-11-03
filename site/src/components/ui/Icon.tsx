/** Material Symbols Rounded glyph (self-hosted subset). Decorative by default; pass `label` to expose it to screen readers. */
export function Icon({ name, size = 20, fill = false, className = '', label, style }: { name: string; size?: number; fill?: boolean; className?: string; label?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`ms${fill ? ' fill' : ''}${className ? ' ' + className : ''}`}
      style={{ fontSize: size, ...(size >= 40 ? { fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" 300, "GRAD" 0, "opsz" 48` } : null), ...style }}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {name}
    </span>
  );
}
