# Handoff: TenderScout marketing website (v3) + app components

## Overview
TenderScout reads every new EU public tender overnight, in any language, and tells a small firm (5–50 staff: installers, building trades, facility services, engineering) whether it can bid. Each tender gets a verdict (**Go / Maybe / No-go**), a fit score out of 100, and a link to the page and sentence that proves each requirement.

This package is the **one-page marketing website**. It also includes the app screens and the UI component library it was built from. This is a university prototype (ESCP, Digital Product Design): all companies and tenders are fictional, AI output is simulated, and the verdict logic is real code.

## About the design files
Everything here is a **design reference built in HTML**. The files show the intended look and behaviour; they are not production code. Recreate them in the target stack, for example Next.js/React with CSS Modules or Tailwind, or Astro, using its own patterns. If no codebase exists yet, **Next.js (App Router) + Tailwind + Framer Motion** is a good fit:
- the page is a single scrolling landing page;
- the animations are scroll- and pointer-driven.

To view the references, serve the folder (`npx serve .`) and open `TenderScout Website v3.dc.html`. The `.dc.html` files need `support.js` beside them, which is included.

## Fidelity
**High fidelity.** Colours, type, spacing, radii, copy, imagery treatment and motion are final, so match them exactly. The **page source is the source of truth** for every value. All styles are inline, so you can read each value straight off the element.

---

## Design tokens

### Colour
Dark sections all use the same ground.

| Token | Value | Use |
|---|---|---|
| `bg` | `#02040A` | Page and every section background |
| `surface` | `#0B111C` | Cards on dark (tender cards, phone screen) |
| `surface-2` | `#131B2A` | Cards inside the phone |
| `glass` | `rgba(14,20,32,.72)` + `backdrop-filter: blur(14px)` + `inset 0 0 0 1px rgba(255,255,255,.1)` | Menu card, pills |
| `hairline` | `rgba(255,255,255,.08)` | Borders, dividers |
| `text` | `#FFFFFF` | Headings and body on dark |
| `text-2` | `#A3ADBD` | Body copy on dark |
| `text-3` | `#8A93A3` | Section labels (mono), meta |
| `sky` | `#5DB8F5` | Accent: active states, roll word, progress, primary pill |
| `sky-light` | `#9AD3FA` | Highlights, glow core |
| `sea` | `#1A7AA3` | Glow mid-tone |
| `sapphire` | `#0F3FA8` | Glow outer, radial-fill colour |
| `amber-red` | `#F2643A` | Bids badge, faint warm glow |
| `ink` | `#0E1B2B` | Text on white or sky |

**Verdicts** are never decorative. Always show shape + label + colour together.

| Verdict | Shape | Solid | On-solid text | Text on dark |
|---|---|---|---|---|
| Go | ● circle | `#13724B` (or `#1F9D63` small) | `#FFFFFF` | `#5ED69C` |
| Maybe | ▲ triangle (`clip-path: polygon(50% 0,100% 100%,0 100%)`) | `#F5A524` | `#1A1200` | `#F7C25E` |
| No-go | ■ square | `#E04A2F` | `#FFFFFF` | `#FF8B80` |

### Glow (signature)
Blurred radial blobs over `#02040A`:
- **Core:** `radial-gradient(closest-side, #E6F4FF, #5DB8F5 26%, #1A7AA3 52%, rgba(15,63,168,0))`, `filter: blur(70–90px)`, opacity .35–.55.
- **Secondary blobs:** single-colour radial (`#0F3FA8`, `#1A7AA3`, `#5DB8F5`) at opacity .2–.6.

**Grain overlay:** an SVG `feTurbulence` (fractalNoise, baseFrequency .9, 2 octaves) as a background image, opacity .18, `mix-blend-mode: overlay`.

### Image treatment
- **Sources:** sector photos at `assets/sectors/cpv-XX.png` (one per EU CPV division) and tender photos at `assets/t-*.png`.
- **Filter:** `saturate(1.05)`.
- **Light tint:** an overlay `linear-gradient(160deg, rgba(93,184,245,.28), rgba(154,211,250,.12) 60%, transparent)` with `mix-blend-mode: soft-light`. It must stay very light; the client rejected a strong blue.

⚠ All images are **200×200 or 200×112 previews** from Canva. Replace each with the full-resolution export from Canva under the same filename before launch.

### Type
- **Hanken Grotesk** (300–800) for all UI and headings.
- **IBM Plex Mono** (400–600) for section labels, codes, citations and counters.
- **Material Symbols Rounded** for icons.

| Role | Size / line | Weight | Tracking |
|---|---|---|---|
| Hero wordmark | `16.4cqw / .8` (container query on hero) | 800 | −.07em |
| Section H2 | `clamp(40px, 5vw, 72px) / 1` | 800 | −.05em |
| Statement | `clamp(30px, 4.2vw, 58px) / 1.18` | 600 | −.035em |
| Menu links | `clamp(34px, 4.6vw, 66px) / 1.12` | 600 | −.04em |
| Step title | `clamp(30px, 3.4vw, 46px) / 1.05` | 800 | −.04em |
| Body | 18 / 28 | 500 | 0 |
| Card title | 16 / 21 | 700 | 0 |
| Section label | 13 / 1, IBM Plex Mono, uppercase | 500 | .08em |
| Meta | 12–13 | 500 | 0 |

Labels follow the pattern `0X — NAME`.

### Radii and spacing
- **Radii:** 999 for pills and round buttons, 15 for header buttons, 22–28 for cards, 32 for the film frame, 52/42 for the phone frame/screen.
- **Spacing:** sections pad `clamp(80px, 9vw, 120px)` top and bottom. The content max-width is 1280px (How it works: 1360px), with side gutter `clamp(20px, 4vw, 48px)`.
- **Shadows:** dark cards use `inset 0 0 0 1px rgba(255,255,255,.08), 0 30px 60px -30px rgba(0,0,0,.8)`.

### Motion
| Name | Curve | Use |
|---|---|---|
| enter | `cubic-bezier(.2,.8,.2,1)`, 300–700 ms | Most transitions |
| spring | `cubic-bezier(.2,.9,.25,1.15)`, 450 ms | Dock pill, toggles |
| menu | `cubic-bezier(.76,0,.24,1)`, 750 ms | Full-screen menu slide |
| roll | `cubic-bezier(.7,0,.2,1)`, 700 ms | Rolling word |

`prefers-reduced-motion`: turn off every animation and transition, but keep showing the end states.

---

## Page structure (top → bottom)
Each section carries `data-screen-label` in the reference.

1. **Hero**
   - Black hero, max(640px, min(100vh, 900px)) tall, with a blue glow blob that drifts in an ellipse and eases toward the cursor (lerp .05 per frame).
   - The giant `TENDERSCOUT` wordmark is filled with a radial gradient centred on the same x as the glow (`background-clip: text`).
   - Header: wordmark (left), **Menu pill** (centre, 46 tall, glass, "Menu · 214 tenders tonight"), **Get started** (white pill with a **wave reveal**: a sky ellipse rises from below on hover, .7 s).
   - Tagline top right, meta row at 48% height.
2. **Statement:** a 34-word paragraph that lights up word by word (`#23272F` → white) as the section scrolls through the viewport, over drifting blue/white "dawn ribbon" blobs whose opacity rises with progress.
3. **Tonight's read**
   - Label row with a **verdict hop** pill (three verdict shapes hopping in sequence, 1.3 s loop, .16 s stagger).
   - **Rolling question**: "Can we bid on" + a word that rolls every 2 s (school Wi-Fi? / fibre? / this audit? / data centres? / cleaning? / a framework?).
   - **Tender carousel**: horizontal scroll-snap, 300 px cards, prev/next buttons, a 6-segment progress bar.
4. **Languages:** two tiles.
   - **Image text mask**: "Bid." filled with a slowly panning photo, with the period in sky.
   - **Light sweep**: three tilted lines with a moving highlight gradient.
5. **How it works**
   - **Spotlight dot grid** over the whole section: 24 px dots, sky dots revealed by a 340 px radial mask at the cursor.
   - Two columns (1.45fr / 1fr). The left column is **sticky** (100vh) and shows one big visual per step, crossfading with scale .92 → 1:
     - **Step 1:** a 777 counter that counts 0 → 777 over 2.8 s while its ring fills; it replays when step 1 re-enters.
     - **Step 2:** verdict tiles 1 : 2 : 3.
     - **Step 3:** the German quote card with the highlighted clause.
     - **Step 4:** the No-go → Go re-score card.
   - The right column holds the steps (85vh each). The active step is the one nearest the viewport centre; inactive steps sit at opacity .25 with blur 2px.
6. **Built for:** a carousel of all **45 CPV sector folder cards**.
   - Each card is 280×410, white, with the sector photo on the top 66% and a white panel with a folder tab.
   - The panel shows the CPV code (52/500), name and "N open tenders this week".
   - On hover the panel slides from 47% → 58% top, the card lifts 10 px and gets a sky glow shadow.
   - The firm's sectors (32, 45, 51, 72) carry a "Your sector" tag.
   - Header has an `NN / 45` counter, prev/next buttons (scroll 592 px) and a progress bar.
7. **In the app:** a 340×700 phone in dark mode.
   - The **floating dock** (navy glass, sliding sky pill, count badge on Bids) switches between three screens:
     - **Feed**: verdict tiles and 3 rows.
     - **Bids**: a Go / Maybe / No-go card each, with reason and stage pill (Bidding / Deciding / Not bidding).
     - **Company**: **re-score switch** for ISO 27001. Turning it on animates the score 25 → 92, turns the block green, and updates Bids and Feed.
   - Buttons: **Skip** (linear wipe, white fill from the left) and **Save to Bids** (radial fill from the cursor position in sapphire).
8. **Sectors**
   - A 5-strip accordion: hover expands one strip to flex 5 and reveals its text.
   - A **sector marquee**: 2 rows of all 45 CPV chips moving in opposite directions (110 s / 92 s), pausing on hover. The firm's sectors are filled sky.
9. **Where you bid:** an interactive map (`TenderScout Map.html`, built with d3-geo and Natural Earth 110m data).
   - The 5 countries are highlighted, with Leipzig marked as home.
   - Curved animated arcs run to 6 buyer pins, one per verdict shape.
   - A cross-border toggle re-scores ES/NL/FR, a counts summary updates with it, and each pin has a hover tooltip.
   - Rebuild it in the target stack; it is embedded as an iframe only in the reference.
10. **Film:** a 16:9 poster.
    - Blue tint, pulsing play button, chapter chips.
    - On hover the photo zooms, the progress bar fills and the button scales.
    - Links to the launch film (`reference/TenderScout Launch Film.dc.html`).
11. **Questions:** a 4-item accordion, one item open at a time (`grid-template-rows: 0fr → 1fr`); the + icon rotates 45°.
12. **Start**
    - Website input pill (white) with a **liquid metal** button: a chrome gradient border and a rotating conic-gradient ring around the arrow.
    - Validation message underneath.
    - A blue glow behind.
13. **Footer:** links and a giant dim wordmark.

**Menu overlay** (opened from the Menu pill):
- Full-screen `#02040A` with the glow and grain.
- Six numbered links; on hover a link turns sky, shifts 14 px and shows an arrow.
- Right-hand glass card: a small sector image (150 px tall), tonight's verdict tiles and the next deadline.
- It slides down over 750 ms, and clicking a link closes it and scrolls to that section.

## Interactions and state
| State | Values |
|---|---|
| `menuOpen` | bool |
| `menuHover` | index |
| `roll` | 0–5, interval 2 s |
| `carIndex` / `whoIndex` | derived from `scrollLeft / cardStride` |
| `stickStep` | 0–3, from step rects in a rAF loop |
| `strip`, `folderHover`, `faqOpen` | index each |
| `iso` | bool (re-score) |
| `dockTab` | 0 Feed / 1 Bids / 2 Company; default Bids |
| `site` | string; valid when it matches `/^[^\s.]+(\.[^\s.]+)*\.[a-z]{2,}$/i` |

The hero glow, the 777 counter and the score count-up write straight to DOM refs inside one `requestAnimationFrame` loop, so React doesn't re-render every frame. Do the same, or use Framer Motion `useMotionValue`.

## Data (fictional, in the page source)
- **Six tenders:**
  - Stadt Ellerbach: Go 100
  - Stadtwerke Kaltbrunn: Maybe 90
  - Universidad de Valdemora: Maybe 85
  - Landkreis Hohenau: No-go 25 (Go 92 with ISO 27001)
  - Gemeente Vlietdam: No-go 25
  - Centre Hospitalier de Morlanne: No-go 25
- **The 45 CPV divisions** with weekly open counts are listed in `CPV` and `OPEN`.
- **Verdict rules** are in `docs/DESIGN.md` §10.

## Assets
| Path | What |
|---|---|
| `assets/sectors/cpv-XX.png` | 45 sector images, generated in Canva |
| `assets/t-*.png` | Tender photos |
| `assets/app-*.png` | App photos |
| `assets/harbor-dusk.png`, `sky-clouds.png`, `*-tokens.png` | Marketing images |

All are low-res previews; replace them before launch. Icons are Material Symbols Rounded. There is no logo: the wordmark is "TenderScout" in Hanken Grotesk 800, −.03em, with a 10 px sky dot.

## Files
| File | What |
|---|---|
| `TenderScout Website v3.dc.html` | **The website (main reference)** |
| `TenderScout Map.html` | Map component |
| `support.js` | Runtime for the reference pages |
| `reference/TenderScout UI Controls / Content / Atmosphere.dc.html` | Component library, every component in isolation with all its states |
| `reference/PhoneScreen.dc.html` | Full app screens (light and dark, palettes) |
| `reference/TenderScout Launch Film.dc.html` (+ `launch-film.jsx`, `animations-v3.jsx`) | 45 s launch film |
| `reference/explorations/v3-tokens.css` | App colour tokens per palette |
| `docs/DESIGN.md` | Full app spec: screens, states, accessibility, data model |
| `docs/MOTION.md` | Brand motion system |
