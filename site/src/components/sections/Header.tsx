'use client';
import { APP_URL, hero } from '@/data/copy';
import { Icon } from '@/components/ui/Icon';
import { Wordmark } from '@/components/ui/Primitives';
import { WaveButton } from '@/components/ui/Buttons';

/** Wordmark · Menu pill (glass, with tonight's count) · "Try the prototype" (white pill with the wave reveal). */
export function Header({ open, onMenu, count, menuRef }: { open: boolean; onMenu: () => void; count: number; menuRef: React.RefObject<HTMLButtonElement | null> }) {
  return (
    <header className="site-header">
      <Wordmark size={20} />
      <button ref={menuRef} type="button" className="menu-pill" onClick={onMenu} aria-expanded={open} aria-controls="site-menu" aria-haspopup="dialog">
        <span className="menu-pill-main"><Icon name="apps" size={18} /><span className="menu-pill-label">{hero.menu}</span></span>
        <span className="menu-pill-count">{count} tenders tonight</span>
      </button>
      <WaveButton href={APP_URL} external className="header-cta">{hero.cta}</WaveButton>
    </header>
  );
}
