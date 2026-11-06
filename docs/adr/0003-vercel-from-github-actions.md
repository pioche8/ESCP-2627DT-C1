# ADR-0003: Deploy to Vercel from GitHub Actions with the Vercel CLI

**Status**: Accepted (replaces the dashboard-import part of [ADR-0001](0001-vercel-hosting.md); the rest of ADR-0001 stands)
**Date**: 2026-11-06
**Deciders**: Claude Code (autonomous pass 3, brief by Luca Zorzi). Recorded in `CLAUDE.md` §11 items 145–146. The secrets and the first run need Luca (`docs/DEPLOY.md` §0).

## Context

- [ADR-0001](0001-vercel-hosting.md) chose two Vercel projects from this repository, with GitHub Pages kept as the fallback and the demo URL. The app project serves only an allowlist (`scripts/vercel-app-dist.js` into `dist/`). The site project builds `site/` from its committed copies, which CI checks against the app. ADR-0001 got there through a **dashboard import**: a person clicks "Import Git Repository" in the Vercel team.
- That import is blocked. Creating a project in the team "Sponso" returned HTTP 403 ("You don't have permission to create the project") for the build session on 4 and 6 Nov (`CLAUDE.md` §11 items 72, 124) and for the Cowork Vercel connector. A read-only check on 6 Nov (Vercel MCP, team `team_pFOzIlorbuCEtWfCqCxf0oMb`) found no project for this repository under either name.
- The build container cannot reach `*.vercel.app`, `vercel.com` or `github.io` (proxy), and it cannot download Actions artifacts. GitHub's hosted runners can reach all of them.
- GitHub Actions already runs this repository's gates (`check`, `smoke`). The Vercel GitHub app is installed on the repository: its "Vercel Preview Comments" check appears on pull requests, although no project is linked yet.
- The live demo runs on Pages (`BRIEF.md`). Luca rehearses on the iPhone on Tue 10 Nov and freezes `release/v2-feedback`. Nothing in this decision may change what Pages serves.
- The pass-2 report left five checks "to run from a laptop" (`live-check.js`, the live smoke run, the 404s, the sitemap, Lighthouse). Nobody has run them yet.

## Decision

We will **deploy both Vercel projects from GitHub Actions with the Vercel CLI** (`.github/workflows/vercel.yml`), so the repository owns its deploys. The only inputs from a person are two repository secrets, `VERCEL_TOKEN` and `VERCEL_ORG_ID`.

1. **Projects, named after the repository:** `escp-2627dt-c1` (the app: `node scripts/vercel-app-dist.js` into `dist/`, no framework) and `escp-2627dt-c1-site` (Next.js, Root Directory `site`). ADR-0001's names `tenderscout-app` and `tenderscout-site` are retired. Neither project was ever created.
2. **Create or link on first run.** `scripts/vercel-deploy.js` looks each project up by name in the scope `VERCEL_ORG_ID` (a team ID or a personal account ID). When the project is missing, it creates it through the REST API (`POST /v11/projects`), using the settings in that project's `vercel.json`, plus Node 22.x. The project is created **without a Git connection**.
3. **Build on the runner, upload the result:** `vercel pull` → `vercel build` → `vercel deploy --prebuilt`, with the CLI pinned (`vercel@64.7.0`) and Node 22.x. Vercel never builds the source itself. It serves exactly what the runner built from the checked-out commit, and the app's allowlist build and its byte-identity test (ADR-0001 point 2) stay in force.
4. **When:**
   - A push to `main` deploys to production only the projects whose files changed. The paths are read from each `vercel.json`'s `ignoreCommand` by `scripts/vercel-changed.js`, so there is one list.
   - A pull request from this repository gets preview deployments, listed in one comment that is updated, not duplicated.
   - `workflow_dispatch` deploys both projects: to production from `main`, as previews from any other branch.
5. **The site's absolute URLs:** `SITE_URL=https://escp-2627dt-c1-site.vercel.app` is set in the job environment of the site build. The post-deploy check (point 7) fails if the real production domain differs.
6. **No secrets, no failure:** when `VERCEL_TOKEN` or `VERCEL_ORG_ID` is missing (forks included), the `plan` job prints one notice and every deploy job is skipped, so the workflow stays green. The secrets are only ever passed as environment variables and command arguments, never echoed.
7. **Checked after every deploy, on GitHub's runner** (`.github/workflows/post-deploy.yml`):
   - **Pages**, after each "pages build and deployment" run on `main`: `node tests/live-check.js` and the smoke test against the live URL.
   - **The app on Vercel:** the same two checks, plus `/tests/smoke.js`, `/docs/`, `/CLAUDE.md` and `/site/` must answer 404.
   - **The site on Vercel:** `sitemap.xml` names the real domain, not `localhost`; the home page loads without a Vercel login; Lighthouse scores at least 95 on `/` and `/how` (median of 3).

   This replaces the laptop checks of the pass-2 report.
8. **One deploy path at a time.** Both `vercel.json` files set `"git": {"deploymentEnabled": false}`, so if someone later imports the repository through the dashboard, the Git integration does not deploy on top of the workflow (see Consequences for the switch).

GitHub Pages and everything ADR-0001 says about it are unchanged. Pages stays the demo URL until the iPhone rehearsal on a Vercel URL passes.

The trade-off that decided it: the dashboard import needs a person with project-creation rights in Sponso, and both automated attempts were refused. A workflow needs only a token. Whoever holds a token with those rights, in Sponso or in a personal scope, can add it in two minutes, and from then on the repository creates, deploys and checks both projects without anyone clicking. The deploys and their checks also live in CI, where the team can read them, rather than in a dashboard nobody here can open.

## Consequences

### What becomes easier
- Deploys become reproducible from the repository. The CLI version, the Node version, the build command and the paths that trigger each project are all in tracked files, and every deploy is a run in the Actions tab with its log.
- The live checks finally run, on every deploy, on a machine that can reach the hosts: for the first time Pages is verified by `live-check.js` and the smoke test automatically, not by a person with a laptop.
- If Sponso refuses again, nothing in the repository changes: a token and an ID from Luca's personal Vercel scope give the same two projects there (`docs/DEPLOY.md` §0).

### What becomes harder
- **Double deploys if two paths are on.** Someone who later imports the repository in the dashboard creates a Git-connected project, maybe with a suffixed name if ours exists. `git.deploymentEnabled: false` in the committed `vercel.json` files keeps that project's Git integration from deploying, but the import's first deployment may still run once. Pick one path:
  - **Keep Actions (the default):** leave `deploymentEnabled` false, and delete or disconnect any imported duplicate in the dashboard.
  - **Switch Actions off:** set the repository variable `VERCEL_DEPLOY` to `off` (Settings → Secrets and variables → Actions → Variables). The `plan` job then prints a notice and deploys nothing. Deleting the two secrets, or disabling the workflow in the Actions tab, does the same.
  - **Switch to the dashboard path:** switch Actions off as above, set `deploymentEnabled` to true in both `vercel.json` files (one pull request), then connect the Git repository to each project in the dashboard. The `ignoreCommand`s of ADR-0001 point 3 take over again.
- A Vercel deploy now depends on GitHub Actions minutes and on two secrets that someone has to rotate. A leaked token can deploy to the scope, so give it the narrowest scope that works and an expiry.
- Prebuilt deploys run without Vercel's system environment variables at build time, so the site must not rely on `VERCEL_PROJECT_PRODUCTION_URL` during the build. That is why `SITE_URL` is set in the job (point 5).
- Preview URLs stay behind Vercel Authentication (Standard Protection), so the pull-request comment links are for the team, not for the lecturer. The post-deploy checks run on production domains only.

### Technical debt accepted
- The project settings are written once, at creation. If a `vercel.json` later changes a setting that a prebuilt deploy does not carry (the framework preset, the root directory), the project keeps the old value until someone changes it in the dashboard or deletes the project so the workflow recreates it. The build command and the output directory always come from `vercel.json` at build time.
- The Project Settings fallback of ADR-0001 point 5 is gone (a shell copy of the allowlist for commits without `vercel.json`): the workflow deploys only commits that carry this ADR, so it is not needed. Rolling `main` back to the frozen `release/v1-workshop` makes the workflow disappear with it, and Vercel keeps serving the last deployment until someone promotes an older one (Instant Rollback).
- The Lighthouse gate on a shared runner is noisy (median of 3, as in item 97). A single red post-deploy run below 95 is a reason to rerun it before anything else.

## Alternatives Considered

### Option A: Dashboard import (ADR-0001 as written)
A team member imports the repository twice in the Vercel dashboard.
- **Pros**: Vercel's own Git integration, with preview comments and ignore steps; no secrets in GitHub.
- **Cons**: it needs project-creation rights in Sponso, which the session and the connector were refused (403, three times). The deploys and their checks then live in a dashboard nobody here can open, and the laptop checks stay manual.
- **Effort**: S for whoever has the rights; blocked for everyone else.
- **Why not**: blocked, and it leaves verification to a person.

### Option B: Deploy through the Vercel API or MCP from a build session
The session creates the deployments itself (`create_deployment`, `deploy_to_vercel`).
- **Pros**: no workflow to maintain.
- **Cons**: it needs the same project-creation right that was refused. The deploy would come from a session's checkout, not from `main`, and nothing would repeat it on the next push.
- **Effort**: S if it worked.
- **Why not**: blocked by the same 403, and not reproducible.

### Option C: Do nothing (Pages only, the site undeployed)
- **Pros**: no effort, no secret, nothing new to keep in step.
- **Cons**: the website and its `/how` page stay unreachable for the 11 Nov session and the submission, `SITE_URL` stays `localhost`, and the live checks stay manual.
- **Why not**: the website is part of the submitted work, and the brief asks for Vercel.

## Review Triggers

- [ ] Technology change: revisit if Vercel lets this team create projects from the session or the connector, or if `vercel build` stops supporting this Next.js version on the pinned CLI (bump the pin in `vercel.yml`).
- [ ] Team change: revisit when the team retires GitHub Pages (Luca's call). Then `BRIEF.md`, the `pages` job of `post-deploy.yml` and the rollback text change together.
- [ ] Pain indicator: revisit if a double deploy is ever seen (two deployments for one commit in one project), or if the post-deploy Lighthouse check fails twice in a row on a rerun.
- [ ] Time-based: review after the end-of-term submission, and whenever the token expires.
