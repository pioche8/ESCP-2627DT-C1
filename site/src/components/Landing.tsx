'use client';
import { useMemo, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { Engine, TODAY, counts, evaluateAll } from '@/data/app';
import { Menu } from './sections/Menu';
import { Hero } from './sections/Hero';
import { Statement } from './sections/Statement';
import { Tonight } from './sections/Tonight';
import { Languages } from './sections/Languages';
import { HowItWorks } from './sections/HowItWorks';
import { BuiltFor } from './sections/BuiltFor';
import { InTheApp } from './sections/InTheApp';
import { Sectors } from './sections/Sectors';
import { WhereYouBid } from './sections/WhereYouBid';
import { Film } from './sections/Film';
import { Questions } from './sections/Questions';
import { Start } from './sections/Start';
import { Footer } from './sections/Footer';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The one-page site: thirteen sections in the handoff's order plus the full-screen menu. Every number comes from engine.js on data.js. */
export function Landing() {
  const [menu, setMenu] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const views = useMemo(() => evaluateAll(), []);
  const open = views.filter((v) => v.verdict !== 'closed');
  const c = counts(open);
  const soonest = open.reduce((a, v) => (v.daysLeft < a.daysLeft ? v : a), open[0]);
  const dateLabel = DAYS[new Date(TODAY + 'T00:00:00Z').getUTCDay()] + ' ' + Engine.shortDate(TODAY);
  const hoh = views.find((v) => v.id === 'hoh-security')!;
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">Skip to content</a>
      <Menu open={menu} onClose={() => setMenu(false)} counts={c} nextDeadline={soonest ? { buyer: soonest.buyer, days: soonest.daysLeft } : null} dateLabel={dateLabel} returnTo={menuBtn} />
      <main id="main">
        <Hero menuOpen={menu} onMenu={() => setMenu(true)} count={open.length} menuRef={menuBtn} />
        <Statement />
        <Tonight tenders={open} count={open.length} />
        <Languages />
        <HowItWorks counts={c} quote={hoh} />
        <BuiltFor />
        <InTheApp />
        <Sectors />
        <WhereYouBid />
        <Film />
        <Questions />
        <Start />
      </main>
      <Footer />
    </MotionConfig>
  );
}
