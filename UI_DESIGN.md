# TenderScout UI design

The interface as it ships on `main` (6 Nov 2026: every frame re-made from the five-tab app, `CLAUDE.md` §11 item 137): a storyboard of the demo, every screen and state as a screenshot, and the visual system behind them. Every image is the real app at 390 × 844 (2×), dark by default, showing the fictional demo data ([`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional)). [`DESIGN.md`](DESIGN.md) is the designer's original spec of 2 Nov; where the two differ, this file and [`shared/tokens.json`](shared/tokens.json) describe what ships (the 4 Nov declutter, `CLAUDE.md` §11 items 53–68).

| This file covers | Not in this file (look here instead) |
|---|---|
| The demo storyboard, a screenshot of every screen and state in dark and light, the colours, type, shape, icons, motion and the look of each component, and how the UI got here | Where things sit and the controls' sizes, as text wireframes: [`SKELETON.md`](SKELETON.md) · what each screen gives the owner: [`PRODUCT.md`](PRODUCT.md) · routes, flows and Back behaviour: [`docs/NAVIGATION.md`](docs/NAVIGATION.md) · the words and their sources: [`docs/design/CONTENT_REQUIREMENTS.md`](docs/design/CONTENT_REQUIREMENTS.md) · all five UX planes: [`docs/design/UX_PLANES.md`](docs/design/UX_PLANES.md) |

## 1. Storyboard: the 75-second demo

The path from [`BRIEF.md`](BRIEF.md), one frame per step (also a video: [`docs/demo/demo-path-390x844.mp4`](docs/demo/demo-path-390x844.mp4)).

| Frame | Step | The owner does | They see |
|---|---|---|---|
| <img src="docs/demo/step-1-welcome.png" width="180" alt="Welcome screen"> | 1 · Welcome | types the firm's website, taps "Draft my profile", then "Looks right" | the headline, "All 45 EU sectors · 6 new tenders tonight", one field and one button. The simulated AI drafts the profile (Reading and Check your profile are in §2) |
| <img src="docs/demo/step-2-feed.png" width="180" alt="Feed with six ranked tenders"> | 2 · Feed | reads the morning feed | "6 new tenders", "read 777 pages in 4 languages · Simulated AI", the counts as filters (All 6 · ● Go 1 · ▲ Maybe 2 · ■ No-go 3) and the cards ranked by verdict and score |
| <img src="docs/demo/step-3-go-tender-citation.png" width="180" alt="Requirement sheet with the German source sentence"> | 3 · The Go tender | opens Stadt Ellerbach (Go 100) and taps the turnover line | the sheet: ● Meets, 96% AI confidence, the original German sentence with the decisive phrase underlined, its translation, "Vergabeunterlagen, p. 23, §4.2", and the two answers |
| <img src="docs/demo/step-4-hohenau-needs-your-check.png" width="180" alt="Needs your check sheet"> | 4 · The No-go tender | opens Landkreis Hohenau (No-go 25) and taps the unclear line | ■ Fails on ISO 27001 above ◆ Needs your check at 58%; the sheet says "Only you can answer" and offers We don't meet it / We meet it at equal weight |
| <img src="docs/demo/step-5-company-rescore.png" width="180" alt="Company screen with the re-score card"> | 5 · Company | answers "We meet it", then switches ISO 27001 on | the re-score card "Landkreis Hohenau · ■ No-go → ● Go · just now", the counts now 2 Go · 2 Maybe · 2 No-go, and a hint under each lever |
| <img src="docs/demo/step-6-ask-this-tender.png" width="180" alt="Ask this tender with an answer"> | 6 · Ask the tender | opens Hohenau again and asks "Can we subcontract the audit?" | the Competition section (likely bidders, similar past awards), then the answer with its page in plain text, labelled "Simulated AI"; the checklist above now reads 3 of 3 met |
| <img src="docs/demo/step-7-bids.png" width="180" alt="Bids with a skipped tender"> | 7 · Skip and Bids | skips the Dutch libraries tender with "Missing a certificate" | Bids: the Win/loss row, Deciding / Bidding / Submitted, and under Skipped the tender, its reason and Restore |

## 2. Every screen and state

### Onboarding
| <img src="docs/demo/step-1-welcome.png" width="200" alt="Welcome"> | <img src="docs/ui/reading.png" width="200" alt="Reading"> | <img src="docs/ui/check-profile.png" width="200" alt="Check your profile"> |
|---|---|---|
| Welcome `#/welcome/1` | Reading `#/welcome/2`: steps, progress, "Found so far", "Simulated AI" | Check your profile `#/welcome/3`: the drafted profile, Edit / Looks right |

### A tender, in each verdict
| <img src="docs/ui/tender-go.png" width="200" alt="Go tender"> | <img src="docs/ui/tender-maybe.png" width="200" alt="Maybe tender"> | <img src="docs/ui/tender-nogo.png" width="200" alt="No-go tender"> |
|---|---|---|
| ● Go 100: "You meet all 4 requirements." | ▲ Maybe 90: "No knock-outs, but 2 risks: short by 1 reference, mandatory site visit." | ■ No-go 25: "1 knock-out requirement: you don't hold ISO 27001. One more needs your answer." |

| <img src="docs/ui/tender-loading.png" width="200" alt="Tender loading"> | <img src="docs/ui/tender-closed.png" width="200" alt="Closed tender"> | <img src="docs/ui/tender-saved.png" width="200" alt="Saved tender with toast"> |
|---|---|---|
| First open: "Reading 146 pages (German)…", page count, progress, three steps, placeholder bars | Closed (test date `?today=2026-12-23`): "The deadline passed on 4 Dec.", Save disabled with "Closed tenders can't be saved" | Saved: the button becomes "In Bids · Deciding" and the toast "Saved to Bids · View" |

| <img src="docs/ui/tender-competition.png" width="200" alt="Competition section of a tender"> |
|---|
| Competition (since 5 Nov, labelled "Simulated AI"): on a No-go tender "Qualify first", then the likely bidders and similar past awards. A rough estimate from past awards with plain rules; it never changes the score |

### Feed states
| <img src="docs/demo/step-2-feed.png" width="200" alt="Feed"> | <img src="docs/ui/feed-closed.png" width="200" alt="Feed with closed tenders"> | <img src="docs/ui/feed-offline.png" width="200" alt="Feed offline"> |
|---|---|---|
| The morning feed | Every deadline passed (`?today=2026-12-23`): "No open tenders", score tiles at 0, "Closed" | Offline (`?offline=1`): "Offline. Showing last night's results." under the pages line |

### Sheets, Bids, Company
| <img src="docs/ui/skip-sheet.png" width="200" alt="Skip sheet"> | <img src="docs/ui/bids-stages.png" width="200" alt="Bids with a tender in Bidding"> | <img src="docs/ui/bids-empty.png" width="200" alt="Empty Bids"> | <img src="docs/ui/company-iso-alone.png" width="200" alt="Company with ISO 27001 alone"> |
|---|---|---|---|
| Skip sheet `#/t/:id/skip`: six optional reasons, Cancel / Skip tender | Bids: the "Win/loss insights" row, a tender in Bidding, the stage tabs, Skipped with its reason and Restore | Empty Bids: the Win/loss row, "No bids yet", "Open Feed" | ISO 27001 alone (no answer yet): the honest "No-go → Maybe", and the hint "Landkreis Hohenau moved up to Maybe" |

### Win/loss insights (a page of Bids, since 5 Nov)
| <img src="docs/ui/insights.png" width="200" alt="Win/loss insights"> | <img src="docs/ui/insights-full.png" width="200" alt="Win/loss insights, the whole page"> | <img src="docs/ui/light-insights.png" width="200" alt="Win/loss insights, light"> |
|---|---|---|
| `#/insights`, from the row at the top of Bids: win rate, value won, bids lost, % above the winner when lost on price; win rate by area with one bar each | The whole page: "Why you lost" leads with the computed sentence, then the reasons with their counts; the honesty line at the end | Light scheme |

### Profile, Settings, the morning notification and errors
| <img src="docs/ui/profile.png" width="200" alt="Profile tab"> | <img src="docs/ui/about.png" width="200" alt="Settings tab"> | <img src="docs/ui/morning-notification.png" width="200" alt="Simulated morning notification"> | <img src="docs/ui/not-found.png" width="200" alt="Page not found"> |
|---|---|---|---|
| Profile `#/profile` (the fourth tab since 5 Nov): the firm read only, "Edit on Company". Profile shows the firm; Company changes it | Settings `#/settings` (also `#/about`, the fifth tab): Appearance, Morning notification, Demo (Reset demo, Copy test-session log), and the four "About this prototype" statements further down | The simulated morning notification (`?demo=morning`, or Settings → "Show this morning's notification"): 7:00, the day's ● Go / ▲ Maybe / ■ No-go counts | Any unknown route: "Page not found", "Open Feed" |

### Light scheme (◐ in the header, or Settings → Appearance)
| <img src="docs/ui/light-feed.png" width="160" alt="Feed, light"> | <img src="docs/ui/light-tender-nogo.png" width="160" alt="No-go tender, light"> | <img src="docs/ui/light-sheet-check.png" width="160" alt="Needs your check sheet, light"> | <img src="docs/ui/light-company-rescore.png" width="160" alt="Company re-score, light"> | <img src="docs/ui/light-bids.png" width="160" alt="Bids, light"> |
|---|---|---|---|---|
| Feed | No-go tender | Needs your check | Company after the flip | Bids |

| <img src="docs/ui/light-profile.png" width="160" alt="Profile, light"> | <img src="docs/ui/light-settings.png" width="160" alt="Settings, light"> |
|---|---|
| Profile | Settings |

## 3. Visual system

Values from [`shared/tokens.json`](shared/tokens.json) (version 2026-11-04). The JSON is the source: if they ever differ, it wins, and this section is out of date.

**Colour: nine per scheme, nothing else.** Text on a brand or verdict fill is always the background colour; status text is the verdict colour on the background or a surface.

| Role | Light | Dark | Used for |
|---|---|---|---|
| bg | `#EEF3F8` | `#02040A` | the ground of every screen; text on fills |
| surface | `#FFFFFF` | `#0B111C` | cards, sheets, fields, rows |
| ink | `#0E1B2B` | `#FFFFFF` | titles and body text |
| muted | `#5A6474` | `#8A93A3` | meta text, captions, secondary button fill |
| brand | `#0862AC` | `#5DB8F5` | primary button, active tab, switches on, links, "Check →" |
| go | `#13724B` | `#5ED69C` | ● Go, ● Meets |
| maybe | `#8A5300` | `#F7C25E` | ▲ Maybe, ▲ Risk |
| nogo | `#B23720` | `#FF8B80` | ■ No-go, ■ Fails, Reset demo |
| check | `#4B31C2` | `#B3A5FF` | ◆ Needs your check |

Every pair in use passes WCAG AA in both schemes (`node shared/check-contrast.js`).

**Verdicts are never colour alone:** ● Go (circle), ▲ Maybe (triangle), ■ No-go (square), ◆ Needs your check (diamond), each next to its word.

**Type:** one typeface, Hanken Grotesk (400–800, self-hosted), tabular figures for every number, letter-spacing 0, no uppercase, no italics.

| Use | Size / line height | Weight |
|---|---|---|
| Score on a tender | 72 px | 800 |
| Screen title | 30 / 34 px | 800 |
| Tender title | 24 / 30 px | 800 |
| Section title | 20 / 26 px | 700 |
| Wordmark | 19 px | 800 |
| Card title, button | 16 / 21 px, 16 px | 700 |
| Body | 15 / 22 px | 500 |
| Meta, label | 13 / 18 px, 13 / 16 px | 500, 600 |

**Shape and depth:** one 8 px radius for everything with a corner (cards, buttons, fields, score tiles, the sheet's top edge); switches and the small verdict circle are the only round things. Flat: no borders, shadows, gradients, glows, grain or transparency, except the sheet's scrim. `node tests/declutter-scan.js` checks this on every screen.

**Icons:** Material Symbols Rounded, a 38-glyph subset: the tab bar (icon with its label), the header buttons ‹, ◐ and ⓘ, the stepper's − and +, and the arrow in "Check →". Every other icon that repeated a word next to it was removed in the declutter.

**Photos:** in their own block, never under text (Welcome, the tender).

**Motion:** entrances 600 ms; the card → tender morph and the switch → re-score card morph 700 ms; pops 480 ms; sheets 320 ms; toasts 240 ms; the re-score counts 650 ms; the "777 pages" count-up 2.8 s; the word-by-word reveal on the Feed title and "In short". All of it is off under reduced motion, with the same results.

**Light and dark:** dark by default; ◐ in the header switches in one tap; About → Appearance adds "System".

## 4. Components, as they look

Sizes and where each control is used: [`SKELETON.md`](SKELETON.md) §5.

- **Tender card:** a surface block; the score tile on the left filled in the verdict colour with the score in the background colour; then the status (shape + word), the title, and "buyer · value · days left" in muted text; a plain "Saved" when saved.
- **Status line:** shape + word in the verdict colour, then "· kind" in muted text ("■ Fails · Knock-out").
- **Requirement line:** status line, the requirement, our check (or "58% sure. Only you can answer."), the citation in plain text, and "Check →" in brand colour on unclear lines.
- **Quote block:** "Original (German) · document, page, section", the sentence with the decisive phrase underlined and bold in the status colour, then "Translation".
- **Buttons:** primary = brand fill with background-coloured text; secondary = muted fill with background-coloured text; disabled = surface fill with muted text; text buttons in brand colour, underlined where they are links.
- **Text tabs:** filters, Bids stages, Appearance; the selected one is underlined in brand colour.
- **Switch:** brand when on; **stepper** and **money field:** background-coloured boxes on the surface.
- **Sheet:** a surface panel from the bottom over a scrim, the parent screen still visible.
- **Toast:** ink fill with background-coloured text and one underlined action.

## 5. How the UI got here

| Date | Pass | What changed | Pictures |
|---|---|---|---|
| 2 Nov | "Bold" restyle | [`DESIGN.md`](DESIGN.md): colour blocks, pills, big verdict tiles | — |
| 3 Nov | Handoff v2 and the vibe pass | [`design/HANDOFF_V2.md`](design/HANDOFF_V2.md), [`design/MOTION.md`](design/MOTION.md): photography, Sky and Harbor palettes, then the website's dark, glassy look | [before / after](docs/vibe/before-after-feed-detail.png), [contact sheet](docs/vibe/contact-sheet.png) |
| 4 Nov | Declutter | nine colours, one radius, plain-text statuses, a full-width tab bar, no pills, borders, shadows or gradients (`CLAUDE.md` §11 items 53–68) | [Welcome](docs/declutter/before-after-welcome.png), [Feed](docs/declutter/before-after-feed.png), [Tender](docs/declutter/before-after-detail.png), [Company](docs/declutter/before-after-company.png) |
| 4 Nov, evening | Appearance and buttons | ◐ in the header, solid secondary buttons, equal-width answers (items 84–86) | the screenshots above |

<img src="docs/declutter/before-after-feed.png" width="720" alt="The Feed before and after the declutter">

## 6. Keeping the screenshots current

- The storyboard frames come from `node tests/demo-record.js` (it rewrites `docs/demo/`).
- Most other frames are copies of what `node tests/smoke.js <folder>` writes (`<scheme>-NN-<name>.png`): `docs/ui/reading.png` ← `dark-02-reading`, `check-profile` ← `dark-03-check-profile`, `tender-loading` ← `dark-05-detail-loading`, `tender-go` ← `dark-06-detail-go`, `tender-nogo` ← `dark-08-detail-nogo`, `skip-sheet` ← `dark-15-skip-sheet`, `tender-saved` ← `dark-17-saved`, `tender-maybe` ← `dark-24-detail-maybe`, `tender-closed` ← `dark-25-detail-closed`, `feed-closed` ← `dark-26-feed-closed`, `feed-offline` ← `dark-27-feed-offline`, `not-found` ← `dark-28-not-found`, `bids-empty` ← `dark-29-bids-empty`, `company-iso-alone` ← `dark-30-company-iso-alone`, `morning-notification` ← `dark-31-morning-notification`; `light-feed` ← `light-04-feed`, `light-tender-nogo` ← `light-08-detail-nogo`, `light-sheet-check` ← `light-10-sheet-check`.
- The smoke path leaves a toast on Bids, Win/loss, Profile, Settings, the Company flip and the Competition frame, so those eleven come from `node tests/ui-frames.js` (6 Nov; it rewrites them in `docs/ui/`): a fresh page per frame at 390 × 844 (2×) with `?demo=fast&theme=<scheme>`, `tenderscout.v2` seeded before load (onboarded, plus the state the frame needs: Stadt Ellerbach in Bidding and the Dutch libraries skipped with "Missing a certificate" for Bids; the answer on Hohenau's unclear line for the Company flip, then a tap on ISO 27001), and the shot taken once any toast is gone: `bids-stages`, `light-bids`, `insights`, `insights-full` (full page), `light-insights`, `profile`, `light-profile`, `about` (the Settings tab), `light-settings`, `light-company-rescore`, `tender-competition` (Hohenau, scrolled to Competition).
- A change that alters how a screen looks updates its screenshot and its wireframe in [`SKELETON.md`](SKELETON.md) in the same commit.
