# TenderScout skeleton

The skeleton plane of Garrett's *Elements of User Experience*: where things sit on each screen, how you move between screens, and how the information is ordered. It describes `main` as of 6 Nov 2026, screen by screen, from the render functions in `app.js`: five tabs (Feed, Bids, Company, Profile, Settings), the Competition section on a tender, Win/loss insights, the morning notification and the error fallback. `node tests/docs-check.js` fails when a route `parse()` accepts is missing here or a `[tab bar]` line does not list the tabs of `TABS` in order. The values in the wireframes are the fictional demo data ([`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional)).

| This file covers | Not in this file (look here instead) |
|---|---|
| The frame every screen shares, one text wireframe per screen (top to bottom), the navigation elements, the ordering rules for information, the controls | What each screen gives the owner and why: [`PRODUCT.md`](PRODUCT.md) §3 · routes, flows, states and Back behaviour: [`docs/NAVIGATION.md`](docs/NAVIGATION.md) · the exact words and where they come from: [`docs/design/CONTENT_REQUIREMENTS.md`](docs/design/CONTENT_REQUIREMENTS.md) · how each screen looks (screenshots) and the visual system: [`UI_DESIGN.md`](UI_DESIGN.md) · how the code is built: [`ARCHITECTURE.md`](ARCHITECTURE.md) · all five planes: [`docs/design/UX_PLANES.md`](docs/design/UX_PLANES.md) |

## 1. The frame every screen shares

- **Width:** designed at 390 px; content stops at 480 px on wider screens.
- **Top:** a 56 px header row. On Welcome, Feed, Bids, Company and Profile it holds the wordmark on the left and two 44 px buttons on the right: ◐ (light / dark) and ⓘ (opens Settings). On Settings it holds the wordmark only (◐ and ⓘ would point at the screen itself); before onboarding Settings holds ‹ (Back). On Check your profile, a tender, Win/loss insights and Not found it holds ‹ (Back), followed by "Simulated AI" where the screen shows AI output; the Reading screen shows only "Simulated AI". The error screen holds the wordmark only.
- **Bottom, one of two bars, both fixed and above the iPhone home bar:**
  - the **tab bar** (60 px, full width, Feed · Bids · Company · Profile · Settings, icon + label, the active tab in brand colour) on those five screens and on Win/loss insights (with Bids active), after onboarding;
  - the **action bar** (52 px buttons; one primary action, on the right and twice as wide as the secondary one) on Check your profile, the tender, and Company before onboarding.
- **Sheets** rise from the bottom over a scrim; their buttons sit in the sheet's own footer, in the same thumb zone.
- **Toast:** a 52 px strip at the bottom with one 44 px action (Undo or View). It belongs to the screen that raised it and goes at once when you leave that screen or open a sheet over it (Skip's toast belongs to the Feed, where Skip lands), so it never covers a control on the next screen and its Undo never acts behind a sheet.
- **Overlay:** the morning notification covers the whole app, bars included, once a day; it has no route and no bar of its own, only its ✕.
- Every tap target is 44 px or more, and every verdict is a shape and a word.

## 2. Wireframes

Legend: `[zone]` names a block; `(…)` is a condition; `*` marks the active tab; `| A | B |` is a bar of buttons, primary last.

### Welcome · `#/welcome/1`
```
[header]    TenderScout .......................... ◐  ⓘ
[photo]     its own block, no text on it
[title]     Find public tenders you can actually win
[sub]       New EU tenders, read overnight in any language. Each answer cites its page.
[line]      All 45 EU sectors · 6 new tenders tonight
[form]      Company website
            [ nordlicht-netzwerk.example                ]
            [            Draft my profile               ]   primary, full width
[caption]   Prototype · all companies and tenders are fictional
```
No tab bar. The only typing in the core flow.

### Reading · `#/welcome/2` (transient, replaced in history)
```
[header]    .................................. Simulated AI
[title]     Reading your site, references and certificates…
[progress]  ██████░░░░
[steps]     Reading nordlicht-netzwerk.example ........ 18 pages   (done)
            Finding public contracts you delivered .... 4 found    (done)
            Checking certificates                                  (in progress)
            Drafting your profile                                  (waiting)
[found]     Found so far: Leipzig · 24 staff / 4 comparable references / …
[caption]   About 20 seconds
```

### Check your profile · `#/welcome/3`
```
[header]    ‹ ..................................... Simulated AI
[title]     Check your profile
[sub]       Drafted from nordlicht-netzwerk.example. Fix anything that's off.
[card]      Nordlicht Netzwerk GmbH (fictional) · Leipzig, DE
            24 Staff | €3.2M Turnover | 4 References
            Sectors · Certificates · Bid languages · Countries
            Sources: …, 18 pages, 4 award notices (fictional)
[action]    | Edit | Looks right |                          Edit → Company
```

### Feed · `#/feed`
```
[header]    TenderScout .......................... ◐  ⓘ
[title]     6 new tenders                                   word-by-word reveal
[line]      Thu 5 Nov · read 777 pages in 4 languages · Simulated AI
[note]      (offline only) Offline. Showing last night's results.
[filters]   All 6 | ● Go 1 | ▲ Maybe 2 | ■ No-go 3          text tabs = counts
[card]      [100]  ● Go
                   Structured cabling and Wi-Fi for 12 primary schools
                   Stadt Ellerbach · €480k · 29 d     (Saved)
[card]      … one per open tender, ranked Go → Maybe → No-go
[note]      (after a skip) 1 tender skipped · see in Bids
[caption]   All companies and tenders are fictional
[tab bar]   Feed* | Bids | Company | Profile | Settings
```
The whole card is the link. Empty states replace the cards: "Nothing new tonight" with "Widen your profile", or "No Go tenders tonight." with "Show all".

### Tender · `#/t/:id`
```
[header]    ‹ ..................................... Simulated AI
[verdict]   ■ No-go
[score]     25 /100
[headline]  1 knock-out requirement: you don't hold ISO 27001. One more needs your answer.
[title]     IT security audit and hardening for district administration
[original]  IT-Sicherheitsaudit und Härtung der Kreisverwaltung    in its own language
[meta]      Landkreis Hohenau · Germany   (· skipped)
[facts]     Value €95k | Deadline 27 Nov · 22 days left
[section]   Can you qualify? ............................ 1 of 3 met      the first line on screen without a scroll at 390 × 844
[line]      ■ Fails · Knock-out
            ISO 27001 information security
            Missing ISO 27001 (mandatory)
            Vergabeunterlagen, p. 12, §3.1                  the citation in brand text (muted under "Check →" and on a Closed tender)
[line]      ◆ Needs your check · Unclear wording
            Staff with "comparable qualification"
            58% sure. Only you can answer.
            Vergabeunterlagen, p. 14, §3.4
            Check →                                         44 px
[line]      ● Meets · References …                          order: Fails → Needs your check → Risk → Meets
[section]   In short ................................. Simulated AI
            Audit 400 workstations and 30 servers …
[section]   (if it has questions) Ask this tender ........ Simulated AI
            Can we subcontract the audit?  ›                opens the answer and its page
[section]   Competition .............................. Simulated AI     (not on a Closed tender)
[chance]    Qualify first                                   on a Go or Maybe: "Fair chance · About 1 in 5" (Kaltbrunn)
            You miss a knock-out above, so a bid would be excluded before price or quality count.
            Rough estimate from past awards with plain rules, not AI. It does not change the score.
[label]     Likely bidders
[row]       Prüfwerk IT-Sicherheit
            Won 2 of the last 3 · 12 references
[row]       Kernschutz Consulting
            Won 1 of the last 3 · 6 references
[label]     Similar past awards
[row]       Security audit, county IT
            Landkreis Hohenau, 2024 · won by Prüfwerk IT-Sicherheit · 7 bidders · €80k
[row]       … one row per past award (three for Hohenau)
[photo]     (if the tender has one, not when closed) its own block
[caption]   All companies and tenders are fictional
[action]    | Skip | Save to Bids |
```
Bar variants: saved → `| Skip | In Bids · Deciding |`; skipped → `| Restore | Save to Bids |`; closed → the note "Closed tenders can't be saved" above `| Skip | Save to Bids (disabled) |`. A Closed tender's header says "Closed" once, in place of the verdict and the score, and its checklist is a record: no "Check →" and muted citations.

First open per session: the verdict block is replaced by "Reading 64 pages (German)…", "p. N of 64", a progress bar and three steps, and the body by placeholder bars; the action bar is already there.
Competition (5 Nov): the bidders and past awards stand for a simulated AI reading of past award notices (fictional, `data.js` `COMPETITION`), so the section heading carries "Simulated AI". The chance line is plain rules in `app.js` (`chanceToWin`): one over the average number of bidders on the similar awards, lower when one rival won two or more of them, higher or lower by the firm's references against the strongest rival's. It reads Good, Fair or Low chance with "About 1 in N", says "Qualify first" on a No-go, and adds "Only once you clear the open points above." on a Maybe. It never changes the score or the verdict.

### Requirement sheet · `#/t/:id/req/:rid`
```
[scrim]     the tender stays visible behind it
[top]       ◆ Needs your check · Simulated AI ........ 58% AI confidence
[title]     Staff with "comparable qualification"
[callout]   Wording is vague: … Only you can answer.
[quote]     Original (German) · Vergabeunterlagen, p. 14, §3.4
            Das eingesetzte Personal verfügt über eine vergleichbare Qualifikation.   decisive phrase marked
[translation] The deployed staff hold a comparable qualification.
[foot]      (once answered) You answered: We meet it · Undo
            | We don't meet it | We meet it |              equal width until answered
```

### Skip sheet · `#/t/:id/skip`
```
[scrim]
[title]     Why skip this one?
[sub]       Public Wi-Fi for 9 libraries · Gemeente Vlietdam
[options]   Too big for us | Missing a certificate | Wrong region
            Not enough time | Price-only | Other          any number, or none
[note]      Reasons tune tomorrow's feed. Skipping without one is fine.
[foot]      | Cancel | Skip tender |
```

### Bids · `#/bids`
```
[header]    TenderScout .......................... ◐  ⓘ
[title]     Bids
[sub]       1 saved · next deadline in 29 days
[row]       Win/loss insights                                  →
            8 of 21 won · 38% in the last 12 months          opens #/insights
[section]   Deciding 1
[card]      [100]  ● Go
                   Structured cabling and Wi-Fi for 12 primary schools
                   Stadt Ellerbach · 29 d
                   Deciding* | Bidding | Submitted         stage tabs
[section]   Bidding 0 · Nothing here yet
[section]   Submitted 0 · Nothing here yet
[section]   Skipped 1
[row]       Public Wi-Fi for 9 libraries
            Gemeente Vlietdam · Missing a certificate        | Restore |
[caption]   All companies and tenders are fictional
[tab bar]   Feed | Bids* | Company | Profile | Settings
```
With nothing saved or skipped: the Win/loss row, then "No bids yet" and "Open Feed".

### Win/loss insights · `#/insights` (a page of Bids)
```
[header]    ‹
[title]     Win/loss insights
[sub]       21 bids submitted in the last 12 months
[tiles]     38%  Win rate · 8 of 21 won    | €2.3M  Contract value won
            13   Bids lost                 | 6.8%   Above the winner when you lost on price
[section]   Win rate by area ................... won of submitted
[row]       Telecom equipment ........... 2 of 4 won · 50%   [bar]
            IT services ................. 3 of 7 won · 43%   [bar]
            Installation ................ 2 of 6 won · 33%   [bar]
            Construction work ........... 1 of 4 won · 25%   [bar]
[section]   Why you lost ............................ 13 bids
[note]      You lose most often on price: 6 of 13 lost bids, on average 6.8% above the winner.
[row]       Price · 6.8% above the winner on average ............. 6
            Quality score on the concept · You were the cheaper bid in 3 of 4 ... 4
            Missing a reference · The buyer asked for a reference you did not have ... 2
            No feedback yet · Add the buyer’s feedback when it arrives ... 1
[caption]   In the full product the results come from the EU’s award notices and the reasons from your own
            debrief notes. The numbers are plain arithmetic, not AI. All past bids, buyers and prices are fictional.
[tab bar]   Feed | Bids* | Company | Profile | Settings
```
Numbers from `insights.js` on `DEMO.PAST_BIDS` (fictional). Without past bids: "No results yet".

### Company · `#/company`
```
[header]    TenderScout .......................... ◐  ⓘ
[title]     Company
[sub]       Nordlicht Netzwerk GmbH (fictional) · Leipzig, DE
[counts]    Your feed right now: ● 1 Go · ▲ 2 Maybe · ■ 3 No-go
[re-score]  Change anything below / Every tender re-scores at once.
            → after a change: Landkreis Hohenau ........... 25 → 100   (the new score in the new verdict's colour, counting up)
                              ■ No-go → ● Go · just now
[section]   Size
[row]       Turnover (last full year, € millions) ........ [ € 3.2 M ]
[row]       References (comparable, last 3 years) ........ [ − 4 + ]
            hint: +1 reference → Stadtwerke Kaltbrunn becomes ● Go      (muted text; the verdict as shape + word)
[section]   Certificates
[row]       ISO 9001 ............................................ (on)
[row]       ISO 27001 ........................................... (off)
            hint: Turn on → Landkreis Hohenau becomes ▲ Maybe
[row]       VCA · ISO 14001 ...................................... (off)
[section]   Bid languages
[row]       German · English (on) · Spanish · French · Dutch (off), one row each
            hint under Spanish: Turn on → Universidad de Valdemora becomes ● Go   (each language its own hint)
[section]   Where you bid
[row]       Bid outside Germany and Austria ..................... (on)
[caption]   Re-scoring is plain rules, not AI. All companies and tenders are fictional.
[tab bar]   Feed | Bids | Company* | Profile | Settings        (before onboarding: | Save and see my feed |)
```

### Profile · `#/profile` (tab since 5 Nov)
```
[header]    TenderScout .......................... ◐  ⓘ
[title]     Profile
[sub]       What TenderScout checks every tender against.
[card]      Nordlicht Netzwerk GmbH (fictional) · Leipzig, DE
            24 Staff | €3.2M Turnover | 4 References
            Sectors ........ Network cabling, Wi-Fi installation, IT support
            Certificates ... ISO 9001
            Bid languages .. German, English
            Countries ...... Germany, Austria, cross-border
[action]    Edit on Company                                  secondary, full width → #/company
[tab bar]   Feed | Bids | Company | Profile* | Settings
```
Read only: Profile shows the firm, Company changes it. The card is the one on Check your profile without the sources line. Before onboarding `#/profile` redirects to Welcome.

### Settings · `#/settings` (also `#/about`)
```
[header]    TenderScout                                      (before onboarding: ‹)
[title]     Settings
[section]   Appearance
            Light or dark: System | Light | Dark             text tabs
[section]   Morning notification
[text]      Once a day, after the overnight read, TenderScout tells you how many new tenders you qualify for.
            In this prototype it is shown inside the app, not sent to your phone.
[action]    Show this morning’s notification                 secondary, full width → the lock screen
[section]   Demo
[action]    Reset demo                                       full width, red text, asks to confirm
[caption]   Clears your profile, answers, saved and skipped tenders.
[group]     For a moderated test on this phone. Not analytics: nothing is sent, and Reset demo clears it.
[action]    Copy test-session log                            secondary, full width → toast "Copied · N decisions on this phone"
[text]      (only after a copy that failed) the log as selectable text, inside the same group
[section]   About this prototype
[intro]     A university prototype (ESCP Digital Product Design, 2026).
[rows]      AI output is simulated (Simulated AI)
            The decision logic is real code
            All data is fictional
            Built with AI assistance
[tab bar]   Feed | Bids | Company | Profile | Settings*            (before onboarding: none)
```
Not found (any other route): ‹, "Page not found", one sentence, "Open Feed".
Error fallback (any uncaught error, no route): the wordmark, "Something went wrong", "Your profile, answers and saved tenders are kept." and one primary button, "Restart". No tab bar.

### Morning notification (overlay, no route, once a day)
```
[lock screen] covers the whole app, bars included; what is behind it cannot be reached
[top]       Simulated notification ................................ ✕
[clock]     Thursday 5 November
            7:00                                             large
[card]      [radar]  TenderScout ............................. now
                     ● 1 Go   ▲ 2 Maybe   ■ 3 No-go           the whole card is one button → Feed, filter All
[caption]   Tap the notification to open your Feed · all tenders are fictional
```
The counts come from the engine with skipped tenders left out. ✕, Escape or a tap on the empty lock screen close it; a tap on the clock or the caption does not. Settings → "Show this morning’s notification" and `?demo=morning` replay it.

## 3. Navigation design

| Element | Where | Goes to |
|---|---|---|
| Tab bar: Feed · Bids · Company · Profile · Settings | Feed, Bids, Company, Profile, Settings, Win/loss insights (Bids active) | the five top-level screens (hidden during onboarding, on a tender, on Not found and on the error screen) |
| ⓘ | header of Welcome, Feed, Bids, Company, Profile | Settings |
| ◐ | same headers | switches light ↔ dark in place |
| ‹ Back | Check your profile, tender, Win/loss insights, Settings before onboarding, Not found | the screen you came from (the Feed after a deep link; Bids from Win/loss insights, also after a deep link) |
| A tender card | Feed, Bids | the tender |
| A requirement line, "Check →" | tender | the requirement sheet |
| Skip | tender's action bar | the skip sheet |
| "View" in the "Saved to Bids" toast, "see in Bids", "In Bids · Deciding" | toast, Feed note, tender | Bids |
| "Edit" | Check your profile | Company |
| "Win/loss insights" row | top of Bids | Win/loss insights |
| "Edit on Company" | Profile | Company |
| The notification card | morning notification | the Feed, filter All |
| ✕ | morning notification | closes it, back where you were |
| "Show this morning’s notification" | Settings | the morning notification |
| Restart | error screen | the Feed (Welcome before onboarding), reloaded |

How Back, Escape and the scrim close sheets, deep links and focus after a screen change: [`docs/NAVIGATION.md`](docs/NAVIGATION.md#deep-linking-and-back-behaviour).

## 4. Information design: the ordering rules

1. **Verdict first.** On a card the score tile leads and the verdict word tops the text; on a tender the verdict, the score and one sentence of why come before the title.
2. **Best first, problems first.** Tenders are ranked Go → Maybe → No-go → Closed; inside a tender the lines run Fails → Needs your check → Risk → Meets, so the reason for a No-go is the first thing you read.
3. **One reason, one place.** The card stays short (verdict, title, buyer, value, days left); the reason sentence lives on the tender.
4. **Proof one tap away.** Every line carries its citation; the sheet puts the original sentence above its translation, with the decisive phrase marked.
5. **The label sits next to what it labels.** "Simulated AI" is placed beside the AI content (the pages line, In short, Competition, Ask this tender, the sheet's top line), not in a footer; "not AI" sits beside what plain rules compute (the chance to win, Win/loss insights, the re-score caption on Company).
6. **Two facts only.** Value and deadline; a deadline 10 days away or less is marked.
7. **Counts are the filters.** "All 6 · ● Go 1 · ▲ Maybe 2 · ■ No-go 3" both summarises the feed and filters it.

## 5. Interface design: the controls

| Control | Size | Used for |
|---|---|---|
| Primary button | 52 px, brand fill | Draft my profile, Looks right, Save to Bids, We meet it (once answered), Skip tender, Open Feed, Restart |
| Secondary button | 52 px (Restore 44 px), muted fill | Skip, Edit, Cancel, Restore, In Bids · …, We don't meet it (once answered), Edit on Company, Show this morning’s notification |
| Answer pair | 52 px, check fill, equal width | We meet it / We don't meet it while a ◆ line is unresolved: the owner's decision, so neither looks preselected or disabled |
| Icon button | 44 × 44 | ‹, ◐, ⓘ, ✕ on the morning notification |
| Text button | 44 px tall | Undo, Show all, Check →, see in Bids, toast actions |
| Text tabs (radio group) | 44 px tall | Feed filters, Bids stages, Appearance |
| Toggle buttons (pressed / not) | 44 px tall | skip reasons |
| Switch (`role="switch"`) | 50 × 30 in a 60 px row | certificates, bid languages, bidding abroad |
| Stepper | 44 px buttons | references |
| Money field | 44 px | turnover |
| Text field | 52 px | company website |
| Notification card | full width, 76 px or more, one button | the morning notification |
| Row link | 60 px or more, full width | Win/loss insights on Bids |
