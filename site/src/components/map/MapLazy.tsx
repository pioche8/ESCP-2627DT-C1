'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// The map's code and data (d3-geo, topojson-client, the 110 m world atlas) load only when the section comes near the
// viewport, so the landing page's start-up work stays small (Lighthouse total blocking time). Until then the section
// shows the same surface-coloured frame the map draws into; nothing else changes (5 Nov 2026).
const WorldMap = dynamic(() => import('./WorldMap').then((m) => m.WorldMap), { ssr: false, loading: () => <div className="map-frame" aria-hidden="true" /> });

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
  return <div ref={ref}>{near ? <WorldMap /> : <div className="map-frame" aria-hidden="true" />}</div>;
}
