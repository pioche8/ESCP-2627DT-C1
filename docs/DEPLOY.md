# Deploying to Vercel (site and app), GitHub Pages kept

Why it is set up this way: [`docs/adr/0001-vercel-hosting.md`](adr/0001-vercel-hosting.md). Everything that can live in the repository already does (`vercel.json`, `site/vercel.json`, `scripts/vercel-app-dist.js`, the CI checks). What is left is the import, which needs a person with rights in the Vercel team: on 4 and 6 Nov the build sessions' Vercel access was refused with "You don't have permission to create the project" (HTTP 403), and there is no Vercel CLI login in a build container.

GitHub Pages is not touched by any of this. The demo URL in `BRIEF.md` stays `https://pioche8.github.io/ESCP-2627DT-C1/?demo=reset,fast` until someone has rehearsed the Vercel URL on the iPhone.

## 0. Before you start

- The pull request that added this file is merged into `main` (both `vercel.json` files must be on `main` before the first import, or the first production build of the app would have no allowlist; step 2 also sets the same values in Project Settings as a safety net).
- You are signed in to vercel.com with an account that can create projects in the team (Sponso, or your own Hobby account: either works, the repository is public).

## 1. The site: `tenderscout-site`

1. vercel.com → **Add New… → Project** → Import Git Repository → **pioche8/ESCP-2627DT-C1** → Import.
2. **Project Name:** `tenderscout-site`.
3. **Framework Preset:** Next.js.
4. **Root Directory:** Edit → `site` → Continue.
5. **Build and Output Settings:** leave every field at its default (`npm run build`, `.next`, `npm install`).
6. **Environment Variables:** none yet (step 1.9 adds `SITE_URL` once the domain is known).
7. **Deploy.** Wait until the deployment says **Ready**.
8. Project → **Settings → Build and Deployment**:
   - **Root Directory:** `site`; switch **"Include files outside the root directory in the Build Step"** to **off** → Save. (The site then builds from its own committed copies of the engine, the data, the fonts and the tokens, which CI checks against the app on every push.)
   - **Node.js Version:** 22.x → Save.
   - **Ignored Build Step:** "Custom" → paste the `ignoreCommand` from `site/vercel.json` (`[ -n "$VERCEL_GIT_PREVIOUS_SHA" ] && git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- .`) → Save. (`site/vercel.json` already sets it; the setting covers commits that predate the file.)
9. Project → **Settings → Domains**: note the production domain (normally `tenderscout-site.vercel.app`). Then **Settings → Environment Variables** → Add: Key `SITE_URL`, Value `https://tenderscout-site.vercel.app` (your domain, no trailing slash), Environments **Production** and **Preview** → Save.
10. **Deployments** → the latest production deployment → ⋯ → **Redeploy** (the value is read at build time; the Open Graph image, canonical links, `sitemap.xml` and `robots.txt` use it).
11. **Settings → Deployment Protection → Vercel Authentication:** Enabled, **Standard Protection** (production domain public, preview URLs ask for a Vercel login). Never share a preview URL with the lecturer.

## 2. The app: `tenderscout-app`

1. **Add New… → Project** → Import **pioche8/ESCP-2627DT-C1** again.
2. **Project Name:** `tenderscout-app`.
3. **Framework Preset:** Other.
4. **Root Directory:** `./` (the repository root).
5. **Build and Output Settings**, switch each override on and paste:
   - **Build Command:** `rm -rf dist && mkdir -p dist/shared dist/fonts && cp index.html *.js styles.css dist/ && cp shared/tokens.css dist/shared/ && cp fonts/*.woff2 dist/fonts/ && cp -R assets dist/ && { cp *.webmanifest dist/ 2>/dev/null || true; }`
   - **Output Directory:** `dist`
   - **Install Command:** `echo 'tenderscout-app: no dependencies to install'`

   (`vercel.json` overrides these with the tested `node scripts/vercel-app-dist.js`; the shell line is only used for a commit without `vercel.json`, such as the frozen `release/v1-workshop` after a force-push rollback, so even then only the app files are published.)
6. **Deploy**, wait for **Ready**.
7. **Settings → Build and Deployment → Ignored Build Step:** "Custom" → paste the `ignoreCommand` from `vercel.json` → Save. **Node.js Version:** 22.x.
8. **Settings → Deployment Protection → Vercel Authentication:** Enabled, **Standard Protection**.
9. Note the production domain (normally `tenderscout-app.vercel.app`).

## 3. Check it (from a laptop; the build containers cannot reach `*.vercel.app`)

```bash
node tests/live-check.js https://tenderscout-app.vercel.app/
```

```bash
SMOKE_URL=https://tenderscout-app.vercel.app/ node tests/smoke.js
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://tenderscout-app.vercel.app/tests/smoke.js
```

The first must print "Live site serves this checkout", the second "Smoke test passed", the third `404` (only the app files are public; try `/docs/`, `/CLAUDE.md` and `/site/` too).

```bash
npx lighthouse https://tenderscout-site.vercel.app/ --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless"
```

```bash
curl -s https://tenderscout-site.vercel.app/sitemap.xml
```

The sitemap must list `https://tenderscout-site.vercel.app/` and `/how`, not `localhost`. Open the site's home page logged out (a private window): it must load without a Vercel login.

Then open a pull request that changes nothing but a doc line: the "Vercel" comment on it should show both projects as **Ignored** (the ignore step skipped them); a pull request that touches `app.js` builds the app only, one that touches `site/` builds the site only.

## 4. After the check passes

- Tell the build session (or edit by hand): README "Website" and `BRIEF.md` gain the two Vercel URLs next to the Pages URL; `SITE_URL` is already set. The site's "Try the prototype" buttons (`APP_URL` in `site/src/data/copy.ts`) stay on Pages until the iPhone rehearsal on the Vercel app URL passes, because the film link is built from `APP_URL` and `marketing/` is not part of the app build, and because each origin keeps its own saved demo state.
- Turning Pages off is your decision and is not needed for anything here.

## Rollback

- **Pages:** `git push --force-with-lease origin release/v1-workshop:main` (unchanged). Both Vercel projects then rebuild the frozen commit from their Project Settings (§1.8, §2.5).
- **Vercel, faster:** project → Deployments → the previous production deployment → ⋯ → **Promote** (Instant Rollback). Vercel then stops promoting new production deployments automatically until you click **Undo Rollback**.
- **Remove it entirely:** project → Settings → Advanced → Delete Project (Pages keeps running).
