# ADR-0004: Website: current look, original motion and map

**Status**: Accepted (supersedes the website decisions of `CLAUDE.md` §11 items 139–142; item 143's review fixes stay where they still apply)
**Date**: 2026-11-07
**Deciders**: Luca Zorzi (the direction, in the pass-5 brief); Claude Code (autonomous pass 5) for the translations below. Recorded in `CLAUDE.md` §11 items 164–167.

## Context

- **What Luca said, and how it was read.** On 6 Nov Luca wrote: "on the old website the map was working correctly as well as the animations". Pull request 25 read that as "bring back the whole 3 Nov design" and restored it on `main` (`f2d8655`, items 139–142): the glow, the gradient wordmark, the glass pills, the mono labels, the pin map.
- **What Luca meant** (pass-5 brief, 7 Nov):
  - the website's **look** as it was before that restore: the decluttered site at `f6a77af`. That is the site that follows the design rules, with the map codes from `4cd04b5`, the map fill-in from `5ea5b05` and the five-tab phone;
  - the **behaviour** of the original (`backup/pre-declutter`): every animation and every map feature that worked there, working the same way here.
- **The design rules are enforced, not just written.**
  - `tests/declutter-scan.js` and `site/scripts/shots.cjs` fail on the 18 patterns: gradients, glows, alpha colours, pills, borders, shadows, radius over 8 px, mono, italics, all caps, eyebrows, numbering, code names in text, among others.
  - `shared/check-contrast.js` audits the token pairs.
  - The look and the behaviour therefore collide wherever an original effect *is* a forbidden thing: the glow drift, the gradient wordmark, the hop pill, the metal ring, the orb, the dot grid, the grain.
- **The inventory** ([appendix](#appendix-the-inventory) below, and the pass-5 report's "Website" section) lists 35 effects of the original. A browser probe ran on the original export and on `f6a77af`:
  - 8 already worked on `f6a77af`: the word-by-word reveal, the rolling word, the card lift, the 0 → 777 counter, the step crossfade, the folder lift, the phone re-score, the FAQ;
  - 3 worked in part: the steps' dimming (as colour), the map's re-score (counts, no pins), the menu (the slide and shift, not the arrow);
  - the other 24 were missing.
- **Constraints.**
  - The site is not deployed (the Vercel secrets are missing, ADR-0003), so Luca sees it only through recordings.
  - The app's bytes must not change for the website. The app freezes on Mon 9 Nov 18:00 London.
  - The site's Lighthouse score must stay at 95 or above, with 0 axe findings.
- **Related:** ADR-0001 and ADR-0003 (hosting, unchanged); `CLAUDE.md` §11 items 53–68 (the declutter), 134–136 (the map fill-in and the five-tab phone) and 139–143 (the restore, superseded).

## Decision

We will **keep `f6a77af`'s look and play every motion and map feature of the original in solid shapes and solid colours**. Each effect keeps its trigger and its timing and easing, which come from the original's tokens and now live in `shared/tokens.json` under `siteMotion`. Only the rendering changes:

| Original effect (forbidden part) | Plays now as |
|---|---|
| Hero glow drift and cursor follow (blurred gradient blob) | A solid surface-coloured disc, clipped to a circle, on the same ellipse, easing toward the cursor (lerp .05). |
| Gradient wordmark following the glow | A large "TenderScout" (no capitals, no negative tracking). The letters nearest the disc step ink → brand → muted, every other letter over the disc stays at least muted, and the rest are surface. Updated at 20 fps, like the original. |
| Statement glows drifting (16 / 20 / 12 s) | Two surface discs (clipped to a circle) on the 16 s and 20 s drifts. The third, smaller glow (12 s) was dropped after the visual audit: as solid shapes, three read as empty cards. |
| Hop pill | The three verdict shapes hopping (1.3 s, 160 ms apart) beside the plain text "Scoring 6 new tenders". No pill. |
| "Bid." photo pan (photo clipped to the text) | One brand letter travels B → i → d → i, 6 s a letter (the original's 12 s each way). |
| Light sweep across the lines (gradient) | One brand word sweeps the sentence (4.5 s). |
| Spotlight dot grid (radial-gradient dots, mask) | A canvas grid of 2.4 px squares: surface, muted within 220 px of a mouse pointer, brand within 90 px (tighter than the original's 340 px, because solid tiers are louder than a fade); the squares behind the active step's text stay surface. With no mouse (touch, reduced motion) there is no lit spot: the original's resting spot sat on the step text on a phone. |
| Orb behind the step visual (blurred gradient) | A solid surface disc that changes size and place per step (800 ms). It does not change colour: a coloured backdrop would read as a verdict. |
| Ring around the counter; step bars | Solid strokes and bars, as in the original. |
| Phone dock pill and its badge | A solid brand block that slides under the active tab (450 ms spring). The badge stays removed (badges are banned). |
| Wave, wipe and radial button fills | Solid fills clipped to the button with `clip-path` (an ellipse rising, a wipe, a circle from the pointer). Same durations and curves. |
| Sector marquee (pills) | Two rows of plain text ("CPV 45 Construction work"), 110 s / 92 s, opposite directions, paused on hover, focus and off-screen. |
| Map: glow, graticule, flags, glass tooltip with shadow | Pins with bg outlines; dashed arcs flowing from Leipzig (ink, muted toward No-go) with a ground-coloured casing so they read on the brand fill; a ground-coloured home ring that grows and thins instead of fading; a tooltip that is a plain bg-coloured block, kept while the pointer is on it and flipped below a pin near the top. Hover, focus and tap all work (the pin nearest the pointer wins, so close pins split the space); Enter holds the tooltip and Escape dismisses any tooltip. The graticule, flags and credit stay removed (they are look, not motion). |
| Film ping (alpha ring) | A ring growing from a solid (ink) play square and thinning out. Hover zooms the photo, grows the square and fills a bar under the photo from empty to 64 %. |
| Metal ring (conic gradient) | A thin solid ring around the arrow on "Draft my profile", with a short ink sheen travelling round it (5 s a turn). A bare turning arc read as a loading spinner on a button nobody had pressed. |
| Grain | Removed. It was texture, not motion. |

Everything stops, and settles at its end state, under `prefers-reduced-motion`. The gates come back to the site:
- the site's token files are generated from `shared/tokens.json` again;
- the declutter scan covers the site's stylesheets and pages;
- the contrast audit covers the dark scheme the site uses (within the 46 pairs of both schemes), plus 6 for the map's shapes: 52 pairs;
- the IBM Plex Mono and italic files are gone;
- `site/scripts/a11y-motion.cjs` checks every inventory item, with motion on and off, by keyboard and by touch, and runs the rendered declutter scan of the landing page at 1440 and 390 px; `site/scripts/audit.cjs` runs axe on each phone tab, the open menu and a map tooltip too.

**Why this option:** it is the only one that gives Luca both things he asked for without switching off a check the repository enforces. The motion is what he remembered. The look is what the rules, the app and the 11 Nov feedback pack describe. The cost is that four effects are reinterpretations, not copies, and the report lists them so he can ask for an exception.

## Consequences

### What becomes easier
- One visual language again for the app and the site: the same nine colours, one radius and one typeface, checked by the same scan.
- The motion has an owner and a test. Every effect has a line in `a11y-motion.cjs`. Before, item 139 rested on a one-off scouting run.
- The site's timings live in `shared/tokens.json` (`siteMotion`). Changing one changes both the CSS and the JS, never the app (`--sm-*` reaches only `site/src/styles/tokens.css`).

### What becomes harder
- The site has more moving parts than either earlier version: a rAF loop in the hero, a canvas in How it works, thirteen CSS keyframe animations. Each pauses off-screen or is cheap. Lighthouse measures performance at 98–99.
- Some effects cannot be exactly what Luca remembered. The glow is a crisp disc and the gradient wordmark lights up letter by letter. Anyone who wants the blur back needs an exception to the declutter rules, not a code change.

### Technical debt accepted
- **The disc colour.** The hero and Start discs and the How-it-works orb are the surface colour on the bg ground, a 1.08:1 difference. They read as quiet shapes, not glows. A brighter shape would fail AA for the text over it.
- **Tooltip anchoring.** The map's tooltip flips below a pin near the top edge, but does not otherwise avoid the frame's sides beyond a 125 px clamp.
- **Phone labels.** Below 560 px the pin labels are hidden and "You · Leipzig" shortens to "You"; the tooltip on tap carries the same facts.
- **Discs and the scan.** The hero, statement, How and Start discs are `clip-path: circle()` shapes, and the map's pins, rings and the play square are SVG. The declutter scan reads CSS `border-radius`, so it does not see them; they are listed here as deliberate exceptions to "one 8 px radius", for Luca to confirm or refuse.

## Alternatives Considered

### Option A: Keep the 3 Nov design restored on `main` (items 139–142)
- **Pros:** No work. Every effect is exactly the original.
- **Cons:** Not what Luca asked for. It breaks the declutter rules the app follows, so `tests/declutter-scan.js` had to skip the site. It ships IBM Plex Mono and italics, and it uses six undefined colour tokens (item 142).
- **Why not:** Luca's brief says it was a misreading.

### Option B: Go back to `f6a77af` as it is
- **Pros:** Clean against every rule. Small.
- **Cons:** Loses the 24 missing effects and the pin map, which is exactly what Luca said worked better on the old site.
- **Why not:** Half of the request.

### Option C: Original motion with exceptions to the rules (blur, gradients, alpha)
- **Pros:** The closest to what Luca remembers.
- **Cons:** It needs the declutter scan to whitelist gradients, filters and alpha on the site, so the same rules would no longer hold for both products.
- **Why not:** Luca asked for the rendering to follow his design rules and to see the translations listed before he grants any exception. He can still choose this per effect.

### Option D: Do nothing
- **Cons:** `main` keeps the misread design, and the gates stay off for the site.
- **Why not:** Same as Option A.

## Review Triggers

- [ ] **Exception requested:** revisit an individual effect if Luca asks for its original rendering. Each one is a single component and a single CSS block, listed in the pass-5 report.
- [ ] **Design rules change:** revisit the table if the declutter rules change (for example, alpha allowed).
- [ ] **Performance:** revisit the canvas grid and the hero loop if Lighthouse's mobile performance on `/` falls below 95 in two consecutive audits on a quiet machine.
- [ ] **Time-based:** review after the 11 Nov feedback session.

## Appendix: the inventory

Every motion and interaction of the original 3 Nov site (`backup/pre-declutter`, `a34142b`), probed in Chromium on the original's static export and on `f6a77af`'s (7 Nov). "On f6a77af": **yes** worked, **part** worked in part, **no** missing. "Checked by": the check in `site/scripts/a11y-motion.cjs` that now covers it (all also checked under reduced motion: nothing runs, end states shown).

| # | Original effect | Trigger · timing | On f6a77af | Now | Checked by |
|---|---|---|---|---|---|
| 1 | Hero glow drift | always (rAF, paused off-screen) · ellipse, 3.8 s / 5.1 s periods | no | surface disc on the same ellipse | "the disc drifts on its own" |
| 2 | Hero glow follows the cursor | mouse move · lerp .05 a frame | no | the disc eases to the cursor | "the disc eases toward the cursor" |
| 3 | Gradient wordmark lit at the glow's x | with 1–2 · 20 fps | no | letters step ink → brand → muted by distance; letters over the disc at least muted | "the wordmark lights the letters nearest the disc" |
| 4 | Statement glows drift | always · 16 s / 20 s / 12 s | no | two surface discs, 16 s / 20 s | "two surface discs drift" |
| 5 | Statement word-by-word reveal | scroll · per word, .3 s | yes | unchanged (muted → ink) | "word-by-word reveal" |
| 6 | Hop pill (three shapes hop) | always · 1.3 s, 160 ms apart | no | three verdict shapes hop beside plain text | "the three verdict shapes hop" |
| 7 | Rolling word | every 2 s · .7 s roll | yes | unchanged | "the rolling word rolls every 2 s" |
| 8 | Tender card lift | hover · .3 s | yes | unchanged; the track no longer clips it | "a card lifts on hover" |
| 9 | "Bid." photo pan | always · 12 s each way | no | one brand letter travels B → i → d → i (24 s) | "one brand letter travels through Bid" |
| 10 | Light sweep across the lines | always · 4.5 s, lines .25 s apart | no | one brand word at a time sweeps the sentence (4.5 s) | "one brand word sweeps the sentence" |
| 11 | Spotlight dot grid | mouse move | no | canvas squares lit muted / brand near a mouse pointer | "the dots by the cursor light up brand" |
| 12 | 0 → 777 counter | step 1 in view · 2.8 s easeOutCubic | yes | unchanged | "0 → 777 count-up … with the ring filling" |
| 13 | Ring fills with the counter | with 12 | no | brand stroke on a ground-coloured track | (same check) |
| 14 | Orb behind the visual | active step · colour swap (token 800 ms) | no | surface disc moves and resizes per step, 800 ms | "the disc moved and resized" |
| 15 | Step visual crossfade + scale | active step · .5 s / .6 s | yes | unchanged | "only the third visual shown" |
| 16 | Step bars | active step · .3 s | no | four bars, lit up to the active step | "three bars lit" |
| 17 | Inactive steps dimmed (opacity + blur) | active step · .5 s | part (colour) | muted → ink, as on f6a77af | "inactive steps are muted" |
| 18 | Folder card lift | hover / focus · .45 s | yes | unchanged; the track no longer clips it | "the card lifts and its panel slides down" |
| 19 | Folder panel fold | hover / focus · .5 s | no | panel slides 47 % → 58 % | (same check) |
| 20 | Phone dock pill | tab change · 450 ms spring | no | brand block slides under the active tab | "the brand block slides to the active tab" |
| 21 | Phone re-score (block colour, count-up, knob) | ISO / "We meet it" · 450 / 650 / 250 ms | yes | unchanged: 25 → 90 → 100 | "ISO 27001 → Hohenau No-go 25 → Maybe 90, counting up" |
| 22 | Radial fill (Save to Bids) | hover / focus · .55 s | no | ink circle clipped from the pointer | "Save to Bids fills from the pointer" |
| 23 | Wipe (Skip) | hover / focus · .45 s | no | brand fill wipes in from the left | "Skip wipes in on hover" |
| 24 | Sector strips accordion | hover / focus · .7 s | no | flex 1 → 2.2 (row) or photo height (phone) | "the hovered strip widens" |
| 25 | Sector marquee | always, paused on hover / off-screen · 110 s / 92 s | no | two rows of plain text | "two rows … drift", "the hovered row pauses", "pauses off-screen" |
| 26 | Map arcs flowing | always · 1.6 s | no | dashed arcs with a casing | "six dashed arcs flow" |
| 27 | Map home pulse | always · 2.2 s | no | ground-coloured ring grows and thins | "the home pulse" |
| 28 | Map pins + tooltips | hover / focus | no | pins, plain tooltip; tap, Enter hold, Escape | "hovering a pin shows its tooltip", touch and keyboard checks |
| 29 | Map re-score with the engine + count tiles re-flex | switch · tiles .45 s | part (counts, no pins) | 1 · 2 · 3 → 1 · 1 · 4, only Valdemora flips; tiles re-flex, count up | "only Valdemora flips", "the count tiles re-flex" |
| 30 | Film ping, zoom, play scale, bar | always (ping 2.2 s) · hover 1.2 s / .5 s / 1.6 s | no | ink play square, ring thins; zoom, scale, bar 0 → 64 % | "pings every 2.2 s", "hover zooms the photo…" |
| 31 | Wave fill (header, film, Start) | hover / focus · .7 s | no | ink ellipse rises, clipped | "fills from below (the wave)" |
| 32 | FAQ fold and + turn | click · 450 ms | yes | unchanged | "the + turns as the answer folds" |
| 33 | Metal ring | always · 5 s a turn | no | thin ring with a travelling sheen | "the arc turns around the arrow" |
| 34 | Start glow drift | always · 12 s | no | surface disc on the same drift | "the disc drifts behind the section" |
| 35 | Menu slide + link shift and arrow | open · 750 ms; hover .35 s / .25 s | part (no arrow) | slide, shift and the arrow | "slides down", "moves right and shows its arrow" |

Not motion, and still removed: the grain overlays, the map's graticule, flags and credit, the chapter chips, the glass and the badges.
