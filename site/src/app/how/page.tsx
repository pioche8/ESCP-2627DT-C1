import type { Metadata } from 'next';
import H from '@/generated/how-it-decides.json';
import { APP_URL, REPO_URL } from '@/data/copy';
import { Engine } from '@/data/app';
import { Footer } from '@/components/sections/Footer';
import { Wordmark } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Buttons';
import { StatusLine } from '@/components/ui/VerdictTile';
import { type VerdictKey } from '@/components/ui/VerdictShape';
import { TryTheRules } from '@/components/how/TryTheRules';
import { withBase } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How it decides · TenderScout',
  description: 'The rules behind every Go, Maybe or No-go: requirement statuses, the four parts of the fit score, the thresholds, and what "cites the page that proves it" means. Derived from the prototype’s decision code at build time; try the rules live.',
  alternates: { canonical: withBase('/how') },
  openGraph: { title: 'How TenderScout decides', description: 'Knock-outs, the fit score, the thresholds, and the rules you can try live. Generated from the decision code itself.', url: withBase('/how'), type: 'article', siteName: 'TenderScout', images: [{ url: withBase('/opengraph-image.png'), width: 1200, height: 630, alt: 'TenderScout: Public tenders you can actually win, read for you overnight. Go, Maybe, No-go.' }] },
  twitter: { card: 'summary_large_image', title: 'How TenderScout decides', description: 'Knock-outs, the fit score, the thresholds, and the rules you can try live.', images: [withBase('/opengraph-image.png')] },
};

type Status = 'pass' | 'risk' | 'review' | 'fail';
const STATUS_V: Record<Status, VerdictKey> = { pass: 'go', risk: 'maybe', review: 'check', fail: 'nogo' };
type VerdictWord = 'go' | 'maybe' | 'nogo' | 'closed';
const money = (n: number) => '€' + Engine.fmt(n);
const blob = (file: string) => REPO_URL + '/blob/main/' + file;

const STATUS_LABEL: Record<Status, string> = { pass: 'Meets', risk: 'Risk', review: 'Needs your check', fail: 'Fails' };
function StatusCell({ s }: { s: Status }) {
  return <StatusLine verdict={STATUS_V[s]} label={STATUS_LABEL[s]} className="how-status" size={9} />;
}
function VerdictCell({ v }: { v: VerdictWord }) {
  if (v === 'closed') return <span className="how-verdict-word">Closed</span>;
  return <StatusLine verdict={v} className="how-status" size={9} />;
}
function Table({ caption, head, rows, className = '' }: { caption: string; head: string[]; rows: React.ReactNode[][]; className?: string }) {
  return (
    <table className={`how-table ${className}`}>
      <caption className="sr-only">{caption}</caption>
      <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

export default function HowPage() {
  const w = H.weights, c = H.constants, d = H.demo, t = H.tests;
  const statusMeaning: Record<Status, string> = {
    pass: 'the profile satisfies the line',
    risk: 'not met, but a partner, a translation or a visit could cover it; it costs half the points',
    review: 'the AI is unsure; only the owner can answer, and until then the line counts nothing',
    fail: 'a knock-out: the tender is No-go whatever the score',
  };
  const verdictWord = (v: string) => (v === 'nogo' ? 'No-go' : v === 'go' ? 'Go' : v === 'maybe' ? 'Maybe' : 'Closed');
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <main id="main" className="how-page">
        <section className="hero how-hero" aria-label="How it decides">
          <div className="wrap">
            <header className="site-header">
              <Wordmark as="a" size={20} />
              <div className="how-head-btns">
                <Button href="/" tone="secondary">The site</Button>
                <Button href={APP_URL} external>Try the prototype</Button>
              </div>
            </header>
            <h1 className="hero-tagline how-h1">How it decides.</h1>
            <p className="body how-lead">
              The AI reads the tender; these rules decide. Everything on this page was derived from the prototype’s decision code when the site was built: the rules were run on probe inputs and the weights and thresholds were read from the code and checked against those runs. <span title={`Code version ${H.source.engineSha}, demo data ${H.source.dataSha}`}>If the code changes, this page changes with it.</span>
            </p>
            <nav className="how-toc" aria-label="On this page">
              {[['#statuses', 'Statuses'], ['#score', 'Score'], ['#verdict', 'Verdict'], ['#try', 'Try the rules'], ['#proof', 'The proof'], ['#demo', 'The demo data'], ['#real', 'What is real']].map(([h, l]) => <a key={h} href={h}>{l}</a>)}
            </nav>
          </div>
        </section>

        <section id="statuses" className="section how-sec" aria-labelledby="statuses-h">
          <div className="wrap"><div className="how-narrow">
            <h2 id="statuses-h" className="h2">Each requirement gets a status.</h2>
            <p className="body">The AI extracts the hard requirements with a confidence. Before the typed rule runs, two things are checked: the AI’s confidence and whether the owner has answered the line.</p>
            <ul className="how-statuses" aria-label="The four statuses">
              {(['pass', 'risk', 'review', 'fail'] as Status[]).map((s) => (
                <li key={s}><StatusCell s={s} /><span className="how-status-text">{statusMeaning[s]}</span></li>
              ))}
            </ul>
            <Table caption="Confidence and the owner’s answer" head={['Condition', 'Status']} rows={H.confidence.map((x) => [x.condition, <StatusCell key={x.condition} s={x.status as Status} />])} />
            <p className="body">Then the rule for the requirement’s type. The last column is the sentence the app shows under the line, produced by the same code.</p>
            <Table caption="Rules by requirement type" head={['Requirement', 'Condition', 'Status', 'What the app says']} className="how-rules"
              rows={H.rules.flatMap((r) => r.cases.map((x, i) => [i === 0 ? <b key="l">{r.label}</b> : '', x.condition, <StatusCell key={x.condition} s={x.status as Status} />, x.note]))} />
          </div></div>
        </section>

        <section id="score" className="section how-sec" aria-labelledby="score-h">
          <div className="wrap"><div className="how-narrow">
            <h2 id="score-h" className="h2">The fit score, 0 to 100.</h2>
            <p className="body">Four parts, added up. The statuses above feed the third one.</p>
            <Table caption="The four parts of the fit score" head={['Part', 'Points', 'How']} rows={[
              ['Sector fit', <b key="s">{w.sector}</b>, `${w.sector} if any of the tender’s CPV codes starts with one of the profile’s two-digit divisions, else 0 (and the tender is No-go).`],
              ['Size fit', <b key="z">{w.size.max}</b>, `${w.size.inRange} when the contract value lies between the profile’s minimum and maximum, ${w.size.below} when it is smaller, ${w.size.above} when it is larger.`],
              ['Requirements', <b key="r">{w.requirements.max}</b>, `${w.requirements.max} × (met + ${w.requirements.risk} × risk) ÷ the number of requirements, rounded. A line that needs the owner’s check counts 0.`],
              ['Time to prepare', <b key="t">{w.time.max}</b>, w.time.bands.filter((b) => b.from !== null).map((b) => `${b.pts} with ${b.from}+ days left`).join(', ') + ', 0 on the deadline day.'],
            ]} />
          </div></div>
        </section>

        <section id="verdict" className="section how-sec" aria-labelledby="verdict-h">
          <div className="wrap"><div className="how-narrow">
            <h2 id="verdict-h" className="h2">The verdict.</h2>
            <Table caption="Verdict rules" head={['Verdict', 'When', 'Score']} rows={H.verdicts.map((v) => [<VerdictCell key={v.verdict} v={v.verdict as VerdictWord} />, v.rule, v.score])} />
            <p className="body">Probe: with otherwise identical inputs the code gives Maybe at {c.probes.highestMaybe} and Go at {c.probes.lowestGo}, so the Go line is {c.goMinScore}. A knock-out caps the score at {c.knockoutCap}; a verdict is never shown by colour alone. Ranking in the feed: {H.ranking}.</p>
          </div></div>
        </section>

        <section id="try" className="section how-sec how-try-sec" aria-labelledby="try-h">
          <div className="wrap">
            <div className="how-narrow">
              <h2 id="try-h" className="h2">Try the rules.</h2>
              <p className="body">The same decision code, running in your browser on one demo tender: {d.tenders.find((x) => x.id === 'hoh-security')?.title} ({d.tenders.find((x) => x.id === 'hoh-security')?.buyer}). Change the company’s facts; the verdict, the score and the line that moved update at once. Set them the demo way and you get {d.hohenau.map((s) => verdictWord(s.verdict) + ' ' + s.score).join(' → ')}.</p>
            </div>
            <TryTheRules />
          </div>
        </section>

        <section id="proof" className="section how-sec" aria-labelledby="proof-h">
          <div className="wrap"><div className="how-narrow">
            <h2 id="proof-h" className="h2">“Cites the page that proves it.”</h2>
            <p className="body">Every requirement the AI extracts is stored with the sentence it came from, so the owner never has to trust a summary. For {H.citation.tender}’s first line ({H.citation.doc}, {H.citation.pages} pages, {H.citation.language}):</p>
            <Table caption="The fields behind one citation" head={['Field', 'Value', 'Shown as']} className="how-cite" rows={[
              ['Type and value', `${H.citation.fields.type} · ${H.citation.fields.value}`, 'which rule above runs'],
              ['Label', H.citation.fields.label, 'the line’s title'],
              ['Citation', H.citation.fields.cite, `“${H.citation.doc}, ${H.citation.fields.cite.replace(/^[^p]*p\./, 'p.')}” under the line and on its sheet`],
              ['Original sentence', <q key="q" lang="de">{H.citation.fields.src}</q>, 'quoted on the sheet'],
              ['Decisive phrase', H.citation.fields.highlight, 'underlined inside the quote'],
              ['Translation', H.citation.fields.tr, 'under the quote'],
              ['Confidence', String(H.citation.fields.confidence), `“${Math.round(H.citation.fields.confidence * 100)} % AI confidence”; under ${Math.round(c.reviewThreshold * 100)} % the line becomes “Needs your check”`],
            ]} />
          </div></div>
        </section>

        <section id="demo" className="section how-sec" aria-labelledby="demo-h">
          <div className="wrap"><div className="how-narrow">
            <h2 id="demo-h" className="h2">The demo data through the rules.</h2>
            <p className="body">Demo date {d.today}. Profile: {d.profile.name.replace(/\s*\(fictional\)/, '')}, {d.profile.city}, turnover {money(d.profile.turnover)}, {d.profile.references} references, {d.profile.certifications.join(', ')}, bids in {d.profile.languages.map((l) => Engine.langName(l)).join(' and ')}, works in {d.profile.countries.map((k) => Engine.countryName(k)).join(' and ')}{d.profile.crossBorder ? ', cross-border on' : ''}, sectors {d.profile.cpv.join(', ')}. All companies and tenders are fictional.</p>
            <Table caption="The six demo tenders, ranked" head={['Tender', 'Verdict', 'Score', 'Days left', 'Reason']} className="how-demo" rows={d.tenders.map((r) => [
              <span key="t"><b>{r.title}</b><br /><span className="how-muted">{r.buyer} · {r.country} · {money(r.value)} · {r.pages} pages, {r.language}</span></span>,
              <VerdictCell key="v" v={r.verdict as VerdictWord} />, <b key="s">{r.score}</b>, r.daysLeft, r.reason,
            ])} />
            <p className="body">{(['go', 'maybe', 'nogo'] as const).map((v) => `${(d.counts as Record<string, number>)[v] || 0} ${verdictWord(v)}`).join(' · ')} · {d.pages} pages in {d.languages.length} languages.</p>
            <h3 className="how-h3">The demo path on {H.citation.tender}</h3>
            <Table caption="Hohenau step by step" head={['Step', 'Verdict', 'Score', 'Reason']} rows={d.hohenau.map((s) => [s.step, <VerdictCell key="v" v={s.verdict as VerdictWord} />, <b key="s">{s.score}</b>, s.reason])} />
            <p className="body">What the engine reads from the profile: {H.profileFields.map((f) => f.field).join(', ')}. Not read, display only: {H.profileNotRead.join(', ')}.</p>
          </div></div>
        </section>

        <section id="real" className="section how-sec" aria-labelledby="real-h">
          <div className="wrap"><div className="how-narrow">
            <h2 id="real-h" className="h2">What is real in this prototype.</h2>
            <ul className="how-real">
              <li>
                <StatusLine verdict="check" size={9} className="how-status" />
                <p><b>Simulated:</b> reading tenders, translating, answering questions and drafting the profile. Pre-written output after a short delay, labelled “Simulated AI” wherever it appears. No model is called and there are no keys. <a href={blob('ai.js')} title="ai.js on GitHub" target="_blank" rel="noopener noreferrer">The simulated layer on GitHub</a>.</p>
              </li>
              <li>
                <StatusLine verdict="go" size={9} className="how-status" />
                <p><b>Real:</b> the decision rules on this page, deterministic and tested: <a href={blob('tests/engine.test.js')} title="tests/engine.test.js on GitHub" target="_blank" rel="noopener noreferrer">{t.engine} unit tests</a>, <a href={blob('tests/demo-golden.test.js')} title="tests/demo-golden.test.js on GitHub" target="_blank" rel="noopener noreferrer">{t.golden} pinned demo numbers</a>, <a href={blob('tests/engine-invariants.test.js')} title="tests/engine-invariants.test.js on GitHub" target="_blank" rel="noopener noreferrer">a property test of {t.invariantCases.toLocaleString('en-GB')} random cases per run</a> and <a href={blob('tests/smoke.js')} title="tests/smoke.js on GitHub" target="_blank" rel="noopener noreferrer">{t.smokeChecks} browser checks</a>. <a href={blob('engine.js')} title="engine.js on GitHub" target="_blank" rel="noopener noreferrer">The decision code on GitHub</a>.</p>
              </li>
              <li>
                <StatusLine verdict="nogo" size={9} className="how-status" />
                <p><b>Fictional:</b> every company, buyer, tender, page number and quote. None of it is interview evidence. <a href={blob('data.js')} title="data.js on GitHub" target="_blank" rel="noopener noreferrer">The demo data on GitHub</a>.</p>
              </li>
            </ul>
            <p className="body">This page itself is generated: <a href={blob('shared/how-it-decides.js')} title="shared/how-it-decides.js on GitHub" target="_blank" rel="noopener noreferrer">the script that probes the code</a> writes it and <a href={blob('docs/HOW_IT_DECIDES.md')} title="docs/HOW_IT_DECIDES.md on GitHub" target="_blank" rel="noopener noreferrer">the same content as a document</a>, and the build fails if either falls behind the code.</p>
            <div className="how-cta">
              <Button href={APP_URL} size="lg" external>Try the prototype</Button>
              <Button href="/" tone="secondary" size="lg">Back to the site</Button>
            </div>
          </div></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
