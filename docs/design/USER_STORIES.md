# User stories

> **None of these stories comes from an interview.** US1–US10 are derived from [`BRIEF.md`](../../BRIEF.md) → "Solution" (features 1–5) and [`docs/NAVIGATION.md`](../NAVIGATION.md) → screens and flows 1–4, plus Skip and the About / AI disclosure. US11–US15 describe features the team asked for on 5 Nov 2026 (the morning notification, the Competition section, Win/loss insights, the Profile tab and the Settings tab: [`CLAUDE.md`](../../CLAUDE.md) §11 items 120–122 and commits `b3f8ec2` and `4559372`); they are tagged "team request" because they serve no hypothesis that was tested. No interview is logged in [`evidence.md`](../../evidence.md) yet, so no story cites one. The tag on US1–US10 says which hypothesis the story serves ([`evidence.md` §0](../../evidence.md#0-hypotheses-and-kill-gate-written-before-interview-1-tagged-v0-shell)). It does not say the hypothesis holds. Interview links get added to each story after T1 ([`docs/START_HERE.md`](../START_HERE.md) §6).
>
> **Real behaviour, fictional examples:** the routes, rules and tests are the prototype's code; every name and number in the examples is demo data from `data.js` ([`ARCHITECTURE.md` §9](../../ARCHITECTURE.md#9-what-is-real-and-what-is-fictional)).
>
> The acceptance criteria describe behaviour the prototype already has. Each one names the screen or route and the check that locks it. "Not locked by a test" means the behaviour exists but no gate checks it. The numbers (6 tenders, Landkreis Hohenau 25 → 90 → 100) come from the fictional demo data in `data.js`.
>
> **How a check is named (checked by [`tests/docs-check.js`](../../tests/docs-check.js)):** the test kind, then the check's exact name in backticks. smoke `…` is a check message in [`tests/smoke.js`](../../tests/smoke.js); engine `…`, golden `…` and insights `…` are test names in [`tests/engine.test.js`](../../tests/engine.test.js), [`tests/demo-golden.test.js`](../../tests/demo-golden.test.js) and [`tests/insights.test.js`](../../tests/insights.test.js). Several names can follow one kind: smoke `…`, `…` and `…`. The invariants ([`tests/engine-invariants.test.js`](../../tests/engine-invariants.test.js)) and the data check ([`tests/data-check.js`](../../tests/data-check.js)) build their messages at run time, so they are described in words, in parentheses. `node tests/docs-check.js` fails when a named check does not exist word for word.
>
> **How a participant is quoted, once interviews exist:** a participant's own words go in curly quotes, on the line that names the interview by its number or the survey response by its row (S1 in `evidence.md` §1b). Every such quote must already be in `evidence.md` word for word, and every interview cited must be a filled row of `evidence.md` §1. `tests/docs-check.js` checks both in every file in `docs/design/`, and also checks straight-quoted text on a line that names an interview or a respondent, and a blockquote that starts with a quotation mark. App copy is quoted with straight quotes, as below; a user story is a blockquote that starts with "As the owner".

Every story has the same user: the owner of a 5–50 person firm that sells to the public sector and has no bid manager ([`BRIEF.md`](../../BRIEF.md) → "User"). There is no persona yet; that is T9 and waits for interviews.

| # | Story | Serves | Derived from | Main route |
|---|---|---|---|---|
| US1 | Draft my profile from our website | H1 | NAVIGATION.md screens S1–S3 | `#/welcome/1` → `/2` → `/3` |
| US2 | A morning feed with a verdict per tender | H1, H2 | Solution 1 · flow 1 | `#/feed` |
| US3 | Check every hard requirement against my profile | H2 | Solution 2 | `#/t/:id` |
| US4 | See the sentence that proves each line | H2, H3 | Solution 2 · flow 2 | `#/t/:id/req/:rid` |
| US5 | Unsure lines come to me, never a guessed pass | H2 | Solution 3 · flow 2 | `#/t/:id/req/:rid` |
| US6 | Ask the tender a plain question | H2, H3 | Solution 4 | `#/t/:id` |
| US7 | See what a certificate would unlock | H2 | Solution 5 · flow 3 | `#/company` |
| US8 | Save a tender and track it to submission | H1 | flow 1 · NAVIGATION.md screen S7 | `#/t/:id` → `#/bids` |
| US9 | Skip a tender and say why | H1, H3 | flow 4 | `#/t/:id/skip` |
| US10 | Know what is real, simulated and fictional | H2 | About (now on Settings) · `CLAUDE.md` §7 | `#/settings` (alias `#/about`) |
| US11 | Get the morning count without opening the app | Team request, no hypothesis tested | `CLAUDE.md` §11 item 120 · NAVIGATION.md entry points, screen S9 | overlay on `#/feed` |
| US12 | See who else is likely to bid | Team request, no hypothesis tested | commit `4559372` · NAVIGATION.md screen S5 | `#/t/:id` |
| US13 | See how our past bids ended | Team request, no hypothesis tested | `CLAUDE.md` §11 item 122 · flow 5 | `#/bids` → `#/insights` |
| US14 | See the profile every tender is checked against | Team request, no hypothesis tested | commit `b3f8ec2` · flow 6 | `#/profile` |
| US15 | Find appearance, the demo reset and the disclosure in one tab | Team request, no hypothesis tested | `CLAUDE.md` §11 item 121 · NAVIGATION.md screen S8 | `#/settings` |

Tests named below: [`tests/engine.test.js`](../../tests/engine.test.js) (engine), [`tests/demo-golden.test.js`](../../tests/demo-golden.test.js) (golden), [`tests/insights.test.js`](../../tests/insights.test.js) (insights), [`tests/engine-invariants.test.js`](../../tests/engine-invariants.test.js) (invariants), [`tests/data-check.js`](../../tests/data-check.js) (data check) and [`tests/smoke.js`](../../tests/smoke.js) (smoke).

---

### US1 · Draft my profile from our website · H1
> As the owner of a 5–50 person firm with no bid manager, I want TenderScout to draft my company profile from our website, so that I get my first verdicts without filling in a form.

1. On `#/welcome/1` the owner types the company website and taps "Draft my profile". The reading screen `#/welcome/2` lists its steps with the "Simulated AI" label and is replaced in history, so Back never returns to it. Locked by smoke `reading screen shows "Simulated AI"`.
2. `#/welcome/3` shows the drafted profile (staff, turnover, references, sectors, certificates, bid languages, countries) with "Edit" (→ `#/company`) and "Looks right" (→ Feed). The company name keeps "(fictional)". Locked by smoke `profile keeps "(fictional)" on the company name` and the data check (the profile name must carry "(fictional)").
3. During onboarding the tab bar is hidden. Locked by smoke `no tab bar during onboarding`. Before onboarding, every route except Welcome, Company and Settings (or `#/about`) redirects to Welcome: not locked by a test.

### US2 · A morning feed with a verdict per tender · H1, H2
> As the owner of a 5–50 person firm with no bid manager, I want each morning's new tenders to arrive with a Go / Maybe / No-go verdict and a fit score, so that I know which ones are worth opening before I read anything.

1. `#/feed` ranks open tenders Go → Maybe → No-go → Closed, then by score, then by days left. Locked by engine `ranking: Go before Maybe before No-go`, invariants (rank order on 200 random rankings) and golden `the Feed after onboarding: 6 open tenders, 1 Go · 2 Maybe · 3 No-go, Ellerbach Go 100 first`.
2. Each card shows the verdict as shape + word + score, then title, buyer, value and days left, never colour alone. Locked by smoke `card = verdict (shape + word + score), title, buyer, value, days left`. The one-line reason the brief promises sits on the tender detail, not on the card (removed from cards in the 4 Nov declutter, `CLAUDE.md` §11 item 56).
3. The filter tabs All / Go / Maybe / No-go carry the counts, and the pages line reads "Thu 5 Nov · read 777 pages in 4 languages" with "Simulated AI" on it. Locked by smoke `Maybe filter shows 2 cards` and `pages line: "Thu 5 Nov · read 777 pages in 4 languages" with the "Simulated AI" label on it (not in the nav)`, and golden `the pages line: "read 777 pages in 4 languages"`.
4. The verdict follows one rule: Go needs a score of 70 or more with no fail, no open check and at most one risk; any fail is No-go; everything else is Maybe. Locked by engine `clean match is Go` and invariants ("Go needs score ≥ 70, no fail, no review, ≤ 1 risk, a sector match", "Maybe is the rest").

### US3 · Check every hard requirement against my profile · H2
> As the owner of a 5–50 person firm with no bid manager, I want every hard requirement in a tender ticked off against my company profile, so that I see in one list whether we can qualify and what rules us out.

1. On `#/t/:id`, "Can you qualify?" lists every requirement with its status as shape + word (■ Fails, ◆ Needs your check, ▲ Risk, ● Meets), fails first, with "N of M met". Locked by smoke `requirement order fail → check → met` and `the "Needs your check" line carries the ◆ diamond, and every shape has a kind`.
2. The typed rules: turnover below the minimum fails; a missing certificate fails, or is a risk when subcontracting is allowed; references short by one are a risk, by two or more a fail; a bid language the firm does not cover is a risk; delivery outside the home countries is a risk with cross-border on and a fail with it off; a mandatory site visit is always a risk. Locked by engine `turnover below minimum is a knock-out, score capped`, `missing mandatory certificate is a knock-out`, `short by exactly one reference is a risk, by two is a fail`, `foreign bid language is a risk and adds effort` and `no cross-border appetite makes foreign delivery a fail`, and invariants (the per-requirement rules on 3,000 random cases).
3. Any failing line makes the tender No-go with a score of 25 at most, and the header says why in a sentence ("1 knock-out requirement: you don’t hold ISO 27001. One more needs your answer."). Locked by invariants ("a fail must give No-go", "No-go score capped at 25"), engine `detail headline explains the knock-out and the open question` and golden `Landkreis Hohenau opens as No-go 25 with the demo profile (BRIEF step 4)`.
4. The first open of a tender shows "Reading N pages (language)…" with "Simulated AI" before the check appears. Locked by smoke `loading state "Reading 146 pages (German)…"`.

### US4 · See the sentence that proves each line · H2, H3
> As the owner of a 5–50 person firm with no bid manager, I want each line to show the original sentence, its translation and the page it comes from, so that I can trust a verdict on a tender written in a language I don't read.

1. Tapping a line opens the requirement sheet `#/t/:id/req/:rid`: the status, the AI confidence in %, "Original (German) · Vergabeunterlagen, p. 12, §3.1", the source sentence with the decisive phrase underlined, and the English translation. Locked by smoke `requirement sheet is a modal dialog`, `quote caption "Original (German) · Vergabeunterlagen, p. 23, §4.2" in regular text` and `status and "Simulated AI" as plain text in the sheet`, engine `demo data: every requirement highlight is inside its original sentence; every tender names its document`, and the data check (every cited page lies inside the tender's page count).
2. The sheet is its own history entry: Back, Escape and a tap on the scrim close it to the detail. Locked by smoke `Back closes the sheet to the detail`, `Escape closes the sheet` and `scrim tap closes the sheet`.
3. The source sentence carries its language (`lang="de"` and so on) so a screen reader pronounces it correctly. Locked by smoke `quote has lang="de" and an underlined phrase (no tinted mark)`.

### US5 · Unsure lines come to me, never a guessed pass · H2
> As the owner of a 5–50 person firm with no bid manager, I want the app to tell me when the AI is unsure how to read a requirement and let me answer it, so that a verdict never rests on a guess.

1. A line read with confidence under 70% shows ◆ "Needs your check" with its confidence and a 44 px "Check" call to action. It never counts as a pass and it blocks a Go. Locked by engine `low AI confidence becomes review, never pass`, invariants ("confidence … must be review, never pass") and smoke `the "Needs your check" line shows a 44 px "Check" call to action, the other lines do not`.
2. On the sheet, "We meet it" and "We don't meet it" have equal weight and neither is preselected. Hohenau's "comparable qualification" line reads 58%. Locked by smoke `unresolved sheet: both answers equal weight, none preselected` and `confidence readout 58%`.
3. Answering closes the sheet, re-scores the tender and shows "Answer saved · now No-go" with Undo. The answer is kept per tender. Locked by smoke `"We meet it" closes the sheet` and `toast: answer saved, still No-go`, and engine `user can confirm a requirement as fail`.
4. Answering "We meet it" never lowers a score or a verdict. Locked by invariants (overriding any non-pass line to pass, on every random case).

### US6 · Ask the tender a plain question · H2, H3
> As the owner of a 5–50 person firm with no bid manager, I want to ask a tender plain questions and get answers with page numbers, so that I don't have to search a 150-page pack for the subcontracting or penalty clause.

1. On `#/t/:id`, "Ask this tender" lists the questions for that tender (Hohenau: "Can we subcontract the audit?"). Tapping one shows the answer with its page in regular text ("Vergabeunterlagen, p. 12"), labelled "Simulated AI". Locked by smoke `answer cites the page in regular text` and the data check (every page cited in an answer lies inside the tender's page count).
2. A tender with no questions shows no "Ask this tender" section (Centre Hospitalier de Morlanne). Not locked by a test.
3. Not in the prototype: answers are pre-written, and the owner cannot type a question of their own.

### US7 · See what a certificate would unlock · H2
> As the owner of a 5–50 person firm with no bid manager, I want to change my profile (a certificate, a reference, a bid language, cross-border work) and see every verdict update at once, so that I know which certificate or partner is worth the investment.

1. `#/company` has turnover, a references stepper, the four certificates, five bid languages and cross-border as controls. Each change re-scores all six tenders at once with the same rules. Locked by smoke `switch is on (role=switch, aria-checked)` and `bid languages are rows with switches`.
2. A hint under each switch says what turning it on would change, without changing anything ("Turn on → Gemeente Vlietdam becomes Maybe"). Locked by engine `whatIf: VCA unlocks Vlietdam as Maybe; Spanish unlocks Valdemora as Go; +1 reference unlocks Kaltbrunn` and `whatIf does not change the profile it is given`, and smoke `VCA hint: Vlietdam becomes Maybe`.
3. ISO 27001 alone moves Landkreis Hohenau from No-go 25 to Maybe 90, and the re-score card says so. After "We meet it" on the unclear line, ISO 27001 moves it to Go 100 and the Feed counts move from 1 · 2 · 3 to 2 · 2 · 2. Locked by golden `ISO 27001 alone moves Hohenau to Maybe 90 (the honest intermediate state)`, `"We meet it" on the unclear line, then ISO 27001: Hohenau No-go 25 → Go 100 (BRIEF step 5, the hero moment)` and `after the flip the Feed counts are 2 Go · 2 Maybe · 2 No-go`, and smoke `ISO 27001 alone: re-score card says No-go → Maybe` and `Hohenau card is now Go`.
4. Turning cross-border off can only make verdicts drop. Locked by engine `diff: turning cross-border off only produces drops`.

### US8 · Save a tender and track it to submission · H1
> As the owner of a 5–50 person firm with no bid manager, I want to save a tender I will bid on and move it from Deciding to Bidding to Submitted, so that I can see what I am working on and which deadline comes next.

1. On `#/t/:id`, "Save to Bids" turns into "In Bids · Deciding", a toast "Saved to Bids" offers View, and the Feed card carries a plain "Saved". Locked by smoke `Save becomes "In Bids · Deciding"`, `toast "Saved to Bids"` and `the saved card carries a plain "Saved" marker`.
2. `#/bids` groups saved tenders by Deciding / Bidding / Submitted with a stage switch on each card, and says how many are saved and when the next deadline is. Locked by smoke `stage switch to Bidding` and `Bids sub line` ("1 saved · next deadline in 29 days").
3. A tender on or past its deadline is Closed with score 0 and cannot be saved ("Closed tenders can't be saved"). Locked by engine `past deadline is closed with score 0`, invariants ("deadline passed must be closed", "closed score is 0") and smoke `Save disabled with the lock line`.
4. With nothing saved or skipped, Bids says "No bids yet" under the Win/loss row. Locked by smoke `the Win/loss link shows on an empty Bids too (past results are history)`, which runs once the smoke path has waited for "No bids yet".

### US9 · Skip a tender and say why · H1, H3
> As the owner of a 5–50 person firm with no bid manager, I want to skip a tender in two taps and optionally say why, so that it leaves my feed and I can still find it if I change my mind.

1. "Skip" on `#/t/:id` opens `#/t/:id/skip` with six optional reasons (Too big for us, Missing a certificate, Wrong region, Not enough time, Price-only, Other): any number, or none. Locked by smoke `skip reason selected (plain rectangle, brand when on)`.
2. "Skip tender" returns to the Feed, the card is gone, and a toast says "Skipped. Reason saved." with Undo. Locked by smoke `skip returns to the Feed`, `skipped card is gone` and `toast "Skipped. Reason saved."`.
3. Bids → Skipped lists the tender with its reasons. Locked by smoke `skipped row shows the reason`. Restore moves it back to Deciding: not locked by a test.
4. Not in the prototype: the reasons are stored but do not change the ranking yet. The sheet's line "Reasons tune tomorrow's feed" describes the intended product (`docs/NAVIGATION.md` screen S5b marks it as future).

### US10 · Know what is real, simulated and fictional · H2
> As the owner of a 5–50 person firm with no bid manager, I want to know which parts of an answer come from AI and which come from fixed rules, so that I can judge how far to trust a verdict before I put effort into a bid.

1. `#/settings` (the Settings tab; the ⓘ in the headers and the old `#/about` link open it), under "About this prototype", says that AI output is simulated, that the decision logic is real, tested code, that all data is fictional, and that the build was AI-assisted, without naming files. Locked by smoke `About explains simulated / real / fictional / AI-assisted` and `About names no files or dev notes`, and the data check (the About row "All data is fictional").
2. "Simulated AI" shows as plain text wherever AI output shows: the reading screen, the profile check, the Feed's pages line, "In short", Competition, "Ask this tender" and the requirement sheet. Locked by the data check (the label helper still renders "Simulated AI" and those screens still call it) and smoke `reading screen shows "Simulated AI"` and `status and "Simulated AI" as plain text in the sheet`.
3. "All companies and tenders are fictional" sits on Welcome, the Feed, the tender detail and Bids, and every name in the data ends in "(fictional)". Locked by smoke `fictional line on Welcome`, `fictional line on Feed` and `fictional line on Bids`, and the data check (company and buyer names).
4. "Reset demo" (Settings → Demo) asks to confirm, then starts fresh; `?demo=reset` does the same. Locked by golden `a fresh state (what ?demo=reset and "Reset demo" write) is the demo profile, not onboarded, with nothing saved` and `?demo=reset wipes the state, keeps ?demo=fast, drops "reset" from the address and lands on #/welcome/1`, and smoke `?demo=reset writes a fresh tenderscout.v2 (not onboarded, no answers, saved or skipped tenders, demo profile)`.

### US11 · Get the morning count without opening the app · team request, no hypothesis tested
> As the owner of a 5–50 person firm with no bid manager, I want one notification each morning that says how many new tenders I qualify for, how many miss something small and how many I don't qualify for, so that I know whether the Feed is worth opening today.

1. Once a day, the first time the Feed opens after onboarding on a new day, a lock screen covers the app: "Simulated notification", the date ("Thursday 5 November"), 7:00 and one card, "TenderScout · now", with ● Go, ▲ Maybe and ■ No-go counts from the engine (skipped tenders left out). Go means the firm qualifies, Maybe that something small is missing, No-go that it does not qualify. Locked by smoke `morning notification: first Feed open of a new day shows the simulated lock screen (dialog, "Simulated notification", the date)` and `morning notification: "1 Go · 2 Maybe · 3 No-go" from the engine, each with its shape`.
2. Tapping the notification opens the Feed. Locked by smoke `morning notification: tapping it opens the Feed`. That it also sets the filter back to All is not locked by a test.
3. It shows once a day: not again the same day, and not on the demo day of a fresh state, so `?demo=reset` and the BRIEF demo path never see it. Locked by smoke `morning notification: once a day (a reload the same day does not show it again)` and `morning notification: not shown again on the day a fresh state was written`, and golden `a fresh state (what ?demo=reset and "Reset demo" write) is the demo profile, not onboarded, with nothing saved` (a fresh state counts as notified on the demo day). That it never shows with the test-only `?today=` is not locked by a test.
4. Settings → "Show this morning’s notification" replays it, and Escape closes it. Locked by smoke `morning notification: About replays it and Escape closes it`. `?demo=morning`, ✕ and a tap on the empty lock screen: not locked by a test.
5. Not in the prototype: nothing is sent to the phone. The notification is shown inside the app, and Settings says so; real push is out of scope (`CLAUDE.md` §10).

### US12 · See who else is likely to bid · team request, no hypothesis tested
> As the owner of a 5–50 person firm with no bid manager, I want to see who won similar contracts and roughly what my chance is, so that I can judge whether a tender I qualify for is worth a bid.

1. On `#/t/:id`, after "Can you qualify?", a Competition section lists the likely bidders (name, wins out of the similar past awards, references) and the similar past awards (title, buyer, year, winner, number of bidders, value). This part stands for an AI reading of past award notices: it is simulated and labelled "Simulated AI", and every rival and award is fictional demo data. Locked by smoke `Competition section: chance to win, likely bidders, similar past awards` (on Kaltbrunn). The "Simulated AI" label on this section is not locked by a test.
2. The chance to win is plain rules, not AI: one over the average number of bidders on the similar awards, lower when one rival won two or more of them, higher or lower by the firm's references against the strongest rival's, read as Good, Fair or Low chance with "About 1 in N" (Kaltbrunn: "Fair chance · About 1 in 5"). The section says "Rough estimate from past awards with plain rules, not AI." Locked by smoke `Competition section: chance to win, likely bidders, similar past awards` (it checks that Kaltbrunn starts with "Fair chance"). The arithmetic has no unit test: not locked by a test.
3. The chance to win does not change the score or the verdict, and the section says so ("It does not change the score."). Not locked by a test; `engine.js` takes no competition input, so the demo pins hold (golden `Landkreis Hohenau opens as No-go 25 with the demo profile (BRIEF step 4)`).
4. On a No-go the chance reads "Qualify first", because a knock-out excludes the bid before price or quality count; on a Maybe it adds "Only once you clear the open points above."; a Closed tender has no Competition section. Not locked by a test.
5. Not in the prototype: real rivals and awards would come from the EU's award notices; here they are pre-written and fictional.

### US13 · See how our past bids ended · team request, no hypothesis tested
> As the owner of a 5–50 person firm with no bid manager, I want to see how often we win, by area, and why we lose, so that I know where our bids fall short.

1. A "Win/loss insights" row at the top of `#/bids` reads "8 of 21 won · 38% in the last 12 months" and opens `#/insights`; it also shows on an empty Bids. Locked by smoke `Bids links to Win/loss insights with the win rate` and `the Win/loss link shows on an empty Bids too (past results are history)`.
2. Four figures: the win rate (38%, 8 of 21 won), the contract value won (€2.3M), the bids lost (13) and how far above the winner the firm was when it lost on price (6.8% on average). Locked by smoke `Win/loss tiles: 38 %, 8 of 21 won, €2.3M, 6.8 % above the winner` and insights `demo pins: 8 of 21 won (38 %), €2.3M won, 6.8 % above the winner on price, price is the top reason`.
3. Win rate by area, best first (Telecom equipment, IT services, Installation, Construction work), counting the bids of the 12 months before today. Locked by smoke `win rate by area, best first`, and insights `areas are sorted by win rate, then by number of bids, then by code; rates are whole percents` and `only the 12 months before today count (today included, the same day a year ago excluded)`.
4. "Why you lost" opens with one sentence ("You lose most often on price: 6 of 13 lost bids, on average 6.8% above the winner.") and lists the reasons with their counts. Locked by smoke `why you lost: price first, with the average gap to the winner`, and insights `loss reasons: most frequent first, ties in the fixed order, unknown or missing reasons count as "No feedback yet"` and `the headline price gap averages only the bids lost on price that have both prices`.
5. The page says the numbers are plain arithmetic, not AI, and that every past bid is fictional. It shows no AI output, so it carries no "Simulated AI" label. Locked by smoke `Win/loss says the past bids are fictional and the numbers are not AI`, insights `demo data: every past bid is fictional, inside the window, in one of the firm's areas, with a known outcome`, and the data check (every past bid's buyer ends in "(fictional)").
6. It is a page of Bids: the tab bar stays with Bids active, and ‹ Back returns to Bids, also after a deep link. Locked by smoke `Win/loss keeps Bids active in the tab bar`, `Back from Win/loss returns to Bids` and `deep link #/insights: Back lands on Bids`.
7. Without past bids the page says "No results yet": not locked by a test (the arithmetic for an empty list is: insights `empty input: zeros, no division by zero, nulls where nothing can be computed`).
8. Not in the prototype: the results would come from the EU's award notices and the reasons from the owner's own debrief notes; the 21 past bids are pre-written. The prototype records no decision time, so no "average go / no-go time" is shown (`CLAUDE.md` §11 item 122).

### US14 · See the profile every tender is checked against · team request, no hypothesis tested
> As the owner of a 5–50 person firm with no bid manager, I want one screen that shows the company profile TenderScout checks every tender against, so that I can see at a glance what it assumes about my firm.

1. The Profile tab `#/profile` shows the profile card, read only: the name with "(fictional)", city, staff, turnover, references, sectors, certificates, bid languages and countries. Locked by smoke `Profile tab: the company profile and Edit on Company` and `five tabs: Feed, Bids, Company, Profile, Settings`.
2. Profile shows the firm; Company changes it. The only control is "Edit on Company", which opens `#/company`. Locked by smoke `Profile tab: the company profile and Edit on Company` (it checks the button and its target).
3. The card is the one on Check your profile (`#/welcome/3`) without the AI's sources line, and a change made on Company shows on Profile straight away (both read the same stored profile). Not locked by a test.
4. Before onboarding `#/profile` redirects to `#/welcome/1`. Not locked by a test.

### US15 · Find appearance, the demo reset and the disclosure in one tab · team request, no hypothesis tested
> As the owner of a 5–50 person firm with no bid manager, I want one tab for how the app looks, the demo reset and what is real in the prototype, so that I can find them from any screen with a tab bar.

1. `#/settings` is the fifth tab: active in the tab bar, with no Back button, and the header holds the wordmark only. Locked by smoke `Settings is a tab: active in the tab bar, no Back button`.
2. The ⓘ in the headers opens it, and the old `#/about` link opens the same tab. Locked by smoke `the header ⓘ opens Settings` and `the old #/about deep link opens the Settings tab`.
3. It holds Appearance (System / Light / Dark, kept across a reload), Morning notification (the replay of US11), Demo (Reset demo, US10) and About this prototype (US10). Locked by smoke `Settings has Appearance, Demo and About this prototype`, `appearance persists across a reload` and `morning notification: About replays it and Escape closes it`.
4. Before onboarding Settings has no tab bar and keeps ‹ Back. Not locked by a test.

---

## Pending (waits for real interviews)
- **Interview links on every story:** after T1, add the interview numbers that support or contradict each story, and drop or rewrite any story the evidence does not back. US11–US15 get a hypothesis tag only if an interview gives them one.
- **Persona and "How might we" statements:** T9 in [`docs/START_HERE.md`](../START_HERE.md). Not written here on purpose: a persona built before interviews would be invented.
- **User-journey map:** T10. Same reason.
- **Stories for later features** (a real push for the morning notification, consortium-partner finder, calendar export, sharing a verdict, opening the tender PDF at the cited page): listed as "Later" in [`docs/NAVIGATION.md`](../NAVIGATION.md#screen-list), and T5–T7 in [`docs/START_HERE.md`](../START_HERE.md). They get stories when they are built.
