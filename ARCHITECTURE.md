# TenderScout architecture

One page on how the prototype is put together: what decides, what is simulated, what is real and what is fictional, where state lives, how the website shares the same code, how it is tested, deployed and rolled back. Written 5 Nov 2026 for the workshop; the rules themselves are in [`CLAUDE.md`](CLAUDE.md) §4–§7 and the decision log in §11. Routes and flows are in [`docs/NAVIGATION.md`](docs/NAVIGATION.md); the decision model, generated from the code, is in [`docs/HOW_IT_DECIDES.md`](docs/HOW_IT_DECIDES.md).

```mermaid
flowchart LR
  subgraph app["App (static, no build, GitHub Pages from main)"]
    direction TB
    data["data.js<br/>fictional company + 6 tenders<br/>(DEMO_TODAY, PROFILE, TENDERS, CERT_OPTIONS, SECTORS)"]
    engine["engine.js<br/>REAL rules: checkRequirement → evaluate → rank<br/>reasonLine, headline, verdicts, diff, whatIf"]
    ai["ai.js<br/>SIMULATED AI: readTender, ask, draftProfile<br/>pre-written output after a delay"]
    appjs["app.js<br/>hash router + screens + event delegation<br/>Welcome · Feed · Tender · Sheets · Bids · Company · About"]
    store[("localStorage<br/>tenderscout.v2")]
    data --> engine --> appjs
    data --> ai --> appjs
    appjs <--> store
  end
  subgraph tokens["Design tokens"]
    tj["shared/tokens.json<br/>nine colours per scheme, type, 8 px radius, easing, durations"]
    bt["shared/build-tokens.js"]
    tcss["shared/tokens.css"]
    scss["site/src/styles/tokens.css (Tailwind @theme)<br/>site/src/generated/tokens.ts"]
    tj --> bt --> tcss & scss
    tcss --> styles["styles.css (components only)"] --> appjs
  end
  subgraph site["Website (Next.js, site/, not deployed)"]
    direction TB
    sync["scripts/sync-shared.mjs (prebuild)"]
    gen["src/generated/engine.cjs · data.cjs<br/>how-it-decides.json"]
    pages["/ landing · PhoneDemo · map<br/>/how 'How it decides' + Try the rules"]
    sync --> gen --> pages
    scss --> pages
  end
  engine -. copied verbatim .-> gen
  data -. copied verbatim .-> gen
  how["shared/how-it-decides.js<br/>probes the engine"] --> gen
  how --> hdoc["docs/HOW_IT_DECIDES.md"]
  engine --> how
  data --> how
```

## 1. Four files, one direction

The app at the repository root is four classic scripts loaded in order by `index.html` (`engine.js → data.js → ai.js → app.js`), two stylesheets (`shared/tokens.css`, then `styles.css`) and vendored fonts. There is no bundler and no dependency, so the same files run from GitHub Pages, from `python3 -m http.server` and from `file://`.

- **`data.js`** holds the fictional demo: the company profile, six tenders with their requirements (each with the original sentence, its translation, the page and a confidence), the "AI" summaries and Q&A, the certificate options and the 45 CPV divisions. Every buyer and the company name carry "(fictional)". The demo date is fixed at `2026-11-05` so days-left never drift. Nothing in it is interview evidence.
- **`engine.js`** is the only code that decides. `checkRequirement()` gives each requirement a status (`pass`, `risk`, `fail`, `review`), `evaluate()` adds the four score parts (sector 40, size 20, requirements 30, time 10) and applies the verdict rules (closed, No-go with a cap of 25, Go from 70 with no open line and at most one risk, Maybe otherwise), `rank()` orders the feed. The functions added later (`reasonLine`, `headline`, `verdicts`, `diff`, `whatIf`) are pure functions on top of `evaluate()`; its return shape is locked by a test. It is deterministic and runs unchanged in node, in the browser and inside the website.
- **`ai.js`** stands in for the language model: the three jobs that would need one (reading a tender pack, answering a question, drafting the profile) return pre-written output from `data.js` after a short delay, with `simulated: true` so the UI can label it. `?demo=fast` shortens the delays. Nothing calls a model; there are no keys.
- **`app.js`** renders the screens from the engine's results, routes on the URL hash, and stores state. It never computes a verdict itself. Every interactive element carries a `data-*` attribute (`data-go`, `data-act`, `data-filter`, `data-confirm`, `data-ask`, `data-skip`, `data-stage`, `data-unskip`, `data-cert`, `data-lang`, `data-ref`, `data-field`), and one delegated click handler dispatches on them.

The split is the product's honesty claim: the AI reads, the rules decide. The About screen says so, "Simulated AI" is written next to every piece of AI output, and `tests/data-check.js` asserts that both labels are still rendered. Which data in the repository is real and which is fictional: [§9](#9-what-is-real-and-what-is-fictional).

## 2. Screens and routes

| Route | Screen | Notes |
|---|---|---|
| `#/welcome/1` → `/2` → `/3` | Welcome, Reading (transient, replaced in history), Check your profile | before onboarding every other route redirects here (except Company and About) |
| `#/feed` | Feed: counts in the filter tabs, ranked cards | skipped tenders hidden |
| `#/t/:id` | Tender: verdict, headline, facts, In short, the qualification check, Ask this tender, Skip / Save | first open per session shows "Reading N pages (language)…" |
| `#/t/:id/req/:rid` | Requirement sheet: status, confidence, the original sentence with the decisive phrase, translation, We meet it / We don't | its own history entry; Back, Escape and the scrim close it |
| `#/t/:id/skip` | Skip-reason sheet | reasons optional, multi-select |
| `#/bids` | Deciding / Bidding / Submitted + Skipped (Restore) | |
| `#/company` | Profile levers; every change re-scores all tenders and shows the one that flipped | the hero moment: ISO 27001 → Hohenau No-go → Go |
| `#/about` | What is simulated, what is real, that data is fictional, AI-assisted build; Appearance; Reset demo | |

Bottom tabs Feed / Bids / Company are hidden during onboarding, on a tender and on About. Unknown routes show "Page not found". Full flows and states: [`docs/NAVIGATION.md`](docs/NAVIGATION.md).

## 3. State

One `localStorage` key, **`tenderscout.v2`**: `{ onboarded, profile, website, overrides, saved, skipped, filter, theme, palette }`. `overrides[tenderId][reqId]` is the owner's answer on a line (`pass` | `fail`), `saved[id]` the bid stage, `skipped[id] = { reasons, at }`. `theme` is `dark` (default), `light` or `system`; `palette` is written for shape stability and no longer read. Every read and write is wrapped in try/catch with an in-memory fallback for private mode; the inline script in `index.html` reads the same key before the first paint so the scheme never flashes. If the shape ever changes, the key is bumped (v1 → v2 happened on 2 Nov), not migrated. Session-only state (which tenders were "read", open answers, the last re-score) lives in variables and is gone on reload.

## 4. URL parameters (demo and test only)

| Parameter | Effect |
|---|---|
| `?demo=reset` | writes a fresh `tenderscout.v2`, removes `reset` from the address, lands on `#/welcome/1` |
| `?demo=fast` (or `reset,fast`) | caps the two simulated AI waits at about 300 ms; nothing else changes |
| `?theme=system|light|dark` | sets Appearance, persisted |
| `?today=YYYY-MM-DD` | moves the demo date (shows the Closed state); tests only |
| `?offline=1` | shows the offline note; tests only |

The live demo opens `https://pioche8.github.io/ESCP-2627DT-C1/?demo=reset,fast` ([`BRIEF.md`](BRIEF.md)).

## 5. Design tokens: one source, two products

`shared/tokens.json` is the only place colours, type, the one 8 px radius, easing and durations are written: nine solid colours per scheme (background, surface, ink, muted, brand and the four verdict colours), one typeface. `node shared/build-tokens.js` emits `shared/tokens.css` for the app, `site/src/styles/tokens.css` (a Tailwind v4 `@theme` block) and `site/src/generated/tokens.ts` for the website. `styles.css` contains components only and no hand-typed colour. `node shared/check-contrast.js` audits every text/background pair in both schemes against WCAG AA; `tests/declutter-scan.js` proves the absence of the eighteen banned patterns (gradients, shadows, borders, pills, uppercase, italics, mono, eyebrows, numbering, code names in visible text, …) both in the stylesheets and in every rendered screen. Verdicts are never colour alone: shape + word everywhere (● Go, ▲ Maybe, ■ No-go, ◆ Needs your check).

## 6. The website shares the code

`site/` is a Next.js 16 site, not deployed yet (README → Website). `scripts/sync-shared.mjs`, run by `prebuild`, copies `engine.js` and `data.js` verbatim into `site/src/generated/` as CommonJS, rebuilds the tokens, runs `shared/how-it-decides.js` and re-renders the Open Graph image and icons from the tokens. The landing page's phone demo, the tender cards, the counts and the map all call the real engine on the real demo data, so every number on the site is the app's. `/how` ("How it decides") renders `how-it-decides.json`, which the generator produces by *probing* the engine (running it on controlled inputs and reading the constants back), and its "Try the rules" block runs the engine in the browser. `docs/HOW_IT_DECIDES.md` is the same generator's second output. CI fails if either falls behind the code.

## 7. Tests and gates

| Gate | What it proves | Where it runs |
|---|---|---|
| `tests/engine.test.js` (24) | the rules of CLAUDE.md §4, the added functions, the locked return shapes | node, `tests.html` in Chromium, CI `check` |
| `tests/data-check.js` | `data.js` has every field the engine and the UI read, unique ids, ISO dates, citations inside their documents, no placeholder text, the honesty labels rendered | node, CI `check` |
| `tests/demo-golden.test.js` | the live demo's numbers (Hohenau 25 → 90 → 100, 1 Go · 2 Maybe · 3 No-go, 777 pages in 4 languages), the storage key, the reset | node, `tests.html`, CI `check` |
| `tests/engine-invariants.test.js` | a seeded property test: a fail is always No-go, score within 0–100, meeting one more line never lowers the score, verdicts consistent with the score, rank sorted | node, CI `check` |
| `tests/declutter-scan.js` | the eighteen patterns are absent from the five stylesheets | node, CI `check` |
| `shared/check-contrast.js` | WCAG AA on every pair, both schemes | node, CI `check` |
| generated files in sync | tokens and the decision model match their sources | CI `check` |
| `tests/smoke.js` | the full click-through at 390×844 (and the iPhone 13 / SE profiles) in dark, light and reduced motion, the declutter scan on every screen, the error fallback; `MONKEY=1` adds the seeded monkey walk | Playwright + Chromium; CI `smoke` (390×844) |
| `tests/browser-tests.js` | `tests.html` over `file://` and HTTP with 0 page errors | Playwright; CI `smoke` |
| `cd site && npm run check` / `npm run audit` | lint, typecheck, build; static export, the `/how` page check, Lighthouse ≥ 95 (median of 3) and axe 0 violations on both pages in dark and light | local |

`npm run preflight` runs every gate in order and prints one line per gate with the command to rerun it (`--quick` = the node-only set). The workflow `.github/workflows/check.yml` has two jobs, `check` (node only, under a minute, every push) and `smoke` (Chromium, about three minutes, pull requests and pushes to `main`); both are the status checks the `main` ruleset requires (`.github/ruleset-main.json`). WebKit cannot be installed in the build containers, so the iPhone profiles are Chromium emulation and Safari items are inspection.

## 8. Deploy and rollback

GitHub Pages serves `main` at the repository root (`.nojekyll` keeps Jekyll off), at `https://pioche8.github.io/ESCP-2627DT-C1/`; a push to `main` is live after the "pages build and deployment" run, typically within about 18 minutes. `node tests/live-check.js` compares the served files with a checkout byte for byte, and `SMOKE_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node tests/smoke.js` runs the click-through against the live URL (both from a laptop: the build containers cannot reach github.io). The website is not deployed; `STATIC_EXPORT=1 npm run build` in `site/` gives a static preview.

The workshop build is frozen on the branch **`release/v1-workshop`** (tag pushes are blocked from the build sessions). Rollback in one command, from any machine with push rights:

```
git push --force-with-lease origin release/v1-workshop:main
```

Older rollback points are the `backup/*` branches. Every later change reaches `main` through a pull request with CI green, so the demo cannot break by accident.

## 9. What is real and what is fictional

The code is real, the data it runs on in the demo is fictional, and the only real user data so far is one survey answer. Every number, name and example in this repository's documents belongs to one of five kinds:

| Kind | What | Source | Evidence about users? |
|---|---|---|---|
| **Real: user data** | Survey response S1: Owner / MD, firm of 5–19, read 3–5 tenders in 12 months, 1–2 days deciding on the last one, checking requirements took longest, free portal alerts plus a spreadsheet, the tools did not say whether the firm qualifies | Screening survey (Google Forms, opened 5 Nov 2026), self-reported; contact details held by the team, not in the repo: [`evidence.md` §1b](evidence.md#1b-survey-responses-screening-form-not-interviews) | Yes, as signals only (n = 1), outside the gate. **No interview is logged yet** |
| **Real: desk research** | EU procurement about €2 trillion a year, 42% single-bid contracts in 2021, average bids down from about 6 to 3 (European Court of Auditors, Special Report 28/2023); Altura's €8M Series A; Tendium's "Qualify"; the 45 CPV divisions (EU Common Procurement Vocabulary, `data.js` → `SECTORS`) | [`evidence.md` §5](evidence.md#5-desk-research-separate-from-interview-evidence), with links and access dates | Context, not user evidence. Stotles, Mercell, DTAD, Patterno, Auftrag One and "eForms mandatory on TED since Oct 2023" are named in [`BRIEF.md`](BRIEF.md) without a source in §5 yet |
| **Real: code and measurements** | The rules, score and verdicts (`engine.js`), the screens and their behaviour (`app.js`), the test counts (24 engine tests, 11 demo pins, 3,000 property cases per run, the smoke checks) | §1 and §7 above | Proves how the prototype behaves, not that anyone needs it. The weights and thresholds (40 / 20 / 30 / 10, Go from 70, knock-out cap 25, review below 0.7 confidence) are design choices, not set by evidence. The effort estimate is an unvalidated heuristic and is not shown |
| **Fictional** | The company Nordlicht Netzwerk GmbH and its profile; the six tenders, their buyers, values, deadlines and page counts; every quoted sentence, translation, page and section number, confidence value, summary and Q&A. Therefore also every demo number the real engine computes from them: Hohenau No-go 25 → Maybe 90 → Go 100, 1 Go · 2 Maybe · 3 No-go, 777 pages in 4 languages, 58% | `data.js`, played back by `ai.js` | **No.** "(fictional)" on every name (checked by `tests/data-check.js`), "All companies and tenders are fictional" on Welcome, Feed, tender, Bids and Company, "Simulated AI" on every piece of AI output, and About says none of it is interview evidence |
| | The website's weekly sector counts | `site/src/data/sectors.ts` | No. Labelled "Weekly counts are illustrative" on the page |
| **ASSUMPTION** | The metric targets (at least 1 completed check per firm per week, under 60 s to a verdict on a Go tender, at least half of the "Needs your check" lines answered, at least half of Go verdicts saved), the prices, the €3–10k bid cost, the 20 h × €60 payback, the cost per tender read, the 1–3 h screening time | [`BRIEF.md`](BRIEF.md) | No. These are what the interviews have to test |

**The rule:** fictional data may show how the product behaves, never that users need it. The documents that use examples say so at the top: [`docs/design/USER_STORIES.md`](docs/design/USER_STORIES.md) (real behaviour, fictional examples), [`docs/design/CONTENT_REQUIREMENTS.md`](docs/design/CONTENT_REQUIREMENTS.md) (real structure, fictional examples), [`docs/design/UX_PLANES.md`](docs/design/UX_PLANES.md), [`BRIEF.md` → Product objectives](BRIEF.md#product-objectives-and-success-metric) and [`evidence.md`](evidence.md).
