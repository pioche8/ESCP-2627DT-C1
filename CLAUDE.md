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
index.html          shell; loads shared/tokens.css + styles.css, then engine.js → data.js → ai.js → app.js as classic scripts (works from file:// too)
shared/tokens.json  THE token source (nine colours per scheme, verdict shapes, type, the one radius, easing, durations, AA adjustments)
shared/build-tokens.js   generates shared/tokens.css (app), site/src/styles/tokens.css (Tailwind @theme), site/src/generated/tokens.ts, .design-cache/
shared/check-contrast.js WCAG AA audit of every text/background pair in both schemes (must stay at 0 failures)
styles.css          components only (4 Nov: decluttered: flat surfaces, one 8 px radius, plain-text statuses, a full-width bottom tab bar; colours come from shared/tokens.css)
site/               the marketing website (Next.js 16; not deployed yet, Vercel needs a team member to import it with Root Directory = site; STATIC_EXPORT=1 npm run build makes a static preview); runs the app's engine.js on data.js (copies via scripts/sync-shared.mjs)
design/website/     the designer's website handoff (reference pages + HANDOFF_WEBSITE.md); design/assets/sectors/ = the 45 CPV previews
.nojekyll           GitHub Pages serves the repo as plain files
app.js              UI rendering + hash router + event delegation + state/localStorage
engine.js           REAL decision logic (UMD: window.Engine in browser, module.exports in node)
data.js             FICTIONAL demo company + 6 fictional tenders (window.DEMO / module.exports)
ai.js               SIMULATED AI layer (promises with delays, pre-written output)
tests/engine.test.js   node tests: `node tests/engine.test.js` (the original 14 + 10 added on 2 Nov = 24)
tests/smoke.js         Playwright smoke test, 390×844, light + dark + reduced motion, with the declutter scan on every screen (dev-only)
tests/declutter-scan.js static CSS scan + rendered-DOM scan for the 18 declutter patterns (used by smoke.js and site/scripts/shots.cjs)
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
- One `localStorage` key, `tenderscout.v1`: `{ onboarded, profile, overrides, saved, skipped, filter }`. **Now `tenderscout.v2`** (since 2 Nov): `skipped[id] = { reasons: [], at }` and `theme` were added (`theme` defaults to `dark` since the vibe pass; `?theme=` sets it). A `palette` field is still written (`'brand'`) for shape stability but no longer read (4 Nov). All access goes through try/catch with an in-memory fallback (private mode).
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
8. Commit, then freeze. Tag pushes are blocked from the build sessions, so the workshop version is the branch **`release/v1-workshop`** at the final `main` commit of 4 Nov 2026 (not a tag). Rollback in one command: `git push --force-with-lease origin release/v1-workshop:main`. (`v0-shell` is not tagged either, see item 14.)

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
24. `evidence.md` and `docs/INTERVIEW_KIT.md` were partial after the rebuild (the pack had no `restore/` folder); the team restored both on `main` on 3 Nov (commits after `fca540a`).
25. **Motion tightened to `design/MOTION.md`** (3 Nov, later): the re-score card is one object changing shape: it grows out of the control that changed (FLIP with the Web Animations API, 700 ms `--ease-morph`, contents fade in over the second half) and a faint dashed ghost stays on the control for 700 ms. Plain pop when the card is off-screen, when `Element.animate` is missing, or under reduced motion. Pop timing is 480 ms easeOutBack (`--ease-back`) everywhere, within MOTION.md's 400–520 ms. The Feed's hold is kept alive by one brand-coloured shimmer across the "Read 777 pages…" line, 1.1 s after load, once; zero duration under reduced motion. Count-up and tile re-flex are unchanged. `engine.js` and its tests untouched.

Website + shared design system, 3 Nov 2026 (later). Full log with the verification results, the unmatched list and the hand-done steps: `docs/WEBSITE_BUILD_LOG.md`.
26. **One token source.** `shared/tokens.json` → `node shared/build-tokens.js`. The app's `styles.css` lost its token blocks (the cobalt fallback of item 15 included; the values stay in `design/explorations/v3-tokens.css`); `index.html` loads `shared/tokens.css` first. `node shared/check-contrast.js` must report 0 failures (297 pairs).
27. **Brand palette = the website's, and the default.** The website is neither Sky nor Harbor (black ground, sky accent, amber-red badge), so per the brief it became the app's default palette "Brand": dark = the website's phone (`#0B111C` / `#131B2A` / `#1A2335`, sky dock pill, amber-red count badge); light = Sky light with the website's dock. Sky and Harbor stay on About. A profile that still carries the old default `'sky'` keeps Sky; `?demo=reset` lands on Brand.
28. **AA over the pack's colours, again.** No-go `#E04A2F` → `#D0452C` on the site and in Brand/Sky (white 12–17 px labels), site text-4 `#5C6370` → `#7A8290`, quote/placeholder ink `#7A8899`/`#6F7E92` → `#637082`, map labels `#4F79B5`/`#2A303B` → `#86ADE6`/`#7A8290`, map credit `#454B57` → `#8A93A3`, unlit statement words `#23272F` → `#5A606A`. All listed under `adjusted` in `tokens.json`.
29. **The engine's numbers win on the website.** "214 tenders tonight" → 6; "Meets all 8 requirements" → "Meets all 4 requirements"; Hohenau 25 → 92 became 25 → Maybe 90 (ISO 27001) → Go 100 ("We meet it", a third row in the phone's Company screen); days left 18 / 21 / 34 → 22 / 35 / 47; "next deadline in 18 days" → 22; CPV 79 strip "17 open" → 39 (the pack's own table). Verdict reasons are `Engine.reasonLine` (longer than the pack's).
30. **Weekly sector counts are illustrative**, labelled in the section copy, the footer label and every card's accessible name; they live only in `site/src/data/sectors.ts`. `DEMO.SECTORS` (the 45 divisions) moved into `data.js` so app and site share one list; the site uses the app's longer names.
31. **Photos:** the two tenders without a photo show the app's document placeholder on the site too (the pack reused app photos as stand-ins). `site/public/assets/**.jpg` are 3× Lanczos upscales of the 200 px previews so `next/image` serves 2× DPR and Lighthouse's resolution audit passes; replace under the same names.
32. **Fonts:** `next/font/local` on the app's vendored files (latin subsets), no build-time Google Fonts. The Material Symbols subset was re-cut to 38 glyphs for both.
33. **Links:** the film links open the rendered MP4 on GitHub Pages (`marketing/`); the footer's "UI library" became "Source on GitHub" + "Try the prototype"; the header CTA reads "Try the prototype" and opens the live app, the menu's "Get started" scrolls to Start, the Start button opens the app.
34. **Map:** pins re-score with the real engine; with cross-border off, ES/NL/FR become No-go through the region knock-out (score 25) instead of the pack's "Outside your countries · 20".
35. **Tailwind v4:** the theme is a generated `@theme` block, not a JS config.
36. **Vercel Root Directory = site:** the site keeps committed copies of the shared sources (`src/generated/engine.cjs`, `data.cjs`, `tokens.ts`, `src/fonts/`, `public/assets/`), refreshed by `prebuild` when the app is beside it.
37. **App fusion:** verdict tiles are the site's phone tiles (88 px, radius 20, shape top, 30 px count, label under); the Welcome band is the site's chip marquee (two rows); the Welcome CTA is the site's liquid-metal button (the only place with that effect); the dock shows the amber-red saved-count badge on Bids; the wordmark carries the 10 px dot; count-up 650 ms easeOutCubic and tiles 450 ms on both. Everything else (routes, sheets, morphs, labels, storage) unchanged.
38. **Mobile layouts** (< 1024 / 768 / 480 px) are additions: the reference is desktop-only. The sticky How-it-works visual becomes a 46 vh band with the steps centred beneath it; the strips stack; the menu becomes a scrolling column; the Start pill wraps.
39. **Performance:** the hero glow moves on the compositor, the wordmark gradient updates at 20 fps, loops and the marquee pause off-screen. Framer Motion drives the menu slide, the step crossfade, the dock pill, the re-score block colour and the accordion, all instant under reduced motion (`MotionConfig reducedMotion="user"` + explicit zero durations).
40. **design-drift** is locked on the generated token sheet (`.design-lock` + `.design-cache/tenderscout.md`, both gitignored and regenerated by the token build); only pill and circle radii remain as warnings.

Vibe pass, 3 Nov 2026 (later still): the app made to look and feel like the marketing website (brief: the site's PhoneDemo plus the site's overall vibe, dark, cinematic, restrained, colour only where it means something). Decisions taken without the team:
41. **Dark first.** The website is dark-only, so a fresh app state (and `?demo=reset`) opens dark; About keeps System / Light / Dark, and `?theme=system|light|dark` is a demo and test deep link like `?palette=`. A stored `system` or `light` choice is kept. Every palette still has a light scheme and every pair is audited.
42. **Ground = the website's.** Brand dark sits on the site's `bg` (#02040A) with `surface` / `surface-2` as cards and the PhoneDemo's glass dock. Sky and Harbor keep their own grounds (the designer's v2 identity) and get the same layering: one blurred glow blob per screen (`.ground .glow`, tinted by the screen's mood: Feed sapphire, Bids sea, Company sky, Welcome sea, About sapphire, a tender detail its verdict colour) plus the site's grain overlay, both `pointer-events: none` behind the content.
43. **Glow opacities are audited, not eyeballed.** The site's core glow (white centre) drops ink-3 under 3:1 at any useful opacity, so the app uses the site's single-colour secondary blobs at .15–.42 (dark) and .08–.18 (light); `shared/check-contrast.js` composites every mood's peak over every theme's ground and checks ink, ink-2, ink-3, brand-text and the verdict text colours on it, and on the glass header over it (729 pairs, 0 failures). Light ink-3 (#637082 → #5A6474 / #5B6479), light brand-text (#0A6CBC → #0862AC) and Sky/Harbor dark ink-3 (#878B92 → #8A93A3) moved for that headroom; all under `adjusted` in `tokens.json`. The glow does not drift under reduced motion.
44. **Verdict colour only where the site uses it:** the compact count row (the site's "Where you bid" panel: 46 px tiles, 1 : 2 : 3 by count, on dark glass) replaces the three big tiles on the Feed and on Company; cards carry the 56 px score tile and the status text; the tender header is dark glass on the verdict's glow with the score and the status line in the verdict's text colour (no red / amber / green block; the photo sits only behind the nav row, faded out before the text starts, with the site's soft-light tint); Company shows the photo with the soft-light tint and no sky block. The re-score chips (No-go → Go) and the Bids card ring keep their verdict colour.
45. **Type:** the site's mono eyebrows (`TONIGHT'S READ · THU 5 NOV`, `YOUR PIPELINE · THU 5 NOV`, `YOUR PROFILE · LEIPZIG, DE`), no fake numbering; 36 px tight-tracked titles with one two-tone word (the count on the Feed in the accent, "Can you **qualify?**", "actually **win**", "Check your **profile**", "About **TenderScout**"). The accent is the site's sky on dark Brand and Sky, the AA brand text on light and on Harbor dark.
46. **Chrome:** primary = the site's white pill with a trailing icon (arrow by default, bookmark on Save, check on We meet it); on light it inverts to ink. Secondary = the glass outline pill; icon buttons = the site's glass circle. Segments: glass track, primary pill. Switch 50 × 30 like the PhoneDemo (brand when on), stepper and money field as glass pills, chips as the site's marquee chips (yours filled brand). The Welcome form is the site's Start input: one white pill holding the field and the liquid-metal button. The only sky fills left: the dock pill, switches on, selected chips and the firm's sector chips, all state, all as on the site.
47. **The dock is the PhoneDemo dock:** one element mounted once (276 × 62 glass, 7 px inset, active tab 132 px with its label, others 65 px), the pill slides between tabs on the 450 ms spring, the amber-red saved-count badge on Bids. It is still hidden during onboarding, on a tender detail and on About.
48. **Motion added:** the site's word-by-word reveal on the Feed headline and on "In short" (one-shot per screen load, 55 ms stagger, unlit → ink); the 777 count-up on the Feed's pages line (2.8 s easeOutCubic, the site's counter; the one-shot shimmer stays); a touch glow on cards (the phone's cursor glow: a brand radial where the finger lands, fading out on release). Card → detail and toggle → re-score morphs unchanged. Everything off under reduced motion (the smoke test checks the instant reveal and count-up, no touch glow, no glow drift).
49. **Tokens first.** Every new value (glass, glass-ring, pill, pill-strong, line-strong, primary, primary-on, switch-off, unlit, scrim, grain, input, input-ink per theme; the verdict `hl` tints; `glow.app` per scheme) went into `shared/tokens.json`; `seg-on` was removed; `styles.css` has no hand-typed colour (the three `#000` are opaque mask stops). The site builds and lints on the same tokens (`GlowBlob` excludes `glow.app` from its gradient names).
50. **Kept untouched:** `engine.js` and its 24 tests, `ai.js`, `data.js`, routes, `data-*` hooks, `tenderscout.v2` (the `theme` value gains `dark` as default, no shape change), the "Simulated AI" and fictional-data labels (an AI pill was added next to "In short"), 44 px tap targets, shape + label on every verdict.
51. **Bids cards** carry the status line (shape, label, reason) over the title, as the PhoneDemo's bid cards do.
52. **Rollback:** branch `backup/pre-vibe` is the commit before this pass (`git push --force-with-lease origin backup/pre-vibe:main`, or `git revert` the merge).

Declutter, 4 Nov 2026 (team brief: remove 18 patterns from the app and the website; rollback branch `backup/pre-declutter`). Decisions taken alone:
53. **Palette = nine solid colours per scheme** (bg, surface, ink, muted, brand, go, maybe, nogo, check) in `shared/tokens.json`; text on a brand or verdict fill is always `bg`, status text is the verdict colour on bg or surface. The light scheme's brand and verdict colours are the former text colours (#0862AC, #13724B, #8A5300, #B23720, #4B31C2); the dark scheme's are the former dark text colours (#5DB8F5, #5ED69C, #F7C25E, #FF8B80, #B3A5FF). `check-contrast.js` audits 44 pairs, 0 failures.
54. **Sky and Harbor removed.** Under rule 6 they would have collapsed into near-duplicates of Brand (they only differed by tints, glass and dock treatments). About keeps System / Light / Dark; `?palette=` is ignored; a stored `palette` value is ignored (no storage-shape change).
55. **The site uses the dark scheme of the same token set.** Its former 50-odd colours (surface-2/3, hairlines, glass, text-2/3/4, sweep, strip, chip, map colours, metal, amber-red) are gone; the only translucent element in either product is the app's sheet scrim (one solid colour at 60 %, so the parent screen stays in view). The scan excludes `.scrim` and nothing else.
56. **Tender cards** (app Feed, Bids, site carousel, phone demo) show verdict (shape + word + score tile), title, buyer, value and days left. Photos, flags, original-language titles, reason lines and the saved bookmark icon left the cards; "Saved" is a plain word. The reason line and the original title stay on the detail.
57. **Welcome** lost the sector band, the preview card and the glass pill; it keeps the photo (own block), the headline, one sentence, the data-derived line "All 45 EU sectors · 6 new tenders tonight", the field and the button. The liquid-metal button is a plain primary button everywhere.
58. **Feed**: the count tiles row was merged into the filter tabs ("All 6 · ● Go 1 · ▲ Maybe 2 · ■ No-go 3"), which already carried the counts. Company keeps "1 Go · 2 Maybe · 3 No-go" as plain text with the count-up. The date moved from the eyebrow into the pages line ("Thu 5 Nov · read 777 pages in 4 languages").
59. **Detail**: the verdict header is plain text on the ground (shape + word, the score in the verdict colour, the headline); the photo is its own block under it; facts are value and deadline only (effort and pages left the UI, so the effort note left with them). Citations are regular text ("Vergabeunterlagen, p. 12, §3.1"); the quote's decisive phrase is underlined and bold in the verdict colour instead of a tinted mark.
60. **Controls**: bid languages are rows with switches like the certificates; skip reasons are plain toggle buttons (brand when on); stage, filter and appearance are underlined text tabs; the dock became a 60 px full-width tab bar and lost the saved-count badge (Bids shows the count). The "We meet it" / "We don't meet it" buttons lost their trailing icons; all other label-repeating icons went too (step indicators, spinners, the empty-state disc, the About icon tiles).
61. **About** keeps every §7.4 statement but names no files: "run live in tested rules, not in the AI" replaces the `engine.js` / `ai.js` mentions, and the `?demo=reset` note is gone (it stays in the README).
62. **Copy** was shortened on every screen (app: 1,418 → see the session report; site: 1,914 → see the report), keeping every number; the only all-caps strings left are acronyms (ISO, VCA, CPV, EU, AI).
63. **Motion kept**: the card → detail view-transition morph (on the plain header now), the switch → re-score FLIP morph with its dashed ghost, the 777 count-up, the word-by-word reveal (muted → ink), entrances. Removed: the glow drift, the shimmer (a gradient), the touch glow, the marquee, the site's hero glow and wave/radial/wipe button effects.
64. **Site map**: filled countries (brand for the profile's countries, bg for the rest, surface strokes) and five labels; the switch and the live counts sit under the map. Pins, arcs, the home marker, the tooltip, the graticule, the glow and the Natural Earth credit (now in the README) are gone.
65. **Site step visuals** are one idea each: the number, the three tiles, the sentence, "■ No-go → ● Go". The orb, dot grid, spotlight, ring and step bars are gone. The hero lost the glow, the grain and the giant gradient wordmark; the footer lost the dim wordmark; the film poster is a photo block with the line and the button beside it; the languages tiles are plain text; the five sector strips are a grid of photo blocks with text beneath; the 45-chip marquee is gone (the 45 cards remain).
66. **Fonts**: IBM Plex Mono and the Hanken Grotesk italic files were deleted from `fonts/` and `site/src/fonts/`; Instrument Serif was confirmed absent. Numbers use `font-variant-numeric: tabular-nums`.
67. **Verification** is automated: `tests/declutter-scan.js` scans the five stylesheets statically and every rendered screen (app smoke test) and the site at four widths (`shots.cjs`) for the 18 patterns; both must report 0.
68. **Phone demo** on the site mirrors the app (tab bar, plain cards, plain buttons); the "Live: the app's engine.js…" caption is gone (the section copy and the README say it).

Workshop follow-up, 4 Nov 2026 (evening):
69. **Welcome** has no dead space: the website field and the button sit 20 px under the subtitle (checked at 375×667, 390×844 and 430×932).
70. **`?demo=fast`** (and `?demo=reset,fast`) caps the simulated waits in `ai.js` for profile drafting and tender reading so each takes about 300 ms; labels, output and the progress callbacks are unchanged, and without the flag nothing changes. The demo script in `BRIEF.md` uses it.
71. **The ◆ "Needs your check" line** carries a 44 px "Check →" call to action in brand text inside the card (the whole card stays the link); the other lines do not.
72. **Freeze point = branch `release/v1-workshop`** at the final `main` commit (tag pushes are blocked here). The site is not on Vercel: project creation in the team was refused; the README says how to import it and how to make a static preview.
73. **The launch film was re-rendered, not archived.** `design/films/launch-film.jsx` was restyled to the token set (dark scheme, one typeface, 8 px, no gradients, shadows, pills, mono or text on photos; the harbour photo sits in its own block; the lever scene shows the engine's truth, ISO 27001 → Maybe 90, "We meet it" → Go 100), the film page declares the vendored fonts itself, React / ReactDOM / Babel come from the npm registry because unpkg is blocked here, and both MP4s in `marketing/` were re-encoded with the same pipeline (the reel's backdrop is now the bg colour). The site's film section and the README links stay.
74. **Small iPhones:** `html` carries `scroll-padding-bottom` so scrolled-into-view and focused content clears the fixed tab bar and action bar; when the re-score card sits just above the fold (iPhone 13 / SE) the switch tap brings it back in with an instant scroll of at most one screen before the morph; an aborted view transition (Safari and mobile browsers when the viewport changes mid-way) is swallowed, since the navigation has already happened.
75. **WebKit** could not be installed in the container: Playwright's WebKit build is only served from the Playwright CDN and its Microsoft mirror, and neither host is on the network allowlist (HTTP 403); the Ubuntu archive is reachable but ships no Playwright-drivable WebKit. The iPhone 13 and iPhone SE profiles were run in Chromium (viewport, touch, mobile emulation) instead, and the Safari-sensitive CSS (safe-area insets, `100dvh` with a `100vh` fallback, the fixed tab bar and sheet, `inert`, `Element.animate`) was reviewed by hand.

## 12. Repository provenance (3 Nov 2026)
The 2 Nov session built everything in its own cloud container and never pushed. That container is gone, so this repository was rebuilt on 3 Nov from that session's transcript: every file was re-created from the recorded tool calls and checked against the recorded before/after snapshots; fonts were re-downloaded with the same commands; the engine tests (24) and the smoke test (114 checks, light + dark, `file://` and HTTP) pass as before. Later on 3 Nov the team's design pack restored `DESIGN.md` and added the v2 handoff under `design/` (`design/HANDOFF_V2.md` wins over `DESIGN.md` where they differ). `evidence.md` and `docs/INTERVIEW_KIT.md` were partial after the rebuild and were restored by the team on `main` later that day. The design reference pages under `design/` (`*.dc.html`) are the designer's prototypes: they load React and Babel from unpkg, so they need internet; the app itself (`index.html`) stays CDN-free. Later on 3 Nov the website handoff pack (v3) was vendored under `design/website/` with its 45 sector previews under `design/assets/sectors/`, the shared token system was created in `shared/`, and the website was built in `site/` (`docs/WEBSITE_BUILD_LOG.md`). On 4 Nov both products were decluttered (§11 items 53–68); the state before that is `backup/pre-declutter`.
