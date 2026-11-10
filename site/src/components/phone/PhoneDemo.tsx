'use client';
import { useEffect, useRef } from 'react';

// The app's storage key and the state the phone opens in: signed in with the demo address (the app's demo sign-in, pass 8
// PR 5), onboarded, on the Feed, dark, everything else the app's own
// defaults (app.js load() merges a stored state onto fresh()). Written before the frame loads, on every page load, so
// each visit starts from the same clean state, like ?demo=reset.
const KEY = 'tenderscout.v2';
const SEED = { signedIn: true, email: 'demo@example.com', onboarded: true, theme: 'dark' };
// The copy of the app that scripts/sync-shared.mjs keeps in public/prototype/ (byte for byte, checked in CI).
const SRC = '/prototype/index.html?demo=fast#/feed';

/**
 * The phone on the landing page is the real app, not a drawing of it: an iframe of the copy in public/prototype/,
 * at the app's own size (390 px wide in a 410 px frame; the full width of a phone below 480 px), so every tap target
 * keeps its 44 px. Since 10 Nov 2026 (pass 8, CLAUDE.md §11) it replaces the hand-built phone, which had drifted from
 * the app (it still showed the app before pass 5). Every screen, label ("Simulated AI", About on Settings), number
 * and interaction is the app's own: Feed, a tender with its proof first, the requirement sheet, Company's re-score
 * card (Landkreis Hohenau 25 → 100), Profile and Settings. The frame loads lazily, near the viewport.
 */
export function PhoneDemo() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    // Seed the app's state first, then point the frame at it (the frame has no src in the server markup).
    try { localStorage.setItem(KEY, JSON.stringify(SEED)); } catch { /* private mode: the app falls back to memory and opens on Welcome */ }
    if (frameRef.current) frameRef.current.src = SRC;
  }, []);
  return (
    <div className="phone">
      <div className="phone-screen">
        <iframe ref={frameRef} className="phone-app" title="TenderScout, the real prototype: tap through it" loading="lazy" />
      </div>
    </div>
  );
}
