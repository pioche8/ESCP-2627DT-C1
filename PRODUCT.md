# TenderScout product

What TenderScout is, who it is for, what the prototype does and does not do, and the product rules every change keeps. It describes `main` as of 5 Nov 2026 and adds no new facts: each statement comes from a file named next to it, and the numbers come from the engine.

| This file covers | Not in this file (look here instead) |
|---|---|
| The job, the user, what the owner gets on each screen, the verdict vocabulary, what is in and out of scope, the product rules, what is known and what is assumed, the open questions | How it is built: [`ARCHITECTURE.md`](ARCHITECTURE.md) · where things sit on each screen: [`SKELETON.md`](SKELETON.md) · how it looks: [`UI_DESIGN.md`](UI_DESIGN.md) · the rules in full: [`docs/HOW_IT_DECIDES.md`](docs/HOW_IT_DECIDES.md) · routes, flows and states: [`docs/NAVIGATION.md`](docs/NAVIGATION.md) · market, competition, pitch, business model and the demo script: [`BRIEF.md`](BRIEF.md) · interviews and the gate: [`evidence.md`](evidence.md) · visuals: [`DESIGN.md`](DESIGN.md) · what is real and what is fictional: [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional) · user stories, content requirements and the UX planes: [`docs/design/`](docs/design/UX_PLANES.md) · build rules and every decision: [`CLAUDE.md`](CLAUDE.md) |

## 1. The job

Every morning TenderScout reads new EU public tenders in any language and tells the owner of a small firm, on their phone, whether they can bid on each one: **Go, Maybe or No-go**, a fit score from 0 to 100, and for every requirement the page and the original sentence that prove it.

The promise: **"Can we even bid on this?" answered in under 60 seconds, with proof.** ([`CLAUDE.md`](CLAUDE.md) §2, [`DESIGN.md`](DESIGN.md) §1.)

Why it matters, in one line: competition for EU public contracts has collapsed (the figures and their sources: [`BRIEF.md`](BRIEF.md) → Problem, [`evidence.md`](evidence.md) §5), and for a firm of 5–50 people the cost sits before the bid: someone has to read a 50–200 page pack, often in another language, to find the one line that rules them out.

Reading tenders in other languages is part of the product, but it is a hypothesis still to be tested (H3), not a proven need: neither stakeholder response supports it yet ([`evidence.md` §4](evidence.md#4-what-changed-because-of-the-evidence)). The proven core, for now, is the qualification check (H1, H2).

## 2. Who it is for

- **Primary:** the owner or managing director of a 5–50 person firm that sells to the public sector (IT services, network installation, building trades, facility services, engineering, consulting, translation), with no bid manager on staff.
- **Secondary:** the one person in a 50–250 person firm who "does the tenders" alongside a day job.
- **Not the user:** large firms with bid teams; they already buy bid-management tools ([`BRIEF.md`](BRIEF.md) → Competition).
- **Context of use:** one hand, between jobs or in a van, sessions of 1–3 minutes, patchy signal, no procurement expertise ([`docs/NAVIGATION.md`](docs/NAVIGATION.md)). This is why every verdict is readable in three seconds, primary actions sit in the thumb zone and the core loop needs no typing.

This user is a hypothesis, supported so far by one stakeholder response in the segment (survey response S1, §7); the draft persona built on it is [`docs/design/PERSONA.md`](docs/design/PERSONA.md).

## 3. What the owner gets

| The owner… | …and gets | Screen | Who produces it |
|---|---|---|---|
| types the firm's website | a drafted company profile (staff, turnover, references, sectors, certificates, bid languages, countries) to confirm or edit | Welcome → Check your profile (`#/welcome/1`–`3`) | simulated AI drafts, the owner confirms |
| opens the app | every tender ranked Go → Maybe → No-go with its score, title, buyer, value and days left; the counts in the filter tabs; skipped tenders hidden | Feed (`#/feed`) | the rules rank the simulated reading |
| opens a tender | the verdict, the score, the one-line reason, value and deadline, every hard requirement with its status, failing lines first, then a short summary | Tender (`#/t/:id`) | the rules decide; the summary is simulated AI |
| taps a requirement | the original sentence with the decisive phrase marked, its translation, document, page and section, and how confident the reading is | Requirement sheet (`#/t/:id/req/:rid`) | the reading is simulated; the status is the rules' |
| answers an unclear line | "We meet it" or "We don't meet it" (with Undo); that tender is re-scored at once | same sheet | the rules, with the owner's answer stored per tender |
| wants to know who else will bid | the likely bidders and similar past awards (a simulated reading of fictional award notices) and a rough chance to win from plain rules, which never changes the score | Tender → Competition | simulated AI for the reading; plain rules for the chance |
| asks the tender a question | a plain answer with the page it comes from ("Can we subcontract?") | Tender → Ask this tender | simulated AI |
| saves or skips | a pipeline of Deciding / Bidding / Submitted; skipping with optional reasons, and Restore | Bids (`#/bids`), Skip sheet (`#/t/:id/skip`) | stored on the phone |
| looks back at past bids | the win rate, the value won, the win rate by area and why bids were lost (for example 6.8% above the winner on price) | Win/loss insights (`#/insights`, from Bids) | plain arithmetic over the fictional past bids (`insights.js`) |
| changes the profile (turnover, references, four certificates, five bid languages, bidding abroad) | every tender re-scored at once, the one that flipped named with its score ("Landkreis Hohenau · 25 → 100 · No-go → Go"), and hints saying what a lever would unlock | Company (`#/company`) | the rules |
| wants to see the firm as TenderScout sees it | the company profile, read only, with one way to change it ("Edit on Company") | Profile tab (`#/profile`) | the confirmed profile, stored on the phone |
| starts the day | once a day after the overnight read, a simulated lock-screen notification with today's Go / Maybe / No-go counts; tapping it opens the Feed | morning notification (over the Feed; replay on Settings) | the rules count; the notification itself is simulated |
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

**Real and fictional data:** the decision rules, the 45 CPV divisions, the EU procurement figures (European Court of Auditors, Special Report 28/2023), the EU countries and languages, and the two survey responses are real; every company, buyer and tender in the demo, and the website's weekly sector counts, are fictional ([`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional)). The demo date is fixed at Thu 5 Nov 2026 so verdicts and days left never drift.

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

Known only provisionally: whether the pain is real for this user. The four hypotheses (H1–H4) and the gate are in [`evidence.md` §0](evidence.md#0-hypotheses-and-kill-gate-written-before-the-evidence). Stakeholder evidence: 2 responses, collected by survey (the course counts a survey as an interview). 1 is in our 5–50 segment. The gate is signed **Provisional, n = 2**: both meet H1 and H2, only one is in the segment, neither supports the cross-language claim (H3, still to be tested, not proven), and willingness to pay (H4) was not asked ([`evidence.md` §1](evidence.md#1-stakeholder-log) and [§3](evidence.md#3-key-insights-n--2-survey)). Which statements are known, which are fictional and which are assumed: [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional).

## 8. The demo

The 75-second path and the numbers the presenter says are in [`BRIEF.md`](BRIEF.md) (open `?demo=reset,fast`). They are the engine's and are pinned by `tests/demo-golden.test.js`; moving one is a decision to state, never a side effect.

## 9. Open questions

- **The gate verdict** (signed Provisional, n = 2 on 9 Nov; GO / RESHAPE / KILL once there are at least 3 responses, [`evidence.md`](evidence.md) §0). RESHAPE points the pitch at cross-border reading (H3) or at the buyer side; KILL moves the focus to bid writing, said openly. Either would rewrite §2, §5 and §7 of this file.
- **Cross-language (H3):** whether owners skip tenders in other languages. Still to be tested, not proven; question 9 of [`docs/INTERVIEW_KIT.md`](docs/INTERVIEW_KIT.md) asks it.
- **Persona, "How might we", journey map and traceability** (T8–T10): the persona with HMW and the journey are drafts from the two survey responses ([`docs/design/PERSONA.md`](docs/design/PERSONA.md), [`docs/design/JOURNEY.md`](docs/design/JOURNEY.md)); traceability is still pending. Their status is kept in [`docs/design/UX_PLANES.md`](docs/design/UX_PLANES.md).

## 10. Words used in the product

- **Tender pack:** the documents behind a tender notice, 50–200 pages, in the buyer's language.
- **Knock-out:** a requirement that, if failed, rules the firm out.
- **Reference:** a comparable past project the buyer asks to see.
- **CPV division:** the first two digits of the EU's procurement vocabulary code; there are 45, and sector fit compares the tender's with the firm's.
- **Fit score:** 0–100; sector 40, size 20, requirements 30, time 10.
- **Bidding abroad (cross-border):** bidding outside the firm's home countries; off, a foreign place of work fails, on, it is a risk.
- **Your answer:** "We meet it" / "We don't meet it" on a line, kept per tender.
