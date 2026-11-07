import { FILM_URL } from '@/data/copy';
import { Photo } from '@/components/ui/Photo';
import { Button } from '@/components/ui/Buttons';

/**
 * The film: a 16:9 photo block that opens the MP4, with the line and the button beside it, not on it. The original's
 * motion in solid colours (pass 5): a solid play square on the photo with a ring that grows from it every 2.2 s (the
 * ping), and on hover or focus the photo zooms (1.2 s), the play square grows and the bar under the photo fills (1.6 s).
 */
export function Film() {
  return (
    <section id="film" className="section" aria-labelledby="film-h">
      <div className="wrap film-inner">
        <div className="sec-row">
          <div className="sec-head">
            <h2 id="film-h" className="h2">See it in 45 seconds.</h2>
          </div>
          <Button href={FILM_URL} size="lg" external>Watch the film</Button>
        </div>
        <a href={FILM_URL} target="_blank" rel="noopener noreferrer" className="poster" aria-label="Watch the 45-second launch film (MP4, opens in a new tab)">
          <Photo src="/assets/harbor-dusk.jpg" sizes="(min-width: 1280px) 1200px, 100vw" className="poster-photo" />
          <span className="poster-play" aria-hidden="true">
            <svg viewBox="0 0 80 80" className="poster-ping"><rect x="4" y="4" width="72" height="72" rx="6.15" /></svg>
            <svg viewBox="0 0 80 80" className="poster-btn"><rect x="4" y="4" width="72" height="72" rx="6.15" /><path d="M32 26 L56 40 L32 54 Z" /></svg>
          </span>
        </a>
        <div className="poster-bar" aria-hidden="true"><div /></div>
        <div className="film-foot">
          <p className="poster-title">Every night, we read every new EU tender.</p>
          <span className="body">Launch film, 0:45</span>
        </div>
      </div>
    </section>
  );
}
