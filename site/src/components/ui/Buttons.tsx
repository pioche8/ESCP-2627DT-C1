/** Plain rectangular button or link: brand (primary) or surface (secondary), one 8 px radius. */
export function Button({ href, children, tone = 'primary', size = 'md', className = '', external = false, dim = false, onClick, ariaLabel }: {
  href?: string; children: React.ReactNode; tone?: 'primary' | 'secondary'; size?: 'md' | 'lg'; className?: string; external?: boolean; dim?: boolean; onClick?: () => void; ariaLabel?: string;
}) {
  const cls = `btn btn-${tone}${size === 'lg' ? ' btn-lg' : ''}${dim ? ' is-dim' : ''} ${className}`;
  if (href) {
    return <a href={href} className={cls} aria-label={ariaLabel} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
  }
  return <button type="button" onClick={onClick} className={cls} aria-label={ariaLabel}>{children}</button>;
}
