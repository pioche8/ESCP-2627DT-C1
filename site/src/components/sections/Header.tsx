'use client';
import { APP_URL, hero } from '@/data/copy';
import { Icon } from '@/components/ui/Icon';
import { Wordmark } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Buttons';

/** Wordmark · Menu button · "Try the prototype". */
export function Header({ open, onMenu, menuRef }: { open: boolean; onMenu: () => void; menuRef: React.RefObject<HTMLButtonElement | null> }) {
  return (
    <header className="site-header">
      <Wordmark size={20} />
      <button ref={menuRef} type="button" className="btn btn-secondary menu-btn" onClick={onMenu} aria-expanded={open} aria-controls="site-menu" aria-haspopup="dialog">
        <Icon name="apps" size={18} /><span className="menu-btn-label">{hero.menu}</span>
      </button>
      <Button href={APP_URL} external className="header-cta">{hero.cta}</Button>
    </header>
  );
}
