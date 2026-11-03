# TenderScout · marketing website

The one-page marketing website for the TenderScout prototype (ESCP Digital Product Design, Group C). Built from the designer's v3 handoff in `../design/website/` with Next.js 16 (App Router), TypeScript, Tailwind v4 and Framer Motion. It runs the app's real `engine.js` on the app's fictional `data.js`, so every number on the page is the app's.

```
npm install
npm run dev          # http://localhost:3000
npm run check        # lint + typecheck + build; `prebuild` re-syncs tokens, engine, data, fonts and photos from ../ (no-op on Vercel)
node scripts/shots.cjs            # screenshots at 1440 / 1024 / 768 / 390 with console + horizontal-scroll checks
node scripts/a11y-motion.cjs      # reduced-motion and keyboard checks
node scripts/contact-sheet.cjs    # the PhoneDemo next to the real app in the same states
```

Deploy on Vercel with **Root Directory = `site`** (build `npm run build`, Node 22, no environment variables). Design tokens come from `../shared/tokens.json`: run `npm run tokens` after editing it. Full notes: the root `README.md` ("Website") and `../docs/WEBSITE_BUILD_LOG.md`.

Prototype · AI output is simulated · all companies and tenders are fictional.
