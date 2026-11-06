# Deploying to Vercel (site and app), GitHub Pages kept

Vercel deploys come from GitHub Actions: [`docs/adr/0003-vercel-from-github-actions.md`](adr/0003-vercel-from-github-actions.md). It replaces the dashboard import of [ADR-0001](adr/0001-vercel-hosting.md), which was refused in the Sponso team (HTTP 403 for the build sessions on 4 and 6 Nov and for the Cowork Vercel connector). The workflow creates both projects on its first run, deploys them, and checks the live URLs. All it needs from you is two repository secrets.

GitHub Pages is not touched by any of this. The demo URL in `BRIEF.md` stays `https://pioche8.github.io/ESCP-2627DT-C1/?demo=reset,fast` until someone has rehearsed a Vercel URL on the iPhone.

## 0. What you do (about five minutes, once)

1. **Create a token.** Open [vercel.com/account/settings/tokens](https://vercel.com/account/settings/tokens) → **Create Token**:
   - Name: `escp-2627dt-c1 GitHub Actions`
   - Scope: **Sponso**
   - Expiration: the end of term (or 90 days)

   **Create**, then copy the token. It is shown only once.
2. **Find the team ID.** Switch to the Sponso team (top left) → **Settings → General** → **Team ID** (starts with `team_`) → copy it. On 6 Nov the build session read Sponso's ID as `team_pFOzIlorbuCEtWfCqCxf0oMb`; use what your screen shows if it differs.
3. **Add both as repository secrets.** github.com/pioche8/ESCP-2627DT-C1 → **Settings → Secrets and variables → Actions → New repository secret**, twice:
   - Name `VERCEL_TOKEN`, Secret: the token from step 1.
   - Name `VERCEL_ORG_ID`, Secret: the team ID from step 2.

   Or from a laptop with the GitHub CLI (each command asks for the value; nothing lands in your shell history):
   ```bash
   gh secret set VERCEL_TOKEN --repo pioche8/ESCP-2627DT-C1
   ```
   ```bash
   gh secret set VERCEL_ORG_ID --repo pioche8/ESCP-2627DT-C1
   ```
4. **Run the workflow.** github.com/pioche8/ESCP-2627DT-C1 → **Actions → vercel → Run workflow** → Branch `main` → **Run workflow**. Or:
   ```bash
   gh workflow run vercel.yml --repo pioche8/ESCP-2627DT-C1 --ref main
   ```
5. **Read the run.** It takes about 10 minutes.
   - `plan` should say both projects.
   - `deploy escp-2627dt-c1 (app)` and `deploy escp-2627dt-c1-site (site)` should each print `Created …` on the first run, then `url=` and `domain=`.
   - `post-deploy checks (production)` runs the live checks (§2).
   - When everything is green, the URLs are `https://escp-2627dt-c1.vercel.app/` and `https://escp-2627dt-c1-site.vercel.app/`, unless Vercel had to pick another name: then the `domain=` lines say which.

**If the first real run fails with 403 again** (the deploy job says `creating escp-2627dt-c1 was refused (HTTP 403 …)`), your role in Sponso cannot create projects. Use your personal Vercel scope instead:
- Create a token as in step 1, but with **Scope: your personal account**.
- Find your personal ID: your avatar → **Account Settings → General → Vercel ID**.
- Replace both secrets with these two values, then run the workflow again (step 4).

Nothing in the repository changes; the projects are then created under your personal account.

**If the sitemap check fails** with `does not list https://…`, the site's production domain is not `escp-2627dt-c1-site.vercel.app`. Change `SITE_URL` in `.github/workflows/vercel.yml` to the `domain=` the site job printed, in one pull request.

**If the "without a Vercel login" check fails,** go to project → **Settings → Deployment Protection → Vercel Authentication** and choose **Standard Protection**. That keeps previews private and makes production public.

## 1. What runs, and when

| Event | What deploys | Where the URLs show |
|---|---|---|
| A push to `main` | to production, only the project whose files changed: the app for `index.html`, the scripts, `styles.css`, `manifest.webmanifest`, `shared/`, `fonts/`, `assets/`, `vercel.json` and `scripts/vercel-app-dist.js`; the site for anything under `site/`. The lists are the `ignoreCommand`s of the two `vercel.json` files, read by `scripts/vercel-changed.js` | the run's `domain=` lines |
| A pull request from this repository | previews of the projects it changes | one comment on the pull request, updated on every push. Preview URLs ask for a Vercel login: they are for the team, not for the lecturer |
| Actions → vercel → Run workflow | both projects: production from `main`, previews from another branch | the run |

Each deploy runs `scripts/vercel-deploy.js`, with Vercel CLI 64.7.0 on Node 22.x:
1. It finds the project by name, or creates it from the settings in its `vercel.json`. The new project has no Git connection.
2. It runs `vercel pull` → `vercel build` → `vercel deploy --prebuilt`. Vercel serves exactly what the runner built.

Both `vercel.json` files set `"git": {"deploymentEnabled": false}`, so a later dashboard import cannot deploy on top of the workflow (§3).

Without the two secrets, or with the repository variable `VERCEL_DEPLOY` set to `off`, the `plan` job prints one notice and nothing else runs. The workflow stays green.

## 2. The live checks (automatic, on GitHub's runner)

`.github/workflows/post-deploy.yml` runs after every deploy. These used to be the "run from a laptop" commands.
- **GitHub Pages**, after each successful "pages build and deployment" run of `main`:
  - `node tests/live-check.js`: the served files equal the deployed commit, and `?demo=reset,fast` survives the directory redirect.
  - The smoke test against `https://pioche8.github.io/ESCP-2627DT-C1/`.
- **The Vercel app**, after a production deploy: the same two checks against its URL, plus `/tests/smoke.js`, `/docs/`, `/CLAUDE.md` and `/site/` must answer 404.
- **The Vercel site**, after a production deploy:
  - `sitemap.xml` lists the real domain, not `localhost`.
  - The home page answers 200 without a Vercel login.
  - Lighthouse scores at least 95 in all four categories on `/` and `/how` (median of 3, dark and light), and axe finds 0 violations (`site/scripts/audit.cjs` with `AUDIT_URL`).

To run any of them by hand: **Actions → post-deploy → Run workflow**, with the URLs to check. A single Lighthouse score under 95 on a shared runner is usually noise (`CLAUDE.md` §11 item 97): rerun the job before changing anything.

The same commands still work from a laptop:
```bash
node tests/live-check.js https://escp-2627dt-c1.vercel.app/
```
```bash
SMOKE_URL=https://escp-2627dt-c1.vercel.app/ node tests/smoke.js
```

## 3. One deploy path at a time

- **Default:** the workflow deploys, and Vercel's Git integration does not (`deploymentEnabled: false`). If someone imports the repository in the dashboard anyway, delete the duplicate project it creates, or disconnect its Git repository. The import's first deployment may already have run once.
- **Switch the workflow off:** set the repository variable `VERCEL_DEPLOY` to `off` (Settings → Secrets and variables → Actions → **Variables** → New repository variable). Deleting the two secrets, or Actions → vercel → ⋯ → **Disable workflow**, does the same.
- **Switch to the dashboard path:**
  1. Switch the workflow off as above.
  2. In one pull request, set `"deploymentEnabled": true` in both `vercel.json` files.
  3. Connect the Git repository to each project (project → Settings → Git).

  The ignore steps of ADR-0001 then decide what builds.

## 4. After the checks pass

- README "Website" and `BRIEF.md` gain the two Vercel URLs next to the Pages URL. The site's "Try the prototype" buttons (`APP_URL` in `site/src/data/copy.ts`) stay on Pages until an iPhone rehearsal on the Vercel app URL passes. Two reasons: the film link is built from `APP_URL` and `marketing/` is not part of the app build, and each origin keeps its own saved demo state.
- Turning Pages off is your decision and is not needed for anything here.

## Rollback

- **Pages:** `git push --force-with-lease origin release/v1-workshop:main` (unchanged). The frozen commit has no `vercel.yml`, so nothing deploys to Vercel from it, and Vercel keeps serving its last deployment.
- **Vercel:** project → **Deployments** → the previous production deployment → ⋯ → **Promote** (Instant Rollback). Vercel then stops promoting new production deployments automatically until you click **Undo Rollback**.
- **Stop Vercel deploys:** set `VERCEL_DEPLOY` to `off` (§3).
- **Remove it entirely:** project → Settings → Advanced → **Delete Project**, for both projects. Pages keeps running.
