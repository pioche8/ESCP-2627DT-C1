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
| Live prototype | `https://<github-user>.github.io/ESCP-2627DT-<team>/` |

## Prototype
Mobile-first static web app: plain HTML/CSS/JS, no build step, no dependencies.

```
index.html     app shell
app.js         screens + hash router (#/feed, #/t/:id, #/bids, #/company, #/about)
engine.js      REAL CODE: qualification check, score, Go/Maybe/No-go verdict (unit-tested)
ai.js          SIMULATED AI: tender reading, Q&A, profile drafting (pre-written output)
data.js        FICTIONAL demo company and 6 fictional tenders (DE, AT, ES, NL, FR)
tests/         node tests/engine.test.js   (14 tests)
tests.html     same tests in the browser
```

**Run locally:** open `index.html`, or `python3 -m http.server` and go to `http://localhost:8000`.
**Reset the demo:** add `?demo=reset` to the URL, or ⓘ → Reset demo.
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
