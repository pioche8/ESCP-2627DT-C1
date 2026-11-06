# TenderScout: idea brief and pitch

> Working name, not trademark-checked. Status: **hypothesis**, written before any interview (v0-shell). Facts carry a source; everything else is labelled ASSUMPTION and gets tested in `evidence.md`.

## One line
Every morning TenderScout reads new EU public tenders in any language and tells the owner of a small firm, on their phone, whether they can actually win each one, citing the page that proves it.

## Problem
Public buyers in the EU spend about **€2 trillion a year, roughly 14% of EU GDP**. Over 2011–2021, competition for that money collapsed:
- In 2021, **42% of contracts drew a single bid**, nearly double the 2011 level.
- The **average number of bids fell from about 6 to 3** per procedure.
- Firms say they are losing interest because of **"too much bureaucracy"**. The auditors name administrative burden and restrictive or tailor-made criteria as root causes.
— European Court of Auditors, Special Report 28/2023

For a firm with 5–50 staff, the cost sits **before** the bid. Someone has to open a 50–200 page tender pack, often in another language, to learn on page 23 that the minimum turnover is €5M, or that a certificate they don't hold is mandatory. Most owners skip tenders on gut feel, or spend an evening reading one they were never eligible for.

ASSUMPTION (to test): a typical small firm screens a tender in 1–3 hours, skips most foreign-language tenders unread, and has lost at least one bid on a knock-out it missed.

## User
**Primary: owner or managing director of a 5–50 person firm that sells to the public sector.** Sectors: IT services, network installation, building trades, facility services, engineering, consulting, translation. No bid manager on staff. Decides on the phone, between jobs.
**Secondary:** the one person in a mid-size firm (50–250) who "does the tenders" alongside a day job.
**Not the user:** large firms with bid teams. They already buy Altura, Tendium or Mercell.

## Solution
1. **Morning feed:** tenders matched to the firm's sectors and regions, each with a verdict (**Go / Maybe / No-go**), a fit score and one reason.
2. **Qualification check:** every hard requirement (turnover, references, certificates, bid language, place of delivery, mandatory site visits) is ticked off against the company profile. Each line links to the **original sentence and its translation, with the page number**.
3. **Unsure lines go to a human:** if the AI is under 70% confident ("comparable qualification"), it says so and asks the owner. It never guesses a pass.
4. **Ask the tender:** plain-language questions ("Can we subcontract?", "What's the penalty clause?"), answered with page citations.
5. **Profile as a lever:** add ISO 27001 or a consortium partner, and every verdict updates instantly. This shows which certificate is worth getting.

## Product objectives and success metric
> Every target in this section is an **ASSUMPTION (untested)**. They are the numbers we would test against, not results. The evidence in [`evidence.md`](evidence.md) sets the real thresholds once interviews are logged. Real or fictional, figure by figure: [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional).

**North-star metric: qualification checks completed per firm per week.** A check counts as completed when the owner records a decision on a tender they opened: saved it to Bids, or skipped it (with or without a reason). This tracks the value TenderScout promises, a decision on "can we even bid on this?" backed by the page that proves it. It does not track attention. Opening the app, scrolling the Feed or reading a summary without deciding gives the firm nothing. More completed checks per week means screening got cheaper (H1) and the answer was good enough to act on (H2).
Target: at least 1 per firm per week once the feed runs on real tenders (ASSUMPTION). The only survey answer so far (S1, [`evidence.md` §1b](evidence.md#1b-survey-responses-screening-form-not-interviews), n = 1, not gate evidence), read 3–5 tenders in a whole year. So the weekly rhythm is itself something the interviews must test. The bet is that cheaper checks mean more tenders get checked.

**Supporting metrics**, each tied to something the prototype already does:

| Metric | What it tells us | Where it happens today | Target (ASSUMPTION, untested) |
|---|---|---|---|
| Time from opening the app to a verdict on a Go tender | Whether the 60-second promise holds | Feed → Go card → qualification check → Save to Bids ([`docs/NAVIGATION.md`](docs/NAVIGATION.md#core-flows), flow 1) | Under 60 s (flow 1's own target; never timed with a real user) |
| Share of "Needs your check" lines the owner resolves | Whether owners answer the honest "AI is unsure" line instead of giving up on the tender | Requirement sheet → We meet it / We don't meet it (flow 2) | At least half of the lines shown on tenders the owner opened |
| Share of Go verdicts saved to Bids | Whether owners trust a Go enough to act on it | Tender detail → Save to Bids → Bids → Deciding | At least half |

**How it would be measured.** The prototype records no analytics, and nothing leaves the phone (About says so). In a moderated test, Settings → Demo → **Copy test-session log** copies what happened on that phone since the last reset as text: the checks completed (each tender once), the time from the Feed to the first Go saved (left out when the fast demo setting shortened the waits), the "Needs your check" lines answered of those shown and the Go verdicts saved of those opened, with each event and its time. The app shows no count anywhere else, sends nothing, and Reset demo clears it. Logs from rehearsals are not evidence; only a log from a logged test session goes into `evidence.md`. A real version would need consented, per-firm event logging. That is not built.

**Business objective.** Paying firms that keep their subscription, on the plans in [Business model](#business-model-assumption-not-tested). The north star is the leading indicator for it: a firm that completes checks every week gets the value it pays for, and a firm that stops deciding in the app is the one that cancels. ASSUMPTION: no price has been tested with anyone yet.

## Why AI is necessary (removal test)
Take the language model out and the product is a keyword alert. Those already exist (TED, DTAD and other tender portals, mostly free). The model does three jobs nothing else can do at this cost:
- **Reads unstructured tender packs** (PDF/Word, 50–200 pages) and extracts requirements with page citations and confidence scores.
- **Works across 24 EU languages**, so a Leipzig firm can judge a Dutch or Spanish tender without reading it.
- **Answers follow-up questions** grounded in the document.

The **decision** (knock-out, score, verdict) is deliberately **plain, tested code** (`engine.js`). The AI reads and the rules decide. That keeps every verdict explainable, which matters when a firm decides whether to spend €3–10k of effort on a bid. (ASSUMPTION: bid cost range, to test in interviews.)

## Why now
- **eForms** (mandatory on TED since Oct 2023) made tender notices structured. The documents behind them (tender specifications, Vergabeunterlagen, pliegos) are still long, unstructured files in the buyer's language.
- Long-context LLMs can now read a 200-page pack in seconds for cents (ASSUMPTION: cost per tender; check before the pitch).
- Political pressure: the ECA report (2023) called for more competition and SME access, and the Commission has been evaluating the procurement directives. (TO CHECK: current status of the revision before the pitch.)

## Competition (name them before the lecturer googles them)
| Player | What they do | Who they serve | Our angle |
|---|---|---|---|
| **Altura** (NL), €8M Series A Jun 2025 | AI bid management: search, bid/no-bid insight, AI drafting and agents | Companies with bid teams; expanding to UK | We stop at the decision. No writing suite, mobile, for owners without a bid team |
| **Tendium** (SE) | AI tender search plus "Qualify" bid/no-bid | Nordic firms | Closest competitor. We focus on cross-language reading and DACH/Benelux SMEs |
| **Stotles** (UK) | Public-sector sales intelligence | UK B2G sales teams | Sales-team tool, UK only |
| **Mercell, DTAD, Patterno, Auftrag One** | Tender databases and alerts, some with AI matching | Broad | Discovery, not qualification |

**Concession line for the pitch:** "Tender search is solved, and AI bid writing is funded (Altura raised €8M). What's missing is the 60-second answer for a 20-person firm: *can we even bid on this?*"
Whether that gap is real is the main thing the interviews have to prove (see the gate in `evidence.md`).

## Business model (ASSUMPTION, not tested)
Subscription per company: **€49/month** (1 user, 2 countries) or **€149/month** (team, all EU). Benchmark: one avoided wasted bid at about 20 h × €60 = €1,200 pays for 8 months of the basic plan. Every figure here is an assumption and must be labelled so in the deck.

## Risks
- **Crowded category.** If interviewees already use Tendium, DTAD or a consultant for this, the wedge is dead. Kill test below.
- **AI misreads a knock-out.** Mitigation: page citation on every line, a confidence threshold, a human confirms unclear lines, and the verdict never relies on a low-confidence line.
- **Small firms may not want public work at all** (late payment, price-only awards). Interviews must separate "can't find or qualify" from "don't want to".

## 60-second pitch (script)
> "The EU spends two trillion euros a year on public contracts, and in 2021, 42% of them got exactly one bid. Small firms aren't bidding. Not because they can't do the work, but because finding out whether they *qualify* means reading 150 pages, often in Dutch or Spanish, to find the one line that rules them out.
> TenderScout reads every new tender for you overnight. In the morning you get three answers: Go, Maybe, No-go, each with the exact page that proves it. Unsure? It asks you, it doesn't guess. Add a certificate to your profile and watch tenders flip from No-go to Go.
> Search tools exist and bid-writing tools are funded. We're the 60-second qualification check for the 20-person firm with no bid manager. We spoke to [N] owners: [insert evidence]."

## 75-second demo (on a real phone, after `?demo=reset,fast`)
Open `https://pioche8.github.io/ESCP-2627DT-C1/?demo=reset,fast` (`?demo=fast` alone keeps your state). `fast` shortens the two simulated AI waits (profile draft, tender reading) to about 300 ms so the path fits in 75 seconds; the "Simulated AI" labels and everything else are unchanged.
1. Welcome → "Draft my profile" → reading → "Looks right" (10 s)
2. Feed: "1 Go · 2 Maybe · 3 No-go, read 777 pages in 4 languages" (5 s)
3. Open the **Go** tender → the qualification check → tap a line → original German sentence + translation + page (15 s)
4. Back, open **Landkreis Hohenau (No-go)**: missing ISO 27001 plus an unclear "comparable qualification" (?) line → sheet → "We meet it" (15 s)
5. **Company** tab → toggle ISO 27001 → green banner "Hohenau: No-go → Go" (10 s). *This is the live code, not a mock.*
6. "Ask this tender" → "Can we subcontract?" → answer with page (10 s)
7. Skip the Dutch libraries tender with "Missing a certificate" → Bids (10 s)

## If the phone or the Wi-Fi fails
In this order, whichever works first:
1. **The laptop, no network needed.** Open `index.html` from the repository folder in Chrome or Safari (the app is classic scripts, so it runs from `file://`), or run `python3 -m http.server 8000` in the folder and open `http://localhost:8000/?demo=reset,fast`. Press F12 → the phone icon → 390 × 844 so it looks like the phone. Same 7 steps as above.
2. **The recording.** [`docs/demo/demo-path-390x844.mp4`](docs/demo/demo-path-390x844.mp4) is the 7-step path above, recorded at 390 × 844 (2×, dark, `?demo=reset,fast`), about 2.5 s on each screen, about 50 s in all. Talk over it. One still per step for the slides: [`step-1-welcome.png`](docs/demo/step-1-welcome.png), [`step-2-feed.png`](docs/demo/step-2-feed.png), [`step-3-go-tender-citation.png`](docs/demo/step-3-go-tender-citation.png), [`step-4-hohenau-needs-your-check.png`](docs/demo/step-4-hohenau-needs-your-check.png), [`step-5-company-rescore.png`](docs/demo/step-5-company-rescore.png), [`step-6-ask-this-tender.png`](docs/demo/step-6-ask-this-tender.png), [`step-7-bids.png`](docs/demo/step-7-bids.png). Re-record after any change with `node tests/demo-record.js`.
3. **The film.** `marketing/TenderScout-launch-film-1920x1080.mp4` (also linked from the website) if the pitch needs a visual while the app is fixed.
