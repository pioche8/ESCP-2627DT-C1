# User-journey map (draft)

> **Draft, provisional, n = 1 in the segment (survey).** Written on 9 Nov 2026 (pass 7, `CLAUDE.md` §11 item 179) for the persona in [`PERSONA.md`](PERSONA.md), from the two stakeholder responses in [`evidence.md`](../../evidence.md) §1 and §1b. Both are **survey responses**, not interviews. Every pain cites **survey response S1** (in our segment) or **survey response S2** (a 250+ person firm, outside it, used only as a contrast), or says **assumption**. A cost appears only where a respondent gave it. Each TenderScout moment names a route in [`docs/NAVIGATION.md`](../NAVIGATION.md).
>
> Task T10 in [`docs/START_HERE.md`](../START_HERE.md). The open questions are the ones the call with the respondent of survey response S1 should answer ([`docs/INTERVIEW_KIT.md`](../INTERVIEW_KIT.md) §8 numbers them).

From "a tender exists" to "bid submitted or skipped", today and with TenderScout:

| Stage | Today: what the owner does, with which tool | Pain and its cost | Evidence | With TenderScout (screen, route) | Open question |
|---|---|---|---|---|---|
| 1 · A tender exists → found | Gets free portal alerts (TED, national portals); keeps track in a spreadsheet or by hand | The alerts find tenders but do not say whether the firm qualifies | survey response S1; survey response S2 (alerts only, outside the segment) | The morning feed: every new tender with Go / Maybe / No-go and a score, `#/feed` (simulated reading of fictional tenders) | How many alerts arrive for the 3–5 tenders read a year (question 7) |
| 2 · Read the documents | Reads the tender pack | Reading long documents took longest for survey response S2; for the persona, how long reading takes is an **assumption** | survey response S2 (outside the segment); **assumption** for the segment | A tender opens on its qualification check, and each line cites its page and original sentence, `#/t/:id` and `#/t/:id/req/:rid` | How many pages, and what is actually read (question 4) |
| 3 · Check the requirements | Checks turnover, references and certifications against the firm, by hand: the tools did not say | Checking requirements took longest; **1–2 days** deciding on the last tender | survey response S1 | Knock-outs first; an unclear line comes to the owner ("Needs your check") instead of a guess, `#/t/:id/req/:rid`; Company shows what a certificate or reference would change, `#/company` | Has a requirement ever been found too late, and what did it cost (question 6) |
| 4 · Decide: bid or skip | Decides alone; 3–5 tenders read in 12 months | Not asked (how many were bid, why one was dropped): **assumption** | survey response S1 (the count); **assumption** (the rest) | Save to Bids, `#/bids`, or Skip with reasons, `#/t/:id/skip` | The usual reason to skip, and how many are bid (questions 7 and 8) |
| 5 · Write and submit the bid | Writes the bid | Not asked: the bid cost in [`BRIEF.md`](../../BRIEF.md) is an **assumption** | **assumption** | Out of scope: Bids only tracks the stage (Deciding, Bidding, Submitted), `#/bids`; bid writing is not built ([`CLAUDE.md`](../../CLAUDE.md) §10) | Hours to prepare one bid, and what a fast "not eligible" is worth (questions 12 and 13, H4) |

**Foreign or other-language tenders are not a stage yet.** Survey response S1 answered "Not sure" and survey response S2 "No" to skipping one, so the cross-language claim (H3) has no support. The product's translation (US4, `#/t/:id/req/:rid`) stays a bet until question 9 is asked.

**Later, not built** (as in [`BRIEF.md`](../../BRIEF.md) and [`CLAUDE.md`](../../CLAUDE.md) §10): real tender ingestion from TED, live AI reading, accounts, real push notifications (the morning notification is simulated) and bid writing.
