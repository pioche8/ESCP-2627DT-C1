# Website + shared design system · build log (3 Nov 2026)

What was built from the designer's website handoff (`design/website/`), what was verified, what could not be matched exactly, which decisions were taken without the team, and what still has to be done by hand. Companion to `CLAUDE.md` §11 (items 26–40) and the README's "Website" section.

## 1. What shipped
| Area | Result |
|---|---|
| `shared/` | `tokens.json` (the only place colours, type, radii, shadows, easing and durations are written), `build-tokens.js` (→ `shared/tokens.css` for the app, `site/src/styles/tokens.css` as a Tailwind v4 `@theme`, `site/src/generated/tokens.ts`, `.design-cache/tenderscout.md` for design-drift), `check-contrast.js` (WCAG AA audit). |
| `site/` | Next.js 16 App Router + TypeScript + Tailwind v4 + Framer Motion. 13 sections in the handoff's order plus the full-screen menu. Components: GlowBlob, Grain, VerdictShape, VerdictTile / ScoreTile / StatusLine, TenderCard, SectorFolderCard, useCarousel, Wave / LiquidMetal / RadialFill / Wipe buttons, RollingWord, ScrollRevealText, sticky steps with the 777 count-up, PhoneDemo with FloatingDock and the ISO 27001 re-score switch, Accordion, SectorMarquee, WorldMap (d3-geo + topojson-client, `world-atlas@2.0.2` bundled from npm). Data: tenders from the app's `data.js` through the real `engine.js` (verbatim copies made by `scripts/sync-shared.mjs`), the 45 CPV divisions from `DEMO.SECTORS`, weekly counts / FAQs / steps / copy in `src/data/`. |
| App | Loads `shared/tokens.css`; palettes Brand (default, the website's) / Sky / Harbor; verdict tiles, status line, score tile, wordmark dot, chip marquee, liquid-metal Welcome CTA, dock badge and re-score timing shared with the site. Engine, tests, routes, sheets, morphs, labels and storage unchanged. |
| Docs | README (Website section, Vercel settings, AI use), `CLAUDE.md` §3/§11/§12, `docs/NAVIGATION.md` (palettes), `fonts/LICENSES.md` (38-glyph subset), `.nojekyll`. |

## 2. Verification (all green at the time of the last commit)
| Check | Result |
|---|---|
| `node tests/engine.test.js` | 24 / 24 |
| `tests.html` in Chromium | 24 passed, 0 page errors |
| `node tests/smoke.js` (390 × 844) | 465 checks across Brand / Sky / Harbor × light / dark + reduced motion, 0 console errors, 0 failed requests |
| `node shared/check-contrast.js` | 297 text/background pairs (site + 6 app themes), 0 failures |
| `site`: `npm run lint`, `npm run typecheck`, `npm run build` | clean |
| `site/scripts/shots.cjs` | 1440 / 1024 / 768 / 390: no horizontal scroll, menu traps focus and closes on Escape, 0 console errors; section screenshots next to the reference page (`site/screenshots/`, gitignored) |
| `site/scripts/a11y-motion.cjs` | 13 checks: marquee frozen, glow static, counter at 777, statement lit, no running animations under reduced motion; keyboard: menu, dock arrows, ISO 27001 by keyboard → Maybe 90 → "We meet it" → Go 100, map pins and toggle |
| Lighthouse 12, mobile | Accessibility 100 · Best Practices 100 · SEO 100 · Performance 72 (throttled; the hero glow and marquee are per-frame by design) |
| `site/scripts/contact-sheet.cjs` | the site's PhoneDemo next to the real app in the same states: Feed 1 : 2 : 3, Company ISO 27001 → Maybe 90, "We meet it" → Go 100, Bids 3 saved, Feed 2 : 2 : 2. Same colours, numbers and verdicts. |
| design-drift (`/design-drift:lock` on the generated token sheet) | 41 UI files scanned, 0 colour or font findings; pill (999 px) and circle (44–88 px) radii remain as warnings because the scanner's scale stops at 64 px |

## 3. Not matched exactly (and why)
- **"214 tenders tonight", "214 READ", "Scoring 214 new tenders"** → 6, the number of open tenders in `data.js`. The pack's 214 is not in the data (course rule: no number that isn't in the brief).
- **Hohenau 25 → 92** → 25 → Maybe 90 (ISO 27001) → Go 100 ("We meet it"). The engine keeps one "Needs your check" line until the owner answers it; the phone's Company screen gained that row.
- **"Meets all 8 requirements"** → "Meets all 4 requirements"; days left 18 / 21 / 34 → 22 / 35 / 47; "next deadline in 18 days" → 22; CPV 79 strip "17 open" → 39. All from the engine on the fixed demo date, or from the pack's own table.
- **Verdict reasons** come from `Engine.reasonLine`, so they are longer than the pack's ("Short by 1 reference · mandatory site visit"); cards truncate them with an ellipsis as the reference does.
- **Tender titles** are the full `data.js` titles ("IT security audit and hardening for district administration" instead of "IT security audit").
- **Sector names** are the app's longer CPV names ("Agriculture & forestry" instead of "Agriculture") so app and site share one list.
- **Colours changed for WCAG AA**: No-go `#E04A2F` → `#D0452C`; text-4 `#5C6370` → `#7A8290`; quote citation and placeholder `#7A8899` / `#6F7E92` → `#637082`; map labels `#4F79B5` / `#2A303B` → `#86ADE6` / `#7A8290`; map credit `#454B57` → `#8A93A3`; unlit statement words `#23272F` → `#5A606A` (3.2:1, AA for large text, so the paragraph is readable before it lights up).
- **Photos**: the two tenders without a photo in `data.js` (Dutch libraries, French support) show the app's document placeholder instead of the pack's stand-in photos. All images are 3× upscaled JPEGs of the 200 px previews, to be replaced by the full-resolution exports under the same names in `site/public/assets/`.
- **Fonts**: latin subsets only through `next/font/local`; the "→" in "DE · ES · NL · FR → EN" falls back to the system font (as in the app).
- **Film**: links open the rendered MP4 on GitHub Pages (`marketing/TenderScout-launch-film-1920x1080.mp4`) rather than the React reference page, which needs unpkg.
- **Footer**: "UI library" (a reference page outside the repo) became "Source on GitHub" and "Try the prototype".
- **Map with cross-border off**: ES / NL / FR pins read "No-go · 25 · Delivery in Spain…" (the engine's region knock-out) rather than the pack's "Outside your countries · 20".
- **Mobile**: the reference is desktop-only; everything below 1024 px is an addition (sticky visual band, stacked strips, scrolling menu column, wrapped Start pill, icon-only menu pill).
- **Reduced motion**: the hero wordmark gradient stays static and the rolling question swaps words without moving.
- **The reference map** could not be rendered in the build sandbox (its data comes from jsdelivr, which is blocked there); the rebuild follows `TenderScout Map.html` line by line.

## 4. Decisions taken alone
See `CLAUDE.md` §11 items 26–40: Brand palette as the app default (Sky / Harbor kept), the cobalt fallback dropped from `styles.css`, Tailwind v4 `@theme` generation, committed copies of the shared sources for Vercel's Root Directory, the app's tiles / band / CTA / dock badge / wordmark fused to the site, Framer Motion for the menu, step crossfade, dock pill, re-score block and accordion, compositor-only hero glow, and the design-drift lock on the generated token sheet.

## 5. Brand review of the site copy (`/marketing:brand-review`, guidelines = the handoff README + CLAUDE.md §7)
**Summary:** the copy follows the handoff word for word where the data allows it; plain language, sentence case, "Go / Maybe / No-go" and "re-score" used consistently, numbers derived from the data, honesty labels in the hero, menu, Start section and footer, no testimonials, logos, press quotes or user numbers.

| Issue | Location | Severity | Action |
|---|---|---|---|
| "214" (not in the data) | menu pill, hop pill, menu card | High | replaced by the engine's 6 |
| "25 → 92" and "Meets all 8 requirements" (not what the engine produces) | phone demo, step 4, cards | High | replaced by 25 → 90 → 100 and "all 4" |
| Weekly sector counts are invented | Built for, Sectors | Medium | kept, labelled "illustrative" in the copy, the footer label and every card's name |
| "Every night, we read every new EU tender." (product claim on a prototype) | film poster | Low | kept as the film's title; the page says "Prototype · all companies and tenders are fictional" in four places and the FAQ answers "Is the AI output real?" with "No" |
| "CPV" unexplained on first use | Built for, Sectors | Low | `<abbr title="Common Procurement Vocabulary">` |
| Translation on the quote card is AI output | How it works, step 3 | Medium | "Simulated AI" pill added next to it; the phone carries the same pill |
| CTA wording | header, Start | — | "Try the prototype" and "Draft my profile", both to the live app, as requested |

## 6. Hand-done steps
1. **Tag the safe point** (the git proxy in the build session refuses tag pushes with HTTP 403; the tag exists locally on the session's clone):
   ```
   git fetch origin main
   git tag -a v1-workshop-safe 1d81615 -m "Safe rollback point before the website + shared design system work"
   git push origin v1-workshop-safe
   ```
   Roll back the app in one command: `git checkout v1-workshop-safe -- index.html styles.css app.js data.js fonts`.
2. **Vercel** (still open on 4 Nov: project creation in the team was refused): someone with team access imports the repository → Root Directory `site` → framework Next.js → build `npm run build` → output default → install `npm install` → Node 22 → no environment variables → Deploy. Optionally enable "Include source files outside of the Root Directory in the Build Step" so `prebuild` re-syncs from the app on each deploy. Then put the production URL in `README.md`. Until then `STATIC_EXPORT=1 npm run build` gives a static preview.
3. **Replace the photos** in `site/public/assets/` (and `assets/img/`, `design/assets/`) with the full-resolution Canva exports under the same names, then run `cd site && npm run sync && npm run check`.
4. **Merge** `claude/festive-ptolemy-xzsoe1` into `main` if the session's push to `main` was refused (see the final report): `git checkout main && git merge --ff-only claude/festive-ptolemy-xzsoe1 && git push origin main`.

## 7. Declutter, 4 Nov 2026
Both products were stripped of the eighteen patterns in the team's brief (pills, italics, mono, negative tracking, eyebrows, numbering, uppercase, dividers, borders, shadows, gradients, grain, glow, photo overlays, large radii, code names in the UI, verbose copy, over-detailed diagrams). The site now uses the dark scheme of the nine-colour token set the app uses, the map shows filled countries and five labels with the switch and the counts under it, the four step visuals are one idea each, every photo sits in its own block, and the credits that were on the page (Natural Earth, world-atlas, the engine note under the phone) live in the root `README.md`. `scripts/shots.cjs` now runs the declutter scan on the stylesheets and the rendered page at every width. Decisions and the rollback branch (`backup/pre-declutter`) are in `CLAUDE.md` §11 items 53–68.
