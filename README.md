# TenderScout (ESCP-2627DT-[team])

**AI reads new EU public tenders in any language and tells a small firm, in one line and with the page that proves it, whether it can actually bid.**

ESCP Digital Transformation (MG34) · Digital Product Design · Group C · Workshop Thu 5 Nov 2026
Team: [names] · Lecturer: `@drdml`

| | |
|---|---|
| Idea brief and pitch | [`BRIEF.md`](BRIEF.md) |
| Stakeholder evidence | [`evidence.md`](evidence.md) |
| Interview kit | [`docs/INTERVIEW_KIT.md`](docs/INTERVIEW_KIT.md) |
| Navigation map and flows | [`docs/NAVIGATION.md`](docs/NAVIGATION.md) |
| Visual design spec (source of truth) | [`DESIGN.md`](DESIGN.md) |
| Build handoff for Claude Code | [`CLAUDE.md`](CLAUDE.md) |
| Design handoff v2 (wins over DESIGN.md where they differ) | [`design/HANDOFF_V2.md`](design/HANDOFF_V2.md) · [`design/MOTION.md`](design/MOTION.md) |
| Website handoff (v3) and the shared design system | [`design/website/HANDOFF_WEBSITE.md`](design/website/HANDOFF_WEBSITE.md) · [`shared/tokens.json`](shared/tokens.json) · [`docs/WEBSITE_BUILD_LOG.md`](docs/WEBSITE_BUILD_LOG.md) |
| Live prototype | [`https://pioche8.github.io/ESCP-2627DT-C1/`](https://pioche8.github.io/ESCP-2627DT-C1/) (GitHub Pages from `main` / root) |

## Prototype
Mobile-first static web app: plain HTML/CSS/JS, no build step, no dependencies.

```
index.html     app shell (loads shared/tokens.css, then styles.css)
shared/        tokens.json = the ONE place colours, type, radii, shadows, easing and durations are written;
               build-tokens.js generates tokens.css (app) + site/src/styles/tokens.css (Tailwind) + site/src/generated/tokens.ts;
               check-contrast.js audits WCAG AA for every theme (297 pairs)
styles.css     components only; palettes Brand (default, the website's), Sky and Harbor, light + dark, from shared/tokens.css
fonts/         vendored Hanken Grotesk, IBM Plex Mono, Material Symbols subset (38 glyphs, shared with the site; no CDN)
assets/img/    six photos from the design pack (200 px Canva previews, replace with the full-res originals)
design/        the designer's handoffs: HANDOFF_V2.md, MOTION.md, token file, drawn screens, the three films and website/ (the v3
               website reference pages + HANDOFF_WEBSITE.md); design/assets/sectors/ holds the 45 CPV previews (reference pages, not app code)
site/          the marketing website (Next.js, deployed separately on Vercel; see "Website" below)
marketing/     backup demo video: the launch film as MP4 (16:9 and 9:16) plus the render and encode scripts
app.js         screens + hash router (#/feed, #/t/:id, #/bids, #/company, #/about)
engine.js      REAL CODE: qualification check, score, Go/Maybe/No-go verdict (unit-tested)
ai.js          SIMULATED AI: tender reading, Q&A, profile drafting (pre-written output)
data.js        FICTIONAL demo company and 6 fictional tenders (DE, AT, ES, NL, FR)
tests/         node tests/engine.test.js   (24 tests: the original 14 + 10 for the restyle)
               node tests/smoke.js         (optional Playwright smoke test, 390×844, Brand, Sky and Harbor in light and dark, plus reduced motion)
tests.html     same engine tests in the browser
```

**Run locally:** open `index.html`, or `python3 -m http.server` and go to `http://localhost:8000`.
**Reset the demo:** add `?demo=reset` to the URL, or ⓘ → Reset demo.
**Test-only URL options:** `?today=2026-12-23` shows the Closed state (deadlines passed); `?offline=1` shows the offline banner; `?palette=brand|sky|harbor` picks the palette, same as About → Palette. Without them the demo date stays fixed at Thu 5 Nov 2026 and the palette is Brand.
**Deploy:** repo Settings → Pages → Deploy from branch `main`, folder `/ (root)`. `.nojekyll` keeps Pages from running Jekyll over the repo (the `site/` and `design/` folders are served as plain files and ignored).
**Design tokens:** edit `shared/tokens.json`, run `node shared/build-tokens.js` (or `npm run sync` in `site/`), then `node shared/check-contrast.js`. Nobody hand-edits colours in two places.

### What's real and what's simulated
- **Real:** the decision logic. Change the profile (turnover, certificates, references, languages) and every verdict is recalculated by `engine.js`. Covered by tests.
- **Simulated:** anything a language model would do (reading PDFs, translating, answering questions). Marked "Simulated AI" in the UI. No API keys, no data leaves the phone.
- **Fictional:** every company, buyer, tender, quote and page number in `data.js`. Not evidence.

## Website
`site/` is the one-page marketing website from the designer's v3 handoff (`design/website/`): Next.js 16 (App Router) + TypeScript + Tailwind v4 + Framer Motion, 13 sections plus the full-screen menu. It runs the app's real `engine.js` on the app's `data.js` (both copied verbatim into `site/src/generated/` by `scripts/sync-shared.mjs`), so every number on the page (6 tenders, 777 pages, 45 sectors, Hohenau 25 → Maybe 90 → Go 100) is the app's. The map is d3-geo + topojson on `world-atlas` from npm (nothing fetched at runtime). Fonts are the app's vendored files through `next/font/local`. Honesty: "Prototype · all companies and tenders are fictional" in the hero, menu, Start and footer; weekly sector counts are labelled illustrative; every CTA opens the live app.

```
cd site
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + typecheck + build (prebuild re-syncs tokens, engine, data, fonts and photos from the app)
node scripts/shots.cjs            # screenshots at 1440 / 1024 / 768 / 390 + console and horizontal-scroll checks (Playwright)
node scripts/a11y-motion.cjs      # reduced-motion and keyboard checks
node scripts/contact-sheet.cjs    # the site's PhoneDemo next to the real app, same states
```

**Vercel:** import the repository, **Root Directory = `site`**, framework Next.js, build command `npm run build`, output directory left at the default (`.next`), install command `npm install`, Node 22. No environment variables. Optional: Settings → Root Directory → "Include source files outside of the Root Directory" lets `prebuild` re-sync from the app on every deploy; without it the committed copies in `site/src/generated`, `site/src/fonts` and `site/public/assets` are used (keep them in sync with `npm run sync`). The live app URL the CTAs point to is `APP_URL` in `site/src/data/copy.ts`.

**Static export:** `STATIC_EXPORT=1 npm run build` writes a fully static copy to `site/out/` (relative asset paths, unoptimized images, Cache Components off) for previews or plain static hosts. The default build stays the Vercel one.

**Photos:** `site/public/assets/**.jpg` are 3× upscales of the 200 px Canva previews (made by `scripts/sync-shared.mjs` from `design/assets/`). Replace them with the full-resolution exports under the same names.

## Repo setup checklist (before Thu 5 Nov, 09:00)
- [ ] Create repo `ESCP-2627DT-<team>` (public), push these files
- [ ] Invite all members + `@drdml`
- [ ] Enable GitHub Pages and paste the URL above
- [ ] `git tag v0-shell` on the first commit **only if no interview happened before it** (see the TODO in `evidence.md` §0; not tagged on 3 Nov)
- [ ] Interviews → `evidence.md` → gate verdict Tue 18:00
- [ ] Update `data.js` / copy with what the evidence changed → `git tag v1-workshop`
- [ ] Rehearse the 75-second demo on a real phone (BRIEF.md) and keep a screen recording as backup

## AI use (ESCP policy disclosure)
- **Claude (Anthropic):** idea selection support, v0 prototype scaffold (all code in this commit), brief draft, interview kit and templates, desk research summary. Session date: 2 Nov 2026.
- **Codex / ChatGPT Edu:** [changes made during the workshop]
- **Figma:** [flows / screens, if used]
- **The team:** all stakeholder interviews and notes, insights, gate decision, final product decisions.
- **Claude Code (Anthropic), 2 Nov 2026:** restyled the prototype to `DESIGN.md` ("Bold" v2.0) from the team's handoff (`CLAUDE.md`). Changed: new `styles.css` (tokens, light + dark), vendored fonts in `fonts/`, all `app.js` render functions and the new states (reading, loading, closed, empty, offline, saved, skipped), progress callbacks in `ai.js`, optional `doc`/`highlight` display fields in `data.js`, and new engine functions for reason lines, the Company re-score card and unlock hints (`reasonLine`, `headline`, `verdicts`, `diff`, `whatIf`) with 10 new tests. Not changed: `evaluate()`, `rank()` and their results, the original 14 tests, and the demo data values. Four DESIGN.md colours were adjusted to pass WCAG AA (listed at the top of `styles.css`). Fixed the workshop date to Thu 5 Nov in the docs. Every decision where DESIGN.md and the handoff conflicted was made by the team (log in `CLAUDE.md` §11).
- **Claude Code (Anthropic), 3 Nov 2026:** the 2 Nov session's container was lost before anything was pushed, so this repository was rebuilt from that session's transcript: every file re-created from the recorded edits and verified against the recorded snapshots, fonts re-downloaded with the same commands, then both test suites re-run (24 engine tests; 114 smoke checks in light and dark, from `file://` and over HTTP). No functional change to the prototype. Docs only: the `v0-shell` decision (TODO line in `evidence.md` §0 instead of a tag), this entry, and `CLAUDE.md` §12 on what still has to be restored from the team's copies (`DESIGN.md`, the rest of `evidence.md` and `docs/INTERVIEW_KIT.md`, `docs/screens.png`).
- **Claude Code (Anthropic), 3 Nov 2026 (website + shared design system):** built the marketing website in `site/` from the designer's v3 handoff (`design/website/`), and fused the app onto one design system. New: `shared/tokens.json` with its generator (`shared/build-tokens.js` → `shared/tokens.css`, the site's Tailwind theme and a TS module) and a WCAG AA audit (`shared/check-contrast.js`, 297 pairs, 0 failures); the site (13 sections, menu, d3-geo map, PhoneDemo on the real `engine.js`), its screenshot, motion/keyboard and contact-sheet scripts. App changes: `index.html` loads `shared/tokens.css`; the Brand palette (the website's) is the default with Sky and Harbor kept on About; verdict tiles, the Welcome sector band (chip marquee), the Welcome CTA (liquid metal), the dock badge, the wordmark dot and the re-score timing now match the site; `DEMO.SECTORS` moved into `data.js`; the icon subset was re-cut to 38 glyphs. Not changed: `engine.js`, its 24 tests, `ai.js`, routes and storage (`tenderscout.v2`). The smoke test runs in six themes. Every decision taken without the team, every value that differs from the handoff and the hand-done steps (the `v1-workshop-safe` tag, Vercel) are in `docs/WEBSITE_BUILD_LOG.md` and `CLAUDE.md` §11.
- **Claude Code (Anthropic), 3 Nov 2026 (design v2):** applied the designer's handoff v2 (`design/HANDOFF_V2.md`): the Sky and Harbor palettes with a persisted switch on About, photography on the feed cards, Bids, tender header and Company, the redesigned Welcome with the moving band of all 45 EU sectors, the handoff's entrance animations and a card-to-detail morph (View Transitions, feature-detected, off under reduced motion). Engine, data and tests are unchanged except for a display-only `photo` field and the firm's fourth CPV division, which changes no score. Fourteen token values were adjusted to keep WCAG AA in all four themes (listed at the top of `styles.css`; decisions in `CLAUDE.md` §11 items 15–24). The smoke test now runs in four themes. The launch film in `design/films/` was rendered to MP4 offline (local copies of React and Babel driving the stage's seek event frame by frame) as a backup demo in `marketing/`. Later the same day the in-app motion was tightened to `design/MOTION.md`: the re-score card now grows out of the control that changed (with a ghost left behind), pops are 480 ms easeOutBack, and the Feed's pages line gets a one-shot shimmer; all off under reduced motion.

