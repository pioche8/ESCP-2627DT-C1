# Interview kit: TenderScout (run Mon 2 Nov evening – Thu 5 Nov 08:00)

**Rule zero (ESCP AI policy):** every note in `evidence.md` comes from a real conversation with a real person. AI may help you *structure* notes you wrote, but never invent, "fill in" or paraphrase into quotes. Keep raw notes (paper, phone notes or voice memo, with consent) until the course ends.

## 1. Who to interview (at least 1 per team member, aim for 6+)
| # | Role | Why | Count |
|---|---|---|---|
| A | **Owner / MD of a 5–50 person firm that has bid on (or considered) a public tender**: IT, network or electrical installer, building trades, facility services, engineering or consulting | Primary user. **Decides the gate** | **4+** |
| B | Person who "does the tenders" at a 50–250 firm (office manager, sales lead, bid coordinator) | Secondary user, knows the workflow in detail | 1–2 |
| C | **Public procurement officer** (city, district, university, hospital) | Buyer side: why do they get one bid? What makes bids invalid? | 1 |
| D | Bid consultant / Vergabeberater, or the chamber's (IHK/HWK) Auftragsberatungsstelle | Sees many SMEs fail. Competitor or channel? | optional |

Mix countries if you can (DE plus one of AT/NL/FR/ES/IT). Different sectors are better than five IT firms.

## 2. Outreach message (send tonight)

**English**
> Hi [name], I'm [first name], a student at ESCP Business School. For a course project we're researching how small firms decide whether to bid on public tenders, and where that process costs time. Could I ask you 20 minutes of questions this Tuesday or Wednesday (phone, video or in person)? No sales pitch. Your answers stay anonymous and are only used for our coursework. Thank you!

**Deutsch**
> Hallo [Name], ich bin [Vorname], Student an der ESCP Business School. Für ein Kursprojekt untersuchen wir, wie kleine Unternehmen entscheiden, ob sie sich auf öffentliche Ausschreibungen bewerben – und wo dabei Zeit verloren geht. Hätten Sie am Dienstag oder Mittwochmorgen 20 Minuten für ein paar Fragen (Telefon, Video oder vor Ort)? Kein Verkauf, Ihre Antworten bleiben anonym und dienen nur unserem Kurs. Vielen Dank!

## 3. Consent (read out at the start)
"This is for an ESCP course. I'll take notes and won't use your name or company name. Can I quote you anonymously? Is it OK if I record audio just for my own notes? [yes/no]" Write the answer in the notes.

## 4. Script (20–25 min). Ask about the past, not hypotheticals
Mom-Test rules: ask what they **did last time**, not what they *would* do. Don't pitch TenderScout until the last 3 minutes, and only if there's time.

**Warm-up (2 min)**
1. What does your company do, how many people, and roughly what share of revenue comes from public clients?

**Last tender (10 min)**: the core
2. Think of the **last public tender you looked at seriously**. How did you find it?
3. Walk me through what happened from finding it to deciding bid / no bid. Who did what? How long did it take?
4. How many pages were the documents? What did you actually read?
5. Did you bid? **Why / why not?** What was the deciding factor?
6. Have you ever started a bid and then found a requirement you couldn't meet (turnover, references, certificate, site visit)? What did it cost you?

**Volume and skipping (4 min)**
7. Roughly how many tenders do you see per month, and how many do you look into? How many do you bid on?
8. When you skip one, what's the usual reason?
9. Have you ever looked at a tender **in another country or language**? What happened?

**Current tools / workarounds (4 min)**
10. What do you use today to find or check tenders (portal alerts, DTAD, Tendium, a consultant, the chamber, nothing)? What do you pay?
11. What's the most annoying part of the process?

**Money and willingness (3 min)**
12. What does preparing one bid cost you in hours, roughly?
13. If someone had told you in 1 minute "you're not eligible, because page 23", what would that have been worth?

**Close (2 min)**
14. Who else should we talk to? (snowball one more interview)
15. *(Optional demo)* Show the prototype on your phone, say nothing, and watch where they tap first. Note what they say out loud.

**For procurement officers (C), replace 2–13 with:**
- On your last tender, how many bids came in? Why do you think so few?
- What are the most common reasons bids get excluded?
- Do small firms ask you questions before bidding? Which ones?
- Would you want bidders to get a plain-language summary of your tender? Any risk in that?

## 5. Signals to listen for
| Supports the idea | Kills or reshapes it |
|---|---|
| "I don't even open foreign tenders" | "Our consultant / the chamber already screens for us" |
| "We found out on page X we couldn't bid" | "We already use Tendium / DTAD with alerts and it's fine" |
| Screening takes hours, done in the evening | "We just don't want public work" (late payment, price-only) |
| They skip based on gut feel | Screening takes 10 minutes. The pain is *writing* the bid |
| Concrete € or hours lost on a wasted bid | No public-sector revenue and no intent to get any |

## 6. Note template (copy one per interview into evidence.md)
```
### Interview [#] · [role] · [sector] · [company size] · [country] · [date] · interviewer: [name]
Consent: quote anonymously yes/no · recorded yes/no
Public-sector share of revenue:
Last tender story (what actually happened):
Time spent screening one tender:
Tenders seen / screened / bid per month:
Knock-out surprise ever? (what, cost):
Foreign-language tenders?:
Current tools / paid for:
Biggest pain (their words):
Quotes (verbatim, max 3):
  - "..."
Gate scoring:  Pain = yes/no (why)   Wedge = yes/no (why)
Surprises / what we got wrong:
```

## 7. Logistics
- Split roles: one asks, one writes. Over video, write live.
- Write up notes **within 2 hours** of the interview.
- Fill the gate tally in `evidence.md` after every interview.

## 8. What each answer feeds
A method table, not findings: it says where an answer goes once an interview is logged in [`evidence.md`](../evidence.md) §1 and §2, so T8 (traceability), T9 (persona and HMW) and T10 (journey) in [`docs/START_HERE.md`](START_HERE.md) can be written from the notes without re-reading every interview. It holds no answers. Anything not said in an interview stays out of those files or is marked ASSUMPTION.

| Question | Tests | T8 · traceability | T9 · persona and HMW | T10 · journey |
|---|---|---|---|---|
| 1 Company, staff, public share of revenue | context for every hypothesis | the row's evidence column (who said it) | context of use; which persona the interviewee belongs to | — |
| 2 How they found the last tender | H2 | the morning feed row | current tools | stage "a tender exists → found", tool today |
| 3 Finding → bid / no bid, who, how long | H1 | the morning feed and qualification check rows | goals; pains in their words | every stage's actions and the time it took |
| 4 Pages, what they actually read | H1 | the citation sheet row | pains in their words | stage "read the documents", pain |
| 5 Did they bid, the deciding factor | H1, H2 | the verdict row | goals; an HMW about the deciding factor | stage "decide", outcome |
| 6 A requirement found too late, its cost | H1, H4 | the knock-out rows (turnover, references, certificate, site visit) | pains; what they said about money or time | stage "start the bid", pain and its cost (only a figure they gave) |
| 7 Tenders seen, looked into, bid per month | H1 | the north-star row (how often a check would happen) | context of use | how often the journey starts |
| 8 The usual reason to skip | H1 | the skip-reasons row | pains; an HMW | stage "skip", reason |
| 9 Another country or language | H3 | the translation and original-sentence rows | pains; an HMW about other languages | stage "read the documents" for a foreign tender |
| 10 Tools today and what they pay | H2, H4 | the competition row in `BRIEF.md` (do they already have a qualifier?) | current tools; money | tool today at every stage |
| 11 The most annoying part | H1 | the row of the feature it points to | pains in their words (a quote, with consent) | the stage it names, pain |
| 12 Hours to prepare one bid | H4 | the business-model row (the €49 / €149 plans are ASSUMPTION) | money or time | stage "write the bid", cost |
| 13 Worth of "not eligible, page 23" in a minute | H4 | the qualification check row | money; an HMW about a fast no | the TenderScout moment, in their words |
| 14 Who else to talk to | — | — | — | — |
| 15 Optional demo: where they tap first | usability, not H1–H4 | the screen's row (what they tapped, what they said) | — | the TenderScout moment's open question |
| Procurement officers (C) | H2 from the buyer side, the RESHAPE route in `evidence.md` §0 | a buyer-side row, kept apart from the owners' rows | not the primary persona (`BRIEF.md` → User) | not the owner's journey; a note on the buyer's side |

**The follow-up call with survey respondent S1** ([`evidence.md`](../evidence.md) §1b) should start with the questions the screening form did not settle: 9 (H3 was unclear) and 6, 10, 12 and 13 (H4 was not asked). The call is an interview: log it in §1 and §2 like any other, and only then does it count toward the gate.
