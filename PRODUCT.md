# TenderScout product

What TenderScout is, who it is for, what the prototype does and does not do, and the product rules every change keeps. It describes `main` as of 5 Nov 2026 and adds no new facts: each statement comes from a file named next to it, and the numbers come from the engine.

| This file covers | Not in this file (look here instead) |
|---|---|
| The job, the user, what the owner gets on each screen, the verdict vocabulary, what is in and out of scope, the product rules, what is known and what is assumed, the open questions | How it is built: [`ARCHITECTURE.md`](ARCHITECTURE.md) · where things sit on each screen: [`SKELETON.md`](SKELETON.md) · how it looks: [`UI_DESIGN.md`](UI_DESIGN.md) · the rules in full: [`docs/HOW_IT_DECIDES.md`](docs/HOW_IT_DECIDES.md) · routes, flows and states: [`docs/NAVIGATION.md`](docs/NAVIGATION.md) · market, competition, pitch, business model and the demo script: [`BRIEF.md`](BRIEF.md) · interviews and the gate: [`evidence.md`](evidence.md) · visuals: [`DESIGN.md`](DESIGN.md) · what is real and what is fictional: [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional) · user stories, content requirements and the UX planes: [`docs/design/`](docs/design/UX_PLANES.md) · build rules and every decision: [`CLAUDE.md`](CLAUDE.md) |

## 1. The job

Every morning TenderScout reads new EU public tenders in any language and tells the owner of a small firm, on their phone, whether they can bid on each one: **Go, Maybe or No-go**, a fit score from 0 to 100, and for every requirement the page and the original sentence that prove it.

The promise: **"Can we even bid on this?" answered in under 60 seconds, with proof.** ([`CLAUDE.md`](CLAUDE.md) §2, [`DESIGN.md`](DESIGN.md) §1.)

Why it matters, in one line: competition for EU public contracts has collapsed (the figures and their sources: [`BRIEF.md`](BRIEF.md) → Problem, [`evidence.md`](evidence.md) §5), and for a firm of 5–50 people the cost sits before the bid: someone has to read a 50–200 page pack, often in another language, to find the one line that rules them out.

## 2. Who it is for

- **Primary:** the owner or managing director of a 5–50 person firm that sells to the public sector (IT services, network installation, building trades, facility services, engineering, consulting, translation), with no bid manager on staff.
- **Secondary:** the one person in a 50–250 person firm who "does the tenders" alongside a day job.
- **Not the user:** large firms with bid teams; they already buy bid-management tools ([`BRIEF.md`](BRIEF.md) → Competition).
- **Context of use:** one hand, between jobs or in a van, sessions of 1–3 minutes, patchy signal, no procurement expertise ([`docs/NAVIGATION.md`](docs/NAVIGATION.md)). This is why every verdict is readable in three seconds, primary actions sit in the thumb zone and the core loop needs no typing.

This user is a hypothesis until the interviews say otherwise (§7).

## 3. What the owner gets

| The owner… | …and gets | Screen | Who produces it |
|---|---|---|---|
| types the firm's website | a drafted company profile (staff, turnover, references, sectors, certificates, bid languages, countries) to confirm or edit | Welcome → Check your profile (`#/welcome/1`–`3`) | simulated AI drafts, the owner confirms |
| opens the app | every tender ranked Go → Maybe → No-go with its score, title, buyer, value and days left; the counts in the filter tabs; skipped tenders hidden | Feed (`#/feed`) | the rules rank the simulated reading |
| opens a tender | the verdict, the score, the one-line reason, value and deadline, a short summary, and every hard requirement with its status, failing lines first | Tender (`#/t/:id`) | the rules decide; the summary is simulated AI |
| taps a requirement | the original sentence with the decisive phrase marked, its translation, document, page and section, and how confident the reading is | Requirement sheet (`#/t/:id/req/:rid`) | the reading is simulated; the status is the rules' |
| answers an unclear line | "We meet it" or "We don't meet it" (with Undo); that tender is re-scored at once | same sheet | the rules, with the owner's answer stored per tender |
| asks the tender a question | a plain answer with the page it comes from ("Can we subcontract?") | Tender → Ask this tender | simulated AI |
| saves or skips | a pipeline of Deciding / Bidding / Submitted; skipping with optional reasons, and Restore | Bids (`#/bids`), Skip sheet (`#/t/:id/skip`) | stored on the phone |
| changes the profile (turnover, references, four certificates, five bid languages, bidding abroad) | every tender re-scored at once, the one that flipped named ("Landkreis Hohenau · No-go → Go"), and hints saying what a lever would unlock | Company (`#/company`) | the rules |
| wants to know what is real | what is simulated, what is real code, that all data is fictional, that the build was AI-assisted; light or dark; reset | Settings tab (`#/settings`, also `#/about`) | — |

The same product appears on two more surfaces: the marketing website in `site/` (not deployed; its phone demo, map and "How it decides" page run the app's own rules on the app's own data) and the launch film in `marketing/`.

## 4. How a verdict reads

| Tender verdict | Means |
|---|---|
| ● Go | score 70 or more, nothing left to check, at most one risk |
| ▲ Maybe | no knock-out, but a score under 70, an open line or more than one risk stands between it and Go |
| ■ No-go | a requirement fails, or the tender is outside the firm's sectors; the score is capped at 25 |
| Closed | the deadline has been reached (shown in tests only; the demo date is fixed) |

| Requirement status | Means |
|---|---|
| ● Meets | the profile meets it |
| ▲ Risk | it can be met with effort (a bid language the firm does not cover, one reference short, a certificate a subcontractor could bring, a mandatory site visit, work abroad) |
| ◆ Needs your check | the reading is less than 70% sure; it never counts as met until the owner answers |
| ■ Fails | a knock-out (turnover too low, a certificate missing where subcontracting is not allowed, two or more references short, a place of work outside the firm's countries while bidding abroad is off) |

The score adds sector fit (40), size fit (20), requirements (30) and time to the deadline (10). The authority is the code and its generated description, [`docs/HOW_IT_DECIDES.md`](docs/HOW_IT_DECIDES.md); this table is a reading aid. A verdict is always a shape and a word, never colour alone.

## 5. Scope

**Real in the prototype:** the decision (status per requirement, score, verdict, ranking), the re-score when the profile or an answer changes, the hints on Company, the owner's answers, the Bids pipeline and skip reasons (all kept on the phone), light and dark, the website's "How it decides" and "Try the rules".

**Simulated, and labelled "Simulated AI" wherever it shows:** reading tender packs, extracting requirements with page and confidence, translating, summarising, answering questions, drafting the profile. Pre-written output is played back after a short delay; no model is called and there are no keys.

**Which data is real and which is fictional:** [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional). The demo date is fixed at Thu 5 Nov 2026 so verdicts and days left never drift.

**Later, not built:** real tender ingestion (TED API), live AI, accounts and login, push notifications (a morning deep link to a tender), payments, a consortium-partner finder, calendar export, sharing a verdict, opening the source PDF at the cited page ([`CLAUDE.md`](CLAUDE.md) §10, [`docs/NAVIGATION.md`](docs/NAVIGATION.md) → Later). Teammate tasks T2–T7 in [`docs/START_HERE.md`](docs/START_HERE.md) §6 are the next candidates.

**Not the product, on purpose:** writing the bid, tender search on its own (portals and databases already do it), firms with bid teams. TenderScout stops at the decision ([`BRIEF.md`](BRIEF.md) → Competition).

## 6. Product rules that do not bend

1. **The AI reads, the rules decide.** Verdicts come from plain, tested code, so every one can be explained line by line.
2. **It never guesses a pass.** An unsure line goes to the owner, and a verdict never rests on it.
3. **Proof on every line:** the page, the original sentence and its translation.
4. **Honest labels:** "Simulated AI" next to every piece of AI output, "All companies and tenders are fictional" on the screens that show them, and the four statements under "About this prototype" on Settings.
5. **One hand:** tap targets of 44 px or more, actions in the thumb zone, readable in sunlight and in greyscale (shape + word), WCAG AA contrast, dark by default, reduced motion respected.
6. **Nothing leaves the phone:** no API keys, no CDNs, no accounts.

The full list, with the accessibility and layout rules: [`CLAUDE.md`](CLAUDE.md) §7.

## 7. What is known and what is assumed

Not known yet: whether the pain is real for this user. The four hypotheses (H1–H4) and the gate are in [`evidence.md` §0](evidence.md#0-hypotheses-and-kill-gate-written-before-interview-1-tagged-v0-shell); no interview is logged and the gate result is blank. The one survey answer so far is read as signals only ([`evidence.md` §1b](evidence.md#1b-survey-responses-screening-form-not-interviews)). Which statements are known, which are fictional and which are assumed: [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional).

## 8. The demo

The 75-second path and the numbers the presenter says are in [`BRIEF.md`](BRIEF.md) (open `?demo=reset,fast`). They are the engine's and are pinned by `tests/demo-golden.test.js`; moving one is a decision to state, never a side effect.

## 9. Open questions

- **The gate verdict** (GO / RESHAPE / KILL / provisional n = X, [`evidence.md`](evidence.md) §0). RESHAPE points the pitch at cross-border reading (H3) or at the buyer side; KILL moves the focus to bid writing, said openly. Either would rewrite §2, §5 and §7 of this file.
- **The `v0-shell` tag** ([`CLAUDE.md`](CLAUDE.md) §11 item 14).
- **Persona, "How might we", journey map and traceability** (T8–T10): pending until interviews exist; their status is kept in [`docs/design/UX_PLANES.md`](docs/design/UX_PLANES.md).

## 10. Words used in the product

- **Tender pack:** the documents behind a tender notice, 50–200 pages, in the buyer's language.
- **Knock-out:** a requirement that, if failed, rules the firm out.
- **Reference:** a comparable past project the buyer asks to see.
- **CPV division:** the first two digits of the EU's procurement vocabulary code; there are 45, and sector fit compares the tender's with the firm's.
- **Fit score:** 0–100; sector 40, size 20, requirements 30, time 10.
- **Bidding abroad (cross-border):** bidding outside the firm's home countries; off, a foreign place of work fails, on, it is a risk.
- **Your answer:** "We meet it" / "We don't meet it" on a line, kept per tender.
