'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoArea, geoConicConformal, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';
import world from 'world-atlas/countries-110m.json';
import { COUNTRIES, Engine, PROFILE, counts, evaluateAll, profileWith } from '@/data/app';
import { C, VERDICT } from '@/components/ui/VerdictShape';

// The countries come from data.js: home = the profile's countries (DE, AT), abroad = the other countries the tenders are
// in (ES, NL, FR). ISO 3166-1 numeric ids are the world atlas's keys; the table covers every country engine.js names.
const ISO_NUM: Record<string, string> = { DE: '276', AT: '040', ES: '724', NL: '528', FR: '250', IT: '380', PL: '616', BE: '056' };
const HOME = PROFILE.countries;
const ABROAD = COUNTRIES.filter((c) => !HOME.includes(c));
const SHOWN = [...HOME, ...ABROAD].filter((c) => ISO_NUM[c]);
const CODE_BY_ID = new Map(SHOWN.map((c) => [ISO_NUM[c], c] as const));

type Country = Feature<Geometry, Record<string, unknown>> & { id?: string | number };
function mainland(f: Country): Country {
  if (f.geometry.type !== 'MultiPolygon') return f;
  const polys = f.geometry.coordinates.filter((p) => p[0].some(([lon, lat]) => lon > -20 && lon < 45 && lat > 34)); // Europe only (no overseas territories)
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: polys } };
}
/** The country's largest polygon, so a label sits on the mainland (not between France and Corsica). No variable here is
 *  called `ring`: Tailwind reads that word in any source file as its box-shadow class and adds it to the site's CSS. */
function largest(f: Country): Feature<Polygon> {
  const g = f.geometry;
  const parts = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  const polys = parts.map((coordinates): Feature<Polygon> => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates } }));
  return polys.reduce((a, b) => (geoArea(b) > geoArea(a) ? b : a));
}
const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const WORLD: Country[] = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry>).features.map((f) => mainland(f as Country));
const FOCUS = WORLD.filter((f) => CODE_BY_ID.has(String(f.id)));
const LABEL_AT = FOCUS.map((f) => ({ cc: CODE_BY_ID.get(String(f.id))!, poly: largest(f) }));

/** Where the horizontal line through (x, y) enters and leaves the projected polygon around x. */
const LABEL_W = 28; // two capitals at 13 px bold plus 4 px each side
function spanAt(proj: GeoProjection, poly: Feature<Polygon>, x: number, y: number): [number, number] {
  let left = -Infinity, right = Infinity;
  for (const loop of poly.geometry.coordinates) {
    const pts = loop.map((p) => proj(p as [number, number]) ?? [x, y]);
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      if ((ay <= y) === (by <= y)) continue;
      const cx = ax + ((y - ay) * (bx - ax)) / (by - ay);
      if (cx <= x) left = Math.max(left, cx); else right = Math.min(right, cx);
    }
  }
  return [left, right];
}
const names = (cs: string[]) => { const n = cs.map(Engine.countryName); return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; };

/**
 * "Where you bid": filled countries (where you bid in brand, the rest in bg) with a code on each of the five. Under the
 * map, the cross-border switch re-scores the tenders with the real decision rules and the counts update.
 */
export function WorldMap() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cross, setCross] = useState(PROFILE.crossBorder);
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const views = useMemo(() => evaluateAll(profileWith({ crossBorder: cross })).filter((v) => v.verdict !== 'closed'), [cross]);
  const n = counts(views);

  const { w, h } = size;
  const geo = useMemo(() => {
    if (!w || !h) return null;
    const pad = w < 600 ? 20 : 32;
    const proj = geoConicConformal().parallels([40, 56]).rotate([-6, 0]);
    proj.fitExtent([[pad, pad], [w - pad, h - pad]], { type: 'FeatureCollection', features: FOCUS });
    const path = geoPath(proj);
    // A code goes on its country; where the country is narrower than the code at that height (the Netherlands on a
    // phone) it goes just west of it, on the sea, in a text colour instead of the fill's.
    const labels = LABEL_AT.map(({ cc, poly }) => {
      const [x, y] = path.centroid(poly), [left, right] = spanAt(proj, poly, x, y);
      return right - left < LABEL_W ? { cc, x: left - 4, y, inside: false } : { cc, x, y, inside: true };
    });
    return { path, labels };
  }, [w, h]);
  const bids = (cc: string | undefined) => !!cc && (HOME.includes(cc) || (cross && ABROAD.includes(cc)));
  const where = cross ? SHOWN : HOME;

  return (
    <>
      <div className="map-frame">
        <div ref={box} className="map">
          {geo && (
            <svg className="map-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Map: you bid in ${names(where)}.`}>
              <g>
                {WORLD.map((f, i) => (
                  <path key={i} d={geo.path(f) ?? undefined} fill={bids(CODE_BY_ID.get(String(f.id))) ? C.brand : C.bg} stroke={C.surface} strokeWidth={1} strokeLinejoin="round" />
                ))}
              </g>
              <g aria-hidden="true">
                {geo.labels.map(({ cc, x, y, inside }) => (
                  <text key={cc} x={x} y={y} textAnchor={inside ? 'middle' : 'end'} dominantBaseline="central" fill={bids(cc) ? (inside ? C.bg : C.ink) : C.muted} className="map-cc">{cc}</text>
                ))}
              </g>
            </svg>
          )}
        </div>
      </div>
      <div className="map-panel">
        <button type="button" role="switch" aria-checked={cross} className="map-row" onClick={() => setCross((v) => !v)}>
          <span className={`sw${cross ? ' on' : ''}`} aria-hidden="true"><i className="sw-knob" /></span>
          <span>Bid outside {names(HOME)}</span>
        </button>
        <p className="map-counts" aria-live="polite">
          {views.length} tenders: {(['go', 'maybe', 'nogo'] as const).map((k, i) => (
            <span key={k}><span style={{ color: C[k], fontWeight: 800 }}>{n[k]} {VERDICT[k].label}</span>{i < 2 ? ', ' : ''}</span>
          ))}
        </p>
      </div>
    </>
  );
}
