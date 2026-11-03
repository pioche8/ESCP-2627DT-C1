# Handoff: TenderScout mobile app, Sky + Harbor (v2)

## Overview
TenderScout reads every new EU public tender overnight, in any language, and tells the owner of a small firm (5–50 staff: network installers, building trades, facility services, engineering) whether they can bid. Each tender gets a verdict (**Go / Maybe / No-go**) and a fit score out of 100. Every requirement links to the page and sentence in the tender documents that proves it. The promise is to answer "Can we even bid on this?" in under 60 seconds, with proof.

The platform is iPhone, 390 × 844 pt, portrait, in light and dark mode. This is a university prototype (ESCP, Digital Product Design): all companies and tenders are fictional, AI output is simulated, and the verdict logic is real code.

The bundle also includes three marketing motion pieces (a launch film, a loop cover and a notch film) and the brand motion system.

## About the design files
The files here are **design references built in HTML**. They are prototypes that show the intended look and behaviour, not production code. Recreate them in the target codebase's environment (SwiftUI, React Native / Expo, Flutter…) using its own patterns. If there is no codebase yet, React Native (Expo) or SwiftUI both fit an iPhone-only prototype.

To view them, serve the folder (`npx serve .`) and open the `.dc.html` files. They need `support.js` next to them, which is included. The `.jsx` files are loaded by the film pages at runtime; they are not app code.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, copy, imagery placement and motion are final, so build them pixel-for-pixel.

`DESIGN.md` (included) is the full spec: tokens, every component, screens 01–10, states, accessibility and the data model / scoring rules. **This README adds what changed after DESIGN.md was written** (palettes, photography, the Welcome redesign, motion). Where the two disagree, this README wins.

## What changed since DESIGN.md

### 1. Two palettes, Sky and Harbor
The palettes are CSS custom properties in `explorations/v3-tokens.css`. Scope them by putting both attributes on the screen root: `data-v3="light|dark"` and `data-palette="sky|harbor"`. Ship both, with a user setting or A/B test; Sky is the default.

| Token | Sky (light) | Harbor (light) | Role |
|---|---|---|---|
| `--v-bg` | `#EEF3F8` | `#EEF1F5` | Screen background |
| `--v-card` | `#FFFFFF` | `#FFFFFF` | Cards |
| `--v-card-2` | `#F4F7FB` | `#F3F5F9` | Chips, stepper track |
| `--v-ink` / `-2` / `-3` | `#0E1B2B` / `#4A5A6D` / `#6F7E92` | `#0F1A36` / `#48536B` / `#6E7891` | Text |
| `--v-line` | `#DCE4ED` | `#DDE2EA` | Dividers |
| `--v-brand` | `#5DB8F5` sky blue | `#1A7AA3` sea blue | Headers, primary button, toggles |
| `--v-brand-on` | `#0E1B2B` (dark text on sky) | `#FFFFFF` | Text on brand |
| `--v-brand-sub` | `#1D3B5C` | `#D2EAF5` | Secondary text on brand |
| `--v-brand-text` | `#0A6CBC` | `#13698C` | Links, citations, bookmark |
| `--v-brand-soft` | `#DCEFFD` | `#DCEEF6` | Selected chips |
| `--v-dock` | `#0E1B2B` | `#13224F` navy | Floating tab bar |
| `--v-dock-active` / `-on` | `#F2643A` amber-red / `#1A0A04` | `#D81E5B` crimson pink / `#FFFFFF` | Active tab pill |
| `--v-nogo` / `-ink` / `-soft` | `#E04A2F` / `#B23720` / `#FCE4DE` | `#C93A22` / `#A3301A` / `#FBE4DD` | No-go verdict |

Go (`#13724B` ●), Maybe (`#F5A524` ▲, text `#1A1200`) and Needs your check (`#6145E0` ◆) are the same in both palettes. Dark-mode values for each palette are in the CSS file.

### 2. Photography (every photo shows the work)
| File | Where | Treatment |
|---|---|---|
| `assets/app-welcome.png` | Welcome header (390 × 420) | Full bleed, `object-fit: cover`. Overlay `linear-gradient(to bottom, brand 70% → brand 8% at 32% → brand 20% at 68% → brand 100%)` |
| `assets/app-company.png` | Company header, top 150 px only | Overlay `brand 55% → 20% at 50px → solid brand at 150px` so text sits on solid brand |
| `assets/t-schools.png`, `t-fibre.png`, `t-audit.png`, `t-datacentre.png` | Feed card photo bands (full width × 96, top of card); Bids thumbnails (48 × 48, radius 13, right column) | Plain `cover` |
| `assets/t-audit.png` | Tender detail colour header | Grayscale, `mix-blend-mode: multiply` at 0.6 over the verdict colour, then gradient to solid verdict at 85% |
| `assets/sky-clouds.png`, `harbor-dusk.png`, `sky-tokens.png`, `harbor-tokens.png` | Marketing renders only, never in the app | — |

⚠ These are **200 px previews** from Canva. Download the full-resolution originals from the designer's Canva account and replace each file under the same name.

### 3. Feed tender card (updated)
- Card: radius 24, `--v-card`, card shadow, `overflow: hidden`.
- Top: photo band, full width × 96.
- Below it, a grid `56px 1fr`, gap 14, padding 0 16 16. The 56 × 56 score tile (radius 17, verdict solid, 20/800 score) sits with `margin-top: -36px` and a `0 0 0 4px` card-colour ring, so it overlaps the photo.
- The right column is unchanged: status line, title 17/700, italic original title, meta row.

### 4. Welcome screen (01), redesigned
From top to bottom:
1. **Photo header**, 420 tall, bottom radius 40.
   - Wordmark at 20, 66, in `--v-brand-on`.
   - **Moving sector band** from y 94 (see §5). It sits on a scrim: an absolute div at top 86, height 160, `linear-gradient(brand 82% → brand 62% at 78% → transparent)`.
   - **Pill** at 20, 238: 30 tall, `rgba(13,15,18,.55)` with an 8 px backdrop blur, white 12/600 text, `menu_book` icon. Text: "All 45 EU sectors · 214 new tenders tonight".
2. **Preview tender card**, overlapping the header bottom: left/right 16, top 284, padding 14, radius 24, shadow `0 24px 48px -18px rgba(13,15,18,.45)`.
   - Row: grid `52px minmax(0,1fr) 48px`, gap 12. It holds a 52 × 52 photo (radius 14), the status line "● Go · Meets all 8 requirements" with the title (15/19 700) under it, and a 48 × 48 Go score tile reading "100".
   - Footer row: 1 px top border, citation chip "p. 23 · §4.2" (Plex Mono 12, nowrap) and "Ellerbach · 29 d" (ellipsis, nowrap).
3. **Headline** at top 458: "Find public tenders you can actually win" (32/36, 800, −0.04em, ink). Sub-line 15/21 in ink-2.
4. **Bottom block**, unchanged: website field, dark "Draft my profile" button, prototype caption.

### 5. Moving sector band (Welcome)
- **Content:** all 45 EU CPV divisions, each as a two-digit code (Plex Mono 11, 65% opacity) followed by a short name, separated by a thin "/". The list is in `PhoneScreen.dc.html → marquee()`, from `03 Agriculture & forestry` to `98 Community services`.
- **Layout:** 4 rows, 30 tall, gap 2, Hanken 400 20/30 in `--v-brand-on`. Row r holds items where `index % 4 === r`.
- **Motion:** each row is two identical groups translated `0 → −50%`, linear and infinite. Durations are 42 / 54 / 38 / 60 s, and odd rows run in reverse. The edges fade with a mask, `linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)`.
- **The firm's own sectors** are weight 700: 32 Telecom equipment, 45 Construction work, 51 Installation and 72 IT services.
- **Reduced motion:** no animation.

### 6. In-app motion
All entrances play once on screen load and are disabled under reduced motion.

| Element | Animation | Delay |
|---|---|---|
| Feed verdict tiles | pop: opacity 0 → 1, scale .86 → 1, 600 ms `cubic-bezier(.2,.9,.25,1.2)` | 100 / 180 / 260 ms |
| Feed cards | rise: translateY 18 → 0, opacity 0 → 1, 700 ms `cubic-bezier(.2,.8,.2,1)` | 350 / 450 / 550 ms |
| Detail giant score | rise | 150 ms |
| Company re-score card | pop | 500 ms |
| Bids cards | rise | 200 / 300 ms |

The re-score choreography in DESIGN.md §7 still applies.

## Screens / views
Screens 01–10, the states and all component specs are in DESIGN.md §4–§6. The drawn references are in `PhoneScreen.dc.html`, set with the `screen` prop (`welcome | feed | detail | req | company | bids`), plus `theme` and `palette`. `TenderScout Sky & Harbor.dc.html` shows them in context.

## Interactions & behaviour
See DESIGN.md: navigation, the re-score moment, saving, skipping, sheets, toasts, haptics and reduced motion.

## State management
See DESIGN.md §10: the TypeScript model, verdict rules and six fixture tenders. Add a persisted `palette: 'sky' | 'harbor'` setting.

## Design tokens
Type: Hanken Grotesk 300–800 (plus 400 italic) and IBM Plex Mono 500/600. Spacing, radii, shadows and motion curves are in DESIGN.md §3 and MOTION.md; colours are in §1 above.

## Marketing motion (optional, not app code)
These follow `MOTION.md` and the charlie947/motion-graphics-skills pack. They are built on `animations-v3.jsx`; open them and export from the timeline.

| File | What |
|---|---|
| `TenderScout Launch Film.dc.html` | 45 s, 1920 × 1080: Harbor night → Sky morning, card → detail morph, live re-score, CTA "Draft my profile" |
| `TenderScout Loop Cover.dc.html` | 8 s loop, 1080 × 1350: score bars morph into the verdict tiles. Sky/Harbor tweak |
| `TenderScout Notch Film.dc.html` | 20 s: a notch grows into one widget per scene. An original style with no Apple marks |

## Assets
- Photos: generated in Canva (see §2). Swap in the full-resolution files.
- Icons: Material Symbols Rounded.
- Flags: CSS stripe chips, as specified in DESIGN.md.
- There is no logo. The wordmark is "TenderScout" in Hanken Grotesk 800, −0.03em.

## Files
- `PhoneScreen.dc.html`: all drawn app screens (props: `screen`, `theme`, `palette`)
- `TenderScout Sky & Harbor.dc.html`: renders and line-up for the two palettes
- `TenderScout Palettes.dc.html`: the four-palette exploration (only Sky and Harbor were kept)
- `explorations/v3-tokens.css`: all colour tokens, light and dark, per palette
- `DESIGN.md`, `MOTION.md`: full specs
- `assets/`: photography
- `launch-film.jsx`, `loop-cover.jsx`, `notch-film.jsx`, `animations-v3.jsx`, `tweaks-panel.jsx`, `support.js`: runtime for the reference pages
