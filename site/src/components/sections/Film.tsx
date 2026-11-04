import { FILM_URL } from '@/data/copy';
import { Photo } from '@/components/ui/Photo';
import { Button } from '@/components/ui/Buttons';

/** The film: a 16:9 photo block that opens the MP4, with the line and the button beside it, not on it. */
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
          <Photo src="/assets/harbor-dusk.jpg" sizes="(min-width: 1280px) 1200px, 100vw" className="poster" />
        </a>
        <div className="film-foot">
          <p className="poster-title">Every night, we read every new EU tender.</p>
          <span className="body">Launch film, 0:45</span>
        </div>
      </div>
    </section>
  );
}
