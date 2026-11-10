# evidence.md: TenderScout

Team: ESCP-2627DT-C1 · Members: William DE MICHELE, Astrid Heyerdahl DELAUNAY, Ilane IDIR, Diego LU HIGA, Luca ZORZI, Benedict KRUSE · Market: EU (2 survey responses from firm owners, one firm of 5–19 people and one of 250+; the form did not ask the country)

Kit and script: [`docs/INTERVIEW_KIT.md`](docs/INTERVIEW_KIT.md)

> **Stakeholder evidence: 2 responses, collected by survey (the course counts a survey as an interview). 1 is in our 5–50 segment.** The gate in §0 is signed **Provisional, n = 2**.
>
> **Integrity rules.** Every entry below comes from a real interview held by the named team member or from a real survey response, and each is labelled as one or the other (interview, or survey response S1, S2, …). A survey response is never renamed an interview. No AI-generated or "illustrative" entries. Names and companies are anonymised. Figures are only those the interviewee or survey respondent gave; anything else is marked ASSUMPTION. Demo data in the prototype is fictional and is **not** evidence.
>
> **Rule change (Luca, 9 Nov 2026):** the course accepts either an interview or a survey as stakeholder evidence, so survey responses now count toward the gate in §0, labelled as survey. This replaces our pre-workshop rule that survey answers did not count (`CLAUDE.md` §11 item 178). **10 Nov 2026:** the course regards a survey as an interview, so our two survey responses are our stakeholder interviews for the course requirement; each keeps its label, survey response S1 or S2, so the method matches the export next to it (`CLAUDE.md` §11 item 180).
>
> Real and fictional data: the survey responses, the desk research in §5 and the decision rules are real; every company, buyer and tender in the prototype's demo is fictional and is not evidence. Figure by figure: [`ARCHITECTURE.md` §9](ARCHITECTURE.md#9-what-is-real-and-what-is-fictional).

## 0. Hypotheses and kill gate (written before the evidence)
The hypotheses and the gate below are on `main` from its earliest commit with this file, `99235a7` (3 Nov 2026, 09:56 UTC, the prototype as received from the 2 Nov session), two days before the first stakeholder response came in (5 Nov 2026). That commit is the proof they were written before the evidence.

| # | Hypothesis | Confirmed if |
|---|---|---|
| H1 Pain | Small firms lose meaningful time or money **deciding whether they can bid**, not only writing the bid | Interviewee reports ≥1 h screening per tender, OR a bid lost to a missed knock-out, OR skipping tenders unread because checking is too costly |
| H2 Wedge | Their current tools don't answer "can we qualify?" | They use only portal alerts, a database or nothing, and check eligibility by hand |
| H3 Cross-border | Language stops them looking at foreign tenders | They skip foreign or other-language tenders without reading them |
| H4 Willingness | It's worth money | They name a cost (hours or €) of a wasted bid, or pay for a tender tool or consultant today |

**Gate: Tue 3 Nov, 18:00.** Count only interviewees from group A (owners/MDs) and B (tender person). Since 9 Nov, survey respondents from groups A and B count too, labelled as survey (rule change above).
- **GO:** at least **2 people who meet BOTH H1 and H2.**
- **RESHAPE:** H1 holds but H2 fails (they already have a tool that qualifies). Pitch the cross-border angle (H3) or the buyer side (procurement officers wanting more bids).
- **KILL:** H1 fails for most (screening is quick; the pain is writing). Switch the product focus to bid *writing* support and say so openly in the workshop.
- Fewer than 3 A/B interviews by 18:00 → keep the idea, label it **"provisional, n = X"**.

Gate result (signed 9 Nov 2026 by Luca, on the rule change above; written up by Claude Code): **Provisional, n = 2** (stakeholder evidence: 2 responses, collected by survey, 1 in our segment).

How it was evaluated, with the gate's own criteria (details in §1 and §1b):

| Response | Method | Group | In the 5–50 segment? | H1 Pain | H2 Wedge | H3 Cross-border | H4 Willingness |
|---|---|---|---|---|---|---|---|
| Survey response S1 | survey | A (owner / MD) | yes (5–19 people) | **meets**: 1–2 days deciding on the last tender, above the 1 h threshold | **meets**: free portal alerts plus a spreadsheet; the tools did not say whether the firm qualifies, they worked it out themselves | not shown ("Not sure") | not asked by the form |
| Survey response S2 | survey | A (owner / MD) | **no** (250+ people) | **meets**: 1–3 hours on the last tender, at or above the 1 h threshold | **meets**: free portal alerts only; the tools partly said, they still had to check themselves | no (did not skip a foreign tender) | not asked by the form |

- **GO line (at least 2 people who meet both H1 and H2):** reached on the count, 2 of 2. But survey response S2 is a 250+ person firm, outside our 5–50 user (`BRIEF.md` → "User"), so inside the segment it is 1 person, not 2.
- **Why provisional:** the gate's own rule says fewer than 3 A/B responses keeps the idea and labels it "provisional, n = X". There are 2, so: keep the idea, provisional, n = 2.
- **Timing:** both answers came in on 5 Nov 2026, after the gate time (Tue 3 Nov, 18:00). The gate was evaluated late, on 9 Nov, once the rule change let survey responses count.
- **H3 (cross-border) has no support:** "Not sure" and "No". Cross-language is a hypothesis we test next, not a finding.
- **H4 (willingness to pay) is untested:** the form never asked it.

## 1. Stakeholder log
One row per stakeholder response, interview or survey. The Method column says which; a survey response is never renamed an interview. Survey rows link to their full answers in §1b; interview rows to their notes in §2.

| # | Method | Role | Sector | Size | Country | Collected by | Date | H1 | H2 | H3 | H4 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| [S1](#1b-survey-responses-screening-form) | survey | Owner / MD | not asked | 5–19 | not asked | screening form | 5 Nov 2026 | yes | yes | unclear | not asked |
| [S2](#1b-survey-responses-screening-form) | survey | Owner / MD | not asked | 250+ (outside the segment) | not asked | screening form | 5 Nov 2026 | yes | yes | no | not asked |
| 1 | interview | | | | | | | | | | |
| 2 | interview | | | | | | | | | | |
| 3 | interview | | | | | | | | | | |
| 4 | interview | | | | | | | | | | |

## 1b. Survey responses (screening form)
Form: "How small firms decide whether to bid on public tenders (about 3 min)", Google Forms, opened 5 Nov 2026. The rows below are real respondents' answers, copied from the form's export without the contact field. The export itself, with the contact column removed, is [`docs/evidence/survey-2026-11-05.csv`](docs/evidence/survey-2026-11-05.csv). Survey answers are self-reported. Since 9 Nov they **count toward the gate** in §0 as stakeholder evidence, labelled as survey, and since 10 Nov the course regards them as our stakeholder interviews (rule changes at the top). The quoted phrases are the form's answer options the respondent picked, not their own words. A call with a respondent is an interview, logged as a separate interview row in §1 and §2. Contact details stay with the team and off this public repo.

| # | Date | Role | Firm size | Tenders read in 12 months | Time deciding on the last tender | Took longest | Tools | Did the tools say if you qualify? | Skipped a foreign tender? | Call |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | 5 Nov 2026 | Owner / MD | 5–19 | 3–5 | 1–2 days | Checking requirements (turnover, references, certifications) | Free portal alerts (TED, national) + spreadsheet / manual | No, I had to work it out myself | Not sure | Yes (contact held by the team) |
| S2 | 5 Nov 2026 | Owner / MD | 250+ | 1–2 | 1–3 hours | Reading long documents | Free portal alerts (TED, national) | Partly, I still had to check myself | No | No |

Survey response S1, read against the hypotheses (survey; counted in the gate, §0):
- **Segment:** 5–19 people, inside the 5–50 target.
- **H1 Pain:** yes. 1–2 days deciding on the last tender, far above the 1 h threshold in §0.
- **H2 Wedge:** yes. Free alerts and a spreadsheet only, and the tools gave no answer on whether the firm qualifies.
- **H3 Cross-border:** unclear ("Not sure").
- **H4 Willingness:** not asked by the form.

Survey response S2, read against the hypotheses (survey; counted in the gate, §0, with its segment stated):
- **Segment first:** 250+ people, outside the 5–50 target. Survey response S2 does not describe our user: it meets H1 and H2 by the gate's criteria, but it says nothing about a 5–50 person firm.
- **H1 Pain:** 1–3 hours on the last tender, at or above the 1 h threshold in §0. The longest part was reading long documents, not checking requirements.
- **H2 Wedge:** yes, by the gate's criteria: free portal alerts only, and the tools only partly answered ("Partly, I still had to check myself"), so they still checked by hand.
- **H3 Cross-border:** no. They did not skip a tender in another language or another country.
- **H4 Willingness:** not asked by the form.

Data note: both respondents also answered "If none, why?" ("We tried and it was too much effort"), although survey response S1 read 3–5 tenders and survey response S2 read 1–2. The form shows that question to everyone, so the answer is not used.

**Summary:** stakeholder evidence: 2 responses, collected by survey (the course counts a survey as an interview). 1 is in our 5–50 segment (survey response S1). Both meet H1 and H2 by the gate's criteria; only survey response S1 describes our user. H3 has no support from either respondent ("Not sure" and "No"), so cross-language is a hypothesis we test next. H4 was not asked. Gate: **Provisional, n = 2** (§0).

Next: book the 20-minute call with the respondent of survey response S1 and log it as an interview (a new interview row in §1, notes in §2; survey response S1 stays a survey row). The call adds depth the form cannot, above all H4 (willingness to pay), which the survey never asked, and whether H3 holds. The respondent of survey response S2 left no contact for a call.

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

## 3. Key insights (n = 2, survey)
Only what the two survey responses support. Each line is marked "n = 2, survey" or "n = 1, survey" (or n = 0 where the form did not ask). Persona and journey drafts built on them: [`docs/design/PERSONA.md`](docs/design/PERSONA.md), [`docs/design/JOURNEY.md`](docs/design/JOURNEY.md).
1. **Deciding whether to bid takes real time.** 1–2 days (survey response S1) and 1–3 hours (survey response S2) on the last tender, both at or above the gate's 1 h. (n = 2, survey)
2. **Neither respondent's tools answered "can we qualify?".** Both use free portal alerts; survey response S1 worked eligibility out alone, survey response S2 still had to check. (n = 2, survey)
3. **What takes longest differs:** checking requirements (turnover, references, certifications) for survey response S1, the one in the segment; reading long documents for survey response S2. (n = 2, survey; the first part n = 1)
4. **Few tenders a year:** 3–5 (survey response S1) and 1–2 (survey response S2) read in 12 months. A weekly check rhythm is not supported yet (`BRIEF.md` north star). (n = 2, survey)
5. **No support for the cross-language claim yet:** "Not sure" and "No". Cross-language is a hypothesis we test next. (n = 2, survey)
6. **Willingness to pay is unknown:** the form did not ask it. (n = 0)

## 4. What changed because of the evidence
The two survey responses back the core of TenderScout. Deciding whether to bid takes the respondents between 1–3 hours (survey response S2) and 1–2 days (survey response S1), and free alerts don't tell them whether they qualify (H1, H2). We kept the qualification check at the centre of the demo, and built the persona and the journey on survey response S1, the one in our 5–50 segment. Neither response supports reading tenders in other languages (H3), so cross-language is now a hypothesis we test next, not the main promise.

## 5. Desk research (separate from interview evidence)
- European Court of Auditors, Special Report 28/2023: EU public procurement about €2tn/yr (about 14% of GDP); single-bid share 42% in 2021, nearly double 2011; average bids fell from about 6 to 3; firms cite bureaucracy. https://www.eca.europa.eu/ECAHTMLNews/NEWS-SR-2023-28/en/body.html (accessed 2 Nov 2026)
- Altura raised €8M Series A (Jun 2025) for AI bid management. https://tech.eu/2025/06/09/altura-raises-eur8m-for-ai-powered-bid-management-platform/ (accessed 2 Nov 2026)
- Tendium "Qualify" bid/no-bid product. https://tendium.ai/en/tendium-qualify/ (accessed 2 Nov 2026)

## 6. AI use disclosure
Who drafted each artefact in this file and in [`docs/design/`](docs/design/), and who approved it, from the record (git history, [`CLAUDE.md`](CLAUDE.md) §11 and [README → AI use](README.md#ai-use-escp-policy-disclosure)). Where the record does not show who did something, it says **team to confirm**. Every merge into `main` went through a pull request merged from Luca's GitHub account (`pioche8`); for the autonomous passes Claude Code merged them on Luca's instruction, so a merge alone does not show that a teammate reviewed the text.

**One account for six people** (statement by Luca, 10 Nov 2026): Everyone in the team had access to Luca's GitHub and Claude accounts and worked through them, so the history shows one account for the work of all six members. Account names in the git history and in this section show whose account was used, not which team member did the work.

| Artefact | Drafted by | Approved by |
|---|---|---|
| §0 hypotheses H1–H4 and the kill gate | Claude (Anthropic), 2 Nov 2026 session (the hypotheses and gate are in the first commit, `99235a7`; README → AI use: "brief draft, interview kit and templates") | Luca restored the full file on 3 Nov (`1db90f9`); the rest of the team: team to confirm |
| §0 gate verdict, "Provisional, n = 2", and its working | Written up by Claude Code (pass 7, 9 Nov 2026) from the gate's own criteria, on Luca's instruction (`CLAUDE.md` §11 item 178) | Luca's instruction and rule change; not signed by the rest of the team |
| The screening form and its questions | team to confirm | team to confirm |
| §1 stakeholder log, §1b survey rows and [`docs/evidence/survey-2026-11-05.csv`](docs/evidence/survey-2026-11-05.csv) | The answers are the respondents'; Claude Code copied them from the form's export (survey response S1 on 5 Nov, survey response S2 in pass 6, 9 Nov, with the contact column removed) and wrote the read against H1–H4 | Survey response S1 committed to `main` directly on 5 Nov (`2cbb841`); survey response S2 merged on Luca's instruction (pull request 34); team review: team to confirm |
| §2 interview note template | Claude (Anthropic), 2 Nov 2026 session (interview kit and templates) | team to confirm |
| §3 key insights | Claude Code (pass 7, 9 Nov 2026) | Merged on Luca's instruction (pull request 35); team review: team to confirm |
| §4 what changed because of the evidence | Luca's wording (10 Nov 2026), entered by Claude Code (pass 8) | Luca |
| §5 desk research | Claude (Anthropic), 2 Nov 2026 session (desk research summary) | team to confirm |
| [`docs/design/PERSONA.md`](docs/design/PERSONA.md) (persona and HMW statements) and [`docs/design/JOURNEY.md`](docs/design/JOURNEY.md) | Claude Code (pass 7, 9 Nov 2026), from survey responses S1 and S2 | Merged on Luca's instruction (pull request 35); team review: team to confirm |
| [`docs/design/UX_PLANES.md`](docs/design/UX_PLANES.md), [`USER_STORIES.md`](docs/design/USER_STORIES.md), [`CONTENT_REQUIREMENTS.md`](docs/design/CONTENT_REQUIREMENTS.md) | Claude Code, 5 Nov 2026 (UX planes); stories brought up to date in pass 2 (6 Nov) and the evidence lines in passes 6–8 | Merged from Luca's account; team review: team to confirm |

Tools:
- **Claude (Anthropic), 2 Nov 2026:** idea shortlist, v0 prototype scaffold, interview kit and templates, desk-research summary.
- **Claude Code (Anthropic), 3–10 Nov 2026:** the build passes listed in [README → AI use](README.md#ai-use-escp-policy-disclosure), including the evidence write-ups above.
- **Claude Code and ChatGPT Edu in the workshop:** the whole team used Claude Code through Luca's GitHub account (`pioche8`), and ChatGPT Edu. What each was used for in the workshop: **team to fill in**.
- **The team:** the decisions recorded in `CLAUDE.md` §11 as taken with the team. Who built and sent the screening form: team to confirm.
