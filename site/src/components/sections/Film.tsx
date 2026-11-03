import Image from 'next/image';
import { FILM_URL, chapters } from '@/data/copy';
import { Icon } from '@/components/ui/Icon';
import { SectionLabel } from '@/components/ui/Primitives';
import { WaveButton } from '@/components/ui/Buttons';

/** 16:9 poster with a blue tint, pulsing play button and chapter chips. Hover zooms the photo, fills the bar and scales the button. */
export function Film() {
  return (
    <section id="film" className="film" aria-labelledby="film-h">
      <div className="wrap-full film-inner">
        <div className="sec-row">
          <div className="sec-head">
            <SectionLabel n="08">THE FILM</SectionLabel>
            <h2 id="film-h" className="h2">See it in 45 seconds.</h2>
          </div>
          <WaveButton href={FILM_URL} icon="play_arrow" size="lg" external>Watch the film</WaveButton>
        </div>
        <a href={FILM_URL} target="_blank" rel="noopener noreferrer" className="poster">
          <span className="sr-only">Watch the 45-second launch film (MP4, opens in a new tab). </span>
          <Image src="/assets/harbor-dusk.jpg" alt="" fill sizes="(min-width: 1280px) 1280px, 100vw" className="poster-img" />
          <div className="poster-tint" aria-hidden="true" />
          <div className="poster-glow" aria-hidden="true" />
          <div className="poster-label"><span className="dot" aria-hidden="true" />LAUNCH FILM · 0:45 · 1920 × 1080</div>
          <div className="poster-play" aria-hidden="true"><span className="ping" /><span className="play"><Icon name="play_arrow" size={56} fill /></span></div>
          <div className="poster-foot">
            <p className="poster-title">Every night, we read every new EU tender.</p>
            <div className="poster-bar" aria-hidden="true"><div /></div>
            <div className="chapters">{chapters.map(([t, n]) => <span key={t} className="chapter"><span>{t}</span>{n}</span>)}</div>
          </div>
        </a>
      </div>
    </section>
  );
}
