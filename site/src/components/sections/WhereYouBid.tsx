import { SectionLabel } from '@/components/ui/Primitives';
import { MapLazy } from '@/components/map/MapLazy';

export function WhereYouBid() {
  return (
    <section id="where" className="where" aria-labelledby="where-h">
      <div className="wrap where-inner">
        <div className="sec-row">
          <div className="sec-head">
            <SectionLabel n="07">WHERE YOU BID</SectionLabel>
            <h2 id="where-h" className="h2">Five countries, one profile.</h2>
          </div>
          <p className="body sec-aside">Germany and Austria by default. Switch on cross-border bidding and every verdict on the map updates.</p>
        </div>
        <div className="map-frame"><MapLazy /></div>
      </div>
    </section>
  );
}
