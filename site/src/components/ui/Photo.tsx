import Image from 'next/image';
import { Icon } from './Icon';

/** A photo in its own block (8 px corners, no tint, no text over it). Without a source it shows the app's document placeholder. */
export function Photo({ src, alt = '', sizes, className = '', priority = false, placeholder }: {
  src: string | null; alt?: string; sizes: string; className?: string; priority?: boolean; placeholder?: { doc: string; pages: number };
}) {
  return (
    <div className={`photo ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />
      ) : (
        <div className="photo-ph" aria-hidden="true">
          <Icon name="description" size={24} />
          {placeholder ? <span>{placeholder.doc} · {placeholder.pages} p.</span> : null}
        </div>
      )}
    </div>
  );
}
