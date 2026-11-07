# Pass 5 council record: which app UI slices before the Mon 9 Nov freeze

**Date:** Sat 7 Nov 2026, about 13:00 London.

**Mode:** `/agentic-council:council` in quick mode. There was no interview: the question and its constraints came from the pass-5 brief and the repository. Four members (Strategist, Advocate, Artisan, Skeptic) wrote one round of positions in parallel, and the conductor (Steward) synthesised them. Rounds 2–3 do not run in quick mode.

**Input:** the visual audit of every app state, 198 frames: 47 states × dark and light × 390×844 and 320×568 (`/agentic-council:visual-audit`, summarised under [Evidence](#evidence)).

**Decision:** recorded in `CLAUDE.md` §11 item 170.

## The question

Which 3 to 5 UI slices should the app ship before the app-byte freeze, Mon 9 Nov 18:00 London? Rank them by two things:
- what the lecturer sees in a 2-minute demo (the 7 steps in `BRIEF.md`);
- how finished the app looks.

Constraints:
- the demo path stays at 7 steps or fewer, and within 3 s of today's timing;
- Hohenau No-go 25 → Maybe 90 → Go 100 does not move;
- copy comes from `data.js`, and `engine.js` decides;
- the design rules (nine solid colours, one 8 px radius, no pills, gradients or shadows);
- each slice is its own pull request, with the gates and a re-rehearsal flag.

Candidates from the brief:
- (a) one motion language shared with the website;
- (b) the Feed card's hierarchy;
- (c) the Tender screen: the verdict as hero, knock-outs first, the cited page easier to open;
- (d) Company: what each missing certificate would unlock;
- (e) the AI reading as a loading state, plus empty and error states;
- (f) the "Saved to Bids" toast covering Restore.

## Evidence

From the audit (score 7/10):
- **The declutter rules hold on every screen.** The weak spots are all on the demo path.
- **Step 5, the hero moment.** At a presenter's pace, the step-4 toast "Answer saved · now No-go · Undo" is still on Company, and its Undo sits under the ISO 27001 switch. A mis-tap undoes the answer, and the flip then honestly shows No-go → Maybe. The same cause puts "Saved to Bids · View" over Restore on Bids.
- **Step 4.** The two answer buttons are grey (the muted fill) and look disabled at the moment of decision.
- **Steps 3, 4 and 6.** On every tender with a photo, the first requirement starts at 812–863 px; the action bar starts at 764 px.
- **Company.** The re-score card shows no score. The hints use verdict colours to show a direction, and the Spanish hint sits under German.
- **Closed tenders.** The Closed score tile's "0" is 2.90:1 in light mode, which fails AA.

## Positions (Round 1)

| Member | Ranked slices | Cuts | Main concern |
|---|---|---|---|
| **Strategist** | S1 demo-path safety (scoped toasts, filled answer pair, Closed contrast) → S2 proof above the fold → S3 the re-score card shows the number. S4 Feed only if S1–S3 are green by Sun 22:00 | (a) except a count-up in S3; (e); a citation affordance and press fills until the lecturer answers Q1 | Steps 3–5 are 40 of the 75 seconds, and all three have a measured defect. The biggest grading gap is evidence, not pixels |
| **Advocate** | (1) nothing in the way: scoped toasts and Closed contrast → (2) proof above the fold: new order, the citation in brand, filled answer pair → (3) the hero shows its numbers, with an `aria-live` region (today the flip is never announced: WCAG 4.1.3) → (4) finished states. Feed optional | (a) except the count-up | WCAG 2.2 2.4.11: the toast covers the focused control in step 5 |
| **Artisan** | S1 scoped toasts → S2 proof first, filled answer pair, citation in brand → S3 the re-score card as the hero (the score in the target verdict colour, a 650 ms count-up from 315 ms, only the target shape pops) → S4 Feed tiles: only Go is filled | (e); (a) as a standalone slice: the card morph, the FLIP, the 777 count-up, the word reveal, the sheet rise and the Feed stagger already exist | Colour must mean a verdict, never a direction |
| **Skeptic** | (f) first → (c) narrowed → (d) narrowed, with static numbers → (e) narrowed: collapse empty Bids stages. Stop merging at Mon 12:00 | (a) entirely (aborted view transitions become unhandled rejections and show the crash screen; 20 screen changes × 250 ms = +5 s); (b) until after 11 Nov | The smoke test's fixed waits race any new animation. The WebKit job is informational, so a Safari regression found on Tuesday can only be reverted |

## Synthesis (Steward)

**Agreement across all four:**
- the toast fix comes first;
- the tender screen puts the proof above the fold;
- the Company re-score card shows the score;
- a standalone motion slice (a) is cut.

**Tensions, and how they were settled:**
1. **A count-up in S3 (Strategist, Advocate, Artisan) or static numbers (Skeptic).** Count-up, with the Skeptic's guardrail. The smoke test waits for the settled number (`waitForFunction` on the final text) instead of a fixed sleep. The count runs inside the existing 700 ms morph, so the demo takes no longer, and it is instant under reduced motion.
2. **The citation in brand text (Advocate, Artisan) or no new affordance (Strategist, Skeptic).** Brand text only. The whole line stays the one link, and nothing clickable is added inside it.
3. **Where the filled answer pair and the Closed contrast go.** In S1, as demo-path safety and AA fixes. "Closed" shown once goes in S2, with the tender screen.
4. **A fourth slice: the Feed (Artisan; Strategist and Advocate optional) or finished states (Advocate, Skeptic).** Neither before the freeze. Both touch step 2 or step 7 frames, and three slices plus the website already fill the time before the Skeptic's Mon 12:00 merge stop. Both are listed for after 11 Nov.

**Decision.** Three slices, merged in order, the last by Mon 12:00 London:
- **S1 Demo-path safety:**
  - a toast belongs to the screen that raised it (Skip's toast belongs to the Feed it lands on) and leaves at once on the next navigation;
  - the unresolved answer pair is filled in the check colour (bg on check: 9.51:1 dark, 7.47:1 light);
  - the Closed score is bg on muted (6.62:1 dark, 5.36:1 light).
- **S2 Proof first on a tender:**
  - order: verdict header → title and facts → "Can you qualify?" (knock-outs first) → In short → Ask this tender → Competition → photo;
  - the requirement's citation in brand text;
  - "Closed" once;
  - a smoke check that the first requirement is above the action bar at 390×844 on Ellerbach and Hohenau.
- **S3 The re-score card shows the score:**
  - "25 → 100" from `Engine.diff`, with the new score in the new verdict's colour, counting up;
  - the screen reader hears "score 25 → 100" through an `aria-live` region;
  - hints in muted text, with the target verdict as shape + word;
  - each language's hint on its own row.

**Cut before the freeze:**
- (a) as a slice;
- (b) the Feed tiles and meta row;
- (e) the skeleton contrast, no Save before the read, empty Bids stages, standalone secondaries.

They are candidates after the 11 Nov call, depending on the lecturer's answer to Q1 ("did any screen look unfinished?").

## Navigation check

Run with `/agentic-council:navigation-design` before the slices touched the demo path.

- **Screen map:** unchanged. The 13 routes, the five tabs, the two sheets as their own history entries, Not found and the error screen all stay as they are.
- **Navigation table:** unchanged. S1 changes only what follows the user from one screen to the next: no toast does.
- **Deep links, Back and Escape** (which close a sheet to its parent): unchanged.
- **State** (scroll positions, overrides, saved, skipped): unchanged.
- **Transitions:** unchanged. S3 adds a count-up inside the existing re-score morph.
- **Demo path:** still 7 steps. S2 shortens steps 3, 4 and 6, because the proof and "Ask this tender" sit higher. The timing was measured by re-recording the backup demo; the pass-5 report gives the number.
