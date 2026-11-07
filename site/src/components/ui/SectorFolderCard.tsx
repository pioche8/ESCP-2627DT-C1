import type { Sector } from '@/data/sectors';
import { Photo } from './Photo';

/**
 * 260 px sector card: the photo, and under it a solid panel with code, name and the weekly count (illustrative). The
 * original's fold is back (pass 5): on hover or focus the panel slides down from 47 % to 58 % over 500 ms and shows more
 * of the photo; the text always sits on the panel, never on the photo.
 */
export function SectorFolderCard({ s }: { s: Sector }) {
  return (
    <article className="folder" aria-label={`CPV ${s.code} ${s.name}: ${s.open} open tenders this week (illustrative)${s.own ? ', your sector' : ''}`} tabIndex={0}>
      <Photo src={s.img} sizes="260px" className="folder-photo" />
      <div className="folder-panel">
        <div className="folder-code"><span>CPV {s.code}</span>{s.own ? <span className="folder-own">Your sector</span> : null}</div>
        <h3 className="folder-name">{s.name}</h3>
        <p className="folder-open">{s.open} open this week</p>
      </div>
    </article>
  );
}
