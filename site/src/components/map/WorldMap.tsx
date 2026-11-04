'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoConicConformal, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import world from 'world-atlas/countries-110m.json';
import { Engine, PROFILE, evaluateOne, profileWith } from '@/data/app';
import { C, VERDICT } from '@/components/ui/VerdictShape';

const HOME_IDS = ['276', '040'], CROSS_IDS = ['724', '528', '250']; // DE AT · ES NL FR (ISO 3166-1 numeric)
const TENDER_IDS = ['ell-schools', 'hoh-security', 'kal-fibre', 'vli-libraries', 'mor-support', 'val-dc'];
const LABELS: [string, number, number][] = [['DE', 9.3, 52.2], ['AT', 16.1, 46.85], ['NL', 5.7, 52.85], ['FR', 2.4, 46.9], ['ES', -5.4, 41.9]];

type Country = Feature<Geometry, Record<string, unknown>> & { id?: string | number };
function mainland(f: Country): Country {
  if (f.geometry.type !== 'MultiPolygon') return f;
  const polys = f.geometry.coordinates.filter((p) => p[0].some(([lon, lat]) => lon > -20 && lon < 45 && lat > 34)); // Europe only (no overseas territories)
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: polys } };
}
const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const WORLD: Country[] = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry>).features.map((f) => mainland(f as Country));

/**
 * "Where you bid": filled countries (the five in the profile in brand, the rest in surface) and five labels. Under the
 * map, the cross-border switch re-scores the six tenders with the real decision rules and the counts update.
 */
export function WorldMap() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cross, setCross] = useState(true);
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const profile = useMemo(() => profileWith({ crossBorder: cross }), [cross]);
  const n = useMemo(() => {
    const c = { go: 0, maybe: 0, nogo: 0 };
    TENDER_IDS.forEach((id) => { const v = evaluateOne(id, profile).verdict; if (v !== 'closed') c[v]++; });
    return c;
  }, [profile]);

  const { w, h } = size;
  const geo = useMemo(() => {
    if (!w || !h) return null;
    const proj = geoConicConformal().parallels([40, 56]).rotate([-6, 0]);
    const focus = WORLD.filter((f) => HOME_IDS.includes(String(f.id)) || CROSS_IDS.includes(String(f.id)));
    proj.fitExtent([[32, 32], [w - 32, h - 32]], { type: 'FeatureCollection', features: focus });
    return { proj, path: geoPath(proj) };
  }, [w, h]);
  const isOn = (f: Country) => HOME_IDS.includes(String(f.id)) || (cross && CROSS_IDS.includes(String(f.id)));
  const summary = `${TENDER_IDS.length} tenders: ${n.go} Go, ${n.maybe} Maybe, ${n.nogo} No-go`;

  return (
    <>
      <div className="map-frame">
        <div ref={box} className="map" aria-label="Map of where you bid">
          {geo && (
            <svg className="map-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Map of Germany, Austria, Spain, the Netherlands and France. ${cross ? 'All five' : 'Germany and Austria'} in your profile.`}>
              <g>
                {WORLD.map((f, i) => (
                  <path key={i} d={geo.path(f) ?? undefined} fill={isOn(f) ? C.brand : C.bg} stroke={C.surface} strokeWidth={1} strokeLinejoin="round" />
                ))}
              </g>
              <g aria-hidden="true">
                {LABELS.map(([cc, lon, lat]) => {
                  const [x, y] = geo.proj([lon, lat])!, on = HOME_IDS.includes(cc === 'DE' ? '276' : '040') || cross;
                  return <text key={cc} x={x} y={y} textAnchor="middle" fill={on ? C.bg : C.muted} className="map-cc">{cc}</text>;
                })}
              </g>
            </svg>
          )}
        </div>
      </div>
      <div className="map-panel">
        <button type="button" role="switch" aria-checked={cross} className="map-row" onClick={() => setCross((v) => !v)}>
          <span className={`sw${cross ? ' on' : ''}`} aria-hidden="true"><i className="sw-knob" /></span>
          <span>Bid outside {PROFILE.countries.map(Engine.countryName).join(' and ')}</span>
        </button>
        <p className="map-counts" aria-live="polite">
          {summary.split(': ')[0]}: {(['go', 'maybe', 'nogo'] as const).map((k, i) => (
            <span key={k}><span style={{ color: C[k], fontWeight: 800 }}>{n[k]} {VERDICT[k].label}</span>{i < 2 ? ', ' : ''}</span>
          ))}
        </p>
      </div>
    </>
  );
}
