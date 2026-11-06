# Website back to its original design, five-tab phone, UI screenshots · Fri 6 Nov 2026 (evening)

`git push --force-with-lease origin release/v1-workshop:main` restores the frozen workshop build (app and site) in one command. `release/v1-workshop` and `backup/*` were not touched, nothing was force-pushed and no tag was pushed.

Luca's requests, in order: "the map hasn't fixed on the website as well the animations the app ui is not complete"; asked which items: the UI screenshots and docs are outdated, a screen looks unfinished, the app should match the website; then "Also on the old website the map was working correctly as well as the animations". So the website goes back to its original 3 Nov design (the 4 Nov declutter is reverted for the site only), its phone shows the app as it is now (five tabs), and the app's screenshots are re-made. Everything is on branch `fix/website-map-motion` in one pull request, not merged.

- **No deployed app byte changes.** `git diff origin/main` over every file the app serves (and over `.github/`) is empty, so no re-rehearsal on the iPhone is needed for this pull request.
- **The website is still not deployed** (the Vercel import is pending, `docs/DEPLOY.md`). Until someone imports it, the restored site is visible only in a local build: `cd site && npm ci && npm run build && npm start`.
- **The declutter rules now cover the app only.** That is Luca's decision for the website; the app keeps them, and the site keeps its own gates (contrast, axe, Lighthouse, reduced motion and keyboard).

## What changed

| # | Commit | What it changes | Files | Deployed app bytes |
|---|---|---|---|---|
| 1 | `4cd04b5`, `5ea5b05`, `f6a77af` | First pass, on the decluttered site: pull request 13's map fix, map motion, the five-tab phone. **Superseded** by commit 5 for the site's look (items 134–136); the `insights.js` copy and the shared `Counter` stay | `site/` | No |
| 2 | `03e9322` App screenshots and recording | All 29 `docs/ui/` frames re-taken from the five-tab app (20 changed, 4 byte-identical, 5 new: Profile dark and light, Settings light, Competition, the morning notification); `tests/ui-frames.js` (new, dev-only) for the eleven the smoke path leaves under a toast; `docs/demo/` video and stills re-recorded; `UI_DESIGN.md` §2 and §6 (item 137) | `docs/ui/*`, `docs/demo/*`, `UI_DESIGN.md`, `tests/ui-frames.js` | No |
| 3 | `d6a46e5` | Docs for the first pass (items 134–138) | docs | No |
| 4 | `f2d8655` **The original website** | The 5 Nov restore (`13cfadc`, `site/` from `backup/pre-declutter`) brought onto today's `main`: the map with pins, arcs, the home pulse and tooltips; the hero glow and gradient wordmark, the sector marquee, every hover and scroll effect. Kept from after 5 Nov: "How it decides", metadata, keyboard access, the lazy map (adapted), Vercel, the CI checks. The phone: the original dock with the app's five tabs, the Win/loss row, Profile, Settings. Fixes to the original: the AT code, the reduced-motion overflow, the clipped count tile, three axe findings. Gates: token files frozen with `shared/tokens.css` byte-identical, declutter scan on the app only, the website's 33 contrast pairs, the motion/keyboard check in `npm run audit` (items 139–141) | `site/**`, `shared/build-tokens.js`, `shared/check-contrast.js`, `tests/declutter-scan.js`, `tests/preflight.js` | No |
| 5 | `09894f1` | `CLAUDE.md` §0, §3, §11 items 139–142; README, `ARCHITECTURE.md`, `docs/START_HERE.md`, `docs/FIGMA.md` | docs | No |
| 6 | `77fe1cb` | Two axe findings caused by commit 4's own changes: the phone's scrollable tab panel is a tab stop; the Menu button keeps its name on phones | `site/` | No |
| 7 | this commit | This report | docs | No |

Not changed: `engine.js`, `data.js`, `ai.js`, `insights.js`, `app.js`, `styles.css`, `shared/tokens.css`, `shared/tokens.json`, the demo numbers (Hohenau 25 → 90 → 100; 1 Go · 2 Maybe · 3 No-go; 777 pages in 4 languages), `.github/`, `release/v1-workshop`, `backup/*`.

## Verification per gate

Run in this container. WebKit cannot be installed here (the Playwright CDN and its Microsoft mirror are blocked), so the iPhone 13 and iPhone SE rows are Chromium device emulation and every Safari statement is inspection only. Baseline: the same preflight on `main` (`eae8b40`) and on `d6a46e5` (the first pass) was all green.

| Gate | `f2d8655` (the restore) | `77fe1cb` (after the axe fixes) |
|---|---|---|
| `node tests/engine.test.js` (24), `insights.test.js`, `data-check.js`, `docs-check.js`, `demo-golden.test.js` (11 pins), `engine-invariants.test.js` (3,000 cases), `no-live-ai-check.js` | ok | site-only change since |
| `node tests/declutter-scan.js` (static, now the app's two stylesheets) | 0 | site-only change since |
| `node shared/check-contrast.js` (the app's 46 pairs, unchanged, + the website's 33) | 79 pairs, 0 failures | site-only change since |
| generated tokens (`shared/tokens.css` byte-identical) and decision model in sync | ok | site-only change since |
| `node site/scripts/sync-shared.mjs --check` (engine, data, insights, fonts) | ok | site-only change since |
| `node tests/vercel-dist.test.js` | ok | site-only change since |
| `node tests/browser-tests.js` (`tests.html`, file:// + HTTP) | ok | app unchanged |
| `node tests/smoke.js` 390×844 (dark, light, reduced motion, declutter scan on every app screen) | ok | app unchanged |
| `SMOKE_DEVICE="iPhone 13"` / `"iPhone SE"` | ok / ok | app unchanged |
| `cd site && npm run check` (lint, typecheck, build) | ok | ok (lint, typecheck, build) |
| `npm run audit` → `how-check.cjs` ("How it decides": demo path, keyboard, 44 px, metadata) | ok | ok |
| `npm run audit` → `a11y-motion.cjs` (reduced motion, menu, five-tab phone, lazy map, AT code, exact counts) | ok, 25 of 25 | ok, 25 of 25 |
| `npm run audit` → Lighthouse ≥ 95, median of 3 | perf 98–99, a11y 95, best practices 100, SEO 100 | `/` perf 98 / 99, `/how` 99 / 99; a11y, best practices, SEO 100 (dark / light) |
| `npm run audit` → axe 0 violations (`/`, `/how`, dark and light, 1280 and 390 px) | **FAIL**: `/` scrollable-region-focusable (the phone panel), button-name at 390 px (the Menu button) | 0 violations on all 8 |
| `git diff origin/main` over the app's served files and `.github/` | empty | empty |
| CI `check` on the branch push | see the pull request | see the pull request |

## Decisions taken alone

All in `CLAUDE.md` §11. Items 134–138 are the first pass (decluttered site); items 139–142 the restore, which supersedes 134, 135 and the visual part of 136.

- **139** The original website, cherry-picked from the 5 Nov restore onto today's `main` after a browser check of both the restore and the true original: every animation on the original works and its map re-scores with the engine. Later work is kept, the lazy map is adapted to the original frame, the token files are frozen with the app's `shared/tokens.css` byte-identical, the declutter scan covers the app only, and the website gets its own contrast pairs and its reduced-motion and keyboard check in `npm run audit`.
- **140** The original dock carries the app's five tabs: it measures itself so every tab stays at least 44 px, the active tab shows its label where it fits, and the phone screen scrolls when a tab is taller than it.
- **141** Defects of the original fixed without changing its look: the AT code (hidden under Kaltbrunn's label at every width) moved into Tyrol; the reduced-motion page no longer scrolls sideways; the "1 Maybe" count tile no longer clips; axe's findings on `/` are gone.
- **142** Left as the original renders, for the team: six token names the stylesheet uses but never defines (body copy and meta text render white, the phone's cards have no fill), and a few smaller quirks listed there.
- **137** (stands) Every app screenshot and the storyboard re-made from the five-tab app.
- **138(a)** (stands) All 31 app states match `SKELETON.md`; no app byte was changed on a guess.

## Caveats

- **Which app screen "looks unfinished" is still open.** Every screen matches its wireframe in both schemes. The candidates seen: the Profile tab is one card and one button with half the screen empty, and the four-second "Saved to Bids" toast sits over the Restore button on Bids. Name the screen and a build session can finish it in its own pull request (that one would change app bytes and need a rehearsal).
- **The six undefined token names (item 142).** The original renders body copy and labels white and the phone's cards without a fill because `--ts-text-2`, `--ts-text-3`, `--ts-surface-2`, `--ts-ink-2`, `--ts-ink-3` and `--ts-text-4` are never defined. Two lines of aliases would apply the designer's values (`design/website/HANDOFF_WEBSITE.md`) but change the look you remember: your call.
- **WebKit never ran.** The restored design leans on `backdrop-filter`, `background-clip: text`, masks and spring animations; they were checked in Chromium (desktop and iPhone emulation) only. Look at the site on a real iPhone once it is deployed.
- **The site is not deployed.** After the Vercel import (`docs/DEPLOY.md`), check the map and the phone at 390 px on a real phone.
- **The live app was not fetched** (the container cannot reach github.io). This pull request changes no app byte, so the live checks matter only for the docs links:
```bash
node tests/live-check.js
```
```bash
SMOKE_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node tests/smoke.js
```
- **CI runs the node gates only.** The site's lint, typecheck, build, Lighthouse, axe and the motion/keyboard check run in `npm run preflight` on a laptop (or in a build session), not in GitHub Actions; the gate table below is from this container.

## Rollback

- **This pull request after it merges:** GitHub → the pull request → Revert (a pull request of its own, through CI). No app byte changes, so the live demo is unaffected either way.
- **Only the website back to the decluttered version, keeping the app screenshots:** `git revert 77fe1cb 09894f1 f2d8655` on a branch (the commit before the restore, `d6a46e5`, passed every gate).
- **Everything, app and site, to the frozen workshop build:** `git push --force-with-lease origin release/v1-workshop:main`. Do not move `release/v1-workshop`.
