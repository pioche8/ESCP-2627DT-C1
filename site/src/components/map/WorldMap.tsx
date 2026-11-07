'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { geoArea, geoConicConformal, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';
import world from 'world-atlas/countries-110m.json';
import { COUNTRIES, Engine, PROFILE, counts, evaluateOne, profileWith } from '@/data/app';
import { C, VERDICT, VerdictShape, verdictLabel } from '@/components/ui/VerdictShape';
import { Counter } from '@/components/ui/Counter';
import { useReducedMotion } from '@/lib/useReducedMotion';

// The countries come from data.js: home = the profile's countries (DE, AT), abroad = the other countries the tenders are
// in (ES, NL, FR). ISO 3166-1 numeric ids are the world atlas's keys; the table covers every country engine.js names.
const ISO_NUM: Record<string, string> = { DE: '276', AT: '040', ES: '724', NL: '528', FR: '250', IT: '380', PL: '616', BE: '056' };
const HOME = PROFILE.countries;
const ABROAD = COUNTRIES.filter((c) => !HOME.includes(c));
const SHOWN = [...HOME, ...ABROAD].filter((c) => ISO_NUM[c]);
const CODE_BY_ID = new Map(SHOWN.map((c) => [ISO_NUM[c], c] as const));
const HOME_LL: [number, number] = [12.37, 51.34]; // Leipzig, the demo firm's city
// The original map's six buyer pins (one per tender) with their label offsets, and its hand-placed country codes, which
// clear those labels (AT sits in Tyrol: at its centroid Kaltbrunn's label covered it, CLAUDE.md §11 item 141).
const PINS: { id: string; name: string; at: [number, number]; lab: [number, number, 'start' | 'end'] }[] = [
  { id: 'ell-schools', name: 'Ellerbach', at: [11.1, 50.55], lab: [-14, 4, 'end'] },
  { id: 'hoh-security', name: 'Hohenau', at: [12.9, 48.75], lab: [14, -2, 'start'] },
  { id: 'kal-fibre', name: 'Kaltbrunn', at: [13.6, 47.35], lab: [14, 10, 'start'] },
  { id: 'vli-libraries', name: 'Vlietdam', at: [4.6, 52.05], lab: [-14, 4, 'end'] },
  { id: 'mor-support', name: 'Morlanne', at: [-0.5, 43.45], lab: [14, 4, 'start'] },
  { id: 'val-dc', name: 'Valdemora', at: [-3.9, 40.35], lab: [14, 4, 'start'] },
];
const CODE_AT: Record<string, [number, number]> = { DE: [9.3, 52.2], AT: [11.6, 47.05], NL: [5.7, 52.85], FR: [2.4, 46.9], ES: [-5.4, 41.9] };
const LABELS_FROM = 560; // below this width the pins keep their shapes and tooltips but not their name labels (they crowd)
const TIP_ROOM = 190; // the tooltip (up to ~165 px with its 18 px gap) opens below a pin closer than this to the top of the map

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
const shapeOf = (v: string) => (v === 'closed' ? 'nogo' : v) as 'go' | 'maybe' | 'nogo';

/** Fill delays (ms). On arrival the countries light up one after another, home first; on a switch the countries abroad
 *  follow each other in the same order. Solid colours only (declutter rules); instant under reduced motion. */
const INTRO_STEP = 140, SWITCH_STEP = 90;

/**
 * "Where you bid": filled countries (where you bid in brand, the rest in bg) with a code on each of the five, and, back
 * from the original 3 Nov map (pass 5): Leipzig as home with a pulse, dashed arcs flowing out to the six buyer pins (one
 * shape per verdict: ● Go, ▲ Maybe, ■ No-go) and a tooltip per pin on hover, focus or tap. Under the map, the cross-border
 * switch re-scores every pin with the real decision rules (1 · 2 · 3 → 1 · 1 · 4: only Valdemora flips), the count tiles
 * re-flex and count to the new values. Solid strokes and fills, no glow; the tooltip is a plain block of the ground colour.
 */
export function WorldMap() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [cross, setCross] = useState(PROFILE.crossBorder);
  const [tip, setTip] = useState<string | null>(null); // the pin whose tooltip shows
  const [held, setHeld] = useState<string | null>(null); // a pin tapped or pressed: its tooltip stays until tapped again
  const [dismissed, setDismissed] = useState<string | null>(null); // Escape hides the tooltip showing now, until the pin changes
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();
  const [seen, setSeen] = useState(false); // false until the map has come into view: the countries wait unlit
  const [settled, setSettled] = useState(false); // the arrival sequence is over: switch delays apply from then on
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (seen) return;
    const el = box.current!;
    if (!('IntersectionObserver' in window)) { const t = setTimeout(() => setSeen(true), 0); return () => clearTimeout(t); }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  useEffect(() => {
    if (!seen || settled) return;
    const t = setTimeout(() => setSettled(true), reduce ? 0 : INTRO_STEP * SHOWN.length + 700);
    return () => clearTimeout(t);
  }, [seen, settled, reduce]);
  useEffect(() => { // Escape dismisses any tooltip showing (held, hovered or focused: WCAG 1.4.13), until another pin is chosen
    const showing = tip ?? held;
    if (!showing || showing === dismissed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setHeld(null); setDismissed(showing); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tip, held, dismissed]);
  const profile = useMemo(() => profileWith({ crossBorder: cross }), [cross]);
  const pins = useMemo(() => PINS.map((p) => ({ ...p, v: evaluateOne(p.id, profile) })), [profile]);
  const open = pins.filter((p) => p.v.verdict !== 'closed');
  const n = counts(open.map((p) => p.v));

  const { w, h } = size;
  const geo = useMemo(() => {
    if (!w || !h) return null;
    const pad = w < 600 ? 20 : 32;
    const proj = geoConicConformal().parallels([40, 56]).rotate([-6, 0]);
    proj.fitExtent([[pad, pad], [w - pad, h - pad]], { type: 'FeatureCollection', features: FOCUS });
    const path = geoPath(proj);
    // A code goes on its country (the original's spot where it has one); where the country is narrower than the code at
    // that height (the Netherlands on a phone) it goes just west of it, on the sea, in a text colour instead of the fill's.
    const pinXY = PINS.map((p) => proj(p.at)!).concat([proj(HOME_LL)!]);
    const clear = (x: number, y: number, anchor: 'middle' | 'start' | 'end') => { // the code's box keeps 6 px from every pin shape
      const x0 = anchor === 'middle' ? x - LABEL_W / 2 : anchor === 'start' ? x : x - LABEL_W, x1 = x0 + LABEL_W;
      return pinXY.every(([px, py]) => Math.max(x0 - px, 0, px - x1) > 16 || Math.abs(py - y) > 18);
    };
    const labels = LABEL_AT.map(({ cc, poly }) => {
      const [x0, y0] = CODE_AT[cc] ? proj(CODE_AT[cc])! : path.centroid(poly);
      // where the code would touch a pin (narrow maps: AT under Kaltbrunn, NL beside Vlietdam), try nearby spots first
      const spots: [number, number][] = [[x0, y0], [x0, y0 + 16], [x0, y0 - 16], [x0 - 18, y0], [x0 + 18, y0], [x0 - 14, y0 + 14], [x0 + 14, y0 + 14]];
      const fit = spots.find(([x, y]) => { const [l, r] = spanAt(proj, poly, x, y); return r - l >= LABEL_W && clear(x, y, 'middle'); });
      if (fit) return { cc, x: fit[0], y: fit[1], inside: true, east: false };
      // too narrow or crowded: on the sea beside the country (west; Austria east, where no arc crosses)
      const [left, right] = spanAt(proj, poly, x0, y0);
      if (cc === 'AT') return { cc, x: right + 4, y: y0, inside: false, east: true };
      const west = { cc, x: left - 4, y: y0, inside: false, east: false };
      return clear(west.x, y0, 'end') || !clear(right + 4, y0, 'start') ? west : { cc, x: right + 4, y: y0, inside: false, east: true };
    });
    return { proj, path, labels, home: proj(HOME_LL)!, pinXY };
  }, [w, h]);
  const lit = seen || reduce;
  const bids = (cc: string | undefined) => lit && !!cc && (HOME.includes(cc) || (cross && ABROAD.includes(cc)));
  const where = cross ? SHOWN : HOME;
  const delay = (cc: string | undefined) => {
    if (!cc || reduce) return undefined;
    const ms = settled ? Math.max(0, ABROAD.indexOf(cc)) * SWITCH_STEP : SHOWN.indexOf(cc) * INTRO_STEP;
    return `${ms}ms`;
  };
  const summary = `${open.length} tenders: ${n.go} ${VERDICT.go.label}, ${n.maybe} ${VERDICT.maybe.label}, ${n.nogo} ${VERDICT.nogo.label}`;
  const showTip = (tip ?? held) === dismissed ? null : (tip ?? held);
  const tipPin = pins.find((p) => p.id === showTip);
  const tipXY = tipPin && geo ? geo.proj(tipPin.at)! : null;
  const labelsOn = w >= LABELS_FROM;
  const press = (id: string) => { setHeld((cur) => (cur === id ? null : id)); setTip(null); setDismissed(null); };
  const hover = (id: string | null) => { if (leaveTimer.current) clearTimeout(leaveTimer.current); setTip(id); if (id !== dismissed) setDismissed(null); };
  // Pointer targets (pass 5): the pin nearest the pointer, within 26 px, so two close pins split the space between them
  // instead of the later one's circle covering the earlier pin (Hohenau and Kaltbrunn are 18 px apart on a 320 px phone).
  const nearest = (e: React.PointerEvent | React.MouseEvent) => {
    if (!geo) return null;
    const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best: string | null = null, bd = 26;
    PINS.forEach((p, i) => { const [px, py] = geo.pinXY[i], d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = p.id; } });
    return best;
  };

  return (
    <>
      <div className="map-frame">
        <div ref={box} className="map">
          {geo && (
            <svg className={`map-svg${tip ? ' over-pin' : ''}`} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="group" aria-label={`Map: you bid in ${names(where)}. ${summary}. Each tender is a pin; focus one for its verdict.`}
              onPointerMove={(e) => { if (e.pointerType === 'mouse') { const id = nearest(e); if (id !== tip) hover(id); } }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') { if (leaveTimer.current) clearTimeout(leaveTimer.current); leaveTimer.current = setTimeout(() => setTip(null), 160); } }}
              onClick={(e) => { const id = nearest(e); if (id) press(id); else { setHeld(null); setTip(null); } }}>
              <g>
                {WORLD.map((f, i) => {
                  const cc = CODE_BY_ID.get(String(f.id));
                  return <path key={i} d={geo.path(f) ?? undefined} className={cc ? 'map-land' : undefined} style={{ fill: bids(cc) ? C.brand : C.bg, transitionDelay: delay(cc) }} stroke={C.surface} strokeWidth={1} strokeLinejoin="round" />;
                })}
              </g>
              <g aria-hidden="true">
                {geo.labels.map(({ cc, x, y, inside, east }) => (
                  <text key={cc} x={x} y={y} textAnchor={inside ? 'middle' : east ? 'start' : 'end'} dominantBaseline="central" className={`map-cc${lit ? ' on' : ''}`} style={{ fill: bids(cc) ? (inside ? C.bg : C.ink) : C.muted, stroke: bids(cc) && inside ? C.brand : 'none', transitionDelay: delay(cc) }}>{cc}</text>
                ))}
              </g>
              {lit && (
                <>
                  <g aria-hidden="true">
                    {pins.map((p) => {
                      const [x, y] = geo.proj(p.at)!, [hx, hy] = geo.home, dx = x - hx, dy = y - hy, d = Math.hypot(dx, dy) || 1;
                      const cx = (hx + x) / 2 + (dy / d) * d * 0.2, cy = (hy + y) / 2 - (dx / d) * d * 0.2;
                      const d2 = `M${hx},${hy} Q${cx},${cy} ${x},${y}`, off = p.v.verdict === 'nogo' || p.v.verdict === 'closed';
                      return <g key={p.id}><path className="arc-case" d={d2} /><path className={`arc${off ? ' arc-off' : ''}`} d={d2} /></g>;
                    })}
                  </g>
                  <g transform={`translate(${geo.home[0]},${geo.home[1]})`} aria-hidden="true">
                    {!reduce && <circle className="pulse" r={6} />}
                    <circle className="home-dot" r={7} />
                    <text x={13} y={-10} className="map-home">{labelsOn ? 'You · Leipzig' : 'You'}</text>
                  </g>
                  {pins.map((p, i) => {
                    const [x, y] = geo.proj(p.at)!, v = shapeOf(p.v.verdict), [lx, ly, anchor] = p.lab, on = showTip === p.id;
                    return (
                      <g key={p.id} className={`pin v-${v}${on ? ' on' : ''}`} transform={`translate(${x},${y})`} tabIndex={0} role="button" aria-expanded={held === p.id}
                        aria-label={`${p.name} ${verdictLabel(p.v.verdict)} · ${p.v.score}. ${p.v.title}, ${p.v.buyer}, ${Engine.countryName(p.v.country)}. ${p.v.why}`} /* starts with the visible label (WCAG 2.5.3) */
                        onFocus={() => hover(p.id)} onBlur={() => setTip(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(p.id); } }}>
                        <circle className="pin-hit" r={22} />
                        <g className="pin-shape" style={reduce ? undefined : { animationDelay: `${600 + i * 80}ms` }}>
                          {v === 'go' ? <circle r={8} /> : v === 'maybe' ? <path d="M0,-9.5 L9.5,7 L-9.5,7Z" /> : <rect x={-7} y={-7} width={14} height={14} rx={1.5} />}
                        </g>
                        {labelsOn && (
                          <text x={lx} y={ly - 6} textAnchor={anchor} className="pin-label" aria-hidden="true">
                            <tspan className="pin-name">{p.name}</tspan>{' '}
                            <tspan x={lx} dy={15} className="pin-v">{verdictLabel(p.v.verdict)} · {p.v.score}</tspan>
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          )}
          {tipPin && tipXY && (
            <div className={`map-tip${tipXY[1] < TIP_ROOM ? ' below' : ''}`} role="tooltip" style={{ left: Math.min(Math.max(tipXY[0], 125), w - 125), top: tipXY[1] }}
              onPointerEnter={() => { if (leaveTimer.current) clearTimeout(leaveTimer.current); }} onPointerLeave={(e) => { if (e.pointerType === 'mouse') setTip(null); }}>
              <p className="tip-b">{tipPin.v.title}</p>
              <p className="tip-s">{tipPin.v.buyer}, {Engine.countryName(tipPin.v.country)}</p>
              <p className={`tip-v v-${shapeOf(tipPin.v.verdict)}`}><VerdictShape verdict={shapeOf(tipPin.v.verdict)} size={9} /><b>{verdictLabel(tipPin.v.verdict)} · {tipPin.v.score}</b></p>
              <p className="tip-why">{tipPin.v.why}</p>
            </div>
          )}
        </div>
      </div>
      <div className="map-panel">
        <button type="button" role="switch" aria-checked={cross} className="map-row" onClick={() => setCross((v) => !v)}>
          <span className={`sw${cross ? ' on' : ''}`} aria-hidden="true"><i className="sw-knob" /></span>
          <span>Bid outside {names(HOME)}</span>
        </button>
        <span className="sr-only" aria-live="polite">{summary}</span>
        <div className="map-counts" aria-hidden="true">
          {(['go', 'maybe', 'nogo'] as const).map((k) => (
            <div key={k} className={`map-count v-${k}`} style={{ flex: `${Math.max(n[k], 0.6)} 1 0` }}>
              <VerdictShape verdict={k} size={8} />
              <span><b><Counter value={n[k]} /></b> {VERDICT[k].label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
