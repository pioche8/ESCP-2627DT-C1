import { money, type TenderView } from '@/data/app';
import { Photo } from './Photo';
import { ScoreTile, StatusLine } from './VerdictTile';
import { verdictLabel } from './VerdictShape';

/** The 300 px tender card of the "Tonight's read" carousel. Every value comes from engine.js on data.js. */
export function TenderCard({ t }: { t: TenderView }) {
  const v = t.verdict === 'closed' ? 'nogo' : t.verdict;
  return (
    <article className="tcard" aria-label={`${verdictLabel(t.verdict)}, score ${t.score} of 100. ${t.title}, ${t.buyer}. ${t.why}.`}>
      <Photo src={t.photo} sizes="300px" className="tcard-photo" placeholder={{ doc: t.doc, pages: t.pages }}>
        <div className="tcard-fade" aria-hidden="true" />
      </Photo>
      <div className="tcard-body">
        <ScoreTile verdict={v} score={t.score} ring="var(--ts-surface)" className="tcard-score" />
        <div className="tcard-text">
          <StatusLine verdict={v} why={t.why} />
          <h3 className="tcard-title">{t.title}</h3>
          <p className="tcard-meta">{t.buyer} · {t.country} · {money(t.value)} · {t.daysLeft} d</p>
        </div>
      </div>
    </article>
  );
}
