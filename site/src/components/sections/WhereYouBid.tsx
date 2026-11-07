import { MapLazy } from '@/components/map/MapLazy';

export function WhereYouBid() {
  return (
    <section id="where" className="section" aria-labelledby="where-h">
      <div className="wrap where-inner">
        <div className="sec-row">
          <div className="sec-head">
            <h2 id="where-h" className="h2">Five countries, one profile.</h2>
          </div>
          <p className="body sec-aside">Germany and Austria by default. Switch on cross-border bidding and the verdicts update.</p>
        </div>
        <MapLazy />
      </div>
    </section>
  );
}
