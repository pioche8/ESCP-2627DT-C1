# ADR-0001: Host the site and the app on Vercel from this repository, with GitHub Pages kept as the fallback

**Status**: Accepted
**Date**: 2026-11-06
**Deciders**: Claude Code (autonomous pass 2, brief by Luca Zorzi), council members Strategist, Advocate, Skeptic and Operator (session `2026-11-06-pass-2`). Recorded in `CLAUDE.md` §11.

## Context

- The app is static (no build, classic scripts) and is served by GitHub Pages from `main` at the repository root, `https://pioche8.github.io/ESCP-2627DT-C1/`. Pages serves the **whole repository**, tests and docs included. The live demo (`BRIEF.md`, `?demo=reset,fast`) and the rollback (`git push --force-with-lease origin release/v1-workshop:main`) both assume Pages.
- The marketing site (`site/`, Next.js 16) has never been deployed. On 4 Nov creating a Vercel project in the team was refused (`CLAUDE.md` §11 item 72). Its Open Graph image, canonical links and sitemap fall back to `http://localhost:3000` until `SITE_URL` or Vercel's production URL exists (`site/src/lib/site.ts`, `site/scripts/seo-files.cjs`).
- The site reuses the app's `engine.js` and `data.js` through committed copies in `site/src/generated/`, refreshed by `prebuild` when the app sits beside `site/` (`site/scripts/sync-shared.mjs`). Nothing in CI checked that the copies equal the sources (architecture read, `docs/reports/2026-11-06-pass-2-deepen.md` item 1).
- The DPD feedback session on 11 Nov is online: the lecturer can open any link we share, so a shared link that asks for a Vercel login, or a second host that serves different bytes from the first, would be visible.
- The build container cannot reach `github.io` or `*.vercel.app` directly (proxy). The Vercel MCP connector can read the team's projects and deployments and fetch a deployment's files from Vercel's side.

## Decision

We will run **two Vercel projects from this one repository**, production branch `main`, a preview deployment on every pull request, production deployments public and previews behind Vercel Authentication (the team's standard protection), and we keep **GitHub Pages running unchanged as the fallback and as the demo URL** until a human has rehearsed the Vercel URL on the phone.

1. **`tenderscout-site`**: Root Directory `site/`, framework Next.js, the normal build (`npm run build`, not `STATIC_EXPORT`), Node 22, "Include source files outside of the Root Directory" **off**, so the build uses the site's committed copies of the engine, the data, the fonts and the generated files (which CI checks against the app, point 4) and is the same build every time; `sync-shared.mjs` then only reports that the app is not beside it. `SITE_URL` = its production URL in Production and Preview (read at build time; previews would otherwise fall back to `VERCEL_PROJECT_PRODUCTION_URL`, which `site/src/lib/site.ts` already reads). `site/vercel.json` holds the framework and the ignore step.
2. **`tenderscout-app`**: Root Directory = repository root, no framework, build command `node scripts/vercel-app-dist.js`, output directory `dist/`. The script copies an **allowlist** of the app's runtime files byte for byte (`index.html`, the five scripts, `styles.css`, `shared/tokens.css`, `fonts/`, `assets/img/`, and the manifest and icons when present), then fails the build if any local reference in `index.html`, the stylesheets, `app.js`, `data.js` or the manifest does not resolve inside `dist/`. Only `dist/` is public, so `tests/`, `docs/`, `site/`, `design/` and `.github/` cannot be served. `tests/vercel-dist.test.js` (in CI) asserts byte identity with the repository files, the allowlist and the two `vercel.json` files.
3. **Ignored Build Step** in both `vercel.json` files: `[ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- <paths> || exit 1` (Vercel documents only 0 = skip and 1 = build, so every other outcome, such as git's 128 for a SHA missing from the shallow clone, is mapped to 1). Exit 0 (no change in the project's paths since its last successful deployment on that branch) skips the build; anything else builds: the first deployment of a project or branch (no previous SHA), a previous SHA outside Vercel's shallow clone (git exits 128), or a change. It therefore fails open: at worst an unneeded build, never a skipped one. Paths: the app's runtime files, `shared/`, `fonts/`, `assets/`, the manifest, `vercel.json` and the dist script for the app; `site/` alone for the site, because it builds only from what is inside `site/`, and a change to `engine.js`, `data.js`, the fonts or the tokens cannot reach `main` without the matching change in `site/` (CI, point 4). Both commands stay under the API's 256-character limit (asserted by the test).
4. **CI keeps the copies honest:** the `check` job runs `node site/scripts/sync-shared.mjs --check`, which fails if `site/src/generated/engine.cjs`, `data.cjs` or `site/src/fonts/` differ from what the sync would write, next to the existing token and decision-model diffs.
5. **Project Settings mirror the files.** The same framework, build command, output directory and ignore command are set on each project through the API, because a commit without a `vercel.json` (the frozen `release/v1-workshop` is one) builds from the project's settings. For the app the settings' build command is a self-contained shell copy of the allowlist (`rm -rf dist && mkdir -p dist/shared dist/fonts && cp index.html *.js styles.css dist/ && cp shared/tokens.css dist/shared/ && cp fonts/*.woff2 dist/fonts/ && cp -R assets dist/ && { cp *.webmanifest dist/ 2>/dev/null || true; }`), so a force-push rollback to the frozen commit still publishes only the app files on Vercel; whenever `vercel.json` exists it wins and the tested script runs.
6. **URLs change last.** README, `BRIEF.md` and the site's `APP_URL` move to the Vercel URLs only after the production deployment is READY and its files have been compared with the repository; `BRIEF.md` keeps the Pages URL as the rehearsed demo link until the team says otherwise. Turning Pages off is Luca's decision, not this pass's.

The trade-off that decided it: an allowlist that fails closed (a forgotten file breaks the Vercel build loudly, `tests/vercel-dist.test.js` catches it in CI) is safer than a denylist that fails open (a `.vercelignore` that forgets a new folder publishes it), and keeping Pages as the demo URL means the hosting change cannot break the rehearsed demo.

## Consequences

### What becomes easier
- The site is public for the first time, with correct absolute URLs for Open Graph, the canonical links and the sitemap.
- Every pull request gets preview URLs for the site and (when app files change) the app, so reviewers can open a change without cloning.
- Two hosts can be compared byte for byte (`node tests/live-check.js <url>` from a laptop), and either can stand in for the other.

### What becomes harder
- Two hosts can drift: Pages deploys every push to `main`, Vercel only when its ignore step says so. The ignore step fails open, and `live-check.js` compares any host with a checkout.
- A new runtime file in the app must be added to the allowlist in `scripts/vercel-app-dist.js`; the reference check fails the Vercel build if it is referenced, and the test fails CI.
- Preview URLs ask for a Vercel login: they are for the team, never for the lecturer. Only production URLs are shared.

### Technical debt accepted
- Pages still serves the whole repository (tests and docs included). Acceptable: the repository is public anyway, and Pages is the fallback, not the product.
- The site's photos are still 3× upscales of 200 px previews (README → Photos); Vercel serves what is committed.
- Two rollbacks instead of one. `git push --force-with-lease origin release/v1-workshop:main` still restores Pages and makes both Vercel projects rebuild the frozen commit from their Project Settings (point 5). The faster Vercel rollback is Instant Rollback (project → Deployments → a previous production deployment → Promote); after it, Vercel stops auto-promoting new production deployments until someone clicks Undo.
- The app's allowlist exists twice: in `scripts/vercel-app-dist.js` (tested, used whenever `vercel.json` exists) and in the Project Settings' shell command (used only for commits that predate `vercel.json`).

## Alternatives Considered

### Option A: One Vercel project serving both the site and the app (the app under `site/public/app/`)
- **Pros**: one project, one domain, no second ignore step.
- **Cons**: the app's bytes would be copied into the site's build, so "byte-identical to Pages" becomes a property of a Next.js build; every app change rebuilds the site; the app would move to a sub-path and its relative URLs, `?demo=` handling and home-screen start URL would need re-testing.
- **Why not**: it couples the demo to the website's build, which is exactly what the 3 Nov split avoided.

### Option B: The app project with a `.vercelignore` instead of a dist step
- **Pros**: no build script; Vercel serves the repository root as is.
- **Cons**: a denylist: any new folder (a `reports/`, a `screenshots/`) is public until someone remembers to add it; easy to get wrong for nested paths.
- **Why not**: fails open on exactly the files that must not be public.

### Option C: Do nothing (Pages only, the site undeployed)
- **Pros**: no effort, no second host to keep in step.
- **Cons**: the site, its `/how` page and its Open Graph metadata stay unreachable for the 11 Nov session and the submission; `SITE_URL` stays `localhost`; the brief asks for Vercel.
- **Why not**: the website is part of the submitted work and has never been seen by anyone outside the team.

## Review Triggers

- [ ] Technology change: revisit the ignore step if Vercel changes `VERCEL_GIT_PREVIOUS_SHA` or the clone depth, or offers path filters natively for this setup.
- [ ] Team change: revisit when the team decides to retire GitHub Pages (Luca's call); then `BRIEF.md`, `tests/live-check.js` defaults and the rollback text change together.
- [ ] Pain indicator: revisit the allowlist if the Vercel app build fails on a missing file more than once.
- [ ] Time-based: review after the end-of-term submission.
