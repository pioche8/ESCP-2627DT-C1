# Navigation map and user flows

Context of use: an owner on a phone, between jobs, often in a van or on site. **One hand, short sessions (1–3 min), patchy signal.** So: a floating dock within thumb reach, one primary action per screen in a bottom bar, every verdict readable in under 3 seconds (shape + label + colour), and no typing in the core loop.

> Updated 2 Nov 2026 for the DESIGN.md "Bold" restyle, and 3 Nov 2026 for the design handoff v2 (`design/HANDOFF_V2.md`: Sky and Harbor palettes, photography, Welcome v2, entrances). Routes and deep links are unchanged; what changed is marked **(new)** or **(v2)**.

## Structure
Three tabs, three questions the owner asks:
| Tab | Question | Route |
|---|---|---|
| **Feed** | "Anything worth bidding on today?" | `#/feed` |
| **Bids** | "What am I working on, what did I skip?" | `#/bids` |
| **Company** | "What do you think we can do?" | `#/company` |

The tabs live in a floating dock. **The dock is hidden during onboarding, on a tender detail and on About (new)**, so those screens keep their bottom action bar in the thumb zone. About (AI disclosure, appearance and demo reset) opens from the ⓘ in the Feed, Bids and Company headers and on Welcome.

```mermaid
flowchart TD
  W1["#/welcome/1<br/>Website input"] --> W2["#/welcome/2<br/>AI reads site (simulated)"] --> W3["#/welcome/3<br/>Check profile"]
  W3 -- "Looks right" --> F
  W3 -- "Edit" --> C
  subgraph Tabs
    F["#/feed<br/>Feed: Go / Maybe / No-go"]
    B["#/bids<br/>Deciding / Bidding / Submitted + Skipped"]
    C["#/company<br/>Profile levers + re-score card"]
  end
  F --> D["#/t/:id<br/>Tender detail: verdict, summary, qualification check, Ask"]
  D --> RS(["#/t/:id/req/:rid<br/>Sheet: original + translation + page + confirm"])
  D --> SK(["#/t/:id/skip<br/>Sheet: skip reasons (optional)"])
  D -- "Save to Bids" --> B
  SK -- "Skip tender" --> F
  B --> D
  B -- "Restore → Deciding" --> B
  ANY["ⓘ"] --> A["#/about"]
```

## Screen list
| # | Route | Screen | Primary action | Notes |
|---|---|---|---|---|
| S1 | `#/welcome/1` | Welcome + website | Draft my profile | **(v2)** Photo header with the moving band of all 45 EU sectors (the firm's four in bold, frozen under reduced motion), the pill "All 45 EU sectors · 6 new tenders tonight", and a preview card of tonight's top verdict computed by the engine. Only typed input in the core flow is here |
| S2 | `#/welcome/2` | Reading (transient) | none | Step list and progress bar **(new)**; replaced in history, not a back target |
| S3 | `#/welcome/3` | Check profile | Looks right | "Edit" goes to S6 |
| S4 | `#/feed` | Feed | Open a tender | Summary tiles (tap = filter) and filter All/Go/Maybe/No-go with counts; skipped hidden; saved = bookmark on the card. **(v2)** Cards carry a 96 px photo band with the score tile overlapping it; tenders without a photo show a document placeholder. Tapping a card morphs it into the detail header where the browser supports view transitions |
| S5 | `#/t/:id` | Tender detail | Save to Bids | First open per session shows "Reading N pages (lang)…" with progress **(new)**. **(v2)** The verdict header multiplies the tender photo (grayscale) over the verdict colour. Requirements sorted fail → check → risk → met |
| S5a | `#/t/:id/req/:rid` | Requirement sheet | We meet it / We don't meet it | Own history entry. Shows status, AI confidence, quote card with the decisive phrase marked, translation |
| S5b | `#/t/:id/skip` | Skip sheet | Skip tender | Pick any number of reasons, or none **(new)**. Feeds tomorrow's ranking (future) |
| S6 | `#/company` | Company profile | (live) | Re-score card "Landkreis Hohenau · No-go → Go" and unlock hints such as "Turn on → Gemeente Vlietdam becomes Maybe" **(new)**. **(v2)** Photo behind the top of the header |
| S7 | `#/bids` | Bids pipeline | Change stage | Empty groups show "Nothing here yet". **Restore moves a skipped tender to Deciding (new)**. **(v2)** 48 px photo thumbnail on each bid card |
| S8 | `#/about` | About / AI disclosure | Reset demo | Reset asks to confirm **(new)**. Appearance: System / Light / Dark **(new)** and Palette: Sky / Harbor **(v2)**, both persisted. `?demo=reset` does the same reset |
| – | anything else | Not found | Open Feed | |

**Later (not in prototype):** push notification each morning → deep link `#/t/:id`; consortium-partner finder; calendar export of deadlines and site visits; share a verdict to a colleague by WhatsApp; opening the tender PDF at the cited page (today the citation chip opens the requirement sheet).

## Core flows
**Flow 1: Morning triage (target under 60 s)**
Push / open app → Feed (counts at top) → tap the Go card → scan the qualification check (all ● Meets) → Save to Bids. The button turns into "In Bids · Deciding" and a toast offers "View".

**Flow 2: Resolve an unclear line**
Detail → the ◆ "Needs your check" line sorts right after any fails → tap → sheet shows the original sentence, translation and page → "We meet it" → the sheet closes, the verdict recalculates, and a toast says "Answer saved · now …" with Undo.

**Flow 3: Learn what's blocking you**
Detail shows ■ "ISO 27001 mandatory" → Company tab → the hint under ISO 27001 says what turning it on would do → toggle → the re-score card shows "Landkreis Hohenau · No-go → Go" and the tiles re-flex. The hint is honest: if the "comparable qualification" line is still unanswered, it says Hohenau only becomes **Maybe**, and the re-score card shows No-go → Maybe. On the next Feed visit the changed card's score tile pulses once.

**Flow 4: Skip with reasons**
Detail → Skip → pick reasons (optional) → Skip tender → back to the Feed, the card collapses out, and a toast says "Skipped. Reason saved." with Undo. The tender shows under Bids → Skipped with its reasons. Restore puts it in Deciding.

## Deep linking and back behaviour
- Hash routes (`#/…`), because GitHub Pages has no server rewrites. Every screen is linkable.
- Sheets are their own history entries: system Back, Escape, a tap on the scrim, Cancel, or answering all close the sheet to its parent. Closing goes back in history rather than adding a new entry, so Back never reopens a closed sheet.
- ‹ on a detail goes back to the Feed or Bids if you came from there; otherwise (deep link) it opens the Feed.
- Unknown route → "Not found" with a link to the Feed. Before onboarding, any deep link except Welcome, Company and About redirects to Welcome.
- After a screen change, focus moves to the screen title (for screen readers); after a sheet closes, focus returns to what opened it.

## States (DESIGN.md §6)
| State | Where | How to see it in the demo |
|---|---|---|
| Loading tender | Detail, first open per session | Open any tender |
| Closed | Detail and Feed | Test-only URL `?today=2026-12-23` (all deadlines passed). Card dims its score tile and status line; Save is disabled with "Closed tenders can't be saved" |
| Saved | Detail, Feed card, Bids | Save to Bids |
| Skipped | Feed (collapses), Bids → Skipped | Skip a tender |
| Empty feed | Feed | Skip every tender |
| Empty Bids | Bids | Reset the demo, finish onboarding, open Bids |
| Offline | Feed and Detail banner | Turn off the network, or test-only `?offline=1` |

## Edge cases handled
- AI confidence under 70% → shown as ◆ "Needs your check" with the confidence, never counted as a pass, and blocks a Go until you answer it.
- Deadline day or later → "Closed", score 0, Save disabled.
- Storage blocked (private mode) → in-memory state, so the app still works for the session. State key `tenderscout.v2`.
- Dark mode (follows the phone, or About → Appearance) and reduced motion (no animation, same results) respected. Tap targets ≥ 44 px.

## Palettes (3 Nov 2026, website fusion)
About → Appearance offers three palettes: **Brand** (default; the marketing website’s palette on the phone), **Sky** and **Harbor** (design/HANDOFF_V2.md). `?palette=brand|sky|harbor` is the demo deep link; the choice is persisted in `tenderscout.v2`. Routes, screens and back behaviour are unchanged.
