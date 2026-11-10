# Content requirements

What content TenderScout needs, where the truth for each piece lives, and who produces it. The last column of each table says what a real version built on TED would need beyond the prototype (`CLAUDE.md` §10: no real tender ingestion and no live AI calls in the prototype; this file only lists them).

**Real structure, fictional examples:** the fields, rules and copy come from the code; every example value is demo data from `data.js` ([`ARCHITECTURE.md` §9](../../ARCHITECTURE.md#9-what-is-real-and-what-is-fictional)).

**Who produces each piece (the "Owner" column):**
- **AI-read:** a language model reads it from the tender pack or the firm's website. In the prototype it is pre-written, fictional data in `data.js`, played back by `ai.js` with a delay and labelled "Simulated AI".
- **Engine:** `engine.js` computes it from the AI-read fields and the profile. Deterministic and tested (rules in [`CLAUDE.md` §4](../../CLAUDE.md#4-engine-rules-do-not-change-behaviour-tests-lock-these), the model in [`docs/HOW_IT_DECIDES.md`](../HOW_IT_DECIDES.md)).
- **Owner:** the firm's owner enters or confirms it (profile edits, answers to unclear lines, skip reasons).
- **Static copy:** fixed strings the team writes, in `app.js`. Tone and glossary come from [`DESIGN.md` §8](../../DESIGN.md#8-copy) (direct, calm, specific, sentence case, second person; "Can you qualify?" not "eligibility criteria", "Buyer" not "contracting authority", "Needs your check" not "low confidence").

**Two sources that are superseded, so nobody copies from them:**
- [`DESIGN.md` §10](../../DESIGN.md#10-data-and-logic) sketches a data model, a verdict rule and a score that were **not implemented**. The engine wins ([`CLAUDE.md` §11](../../CLAUDE.md#11-decisions-log-session-of-2-nov-2026-agreed-with-the-team-before-building) item 1). Its demo table (Hohenau "Go 92", Ellerbach "Meets all 8 requirements") is not what the app shows.
- Several of DESIGN.md §8's "verbatim" strings were shortened or de-capitalised in the 4 Nov declutter (items 59–62). Example: "ORIGINAL · GERMAN" became "Original (German) · Vergabeunterlagen, p. 12, §3.1". The strings in `app.js` are the current ones, and this file quotes those.

## 1. Tender fields

One record per tender in `data.js` → `TENDERS`. `tests/data-check.js` checks that every field the engine and the screens read is present and well-formed.

| Field | Example (fictional) | Source of truth | Owner | Read by | Real TED-based version needs |
|---|---|---|---|---|---|
| `id` | `hoh-security` | `data.js` | Static | routes `#/t/:id`, state | A stable id per notice, surviving corrections (corrigenda) |
| `title` (English) | IT security audit and hardening for district administration | `data.js` | AI-read (translated) | cards, detail | Translation of the notice title, or the notice's own translation where one exists |
| `original` (source-language title) | IT-Sicherheitsaudit und Härtung der Kreisverwaltung | `data.js` | AI-read | detail (with its `lang`) | The notice title as published |
| `buyer` | Landkreis Hohenau (fictional) | `data.js` | AI-read | cards, detail, sheets, re-score card, always without "(fictional)" (the fictional-data line covers it) | The buyer name from the notice. The "(fictional)" suffix goes |
| `country` | `DE` | `data.js` | AI-read | detail ("Landkreis Hohenau · Germany") | Country of the place of performance, not only the buyer's |
| `language` | `de` | `data.js` | AI-read | loading line "Reading 64 pages (German)…", sheet "Original (German)", effort heuristic | Language of the procurement documents, which can differ from the notice |
| `value` (€) | 95000 | `data.js` | AI-read | cards, detail; engine size fit (20 points) | The estimated value when the notice gives one. A rule for when it doesn't (today a missing value would silently score as too large: 5 of 20 size points), and currency conversion |
| `deadline` (ISO date) | 2026-11-27 | `data.js` | AI-read | days left, time points, Closed | The deadline for receipt of tenders with its time and time zone (the prototype uses the date only) |
| `cpv` (codes) | `72150000` | `data.js` | AI-read | engine sector fit (40 points, first two digits only) | All CPV codes of the notice and its lots. Matching finer than the two-digit division |
| `pages` | 64 | `data.js` | AI-read | loading line, the Feed's pages line (777 in total) | The real page count of the downloaded documents |
| `doc` (document name) | Vergabeunterlagen | `data.js` | AI-read | every citation | The file name or title of each document in the pack (often several files) |
| `photo` | `t-audit` | `data.js` (display only) | Static | detail photo block | Nothing: notices carry no photos. A neutral per-sector image or none |
| `requirements[]` | 3 lines | `data.js` | AI-read | engine, checklist, sheet | §2 below |
| `ai.summary` | Audit 400 workstations… | `data.js` | AI-read | "In short" | A grounded summary, each claim traceable to a page |
| `ai.qa[]` (question, answer with page) | Can we subcontract the audit? | `data.js` | AI-read | "Ask this tender" | Free-text questions answered from the pack with page citations (the prototype has a fixed list per tender) |

Not in the prototype, needed for real: lots (a pack can have several, each with its own requirements and value), the procedure type, the award criteria and their weights, the buyer's question deadline, corrections to the notice (each one should re-run the check), and the link to the documents (which often sit on a national platform, sometimes behind a registration).

## 2. Requirements

### 2.1 Requirement types and the rule for each
The six typed requirements, plus a catch-all. The status words are in §3.

| Type (`type`) | What is read (`value`) | Rule in `engine.js` | Possible statuses | Real version needs |
|---|---|---|---|---|
| Turnover (`min_turnover`) | Minimum annual turnover in € | Below the minimum → Fails | Meets, Fails | Is it the yearly turnover or a three-year average? In the sector or in total? Currency conversion |
| References (`min_references`) | Number of comparable references | Short by 1 → Risk; by 2 or more → Fails | Meets, Risk, Fails | The time window ("last 3 years"), what "comparable" means, minimum contract values. A profile that stores references with dates and values |
| Certificates (`certification`) | Certificate name; `subcontractAllowed` | Missing → Fails, or Risk if subcontracting is allowed | Meets, Risk, Fails | Equivalents ("or equivalent"), expiry dates, who must hold it (bidder, every consortium member, or the staff) |
| Bid language (`language`) | Language code | Not in the profile → Risk | Meets, Risk | Several accepted languages; the language of the documents vs the language of the bid |
| Place of delivery (`region`) | Country code | Not a home country → Risk with cross-border on, Fails with it off | Meets, Risk, Fails | Regions finer than countries (NUTS codes), several places, remote delivery |
| Site visit (`site_visit`) | Date and time | Always → Risk | Risk | The date in the owner's calendar (T6), a "visit optional" variant |
| Anything else (`other`) | The AI's `note` | → Risk, with the note | Risk (or Needs your check when unsure) | More typed rules as they recur: insurance cover, staff qualifications, the standard exclusion grounds, security clearance, bid bonds |

Any line read with confidence under 0.7 is **Needs your check** first, whatever its type, until the owner answers it. An answer (`overrides[tenderId][reqId] = 'pass' | 'fail'`) wins over every rule. Locked by `tests/engine.test.js` and `tests/engine-invariants.test.js`.

### 2.2 Per-requirement fields
| Field | Example (fictional, Hohenau r3) | Source of truth | Owner | Shown as | Real version needs |
|---|---|---|---|---|---|
| `label` | Staff with "comparable qualification" | `data.js` | AI-read | the line's title | A short, plain-English label per line |
| `src` (original sentence) | Das eingesetzte Personal verfügt über eine vergleichbare Qualifikation. | `data.js` | AI-read | the quote on the sheet, with its `lang` | The exact sentence, verbatim, never paraphrased |
| `tr` (translation) | The deployed staff hold a comparable qualification. | `data.js` | AI-read | under the quote | Translation into the owner's language (the prototype translates into English only) |
| `highlight` (decisive phrase) | eine vergleichbare Qualifikation | `data.js` (display only) | AI-read | underlined and bold in the quote | Must be a substring of `src` (already checked by `tests/engine.test.js`) |
| `cite` (page and section) | p. 14, §3.4 | `data.js` | AI-read | "Vergabeunterlagen, p. 14, §3.4" on the line, the sheet and in answers | The page inside the right file of the pack. The page must exist (already checked by `tests/data-check.js` against `pages`) |
| `confidence` | 0.58 | `data.js` | AI-read | "58% sure. Only you can answer." and "58% AI confidence" | **Calibration.** The 0.7 threshold only means something once the model's confidence has been measured against lines checked by people |
| `note` | Wording is vague: may mean a named certificate… | `data.js` | AI-read | for `other` lines | The AI's reason in one sentence |
| `subcontractAllowed` | `false` | `data.js` | AI-read | turns a missing certificate into a Risk | The pack's actual subcontracting and consortium rules |

## 3. Verdict and status wording

| Content | Words on screen | Source of truth | Owner | Real version needs |
|---|---|---|---|---|
| Verdicts | ● Go · ▲ Maybe · ■ No-go · Closed: always shape + word, never colour alone | words: `engine.js` `VERDICT_LABEL`; shapes: `app.js` `SHAPE` | Engine | Nothing new |
| Verdict rule and score 0–100 | the number in the score tile; Go ≥ 70 with no fail, no open check, at most one risk; any fail → No-go capped at 25; deadline day or later → Closed, 0 | `engine.js` (`evaluate`) | Engine | Weights and thresholds set by evidence, not by the prototype's guesses |
| Requirement statuses | ● Meets · ▲ Risk · ◆ Needs your check · ■ Fails, in the order Fails → Needs your check → Risk → Meets | `app.js` `STATUS` on the engine's `pass / risk / review / fail` ([`CLAUDE.md` §11](../../CLAUDE.md#11-decisions-log-session-of-2-nov-2026-agreed-with-the-team-before-building) item 2) | Engine (status), static (words) | Nothing new |
| Line kind | Turnover · References · Certificate · Bid language · Place of work · Site visit · Unclear wording · Knock-out · Your answer | `app.js` `KIND` | Static | One kind per new typed rule |
| Line note | "Needs €5M turnover, you have €3.2M", "Short by 1 reference. A consortium partner could close the gap" | `engine.js` `checkRequirement` | Engine | Nothing new |
| Reason line (detail) | "Short by 1 reference · mandatory site visit", "Meets all 4 requirements" | `engine.js` `reasonLine` | Engine | Nothing new |
| Headline (detail) | "1 knock-out requirement: you don’t hold ISO 27001. One more needs your answer." | `engine.js` `headline` | Engine | Nothing new |
| Feed counts | "All 6 · ● Go 1 · ▲ Maybe 2 · ■ No-go 3"; on Company "1 Go · 2 Maybe · 3 No-go" | `app.js` on `engine.js` `rank` | Engine | Nothing new |
| Feed pages line | "Thu 5 Nov · read 777 pages in 4 languages · Simulated AI" | `app.js` from `data.js` (sum of `pages`, distinct `language`, `DEMO_TODAY`) | Engine-style count over AI-read data | The real count of documents read overnight |
| Unlock hints (Company) | "Turn on → Gemeente Vlietdam becomes ▲ Maybe", "Unlocked Landkreis Hohenau · ● Go · 25 → 100" (muted text, the verdict as shape + word; one per lever, each language its own) | `app.js` on `engine.js` `whatIf` | Engine | Nothing new |
| Re-score card | "Landkreis Hohenau · 25 → 90 · No-go → Maybe · just now"; "Change anything below / Every tender re-scores at once."; "Re-scored 6 tenders. No verdict changed." | `app.js` on `engine.js` `diff` | Engine (change), static (frame) | Nothing new |
| Toasts | "Answer saved · now No-go" (Undo), "Saved to Bids" (View), "Skipped. Reason saved." (Undo), "Restored to Deciding"; each goes at once when you leave the screen that raised it or open a sheet over it | `app.js` | Static on engine output | Nothing new |
| Effort estimate | computed (hours), **not shown** since the 4 Nov declutter (item 59) | `engine.js` `evaluate().effortHours` | Engine (labelled unvalidated heuristic) | Evidence from interviews before it is ever shown |

## 4. Company profile fields

`data.js` → `PROFILE` is the fictional demo firm. On Welcome the AI drafts it from the website (`ai.js` `draftProfile`, simulated); the owner confirms it ("Looks right") or edits it on Company. It is stored in `tenderscout.v2` → `profile`.

| Field | Demo value (fictional) | Engine input? | Editable on Company? | Owner | Real version needs |
|---|---|---|---|---|---|
| `name` | Nordlicht Netzwerk GmbH (fictional) | no | no | AI-read, confirmed by the owner | The real firm, from the website or a company register |
| `city` | Leipzig, DE | no | no | AI-read | — |
| `staff` | 24 | no | no | AI-read | Could feed a size rule (SME definitions) |
| `turnover` | €3.2M | yes (turnover rule) | yes (€ millions field) | AI-read, then owner | Per-year figures for the last three years |
| `references` | 4 | yes (references rule) | yes (stepper) | AI-read (from past award notices), then owner | A list of references with buyer, date, value and sector, not a count |
| `certifications` | ISO 9001 | yes (certificate rule) | yes (switches for ISO 9001, ISO 27001, VCA, ISO 14001 from `CERT_OPTIONS`) | AI-read, then owner | Any certificate, with its expiry date |
| `languages` | German, English | yes (bid-language rule) | yes (switches for German, English, Spanish, French, Dutch) | AI-read, then owner | All 24 EU languages |
| `countries` | Germany, Austria | yes (place-of-delivery rule) | no | AI-read | Regions, not only countries |
| `crossBorder` | on | yes (place-of-delivery rule) | yes (switch "Bid outside Germany and Austria") | Owner | — |
| `cpv` (sector divisions) | 32, 45, 51, 72 | yes (sector fit, 40 points) | no | AI-read | Editable sectors, finer codes, and the `sectorsLabel` words derived from them |
| `sectorsLabel` | Network cabling, Wi-Fi installation, IT support | no (display) | no | AI-read | — |
| `minValue` / `maxValue` | €50k / €1.5M | yes (size fit, 20 points) | no | AI-read | Editable, and evidence for the right defaults |

## 5. Skip reasons

| Content | Words on screen | Source of truth | Owner | Real version needs |
|---|---|---|---|---|
| Skip sheet | "Why skip this one?" · "Reasons tune tomorrow’s feed. Skipping without one is fine." · "Skip tender" | `app.js` | Static | The tuning the copy promises (see the note) |
| Reasons (any number, or none) | Too big for us · Missing a certificate · Wrong region · Not enough time · Price-only · Other | `app.js` `SKIP_REASONS` | Static (list), Owner (choice) | Reasons from the interviews, not from the brief |
| Stored | `tenderscout.v2` → `skipped[id] = { reasons, at }`, shown under Bids → Skipped | `app.js` | Owner | Per-firm storage on a server, with consent |

Note: the reasons are stored but **do not change the ranking yet** ([`docs/NAVIGATION.md`](../NAVIGATION.md#screen-list) screen S5b: "Feeds tomorrow's ranking (future)"). The line "Reasons tune tomorrow’s feed" describes the intended product, not what the prototype does. Changing that copy would change app bytes, so it is not done here.

## 6. Mandatory disclosures

These stay visible as plain text ([`CLAUDE.md` §7](../../CLAUDE.md#7-non-negotiables-course-rules-and-honesty) items 1, 3 and 4). `tests/data-check.js` checks them statically and `tests/smoke.js` on the rendered screens.

| Disclosure | Where | Source of truth | Real version |
|---|---|---|---|
| "Simulated AI" | reading screen, profile check, the Feed's pages line, tender loading and detail header, "In short", "Ask this tender", requirement sheet | `app.js` `ai()` | Becomes a label for content a model read ("Read by AI · check the source"), and is kept wherever a model wrote something |
| "All companies and tenders are fictional" | Feed, tender detail, Bids (`fiction()`); "Prototype · all companies and tenders are fictional" on Welcome; "Re-scoring is plain rules, not AI. All companies and tenders are fictional." on Company | `app.js` | Goes away with real data. The "plain rules, not AI" half stays |
| "(fictional)" after every company and buyer name | in the data on every name; on screen on the company name (profile card, Company). Buyer names are shown bare everywhere, covered by the fictional-data line ([`CLAUDE.md` §11](../../CLAUDE.md#11-decisions-log-session-of-2-nov-2026-agreed-with-the-team-before-building) item 8) | `data.js` (checked by `tests/data-check.js`) | Goes away with real data |
| About: four statements | "AI output is simulated" · "The decision logic is real code" · "Real and fictional data" (real: the decision rules, the 45 EU sector divisions, the countries and languages; fictional: every company, buyer, tender, page number and quote) · "Built with AI assistance" ("The team ran the surveys and made the product decisions.") | `app.js` `about()` | A statement on what the AI does and does not decide, plus a line that the owner stays responsible for the bid decision (ASSUMPTION: wording to be checked) |

## 7. Onboarding, empty, error and offline copy

All static copy in `app.js`, except where noted.

| State | Words on screen | Route |
|---|---|---|
| Sign in (demo, pass 8) | "Sign in to TenderScout" · "Your verdicts, answers and saved tenders, on this phone." · "Email" with `demo@example.com` (read only) · "Sign in" · "Sign up" · "Demo sign-in: no password, no account is created, and nothing leaves this phone."; on Settings → Account: "Signed in as demo@example.com, a demo sign-in…" · "Sign out" | `#/signin`, `#/settings` |
| Welcome | "Find public tenders you can actually win" · "New EU tenders, read overnight in any language. Each answer cites its page." · "All 45 EU sectors · 6 new tenders tonight" (both numbers computed from `data.js`) · "Company website" · "Draft my profile" | `#/welcome/1` |
| Reading | "Reading your site, references and certificates…" · steps from `ai.js` ("Reading <site>", "Finding public contracts you delivered", "Checking certificates", "Drafting your profile") · "Found so far" · "About 20 seconds" | `#/welcome/2` |
| Check your profile | "Check your profile" · "Drafted from <site>. Fix anything that’s off." · "Sources: <site>, 18 pages, N award notices (fictional)" · "Edit" / "Looks right"; on Company before onboarding, "Save and see my feed" | `#/welcome/3`, `#/company` |
| Tender loading | "Reading N pages (language)…" with progress | `#/t/:id`, first open per session |
| Empty Feed (everything skipped) | "Nothing new tonight" · "You skipped every tender. Restore any of them from Bids." · "Widen your profile"; title "No open tenders" when none is open | `#/feed` |
| Empty filter | "No Go tenders tonight." · "Show all" | `#/feed` |
| Empty Bids | "No bids yet" · "Save a tender from the Feed and it lands here." · "Open Feed"; empty stage "Nothing here yet"; sub line "Nothing saved yet" | `#/bids` |
| No certificates | "None yet" | `#/welcome/3` |
| Closed tender | headline "The deadline passed on 4 Dec. You can’t bid on this one any more." (`engine.js` `headline`) · "Closed tenders can’t be saved" | `#/t/:id` with `?today=` |
| Offline | "Offline. Showing last night’s results." | Feed and detail |
| Not found | "Page not found" · "That link matches no screen in TenderScout." · "Open Feed" | any unknown route |
| Reset | "Reset the demo? This clears your profile, answers, saved and skipped tenders." | `#/about` |
| Unexpected error | none on `main` today. A "Something went wrong" screen with one Restart button is proposed in the open overnight pull request C1 (`overnight/c-1-error-fallback`, not merged) | — |

Real version needs: copy for states the prototype never reaches. Examples: a night with no new tenders at all (not "you skipped every tender"), a pack that could not be downloaded or read, a reading that failed halfway, a notice that was corrected or withdrawn after the check, a sign-in, and a payment that failed.

## 8. Beyond the prototype: what a real TED-based version needs

In one list, from the tables above:
1. **Ingestion:** new notices every night from TED (and national portals for tenders below the EU thresholds), plus the documents behind each notice, which are often on a separate platform.
2. **Reading:** a model that extracts requirements with the verbatim sentence, the file, page and section, a translation, and a confidence that has been **calibrated** against lines checked by people, so that 0.7 means what the UI says it means.
3. **More typed rules** as recurring requirements show up (insurance, staff qualifications, the standard exclusion grounds, bid bonds), each with tests like today's six.
4. **A richer profile:** references as records, certificates with expiry dates, turnover per year, regions, editable sectors and contract-size window.
5. **Lots, corrections and deadlines with times**, each one re-running the check.
6. **Per-firm storage and accounts** (today everything lives in the phone's `tenderscout.v2`), consented event logging for the metrics in [`BRIEF.md`](../../BRIEF.md#product-objectives-and-success-metric), and a privacy statement.
7. **Copy for real failure states** (§7) and a responsibility line on every verdict.

None of this is built. Each item's priority waits for the evidence in [`evidence.md`](../../evidence.md).
