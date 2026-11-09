# evidence.md: TenderScout

Team: ESCP-2627DT-C1 · Members: <!-- TEAM NAMES -->[names] · Market: EU (interviews in [countries])

Kit and script: [`docs/INTERVIEW_KIT.md`](docs/INTERVIEW_KIT.md)

> **Integrity rules.** Every entry below comes from a real interview held by the named team member. No AI-generated or "illustrative" interviews. Names and companies are anonymised. Figures are only those the interviewee gave; anything else is marked ASSUMPTION. Demo data in the prototype is fictional and is **not** evidence.
>
> Real or fictional, figure by figure: [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional).

## 0. Hypotheses and kill gate (written BEFORE interview #1, tagged `v0-shell`)
TODO: Tag `v0-shell` only if no interview happened before this commit.

| # | Hypothesis | Confirmed if |
|---|---|---|
| H1 Pain | Small firms lose meaningful time or money **deciding whether they can bid**, not only writing the bid | Interviewee reports ≥1 h screening per tender, OR a bid lost to a missed knock-out, OR skipping tenders unread because checking is too costly |
| H2 Wedge | Their current tools don't answer "can we qualify?" | They use only portal alerts, a database or nothing, and check eligibility by hand |
| H3 Cross-border | Language stops them looking at foreign tenders | They skip foreign or other-language tenders without reading them |
| H4 Willingness | It's worth money | They name a cost (hours or €) of a wasted bid, or pay for a tender tool or consultant today |

**Gate: Tue 3 Nov, 18:00.** Count only interviewees from group A (owners/MDs) and B (tender person).
- **GO:** at least **2 people who meet BOTH H1 and H2.**
- **RESHAPE:** H1 holds but H2 fails (they already have a tool that qualifies). Pitch the cross-border angle (H3) or the buyer side (procurement officers wanting more bids).
- **KILL:** H1 fails for most (screening is quick; the pain is writing). Switch the product focus to bid *writing* support and say so openly in the workshop.
- Fewer than 3 A/B interviews by 18:00 → keep the idea, label it **"provisional, n = X"**.

Gate result (fill in Tue 18:00, signed by: ______): **GO / RESHAPE / KILL / provisional n=__**

## 1. Interview log
| # | Role | Sector | Size | Country | Interviewer | Date | H1 | H2 | H3 | H4 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | |
| 2 | | | | | | | | | | |
| 3 | | | | | | | | | | |
| 4 | | | | | | | | | | |
| 5 | | | | | | | | | | |
| 6 | | | | | | | | | | |

## 1b. Survey responses (screening form, not interviews)
Form: "How small firms decide whether to bid on public tenders (about 3 min)", Google Forms, opened 5 Nov 2026. The rows below are real respondents' answers, copied from the form's export without the contact field. The export itself, with the contact column removed, is [`docs/evidence/survey-2026-11-05.csv`](docs/evidence/survey-2026-11-05.csv). Survey answers are self-reported and **do not count toward the gate** in §0. A respondent who agrees to a call becomes an interview and is logged in §1 and §2 like any other. Contact details stay with the team and off this public repo.

| # | Date | Role | Firm size | Tenders read in 12 months | Time deciding on the last tender | Took longest | Tools | Did the tools say if you qualify? | Skipped a foreign tender? | Call |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 5 Nov 2026 | Owner / MD | 5–19 | 3–5 | 1–2 days | Checking requirements (turnover, references, certifications) | Free portal alerts (TED, national) + spreadsheet / manual | No, worked it out myself | Not sure | Yes (contact held by the team) |
| S2 | 5 Nov 2026 | Owner / MD | 250+ | 1–2 | 1–3 hours | Reading long documents | Free portal alerts (TED, national) | Partly, still had to check myself | No | No |

Survey response S1, read against the hypotheses (signals only, not gate evidence):
- **Segment:** 5–19 people, inside the 5–50 target.
- **H1 Pain:** signal yes. 1–2 days deciding on the last tender, far above the 1 h threshold in §0.
- **H2 Wedge:** signal yes. Free alerts and a spreadsheet only, and the tools gave no answer on whether the firm qualifies.
- **H3 Cross-border:** unclear ("Not sure").
- **H4 Willingness:** not asked by the form.

Survey response S2, read against the hypotheses (signals only, not gate evidence):
- **Segment first:** 250+ people, outside the 5–50 target. Survey response S2 does not describe our user, so none of the lines below is a signal about our user.
- **H1 Pain:** 1–3 hours on the last tender, at or above the 1 h threshold in §0. The longest part was reading long documents, not checking requirements.
- **H2 Wedge:** partial ("Partly, I still had to check myself"), using free portal alerts only.
- **H3 Cross-border:** no. They did not skip a tender in another language or another country.
- **H4 Willingness:** not asked by the form.

Data note: both respondents also answered "If none, why?" ("We tried and it was too much effort"), although survey response S1 read 3–5 tenders and survey response S2 read 1–2. The form shows that question to everyone, so the answer is not used.

**Summary (signals only, not gate evidence):** n = 2 survey answers, of which 1 is in the segment (survey response S1), and 0 interviews. For survey response S1, H1 and H2 both signal yes. H3 has no support from either respondent ("Not sure" and "No"): the cross-language claim has no evidence yet. H4 was not asked. The gate in §0 stays unsigned, because it counts interviews only.

Next: book the 20-minute call with the respondent of survey response S1 and log it as an interview (§1, §2). The respondent of survey response S2 left no contact for a call.

## 2. Interview notes
<!-- One block per interview, using the template in docs/INTERVIEW_KIT.md §6 -->

### Interview 1 · [role] · [sector] · [size] · [country] · [date] · interviewer: [name]
- Consent: quote anonymously yes/no · recorded yes/no
- Public-sector share of revenue:
- Last tender story:
- Time spent screening one tender:
- Tenders seen / screened / bid per month:
- Knock-out surprise ever?:
- Foreign-language tenders?:
- Current tools / paid for:
- Biggest pain (their words):
- Quotes:
  - ""
- Gate: H1 yes/no · H2 yes/no · H3 yes/no · H4 yes/no
- Surprises:

## 3. Key insights (after ≥4 interviews)
1.
2.
3.

## 4. What changed in the product because of the evidence
| Before (v0-shell) | After (v1-workshop) | Because of interview # |
|---|---|---|
| | | |

## 5. Desk research (separate from interview evidence)
- European Court of Auditors, Special Report 28/2023: EU public procurement about €2tn/yr (about 14% of GDP); single-bid share 42% in 2021, nearly double 2011; average bids fell from about 6 to 3; firms cite bureaucracy. https://www.eca.europa.eu/ECAHTMLNews/NEWS-SR-2023-28/en/body.html (accessed 2 Nov 2026)
- Altura raised €8M Series A (Jun 2025) for AI bid management. https://tech.eu/2025/06/09/altura-raises-eur8m-for-ai-powered-bid-management-platform/ (accessed 2 Nov 2026)
- Tendium "Qualify" bid/no-bid product. https://tendium.ai/en/tendium-qualify/ (accessed 2 Nov 2026)

## 6. AI use disclosure
- Claude (Anthropic): idea shortlist, v0 prototype scaffold, interview kit and templates, desk-research summary.
- [Codex / ChatGPT Edu]: [what the team changed in the workshop]
- The team: all interviews, notes, insights and the gate verdict.
