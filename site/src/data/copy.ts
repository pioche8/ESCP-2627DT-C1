// Every string on the page. Numbers that describe the data (6 tenders, 777 pages, 45 sectors) are computed in app.ts, not typed here.
export const APP_URL = 'https://pioche8.github.io/ESCP-2627DT-C1/';
export const REPO_URL = 'https://github.com/pioche8/ESCP-2627DT-C1';
export const FILM_URL = APP_URL + 'marketing/TenderScout-launch-film-1920x1080.mp4';
export const HONESTY = 'Prototype · all companies and tenders are fictional';
export const SIMULATED = 'Simulated AI';

export const menuItems = [
  { label: 'Tonight’s read', href: '#tonight' },
  { label: 'How it works', href: '#how' },
  { label: 'How it decides', href: '/how' },
  { label: 'In the app', href: '#app' },
  { label: 'Sectors', href: '#sectors' },
  { label: 'Where you bid', href: '#where' },
  { label: 'Get started', href: '#start' },
];

export const hero = {
  tagline: 'Public tenders you can actually win, read for you overnight.',
  meta: 'EU tender scout for small firms',
  time: '06:41 · Leipzig, DE',
  scroll: 'Scroll to explore',
  cta: 'Try the prototype',
  menu: 'Menu',
};

export const statement = 'TenderScout reads every new public tender in the EU overnight, in any language, and tells a small firm whether it can bid. Every verdict links to the page and the sentence that proves it.';

export const rollWords = ['school Wi-Fi?', 'fibre?', 'this audit?', 'data centres?', 'cleaning?', 'a framework?'];

export const steps = [
  { n: '01 / 04', title: 'Read overnight', body: (pages: number) => `Every new tender in Germany, Austria, Spain, the Netherlands and France, in its own language. ${pages} pages last night.` },
  { n: '02 / 04', title: 'A verdict by morning', body: () => 'Go, Maybe or No-go for each tender, with a fit score out of 100 and the reasons in one line.' },
  { n: '03 / 04', title: 'Proof on the page', body: () => 'Every requirement links to the sentence that decides it, in the original language and translated.' },
  { n: '04 / 04', title: 'Re-scores as you grow', body: () => 'Add a certificate or a reference and every verdict updates at once.' },
];

export const faqs = [
  { q: 'How do you read tenders in four languages?', a: 'Every document is translated, then each requirement is checked against your company profile. The original sentence stays one tap away, with its page number.' },
  { q: 'What does “Needs your check” mean?', a: 'The tender’s wording is unclear and our confidence is below 70%. You decide whether you meet it, and the tender re-scores straight away.' },
  { q: 'Which countries do you cover?', a: 'Germany and Austria by default. Turn on cross-border bidding to add Spain, the Netherlands and France.' },
  { q: 'Is the AI output real?', a: 'No. This is a university prototype: the AI output is simulated, the decision logic is real code, and every company and tender is fictional.' },
];

export const chapters = [['0:00', 'Night'], ['0:04', 'Reading'], ['0:10', 'Morning'], ['0:17', 'Proof'], ['0:25', 'Re-score'], ['0:38', 'Start']] as const;

export const languagesTile = { lines: ['We read every tender', 'in German, Spanish, Dutch', 'and French, overnight.'], codes: 'DE · ES · NL · FR → EN' };

export const footer = {
  blurb: 'University prototype · ESCP · Digital Product Design. AI output is simulated and all companies and tenders are fictional.',
  product: [['How it works', '#how'], ['How it decides', '/how'], ['Sectors', '#sectors'], ['Countries', '#where']] as const,
  project: [['Questions', '#faq'], ['Launch film', FILM_URL], ['Source on GitHub', REPO_URL], ['Try the prototype', APP_URL]] as const,
};
