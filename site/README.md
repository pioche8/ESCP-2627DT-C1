# TenderScout · marketing website

The one-page marketing website for the TenderScout prototype (ESCP Digital Product Design, Group C). Built from the designer's v3 handoff in `../design/website/` with Next.js 16 (App Router), TypeScript, Tailwind v4 and Framer Motion, and decluttered on 4 Nov 2026 onto the app's nine-colour token set (one radius, one typeface, no gradients, shadows, pills or eyebrows; `../tests/declutter-scan.js` checks it). Since 7 Nov 2026 it plays the motion and the map of its original 3 Nov design in solid shapes and colours (`../docs/adr/0004-website-current-look-original-motion.md`); the timings live in `../shared/tokens.json` under `siteMotion`. It runs the app's real `engine.js` on the app's fictional `data.js`, so every number on the page is the app's.

```
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + typecheck + build; `prebuild` re-syncs tokens, engine, data, fonts and photos from ../ (no-op on Vercel)
npm run audit        # static export (out/), then scripts/how-check.cjs (the /how page incl. 25 → 90 → 100), scripts/a11y-motion.cjs and scripts/audit.cjs
                     # (Lighthouse ≥ 95 in all four categories as the median of 3 runs, axe-core 0 violations; both pages, dark + light)
npm run how          # regenerate src/generated/how-it-decides.json and ../docs/HOW_IT_DECIDES.md from ../engine.js + ../data.js
npm run images       # re-render the Open Graph image and the icons from ../shared/tokens.json (Playwright)
node scripts/shots.cjs            # screenshots at 1440 / 1024 / 768 / 390 with console, horizontal-scroll and declutter-scan checks
node scripts/a11y-motion.cjs      # every item of the motion inventory, reduced motion, keyboard and touch
node scripts/record.cjs           # ../docs/site/ recordings at 1440 and 390 (BEFORE_URL=… adds the before/after strip)
node scripts/contact-sheet.cjs    # the PhoneDemo next to the real app in the same states
```

**Pages:** `/` (the one-page site) and `/how` ("How it decides": the requirement statuses, the four parts of the score, the thresholds, "Try the rules" on the real decision code, what "cites the page that proves it" means, the demo data through the rules, and what is real in the prototype). Everything on `/how` is generated at build time by `../shared/how-it-decides.js`, which probes the engine; nothing is typed by hand, and CI fails if the generated files fall behind the code.

**Metadata:** title and description per page, Open Graph and Twitter cards, `opengraph-image.png`, `icon.png` and `apple-icon.png` rendered from the tokens (`scripts/brand-images.cjs`), `robots.txt` and `sitemap.xml` written by `scripts/seo-files.cjs` in `prebuild`. Absolute URLs use `SITE_URL` if set, else Vercel's production URL, else `http://localhost:3000`.

Not deployed yet: creating the project in the Vercel team was refused. It deploys to Vercel once someone with team access imports the repository with **Root Directory = `site`** (build `npm run build`, Node 22, no environment variables); `STATIC_EXPORT=1 npm run build` produces a static preview in `out/` meanwhile. Design tokens come from `../shared/tokens.json`: run `npm run tokens` after editing it. Map data: Natural Earth via the `world-atlas` npm package, drawn with `d3-geo` (nothing fetched at runtime). Full notes: the root `README.md` ("Website") and `../docs/WEBSITE_BUILD_LOG.md`.

Prototype · AI output is simulated · all companies and tenders are fictional.
