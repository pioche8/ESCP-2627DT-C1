'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// The map's code and data (d3-geo, topojson-client, the 110 m world atlas) load only when the section comes near the
// viewport, so the landing page's start-up work stays small (Lighthouse total blocking time; CLAUDE.md §11 item 97).
// 6 Nov 2026 (item 139): adapted to the original 3 Nov map, which sits inside WhereYouBid's .map-frame and measures its
// parent with a ResizeObserver: the wrapper and the placeholder fill the frame, so the map never measures a 0 px height.
const FILL = { position: 'absolute', inset: 0 } as const;
const WorldMap = dynamic(() => import('./WorldMap').then((m) => m.WorldMap), { ssr: false, loading: () => <div style={FILL} aria-hidden="true" /> });

export function MapLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || near) return;
    if (!('IntersectionObserver' in window)) { const t = setTimeout(() => setNear(true), 0); return () => clearTimeout(t); }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return <div ref={ref} style={FILL}>{near ? <WorldMap /> : null}</div>;
}
