# Persona and "How might we" statements (draft)

> **Draft, provisional, n = 1 in the segment (survey).** Written on 9 Nov 2026 (pass 7, `CLAUDE.md` §11 item 179) from the two stakeholder responses in [`evidence.md`](../../evidence.md) §1 and §1b. Both are **survey responses** (the course counts a survey as an interview; each keeps its survey label). The persona is built on **survey response S1**, the only response in our 5–50 segment. Survey response S2 (a 250+ person firm) is used only as a contrast, never as part of the persona.
>
> Every line cites **survey response S1** or **survey response S2**, or is marked **assumption**. The quoted phrases are the form's answer options the respondent picked, copied word for word from `evidence.md` §1b; they are not the respondent's own words, so there are no participant quotes (curly quotes are kept for those, per the conventions in [`USER_STORIES.md`](USER_STORIES.md)). This is a composite label, not a real person, and it has no name.
>
> Task T9 in [`docs/START_HERE.md`](../START_HERE.md). Rewrite it after the call with the respondent of survey response S1 and after any interview: each new answer replaces an assumption below.

## The owner who checks alone

### Who

| Field | Value | Source |
|---|---|---|
| Role | Owner or managing director | survey response S1 |
| Firm size | 5–19 people, inside the 5–50 segment of [`BRIEF.md`](../../BRIEF.md) → "User" | survey response S1 |
| Sector, country, public-sector share of revenue | Not asked by the form. The brief's sectors (IT services, installation, building trades, facility services, engineering, consulting, translation) | assumption |
| Bid manager on staff | None: the owner decides | assumption (the form did not ask) |

### Context of use
On a phone, between jobs, one hand, sessions of 1–3 minutes, patchy signal ([`docs/NAVIGATION.md`](../NAVIGATION.md), first paragraph). **Assumption:** the form did not ask where or how they decide.

### Goals
- Know quickly whether the firm can bid at all, before spending days on a tender. **Assumption**, inferred from the time survey response S1 spent deciding (below).
- Never spend effort on a bid the firm cannot qualify for. **Assumption.**

### How they work today
- Read 3–5 public tenders (EU or national) in the last 12 months to decide whether to bid. Source: survey response S1.
- Find them through free portal alerts (TED, national portals) and keep track in a spreadsheet or by hand. Source: survey response S1.
- Work out alone whether the firm qualifies: to "Did those tools tell you whether your firm actually qualifies?" the option picked was "No, I had to work it out myself". Source: survey response S1.

### Pains
- **Time:** 1–2 days deciding on the last tender, far above the gate's 1 h ([`evidence.md`](../../evidence.md) §0). Source: survey response S1.
- **What takes longest:** "Checking requirements (turnover, references, certifications)". Source: survey response S1.
- **Tools do not answer the question:** the free alerts find tenders but did not say whether the firm qualifies. Source: survey response S1.
- **Foreign or other-language tenders:** "Not sure" whether one was skipped. **Not a pain we can claim**: cross-language (H3) is still to be tested, not proven. Source: survey response S1.

### Money and willingness to pay
Not asked by the form, so unknown. The prices in [`BRIEF.md`](../../BRIEF.md) → "Business model" are an **assumption**. The call with the respondent of survey response S1 asks it ([`docs/INTERVIEW_KIT.md`](../INTERVIEW_KIT.md) §8: questions 6, 10, 12 and 13).

### Contrast outside the segment (not part of the persona)
Survey response S2, an owner of a 250+ person firm: 1–3 hours on the last tender, longest on "Reading long documents", free portal alerts only, and the tools answered only "Partly, I still had to check myself". It shows the same tools gap in a much larger firm. It does not describe our user.

## How might we

Each statement names the evidence it comes from and the feature or task it points to. Routes are in [`docs/NAVIGATION.md`](../NAVIGATION.md); stories in [`USER_STORIES.md`](USER_STORIES.md); tasks T2–T7 in [`docs/START_HERE.md`](../START_HERE.md).

| # | How might we … | Evidence | Points to |
|---|---|---|---|
| 1 | … tell an owner in minutes, not days, whether the firm can bid on a tender? | survey response S1 (1–2 days deciding); survey response S2 (1–3 hours, outside the segment) | The verdict and qualification check on a tender, `#/t/:id` (US2, US3) |
| 2 | … show which one requirement (turnover, references or a certificate) blocks the bid? | survey response S1 (checking requirements took longest) | Knock-outs first in the checklist, `#/t/:id` (US3); T5 "Why Maybe?" score breakdown |
| 3 | … make the alerts an owner already gets answer "can we qualify?"? | survey response S1 (tools did not say); survey response S2 (tools partly said, outside the segment) | The morning feed with a verdict per tender, `#/feed` (US2) |
| 4 | … let the owner check a requirement against the tender's own sentence without reading the whole pack? | survey response S2 (reading long documents took longest, outside the segment); for the segment an **assumption** | The requirement sheet with page, original sentence and translation, `#/t/:id/req/:rid` (US4) |
| 5 | … show what a missing certificate or reference would be worth before the owner invests in it? | survey response S1 (certifications and references are among the requirements checked); the value itself is an **assumption** | Company as a lever with live re-score, `#/company` (US7); T2 a seventh tender with another knock-out |
| 6 | … make the product worth opening for a firm that reads only a handful of tenders a year? | survey response S1 (3–5 a year); survey response S2 (1–2 a year) | An open question for the north star in [`BRIEF.md`](../../BRIEF.md) (a weekly check is not supported yet); T6 "Add to calendar" for the few deadlines that matter |
| 7 | … find out whether foreign tenders matter to these owners at all? | survey response S1 ("Not sure"); survey response S2 ("No") | No feature: question 9 of the call with the respondent of survey response S1 ([`docs/INTERVIEW_KIT.md`](../INTERVIEW_KIT.md) §8). The translation in US4 and T3 stays unsupported until then |

Journey map: [`JOURNEY.md`](JOURNEY.md).
