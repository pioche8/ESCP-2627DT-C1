# Start here: TenderScout build day

For teammates who have never opened this repository. Ten minutes to read, one command to run.

The workshop version is frozen on the branch `release/v1-workshop` (the live app at https://pioche8.github.io/ESCP-2627DT-C1/ is `main`). Everything you build today goes on a branch and reaches `main` through a pull request, so the demo can never break by accident.

## 1. Run it (one command)

```
git clone https://github.com/pioche8/ESCP-2627DT-C1.git && cd ESCP-2627DT-C1 && python3 -m http.server 8000
```

Then open `http://localhost:8000/?demo=reset,fast`. In Chrome, press F12 → the phone icon → 390 × 844 (iPhone). On your own phone on the same Wi-Fi: `http://<your-laptop-ip>:8000/?demo=reset,fast`.

- There is no build step and nothing to install: the app is plain HTML, CSS and JavaScript. Opening `index.html` straight from Finder or Explorer also works.
- `?demo=reset` wipes the saved state (the app remembers your answers in the browser). `?demo=fast` makes the two simulated AI waits take 300 ms instead of 20 s.
- The demo "today" is fixed at Thu 5 Nov 2026, so days-left and verdicts never drift.

## 2. Where things live

| Path | What it is | Touch it when |
|---|---|---|
| `data.js` | The fictional company profile and the six fictional tenders (title, buyer, value, deadline, pages, requirements with the original sentence, its translation and the page, the "AI" summary and Q&A). Everything in it is invented and must stay marked "(fictional)". | You add or change a tender, a requirement or the profile. |
| `engine.js` | The real decision logic: knock-outs, fit score, Go / Maybe / No-go, ranking, reason lines, what-if. Deterministic, no AI, unit-tested. The rules are in [`CLAUDE.md` §4](../CLAUDE.md#4-engine-rules-do-not-change-behaviour-tests-lock-these). | You need a new engine output. Add a function and a test; never change what `evaluate()` and `rank()` return. |
| `ai.js` | The simulated AI: pre-written output after a delay. Nothing calls a model. | Almost never. |
| `app.js` | Screens, hash router (`#/feed`, `#/t/:id`, `#/bids`, `#/company`, `#/about`), bottom sheets, state in `localStorage` (`tenderscout.v2`). | You add a screen, a button or a state. Keep the `data-*` attributes the click handler reads. |
| `styles.css` | Components only. Every colour is one of the nine custom properties generated into `shared/tokens.css`. | You style something new. No hand-typed colours, no borders, shadows, gradients or radii over 8 px (`tests/declutter-scan.js` will tell you). |
| `shared/tokens.json` | The one source for colours, type, the radius, easing and durations, for the app and the website. `node shared/build-tokens.js` regenerates `shared/tokens.css`, `site/src/styles/tokens.css` and `site/src/generated/tokens.ts`; `node shared/check-contrast.js` audits WCAG AA. | You change a colour or a duration. Never edit the generated files. |
| `site/` | The marketing website (Next.js). It runs the app's `engine.js` on the app's `data.js` through copies in `site/src/generated/` (refreshed by `npm run sync`). Not deployed yet. | You change the website, or you changed `data.js` / `engine.js` / tokens and want the site to follow. |
| `tests/` | `engine.test.js` (24 node tests), `smoke.js` (Playwright click-through at 390 × 844, light + dark + reduced motion), `declutter-scan.js` (the 18 banned visual patterns), `demo-record.js` (the backup video), `live-check.js` (is GitHub Pages serving this checkout?). | Every commit (see §4). |
| `docs/` | `NAVIGATION.md` (routes, flows, states), `INTERVIEW_KIT.md`, `WEBSITE_BUILD_LOG.md`, `demo/` (the backup video and screenshots), this file. | You add a screen (update `NAVIGATION.md`) or a design document. |
| `docs/design/` | [`UX_PLANES.md`](design/UX_PLANES.md): Garrett's five planes (strategy, scope, structure, skeleton, surface) mapped to the files that cover each, with a status; `USER_STORIES.md` (from the brief, not from interviews yet); `CONTENT_REQUIREMENTS.md` (every piece of content, its source of truth and who produces it). T9 and T10 add `PERSONA.md` and `JOURNEY.md` here. | You log interviews (add their links to the stories and update the planes' status), or you finish T9 or T10. |
| `BRIEF.md`, `evidence.md` | The pitch and the 75-second demo script; the interview evidence and the gate. | After every interview. |
| `README.md`, `CLAUDE.md`, `DESIGN.md`, `design/` | Project overview and AI-use disclosure; the build handoff with the rules and the decision log; the visual spec and the designer's handoffs. | Read before you build. |
| `PRODUCT.md` | What the product is and is not: the job, the user, what each screen gives the owner, the verdict words, scope (real / simulated / later / not the product), what is known and what is assumed. | You explain the product, or you wonder whether a feature belongs in it. |
| `SKELETON.md` | Where things sit on each screen: the shared frame (header, tab bar, action bar, sheets), one text wireframe per screen, the navigation elements, the ordering rules and the controls. | You add or move something on a screen (update its wireframe in the same commit). |
| `UI_DESIGN.md`, `docs/ui/` | How it looks: the 7-frame demo storyboard, a screenshot of every screen and state in dark and light, the nine colours, type, shape, icons, motion and the look of each component. | You change how a screen looks (replace its screenshot in the same commit; §6 of the file says which smoke-test image it is). |
| `ARCHITECTURE.md`, `docs/HOW_IT_DECIDES.md` | One page with a diagram on how the pieces fit (data → engine → screens, tokens, state, URL parameters, gates, deploy and rollback) and, in §9, what is real and what is fictional; the decision model generated from the engine (`node shared/how-it-decides.js`, also the website's `/how` page). | You need the big picture, or you explain a verdict to someone. |

## 3. The rules (read, don't restate)

- Product, engine, routes, state, honesty and accessibility rules: [`CLAUDE.md` §2–§7](../CLAUDE.md). The non-negotiables in §7 (the "Simulated AI" label, fictional data, no API keys, 44 px tap targets, WCAG AA, dark mode and reduced motion) apply to every commit.
- Every decision already taken, and why: [`CLAUDE.md` §11](../CLAUDE.md#11-decisions-log-session-of-2-nov-2026-agreed-with-the-team-before-building). Check it before re-deciding something.
- Visual design: [`DESIGN.md`](../DESIGN.md), then [`design/HANDOFF_V2.md`](../design/HANDOFF_V2.md) and [`design/MOTION.md`](../design/MOTION.md) where they differ, then the 4 Nov declutter decisions (`CLAUDE.md` §11 items 53–68). The engine and the data win over all three.
- Navigation and states: [`docs/NAVIGATION.md`](NAVIGATION.md). What the product is and is not: [`PRODUCT.md`](../PRODUCT.md). How it is built: [`ARCHITECTURE.md`](../ARCHITECTURE.md). The rules as the code applies them: [`docs/HOW_IT_DECIDES.md`](HOW_IT_DECIDES.md).

## 4. Verify before you commit

One command runs every gate in order and prints one line per gate with pass / fail and the command to rerun it alone:

```
npm run preflight                # all gates (about 15 minutes with the three phone profiles, the site build and the site audit)
npm run preflight -- --quick     # the node-only gates CI's "check" job runs (two seconds)
```

The node-only gates, if you want them one by one (they run in CI on every push):

```
node tests/engine.test.js        # 24 tests (plus yours) must pass
node tests/insights.test.js      # 12 tests: the Win/loss insights arithmetic and its demo numbers (38 %, 6.8 %)
node tests/data-check.js         # data.js has every field engine.js and app.js read, ids unique, dates ISO, citations inside the document
node tests/demo-golden.test.js   # the live demo's numbers (Hohenau 25 → 90 → 100, 1 Go · 2 Maybe · 3 No-go, 777 pages); see §5.4 before you move them
node tests/engine-invariants.test.js  # seeded property test of the engine rules
node tests/declutter-scan.js     # 0 findings in the five stylesheets
node shared/check-contrast.js    # 0 failures (after node shared/build-tokens.js, if you touched shared/tokens.json)
```

If you changed `app.js`, `styles.css`, `data.js` or `index.html`, run the click-through too (needs Playwright and Chromium once: `npm i --no-save playwright && npx playwright install chromium`; `node_modules/` is ignored by git):

```
node tests/smoke.js                               # 390 × 844, dark + light + reduced motion, screenshots in screenshots/
SMOKE_DEVICE="iPhone SE" node tests/smoke.js      # the smallest phone in the room
node tests/browser-tests.js                       # tests.html in Chromium, over file:// and HTTP
```

CI runs the 390 × 844 smoke test too (the "smoke" job, on pull requests and on pushes to `main`); the iPhone 13 / SE profiles and the site build stay local, in `npm run preflight`.

If you changed `site/`, `shared/`, `data.js` or `engine.js`: `cd site && npm ci && npm run check` (lint, typecheck, build; it re-syncs the shared files first, including the generated "How it decides" page and `docs/HOW_IT_DECIDES.md`). `npm run audit` adds the static export, the page check and Lighthouse + axe.

Then open the result on a phone or at 390 px, in dark and light, and click the thing you built.

## 5. Commit and pull-request conventions

1. **Branch per task**, from `main`: `git checkout -b task/<short-name> origin/main`. Never commit on `main` or `release/v1-workshop`.
2. **Small commits** with a message that says what changed and why, in the imperative, first line under 72 characters: `Add a Polish cleaning tender with a sector knock-out`, not `update data.js`.
3. **Pull request to `main`** with the template filled in (it is the checklist of §4 plus the rules). CI must be green: `main` is protected by a repository ruleset (a pull request and the "check" and "smoke" status checks are required, force pushes and deletion are blocked; only a repository admin can bypass it, for the rollback). One teammate reads it and merges (merge commit, not rebase). Delete the branch afterwards.
4. **The demo path is pinned.** `tests/demo-golden.test.js`, `tests/smoke.js` and `BRIEF.md` carry the numbers the demo shows (6 tenders, 1 Go · 2 Maybe · 3 No-go, 777 pages, 4 languages, Hohenau No-go 25 → Maybe 90 → Go 100). If your change moves a number, update the two tests and the brief in the same commit, and say so in the PR; the golden test's failure message repeats this.
5. **Honesty.** Fictional names stay marked, the "Simulated AI" label stays wherever AI output shows, no real customer names, no API keys, no invented figures in `evidence.md`.
6. **AI use.** If Claude, Codex or ChatGPT helped, add one line to `README.md` → "AI use" (course policy). Decisions you take alone that touch design or engine rules go into `CLAUDE.md` §11.
7. **Rollback.** If `main` breaks before the demo: `git push --force-with-lease origin release/v1-workshop:main` restores the frozen version in one command.

## 6. Tasks (pick one, 1–3 hours each, every one ends in a visible commit)

Each task is self-contained. Claim it by opening the branch and saying so in the team chat. Sizes assume you have read §1–§5.

### T1 · Log your interviews in `evidence.md` (1 h per interview)
- **Files:** `evidence.md` §1 (one row per interview), §2 (one block per interview from the template in `docs/INTERVIEW_KIT.md` §6), §3 after four interviews, §4 for anything that changed the product.
- **Acceptance:** every row names the interviewer, date, role, sector, size, country and the four H1–H4 verdicts; quotes are the interviewee's words with consent noted; anything not from the interview is marked ASSUMPTION; the gate line in §0 is filled and signed.
- **Verify:** none to run. A teammate reads it against your raw notes.

### T2 · A seventh fictional tender with a knock-out the demo does not show yet (2 h)
- **Goal:** today's knock-outs are turnover (Morlanne), ISO 27001 (Hohenau) and VCA (Vlietdam). Add a tender that fails on something else: references short by two or more (`min_references`), or a CPV division outside the firm's sectors (`cpv` not starting with 32, 45, 51 or 72, e.g. `'90911200'` cleaning → "Outside your sectors").
- **Files:** `data.js` (copy the shape of `vli-libraries`: `id`, `title`, `original`, `buyer` ending in "(fictional)", `country`, `language`, `value`, `deadline` after 2026-11-05, `cpv`, `pages`, `doc`, `requirements[]` each with `src`, `tr`, `cite`, `confidence`, `highlight` inside `src`, and `ai.summary` + `ai.qa`); `tests/engine.test.js` (one test asserting its verdict and which check fails); the pinned numbers (§5.4): `tests/smoke.js` (`6 new tenders`, `All 6 Go 1 Maybe 2 No-go 3`, `1 Go 2 Maybe 3 No-go`, the `2,2,2` counts after ISO 27001, `Maybe filter shows 2 cards`, `777`), `BRIEF.md` step 2, `README.md` ("6 fictional tenders").
- **Acceptance:** the Feed shows 7 tenders in the right order, the card reads verdict + title + buyer + value + days left, the detail puts the failing line first with its citation, the Welcome line says "7 new tenders tonight" by itself (it is computed), and the site still builds.
- **Verify:** `node tests/engine.test.js` (25), `node tests/smoke.js`, `cd site && npm run check`.

### T3 · A tender whose source language is Italian or Polish, with its translated summary (2 h)
- **Goal:** the demo reads German, Spanish, Dutch and French. Add one in Italian (`language: 'it'`, `country: 'IT'`) or Polish (`'pl'`, `'PL'`); the engine already knows both names (`engine.js` LANGS and COUNTRIES). Every requirement carries the original sentence (`src`), its English translation (`tr`) and the page; `ai.summary` is the English summary; `original` is the title in the source language.
- **Files:** `data.js`; `tests/engine.test.js` (its verdict: a bid language the firm does not cover is a risk, so with no knock-out it should land on Maybe); the pinned numbers as in T2 (the pages line becomes "in 5 languages").
- **Acceptance:** the detail's loading state says "Reading N pages (Italian)…", the requirement sheet says "Original (Italian) · <doc>, p. N" with the decisive phrase underlined, the Feed's pages line counts 5 languages.
- **Verify:** as T2. If T2 lands first, rebase and update the numbers again.

### T4 · A second company profile, switchable with `?profile=` (2–3 h)
- **Goal:** show that the verdicts belong to the profile, not the tender. A Dutch facility-services firm (VCA, Dutch and English, no ISO 27001, references 2, turnover €1.1M, sectors 90 and 50, countries NL and BE, cross-border off) turns the Feed upside down: Vlietdam becomes Go, Ellerbach and Hohenau No-go.
- **Files:** `data.js` (`PROFILES = { nordlicht: PROFILE, <key>: {...} }` next to `PROFILE`, exported on `DEMO`; `PROFILE` stays the default so nothing else changes); `app.js` (`fresh()` picks `D.PROFILES[params.get('profile')]` when the key exists, as `?today=` is read; `ai.js` already receives the profile it drafts); `tests/engine.test.js` (the six verdicts for the second profile, as a list); `README.md` test-only URL options; `docs/NAVIGATION.md` states table.
- **Acceptance:** `?demo=reset&profile=<key>` → Welcome → Draft → the profile card shows the second firm → the Feed's counts differ, and the hint under VCA on Company says what it unlocks for that firm. Without the parameter nothing changes (the smoke test proves it).
- **Verify:** `node tests/engine.test.js`, `node tests/smoke.js`.

### T5 · "Why Maybe?" score breakdown sheet (3 h)
- **Goal:** the owner sees why a tender scored 62 and not 70. A new sheet at `#/t/:id/why` lists the four parts of the score (sector fit 40, size fit 20, requirements 30, time 10, from `CLAUDE.md` §4) with the points earned and one line each, then the verdict rule that applied.
- **Files:** `engine.js` (add `breakdown(tender, profile, today, overrides)` returning `{ sector, size, requirements, time, total, rule }`; do not change `evaluate()`), `tests/engine.test.js` (the breakdown for Hohenau and Kaltbrunn adds up to their scores), `app.js` (a text button "Why Maybe?" / "Why No-go?" / "Why Go?" under the verdict header; the sheet follows `reqSheet()`: `role="dialog"`, `aria-modal`, a scrim, its own history entry so Back, Escape and the scrim close it; add the `why` case to `parse()` and `syncSheet()`), `styles.css` (plain rows on the surface colour, nothing new in colour), `docs/NAVIGATION.md` (screen list and the flows).
- **Acceptance:** on every tender the four lines add up to the score shown; the sheet closes with Back, Escape and the scrim and reopens from a deep link after onboarding; no console errors; the declutter scan finds nothing.
- **Verify:** `node tests/engine.test.js`, `node tests/smoke.js` (add a check that opens the sheet on `#/t/kal-fibre/why` and reads the total).

### T6 · "Add to calendar" for the deadline and the site visit (2 h)
- **Goal:** the owner taps once and the deadline (and Kaltbrunn's mandatory site visit) land in the phone calendar. An `.ics` file is built in the browser; nothing leaves the phone.
- **Files:** `app.js` (a text button "Add to calendar" in the detail's facts; build the VCALENDAR text with `DTSTART;VALUE=DATE`, a `SUMMARY` of "Bid deadline: <title>" and a `DESCRIPTION` with the buyer; open it as a `data:text/calendar` URL or a Blob; for `site_visit` requirements add a second VEVENT with the date in `value`), `styles.css` only if a new element needs spacing, `docs/NAVIGATION.md`.
- **Acceptance:** on an iPhone the tap offers to add the event; on a laptop a file downloads and opens in Calendar; the closed tender hides the button; 44 px tap target.
- **Verify:** `node tests/smoke.js` (add a check that the button exists on the Go tender and not on the closed one), hand test on a phone.

### T7 · Share a verdict (1–2 h)
- **Goal:** "Can we even bid on this?" answered to a colleague in one tap: the Web Share API with the verdict, score, reason line and the deep link, feature-detected; without it (desktop Safari, older Android) the text is copied to the clipboard and a toast says so.
- **Files:** `app.js` (a text button next to Skip / Save or in the header; `navigator.share` guarded with `typeof`, `navigator.clipboard.writeText` guarded, the existing `toast()`), `docs/NAVIGATION.md`.
- **Acceptance:** on a phone the share sheet opens with "● Go 100 · Structured cabling and Wi-Fi for 12 primary schools · Meets all 4 requirements · <link>"; on a laptop the toast reads "Copied"; nothing breaks when both APIs are missing (try `?offline=1` and a private window).
- **Verify:** `node tests/smoke.js`, hand test on a phone.

### T8 · Evidence-to-feature traceability table (1–2 h, no code)
- **Goal:** one table that shows the lecturer why each feature exists. Rows: the hypotheses H1–H4 and every insight in `evidence.md` §3. Columns: the evidence (interview number or ASSUMPTION), the feature it justifies (morning feed with verdicts; the citation sheet; "Needs your check"; the profile as a lever; skip reasons; Ask this tender), where it lives (route from `docs/NAVIGATION.md` and the function in `engine.js` or `app.js`), how it is verified (the test name in `tests/engine.test.js` or the check line in `tests/smoke.js`), and what the evidence would change next.
- **Files:** `docs/TRACEABILITY.md`; link it from `README.md`'s table and from `evidence.md` §4.
- **Acceptance:** every feature row points to a real route and a real test; every evidence row points to a numbered interview or says ASSUMPTION; nothing in it is invented.
- **Verify:** a teammate checks three rows against the code and the notes.

### T9 · Persona and "How might we" statements (1–2 h, no code)
- **Goal:** one primary persona (the owner or MD of a 5–50 person firm, `BRIEF.md` "User") built only from what interviewees said, and five to eight HMW statements that lead to the features we have or should build next.
- **Files:** `docs/design/PERSONA.md` (name it clearly as a composite, goals, context of use from `docs/NAVIGATION.md`'s first paragraph, pains in the interviewees' words with the interview number, current tools, what they said about money or time, quotes); link it from `README.md` and `evidence.md` §3.
- **Acceptance:** every pain and quote cites an interview; anything else is marked ASSUMPTION; each HMW names the evidence it comes from and the feature or task (T2–T7) it points to.
- **Verify:** a teammate checks the citations against `evidence.md`.

### T10 · User-journey map (1–2 h, no code)
- **Goal:** the owner's journey from "a tender exists" to "bid submitted or skipped", today and with TenderScout: stages, actions, the tool they use today, the pain and its cost (hours or euros, only if an interviewee gave them), the TenderScout moment (screen and route), and the open question.
- **Files:** `docs/design/JOURNEY.md` (a table or a Mermaid diagram, as `docs/NAVIGATION.md` does); link it from `README.md`.
- **Acceptance:** each stage's pain cites an interview or says ASSUMPTION; each TenderScout moment names a route that exists in `docs/NAVIGATION.md`; the "later" items match `BRIEF.md` and `CLAUDE.md` §10 (no real tender ingestion, no live AI, no accounts).
- **Verify:** a teammate reads it next to the app on a phone.

## 7. If something is off

- `node tests/smoke.js` fails on "declutter scan": you used a border, shadow, gradient, radius over 8 px, uppercase, italic or a file name in visible text. The failing line names the element.
- The Feed shows nothing: you are not onboarded (`?demo=reset` and go through Welcome) or every tender is skipped (Bids → Skipped → Restore).
- A verdict looks wrong: run `node tests/engine.test.js`; the rules in `CLAUDE.md` §4 are the truth, not the UI.
- The live site does not match `main`: GitHub → Actions → "pages build and deployment" takes up to 15 minutes; `node tests/live-check.js` tells you when the deployed files equal your checkout.
