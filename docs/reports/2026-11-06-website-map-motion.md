# Website map, motion and phone demo, Fri 6 Nov 2026 (evening)

`git push --force-with-lease origin release/v1-workshop:main` restores the frozen workshop build (app and site) in one command. `release/v1-workshop` and `backup/*` were not touched, nothing was force-pushed and no tag was pushed.

Luca's request: "the map hasn't fixed on the website as well the animations the app ui is not complete". Asked which items, he picked: the UI screenshots and docs are outdated, a screen looks unfinished, the app should match the website. The animations question went unanswered, so the default inside the declutter rules was taken (item 138). Everything is on branch `fix/website-map-motion` in one pull request, not merged.

- **No deployed app byte changes.** `git diff origin/main` over every file the app serves is empty, so no re-rehearsal on the iPhone is needed for this pull request.
- **The website is still not deployed anywhere** (Vercel import pending, `docs/DEPLOY.md`), so the map and phone changes are visible only in a local build (`cd site && npm run build && npm start`) until someone imports it.

## What changed

| # | Commit | What it changes | Files | Deployed app bytes |
|---|---|---|---|---|
| 1 | `4cd04b5` Website map (from PR 13) | Pull request 13's two website files, verbatim, onto today's `main`: each code on its country (AT was half outside Austria), NL / FR / ES grey instead of vanishing with cross-border off, the Netherlands' code on the sea at 390 px and below, a square frame under 768 px, countries from `data.js`. PR 13 itself no longer merges and is superseded (item 134). | `site/src/components/map/WorldMap.tsx`, `site/src/styles/components.css` | No |
| 2 | `5ea5b05` Map motion | The countries fill in one by one when the map comes into view, the switch re-colours France, the Netherlands and Spain in turn, the counts count to their new values (one shared `Counter` with the phone demo), screen readers get the settled numbers, instant under reduced motion (item 135) | `WorldMap.tsx`, `site/src/components/ui/Counter.tsx` (new), `PhoneDemo.tsx` (uses it), `components.css` | No |
| 3 | `f6a77af` Phone demo, five tabs | Feed / Bids / Company / Profile / Settings as in the app; Bids opens with the Win/loss row from the app's `insights.js` (now copied verbatim to `site/src/generated/insights.cjs`, checked by CI's `--check`); Profile follows the Company switches; Settings carries the honesty statements; section copy "Five tabs in your pocket." (item 136) | `PhoneDemo.tsx`, `InTheApp.tsx`, `site/src/data/*`, `site/src/generated/insights.cjs` + `shared.d.ts`, `site/scripts/sync-shared.mjs`, `components.css`, `ARCHITECTURE.md` | No |
| 4 | `03e9322` UI frames and recording | All 29 `docs/ui/` frames re-taken (20 changed, 4 byte-identical, 5 new: Profile dark and light, Settings light, Competition, the morning notification); `tests/ui-frames.js` (new, dev-only) for the eleven the smoke path leaves under a toast; `docs/demo/` video and stills re-recorded; `UI_DESIGN.md` §2 and §6 (item 137) | `docs/ui/*`, `docs/demo/*`, `UI_DESIGN.md`, `tests/ui-frames.js` | No |
| 5 | this commit | `CLAUDE.md` §0 and §11 items 134–138, README "AI use", this report | docs only | No |

Not changed: `engine.js`, `data.js`, `ai.js`, `insights.js`, `app.js`, `styles.css`, the tokens, the demo numbers (Hohenau 25 → 90 → 100; 1 Go · 2 Maybe · 3 No-go; 777 pages in 4 languages), `release/v1-workshop`, `backup/*`, `.github/`.

## Verification per gate

Run on the branch in this container. WebKit cannot be installed here (the Playwright CDN and its Microsoft mirror are blocked), so the iPhone 13 and iPhone SE rows are Chromium device emulation and every Safari statement is inspection only. Baseline: the same preflight on `main` (`eae8b40`) earlier this evening was all green.

| Gate | Branch `fix/website-map-motion` |
|---|---|
| `node tests/engine.test.js` (24) | ok |
| `node tests/insights.test.js` | ok |
| `node tests/data-check.js` | ok |
| `node tests/docs-check.js` | ok |
| `node tests/demo-golden.test.js` (11 pins) | ok |
| `node tests/engine-invariants.test.js` (3,000 cases) | ok |
| `node tests/no-live-ai-check.js` | ok |
| `node tests/declutter-scan.js` (static) | 0 |
| `node shared/check-contrast.js` | 0 failures |
| generated tokens and decision model in sync | ok |
| `node site/scripts/sync-shared.mjs --check` (now also `insights.cjs`) | ok |
| `node tests/vercel-dist.test.js` | ok (9 passed); no file the app serves differs from `main` |
| `node tests/browser-tests.js` (`tests.html`, file:// + HTTP) | ok |
| `node tests/smoke.js` 390×844 (dark, light, reduced motion, declutter scan on every screen) | ok |
| `SMOKE_DEVICE="iPhone 13"` / `"iPhone SE"` | running at push time, result in the next commit |
| `cd site && npm run check` (lint, typecheck, build) | ok in the working session; the preflight rerun is in the next commit |
| `cd site && npm run audit` (Lighthouse ≥ 95 median of 3, axe 0) | running at push time, result in the next commit |
| `site/scripts/shots.cjs`, `site/scripts/a11y-motion.cjs` | after the preflight, result in the next commit |
| Map motion in a viewport (arrival, switch, counts, reduced motion) | ok: unlit before view, filled 300–1,000 ms, switch empties FR / NL / ES in turn, counts 1 · 2 · 3 → 1 · 1 · 4, screen-reader copy settled at once, instant under reduced motion, 0 console errors |
| Phone demo (five tabs, Profile follows ISO 27001, Edit on Company, arrow keys, 320 px) | ok: tabs 52 × 60 px, no horizontal scroll, 0 console errors |
| CI `check` on the branch push | after push |

## Decisions taken alone

All in `CLAUDE.md` §11, items 134–138.

- **134** Pull request 13's map lands as a fresh branch from `main`, its two website files taken verbatim (they were unchanged on `main` since its base). The rest of PR 13 is superseded: its app hunks are already on `main` (item 119), its frames by item 137. Close PR 13 when this merges.
- **135** The map was the only interactive part of the site with no motion; every other effect (rolling word, word-by-word reveal, the 0 → 777 counter, the step crossfade, both carousels, the FAQ, the menu) was checked in a real viewport and works, so nothing else was touched. The new motion uses solid colours only and is instant under reduced motion.
- **136** The phone demo mirrors the five-tab app. The Win/loss numbers come from the app's own `insights.js`, copied like the engine and the data, so the site has no hand-typed number.
- **137** Every UI frame and the storyboard re-made; a committed script for the frames the smoke path cannot give cleanly, so the next refresh is one command.
- **138** No app byte changed on a guess: all 31 app states, dark and light, match `SKELETON.md`. The 5 Nov restore of the original website (`claude/inspiring-mendel-490ftz`, no pull request) was not merged: it breaks the declutter rules the site is held to and would replace the fixed map.

## Caveats

- **Which app screen "looks unfinished" is still open.** Every screen matches its wireframe. The two candidates seen in the captures: the Profile tab is one card and one button with half the screen empty (it matches `SKELETON.md`), and the four-second "Saved to Bids" toast sits over the Restore button on Bids. Neither was changed. Name the screen and a build session can finish it in its own pull request (that one would change app bytes and need a rehearsal).
- **"The animations" was read as the website's motion inside the rules.** If the team meant the original 3 Nov website (glow, gradient wordmark, glass pills, the sector marquee, the pin map), that restore exists on `claude/inspiring-mendel-490ftz` (commit `13cfadc`). Merging it is a decision to drop the declutter rules on the site (`tests/declutter-scan.js`, `site/scripts/shots.cjs` and the preflight would need changing with it), and the map work here would have to move onto the pin map.
- **The site is not deployed.** Nothing on Vercel or GitHub Pages shows the site; after the Vercel import (`docs/DEPLOY.md`) check the map and the phone at 390 px on a real phone.
- **WebKit never ran.** The map's CSS `fill` transition on SVG and the `IntersectionObserver` arrival are standard in Safari 17+, checked by inspection only.
- **The live app was not fetched** (the container cannot reach github.io). This pull request changes no app byte, so the live checks only matter for the docs links:
```bash
node tests/live-check.js
```
```bash
SMOKE_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node tests/smoke.js
```

## Rollback

- **This pull request after it merges:** GitHub → the pull request → Revert (a pull request of its own, through CI). No app byte changes, so the live demo is unaffected either way.
- **Everything, app and site, to the frozen workshop build:** `git push --force-with-lease origin release/v1-workshop:main`. Do not move `release/v1-workshop`.
