# Claude Code handoff: TenderScout prototype

> Put this file in the repo root (you can rename it to `CLAUDE.md` so Claude Code loads it automatically). Put the new **`DESIGN.md`** next to it.
> **`DESIGN.md` is the only source of truth for visual design.** Ignore every colour, font, spacing and component style in the existing `styles.css` and in the old design brief. They are superseded.

## 1. Context
- **Course:** ESCP Digital Transformation (MG34), Digital Product Design module. Group C workshop **Wed 5 Nov 2026, 09:00**. Lecturer: David Lehmann (GitHub `@drdml`).
- **Repo:** `ESCP-2627DT-<team>`, public, deployed with GitHub Pages from `main` / root.
- **Goal for this session:** restyle and extend the existing working prototype to match `DESIGN.md`, without breaking the decision logic or its tests.

## 2. Product (what must stay true)
TenderScout reads new EU public tenders in any language and tells the owner of a 5–50 person firm, on their phone, **Go / Maybe / No-go**, with a 0–100 fit score. Each requirement cites the page and original sentence that proves it.
- **Users:** owner or managing director of a small firm selling to the public sector. One hand, short sessions, plain language.
- **Core promise:** "Can we even bid on this?" answered in under 60 seconds, with proof.
- **Split of responsibility (keep it):**
  - **AI** (simulated in `ai.js`): reads tender packs, extracts requirements with citations and confidence, translates, answers questions, drafts the company profile.
  - **Plain code** (`engine.js`): decides knock-outs, score and verdict. It is deterministic and tested.

## 3. Current codebase (working, tested)
```
index.html          shell; loads engine.js → data.js → ai.js → app.js as classic scripts (works from file:// too)
styles.css          OLD visual design → replace per DESIGN.md
app.js              UI rendering + hash router + event delegation + state/localStorage
engine.js           REAL decision logic (UMD: window.Engine in browser, module.exports in node)
data.js             FICTIONAL demo company + 6 fictional tenders (window.DEMO / module.exports)
ai.js               SIMULATED AI layer (promises with delays, pre-written output)
tests/engine.test.js   14 node tests: `node tests/engine.test.js`
tests.html          runs the same tests in a browser via a small require/assert shim
BRIEF.md, evidence.md, docs/INTERVIEW_KIT.md, docs/NAVIGATION.md   project docs (don't restyle, keep content)
```
No build step and no dependencies. Keep it that way unless `DESIGN.md` truly needs something. If it does, use CDN-free, vendored assets only, and it must still run from GitHub Pages and `file://`.

## 4. Engine rules (do not change behaviour; tests lock these)
- Per-requirement status: `pass | risk | fail | review`.
  - AI `confidence < 0.7` → `review` (never pass) unless the user confirmed it (`overrides[tenderId][reqId] = 'pass'|'fail'`).
  - `min_turnover`: below → `fail`.
  - `certification`: missing → `fail`, or `risk` if `subcontractAllowed`.
  - `min_references`: short by 1 → `risk`, by 2+ → `fail`.
  - `language`: not in profile → `risk` (adds 10 h of effort).
  - `region`: not a home country → `risk` if `crossBorder`, else `fail`.
  - `site_visit` → always `risk`.
- Score = sector fit 40 (CPV division overlap) + size fit 20 + requirements 30 (pass 1, risk 0.5, review 0) + time 10 (≥21 days: 10, ≥10: 5, >0: 2).
- Verdict:
  - deadline passed → `closed` (score 0)
  - any fail or no sector match → `nogo` (score capped at 25)
  - score ≥ 70, no review and ≤ 1 risk → `go`
  - otherwise `maybe`
- Ranking: go → maybe → nogo → closed, then by score, then by days left.
- Demo "today" is fixed at `2026-11-05` (`DEMO.DEMO_TODAY`) so the demo is stable.
- The effort estimate is a labelled, unvalidated heuristic.

If a design change needs new engine output (e.g. a "what would flip this" hint), **add** functions and tests. Don't alter existing return shapes without updating `app.js` and the tests.

## 5. Routes and screens (keep the information architecture; apply DESIGN.md visuals)
| Route | Screen | Must keep |
|---|---|---|
| `#/welcome/1` | Welcome + website input | "Draft my profile" → simulated AI |
| `#/welcome/2` | Reading (transient) | replaced in history (`location.replace`) |
| `#/welcome/3` | Check AI-drafted profile | Edit / Looks right |
| `#/feed` | Feed: summary counts, filters All/Go/Maybe/No-go, tender cards | skipped tenders hidden; "Saved" marker |
| `#/t/:id` | Tender detail: verdict, AI summary, qualification checklist (fails first), Ask this tender, Skip / Save | first open shows "Reading N pages (lang)…" |
| `#/t/:id/req/:rid` | Requirement bottom sheet: status, confidence %, citation, original sentence + translation, We meet it / We don't, Undo | sheet is its own history entry; Back, Escape and scrim tap close it to the parent |
| `#/t/:id/skip` | Skip-reason sheet | reason saved, toast, back to Feed |
| `#/bids` | Deciding / Bidding / Submitted + Skipped (Restore) | stage switcher |
| `#/company` | Profile levers: turnover, references stepper, certificate toggles, languages, cross-border | live re-score + delta banner "Hohenau: No-go → Go" (**hero demo moment**) |
| `#/about` | AI disclosure, demo-data notice, Reset demo | reachable from header ⓘ |

- Bottom tabs: Feed / Bids / Company. They are hidden during onboarding.
- Before onboarding, any route except welcome, company or about redirects to `#/welcome/1`.
- Unknown route → Not found with a link to the Feed.
- If `DESIGN.md` changes the IA (tab names, screen order, new screens), follow `DESIGN.md`, update `docs/NAVIGATION.md` to match, and keep deep links and back behaviour working.

## 6. State
- One `localStorage` key, `tenderscout.v1`: `{ onboarded, profile, overrides, saved, skipped, filter }`. All access goes through try/catch with an in-memory fallback (private mode).
- `?demo=reset` wipes state and returns to welcome.
- If the state shape changes, bump the key to `tenderscout.v2` rather than migrating.

## 7. Non-negotiables (course rules and honesty)
1. **"Simulated AI" label** stays visible on every screen that shows AI output. Styling follows `DESIGN.md`, but it must not disappear.
2. **No live AI calls and no API keys** in the repo (the site is public).
3. **All demo data stays fictional** and marked "(fictional)". Never add real company names as customers, and never put invented figures in `evidence.md`.
4. **The About screen** keeps its explanation: what is simulated, what is real code, that the data is fictional, and that the build was AI-assisted.
5. **Accessibility:** tap targets ≥ 44 px, verdicts never shown by colour alone (icon + label), contrast WCAG AA, `prefers-reduced-motion` and dark mode respected (unless `DESIGN.md` says otherwise for dark mode), sheets use `role="dialog"` + `aria-modal`.
6. **Mobile-first at 390 px**, max content width about 480 px on desktop, safe-area insets for the iPhone home bar.
7. **README → "AI use"**: append what Claude Code changed in this session.

## 8. Tasks for this session (in order)
1. Read `DESIGN.md` fully. List any conflict with sections 4–7 and ask before resolving it.
2. Replace `styles.css` with the `DESIGN.md` system: tokens (colour, type, spacing, radius, elevation) as CSS custom properties, light and dark.
3. Update the markup in `app.js` render functions to the `DESIGN.md` components (verdict chip, tender card, requirement row, quote block, bottom sheet, tab bar, toggle, stepper, banner, toast). Keep the `data-*` attributes the event handler relies on: `data-go`, `data-act`, `data-filter`, `data-confirm`, `data-ask`, `data-skip`, `data-stage`, `data-unskip`, `data-cert`, `data-lang`, `data-ref`, `data-field`, `data-stop`.
4. Add any new screens or states that `DESIGN.md` specifies (empty states, closed tender, loading).
5. Run `node tests/engine.test.js` (must stay 14/14, plus any new tests).
6. Run a Playwright smoke test at 390×844. Click through: welcome → profile → feed → detail → requirement sheet → "We meet it" → Company → toggle ISO 27001 → expect the banner "Landkreis Hohenau: No-go → Go" → feed → skip a tender → Bids. Expect no console errors, and screenshot each screen.
7. Check dark mode and the 75-second demo path (`BRIEF.md`) on the real flow.
8. Commit, then tag `v1-workshop` once the team confirms. (`v0-shell` must already exist from before the interviews. Don't move it.)

## 9. Acceptance criteria
- [ ] Visuals match `DESIGN.md`. No leftover old styles.
- [ ] Engine tests pass in node and in `tests.html`.
- [ ] Smoke test passes with zero console errors at 390 px, light and dark.
- [ ] Hero moment works: the ISO 27001 toggle flips Hohenau No-go → Go with a visible banner.
- [ ] Back, Escape and scrim close sheets; deep links `#/t/<id>` work after onboarding.
- [ ] "Simulated AI" and fictional-data labels are present. No API keys.
- [ ] Works from GitHub Pages and from opening `index.html` directly.
- [ ] README "AI use" updated.

## 10. Out of scope
Real tender ingestion (TED API), real LLM calls, accounts/login, push notifications, payments, bid-writing features. Mention them as "later" in docs only.
