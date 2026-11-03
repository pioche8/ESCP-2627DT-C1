# TenderScout · DESIGN.md

**Direction: Bold** · v2.0 · iPhone 390 × 844 pt · light and dark

This is the build spec for the TenderScout mobile app. It describes the "Bold" direction shown in `TenderScout Renders.dc.html` and `PhoneScreen.dc.html`. The earlier cobalt-chip direction is archived in `archive/DESIGN-v1-cobalt.md`.

---

## 0. Quick start

1. Paste the token block in §3.7 into your global CSS, or map it to your theme object.
2. Load **Hanken Grotesk** (400–800, plus 400 italic), **IBM Plex Mono** (500, 600) and **Material Symbols Rounded** (variable).
3. Model verdicts as `go | maybe | nogo`, and requirement status as `met | fail | check`. Colour, shape and label all derive from that one value.
4. Every verdict is shown as **shape + label + colour**, never colour alone.
5. All numbers use tabular figures.
6. Primary actions live in the bottom third. Every tap target is at least 44 × 44.

---

## 1. Product

TenderScout reads new EU public tenders overnight, in any language, and tells the owner of a small firm whether they can bid. Each tender gets a verdict (**Go / Maybe / No-go**) and a fit score out of 100. Every requirement links to the exact page and sentence that proves it.

**User:** owner or MD of a 5–50 person firm selling to the public sector (IT and network installers, building trades, facility services, engineering). There is no bid manager. They use the app one-handed, between jobs or in a van, for 1–3 minutes at a time, on patchy signal. They are not procurement experts.

**Promise:** "Can we even bid on this?" answered in under 60 seconds, with proof.

## 2. Principles

1. **The verdict is the hero.** It is the biggest, most colourful thing on every screen: a solid colour block, a giant score, a shape.
2. **Proof is physical.** Every requirement carries a thumbnail of its source page with the clause marked. The full quote sits on a paper card. The source looks like a document, not like AI output.
3. **Shape carries meaning.** ● Go · ▲ Maybe · ■ No-go · ◆ Needs your check. The meaning survives greyscale, colour blindness and sunlight glare.
4. **Few elements, large.** One idea per row. No cards inside cards, no chip clutter. Whitespace is part of the layout.
5. **AI is a footnote.** There is a small neutral "Simulated AI" pill, and no robots, sparkles or gradients.
6. **Thumb zone.** Actions sit in a bottom bar or a floating dock.

---

## 3. Foundations

### 3.1 Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--v-bg` | `#F1F0ED` | `#0C0D10` | Screen background (warm off-white) |
| `--v-card` | `#FFFFFF` | `#16181D` | Cards, sheets, inputs |
| `--v-card-2` | `#F6F5F2` | `#1E2127` | Citation chips, stepper track |
| `--v-paper` | `#FFFFFF` | `#F4F3EF` | Source-page thumbnails and the quote card. Stays light in dark mode. |
| `--v-ink` | `#0D0F12` | `#F2F1EE` | Primary text, dark buttons, selected stage |
| `--v-ink-2` | `#55585E` | `#A9ACB3` | Secondary text |
| `--v-ink-3` | `#85888E` | `#7E828A` | Meta, labels |
| `--v-line` | `#E4E2DD` | `#262930` | Dividers, outline buttons |
| `--v-track` | `rgba(13,15,18,.06)` | `rgba(255,255,255,.08)` | Segmented tracks, AI pill, count pills |
| `--v-brand` | `#2546F0` | `#4F6BFF` | Primary action, active dock tab, toggle on, Welcome and Company headers |
| `--v-brand-text` | `#2546F0` | `#9AABFF` | Links, citations, saved bookmark, impact hints |
| `--v-brand-soft` | `#E3E8FE` | `#1A2246` | Selected toggle chips, "In Bids" state |
| `--v-dock` | `#0D0F12` | `#1E2127` | Floating dock |

### 3.2 Verdict system

| Verdict | Shape | `solid` L / D | `on` | `soft` L / D | `ink` L / D |
|---|---|---|---|---|---|
| **Go** | ● circle | `#13724B` / `#1F9D63` | `#FFFFFF` / `#04140C` | `#DDF1E7` / `#0F2A1F` | `#0E5C3C` / `#5ED69C` |
| **Maybe** | ▲ triangle | `#F5A524` / `#F5A524` | `#1A1200` | `#FDEFD3` / `#2E220B` | `#8A5300` / `#F7C25E` |
| **No-go** | ■ square | `#D23A2E` / `#E5483B` | `#FFFFFF` | `#FBE3E0` / `#33161A` | `#A42A20` / `#FF8B80` |
| **Needs your check** | ◆ diamond | `#6145E0` / `#7A62FF` | `#FFFFFF` | `#EEEAFD` / `#211A40` | `#4B31C2` / `#B3A5FF` |

Roles:
- **solid**: colour blocks, score tiles, summary tiles, detail header.
- **on**: text and shape placed on a solid.
- **soft**: tinted fills (status pills, the unresolved row, callouts).
- **ink**: verdict text on `bg` or `card` (status lines, reasons).

Rules:
- Maybe always uses dark text `#1A1200` on its solid. White on amber fails contrast.
- "Needs your check" is a requirement status, never a tender verdict. It means a human must decide.
- Verdict colours are never decorative and never used on buttons.
- Requirement status maps onto the same palette: `met → go`, `fail → nogo`, `check → check`.

**Shapes** are drawn as primitives, not icons:

| Shape | CSS |
|---|---|
| ● | `border-radius: 50%` |
| ▲ | `clip-path: polygon(50% 0, 100% 100%, 0 100%)`, width 1.1 × height |
| ■ | plain square |
| ◆ | square at `transform: rotate(45deg)`, 0.85 × the size |

Sizes: 7–8 in status lines, 10–11 in tiles and headers, 12–13 in marketing.

### 3.3 Typography

| Family | Use |
|---|---|
| **Hanken Grotesk** | All UI text. Weights 400 / 500 / 600 / 700 / 800, plus 400 italic for original-language titles. |
| **IBM Plex Mono** | Page citations, "ORIGINAL · GERMAN" labels, document metadata. Mono is the voice of the source. |
| **Material Symbols Rounded** | Icons. wght 400; FILL 1 only for the active dock tab and the saved bookmark. |

| Role | Size / line | Weight | Tracking |
|---|---|---|---|
| Score, giant (detail header) | 150 / 0.76 | 800 | −0.075em |
| Score, summary tile | 40 / 1 | 800 | −0.05em |
| Score, card tile | 21 / 1 (19 on Bids) | 800 | −0.04em |
| Welcome headline | 35 / 38 | 800 | −0.04em |
| Screen title | 32 / 36 | 800 | −0.04em |
| Sheet / detail title | 25 / 30 | 800 | −0.03em |
| Section header | 20 / 26 | 800 | −0.025em |
| Reason on a colour block | 18 / 25 | 600 | −0.01em |
| Card title | 17 / 22 | 700 | −0.015em |
| Requirement title | 16 / 21 | 700 | −0.01em |
| Body | 15 / 21–22 | 500 | 0 |
| Secondary / our check | 14 / 19 | 500 | 0 |
| Meta | 13 / 18 | 500 | 0 |
| Original-language title | 13–14 / 18–19 | 400 italic | 0 |
| Status line | 12 / 16 | 700 verdict + 500 reason | 0 |
| Labels, tabs | 11–13 / 14–16 | 600–700 | 0 |
| Citation (Plex Mono) | 12 / 16 | 500 | 0 |
| Quote tag (Plex Mono) | 10–11 | 600 | 0.06–0.08em, caps |
| Wordmark | 19 / 1 | 800 | −0.03em |

Format money short and tabular: `€95k`, `€1.1M`. Days are written `29 d` on cards and `29 days left` in full sentences.

### 3.4 Spacing and layout

Base unit: 4 pt.

| Measure | Value |
|---|---|
| Status bar | 54 |
| Nav row | 48 |
| Side gutter, cards | 16 |
| Side gutter, text and titles | 20 |
| Gap between cards | 8 |
| Card padding | 16 |
| Section header | 24–26 above, 8–12 below |
| Bottom action bar | buttons 58 tall, 16 side insets, 32 from the bottom edge, over a fade from transparent to `bg` |
| Floating dock | 62 tall pill, 28 side insets, 30 from the bottom; content gets a 120 pt fade from transparent to `bg` behind it |
| Hit areas | ≥ 44 everywhere |

### 3.5 Radii

| px | Use |
|---|---|
| 2 | Flags |
| 5 | Source-page thumbnail |
| 7 | Mini verdict chips in the re-score card |
| 13 | Citation chip (26 tall) |
| 15–17 | Score tiles (48 / 56) |
| 16 | Fact tiles, verdict tiles on Company |
| 20 | Buttons and inputs (58 tall), quote paper card |
| 22 | Summary tiles, requirement cards |
| 24 | Tender cards, bid cards, grouped lists, re-score card |
| 34 | Bottom sheet top corners |
| 36 | Bottom corners of colour-block headers |
| 40 | Welcome header bottom corners |
| 999 | Segmented tracks, pills, dock, toggles |

### 3.6 Elevation

| Name | Value |
|---|---|
| Card (light) | `0 1px 2px rgba(13,15,18,.04), 0 10px 28px -12px rgba(13,15,18,.16)` |
| Card (dark) | `inset 0 0 0 1px rgba(255,255,255,.06)` |
| Raised overlay (re-score card) | `0 18px 36px -14px rgba(13,15,18,.35)` |
| Floating dock | `0 14px 30px -10px rgba(13,15,18,.5)` |
| Primary button | `0 12px 26px -10px rgba(37,70,240,.6)` |
| Quote paper card | `0 18px 36px -18px rgba(13,15,18,.45)` |
| Page thumbnail | `0 0 0 1px rgba(13,15,18,.08), 0 6px 12px -6px rgba(13,15,18,.35)` |
| Sheet | `0 -20px 40px rgba(0,0,0,.25)` + scrim `rgba(5,6,8,.5)` |

There are no gradients on surfaces. The only gradients are the bottom fades behind the dock and the action bar.

### 3.7 Token block (CSS)

```css
:root, [data-theme="light"] {
  --v-bg:#F1F0ED; --v-card:#FFFFFF; --v-card-2:#F6F5F2; --v-paper:#FFFFFF;
  --v-ink:#0D0F12; --v-ink-2:#55585E; --v-ink-3:#85888E; --v-line:#E4E2DD; --v-track:rgba(13,15,18,.06);
  --v-brand:#2546F0; --v-brand-text:#2546F0; --v-brand-soft:#E3E8FE; --v-dock:#0D0F12;
  --v-go:#13724B; --v-go-on:#FFFFFF; --v-go-soft:#DDF1E7; --v-go-ink:#0E5C3C;
  --v-maybe:#F5A524; --v-maybe-on:#1A1200; --v-maybe-soft:#FDEFD3; --v-maybe-ink:#8A5300;
  --v-nogo:#D23A2E; --v-nogo-on:#FFFFFF; --v-nogo-soft:#FBE3E0; --v-nogo-ink:#A42A20;
  --v-check:#6145E0; --v-check-on:#FFFFFF; --v-check-soft:#EEEAFD; --v-check-ink:#4B31C2;
  --v-shadow:0 1px 2px rgba(13,15,18,.04),0 10px 28px -12px rgba(13,15,18,.16);
  --font-ui:'Hanken Grotesk',system-ui,sans-serif; --font-mono:'IBM Plex Mono',ui-monospace,monospace;
  --ease-out:cubic-bezier(.2,.8,.2,1); --ease-spring:cubic-bezier(.2,.9,.25,1.2); --ease-sheet:cubic-bezier(.32,.72,0,1);
}
[data-theme="dark"] {
  --v-bg:#0C0D10; --v-card:#16181D; --v-card-2:#1E2127; --v-paper:#F4F3EF;
  --v-ink:#F2F1EE; --v-ink-2:#A9ACB3; --v-ink-3:#7E828A; --v-line:#262930; --v-track:rgba(255,255,255,.08);
  --v-brand:#4F6BFF; --v-brand-text:#9AABFF; --v-brand-soft:#1A2246; --v-dock:#1E2127;
  --v-go:#1F9D63; --v-go-on:#04140C; --v-go-soft:#0F2A1F; --v-go-ink:#5ED69C;
  --v-maybe:#F5A524; --v-maybe-on:#1A1200; --v-maybe-soft:#2E220B; --v-maybe-ink:#F7C25E;
  --v-nogo:#E5483B; --v-nogo-on:#FFFFFF; --v-nogo-soft:#33161A; --v-nogo-ink:#FF8B80;
  --v-check:#7A62FF; --v-check-on:#FFFFFF; --v-check-soft:#211A40; --v-check-ink:#B3A5FF;
  --v-shadow:inset 0 0 0 1px rgba(255,255,255,.06);
}
```

This block is also saved as `explorations/v3-tokens.css`, which scopes it with `[data-v3]`.

### 3.8 Iconography

Material Symbols Rounded, wght 400. Sizes:

| Context | Size |
|---|---|
| Inline with text | 14–15 |
| Rows and buttons | 18–21 |
| Nav | 22 |
| Dock | 24 |
| Empty states | 32 at wght 300 |

| Concept | Icon |
|---|---|
| Feed | `radar` |
| Bids | `bookmarks` |
| Company | `domain` |
| About / AI disclosure | `info` |
| Back | `chevron_left` |
| Citation | `description` |
| Saved (filled) | `bookmark` |
| Save | `bookmark_add` |
| Pages read | `menu_book` |
| Website field | `language` |
| Continue | `arrow_forward` |
| Verdict up / down | `trending_up` / `trending_down` |
| Unclear wording | `help` |
| Stepper | `add` / `remove` |
| Feed tuning | `tune` |
| Restore | `undo` |
| Reset | `restart_alt` |
| Closed | `event_busy` |
| Disabled | `lock` |
| Offline | `cloud_off` |
| About rows | `science`, `rule`, `badge` |

**Flags** are CSS stripe chips, 16 × 11, radius 2, always followed by the buyer name. Don't use flag emoji.

| Country | Stripes |
|---|---|
| DE | `#111 / #DD0000 / #FFCE00` |
| AT | `#C8102E / #FFF / #C8102E` |
| ES | `#AA151B / #F1BF00 / #AA151B` (1:2:1) |
| NL | `#AE1C28 / #FFF / #21468B` |
| FR | vertical `#002654 / #FFF / #CE1126` |

**Wordmark:** "TenderScout" in Hanken Grotesk 800, −0.03em. There is no logo yet.

### 3.9 Motion

| Duration | Use |
|---|---|
| 120 ms | Press: scale .98, brightness .94 |
| 180 ms | Filter pill slide, toggle track colour, stage switch |
| 240 ms | Toggle knob (`--ease-spring`), card collapse on Skip, toast in |
| 320 ms | Sheet in/out (`--ease-sheet`) |
| 400 ms | Verdict tiles resizing their flex ratio |
| 520 ms | Re-score card entrance: translateY(−10) scale(.97) opacity 0 → none (`--ease-spring`) |
| 600 ms | Score count-up |

`prefers-reduced-motion`: every duration drops to 0. State changes still happen.

**Haptics:**
- Light impact on toggle.
- Success notification when a verdict improves.
- Warning notification when a verdict drops.
- Selection feedback on stage switch.

---

## 4. Components

| Component | Spec |
|---|---|
| **Verdict summary tiles** (Feed) | 3 solid tiles, 94 tall, radius 22, gap 6, flex ratio = count (1 : 2 : 3). Shape top-left (10). Count 40 / 800. Label 13 / 700. Colours `solid` / `on`. |
| **Score tile** | 56 × 56 on cards (radius 17), 48 × 48 on Bids (radius 15). Verdict `solid` fill, score 21 / 800 (or 19) in `on`, centered. |
| **Status line** | Shape (8) + verdict word (12 / 700, `ink`) + "· reason" (12 / 500, `ink-3`). |
| **Tender card** | Radius 24, padding 16, `card` + card shadow. Grid `56px 1fr`, gap 14. Right column: status line; title 17 / 700; italic original title 13 / `ink-3`; meta row (flag + "Buyer · €value · N d", 13 / 500 `ink-2`) with the bookmark (FILL 1, `brand-text`) pushed right when saved. Days ≤ 10 are shown in `maybe-ink` 700. The whole card is the tap target. |
| **Segmented filter** | Track pill, padding 4, `track` fill. Options 36 tall. Selected = white pill + `0 1px 3px rgba(13,15,18,.12)`, 14 / 700. Others 14 / 600 `ink-2`. Labels "All 6 / Go 1 / Maybe 2 / No-go 3". |
| **Colour-block header** (Detail) | Verdict `solid`, full-bleed under the status bar, 36 bottom radius. Translucent controls: 40 circles and the AI pill on `rgba(255,255,255,.18)`. Verdict shape + word 15 / 700, giant score 150 / 800 + "/100" 24 / 700, reason 18 / 600. Text in `on`. |
| **Fact tiles** | 4 across, gap 6, radius 16, padding 10 × 12. Label 11 / 600 `ink-3`, value 17 / 800. |
| **Requirement card** | Radius 22, grid `1fr 36px`. Status line ("Fails · Knock-out"), requirement 16 / 700, our check 14 / 500 `ink-2`, then the citation chip. Right side: page thumbnail. Unresolved: `check-soft` fill + 1.5 inset ring in `check`, second line "58% sure. Only you can answer this." in `check-ink` 600. Sort order: fail → check → met. Tap opens the requirement sheet. |
| **Citation chip** | 26 tall, radius 13, `card-2` fill, `description` 14 + "Vergabeunterlagen p. 12" in Plex Mono 12 / 500 `brand-text`. Opens the PDF at that page with the sentence highlighted. |
| **Page thumbnail** | 36 × 48, radius 5, `paper` fill, five 1.5 pt grey lines (`#DAD8D3`, 7.5 pt apart), and one 6 pt bar in the status colour where the clause sits. Rotated ±3–4°, with the thumbnail shadow. |
| **Quote paper card** | `paper`, radius 20, rotated −1.2°, padding 22 / 18 / 18. A black tag "ORIGINAL · GERMAN" (Plex Mono 10 / 600 caps, 22 tall) overlaps the top edge at x 16. Mono header row: document name + "p. 31 · §5.4". Grey 6 pt placeholder lines above and below the real sentence (15 / 23 / 500). Decisive phrase: status colour at 16–20% fill + `inset 0 -2px 0` underline in the status colour, radius 4. |
| **Confidence readout** | Right-aligned. Number 28 / 800 in status `ink`, label "AI confidence" 11 / 600 `ink-3`. Below 70% → status "Needs your check". |
| **Status pill** | 30 tall, `soft` fill, shape + label 13 / 700 `ink`. |
| **Buttons** | 58 tall, radius 20, 16 / 700. **Primary** = `brand` + primary shadow. **Dark** = `ink` fill, `bg` text (Welcome). **Outline** = `card` + 1.5 `line` ring. **Unresolved pair** = both outlined in `check`, neither preselected. **Tonal** = `brand-soft` / `brand-text` ("In Bids · Deciding"). **Disabled** = `track` fill, `ink-3`, no shadow. In bars: Secondary flex 1, Primary flex 2. |
| **Floating dock** | 62 tall pill, `dock` fill, padding 7, dock shadow. Active tab = `brand` pill 48 tall with filled icon + label (15 / 700, white). Inactive = 72 wide icon-only, `#8C8F94`. Tabs: Feed, Bids, Company. Hidden in onboarding, detail and About. |
| **Simulated AI pill** | 24 tall, `track` fill (or translucent white on colour blocks), 11 / 600 `ink-2`. Required on Check your profile, Feed, Detail and sheets. |
| **Toggle** | 52 × 32, `brand` when on; off = `track` + 1 `line` ring. Knob 26, white, `0 2px 6px rgba(0,0,0,.2)`. |
| **Stepper** | 44 tall pill, `card-2`. Buttons 44 × 44: − in `ink-2`, + in `brand-text`. Value 18 / 800. |
| **Stage switcher** | Track pill, padding 4, 3 options 36 tall, 13 / 700. Selected = `ink` fill, `bg` text. |
| **Re-score card** | Radius 24, `card`, raised shadow, overlaps the Company header by −30. A 44 tile (radius 15) in `go` (or `maybe` for a drop) with `trending_up` / `trending_down`. Buyer 16 / 800. Change row: mini chips (22 tall, radius 7, solid + shape + label 12 / 700) "No-go → Go" + "just now" 500 `ink-3`. |
| **Impact hint** | 12 / 600 `brand-text`, e.g. "Turn on → Gemeente Vlietdam becomes Maybe". After the change it becomes `go-ink` with a check: "✓ Unlocked Landkreis Hohenau". |
| **Bottom sheet** | `card`, top radius 34, grabber 38 × 5 `line`, padding 10 / 20 / 34, gap 16. Scrim `rgba(5,6,8,.5)`. |
| **Toast** | 52 tall, radius 16, `ink` fill, `bg` text 15 / 500. Leading green ●, trailing action ("Undo", "View") in `brand-text` (dark variant), 44 hit. Sits 12 above the bar, auto-dismisses after 4 s. |
| **Empty state** | 80 disc (`card` + `line` ring) with a 32 icon at wght 300, title 22 / 800, one sentence 15 / 500 `ink-2`, optional mono meta, optional 48 button. |

---

## 5. Screens

### 01 Welcome · no dock
- Top 500 pt is a `brand` block with 40 bottom radius and white status bar text. Wordmark at 20, 66.
- Three tilted verdict tiles inside the block:
  - Go 100: 118, radius 30, −9°.
  - Maybe 90: 108, radius 28, +8°.
  - No-go 25: 100, radius 26, −3°.
  - Each has shadow `0 24px 40px -16px rgba(5,12,60,.55)`.
- Headline (white, 35 / 800): **Find public tenders you can actually win**. Sub-line in `#DCE2FF`, 15 / 21.
- Bottom area:
  - "Company website" label (13 / 600 `ink-2`).
  - Input 58 tall, radius 20, `language` icon, 2 pt `brand` ring when focused.
  - Dark button **Draft my profile** with `arrow_forward`.
  - Caption "Prototype · all companies and tenders are fictional".

### 02 Reading · no dock
- Title **Reading your site, past references and certificates…** (32 / 800).
- 6 pt progress bar (`brand` on `track`).
- Card list of steps: done = green ● + label + meta right ("18 pages", "4 found"); active = spinner; pending = hollow ring.
- "Found so far" in Plex Mono 12 ("ISO 9001:2015 · TÜV · valid to 03/2027").
- Bottom: "Usually takes about 20 seconds".

### 03 Check your profile · no dock · AI pill
- Back chevron. Title **Check your profile**, sub "Drafted from nordlicht-netzwerk.de. Fix anything that's off."
- One card, radius 24:
  - Nordlicht Netzwerk GmbH, Leipzig, with DE flag.
  - Stat row: Staff 24 · Turnover €3.2M · References 4 (24 / 800).
  - Sectors as `track` chips.
  - Certificates: ISO 9001.
  - Bid languages: German, English.
  - Countries: DE, AT.
  - Mono sources footer.
- Bar: **Edit** (outline) · **Looks right** (primary).

### 04 Feed · dock: Feed · AI pill
1. Nav row: wordmark, AI pill, `info`.
2. "Mon 2 Nov · read overnight" (14 / 600 `ink-3`) and **6 new tenders** (32 / 800).
3. Verdict summary tiles **1 Go · 2 Maybe · 3 No-go**.
4. `menu_book` "Read 777 pages in 4 languages so you don't have to".
5. Segmented filter.
6. Tender cards sorted by score, then days left.
7. Floating dock.

### 05 Tender detail · no dock · AI pill
1. Colour-block header: No-go, **25**/100, reason "1 knock-out requirement: you don't hold ISO 27001. One more needs your answer."
2. **IT security audit**, *IT-Sicherheitsaudit*, DE flag + Landkreis Hohenau.
3. Fact tiles: Value €95k · Days left 18 · Effort ~2 d · Pages 146.
4. **In short**: 2–3 sentences, 15 / 22.
5. **Can you qualify?** with "4 of 6 met" on the right. Requirement cards: fail → check → met.
6. **Ask this tender**: suggested question cards (52 tall, radius 20) that expand in place into an answer + citation chip. One open at a time. No free-text chat.
7. Bar: **Skip** · **Save to Bids**.

The header colour follows the verdict. For Maybe it is amber with `#1A1200` text.

### 06 Requirement sheet
- Status pill + confidence readout, then the requirement title.
- Our check: a `soft` callout with `check_circle` / `cancel`.
- Quote paper card, then "TRANSLATION · ENGLISH" (mono 11) and the translation (15 / 22 `ink-2`).
- Actions **We don't meet it** / **We meet it**.
- Unresolved variant (e.g. 58%, "Staff with 'comparable qualification'"):
  - The callout uses `help`: "The tender doesn't say what counts as a 'comparable qualification'. Only you can answer this."
  - Both buttons are outlined in `check`.
  - The answer is stored on the profile and the tender re-scores.

### 07 Skip sheet
- **Why skip this one?** with sub "IT security audit · Landkreis Hohenau".
- Multi-select chips, 44 tall, radius 14: Too big for us · Missing a certificate · Wrong region · Not enough time · Price-only · Other. Selected = `brand-soft` + `brand-text` + check.
- Note with `tune`: **Your reasons tune tomorrow's feed**.
- Buttons Cancel · **Skip tender**. Skipping without a reason is allowed.

### 08 Bids · dock: Bids
- **Bids**, with sub "3 saved · next deadline in 9 days".
- Groups **Deciding / Bidding / Submitted**, each with a count pill. An empty group shows a dashed placeholder, "Nothing here yet".
- Bid card: score tile, title, flag + buyer + days, stage switcher. Switching moves the card to the new group (240 ms).
- **Skipped** section: rows with the reason + **Restore** (`undo`). Restore moves the tender to Deciding.

### 09 Company, the lever · dock: Company
- `brand` header with **Company**, "Nordlicht Netzwerk GmbH · Leipzig", "Your feed right now" and three live verdict tiles (52 tall, radius 16).
- Re-score card overlapping the header.
- **Size**: Turnover field "€ 3.2 M" (decimal keypad, comma or dot) and References stepper.
- **Certificates**: ISO 9001, ISO 27001, VCA, ISO 14001 toggles with impact hints.
- **Bid languages**: chips for German, English, Spanish, French, Dutch.
- **Where you bid**: toggle "Bid outside Germany and Austria".

### 10 About · no dock
- Back. **About TenderScout**: university prototype, ESCP, Digital Product Design.
- Rows with 40 icon tiles:
  - `science` **AI output is simulated** (shows the pill as a key).
  - `rule` **The decision logic is real code**.
  - `badge` **All data is fictional**.
- Outline button in `nogo-ink`: **Reset demo**, with a confirm alert.

---

## 6. States

| State | Spec |
|---|---|
| Loading tender | Header block in `card-2`. Spinner + **Reading 146 pages (German)…**, mono "p. 89 of 146", progress bar, steps (Found 6 requirements · Translating the key clauses · Checking them against your profile). Skeleton bars (`track`, radius 6). Save stays enabled. |
| Empty feed | `radar` disc. **Nothing new tonight** / "We read 214 new tenders in Germany and Austria. None fit your sectors." / mono "NEXT READ · TONIGHT 02:00" / outline button "Widen your profile". |
| Empty Bids | `bookmarks` disc. **No bids yet** / "Save a tender from your feed and it lands here, ready to move from Deciding to Submitted." / primary "Open Feed". |
| Closed tender | Header in `card-2` with `event_busy`: **Closed** / "The deadline passed on 11 Nov. You can't bid on this one any more." Save is disabled, with a `lock` line "Closed tenders can't be saved". In the feed, the card is at 60% opacity and shows "Closed". |
| Saved | Primary → tonal "In Bids · Deciding". Toast **Saved to Bids** · View. |
| Skipped | The card collapses out of the feed. Toast **Skipped**. Reason saved. · Undo. |
| Offline | Card banner `cloud_off` "Offline. Showing last night's results." Citations open cached pages. |
| Dark mode | Dark token column. Colour blocks keep their verdict solid; paper elements stay light. |

---

## 7. The re-score moment

Switching ISO 27001 on in Company:

| t | Event |
|---|---|
| 0 | Knob springs (240 ms), track colour fades (180 ms). Light haptic. Scorer runs synchronously. |
| 60 ms | Re-score card remounts (520 ms spring): "Landkreis Hohenau · No-go → Go · just now". Success haptic. |
| 60 ms | Verdict tiles re-flex from 1 : 2 : 3 to 2 : 2 : 2 (400 ms); counts count up (600 ms). |
| next Feed visit | Cards re-sort (240 ms); the changed card's score tile pulses once. |

- Several changes: name the first and add "+N more".
- A drop: amber card with `trending_down` and a warning haptic.
- No change: neutral card "Re-scored 6 tenders. No verdict changed."

---

## 8. Copy

Tone: direct, calm, specific. Sentence case. Second person. No exclamation marks, no emoji.

Use these strings verbatim:
- Find public tenders you can actually win
- Draft my profile
- Reading your site, past references and certificates…
- Edit / Looks right
- 1 Go · 2 Maybe · 3 No-go
- Read 777 pages in 4 languages so you don't have to
- In short · Can you qualify? · Ask this tender
- Skip / Save to Bids
- ORIGINAL · GERMAN
- We don't meet it / We meet it
- Why skip this one?
- Your reasons tune tomorrow's feed
- Reading 146 pages (German)…
- Saved to Bids · Skipped
- Reset demo
- Simulated AI

Glossary:

| Avoid | Use |
|---|---|
| Eligibility criteria | Can you qualify? |
| Exclusion ground | Knock-out requirement |
| Contracting authority | Buyer |
| Low confidence | Needs your check |

---

## 9. Accessibility

- Verdicts are shape + label + colour. Test every screen in greyscale.
- VoiceOver labels:
  - Tender card: "No-go, score 25 of 100. IT security audit, Landkreis Hohenau. 1 knock-out requirement."
  - Requirement row: "Fails, knock-out. ISO 27001 certification. Not in your profile. Source: Vergabeunterlagen page 12."
- Quote text carries `lang="de"` (or the source language).
- Toggles use `role="switch"`. The stage switcher and filter are radio groups. The toast and re-score card are polite live regions.
- Contrast: Maybe uses dark text on amber. Every `ink` on `soft` pair is ≥ 4.5:1. `ink-3` on `bg` is ≥ 4.5:1 for 13 pt and up.
- Dynamic Type up to XL: cards grow, titles never truncate, buyer names may ellipsise.

---

## 10. Data and logic

```ts
type Verdict = 'go' | 'maybe' | 'nogo';
type ReqStatus = 'met' | 'fail' | 'check';          // check = confidence < 70 && unanswered
interface Citation { doc: string; page: number; section?: string; quote: string; highlight: string; lang: string; translation: string }
interface Requirement { id: string; title: string; knockout: boolean; confidence: number; citation: Citation; answer?: 'meets' | 'does_not_meet' }
interface Tender { id: string; title: string; originalTitle: string; buyer: string; country: string; value: string; daysLeft: number; pages: number; language: string; summary: string; requirements: Requirement[] }
interface Profile { turnoverM: number; references: number;
  certs: { iso9001: boolean; iso27001: boolean; vca: boolean; iso14001: boolean };
  langs: { de: boolean; en: boolean; es: boolean; fr: boolean; nl: boolean };
  crossBorder: boolean }                             // home = DE, AT
```

Verdict rule:
- A failed **knock-out**, or the buyer's country outside DE/AT while cross-border is off → **No-go**.
- Otherwise, any other failed requirement → **Maybe**.
- Otherwise → **Go**. Open "check" rows don't block Go.

Score: 100 minus the weights of unmet requirements, clamped 0–100, with No-go capped at 40.

Demo fixtures (default profile: €3.2M turnover, 4 references, ISO 9001, German and English, cross-border on):

| Tender | Rules → **default** |
|---|---|
| Structured cabling and Wi-Fi for 12 primary schools · Stadt Ellerbach 🇩🇪 · €480k · 29 d | no ISO 9001 → No-go 30 · turnover < 1 → Maybe 70 · else **Go 100** "Meets all 8 requirements" |
| Fibre-to-the-building rollout · Stadtwerke Kaltbrunn 🇦🇹 · €1.1M · 43 d | 5 − refs = 0 → Go 96 · 1 → **Maybe 90** "Short by 1 reference · mandatory site visit" · ≥ 2 → No-go 40 |
| Data centre cabling, lot 2 · Universidad de Valdemora 🇪🇸 · €310k · 9 d | !cross → No-go 20 · Spanish → Go 95 · else **Maybe 85** "Bid must be in Spanish" |
| IT security audit · Landkreis Hohenau 🇩🇪 · €95k · 18 d | ISO 27001 → Go 92 · else **No-go 25** "1 knock-out requirement · 1 to check" |
| Public Wi-Fi for 9 libraries · Gemeente Vlietdam 🇳🇱 · €220k · 21 d | !cross → No-go 20 · !VCA → **No-go 25** "VCA certificate mandatory" · Dutch → Go 94 · else Maybe 80 |
| IT support framework · Centre Hospitalier de Morlanne 🇫🇷 · €2.4M · 34 d | !cross → No-go 20 · turnover < 5 → **No-go 25** "Needs €5M turnover" · French → Go 90 · else Maybe 78 |

Persisted state: profile, requirement answers, saved tenders and their stage, skipped tenders and their reasons. **Reset demo** clears all of it.

---

## 11. Files

| File | What |
|---|---|
| `PhoneScreen.dc.html` | The six drawn screens (welcome, feed, detail, req, company, bids), light and dark |
| `TenderScout Renders.dc.html` | Presentation board: 3D, hero, exploded proof, dark mode, line-up. Tweaks: hero background, tilt, phone theme |
| `TenderScout 3D.html` + `three-d-stage.js` | Interactive three.js hero scene with GLB / OBJ download |
| `explorations/v3-tokens.css` | Token block (§3.7) |
| `design_handoff_tenderscout_bold/` | Developer handoff bundle (README + files) |
| `archive/DESIGN-v1-cobalt.md` | Previous direction |

## 12. QA checklist

- [ ] Every verdict reads in greyscale (shape + label).
- [ ] Every AI claim has a citation chip that opens the right page.
- [ ] Simulated AI pill on Check your profile, Feed, Detail and sheets.
- [ ] Unresolved rows are violet ◆, show their confidence and preselect nothing.
- [ ] Maybe uses dark text on amber everywhere.
- [ ] All targets ≥ 44, and actions in the bottom third.
- [ ] Tabular numbers. Money as €k / €M.
- [ ] Turning ISO 27001 on flips Landkreis Hohenau from No-go to Go, with the re-score card.
- [ ] Loading, empty feed, empty Bids, closed, saved, skipped and offline states are all built.
- [ ] Dark mode matches the renders. Paper elements stay light.
- [ ] Reduced motion: no movement, same results.
