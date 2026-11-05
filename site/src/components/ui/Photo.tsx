import Image from 'next/image';
import { Icon } from './Icon';

/** A photo with the handoff's treatment: saturate(1.05) plus a very light soft-light blue tint. Without a source it shows the app's document placeholder. */
export function Photo({ src, alt = '', sizes, className = '', priority = false, placeholder, children }: {
  src: string | null; alt?: string; sizes: string; className?: string; priority?: boolean; placeholder?: { doc: string; pages: number }; children?: React.ReactNode;
}) {
  return (
    <div className={`photo ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover', filter: 'var(--img-filter)' }} />
      ) : (
        <div className="photo-ph" aria-hidden="true">
          <Icon name="description" size={24} />
          {placeholder ? <span>{placeholder.doc} · {placeholder.pages} p.</span> : null}
        </div>
      )}
      <div className="photo-tint" aria-hidden="true" />
      {children}
    </div>
  );
}
