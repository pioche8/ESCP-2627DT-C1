'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoConicConformal, geoGraticule, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import world from 'world-atlas/countries-110m.json';
import { Engine, PROFILE, evaluateOne, profileWith, type TenderView } from '@/data/app';
import { VERDICT, verdictLabel } from '@/components/ui/VerdictShape';
import tokens from '@/generated/tokens';
import { useReducedMotion } from '@/lib/useReducedMotion';

const M = tokens.color.site.map;
const HOME: [number, number] = [12.37, 51.34]; // Leipzig
const HOME_IDS = ['276', '040'], CROSS_IDS = ['724', '528', '250']; // DE AT · ES NL FR (ISO 3166-1 numeric, as in world-atlas)
const PINS: { id: string; name: string; cc: string; at: [number, number]; lab: [number, number, 'start' | 'end'] }[] = [
  { id: 'ell-schools', name: 'Ellerbach', cc: 'DE', at: [11.1, 50.55], lab: [-14, 4, 'end'] },
  { id: 'hoh-security', name: 'Hohenau', cc: 'DE', at: [12.9, 48.75], lab: [14, -2, 'start'] },
  { id: 'kal-fibre', name: 'Kaltbrunn', cc: 'AT', at: [13.6, 47.35], lab: [14, 10, 'start'] },
  { id: 'vli-libraries', name: 'Vlietdam', cc: 'NL', at: [4.6, 52.05], lab: [-14, 4, 'end'] },
  { id: 'mor-support', name: 'Morlanne', cc: 'FR', at: [-0.5, 43.45], lab: [14, 4, 'start'] },
  { id: 'val-dc', name: 'Valdemora', cc: 'ES', at: [-3.9, 40.35], lab: [14, 4, 'start'] },
];
const LABELS: [string, number, number, 'h' | 'c'][] = [['DE', 9.3, 52.2, 'h'], ['AT', 16.1, 46.85, 'h'], ['NL', 5.7, 52.85, 'c'], ['FR', 2.4, 46.9, 'c'], ['ES', -5.4, 41.9, 'c']];

type Country = Feature<Geometry, Record<string, unknown>> & { id?: string | number };
function mainland(f: Country): Country {
  if (f.geometry.type !== 'MultiPolygon') return f;
  const polys = f.geometry.coordinates.filter((p) => p[0].some(([lon, lat]) => lon > -20 && lon < 45 && lat > 34)); // Europe only (no overseas territories)
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: polys } };
}
const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const WORLD: Country[] = (feature(topo, topo.objects.countries) as FeatureCollection<Geometry>).features.map((f) => mainland(f as Country));
const graticule = geoGraticule().step([5, 5])();

/**
 * "Where you bid": the five countries, Leipzig as home, curved dashed arcs to six buyer pins (one shape per verdict), a
 * cross-border toggle that re-scores Spain, the Netherlands and France with the real engine, and a tooltip per pin.
 * d3-geo projects, React renders the SVG; world-atlas (Natural Earth 110m) is bundled from npm, nothing is fetched at runtime.
 */
export function WorldMap() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cross, setCross] = useState(true);
  const [tip, setTip] = useState<string | null>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const profile = useMemo(() => profileWith({ crossBorder: cross }), [cross]);
  const pins = useMemo(() => PINS.map((p) => ({ ...p, v: evaluateOne(p.id, profile) })), [profile]);
  const n = useMemo(() => { const c = { go: 0, maybe: 0, nogo: 0 }; pins.forEach((p) => { if (p.v.verdict !== 'closed') c[p.v.verdict]++; }); return c; }, [pins]);

  const { w, h } = size, wide = w > 640;
  const geo = useMemo(() => {
    if (!w || !h) return null;
    const proj = geoConicConformal().parallels([40, 56]).rotate([-6, 0]);
    const focus = WORLD.filter((f) => HOME_IDS.includes(String(f.id)) || CROSS_IDS.includes(String(f.id)));
    proj.fitExtent([[wide ? 300 : 24, wide ? 36 : 230], [w - (wide ? 36 : 64), h - 30]], { type: 'FeatureCollection', features: focus });
    const path = geoPath(proj);
    return { proj, path, home: proj(HOME)! };
  }, [w, h, wide]);
  const isOn = (f: Country) => HOME_IDS.includes(String(f.id)) || (cross && CROSS_IDS.includes(String(f.id)));
  const tipPin = pins.find((p) => p.id === tip);
  const tipXY = tipPin && geo ? geo.proj(tipPin.at)! : null;

  return (
    <div ref={box} className="map" aria-label="Map of where you bid">
      {geo && (
        <svg className="map-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Map of Germany, Austria, Spain, the Netherlands and France with ${pins.length} tenders: ${n.go} Go, ${n.maybe} Maybe, ${n.nogo} No-go.`}>
          <defs>
            <radialGradient id="map-glow"><stop offset="0%" stopColor={tokens.color.site.sea} stopOpacity=".35" /><stop offset="100%" stopColor={tokens.color.site.sea} stopOpacity="0" /></radialGradient>
          </defs>
          <circle cx={geo.home[0]} cy={geo.home[1]} r={Math.min(w, h) * 0.55} fill="url(#map-glow)" />
          <path d={geo.path(graticule) ?? undefined} fill="none" stroke={M.graticule} strokeWidth={1} />
          <g>
            {WORLD.map((f, i) => (
              <path key={i} d={geo.path(f) ?? undefined}
                fill={HOME_IDS.includes(String(f.id)) ? M.home : isOn(f) ? M.cross : CROSS_IDS.includes(String(f.id)) ? M.crossOff : M.land}
                stroke={isOn(f) ? M.onStroke : M.landStroke} strokeWidth={isOn(f) ? 1 : 0.6} strokeLinejoin="round" />
            ))}
          </g>
          <g aria-hidden="true">
            {LABELS.map(([cc, lon, lat, kind]) => { const [x, y] = geo.proj([lon, lat])!; return <text key={cc} x={x} y={y} textAnchor="middle" fill={kind === 'h' || cross ? M.label : M.labelOff} className="map-cc">{cc}</text>; })}
          </g>
          <g aria-hidden="true">
            {pins.map((p) => {
              const [x, y] = geo.proj(p.at)!, [hx, hy] = geo.home, dx = x - hx, dy = y - hy, d = Math.hypot(dx, dy) || 1;
              const cx = (hx + x) / 2 + (dy / d) * d * 0.2, cy = (hy + y) / 2 - (dx / d) * d * 0.2;
              return <path key={p.id} className={reduce ? undefined : 'arc'} d={`M${hx},${hy} Q${cx},${cy} ${x},${y}`} fill="none" stroke={p.v.verdict === 'nogo' ? M.arcNogo : M.arcGo} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="1 6" />;
            })}
          </g>
          <g transform={`translate(${geo.home[0]},${geo.home[1]})`} aria-hidden="true">
            {!reduce && <circle className="pulse" r={6} fill={tokens.color.site.sky} />}
            <circle r={7} fill={tokens.color.site.sky} stroke={M.bg} strokeWidth={3} />
            <text x={13} y={-10} fill={tokens.color.site.skyLight} stroke={M.bg} strokeWidth={4} paintOrder="stroke" className="map-home-label">You · Leipzig</text>
          </g>
          {pins.map((p) => {
            const [x, y] = geo.proj(p.at)!, v = p.v.verdict === 'closed' ? 'nogo' : p.v.verdict, col = VERDICT[v], [lx, ly, anchor] = p.lab;
            return (
              <g key={p.id} className="pin" transform={`translate(${x},${y})`} tabIndex={0} role="button"
                aria-label={`${p.name} ${verdictLabel(p.v.verdict)} · ${p.v.score}. ${p.v.title}, ${p.v.buyer} (${p.cc}). ${p.v.why}`}
                onMouseEnter={() => setTip(p.id)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(p.id)} onBlur={() => setTip(null)}>
                <circle r={20} fill="transparent" />
                <g className="pin-shape" fill={'solidSmall' in col ? col.solidSmall : col.solid} stroke={M.bg} strokeWidth={2.5}>
                  {v === 'go' ? <circle r={8} /> : v === 'maybe' ? <path d="M0,-9.5 L9.5,7 L-9.5,7Z" /> : <rect x={-7} y={-7} width={14} height={14} rx={1.5} />}
                </g>
                <text x={lx} y={ly - 6} textAnchor={anchor} stroke={M.bg} strokeWidth={4} paintOrder="stroke" aria-hidden="true">
                  <tspan fill={tokens.color.site.textSoft} className="map-pin-name">{p.name}</tspan>{' '}
                  <tspan x={lx} dy={14} fill={col.onDark} className="map-pin-v">{verdictLabel(p.v.verdict)} · {p.v.score}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <div className="map-panel">
        <div><div className="map-title">Where you bid</div><div className="map-home">HOME · LEIPZIG, DE</div></div>
        <button type="button" role="switch" aria-checked={cross} className="map-row" onClick={() => setCross((v) => !v)}>
          <span>Bid outside {PROFILE.countries.map(Engine.countryName).join(' and ')}</span>
          <span className={`sw${cross ? ' on' : ''}`} aria-hidden="true"><i className="sw-knob" /></span>
        </button>
        <div className="map-counts" aria-live="polite">
          {(['go', 'maybe', 'nogo'] as const).map((k) => (
            <div key={k} style={{ flex: Math.max(n[k], 0.6), background: VERDICT[k].solid, color: VERDICT[k].on }}><b>{n[k]}</b>{VERDICT[k].label}</div>
          ))}
        </div>
      </div>
      {tipPin && tipXY && (
        <div className="map-tip on" role="tooltip" style={{ left: Math.min(Math.max(tipXY[0], 125), w - 125), top: tipXY[1] }}>
          <div className="tip-b">{tipPin.v.title}</div>
          <div className="tip-s"><span className={`flag flag-${tipPin.cc}`} aria-hidden="true" />{tipPin.v.buyer}</div>
          <div className="tip-v"><em style={{ background: VERDICT[tipPin.v.verdict === 'closed' ? 'nogo' : tipPin.v.verdict].solid, color: VERDICT[tipPin.v.verdict === 'closed' ? 'nogo' : tipPin.v.verdict].on }}>{verdictLabel(tipPin.v.verdict)} · {tipPin.v.score}</em>{tipPin.v.why}</div>
        </div>
      )}
      <div className="map-credit">Natural Earth · world-atlas</div>
    </div>
  );
}
export type { TenderView };
