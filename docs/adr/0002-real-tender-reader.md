# ADR-0002: A real tender read by a real model, as an off-by-default route on the website

**Status**: Proposed, not built
**Date**: 2026-11-06
**Deciders**: Claude Code (autonomous pass 2), council members Strategist, Advocate, Skeptic and Operator (session `2026-11-06-pass-2`). Building it needs the team and the lecturer (below). Recorded in `CLAUDE.md` §11.

## Context

- The brief for this pass listed, as candidate (e), "one real TED tender (api.ted.europa.eu) read by a real model, in a non-German source language", allowed only as a Vercel serverless route on the site, with the key in Vercel's environment, off by default, the app shipping no key and the engine staying deterministic.
- `CLAUDE.md` §7.2 is a non-negotiable of the course build: "No live AI calls and no API keys in the repo (the site is public)". A route that calls a model is a live AI call, even with the key outside the repository. A build session cannot amend a non-negotiable on its own.
- Today the AI layer is simulated: `ai.js` returns pre-written output from `data.js` after a delay, labelled "Simulated AI". The decision is plain code (`engine.js`), and that split (the AI reads, the rules decide) is the product's core claim (`BRIEF.md` "Why AI is necessary").
- The seam a real reader would plug into is not wired: `app.js` marks a tender as read and then evaluates `data.js` directly; what `AI.readTender()` returns is not used (`docs/reports/2026-11-06-pass-2-deepen.md` item 4).
- The contract a real reader's output must meet already exists in code: `tests/data-check.js` derives every field `engine.js` and `app.js` read (ids, CPV, value, ISO deadline, language, requirements with type, value, confidence, label and a citation inside the document's pages).
- From the build container `ted.europa.eu` and `api.ted.europa.eu` do not answer through the proxy; there is no model key; Vercel project creation is refused (ADR-0001). Nothing of (e) could be run or verified before the 11 Nov feedback session.
- `app.js` interpolates some data fields into HTML attributes without escaping (`data-id="' + t.id + '"`, the photo path from `t.photo`). That is harmless for the fictional `data.js`; it is not harmless for text that comes from a public tender document read by a model (prompt injection, markup injection).

## Decision

We will **not build (e) in this pass**, and we record the design and the preconditions so it can be built later without re-deciding:

1. **Where it would live:** one route on the website (for example `site/src/app/api/read-tender/route.ts`), never in the app. The app keeps reading `data.js`; a "real reading" would be shown on the site's `/how` page as a separate, labelled example ("Read by a model on <date>: <tender>"), so the live demo can never depend on it.
2. **Off by default:** the route answers 404 unless `READ_TENDER_ENABLED=1` is set in Vercel's **Production** environment (not Preview, so no pull-request build can use the key), with the model key in a Production-only, sensitive environment variable, a hard monthly spend cap at the provider, and a per-deployment request limit.
3. **The contract:** the route's output must pass the same checks as `data.js` (`tests/data-check.js`), extended into a reusable validator only when this is built (not before: with no reader it would duplicate the data check, and adding it to `engine.js` would change the engine's bytes, its hash in the generated decision model and the site's copies for nothing). The engine evaluates the validated record exactly as it evaluates the fictional tenders; requirements under 0.7 confidence stay "Needs your check", so the model can never decide a verdict.
4. **Honesty:** the output is labelled as a real public tender read by a model on a given date, with the source URL; it is the only non-fictional tender anywhere in the product and is kept apart from the fictional set (`CLAUDE.md` §7.3).
5. **Preconditions before any code:** (a) the lecturer agrees that a live call on the site is within the course rules, which means amending `CLAUDE.md` §7.2 by a team decision recorded in §11; (b) an escaping audit of every data field `app.js` and the site interpolate into HTML and attributes; (c) the Vercel projects exist (ADR-0001) and someone on the team owns the key and the spend cap.
6. **A guard until then:** `tests/no-live-ai-check.js` (CI `check` job, preflight, `npm test`) fails on any server route under `site/src/app/` and on any key-shaped string (`sk-…`) in a tracked file, so §7.2 cannot be broken by accident; building this ADR means changing §7.2 and the guard in the same pull request.
7. **The question for 11 Nov:** "Would a single, clearly labelled real tender read by a model, on the website only, off by default, strengthen the submission, or does the course want the AI simulated throughout?"

The trade-off that decided it: a model path that nobody could run before the session would be an untested claim in a graded prototype, and it needs a rule change that only the team and the lecturer can make; writing the design down costs little and makes the gap visible and gradeable.

## Consequences

### What becomes easier
- If the lecturer says yes, the work starts from a settled design: the route, the flag, the contract, the labels and the order of steps.
- The current honesty line stays simple: all AI output in the product is simulated and labelled.

### What becomes harder
- The "AI reads 24 languages" claim stays demonstrated only by pre-written translations of fictional tenders.

### Technical debt accepted
- The AI seam stays unwired (`readTender` output unused). Acceptable while the reader is simulated; wiring it is step one of building this.
- The raw attribute interpolation in `app.js` stays until the escaping audit; acceptable for fictional data the team writes.

## Alternatives Considered

### Option A: Build the route now, flag off
- **Pros**: the code exists for the submission.
- **Cons**: never run against TED or a model (both unreachable here, no key); amends §7.2 without the people who can; adds the first server runtime and the first secret to a static project; a route that is off and untested proves nothing.
- **Why not**: an unverifiable claim and a rule change by a build session.

### Option B: A validator now (`validateTender()` in `engine.js`), the route later
- **Pros**: the contract becomes reusable code today.
- **Cons**: with no reader it duplicates `tests/data-check.js`; it changes `engine.js` bytes (and with them the generated decision model's engine hash, the site's copies and the demo's rehearsal state) for no user-visible gain.
- **Why not**: cost now, value only if (e) is ever approved.

### Option C: Do nothing, not even this record
- **Pros**: no effort.
- **Cons**: the candidate would be re-proposed and re-argued next pass; the preconditions (rule change, escaping audit, key ownership) would be rediscovered the hard way.
- **Why not**: the record is cheap and the question for the lecturer is worth asking on 11 Nov.

## Review Triggers

- [ ] Team change: revisit when the lecturer answers the 11 Nov question, or when the team amends `CLAUDE.md` §7.2.
- [ ] Technology change: revisit if TED offers the tender documents (not only the notices) through its API, or if the proxy and a key become available to a build session.
- [ ] Pain indicator: revisit if reviewers say the simulated reading undercuts the "AI is necessary" argument.
- [ ] Time-based: review after the end-of-term submission.
