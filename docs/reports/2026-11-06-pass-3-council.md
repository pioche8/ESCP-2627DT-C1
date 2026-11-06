# Council, pass 3 (6 Nov 2026): what team C1 shows and asks David Lehmann on 11 Nov

This is step 4 of the pass.
- **Mode:** standard. The conductor answered the two-round interview from the repository (`evidence.md`, the pass-2 report, the ADRs), because Luca's brief says not to ask him anything.
- **Backend:** workflow. Agent teams are not enabled here, and the deliberation ran as the plugin's canonical workflow script with the session's inputs filled in. A container restart stopped it after Round 1, and it resumed from its run ID with the finished positions kept.
- **Profile:** balanced (Opus members, a Sonnet codebase survey).
- **Members:** Strategist (Gold, with the MVP-scoping skill), Advocate (Green) and Skeptic (Red, with the failure-mode skill), over three rounds: positions, two challenge pairs, converge.

The full round texts and the design document stayed in the local session folder. This page is the record, and the outcome is [`docs/feedback/2026-11-11.md`](../feedback/2026-11-11.md).

## The question

What should team C1 show David Lehmann in the online feedback session on Wed 11 Nov, and ask him, to get the most useful feedback for the final submission? Luca's brief fixes the shape of the output:
1. What changed since the 5 Nov workshop, one line each, in user-facing words.
2. The `BRIEF.md` demo path with timings, plus the fallback video.
3. Three to five questions, including ADR-0002's.
4. What is missing and why, stated plainly.

Constraints the council could not move:
- `evidence.md` logs 0 interviews and 1 survey answer (S1).
- The persona, HMW statements, journey and traceability are teammate tasks (T8–T10).
- No invented interviews, quotes, personas or feedback.
- No app-byte change after Mon 9 Nov 18:00 London.
- `CLAUDE.md` §7.

## Outcome in one paragraph

The call is for getting **decisions**, and the pack is what makes them possible. About two minutes of the 75-second demo come first, with the proof sentence readable at the far end. Then at least two thirds of the slot goes to three questions, each with named options and a team-facing "what we do with each answer":
1. A critique of the qualification check, asked while Hohenau is on screen.
2. An evidence ruling that includes the case of no interview at submission.
3. ADR-0002's question word for word, its cost stated only after his first answer.

Scope and the form of the submission go by email if time runs short. The file keeps Luca's order, and its first line gives the order on the call.

§1 is grouped by "can he open it now?", in his words with a Where cell. "Simulated", "fictional" and "not tried with an owner" sit inside each line. §4 opens with the user gap, quotes the gate rule and signs no verdict.

## Tensions and how they were resolved (abridged; Round 2 pairs: Advocate ↔ Strategist, Advocate ↔ Skeptic)

| Tension | Resolution |
|---|---|
| Two or three branches for the evidence question, and whether to say interviews "continue" | Three branches: how many and by when, small n labelled "provisional, n = X", and the zero case at submission (left out with the reason, or written as marked assumptions). Plus "does a survey answer count?". "Continue" was dropped, because 0 interviews are logged. Claude writes no version of the persona, HMW statements or journey in any branch. |
| Whether T9's rule allows an assumption-only persona now | Withdrawn by the Strategist. T9 needs an interview for every pain and quote (`docs/START_HERE.md` §6). |
| Whether §4 states a gate verdict | It does not. It gives the rule and the blank result line; the team signs it or leaves it blank on purpose. |
| How §1 is grouped | By "on the demo link" or "finished, not on the demo link yet", with no identifiers in the lines and one team footer naming the app and recording versions. |
| The recording after the button fix | Re-verified at `cb0af5c`: the MP4 and the step-3 still were re-recorded after the fix, so they match the app and nothing needed correcting. |
| ADR-0002's cost: always, or after his answer | He answers first. Unless he says "simulated throughout", the cost (the ADR's own preconditions) and three options follow. No ruling means "documented, not built". |
| Demo medium | The iPhone only if a remote teammate can read step 3's German sentence at Tuesday's rehearsal, otherwise the laptop at 390 × 844. Always a Safari tab, never the home-screen icon, which starts at a reset. |
| Naming our own candidates for an "unfinished" screen | Not named. The question ends "Did any screen look unfinished to you?" |
| Wording checked against git | "now show a diamond" (it was never shown at the workshop). Competition: "Simulated AI on fictional notices", the chance "a rough plain-rules estimate, not validated". "narrowest phone screens (320 px)", not "smallest iPhone". |
| Extending `tests/docs-check.js` to `docs/feedback/` | Not extended, for one file days before the freeze. Instead the pack has no curly quotes and no "Interview N", and the pre-send checklist has the grep. |

## Where the pack departs from the council

**Pull request 26 is merged in this pass.** The council wrote the pack for "not merged, Luca decides by Mon 9 Nov 18:00", so that a merge would only delete lines, and it called the merge "strongly preferred". Luca's brief for this pass ends with "open a PR and merge it", so the brief wins. The merge happens on Fri 6 Nov, well before the freeze. The "not on the demo link yet" group is therefore empty and was removed: the two button fixes are lines under "on the demo link", and the WebKit and deploy lines stay. `CLAUDE.md` §11 item 150.

## Not done, on purpose

- **No navigation design.** The pack proposes no new or changed screen; Q4 only asks his view on scope, so the brief's condition for `/agentic-council:navigation-design` did not apply.
- **No PRD and no GitHub issues** (council phases 4–5). The output is one documentation file, not a build.
- **Nothing the team signs or fills in:** the gate result line, the team names, the rehearsal result, the footer at send time. They are in the pack's checklist.
