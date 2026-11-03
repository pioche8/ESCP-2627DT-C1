# TenderScout (ESCP-2627DT-[team])

**AI reads new EU public tenders in any language and tells a small firm, in one line and with the page that proves it, whether it can actually bid.**

ESCP Digital Transformation (MG34) · Digital Product Design · Group C · Workshop Thu 5 Nov 2026
Team: [names] · Lecturer: `@drdml`

| | |
|---|---|
| Idea brief and pitch | [`BRIEF.md`](BRIEF.md) |
| Stakeholder evidence | [`evidence.md`](evidence.md) |
| Interview kit | [`docs/INTERVIEW_KIT.md`](docs/INTERVIEW_KIT.md) |
| Navigation map and flows | [`docs/NAVIGATION.md`](docs/NAVIGATION.md) |
| Visual design spec (source of truth) | [`DESIGN.md`](DESIGN.md) |
| Build handoff for Claude Code | [`CLAUDE.md`](CLAUDE.md) |
| Live prototype | `https://<github-user>.github.io/ESCP-2627DT-<team>/` |

## Prototype
Mobile-first static web app: plain HTML/CSS/JS, no build step, no dependencies.

```
index.html     app shell
styles.css     DESIGN.md "Bold" visual system: tokens, components, light + dark
fonts/         vendored Hanken Grotesk, IBM Plex Mono, Material Symbols subset (no CDN)
app.js         screens + hash router (#/feed, #/t/:id, #/bids, #/company, #/about)
engine.js      REAL CODE: qualification check, score, Go/Maybe/No-go verdict (unit-tested)
ai.js          SIMULATED AI: tender reading, Q&A, profile drafting (pre-written output)
data.js        FICTIONAL demo company and 6 fictional tenders (DE, AT, ES, NL, FR)
tests/         node tests/engine.test.js   (24 tests: the original 14 + 10 for the restyle)
               node tests/smoke.js         (optional Playwright smoke test, 390×844, light + dark)
tests.html     same engine tests in the browser
```

**Run locally:** open `index.html`, or `python3 -m http.server` and go to `http://localhost:8000`.
**Reset the demo:** add `?demo=reset` to the URL, or ⓘ → Reset demo.
**Test-only URL options:** `?today=2026-12-23` shows the Closed state (deadlines passed); `?offline=1` shows the offline banner. Without them the demo date stays fixed at Thu 5 Nov 2026.
**Deploy:** repo Settings → Pages → Deploy from branch `main`, folder `/ (root)`.

### What's real and what's simulated
- **Real:** the decision logic. Change the profile (turnover, certificates, references, languages) and every verdict is recalculated by `engine.js`. Covered by tests.
- **Simulated:** anything a language model would do (reading PDFs, translating, answering questions). Marked "Simulated AI" in the UI. No API keys, no data leaves the phone.
- **Fictional:** every company, buyer, tender, quote and page number in `data.js`. Not evidence.

## Repo setup checklist (before Thu 5 Nov, 09:00)
- [ ] Create repo `ESCP-2627DT-<team>` (public), push these files
- [ ] Invite all members + `@drdml`
- [ ] Enable GitHub Pages and paste the URL above
- [ ] `git tag v0-shell` **before interview #1** (proves the hypotheses and gate in evidence.md came first)
- [ ] Interviews → `evidence.md` → gate verdict Tue 18:00
- [ ] Update `data.js` / copy with what the evidence changed → `git tag v1-workshop`
- [ ] Rehearse the 75-second demo on a real phone (BRIEF.md) and keep a screen recording as backup

## AI use (ESCP policy disclosure)
- **Claude (Anthropic):** idea selection support, v0 prototype scaffold (all code in this commit), brief draft, interview kit and templates, desk research summary. Session date: 2 Nov 2026.
- **Codex / ChatGPT Edu:** [changes made during the workshop]
- **Figma:** [flows / screens, if used]
- **The team:** all stakeholder interviews and notes, insights, gate decision, final product decisions.
- **Claude Code (Anthropic), 2 Nov 2026:** restyled the prototype to `DESIGN.md` ("Bold" v2.0) from the team's handoff (`CLAUDE.md`). Changed: new `styles.css` (tokens, light + dark), vendored fonts in `fonts/`, all `app.js` render functions and the new states (reading, loading, closed, empty, offline, saved, skipped), progress callbacks in `ai.js`, optional `doc`/`highlight` display fields in `data.js`, and new engine functions for reason lines, the Company re-score card and unlock hints (`reasonLine`, `headline`, `verdicts`, `diff`, `whatIf`) with 10 new tests. Not changed: `evaluate()`, `rank()` and their results, the original 14 tests, and the demo data values. Four DESIGN.md colours were adjusted to pass WCAG AA (listed at the top of `styles.css`). Fixed the workshop date to Thu 5 Nov in the docs. Every decision where DESIGN.md and the handoff conflicted was made by the team (log in `CLAUDE.md` §11).
