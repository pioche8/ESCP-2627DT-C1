# Claude Code handoff: TenderScout prototype

> Put this file in the repo root (you can rename it to `CLAUDE.md` so Claude Code loads it automatically). Put the new **`DESIGN.md`** next to it.
> **`DESIGN.md` is the only source of truth for visual design.** Ignore every colour, font, spacing and component style in the existing `styles.css` and in the old design brief. They are superseded.

## 1. Context
- **Course:** ESCP Digital Transformation (MG34), Digital Product Design module. Group C workshop **Thu 5 Nov 2026, 09:00**. Lecturer: David Lehmann (GitHub `@drdml`).
- **Repo:** `ESCP-2627DT-<team>`, public, deployed with GitHub Pages from `main` / root.
- **Goal for this session:** restyle and extend the existing working prototype to match `DESIGN.md`, without breaking the decision logic or its tests.

## 2. Product (what must stay true)
TenderScout reads new EU public tenders in any language and tells the owner of a 5–50 person firm, on their phone, **Go / Maybe / No-go**, with a 0–100 fit score. Each requirement cites the page and original sentence that proves it.
- **Users:** owner or managing director of a small firm selling to the public sector. One hand, short sessions, plain language.
- **Core promise:** "Can we even bid on this?" answered in under 60 seconds, with proof.
- **Split of responsibility (keep it):**
  - **AI** (simulated in `ai.js`): reads tender packs, extracts requirements with citations and confidence, translates, answers questions, drafts the company profile.
  - **Plain code** (`engine.js`): decides knock-outs, score and verdict. It is deterministic and tested.

## 3. Current codebase (working, tested)
```
index.html          shell; loads engine.js → data.js → ai.js → app.js as classic scripts (works from file:// too)
styles.css          OLD visual design → replace per DESIGN.md
app.js              UI rendering + hash router + event delegation + state/localStorage
engine.js           REAL decision logic (UMD: window.Engine in browser, module.exports in node)
data.js             FICTIONAL demo company + 6 fictional tenders (window.DEMO / module.exports)
ai.js               SIMULATED AI layer (promises with delays, pre-written output)
tests/engine.test.js   node tests: `node tests/engine.test.js` (the original 14 + 10 added on 2 Nov = 24)
tests/smoke.js         Playwright smoke test, 390×844, light + dark (added 2 Nov; dev-only)
tests.html          runs the same tests in a browser via a small require/assert shim
BRIEF.md, evidence.md, docs/INTERVIEW_KIT.md, docs/NAVIGATION.md   project docs (don't restyle, keep content)
```
No build step and no dependencies. Keep it that way unless `DESIGN.md` truly needs something. If it does, use CDN-free, vendored assets only, and it must still run from GitHub Pages and `file://`.

## 4. Engine rules (do not change behaviour; tests lock these)
- Per-requirement status: `pass | risk | fail | review`.
  - AI `confidence < 0.7` → `review` (never pass) unless the user confirmed it (`overrides[tenderId][reqId] = 'pass'|'fail'`).
  - `min_turnover`: below → `fail`.
  - `certification`: missing → `fail`, or `risk` if `subcontractAllowed`.
  - `min_references`: short by 1 → `risk`, by 2+ → `fail`.
  - `language`: not in profile → `risk` (adds 10 h of effort).
  - `region`: not a home country → `risk` if `crossBorder`, else `fail`.
  - `site_visit` → always `risk`.
- Score = sector fit 40 (CPV division overlap) + size fit 20 + requirements 30 (pass 1, risk 0.5, review 0) + time 10 (≥21 days: 10, ≥10: 5, >0: 2).
- Verdict:
  - deadline day or later (days left ≤ 0) → `closed` (score 0)
  - any fail or no sector match → `nogo` (score capped at 25)
  - score ≥ 70, no review and ≤ 1 risk → `go`
  - otherwise `maybe`
- Ranking: go → maybe → nogo → closed, then by score, then by days left.
- Demo "today" is fixed at `2026-11-05` (`DEMO.DEMO_TODAY`) so the demo is stable.
- The effort estimate is a labelled, unvalidated heuristic.

If a design change needs new engine output (e.g. a "what would flip this" hint), **add** functions and tests. Don't alter existing return shapes without updating `app.js` and the tests.

## 5. Routes and screens (keep the information architecture; apply DESIGN.md visuals)
| Route | Screen | Must keep |
|---|---|---|
| `#/welcome/1` | Welcome + website input | "Draft my profile" → simulated AI |
| `#/welcome/2` | Reading (transient) | replaced in history (`location.replace`) |
| `#/welcome/3` | Check AI-drafted profile | Edit / Looks right |
| `#/feed` | Feed: summary counts, filters All/Go/Maybe/No-go, tender cards | skipped tenders hidden; "Saved" marker |
| `#/t/:id` | Tender detail: verdict, AI summary, qualification checklist (fails first), Ask this tender, Skip / Save | first open shows "Reading N pages (lang)…" |
| `#/t/:id/req/:rid` | Requirement bottom sheet: status, confidence %, citation, original sentence + translation, We meet it / We don't, Undo | sheet is its own history entry; Back, Escape and scrim tap close it to the parent |
| `#/t/:id/skip` | Skip-reason sheet | reason saved, toast, back to Feed |
| `#/bids` | Deciding / Bidding / Submitted + Skipped (Restore) | stage switcher |
| `#/company` | Profile levers: turnover, references stepper, certificate toggles, languages, cross-border | live re-score + delta banner "Hohenau: No-go → Go" (**hero demo moment**) |
| `#/about` | AI disclosure, demo-data notice, Reset demo | reachable from header ⓘ |

- Bottom tabs: Feed / Bids / Company. They are hidden during onboarding.
- Before onboarding, any route except welcome, company or about redirects to `#/welcome/1`.
- Unknown route → Not found with a link to the Feed.
- If `DESIGN.md` changes the IA (tab names, screen order, new screens), follow `DESIGN.md`, update `docs/NAVIGATION.md` to match, and keep deep links and back behaviour working.

## 6. State
- One `localStorage` key, `tenderscout.v1`: `{ onboarded, profile, overrides, saved, skipped, filter }`. **Now `tenderscout.v2`** (since 2 Nov): `skipped[id] = { reasons: [], at }` and `theme` were added. All access goes through try/catch with an in-memory fallback (private mode).
- `?demo=reset` wipes state and returns to welcome.
- If the state shape changes, bump the key to `tenderscout.v2` rather than migrating.

## 7. Non-negotiables (course rules and honesty)
1. **"Simulated AI" label** stays visible on every screen that shows AI output. Styling follows `DESIGN.md`, but it must not disappear.
2. **No live AI calls and no API keys** in the repo (the site is public).
3. **All demo data stays fictional** and marked "(fictional)". Never add real company names as customers, and never put invented figures in `evidence.md`.
4. **The About screen** keeps its explanation: what is simulated, what is real code, that the data is fictional, and that the build was AI-assisted.
5. **Accessibility:** tap targets ≥ 44 px, verdicts never shown by colour alone (icon + label), contrast WCAG AA, `prefers-reduced-motion` and dark mode respected (unless `DESIGN.md` says otherwise for dark mode), sheets use `role="dialog"` + `aria-modal`.
6. **Mobile-first at 390 px**, max content width about 480 px on desktop, safe-area insets for the iPhone home bar.
7. **README → "AI use"**: append what Claude Code changed in this session.

## 8. Tasks for this session (in order)
1. Read `DESIGN.md` fully. List any conflict with sections 4–7 and ask before resolving it.
2. Replace `styles.css` with the `DESIGN.md` system: tokens (colour, type, spacing, radius, elevation) as CSS custom properties, light and dark.
3. Update the markup in `app.js` render functions to the `DESIGN.md` components (verdict chip, tender card, requirement row, quote block, bottom sheet, tab bar, toggle, stepper, banner, toast). Keep the `data-*` attributes the event handler relies on: `data-go`, `data-act`, `data-filter`, `data-confirm`, `data-ask`, `data-skip`, `data-stage`, `data-unskip`, `data-cert`, `data-lang`, `data-ref`, `data-field`, `data-stop`.
4. Add any new screens or states that `DESIGN.md` specifies (empty states, closed tender, loading).
5. Run `node tests/engine.test.js` (must stay 14/14, plus any new tests).
6. Run a Playwright smoke test at 390×844. Click through: welcome → profile → feed → detail → requirement sheet → "We meet it" → Company → toggle ISO 27001 → expect the banner "Landkreis Hohenau: No-go → Go" → feed → skip a tender → Bids. Expect no console errors, and screenshot each screen.
7. Check dark mode and the 75-second demo path (`BRIEF.md`) on the real flow.
8. Commit, then tag `v1-workshop` once the team confirms. (`v0-shell` must already exist from before the interviews. Don't move it.)

## 9. Acceptance criteria
- [ ] Visuals match `DESIGN.md`. No leftover old styles.
- [ ] Engine tests pass in node and in `tests.html`.
- [ ] Smoke test passes with zero console errors at 390 px, light and dark.
- [ ] Hero moment works: the ISO 27001 toggle flips Hohenau No-go → Go with a visible banner.
- [ ] Back, Escape and scrim close sheets; deep links `#/t/<id>` work after onboarding.
- [ ] "Simulated AI" and fictional-data labels are present. No API keys.
- [ ] Works from GitHub Pages and from opening `index.html` directly.
- [ ] README "AI use" updated.

## 10. Out of scope
Real tender ingestion (TED API), real LLM calls, accounts/login, push notifications, payments, bid-writing features. Mention them as "later" in docs only.

## 11. Decisions log (session of 2 Nov 2026, agreed with the team before building)
DESIGN.md vs §4–7 conflicts and how they were resolved:
1. **Verdict rule and score: the engine wins.** DESIGN.md §10 is not implemented. Hero moment = "We meet it" on Hohenau's "comparable qualification" line, then ISO 27001 → No-go → Go. ISO 27001 alone honestly shows No-go → Maybe.
2. **Status labels are UI-only:** pass → ● Meets (go), fail → ■ Fails (nogo), review → ◆ Needs your check (check), risk → ▲ Risk (maybe palette). Order fail → check → risk → met.
3. **Overrides stay per tender** (not on the profile).
4. **New engine output was added, not changed:** `reasonLine`, `headline`, `verdicts`, `diff`, `whatIf` (+10 tests). `evaluate()`/`rank()` return shapes are locked by a test.
5. **Dates:** the workshop is **Thu 5 Nov**. The Feed header comes from the fixed demo date ("Thu 5 Nov · read overnight"). `data.js` days-left are kept.
6. **Copy comes from data.js** ("1 of 3 met", "Reading 64 pages (German)…"), not from DESIGN.md's mockup numbers.
7. **data.js additions (ignored by the engine):** `tender.doc` (document name) and `requirement.highlight` (decisive phrase).
8. **Fictional labels:** bare buyer names on cards and in the re-score card; "All buyers and tenders are fictional" on Feed, Detail and Bids; "(fictional)" stays on the company name.
9. **Closed state** is shown with the test-only `?today=YYYY-MM-DD` parameter. No 7th tender.
10. **Skip reasons:** multi-select and optional; storage key bumped to `tenderscout.v2`.
11. **WCAG AA wins over DESIGN.md colours:** light `--v-ink-3` #6A6D73, dark `--v-nogo` #CF3A2E, dark `--v-check` #6650EE, dark `--v-brand` #3F5DF2. Closed cards dim only the score tile and status line.
12. **"Simulated AI" pill** also on the reading screen and the tender loading state.
13. Closed rule wording in §4 now matches the code (days left ≤ 0).
14. `v0-shell` is **not tagged** (team decision, 3 Nov). `evidence.md` §0 carries the TODO instead: tag `v0-shell` only if no interview happened before that commit. The as-received state is the first commit of this repository.

Smaller implementation choices: fonts are vendored (no CDN; preload links removed because Chrome blocks them on `file://`); the citation chip opens the requirement sheet (there are no PDFs); Restore moves a skipped tender to Deciding (DESIGN.md §5.08); vibration only works where `navigator.vibrate` exists (Android).

Design handoff v2, applied 3 Nov 2026 (`design/HANDOFF_V2.md` wins over DESIGN.md where they differ; engine and data still win over both):
15. **Palettes:** Sky (default) and Harbor from `design/explorations/v3-tokens.css`, scoped as `data-v3="light|dark"` + `data-palette="sky|harbor"` on `<html>`, set by an inline script in `index.html` before the first paint. Light/dark follows the phone unless About says otherwise. `palette` is persisted in `tenderscout.v2` (missing = Sky); About has a Sky / Harbor switch; `?palette=` is a demo deep link. The 2 Nov cobalt tokens remain as the fallback block only.
16. **WCAG AA over the pack's colours:** the adjusted tokens are listed at the top of `styles.css` (ink-3 in all four themes, the No-go red under white text, Harbor's brand under white text, Harbor's crimson dock pill). Translucent "glass" pills and circle buttons on colour blocks are dark glass under white text and light glass under dark text (Maybe, Sky brand, dark-mode Go). `scratch/contrast.py` was the check; result 0 failures in the four themes.
17. **Photos:** `tender.photo` (display-only field in `data.js`) for the four tenders that have one; the Dutch libraries and French support tenders show a document placeholder on the card band, the Bids thumbnail and no photo in the header. All six files are 200 px Canva previews and must be replaced under the same names.
18. **Maybe header photo at 20 %** (others 60 %): the amber header keeps dark text, and a 60 % multiplied photo would drop it below 4.5:1.
19. **Welcome v2 pill** reads "All 45 EU sectors · 6 new tenders tonight": 45 is the length of the CPV division list, 6 is the number of open tenders in `data.js`. The pack's "214 new tenders" is not in the data, so it is not shown. The preview card is the engine's own top result (Go 100, "Meets all 4 requirements", p. 23 · §4.2).
20. **`PROFILE.cpv` gains `'51'` (Installation)** so the band's bold sectors match the handoff's four. No tender carries a 51 code, so no score or verdict changes (the 24 engine tests prove it).
21. **Motion:** entrances (pop / rise with the handoff's delays) play once per screen load via `#screen.entering`; same-screen re-renders don't replay them. The 2 Nov re-score choreography (knob 240 ms, card remount 520 ms spring, tiles re-flex 400 ms, count-up 600 ms, pulse on the Feed) stays. Card → detail is a View Transitions morph (700 ms, `--ease-morph`) with a dashed ghost at the card's origin; feature-detected, plain hash change otherwise. Everything is off under `prefers-reduced-motion`, including the sector band.
22. **No new icons were needed:** every icon the app uses is in the 32-glyph subset, so the font was not re-cut.
23. **Design reference pages** (`design/*.dc.html`, `design/films/`) are the designer's prototypes and load React and Babel from unpkg; they are not part of the app. The films were rendered offline with local copies of those libraries driving `window.seek` through the stage's seek event.
24. **Still partial:** `evidence.md` and `docs/INTERVIEW_KIT.md` (the pack had no `restore/` folder).

## 12. Repository provenance (3 Nov 2026)
The 2 Nov session built everything in its own cloud container and never pushed. That container is gone, so this repository was rebuilt on 3 Nov from that session's transcript: every file was re-created from the recorded tool calls and checked against the recorded before/after snapshots; fonts were re-downloaded with the same commands; the engine tests (24) and the smoke test (114 checks, light + dark, `file://` and HTTP) pass as before. Later on 3 Nov the team's design pack restored `DESIGN.md` and added the v2 handoff under `design/` (`design/HANDOFF_V2.md` wins over `DESIGN.md` where they differ). Still to restore by the team from their own copies: `evidence.md` and `docs/INTERVIEW_KIT.md` (only the first 30 and 15 lines are original; both files end with a marked note). The design reference pages under `design/` (`*.dc.html`) are the designer's prototypes: they load React and Babel from unpkg, so they need internet; the app itself (`index.html`) stays CDN-free.
