# WebKit run and visual audit, pass 3 (6 Nov 2026)

This is the first time the app ran in WebKit, Safari's engine. The build containers cannot install it (`CLAUDE.md` §11 item 75), but GitHub's runners can, so `.github/workflows/webkit.yml` runs `tests/smoke.js` there:
- Playwright 1.63.0, WebKit, on the iPhone 13 (390 × 664 viewport, 3×) and iPhone SE (320 × 568, 2×) profiles;
- dark, light and reduced motion, plus the error fallback and the test-session log;
- 62 frames per device.

The frames came back through a `ci/webkit-frames-<run>` branch (the label `webkit-frames`), because this container cannot download artifacts. They were compared with the Chromium frames of the same steps, taken locally with the same profiles. `/agentic-council:visual-audit` was run against the repository's design rules (`DESIGN.md`, `UI_DESIGN.md`, the declutter rules in `CLAUDE.md` §11 items 53–68).

**Still not covered:**
- A real iPhone and Safari's own chrome. Playwright's WebKit on Linux is the engine, not Mobile Safari.
- The home-screen standalone mode.
- Real safe-area insets. The smoke test's injected-inset check (item 119) did run in WebKit and passed.

The Tuesday rehearsal on the phone remains the only test of those.

## Result

| Run | Commit | Served over | iPhone 13 | iPhone SE |
|---|---|---|---|---|
| 1 | `a4145de` | `file://` | 287 ok, 6 failed | 285 ok, 6 failed |
| 2 | `03087a4` (button fix, and the new label-fit check once per scheme) | HTTP (`SMOKE_SERVE=1`) | **295 ok, 0 failed** | **293 ok, 0 failed** |

The counts of run 2 are the same as Chromium's on each profile (295 and 293).

**Every failure of run 1 was a `file://` artefact:**
- WebKit refuses `manifest.webmanifest` under `file://` ("Origin null is not allowed by Access-Control-Allow-Origin").
- It reports the injected error as "Script error." because the page has no origin.

The phone loads the app over HTTPS from Pages, so the job now serves the checkout over HTTP. The laptop fallback in `BRIEF.md` (open `index.html` in Safari) shows the same harmless console line and works.

**Every functional check passed in WebKit on both profiles, in run 1 already:**
- the demo path and its numbers (No-go 25 → Go after "We meet it" and ISO 27001);
- sheets closing with Back, Escape and the scrim;
- the morph under normal motion, and its absence under reduced motion;
- the header appearance toggle;
- the error fallback and Restart;
- the test-session log, including the clipboard refusal path;
- the 44 px checks on the controls the smoke test measures: the header toggle, "Check →", Restart and the log button. The every-control 44 px check is the monkey walk's (`MONKEY=1`), which did not run in WebKit;
- the declutter scan on every rendered screen.

## Visual audit report

### Overall assessment
**Score:** 8/10. WebKit renders the app as Chromium does. The same type (Hanken Grotesk loaded in both), the same colours, the same 8 px radius; full-page frames differ by at most 1 px in height. Across 124 frame pairs, at most 4 % of pixels differ strongly. Those differences are anti-aliasing, a different line break in two paragraphs (WebKit ignores `text-wrap: pretty`), and animations caught at a different moment.

The audit found one real defect, and it is not WebKit's: the same overflow shows in Chromium.

### Squint test
- **Primary focus:** the verdict and score on a tender, the count line on the Feed, the brand-filled primary button on every screen with an action. Correct.
- **Reading order:** clear: verdict → title → facts → requirements.
- **Visual noise:** low.

### Findings

**[CRITICAL] Components: "We don't meet it" overflowed its button once a line was answered (fixed, re-rehearse).**
- **Current:** on the requirement sheet, after the AI or the owner resolves a line, "We don't meet it" was a third of the row.
  - 390 px: its 117 px label touched both edges of a 113 px button.
  - 320 px: the label spilled out of an 89 px button. In the light scheme the overflowing letters were white on the near-white ground, so it read "e don't meet".
- **Issue:** a label must sit inside its control with padding. This is the sheet of `BRIEF.md` step 3, on the demo path.
- **Fix:** `.sheet-foot .row-btns.pair > .btn-secondary:not(.btn-check) { flex:0 0 auto; }`. The secondary keeps its label's width (about 141 px) and "We meet it", still the primary, takes the rest (197 px at 390, 127 px at 320). The unresolved state, with two equal buttons, is unchanged.
- **Guard:** `tests/smoke.js` now checks on every scanned screen that no labelled control's text is wider than the control.

**[IMPROVEMENT] Spacing: the Feed's filter tabs were 2 px too narrow at 320 px (fixed, re-rehearse).**
- **Current:** "▲ Maybe 2" needed 71 px of a 69 px quarter, so its count touched the next tab's square.
- **Fix:** below 360 px only, `.tabs.filter button { gap:4px; padding:0 2px; }`. Nothing changes at 390 px.

**[IMPROVEMENT] Feedback: an answer's toast can still show on the next tab (not changed).**
- **Current:** in the automated run, "Answer saved · now No-go" from Hohenau's sheet was still on screen when Company already showed "No-go → Go". The toast lasts 4 s, and the test moves faster than a presenter.
- **Suggestion:** none before 11 Nov. At demo pace (`BRIEF.md` steps 4–5, about 25 s) the toast has gone. Clearing toasts on a tab change would be a behaviour change for the team to decide. Item 138 already lists the four-second toast as by design.

### Contrast report (from `node shared/check-contrast.js`, 79 pairs, 0 failures)

| Element | Foreground | Background | Ratio | Pass AA |
|---|---|---|---|---|
| Body text, dark | #FFFFFF | #02040A | 20.50:1 | Yes |
| Muted text, dark | #8A93A3 | #02040A | 6.62:1 | Yes |
| Primary button label, dark | #02040A | #5DB8F5 | 9.41:1 | Yes |
| No-go status text, dark | #FF8B80 | #02040A | 9.04:1 | Yes |
| Body text, light | #0E1B2B | #EEF3F8 | 15.54:1 | Yes |
| Muted text, light | #5A6474 | #EEF3F8 | 5.36:1 | Yes |
| Primary button label, light | #EEF3F8 | #0862AC | 5.61:1 | Yes |
| Secondary button label, light (ground on muted) | #EEF3F8 | #5A6474 | 5.36:1 | Yes |

### Quick wins
1. The button fix above: one CSS line, on the demo path. Done.
2. The 320 px tab spacing: one media query, invisible at 390 px. Done.
3. Keep the WebKit job informational until it has stayed green for a week of pull requests, then add `webkit (iPhone 13)` and `webkit (iPhone SE)` to the ruleset's required checks (`.github/workflows/webkit.yml` says how).
