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
- **The inventory** (pass-5 report, "Website") lists 35 effects of the original. A browser probe ran on the original export and on `f6a77af`:
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
| Gradient wordmark following the glow | A large "TenderScout" (no capitals, no negative tracking). The letters nearest the disc step ink → brand → muted; the rest stay surface. Updated at 20 fps, like the original. |
| Statement glows drifting (16 / 20 / 12 s) | Three surface bands, 8 px corners, on the same drifts. |
| Hop pill | The three verdict shapes hopping (1.3 s, 160 ms apart) beside the plain text "Scoring 6 new tenders". No pill. |
| "Bid." photo pan (photo clipped to the text) | One brand letter travels B → i → d → i, 6 s a letter (the original's 12 s each way). |
| Light sweep across the lines (gradient) | One brand word sweeps the sentence (4.5 s). |
| Spotlight dot grid (radial-gradient dots, mask) | A canvas grid of 2.4 px squares: surface, muted within 340 px of the cursor, brand within 150 px. Without a mouse it rests where the original's did. |
| Orb behind the step visual (blurred gradient) | A solid surface disc that changes size and place per step (800 ms). It does not change colour: a coloured backdrop would read as a verdict. |
| Ring around the counter; step bars | Solid strokes and bars, as in the original. |
| Phone dock pill and its badge | A solid brand block that slides under the active tab (450 ms spring). The badge stays removed (badges are banned). |
| Wave, wipe and radial button fills | Solid fills clipped to the button with `clip-path` (an ellipse rising, a wipe, a circle from the pointer). Same durations and curves. |
| Sector marquee (pills) | Two rows of plain text ("CPV 45 Construction work"), 110 s / 92 s, opposite directions, paused on hover, focus and off-screen. |
| Map: glow, graticule, flags, glass tooltip with shadow | Pins with bg outlines; ink dashed arcs flowing from Leipzig (muted toward No-go); a home ring that grows and thins instead of fading; a tooltip that is a plain bg-coloured block. Hover, focus and tap all work; Enter holds the tooltip and Escape closes it. The graticule, flags and credit stay removed. |
| Film ping (alpha ring) | A ring growing from a solid play square and thinning out. Hover zooms the photo, grows the square and fills a bar under the photo. |
| Metal ring (conic gradient) | A solid arc turning around the arrow on "Draft my profile" (5 s a turn). |
| Grain | Removed. It was texture, not motion. |

Everything stops, and settles at its end state, under `prefers-reduced-motion`. The gates come back to the site:
- the site's token files are generated from `shared/tokens.json` again;
- the declutter scan covers the site's stylesheets and pages;
- the contrast audit covers the site's pairs: 46, plus 5 for the map's shapes;
- the IBM Plex Mono and italic files are gone;
- `site/scripts/a11y-motion.cjs` checks every inventory item, with motion on and off, by keyboard and by touch.

**Why this option:** it is the only one that gives Luca both things he asked for without switching off a check the repository enforces. The motion is what he remembered. The look is what the rules, the app and the 11 Nov feedback pack describe. The cost is that four effects are reinterpretations, not copies, and the report lists them so he can ask for an exception.

## Consequences

### What becomes easier
- One visual language again for the app and the site: the same nine colours, one radius and one typeface, checked by the same scan.
- The motion has an owner and a test. Every effect has a line in `a11y-motion.cjs`. Before, item 139 rested on a one-off scouting run.
- The site's timings live in `shared/tokens.json` (`siteMotion`). Changing one changes both the CSS and the JS, never the app (`--sm-*` reaches only `site/src/styles/tokens.css`).

### What becomes harder
- The site has more moving parts than either earlier version: a rAF loop in the hero, a canvas in How it works, eleven CSS animations. Each pauses off-screen or is cheap. Lighthouse measures performance at 98–99.
- Some effects cannot be exactly what Luca remembered. The glow is a crisp disc and the gradient wordmark lights up letter by letter. Anyone who wants the blur back needs an exception to the declutter rules, not a code change.

### Technical debt accepted
- **The disc colour.** The hero and Start discs and the How-it-works orb are the surface colour on the bg ground, a 1.08:1 difference. They read as quiet shapes, not glows. A brighter shape would fail AA for the text over it.
- **Tooltip anchoring.** The map's tooltip flips below a pin near the top edge, but does not otherwise avoid the frame's sides beyond a 125 px clamp.
- **Phone labels.** Below 560 px the pin labels and the "You · Leipzig" label are hidden; the tooltip on tap carries the same facts.

## Alternatives Considered

### Option A: Keep the 3 Nov design restored on `main` (items 139–142)
- **Pros:** No work. Every effect is exactly the original.
- **Cons:** Not what Luca asked for. It breaks the declutter rules the app follows, so `tests/declutter-scan.js` had to skip the site. It ships IBM Plex Mono and italics, and it uses six undefined colour tokens (item 142).
- **Why not:** Luca's brief says it was a misreading.

### Option B: Go back to `f6a77af` as it is
- **Pros:** Clean against every rule. Small.
- **Cons:** Loses the 20 missing effects and the pin map, which is exactly what Luca said worked better on the old site.
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
