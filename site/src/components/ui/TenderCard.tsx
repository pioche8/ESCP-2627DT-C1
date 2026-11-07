import { money, type TenderView } from '@/data/app';
import { ScoreTile, StatusLine } from './VerdictTile';
import { verdictLabel } from './VerdictShape';

/** The 300 px tender card of the "Tonight's read" carousel: verdict (shape + word + score), title, buyer, value, days left. */
export function TenderCard({ t }: { t: TenderView }) {
  const v = t.verdict === 'closed' ? 'nogo' : t.verdict;
  return (
    <article className="tcard" aria-label={`${verdictLabel(t.verdict)}, score ${t.score} of 100. ${t.title}, ${t.buyer}, ${money(t.value)}, ${t.daysLeft} days left.`}>
      <ScoreTile verdict={v} score={t.score} />
      <div className="tcard-text">
        <StatusLine verdict={v} />
        <h3 className="tcard-title">{t.title}</h3>
        <p className="tcard-meta">{t.buyer} · {money(t.value)} · {t.daysLeft} d</p>
      </div>
    </article>
  );
}
