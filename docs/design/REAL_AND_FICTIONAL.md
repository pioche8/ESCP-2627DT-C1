# What is real and what is fictional

Every number, name and example in this repository's documents comes from one of four kinds of source. This page says which kind each comes from, so nobody mistakes demo data for evidence. Other documents link here when they use an example.

| Kind | What it means | Counts as evidence? |
|---|---|---|
| **Real: user data** | What a real person in the target group told us. Today: one survey response (S1). No interviews yet. | Yes, and only this kind. Survey answers are self-reported and do not count toward the gate. Interviews do |
| **Real: desk research** | Published facts with a source and an access date | Yes, as context. It says nothing about our users |
| **Real: code and measurements** | What the prototype's code does, and what the tests measure about it | It proves how the prototype behaves. It does not prove that anyone needs it |
| **Fictional** | Invented for the demo: the company, the buyers, the tenders, the quotes, the page numbers, the AI output | **No.** Every name carries "(fictional)", and the app says "All companies and tenders are fictional" |
| **ASSUMPTION** | A number or claim the team chose and has not tested | No. It is what the interviews have to test |

## Real: user data
| Data | Source | Used in |
|---|---|---|
| S1: Owner / MD, firm of 5–19, read 3–5 tenders in 12 months, spent 1–2 days deciding on the last one, found checking requirements took longest, uses free portal alerts plus a spreadsheet, the tools did not say whether the firm qualifies, "Not sure" about skipping foreign tenders | Screening survey (Google Forms, opened 5 Nov 2026), one response, self-reported. Contact details held by the team, not in the repo | [`evidence.md` §1b](../../evidence.md#1b-survey-responses-screening-form-not-interviews) (signals for H1 and H2, n = 1); [`BRIEF.md` → Product objectives](../../BRIEF.md#product-objectives-and-success-metric) (why the weekly rhythm is a hypothesis); the Strategy row of [`UX_PLANES.md`](UX_PLANES.md) |
| Interviews | None logged yet ([`evidence.md`](../../evidence.md) §1 and §2 are empty) | Nothing. The persona (T9), the journey map (T10) and the interview links on the user stories wait for them |

## Real: desk research
| Fact | Source | Used in |
|---|---|---|
| EU public procurement is about €2 trillion a year (about 14% of GDP); 42% of contracts drew a single bid in 2021, nearly double 2011; average bids fell from about 6 to 3; firms cite bureaucracy | European Court of Auditors, Special Report 28/2023 (link and access date in [`evidence.md` §5](../../evidence.md#5-desk-research-separate-from-interview-evidence)) | [`BRIEF.md` → Problem](../../BRIEF.md#problem), the pitch |
| Altura raised an €8M Series A (Jun 2025); Tendium sells a "Qualify" bid/no-bid product | [`evidence.md` §5](../../evidence.md#5-desk-research-separate-from-interview-evidence) (links and access dates) | [`BRIEF.md` → Competition](../../BRIEF.md#competition-name-them-before-the-lecturer-googles-them) |
| Stotles, Mercell, DTAD, Patterno and Auftrag One exist and what they do; eForms mandatory on TED since Oct 2023 | Named in `BRIEF.md`. **No source logged in `evidence.md` §5 yet**, so add one before the pitch | `BRIEF.md` → Competition and Why now |
| The 45 CPV divisions and their codes | The EU Common Procurement Vocabulary (`data.js` → `SECTORS`) | Welcome ("All 45 EU sectors"), the website's sector cards |

## Real: code and measurements
| What | Source | Note |
|---|---|---|
| The decision rules: per-requirement statuses, knock-outs, the 0–100 score, Go / Maybe / No-go, ranking | `engine.js`, deterministic; [`docs/HOW_IT_DECIDES.md`](../HOW_IT_DECIDES.md) is generated from it | The code is real. Its **weights and thresholds** (40 / 20 / 30 / 10, Go from 70, knock-out cap 25, review below 0.7 confidence) are the team's design choices, not values set by evidence |
| The behaviour in every user-story acceptance criterion (routes, sheets, Back / Escape / scrim, toasts, re-scoring) | `app.js`, locked by the tests named in [`USER_STORIES.md`](USER_STORIES.md) | Real behaviour of the prototype, shown on fictional data |
| Test counts: 24 engine tests, 11 demo pins, 3,000 random cases per run of the property test, the smoke test's checks | `tests/` | Real measurements of the code |
| The effort estimate (hours per bid) | `engine.js` | Real code, but an **unvalidated heuristic**; not shown in the app |

## Fictional
| What | Where | How it is marked |
|---|---|---|
| The demo firm Nordlicht Netzwerk GmbH: Leipzig, 24 staff, €3.2M turnover, 4 references, ISO 9001, German and English, its website `nordlicht-netzwerk.example` | `data.js` → `PROFILE` | "(fictional)" in the name; "All companies and tenders are fictional" on Welcome, Feed, detail, Bids and Company |
| The six tenders and their buyers (Stadt Ellerbach, Landkreis Hohenau, Universidad de Valdemora, Stadtwerke Kaltbrunn, Gemeente Vlietdam, Centre Hospitalier de Morlanne), values, deadlines and page counts | `data.js` → `TENDERS` | "(fictional)" at the end of every buyer name (checked by `tests/data-check.js`) |
| Every quoted sentence, translation, page and section number, confidence value (e.g. 58%), summary and question-and-answer | `data.js`, played back by `ai.js` | "Simulated AI" wherever it shows; About: "Every company, buyer, tender, page number and quote is invented. None of it is interview evidence." |
| Therefore every demo number: Hohenau No-go 25 → Maybe 90 → Go 100, "1 Go · 2 Maybe · 3 No-go", "777 pages in 4 languages", "Reading 146 pages (German)…" | Computed by the real engine **from the fictional data** | The examples in [`USER_STORIES.md`](USER_STORIES.md) and [`CONTENT_REQUIREMENTS.md`](CONTENT_REQUIREMENTS.md) all come from here |
| The website's weekly sector counts | `site/src/data/sectors.ts` | "Weekly counts are illustrative" on the page |

## ASSUMPTION (chosen, not tested)
| What | Where |
|---|---|
| The metric targets: at least 1 completed check per firm per week, under 60 s to a verdict on a Go tender, at least half of "Needs your check" lines answered, at least half of Go verdicts saved | [`BRIEF.md` → Product objectives](../../BRIEF.md#product-objectives-and-success-metric) |
| Prices, bid cost (€3–10k), the "20 h × €60" payback, cost per tender read, screening time of 1–3 hours | `BRIEF.md` → Problem, Why AI, Why now, Business model |
| That owners would use a phone app for this, and the "under 60 seconds" promise | `BRIEF.md`, `docs/NAVIGATION.md` flow 1 |

## The rule
A document may use fictional data to show how the product behaves, never to show that users need it. Evidence about users comes only from rows in the first table, and today that is one survey answer.
