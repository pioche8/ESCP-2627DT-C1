import type { Sector } from '@/data/sectors';
import { Icon } from './Icon';
import { Photo } from './Photo';

/** 280 × 410 folder card: sector photo on the top 66 %, a white panel with a folder tab that slides up on hover. */
export function SectorFolderCard({ s }: { s: Sector }) {
  return (
    <article className="folder" aria-label={`CPV ${s.code} ${s.name}: ${s.open} open tenders this week (illustrative)${s.own ? ', your sector' : ''}`} tabIndex={0}>
      <Photo src={s.img} sizes="280px" className="folder-photo" />
      {s.own ? <span className="folder-own"><span className="dot" aria-hidden="true" />Your sector</span> : null}
      <div className="folder-panel">
        <div className="folder-tab" aria-hidden="true" />
        <div className="folder-inner">
          <div className="folder-top"><span className="folder-code">{s.code}</span><Icon name="north_east" size={22} /></div>
          <h3 className="folder-name">{s.name}</h3>
          <p className="folder-open">{s.open} open tenders this week</p>
        </div>
      </div>
    </article>
  );
}
