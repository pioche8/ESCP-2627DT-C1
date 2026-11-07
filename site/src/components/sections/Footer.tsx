import { footer } from '@/data/copy';
import { Wordmark } from '@/components/ui/Primitives';

export function Footer() {
  const col = (title: string, links: readonly (readonly [string, string])[]) => (
    <div className="foot-col">
      <span className="foot-col-title">{title}</span>
      {links.map(([label, href]) => <a key={label} href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>)}
    </div>
  );
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <Wordmark size={20} />
          <p className="footer-blurb">{footer.blurb}</p>
        </div>
        <nav className="foot-cols" aria-label="Footer">
          {col('Product', footer.product)}
          {col('Project', footer.project)}
        </nav>
      </div>
    </footer>
  );
}
