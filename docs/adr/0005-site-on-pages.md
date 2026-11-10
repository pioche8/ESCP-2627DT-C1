# ADR-0005: The site is also served on GitHub Pages

**Status**: Accepted (adds a second host for the website; [ADR-0001](0001-vercel-hosting.md) and [ADR-0003](0003-vercel-from-github-actions.md) stand, and Vercel stays the plan)
**Date**: 2026-11-10
**Deciders**: Luca Zorzi (the goal, in the pass-9 brief: every change of passes 8 and 9 visible on a public link, the website served from the Pages domain now, not under `/site/`); Claude Code (autonomous pass 9) for the how. Recorded in `CLAUDE.md` §11.

## Context

- **The website has never been online.** Vercel deploys it from GitHub Actions ([ADR-0003](0003-vercel-from-github-actions.md)) once two repository secrets exist. They still do not: every `vercel` run since 6 Nov stops in its `plan` job with "VERCEL_TOKEN or VERCEL_ORG_ID is not set". The Git-connected projects that once commented on pull requests are gone (`CLAUDE.md` §11 items 158, 193).
- **The page Luca kept landing on is not the website.** It is the designer's 3 Nov reference page, `design/website/TenderScout Website v3.dc.html`, which Pages serves from `main` like any other file. It loads `./support.js`, which never existed next to it (the runtime is `design/support.js`), so Pages shows its raw template, and its phone is the 3 Nov mock.
- **Pages serves `main`'s root as it is**: "Deploy from a branch", `/` (root), `.nojekyll`, no build step. The app lives at the root and is the live demo. Nothing here may change its bytes.
- **The brief** (Luca, 10 Nov): build `site/` as a static export, serve it from the Pages domain at a path like `/ESCP-2627DT-C1/website/` (not `/site/`, where the source lives), commit the export, check it in CI, and keep Vercel unblocked.

## Decision

We will **commit a static export of `site/` in `website/` at the repository root**, built for the base path `/ESCP-2627DT-C1/website`, so Pages serves the real website at <https://pioche8.github.io/ESCP-2627DT-C1/website/> next to the app.

1. **One script builds it:** `cd site && node scripts/pages-export.mjs`.
   - It runs `next build` with `STATIC_EXPORT=1`, `NEXT_PUBLIC_BASE_PATH=/ESCP-2627DT-C1/website` and `SITE_URL=https://pioche8.github.io` (the origin: Next adds the base path to the files it generates, and `withBase()` adds it to the URLs written in the metadata), then replaces `website/` with the output: 117 files, 4.2 MB.
   - The Pages export uses trailing slashes, so `/how` is `website/how/index.html`. Next also writes a `how/` folder of prefetch data next to `how.html`, and a static host may answer `/how` from that folder (a redirect to `how/`, then 404) instead of from `how.html`. With trailing slashes there is one answer, and `/how` without the slash redirects to it.
   - It calls `next build` directly, not `npm run export`: `prebuild` would rewrite the tracked `site/public/robots.txt` and `sitemap.xml` for the Pages URL. The Pages pair is written into `website/` instead.
   - It writes `website/export.json`: the base path, a fingerprint of the build's inputs and the SHA-256 of every exported file.
2. **The base path in the code.** `next.config.ts` sets `basePath` (and `trailingSlash`) from `NEXT_PUBLIC_BASE_PATH`, and Next prefixes its own scripts, styles, fonts, links and metadata files. What Next leaves alone goes through `withBase()` in `site/src/lib/site.ts`: plain `<a href>` links (the menu, the footer, the buttons, "How it decides"), the photos' `src`, the phone's iframe and the canonical and Open Graph URLs written in the metadata; a page path also gets its trailing slash. With the variable unset, `withBase()` returns its input, so the Vercel build and the plain `npm run export` are unchanged.
3. **A generated-files check** in the style of the existing ones: `node site/scripts/pages-export.mjs --check` writes nothing and fails when
   - the export is **behind `site/`**: the fingerprint of the tracked files the build reads (`site/src/**`, `site/public/**`, the configs, the lockfile, the export script) differs from the one recorded at build time. The app copy in `site/public/prototype/` is one of those inputs;
   - the export is **behind the app copy its phone uses**: `website/prototype/` differs from the app's runtime files (the allowlist of `scripts/vercel-app-dist.js`), byte for byte;
   - a file in `website/` was **added, removed or edited by hand**.

   It does not rebuild, because a Next build is not byte-reproducible across machines. It runs inside `node site/scripts/sync-shared.mjs --check`, which CI's `check` job, the preflight and `npm test` already call, so **no workflow file changed**.
4. **The live proof.** `tests/live-check.js` also compares `website/index.html`, `website/how/index.html`, `website/export.json` and `website/prototype/app.js` with the checkout, so the `post-deploy` run after every Pages deploy proves the website is live, byte for byte. Its `site` job (Lighthouse ≥ 95, axe 0, the sitemap) runs against the Pages URL by hand: Actions → post-deploy → Run workflow, with `site_url` = `https://pioche8.github.io/ESCP-2627DT-C1/website` (it checks `/` and `/how`; `audit.cjs` audits a page that redirects at its final address, so `/how` is measured as `/how/`).
5. **Local checks on the Pages paths.** `site/scripts/pages-serve.cjs` serves the repository as Pages does (`/ESCP-2627DT-C1/` = the root; a directory redirects to its slash form and answers with its `index.html`; `x` answers with `x.html` when there is no folder `x`; everything else is 404). `site/scripts/pages-check.cjs` loads the export from there at 1440 and 390 px and fails on any response of 400 or more, any console or page error, a missing section, an undecoded image, an unloaded font, an empty map, a phone that is not the signed-in app, a dead link to the app, the film or the reel, or a sitemap, canonical link or Open Graph image that does not name the Pages URL. The site's existing scripts (`a11y-motion.cjs`, `shots.cjs`, `contact-sheet.cjs`, `audit.cjs` with `PAGES=/,/how/`, `record.cjs`) take the Pages URL through `SITE_URL` / `AUDIT_URL`.
6. **The reference page says what it is.** One line at the top of `design/website/TenderScout Website v3.dc.html` says it is the 3 Nov design reference and links to the live site. Its "In the app" phone is the real app in a frame, seeded the way the site's phone is. Its script tag points at `../support.js`, the runtime that exists, so it renders as the designer drew it.
7. **Vercel is untouched.** `vercel.json`, `site/vercel.json`, the workflows and `docs/DEPLOY.md` §0 do not change. The Vercel site project builds `site/` with no base path, and `website/` is outside both projects' `ignoreCommand` paths, so committing the export never triggers a Vercel deploy. When the secrets are added, both hosts work. Whether to keep the Pages copy after that is a decision for then.

## Consequences

- **Every change to the site's inputs needs a re-export.** That includes the generated decision model in `site/src/generated/`, which records the smoke test's check count, so a pull request that adds a smoke check also runs `cd site && node scripts/pages-export.mjs` and commits `website/`. CI says so, with the command, when it is forgotten.
- **One origin, one app state.** The app, the website and the reference page all live on `pioche8.github.io`, so they share the app's storage (`tenderscout.v2` in `localStorage`). The site's phone seeds it on every load: signed in, onboarded, dark, the rest the app's defaults, exactly as on Vercel. On Pages that also restarts the app in that browser from the signed-in Feed, as Reset demo would but without its question, and whatever a visitor does in the phone shows in the app in that browser. The rehearsed demo is not affected: it starts with `?demo=reset,fast`, and the iPhone's home-screen icon keeps its own storage. A sandboxed frame would have kept the two apart, but then the phone could not open signed in, which the brief asks for. On Vercel the site has its own origin, so none of this applies there.
- **The repository carries the export** (117 files, 4.2 MB: about the size of `site/public/` plus Next's chunks), and Pages publishes it with every deploy of `main`, which takes about the same 30 s.
- **Crawlers read `robots.txt` at the domain root only**, which is not this repository's. `website/robots.txt` is informational, and the sitemap is listed in it.

## Alternatives considered

- **Wait for Vercel.** Rejected: the secrets have been missing since 6 Nov, and the brief asks for a public link now.
- **Deploy Pages from GitHub Actions** (`actions/deploy-pages`, building `site/` on the runner). Rejected: it switches the repository's Pages source from "Deploy from a branch" to "GitHub Actions", a repository setting this session cannot change, and it would also change how the app at the root is published, the day before the demo. It would need a workflow file as well.
- **Serve it at `/site/`.** Rejected by the brief: that is where the source lives, and Pages would serve the source tree instead.
- **A sandboxed phone** (`sandbox="allow-scripts"`, an opaque origin, the app in memory). Rejected: see the second consequence.
