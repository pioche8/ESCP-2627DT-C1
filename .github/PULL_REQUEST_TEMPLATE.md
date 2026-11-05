## What and why
<!-- One or two sentences. If this is a task from docs/START_HERE.md, name it (T1–T10). -->

## Checks I ran
- [ ] `npm run preflight` is green (every gate below in one command; paste its output here), or the gates that apply, one by one:
- [ ] `node tests/engine.test.js` passes (24, plus my new tests)
- [ ] `node tests/data-check.js`, `node tests/demo-golden.test.js` and `node tests/engine-invariants.test.js` pass (if `data.js`, `engine.js` or `app.js` changed)
- [ ] `node tests/declutter-scan.js` reports 0 findings
- [ ] `node shared/build-tokens.js && node shared/check-contrast.js` reports 0 failures (only if `shared/tokens.json` changed)
- [ ] `node tests/smoke.js` passes with 0 console errors (if `app.js`, `styles.css`, `data.js` or `index.html` changed)
- [ ] `cd site && npm run check` passes (if `site/`, `shared/`, `data.js` or `engine.js` changed)
- [ ] Opened it on a phone or at 390 px, dark and light, and clicked what I built

## Rules (CLAUDE.md §4–§7)
- [ ] `engine.js` behaviour is unchanged, or I added a function with tests; `evaluate()` and `rank()` return the same shape
- [ ] Demo data is fictional and marked "(fictional)"; no real customer names; no API keys or live AI calls
- [ ] The "Simulated AI" label is visible wherever AI output shows
- [ ] Tap targets are at least 44 px; verdicts show a shape and a word, never colour alone
- [ ] If a demo number moved (tenders, counts, pages, languages, Hohenau 25 → 90 → 100), `tests/demo-golden.test.js`, `tests/smoke.js` and `BRIEF.md` are updated in this PR and the body says why
- [ ] `README.md` → "AI use" has a line if an AI tool helped; decisions taken alone are in `CLAUDE.md` §11
