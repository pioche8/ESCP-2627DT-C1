# Council, pass 2 (6 Nov 2026): what to build before the 11 Nov feedback session

Step 3 of the pass. Mode: auto (the conductor answered the interview from the repository; no touchpoints), backend sequential (no agent teams; each member kept its context across rounds), profile balanced. Members: Strategist, Advocate, Skeptic (the top three by score) and Operator (score 7, the auto-include line, because Vercel hosting was in scope either way). Three rounds: positions, two challenge pairs, converge. The full transcripts stayed in the session folder; this page is the record. The architecture read it used: [`2026-11-06-pass-2-deepen.md`](2026-11-06-pass-2-deepen.md).

## The question

Which three to five independently shippable slices give the strongest TenderScout for the DPD online feedback session (Wed 11 Nov) and the end-of-term submission, where the lecturer grades the persona, HMW statements, user journey, flows, user stories and the working prototype? Candidates: (a) DPD artefacts traced to evidence, (b) the site live on Vercel, (c) a German locale, (d) a north-star event counter plus a pricing-screen test, (e) a real TED tender read by a real model, (f) deepening refactors.

Constraints the council could not move: the demo numbers (Hohenau No-go 25 → Maybe 90 → Go 100); teammate tasks T1–T10 (T8 traceability, T9 persona + HMW, T10 journey); no invented interviews, quotes or personas (`evidence.md` logs 0 interviews and 1 survey answer); `CLAUDE.md` §4–§7.

## Overview of the outcome

Persona, HMW and journey are teammate tasks that wait for interviews, so the graded work left for this pass is flows, user stories and the prototype, and the flow and story documents no longer match the five-tab app (`docs/NAVIGATION.md` says four tabs, `docs/design/UX_PLANES.md` three; no story covers the 5 Nov features). The council chose five slices, four of which change no app bytes: hosting (S1), the flows and stories brought up to date behind a docs check (S2), ADR-0002 for the real-model idea as "Proposed, not built" (S5), the interview kit's "what each answer feeds" (S3), and one small app change, an export-only test-session log for moderated tests (S4). Cut: the German locale, the pricing screen, any runnable model route, and the larger refactors.

## Scoring (Strategist, round 1; reach = how many of the six graded items a slice moves, effort in days)

| Candidate | Reach | Impact | Confidence | Effort | RICE | Risk | Call |
|---|---|---|---|---|---|---|---|
| a Flows, stories, docs check | 2.5 | 2 | 80% | 1 | 4.0 | Low | Build (S2, S3) |
| b Vercel + `SITE_URL` | 0.5 | 1 | 50% | 1 | 0.25 | Low | Build (S1, required by the brief) |
| c `?lang=de` | 1 | 0.5 | 50% | 5 | 0.05 | High | Cut |
| d1 North-star log | 1.5 | 1 | 50% | 2 → 1 (export-only) | 0.38 → 0.75 | Medium | Build (S4) |
| d2 Pricing screen | 0.5 | 0.5 | 20% | 2 | 0.03 | Medium | Cut |
| e Real tender, real model | 1 | 2 | 20% | 5 | 0.08 | High | Paper only (S5) |
| f1 Site-copy CI check | 0.5 | 1 | 100% | 0.25 | 2.0 | None | Inside S1 |
| f3 Chance-to-win tests | 1 | 0.5 | 80% | 1 | 0.4 | Medium | Deferred |
| f2, f4–f7 | ≤ 0.5 | ≤ 0.5 | – | 1–5 | < 0.1 | Medium–High | Deferred |

## Risk assessment (Skeptic, round 1, abridged)

| Candidate | Failure | Mitigation agreed |
|---|---|---|
| a | A persona, HMW or journey written from S1 alone (n = 1) reads as research and takes T9/T10 from the teammates | None written; method only (S3); a docs check that fails on any cited interview not logged in `evidence.md` (S2) |
| b | A preview URL behind Vercel Authentication is shared with the lecturer; the app copy misses a file; the site's engine copy drifts | Only production URLs are shared; an allowlist that fails closed and a byte-identity test; `sync-shared --check` in CI |
| b | `APP_URL` moved to Vercel: the film link (`APP_URL + marketing/`) breaks, and the rehearsed state lives on the Pages origin | `APP_URL` stays on Pages until an iPhone rehearsal on Vercel and a separate `FILM_URL` |
| c | German overflows the 320 px tab bar (precedent: item 84); stage and skip labels are stored keys; the translations become German → German | Cut |
| d | A visible counter reads as analytics next to "no data leaves your phone"; rehearsal numbers end up in `evidence.md` | Export-only, labelled, cleared by reset; never into `evidence.md` without a logged session |
| d2 | Labelled, a price page measures nothing; unlabelled, it is a false offer | Cut; H4 is asked through the interview kit (questions 10, 12, 13) |
| e | A build session cannot amend §7.2; an open route is a cost risk; tender text is a prompt- and markup-injection surface (`app.js` interpolates `t.id` and `t.photo` raw) | ADR "Proposed, not built" with the preconditions |

## Tension resolutions

| Tension | Agents | Resolution | Reasoning |
|---|---|---|---|
| A visible counter on Settings vs export-only | Advocate, Strategist ↔ Skeptic | Export-only: one secondary button on Settings → Demo, the count only in the copy result | Advocate and Strategist moved to export-only in round 2 (a visible "this week" number reads as analytics and implies a weekly habit S1 does not have); the Skeptic's seven conditions apply to the log and its text |
| The toast says "Copied" even without a clipboard | Skeptic (round 3) | The toast reports the outcome; on failure the log shows as selectable text | Saying "Copied" when nothing was copied is the same kind of honesty failure the pass avoids |
| An evidence gap list per persona field vs "write none" | Advocate ↔ Skeptic | Method only: `docs/INTERVIEW_KIT.md` §8, question → hypothesis → the field it feeds; no answers, no S1 data, no PERSONA.md or JOURNEY.md | A status column with S1 signals would pre-write T9 from n = 1 |
| (e): a deferral paragraph vs an ADR plus `validateTender()` | Strategist ↔ Skeptic | ADR-0002 "Proposed, not built"; no validator | `tests/data-check.js` is already the contract; a validator in `engine.js` would change its bytes (and the generated model's engine hash and the site's copies) for nothing |
| Shell build command vs a node script for the app | Operator ↔ conductor | The tested node script in `vercel.json`; the Operator's shell allowlist in Project Settings for commits that predate `vercel.json` | The script also fails on an unresolved reference; the shell line keeps a force-push rollback safe on Vercel |
| The ignore step's exit codes | Operator (round 3, blocker) | `… || exit 1` on both | Vercel documents only 0 and 1; git exits 128 for a SHA missing from the shallow clone |
| A rollback branch for 11 Nov | Skeptic, Operator ↔ Strategist | `release/v2-feedback` is cut by the team on Tue 10 Nov after the iPhone rehearsal, not by this pass | An unrehearsed freeze point is not a safe rollback |

## Decision log

| Decision | Options considered | Chosen | Reasoning |
|---|---|---|---|
| Slices | a–f | S1 Vercel (b + f1), S2 flows + stories + docs check (a), S3 interview kit §8 (a), S4 export-only test log (d1), S5 ADR-0002 (e on paper) | Grade impact per unit of demo risk; four of five change no app bytes |
| Order | – | S1 → S2 → S5 → S3 → S4; S2 does not wait for S1 | S1 waits on a human import click; S4 is the only slice that needs a re-rehearsal |
| German locale | build / defer | Cut for this term | About 300 strings, stored label keys, the 320 px overflow, and it confuses the product's language promise (the tenders, not the UI) |
| Pricing screen | build / cut | Cut | Collects polite hypothetical yeses; H4 holds only when someone names a cost or pays today |
| Real model | build off / ADR only | ADR-0002, Proposed | Unverifiable here and needs a rule change only the team and the lecturer can make |
| Deepening | items 1–7 | Item 1 inside S1; the rest deferred | Every other item changes app bytes for no graded gain |
| App-byte freeze | – | S4 merges by Mon 9 Nov 12:00 or waits; app bytes freeze Mon 9 Nov 18:00 | Leaves Tuesday for the iPhone rehearsal and the backup recording |

## Plan (one GitHub issue per slice, label `pass-2`)

Quality gates for every slice: `npm run preflight` all green (engine tests, insights tests, data check, demo pins, invariants, declutter scan, AA audit, generated files in sync, the site copies, the Vercel app build, `tests.html`, smoke at 390×844 / iPhone 13 / iPhone SE in dark, light and reduced motion, the site's lint / typecheck / build and its audit), CI `check` and `smoke` green, and the PR says whether the deployed app bytes change.

- **S1 Vercel hosting.** Both `vercel.json` files, `scripts/vercel-app-dist.js`, `tests/vercel-dist.test.js`, `sync-shared --check`, ADR-0001, `docs/DEPLOY.md`. Acceptance: the app build holds exactly the allowlist, byte-identical; every reference resolves; both ignore steps fail open and end in `|| exit 1`; commands ≤ 256 characters; CI runs both checks; Pages untouched; the import steps written out because project creation is refused (HTTP 403).
- **S2 Flows, IA and stories.** `docs/NAVIGATION.md` (five tabs, Profile shows and Company changes, the morning notification as an entry point, a Win/loss flow, Mermaid with error branches that name their proof: `?offline=1`, `?today=`, the error fallback), `SKELETON.md` (five tabs, the missing wireframes), the UX planes IA row, `docs/design/USER_STORIES.md` US11–US15 ("team request, no hypothesis tested" where true; each criterion names a check or says "not locked by a test"), and `tests/docs-check.js` in CI: every `parse()` route appears in `NAVIGATION.md`, every smoke check a story names exists, every "Interview N" cited in `docs/design/` is a filled row in `evidence.md` §1, and every quoted sentence in `docs/design/` exists in `evidence.md`. No app bytes.
- **S3 Interview kit §8.** "What each answer feeds": one row per kit question with the hypothesis it tests and the T8/T9/T10 field it fills; the questions S1 left open for the call. No answers, no S1 values, no new persona or journey file. No app bytes.
- **S4 Export-only test-session log.** An additive `log` in `tenderscout.v2` (key not bumped; empty in `fresh()`, cleared by `?demo=reset` and Reset demo; the golden state pin updated; capped at 500 events), events on open, save, skip and answer with real-clock times since the reset, each tender counted once (Undo, Restore and re-saves do not inflate it); the arithmetic in `insights.js` (pure, node-tested) on `BRIEF.md`'s metric definitions, the seconds-to-first-Go suppressed under `?demo=fast`; Settings → Demo, under Reset demo: a 44 px secondary button "Copy test-session log", the caption "For a moderated test on this phone. Not analytics: nothing is sent, and Reset demo clears it.", a toast that reports the outcome ("Copied · N decisions on this phone", or "Could not copy" with the log shown as selectable text); the exported text carries the caption; no count anywhere else; smoke checks for all of it; the 7-step path and the golden pins unchanged. App bytes change: re-rehearse.
- **S5 ADR-0002.** "Proposed, not built": where the route would live, the flag, the Production-only key and spend cap, `tests/data-check.js` as the contract, the preconditions (the lecturer and the team on §7.2, an escaping audit), and the question for 11 Nov; a CI guard that fails on any `site/src/app/api/` route or an `sk-` key pattern. No app bytes.

Not generated: the engine's BDD stub files. Stubs that throw would turn this repository's CI red by design; the acceptance criteria live in the issues and are checked by the existing gates and the new checks each slice adds.
