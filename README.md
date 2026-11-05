# TenderScout (ESCP-2627DT-C1)

**AI reads new EU public tenders in any language and tells a small firm, in one line and with the page that proves it, whether it can actually bid.**

ESCP Digital Transformation (MG34) · Digital Product Design · Group C · Workshop Thu 5 Nov 2026
Team: <!-- TEAM NAMES -->[names] · Lecturer: `@drdml`

| | |
|---|---|
| **Start here** (build day: run it, where things live, verification, conventions, tasks) | [`docs/START_HERE.md`](docs/START_HERE.md) |
| Idea brief and pitch | [`BRIEF.md`](BRIEF.md) |
| Stakeholder evidence | [`evidence.md`](evidence.md) |
| Interview kit | [`docs/INTERVIEW_KIT.md`](docs/INTERVIEW_KIT.md) |
| Navigation map and flows | [`docs/NAVIGATION.md`](docs/NAVIGATION.md) |
| Architecture (one page + diagram: data → engine → screens, tokens, state, URL parameters, gates, deploy, rollback) | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| How it decides (generated from the engine; the website's `/how` page renders the same model) | [`docs/HOW_IT_DECIDES.md`](docs/HOW_IT_DECIDES.md) |
| Overnight report, 5 Nov 2026 (the pull requests in merge order, gates, caveats, rollback) | [`docs/reports/2026-11-05-overnight.md`](docs/reports/2026-11-05-overnight.md) |
| Visual design spec (source of truth) | [`DESIGN.md`](DESIGN.md) |
| Build handoff for Claude Code | [`CLAUDE.md`](CLAUDE.md) |
| Design handoff v2 (wins over DESIGN.md where they differ) | [`design/HANDOFF_V2.md`](design/HANDOFF_V2.md) · [`design/MOTION.md`](design/MOTION.md) |
| Website handoff (v3) and the shared design system | [`design/website/HANDOFF_WEBSITE.md`](design/website/HANDOFF_WEBSITE.md) · [`shared/tokens.json`](shared/tokens.json) · [`docs/WEBSITE_BUILD_LOG.md`](docs/WEBSITE_BUILD_LOG.md) |
| Live prototype | [`https://pioche8.github.io/ESCP-2627DT-C1/`](https://pioche8.github.io/ESCP-2627DT-C1/) (GitHub Pages from `main` / root) |
| Backup demo (if the phone or the Wi-Fi fails) | [`docs/demo/`](docs/demo/): the 7-step path as MP4 and one PNG per step, linked from `BRIEF.md` |

## Prototype
Mobile-first static web app: plain HTML/CSS/JS, no build step, no dependencies.

```
index.html     app shell (loads shared/tokens.css, then styles.css)
shared/        tokens.json = the ONE place colours, type, the radius, easing and durations are written (nine colours per
               scheme, light + dark); build-tokens.js generates tokens.css (app) + site/src/styles/tokens.css (Tailwind) +
               site/src/generated/tokens.ts; check-contrast.js audits WCAG AA for every pair in both schemes (44 pairs)
styles.css     components only, on the nine colours and the one 8 px radius from shared/tokens.css (light + dark)
fonts/         vendored Hanken Grotesk and the Material Symbols subset (38 glyphs, shared with the site; no CDN)
assets/img/    six photos from the design pack (200 px Canva previews, replace with the full-res originals)
design/        the designer's handoffs: HANDOFF_V2.md, MOTION.md, token file, drawn screens, the three films and website/ (the v3
               website reference pages + HANDOFF_WEBSITE.md); design/assets/sectors/ holds the 45 CPV previews (reference pages, not app code)
site/          the marketing website (Next.js, deployed separately on Vercel; see "Website" below)
marketing/     backup demo video: the launch film as MP4 (16:9 and 9:16) plus the render and encode scripts
app.js         screens + hash router (#/feed, #/t/:id, #/bids, #/company, #/about)
engine.js      REAL CODE: qualification check, score, Go/Maybe/No-go verdict (unit-tested)
ai.js          SIMULATED AI: tender reading, Q&A, profile drafting (pre-written output)
data.js        FICTIONAL demo company and 6 fictional tenders (DE, AT, ES, NL, FR)
tests/         npm run preflight           (every gate below in order, one line each with pass/fail and the command to rerun it; --quick = node only)
               node tests/engine.test.js   (24 tests: the original 14 + 10 for the restyle)
               node tests/data-check.js    (data.js against what engine.js and app.js read: fields and types, unique ids, ISO dates, citations inside
                                            their documents, thresholds in range, no placeholder text, the honesty labels still rendered)
               node tests/demo-golden.test.js (the live demo's numbers through engine.js only: Hohenau 25 → 90 → 100, 1 Go · 2 Maybe · 3 No-go,
                                            777 pages in 4 languages; the storage key tenderscout.v2 and the ?demo=reset behaviour)
               node tests/engine-invariants.test.js (seeded property test: a fail is always No-go, score within 0–100, meeting one more
                                            requirement never lowers the score, verdict consistent with the score; SEED= and CASES=)
               node tests/smoke.js         (optional Playwright smoke test, 390×844, light + dark + reduced motion; scans every screen for the 18 declutter patterns)
               node tests/browser-tests.js (tests.html in Chromium over file:// and HTTP, 0 page errors)
               node tests/declutter-scan.js (static scan of the app's and the site's stylesheets for the same patterns)
               node tests/demo-record.js   (records the BRIEF.md demo path into docs/demo/: MP4 + one PNG per step; Playwright + ffmpeg)
               node tests/live-check.js    (compares the files GitHub Pages serves with this checkout, byte for byte; no dependencies)
tests.html     the engine tests and the demo pins in the browser
package.json   scripts only (preflight, test, smoke, tokens); the app itself has no dependencies
.github/       CI on every push and PR: "check" (engine tests, data check, demo pins, engine invariants, static declutter scan, AA audit,
               generated tokens in sync; node only, under a minute) and "smoke" (the Playwright click-through in Chromium at 390×844, on
               pull requests and pushes to main). Both are required on main; the pull-request template carries the verification checklist
```

**Run locally:** open `index.html`, or `python3 -m http.server` and go to `http://localhost:8000`.
**Light or dark:** the ◐ button in the header switches in one tap (persisted); ⓘ → Appearance adds "System" (follow the phone). The app opens dark.
**Reset the demo:** add `?demo=reset` to the URL, or ⓘ → Reset demo. **Live presentation:** `?demo=reset,fast` (or `?demo=fast` to keep your state) shortens the two simulated AI waits (profile draft, tender reading) to about 300 ms so the 75-second path in `BRIEF.md` fits; labels and output are unchanged.
**Test-only URL options:** `?today=2026-12-23` shows the Closed state (deadlines passed); `?offline=1` shows the offline note; `?theme=system|light|dark` picks the appearance, same as About → Appearance. Without them the demo date stays fixed at Thu 5 Nov 2026 and the app opens dark.
**Deploy:** repo Settings → Pages → Deploy from branch `main`, folder `/ (root)`. `.nojekyll` keeps Pages from running Jekyll over the repo (the `site/` and `design/` folders are served as plain files and ignored).
**Design tokens:** edit `shared/tokens.json`, run `node shared/build-tokens.js` (or `npm run sync` in `site/`), then `node shared/check-contrast.js`. Nobody hand-edits colours in two places. The palette is nine colours per scheme (background, surface, ink, muted ink, brand and the four verdict colours); there is one radius (8 px), one typeface (Hanken Grotesk, tabular figures), and no gradients, shadows, alpha colours, grain, pills, eyebrows, uppercase, italics or negative tracking anywhere. `tests/declutter-scan.js` proves it.

### What's real and what's simulated
- **Real:** the decision logic. Change the profile (turnover, certificates, references, languages) and every verdict is recalculated by `engine.js`. Covered by tests.
- **Simulated:** anything a language model would do (reading PDFs, translating, answering questions). Marked "Simulated AI" in the UI. No API keys, no data leaves the phone.
- **Fictional:** every company, buyer, tender, quote and page number in `data.js`. Not evidence.

## Website
`site/` is the one-page marketing website, built from the designer's v3 handoff (`design/website/`) and decluttered on 4 Nov 2026 onto the same nine-colour token set as the app: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Framer Motion, 13 sections plus the full-screen menu. It runs the app's real `engine.js` on the app's `data.js` (both copied verbatim into `site/src/generated/` by `scripts/sync-shared.mjs`), so every number on the page (6 tenders, 777 pages, 45 sectors, Hohenau 25 → Maybe 90 → Go 100) is the app's; the phone in "In the app" and the counts under the map are live results of that code. Honesty: "Prototype · all companies and tenders are fictional" in the hero, menu, Start and footer; weekly sector counts are labelled illustrative; every CTA opens the live app.

**Credits and how it works (moved here from the page):** the map's country shapes are Natural Earth data via the `world-atlas` npm package (110 m), projected with `d3-geo` and `topojson-client`; nothing is fetched at runtime. Fonts are the app's vendored Hanken Grotesk and Material Symbols files through `next/font/local`. The phone demo plays back the same pre-written "Simulated AI" output as the app.

```
cd site
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + typecheck + build (prebuild re-syncs tokens, engine, data, fonts and photos from the app)
node scripts/shots.cjs            # screenshots at 1440 / 1024 / 768 / 390 + console, horizontal-scroll and declutter-scan checks (Playwright)
node scripts/a11y-motion.cjs      # reduced-motion and keyboard checks
node scripts/contact-sheet.cjs    # the site's PhoneDemo next to the real app, same states
```

**Hosting:** the site is **not deployed yet**. Creating the project in the Vercel team was refused, so it deploys to Vercel once someone with team access imports the repository with **Root Directory = `site`** (framework Next.js, build command `npm run build`, output directory left at the default `.next`, install command `npm install`, Node 22, no environment variables; optionally "Include source files outside of the Root Directory" so `prebuild` re-syncs from the app on every deploy; without it the committed copies in `site/src/generated`, `site/src/fonts` and `site/public/assets` are used, kept in sync with `npm run sync`). Until then, `STATIC_EXPORT=1 npm run build` produces a static preview in `site/out/`. The live app URL the CTAs point to is `APP_URL` in `site/src/data/copy.ts`.

**Static export:** `STATIC_EXPORT=1 npm run build` writes a fully static copy to `site/out/` (relative asset paths, unoptimized images, Cache Components off) for previews or plain static hosts. The default build stays the Vercel one.

**Photos:** `site/public/assets/**.jpg` are 3× upscales of the 200 px Canva previews (made by `scripts/sync-shared.mjs` from `design/assets/`, when `sharp` is installed). Replace them with the full-resolution exports under the same names. Photos always sit in their own block; no text is placed on them.

## Repo setup checklist (before Thu 5 Nov, 09:00)
- [ ] Create repo `ESCP-2627DT-<team>` (public), push these files
- [ ] Invite all members + `@drdml`
- [ ] Enable GitHub Pages and paste the URL above
- [ ] `git tag v0-shell` on the first commit **only if no interview happened before it** (see the TODO in `evidence.md` §0; not tagged on 3 Nov)
- [ ] Interviews → `evidence.md` → gate verdict Tue 18:00
- [x] Update `data.js` / copy with what the evidence changed → the workshop version is the branch **`release/v1-workshop`** (tag pushes are blocked from the build sessions, so the freeze point is a branch at the final `main` commit of 4 Nov). Roll the app and the site back to it in one command: `git push --force-with-lease origin release/v1-workshop:main`
- [ ] Rehearse the 75-second demo on a real phone (BRIEF.md); the backup recording is in `docs/demo/` (BRIEF.md → "If the phone or the Wi-Fi fails")
- [ ] From a laptop: `node tests/live-check.js` (the live URL serves `main`) and `SMOKE_URL=https://pioche8.github.io/ESCP-2627DT-C1/ node tests/smoke.js`

## AI use (ESCP policy disclosure)
- **Claude (Anthropic):** idea selection support, v0 prototype scaffold (all code in this commit), brief draft, interview kit and templates, desk research summary. Session date: 2 Nov 2026.
- **Codex / ChatGPT Edu:** [changes made during the workshop]
- **Figma:** [flows / screens, if used]
- **The team:** all stakeholder interviews and notes, insights, gate decision, final product decisions.
- **Claude Code (Anthropic), 2 Nov 2026:** restyled the prototype to `DESIGN.md` ("Bold" v2.0) from the team's handoff (`CLAUDE.md`). Changed: new `styles.css` (tokens, light + dark), vendored fonts in `fonts/`, all `app.js` render functions and the new states (reading, loading, closed, empty, offline, saved, skipped), progress callbacks in `ai.js`, optional `doc`/`highlight` display fields in `data.js`, and new engine functions for reason lines, the Company re-score card and unlock hints (`reasonLine`, `headline`, `verdicts`, `diff`, `whatIf`) with 10 new tests. Not changed: `evaluate()`, `rank()` and their results, the original 14 tests, and the demo data values. Four DESIGN.md colours were adjusted to pass WCAG AA (listed at the top of `styles.css`). Fixed the workshop date to Thu 5 Nov in the docs. Every decision where DESIGN.md and the handoff conflicted was made by the team (log in `CLAUDE.md` §11).
- **Claude Code (Anthropic), 3 Nov 2026:** the 2 Nov session's container was lost before anything was pushed, so this repository was rebuilt from that session's transcript: every file re-created from the recorded edits and verified against the recorded snapshots, fonts re-downloaded with the same commands, then both test suites re-run (24 engine tests; 114 smoke checks in light and dark, from `file://` and over HTTP). No functional change to the prototype. Docs only: the `v0-shell` decision (TODO line in `evidence.md` §0 instead of a tag), this entry, and `CLAUDE.md` §12 on what still has to be restored from the team's copies (`DESIGN.md`, the rest of `evidence.md` and `docs/INTERVIEW_KIT.md`, `docs/screens.png`).
- **Claude Code (Anthropic), 3 Nov 2026 (website + shared design system):** built the marketing website in `site/` from the designer's v3 handoff (`design/website/`), and fused the app onto one design system. New: `shared/tokens.json` with its generator (`shared/build-tokens.js` → `shared/tokens.css`, the site's Tailwind theme and a TS module) and a WCAG AA audit (`shared/check-contrast.js`, 297 pairs, 0 failures); the site (13 sections, menu, d3-geo map, PhoneDemo on the real `engine.js`), its screenshot, motion/keyboard and contact-sheet scripts. App changes: `index.html` loads `shared/tokens.css`; the Brand palette (the website's) is the default with Sky and Harbor kept on About; verdict tiles, the Welcome sector band (chip marquee), the Welcome CTA (liquid metal), the dock badge, the wordmark dot and the re-score timing now match the site; `DEMO.SECTORS` moved into `data.js`; the icon subset was re-cut to 38 glyphs. Not changed: `engine.js`, its 24 tests, `ai.js`, routes and storage (`tenderscout.v2`). The smoke test runs in six themes. Every decision taken without the team, every value that differs from the handoff and the hand-done steps (the `v1-workshop-safe` tag, Vercel) are in `docs/WEBSITE_BUILD_LOG.md` and `CLAUDE.md` §11.
- **Claude Code (Anthropic), 3 Nov 2026 (vibe pass):** made the app look and feel like the marketing website (the site's PhoneDemo and its dark, restrained atmosphere). Changed: `styles.css` rewritten on the shared tokens (the website's near-black ground with one audited glow blob per screen and the grain overlay, dark glass chrome, the PhoneDemo dock with its sliding pill, the white pill primary with an arrow, mono eyebrows and two-tone titles, the compact count row, the glass tender header with the score in the verdict colour, the Company photo with the soft-light tint); `app.js` render functions for that markup plus the persistent dock, the word-by-word reveal, the 777 count-up and the touch glow; `index.html` and `app.js` open dark by default with `?theme=` as a deep link; `shared/tokens.json` gained the glass, pill, primary, switch, unlit, scrim, grain, input and per-screen glow tokens (and lost `seg-on`), with seven AA adjustments listed under `adjusted`; `shared/check-contrast.js` now audits every glow peak and the glass header over it (729 pairs, 0 failures); `tests/smoke.js` checks the new chrome and the reduced-motion behaviour; one type fix in the site's `GlowBlob`. Not changed: `engine.js` and its 24 tests, `ai.js`, `data.js`, routes, storage shape, the "Simulated AI" and fictional-data labels. Decisions taken alone are `CLAUDE.md` §11 items 41–52; the rollback branch is `backup/pre-vibe`.
- **Claude Code (Anthropic), 4 Nov 2026 (declutter, app + website):** removed eighteen visual patterns from both products on the team's brief: pills, tags, chips and badges (statuses and labels are plain text, the floating dock became a full-width bottom tab bar, filters and stages are underlined text tabs), italics, negative tracking, mono type (IBM Plex Mono and the italic font files were deleted), eyebrows, section numbering, all-caps text, dividers, bordered containers, shadows, gradients, glow blobs, grain, photo overlays, large radii (one 8 px radius now) and file or library names in visible text. The palette was cut to nine solid colours per scheme in `shared/tokens.json` (`adjusted` lists every value that differs from the handoff and why); Sky and Harbor were dropped because they only differed by tints and glass the brief removes. Copy on every screen was shortened. Changed: `shared/tokens.json`, `build-tokens.js`, `check-contrast.js` (44 pairs, 0 failures), `styles.css`, `app.js` render functions, `index.html`, `tests/smoke.js`, the new `tests/declutter-scan.js`, and most of `site/src/` plus its scripts. Not changed: `engine.js` and its 24 tests, `ai.js`, `data.js`, routes, `data-*` hooks, the `tenderscout.v2` storage shape, the "Simulated AI" and fictional-data labels, the card → detail and switch → re-score motion. Decisions taken alone are `CLAUDE.md` §11 items 53–68; the rollback branch is `backup/pre-declutter`.
- **Claude Code (Anthropic), 4 Nov 2026 (workshop follow-up):** the Welcome form sits under the subtitle (no dead space on 375×667 / 390×844 / 430×932); `?demo=fast` (and `?demo=reset,fast`) caps the simulated waits in `ai.js` for the live demo; the ◆ "Needs your check" line shows a 44 px "Check →" call to action; `scroll-padding` for the fixed bars, the re-score card scrolls back into view on short screens, and aborted view transitions are swallowed; the smoke test takes `SMOKE_BROWSER` and `SMOKE_DEVICE` (iPhone 13 and iPhone SE profiles run in Chromium; WebKit cannot be downloaded here); the launch film source was restyled to the token set and both MP4s re-rendered; the freeze point is the branch `release/v1-workshop`; the README says the site is not on Vercel yet. Decisions: `CLAUDE.md` §11 items 69–75.
- **Claude Code (Anthropic), 4 Nov 2026 (workshop-day preparation):** hardening and preparation only, no feature or copy change in the app. Safari (iOS 17) inspection: three CSS additions (`touch-action: manipulation` on tap targets, `-webkit-user-select` on the icon glyphs, `touch-action: none` on the sheet scrim); everything else on the checklist already held (feature-detected View Transitions, `100dvh` with a `100vh` fallback, `viewport-fit=cover` with `env(safe-area-inset-bottom)` on every fixed bar, storage access in try/catch, self-hosted Hanken Grotesk with `font-display: swap`, 16 px inputs, no CSS nesting or other post-iOS-17 syntax). New: `tests/demo-record.js` and the backup recording in `docs/demo/`; `tests/live-check.js`; two smoke checks on `?demo=reset`; `.github/workflows/check.yml` and the PR template; `docs/START_HERE.md`. The live site could not be fetched from the build container (github.io and the Pages API are blocked there), so the live checks are listed for the team to run from a laptop. Decisions: `CLAUDE.md` §11 items 76–83; the frozen workshop version stays `release/v1-workshop`.
- **Claude Code (Anthropic), 4 Nov 2026 (appearance toggle and buttons):** a ◐ light / dark toggle in the header of Welcome, Feed, Bids and Company (one tap, persisted; About keeps System / Light / Dark); secondary buttons became the muted colour as a solid fill with ground-coloured text so they read as buttons in the dark scheme too (the audit gained the pair, 46 pairs, 0 failures); the two answer buttons on an unresolved line share one width; Reset demo is plain red text; button bars use 12 px gaps; on the Feed the "Simulated AI" label moved from the header to the pages line so the header fits a 320 px phone. Icon from the existing 38-glyph subset (`contrast`), no font re-cut. Changed: `app.js`, `styles.css`, `shared/check-contrast.js`, `tests/smoke.js` (five new checks), `docs/NAVIGATION.md`, the backup recording in `docs/demo/`. Not changed: `engine.js`, `data.js`, `ai.js`, tokens, routes, storage. Decisions: `CLAUDE.md` §11 items 84–86.
- **Claude Code (Anthropic), 5 Nov 2026 (overnight pass, 01:30–07:00 before the workshop, four pull requests merged by the team in the morning):** (A) tests and CI only: `tests/data-check.js` (data.js against what the engine and the UI read), `tests/demo-golden.test.js` (the live demo's numbers through the engine, the storage key, the reset), `tests/engine-invariants.test.js` (a seeded property test), `tests/browser-tests.js`, `npm run preflight` with a scripts-only root `package.json`, a second CI job `smoke` (the Playwright click-through in Chromium) and the `main` ruleset as a file to apply from a laptop (`.github/ruleset-main.json`; the build container may not write repository settings). (B) the website's `/how` page, "How it decides", generated by `shared/how-it-decides.js`, which probes `engine.js` and writes both the page's data and `docs/HOW_IT_DECIDES.md`; "Try the rules" on the real engine; per-page metadata, Open Graph image and icons rendered from the tokens, robots and sitemap; Lighthouse (median of three, ≥ 95) and axe-core (0 violations) as site checks, with the landing page's map loading near the viewport and keyboard access on the tender carousel. (C) app resilience as three independent pull requests: an error fallback screen with one Restart button that keeps `tenderscout.v2`; a seeded off-script monkey test (`tests/monkey.js`, behind `MONKEY=1`) with the smallest fixes for what it found; home-screen install (manifest, icons, Apple meta tags, no service worker). (D) `ARCHITECTURE.md`, `docs/HOW_IT_DECIDES.md` and the morning report `docs/reports/2026-11-05-overnight.md`. Not changed by A, B and D: any deployed app byte. Decisions taken alone: `CLAUDE.md` §11 items 87 onward. WebKit still could not be installed and github.io could not be fetched from the container.
- **Claude Code (Anthropic), 3 Nov 2026 (design v2):** applied the designer's handoff v2 (`design/HANDOFF_V2.md`): the Sky and Harbor palettes with a persisted switch on About, photography on the feed cards, Bids, tender header and Company, the redesigned Welcome with the moving band of all 45 EU sectors, the handoff's entrance animations and a card-to-detail morph (View Transitions, feature-detected, off under reduced motion). Engine, data and tests are unchanged except for a display-only `photo` field and the firm's fourth CPV division, which changes no score. Fourteen token values were adjusted to keep WCAG AA in all four themes (listed at the top of `styles.css`; decisions in `CLAUDE.md` §11 items 15–24). The smoke test now runs in four themes. The launch film in `design/films/` was rendered to MP4 offline (local copies of React and Babel driving the stage's seek event frame by frame) as a backup demo in `marketing/`. Later the same day the in-app motion was tightened to `design/MOTION.md`: the re-score card now grows out of the control that changed (with a ghost left behind), pops are 480 ms easeOutBack, and the Feed's pages line gets a one-shot shimmer; all off under reduced motion.

