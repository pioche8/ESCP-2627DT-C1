# Overnight report, Thu 5 Nov 2026 (01:30–07:00 CET, before the 09:00 workshop)

`git push --force-with-lease origin release/v1-workshop:main` restores the frozen demo build (app and site) in one command; `release/v1-workshop` and `backup/*` were not touched, nothing was force-pushed, nothing was pushed to `main`.

Six pull requests are open, each from its own branch; `main` is still `bc4d62b`, so the live demo URL serves exactly what you rehearsed. Merge them in the order below (B, C and D start from A's tip, so each shows only its own diff once A is in). The app's deployed bytes change only with the three C pull requests: after merging any of those, wait for the "pages build and deployment" run (about 18 minutes) and rehearse `?demo=reset,fast` on the phone once before 09:00. If there is no time for that, merge A, B and D and leave C for after the workshop; nothing depends on C.

## The pull requests, in merge order

| # | PR | Branch | What it changes | Files | Deployed app bytes | Gates |
|---|---|---|---|---|---|---|
| 1 | [Overnight A](https://github.com/pioche8/ESCP-2627DT-C1/pull/1) | `overnight/a` | Protects the demo: `tests/data-check.js` (data.js against what the engine and the UI read), `tests/demo-golden.test.js` (Hohenau 25 → 90 → 100, 1 Go · 2 Maybe · 3 No-go, 777 pages in 4 languages, the storage key, the reset), `tests/engine-invariants.test.js` (seeded property test), `tests/browser-tests.js`, `npm run preflight`, CI job `smoke` (Chromium at 390×844 on PRs and `main`), the `main` ruleset as a file to apply from a laptop | `tests/*`, `tests.html`, `package.json` (scripts only), `.github/workflows/check.yml`, `.github/ruleset-main.json`, `.github/PULL_REQUEST_TEMPLATE.md`, `README.md` (tests listing), `docs/START_HERE.md`, `CLAUDE.md` §11 87–92 | **No** | all green; CI on the PR: `check` 8 s, `smoke` 1 min 47 s |
| 2 | [Overnight B](https://github.com/pioche8/ESCP-2627DT-C1/pull/2) | `overnight/b` | The website's "How it decides": `shared/how-it-decides.js` probes the engine at build time and writes the page's data and `docs/HOW_IT_DECIDES.md`; the `/how` page with "Try the rules" on the real engine (25 → 90 → 100 asserted by a site test); per-page metadata, Open Graph image and icons rendered from the tokens, robots and sitemap; Lighthouse (median of 3, ≥ 95) and axe (0) as site checks; the tender carousel gets keyboard access and the map loads near the viewport | `shared/how-it-decides.js`, `docs/HOW_IT_DECIDES.md`, `site/src/app/how/*`, `site/src/components/how/*`, `site/src/components/map/MapLazy.tsx`, `site/scripts/{audit,how-check,brand-images,seo-files}.cjs`, `site/src/app/{icon,apple-icon,opengraph-image}.png`, `site/public/*`, `site/src/data/copy.ts`, four small component edits, `site/package.json` (+ `lighthouse`, `axe-core` dev deps), `site/README.md`, `.github/workflows/check.yml` (one step), `tests/preflight.js` (two gates), `CLAUDE.md` §11 93–97 | **No** (site only; the site is not deployed) | all green; Lighthouse `/` 98 / 98, `/how` 98 / 99 performance (dark / light), 100 elsewhere; axe 0 |
| 3 | [Overnight C1](https://github.com/pioche8/ESCP-2627DT-C1/pull/3) | `overnight/c-1-error-fallback` | Error fallback: any uncaught error or unhandled rejection shows "Something went wrong" with one Restart button; Restart reloads on Home with `tenderscout.v2` intact; the error is logged. A smoke pass injects both kinds and checks the recovery | `app.js` (+31 lines), `tests/smoke.js`, `docs/NAVIGATION.md`, `CLAUDE.md` §11 98 | **Yes** (`app.js`): re-rehearse after the deploy | all green on the rerun (see the caveat on the first run’s iPhone 13 hang) |
| 4 | [Overnight C2](https://github.com/pioche8/ESCP-2627DT-C1/pull/5) | `overnight/c-2-monkey` | Off-script monkey test `tests/monkey.js` (seeded, 10 min per profile, every screen, every control; asserts no console error, no empty screen, nothing wider than the viewport, 44 px targets), behind `MONKEY=1` in the smoke suite; the findings fixed, each in its own commit with the seed | `tests/monkey.js`, `tests/smoke.js` (hook), `styles.css` (two one-line fixes: the sheet’s "Undo" text button gets a 44 px minimum width; the inline "see in Bids" link gets a 44 px hit area), `README.md`, `docs/START_HERE.md`, `CLAUDE.md` §11 99–100 | **Yes** (`styles.css`): re-rehearse after the deploy | all green (node and browser gates in the worktree, the site gate in the main tree); the walk clean after the fixes |
| 5 | [Overnight C3](https://github.com/pioche8/ESCP-2627DT-C1/pull/4) | `overnight/c-3-install` | Home-screen install: `manifest.webmanifest` (start URL `./?demo=reset,fast`, standalone), icons, Apple meta tags, no service worker; a BRIEF note that the icon is the demo launcher. Never run in WebKit | `index.html` (8 tags), `manifest.webmanifest`, `assets/icons/*`, `BRIEF.md`, `CLAUDE.md` §11 101 | **Yes** (`index.html` + new files): re-rehearse after the deploy, and add the icon once on the phone | all green (site gate run separately in the main tree, see the caveat); manifest and tags validated in Chromium |
| 6 | [Overnight D](https://github.com/pioche8/ESCP-2627DT-C1/pull/6) | `overnight/d` | `ARCHITECTURE.md` (diagram + a page), links from README and START_HERE, the README "AI use" entry for the night, `CLAUDE.md` §0 status, this report | `ARCHITECTURE.md`, `docs/reports/2026-11-05-overnight.md`, `README.md`, `docs/START_HERE.md`, `CLAUDE.md` §0 and §11 102 | **No** | all green (docs only; site gate run separately in the main tree) |

## Verification per gate

Every branch ran `npm run preflight` (all gates in order) on its own tree; C2, C3 and D ran the site gate at a detached checkout in the main tree (see the caveat). WebKit cannot be installed in the container, so the iPhone 13 / iPhone SE rows are Chromium device emulation and Safari items are inspection.

| Gate | A | B | C1 | C2 | C3 | D |
|---|---|---|---|---|---|---|
| `node tests/engine.test.js` (24) | ok | ok | ok | ok | ok | ok |
| `node tests/data-check.js` | ok | ok | ok | ok | ok | ok |
| `node tests/demo-golden.test.js` (11 pins; 8 in `tests.html`) | ok | ok | ok | ok | ok | ok |
| `node tests/engine-invariants.test.js` (3,000 cases, seed 20261105; also 20,000 with seed 7 on A) | ok | ok | ok | ok | ok | ok |
| `node tests/declutter-scan.js` (static, 5 files) | 0 | 0 | 0 | 0 | 0 | 0 |
| `node shared/check-contrast.js` | 46 pairs, 0 failures | same | same | same | same | same |
| generated tokens (and, from B, the decision model) in sync | ok | ok | ok | ok | ok | ok |
| `node tests/browser-tests.js` (`tests.html` over `file://` + HTTP) | ok | ok | ok | ok | ok | ok |
| `node tests/smoke.js` 390×844 (dark + light + reduced motion + declutter scan on every screen; from C1 also the error fallback) | ok, 0 console errors | ok | ok | ok | ok | ok |
| `SMOKE_DEVICE="iPhone 13" node tests/smoke.js` | ok | ok | ok on the rerun; the first run hung for 8 min under load and was killed (standalone reruns passed twice) | ok | ok | ok |
| `SMOKE_DEVICE="iPhone SE" node tests/smoke.js` | ok | ok | ok | ok | ok | ok |
| `cd site && npm run check` (lint, typecheck, build; no stray tracked files) | ok | ok | ok | ok | ok | ok |
| `cd site && npm run audit` (export, `/how` check, Lighthouse median of 3 ≥ 95, axe 0; the gate arrives with B and applies to every branch after B is merged) | n/a | ok | n/a | n/a | n/a | n/a |
| `MONKEY=1` walk, 10 min × 3 profiles | n/a | n/a | n/a | 5,792 steps, 85 distinct targets per profile, every route, 54 dialogs: no findings after the two fixes | n/a | n/a |
| CI on the PR (`check` + `smoke`) | green | green | green | green | green | green |

## Decisions taken alone (CLAUDE.md §11, one line each)

- 84–86 (yesterday evening, for completeness): the ◐ header toggle, muted-fill secondary buttons, equal-width answer pair.
- 87 `data-check` derives its schema from the code; deadlines must be after the demo date; the honesty labels are asserted statically in `app.js`.
- 88 the demo pins go through the engine only; the storage key and the reset are source assertions; a failing pin says how to move it deliberately (T2 / T3).
- 89 the invariants test is a seeded mulberry32 generator with the listed invariants, checked against a mutant engine.
- 90 CI job `smoke` runs on pull requests and pushes to `main` only, Playwright pinned to 1.63.0 with the browser cached; `check` and `smoke` are the required contexts.
- 91 `npm run preflight` with a scripts-only root `package.json`; `tests/browser-tests.js` because nothing ran `tests.html` before.
- 92 the `main` ruleset could not be applied from the session (the proxy refuses the API); it is committed as `.github/ruleset-main.json` with the bypass test written out.
- 93 the decision model is probed, not transcribed; one script, two outputs, CI-diffed; D2 is produced by B's script.
- 94 no file names in the site's visible text, even in "What is real" (links carry them); requirement statuses read Meets / Risk / Needs your check / Fails.
- 95 "Try the rules" offers only engine inputs and says staff, city and name are not; 50 × 44 switch buttons; the moved line marked; `how-check.cjs` asserts 25 → 90 → 100.
- 96 metadata through Next's file conventions, images rendered from the tokens; static robots and sitemap (the two build modes disagree on route handlers); `SITE_URL`.
- 97 Lighthouse median of 3 at ≥ 95 and axe 0 as site checks; carousel keyboard access; the map loads near the viewport (landing page 89–93 → 98).
- 98 one plain error screen, one action; `addEventListener` rather than `window.onerror`; Restart reloads on Home with the state kept; smoke-tested with injected errors.
- 99 the monkey is a seeded walker (mulberry32, one action per step, every route, confirm dialogs answered at random) asserting errors, empty screens, overflow and 44 px targets; behind `MONKEY=1`.
- 100 it found two sub-44 px targets ("Undo" 41 px wide, "see in Bids" 17 px tall), fixed in `styles.css` one commit each with the seed; the full run after the fixes found nothing.
- 101 installable but not offline: manifest, icons shared with the site, Apple tags, `black-translucent` status bar; never run in WebKit.
- 102 `ARCHITECTURE.md` states only what a gate checks; `HOW_IT_DECIDES.md` is generated; the README "AI use" entry and this report are written by D so one branch edits the shared paragraph.

## Caveats: what could not be verified, what is left for a laptop

- **The `main` ruleset is not applied.** From a laptop with your admin token: `gh api -X POST repos/pioche8/ESCP-2627DT-C1/rulesets --input .github/ruleset-main.json` (after merging A). Then verify the bypass as the file's comment says (add `refs/heads/ruleset-test` to the include list, push and force-push a scratch branch of that name, remove the pattern and the branch); if the force-push is refused, delete the ruleset. **To remove it:** Settings → Rules → Rulesets → "main: pull request + check + smoke, no force push" → Delete (or `gh api -X DELETE repos/pioche8/ESCP-2627DT-C1/rulesets/<id>`; ids from `gh api repos/pioche8/ESCP-2627DT-C1/rulesets`).
- **WebKit never ran.** The iPhone 13 / SE rows are Chromium emulation; C3's standalone mode, status-bar style and icon were not seen on a device. Rehearse on the real iPhone after any C merge.
- **The live URL was not fetched** (the container cannot reach github.io). After each merge that changes app bytes, from a laptop: `node tests/live-check.js` and `SMOKE_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node tests/smoke.js`.
- **The site is still not deployed.** Open Graph URLs and the sitemap use `http://localhost:3000` until `SITE_URL` is set or Vercel's production URL exists. `STATIC_EXPORT=1 npm run build` in `site/` gives a preview; the `/how` page is `out/how.html`.
- **Lighthouse performance is noisy** on a shared machine (identical runs ranged 88–99); the gate is the median of three, as Lighthouse recommends.
- **The team names** are still `[names]` behind the `<!-- TEAM NAMES -->` markers in `README.md` and `evidence.md`; the `v0-shell` decision and the interviews → `evidence.md` gate are unchanged from yesterday's report.
- **One iPhone 13 smoke run hung** during C1’s first preflight while the monkey and another preflight shared the machine (the process slept in the event loop at 0 % CPU for eight minutes; no timeout fired). Killed; the same run passed standalone twice and in the full rerun (85 s). Not reproduced, cause not found; if it happens on a laptop, rerun it alone. The gate itself (every Playwright call has a 30 s timeout) was not changed.
- The C3 and D branches were verified in git worktrees whose `site/node_modules` is a symlink; Turbopack refuses to build through it, so their site gate (`cd site && rm -rf .next && npm run check`) was run at a detached checkout of each branch in the main tree instead (both clean). The preflight’s site gate also learned to clear `site/.next` first: a build from another branch had failed the typecheck on C1 (fix commit cherry-picked onto every branch).
- Pull requests were opened with `gh api` (REST): `gh pr create` needs GraphQL, which the session's proxy blocks.

## Rollback

- The frozen build: `git push --force-with-lease origin release/v1-workshop:main` (from any machine with push rights; a repository admin bypasses the ruleset once it is applied).
- A single merged pull request: revert its merge commit on `main` (GitHub → the PR → Revert), which is itself a pull request through CI.
- The ruleset, if it ever blocks you: Settings → Rules → Rulesets → "main: pull request + check + smoke, no force push" → Delete.
