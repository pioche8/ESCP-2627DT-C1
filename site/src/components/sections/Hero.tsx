'use client';
import { HONESTY, hero } from '@/data/copy';
import { Icon } from '@/components/ui/Icon';
import { Header } from './Header';

/** The hero: header, the tagline, one meta line. Plain ground, no glow, no giant wordmark. */
export function Hero({ menuOpen, onMenu, menuRef }: { menuOpen: boolean; onMenu: () => void; menuRef: React.RefObject<HTMLButtonElement | null> }) {
  return (
    <section id="top" className="hero" aria-label="TenderScout">
      <div className="wrap">
        <Header open={menuOpen} onMenu={onMenu} menuRef={menuRef} />
        <h1 className="hero-tagline">{hero.tagline}</h1>
        <div className="hero-meta">
          <div className="hero-meta-left">
            <span>{hero.meta}</span>
            <span>{HONESTY}</span>
          </div>
          <a href="#statement" className="hero-scroll">{hero.scroll}<Icon name="arrow_downward" size={16} /></a>
        </div>
      </div>
    </section>
  );
}
