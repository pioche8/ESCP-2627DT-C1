# Architecture read, pass 2 (6 Nov 2026)

Read-only review of `main` at `4b6f082` (step 2 of the pass). Scope: `app.js`, the seams between `engine.js`, `ai.js`, `data.js` and `insights.js`, and how `site/` reuses `engine.js` and `shared/tokens.json`. Nothing was refactored here; the council (step 3) decided which items enter the plan, see [`2026-11-06-pass-2.md`](2026-11-06-pass-2.md).

The shape today, in one paragraph: `engine.js` is a deep module (a small interface, `evaluate` / `rank` plus formatting helpers, over the whole decision model) and its seam to `data.js` is narrow and documented in `tests/data-check.js`. The shallow parts sit around it: `app.js` (1,176 lines, one IIFE) holds the router, every screen, the session flags and two pieces of display logic that are plain rules but untested; the website copies `engine.js` and `data.js` and then re-implements several display rules itself; and the AI seam (`ai.js` → engine) exists in name only.

## Ranked opportunities (impact for the effort)

### 1. No check that the site's copies equal the app's sources
**Signal:** hidden coupling across a build boundary.
**Evidence:** `site/scripts/sync-shared.mjs:28-31` copies `engine.js` and `data.js` into `site/src/generated/{engine,data}.cjs` in `prebuild`; `.github/workflows/check.yml` diffs the token outputs and the decision model but never the two copies, and CI never builds the site. Today they match apart from a trailing newline. A Vercel build whose Root Directory is `site/` can use the committed copies without re-syncing them.
**Suggestion:** one node-only CI step: `node site/scripts/sync-shared.mjs && git diff --exit-code -- site/src/generated/engine.cjs site/src/generated/data.cjs` (the same pattern as the token check). No app bytes change.
**Impact:** High for a two-project Vercel setup; effort S.

### 2. Verdict counts are computed in four places
**Signal:** a missing engine output, re-derived by callers.
**Evidence:** `app.js` `openCounts()` (l.131) and `feed()` (l.262-263); the site's `WorldMap.tsx:39-43`; `PhoneDemo.tsx` hard-codes its feed. The demo's spoken numbers ("1 Go · 2 Maybe · 3 No-go", then 2 · 2 · 2) come out of these tallies, so they live in three implementations.
**Suggestion:** add `Engine.counts(results)` (additive; `evaluate()` and `rank()` keep their shapes) with a unit test and a golden pin; replace the tallies.
**Impact:** Medium; effort S. Touches app bytes, so only alongside a slice that already re-rehearses.

### 3. The chance-to-win rules live in the UI file, untested
**Signal:** logic in the wrong module.
**Evidence:** `app.js:358-374` `chanceToWin()` (1 / average bidders, ×0.7 for a repeat winner, ×1.2 / ×0.8 on references, Good / Fair / Low at 0.25 / 0.15), added 5 Nov; the win tally is computed twice (l.365, l.378); `D.COMPETITION` is not validated by `tests/data-check.js`.
**Suggestion:** move the rule into `insights.js` (already UMD, already "plain arithmetic, not AI") as `chance(competition, verdict, references)`, with node tests and a `COMPETITION` block in the data check.
**Impact:** Medium; effort S–M. App bytes change.

### 4. The AI seam is not wired, and the tender contract is not written down
**Signal:** a shallow interface (`ai.js` returns data nobody reads).
**Evidence:** `AI.readTender()` returns `{simulated, summary, requirements, pagesRead}`, but `app.js:440-448` only marks the tender as read and then evaluates `D.TENDERS` directly (`app.js:86-87`) and reads `t.ai.summary` itself (l.347). `ai.js` is not UMD, so node cannot load it. The engine-ready tender shape exists only as a comment (`tests/data-check.js:7-14`) and a hand-written TypeScript type (`site/src/data/types.ts:5-33`, which omits `COMPETITION` and `PAST_BIDS`).
**Suggestion:** one written contract for "a tender the engine can evaluate" (a `validateTender()` in node, used by the data check and by any future reader) and make the app render what `readTender` returns. This is the prerequisite for any real reader (candidate e).
**Impact:** High if a real reader is ever built; Low otherwise. Effort M.

### 5. The website re-implements display rules the engine or the app already has
**Signal:** duplicated knowledge.
**Evidence:** `TryTheRules.tsx:11-13` copies `app.js`'s `STATUS` / `KIND` maps, `:58` repeats the status order, `:83` re-implements "answerable" (`type === 'other' || confidence < REVIEW_THRESHOLD`), `:50-57` diffs checks by hand instead of `Engine.diff`; `PhoneDemo.tsx:14-44` hard-codes the demo state and builds the unlock hints by hand instead of `Engine.whatIf`; `VERDICT_LABEL` is re-exported in `app.ts:20` and used nowhere.
**Suggestion:** export the status order and an `isAnswerable()` from the engine (additive) and use `diff` / `whatIf` on the site.
**Impact:** Medium; effort M. No app bytes change except the additive exports.

### 6. Adding one screen touches eight places in `app.js`
**Signal:** a scattered router.
**Evidence:** `parse()` whitelist (l.895), the `render` switch (l.936-946), `TABS` (l.152), the `tabbed` list (l.953) and its active-tab map (l.954), the onboarding guard (l.930), `back()` parents (l.917-924), `afterRender` (l.969); sheets add a `parse()` branch and the `syncSheet` dispatch.
**Suggestion:** one route table (`{ name: { render, tab, beforeOnboarding, parent } }`) read by all eight places.
**Impact:** Medium, and it only pays off when screens are being added; effort M; every route is demo surface, so it needs the full smoke run and a re-rehearsal.

### 7. Copy is hard-coded, and two label sets double as stored keys
**Signal:** no seam for a locale.
**Evidence:** about 250-300 English strings in `app.js`, nothing centralised beyond small tables; `STAGES` and `SKIP_REASONS` labels are what `tenderscout.v2` stores; `engine.js` emits English (`VERDICT_LABEL`, headlines, check notes, month names), `insights.js` returns English labels, `data.js` is English.
**Suggestion:** a string table with stable keys separate from labels, then locale files. Only worth doing together with a locale (candidate c), and the stored keys need a storage-key bump.
**Impact:** High for `?lang=de`, nothing otherwise; effort L.

## Starting point

Item 1: one CI line, no app bytes, and it removes the only way a Vercel build of the site can silently disagree with the app. Item 2 is next if a slice already changes app bytes.

## Smaller notes (not ranked)

- Session flags set on one screen and read on another (`pulse`, `collapseId`, `enteringId`, `lastChange`); Reset demo clears some of them but not `reading`, `collapseId`, `enteringId`, `scrollPos` or `drafting`.
- `hideSheet` clears `inert` without checking whether the morning notification is showing.
- `AI.ask()` waits 450 ms with no `fast` cap.
- `index.html:6` and `site/src/app/layout.tsx:39` hard-code `#02040A` as theme colour (the app repaints it from `--c-bg` at run time); `site/scripts/contact-sheet.cjs` uses `#A3ADBD`, which is not a token (a dev script, not shipped).
