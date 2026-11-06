# Figma and the TenderScout design system

Rules for moving design between this repository and Figma through the Figma MCP server (Claude Code: `use_figma`,
`get_design_context`, `get_screenshot`, `search_design_system`). Read this before any Figma work. `DESIGN.md` is still
the only source of truth for the look, and `shared/tokens.json` is the only source of truth for its values. Figma
mirrors both; it never overrides them.

## 0. The rules in one screen

1. **Tokens first, both ways.** Every colour in code is `var(--c-<token>)`. Every colour in Figma is bound to the
   matching variable `color/<token>`. There are nine tokens per scheme: `bg surface ink muted brand go maybe nogo check`.
   A raw hex in either place is a bug, unless `shared/tokens.json` gains it first (then run `npm run tokens`).
2. **One radius (8 px), one typeface (Hanken Grotesk 400–800, tabular figures), one icon font (Material Symbols
   Rounded).** No shadows, no borders on cards, panels or inputs, no gradients, grain or glass. No alpha colours: the
   sheet scrim (solid `bg` at 60 %) is the one exception. No uppercase, italics, monospace, eyebrows or negative
   tracking. `tests/declutter-scan.js` enforces this on the code, and Figma designs must respect it too.
3. **Verdicts are never colour alone.** Always shape, word and colour: ● Go (`go`), ▲ Maybe / Risk (`maybe`),
   ■ No-go / Fails (`nogo`), ◆ Needs your check (`check`). Text on a verdict or brand fill is always `bg`.
4. **WCAG AA in both schemes.** `node shared/check-contrast.js` must report 0 failures. Tap targets are at least 44 px,
   buttons 52 px, and the tab bar 60 px plus the bottom safe area.
5. **The engine and data win over any design.** Scores, verdicts, counts and copy come from `engine.js` and `data.js`
   (CLAUDE.md §4, §11 items 1, 6 and 29). A Figma mockup with other numbers is wrong, not the code.
6. **Honesty labels stay.** "Simulated AI" on every screen with AI output, "(fictional)" and the fictional-data line,
   and the About explanations (CLAUDE.md §7).
7. **No CDN, no build step, no dependencies in the app.** Nothing from Figma (fonts, images, code) may add a network
   dependency to `index.html`.

## 1. The Figma file

| What | Where |
|---|---|
| File | `0fts7XGooeInJiOQ8s5v7y`: https://www.figma.com/design/0fts7XGooeInJiOQ8s5v7y ("TenderScout prototype", Luca Zorzi's team) |
| Page "TenderScout app" (`0:1`) | the runnable **code layer** `19:525` (the real app, imported with `send_code_to_figma`), the section "Components · iOS chrome" (`33:524`), the "Design system · TenderScout" section (built by `10-overview-page.js`), and the team's own iOS-kit instances |
| Page "iPhone screens · dark" (`14:2`) | one 390 × 844 iPhone frame per screen and state (`NN Name`), scrolling with pinned bars, as a clickable prototype starting at "01 Welcome" |
| Page "iPhone screens · light" (`14:993`) | the same frames in the light scheme |
| Variables | collection "TenderScout" (`VariableCollectionId:16:524`, dark values) and "TenderScout · light" (`…:16:525`), nine `color/<token>` variables each, scoped to fills, text and strokes |
| Components | "iOS / Status bar" (`33:525`, 390 × 47, 9:41 in Inter Semi Bold) and "iOS / Home indicator" (`33:541`, 134 × 5), both coloured by `color/ink`. "Status", "Score tile" and "Button" component sets live in the design-system section |
| Text styles | `App/Wordmark`, `App/Screen title`, `App/Section title`, `App/Detail title`, `App/Score`, `App/Card title`, `App/Body`, `App/Meta`, `App/Label`, `App/Button` (from `tokens.type.app`) |

All ids live in `design/figma/figma.config.json`. Update them there if the file is re-created.

**Plan limits (Starter plan, View seat).** These shaped the file, and they are why it looks the way it does:
- At most **3 pages**, so the screens are frames on two pages, not one page per screen.
- **One mode per variable collection**, so light is a second collection with the same variable names rather than a
  mode. Switching scheme means rebinding (what `light.figma.js` does), not flipping a mode.
- A **capped number of MCP tool calls**. Pack work into few calls (§5). When the cap is hit, every call fails with
  "You've reached the Figma MCP tool call limit on the Starter plan".
- **No API imports from community libraries** ("Not permitted to upsert from library"). The iOS 26 kit's components
  can be placed by hand in Figma but not by a script, so the status bar and home indicator are local components.

## 2. Design system structure

### 2.1 Tokens

`shared/tokens.json` is the single source. `node shared/build-tokens.js` (or `npm run tokens`, which also runs the AA
audit) generates:

| Output | Used by | Shape |
|---|---|---|
| `shared/tokens.css` | the app (`index.html` loads it before `styles.css`) | `:root, [data-scheme="dark"] { --c-bg: #02040A; … }`, `[data-scheme="light"] { … }`, plus `--font-ui`, `--r: 8px`, `--ease-*`, `--dur-*`, `--app-*` layout values, `--safe-top` / `--safe-bottom` |

Since 6 Nov 2026 the website is back to its original 3 Nov design and keeps its own frozen `site/src/styles/tokens.css` and `site/src/generated/tokens.ts`, which the build no longer writes (`CLAUDE.md` §11 item 139). Figma mirrors the app's tokens.
| `.design-cache/tenderscout.md` | the design-drift lock (gitignored) | token summary |

The structure (abridged):

```jsonc
{
  "font":  { "family": { "ui": "'Hanken Grotesk', system-ui, …", "icon": "'Material Symbols Rounded'" }, "weights": { "ui": [400, 500, 600, 700, 800] }, "numbers": "tabular-nums" },
  "type":  { "app": { "screenTitle": { "size": "30px", "line": "34px", "weight": 800 }, "body": { "size": "15px", "line": "22px", "weight": 500 }, … }, "site": { … } },
  "color": { "default": "dark", "themes": { "dark": { "bg": "#02040A", "surface": "#0B111C", "ink": "#FFFFFF", "muted": "#8A93A3", "brand": "#5DB8F5", "go": "#5ED69C", "maybe": "#F7C25E", "nogo": "#FF8B80", "check": "#B3A5FF" },
                                            "light": { "bg": "#EEF3F8", "surface": "#FFFFFF", "ink": "#0E1B2B", "muted": "#5A6474", "brand": "#0862AC", "go": "#13724B", "maybe": "#8A5300", "nogo": "#B23720", "check": "#4B31C2" } } },
  "verdict": { "go": { "label": "Go", "shape": "circle", "glyph": "●" }, "maybe": { …, "clip": "polygon(50% 0,100% 100%,0 100%)" }, "nogo": { … }, "check": { "label": "Needs your check", "shape": "diamond", "glyph": "◆" } },
  "radius": { "base": "8px" }, "easing": { … }, "duration": { … }, "layout": { "app": { "width": "390px", "maxWidth": "480px", "gutter": "20px", "cardGutter": "16px", "tapTarget": "44px", "tabBarHeight": "60px", "buttonHeight": "52px" } },
  "adjusted": [ /* every value changed from a design handoff, with the reason (mostly WCAG AA) */ ]
}
```

**Mapping between code and Figma:**

| Token | App CSS | Website (Tailwind) | Figma variable |
|---|---|---|---|
| `color.themes.<scheme>.bg` … `check` | `var(--c-bg)` … `var(--c-check)` | `bg-ts-bg`, `text-ts-ink` … | `color/bg` … `color/check` in "TenderScout" (dark) or "TenderScout · light" |
| `type.app.<role>` | the matching rule in `styles.css` (for example `.screen-title`) | `text-ts-*` (site roles) | text style `App/<Role>` |
| `radius.base` | `var(--r)` | `rounded-base` | corner radius 8 |
| `layout.app.*` | `--app-*` | n/a | frame sizes: 390 × 844, 20 px gutter, 16 px card gutter, 44 / 52 / 60 px heights |

Changing a token means editing `shared/tokens.json`, running `npm run tokens`, keeping `check-contrast.js` at 0
failures, and committing the generated files (CI fails if they are out of sync). In Figma, update the variable value
in both collections.

### 2.2 Components

**App (`index.html`, no framework).** Components are string-returning render helpers in `app.js` plus a section of
classes in `styles.css`. There is no Storybook. The rendered screens are the reference, and the iPhone pages in Figma
mirror them layer for layer.

| Component | `app.js` helper / renderer | Classes (`styles.css` section) | Figma layer name |
|---|---|---|---|
| Verdict / requirement status | `status(v, label, why)`, `vShape(v)`, `shape(kind)` | `.status.v-*`, `.shape.circle/.tri/.square/.diamond` (shapes) | `span.status.v-go`, `shape`, `shape ▲`, `shape ◆` |
| Score tile | inside `card()`, `bidCard()` | `.score` (status line, score tile, counts) | `span.score` |
| Tender card | `card(r, i)` | `.tcard`, `.tcard-body`, `.meta-row` (Feed) | `a.tcard.v-<verdict>` |
| Requirement card | `reqCard(t, c)` | `.req`, `.req-title`, `.req-check`, `.cite`, `.req-cta` (Tender detail) | `a.req.v-<status>` |
| Verdict header | `detail(id)` | `.vhead`, `.vhead-verdict`, `.vhead-score`, `.vhead-reason` | `header.vhead.v-*` |
| Bottom sheet | `reqSheet()`, `skipSheet()` | `.sheet-root`, `.scrim`, `.sheet`, `.sheet-foot`, `.quote` (bottom sheet) | `div.scrim`, `div.sheet` (pinned) |
| Buttons | inline in renderers | `.btn.btn-primary`, `.btn.btn-secondary`, `.icon-btn`, `.text-btn` (buttons) | `button.btn.btn-primary` … |
| Text tabs (filter, stage, appearance) | `feed()`, `bidCard()`, `about()` | `.tabs`, `[aria-checked="true"]` underlined in brand | `div.tabs.filter` |
| Switch, stepper, money field | `company()` | `.switch`, `.stepper`, `.money-field` (Company) | `button.switch` (+ `::before` knob) |
| Tab bar | `setTabs(active)` | `.tabbar` (bottom tab bar) | `nav.tabbar` (pinned) |
| Toast | `toast(msg, action)` | `.toast` | `div.toast.show` (pinned) |
| Nav row, wordmark, icon buttons | `navRow()`, `infoBtn()`, `themeBtn()`, `backBtn()` | `.nav`, `.wordmark` (+ `::before` dot), `.icon-btn` | `div.nav`, `span.wordmark` |
| Labels | `ai()`, `fiction()` | `.ai`, `.caption.fiction` | `span.ai`, `p.caption.fiction` |

Every interactive element keeps the `data-*` hook the event delegation relies on (`data-go`, `data-act`,
`data-filter`, `data-confirm`, `data-ask`, `data-skip`, `data-stage`, `data-unskip`, `data-cert`, `data-lang`,
`data-ref`, `data-field`, `data-stop`). A Figma change never removes one.

**Website (`site/`).** React components: `site/src/components/ui/` (`Icon`, `VerdictShape`, `VerdictTile`,
`TenderCard`, `Buttons`, `Photo`, `Primitives` with `Wordmark` / `SquareButton` / `SimulatedText`, `Accordion`, …),
page sections in `site/src/components/sections/`, the phone mock in `site/src/components/phone/PhoneDemo.tsx`, and the
How-it-decides page in `site/src/components/how/`. They read `@/generated/tokens` (for example `VerdictShape` takes
its clip path from `tokens.verdict.maybe.clip`). There is no Code Connect yet. If it is added, map the Figma component
sets "Status", "Score tile" and "Button" to `VerdictShape` + label, `VerdictTile` and `Button`.

### 2.3 Frameworks and build

| | App (root) | Website (`site/`) |
|---|---|---|
| UI | Vanilla ES5 in five classic scripts: `engine.js` (decision logic, UMD) → `data.js` → `ai.js` (simulated AI) → `insights.js` (win/loss arithmetic, UMD) → `app.js` (hash router, render functions, event delegation, `localStorage` key `tenderscout.v2`) | Next.js 16 (App Router), React 19, TypeScript, Framer Motion |
| Styling | Plain global CSS: `shared/tokens.css` + `styles.css` | Tailwind v4 with the generated `@theme` + `site/src/styles/components.css` |
| Build | None. Runs from `file://` and GitHub Pages (`main` / root) | `next build` (Vercel root = `site`; `STATIC_EXPORT=1` for a static preview); `prebuild` syncs the shared engine, data, tokens and fonts |
| Tests | `npm test`, `npm run preflight`, `node tests/smoke.js` (Playwright, ad hoc install), `node tests/declutter-scan.js`, `node shared/check-contrast.js` | `npm run check`, `npm run audit` |

### 2.4 Assets

- **Photos:** `assets/img/*.png` (`app-welcome`, `app-company`, `t-schools`, `t-audit`, `t-fibre`, `t-datacentre`).
  They are 200 px previews to be replaced by full-resolution files under the same names (CLAUDE.md §11 item 17).
  `data.js` names them in `tender.photo`, and `app.js` → `photoSrc(t)` builds `assets/img/<photo>.png`. They are
  rendered as `<img class="photo">` with `object-fit: cover` and the 8 px radius. The website keeps 3× JPEG upscales in
  `site/public/assets/` and serves them through `next/image`. The 45 sector previews are in `design/assets/sectors/`.
- **Fonts:** vendored in `fonts/` (`@font-face` at the top of `styles.css`, `font-display: swap` for text and `block`
  for icons), with licences in `fonts/LICENSES.md`. The website loads the same files through `next/font/local`.
- **No CDN, no runtime fetches.** Photos imported from Figma go into `assets/img/` under an existing name, or under a
  new one referenced from `data.js`. In Figma, photos are image fills on rectangles named `photo · <basename>`.

### 2.5 Icons

- One font: **Material Symbols Rounded**, a 38-glyph subset in `fonts/MaterialSymbolsRounded-subset.woff2` (wght
  300–400, FILL 0–1), shared with the website. Icons are **ligature names written as text**:

  ```js
  // app.js
  function icon(name, cls) { return '<span class="ms' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + name + '</span>'; }
  icon('chevron_left', 's22')   // → <span class="ms s22" aria-hidden="true">chevron_left</span>
  ```
  ```tsx
  // site
  <Icon name="arrow_forward" size={18} />
  ```
- Sizes are `.ms` (20 px), `.s18`, `.s22` and `.s24`. `.fill` switches to the filled style (the active tab). Icons are
  decorative (`aria-hidden`), and the button carries the `aria-label`.
- Names follow Google's snake_case. The app uses `info`, `contrast`, `chevron_left`, `arrow_forward`, `add`, `remove`,
  and `radar` / `bookmarks` / `domain` in the tab bar.
- **Adding an icon:** re-download the subset with the name added to `icon_names=` (alphabetical; the URL is in
  `fonts/LICENSES.md`), then run `npm run sync` in `site/`. Never import an SVG icon set or an icon CDN.
- **In Figma** an icon is a text layer in "Material Symbols Rounded" / Regular whose characters are the ligature name.
  Figma renders the glyph, so the layer stays editable and searchable. When implementing a Figma icon, read its
  characters, not its outline.

### 2.6 Styling approach

- **Global CSS with component sections.** `styles.css` is split into labelled sections (`/* ---------- Feed ---------- */`)
  with short, flat, BEM-ish class names per component. There are no CSS Modules, preprocessors or utility classes in
  the app.
- **Schemes:** `<html data-scheme="dark|light">`, set before first paint by the inline script in `index.html` (dark by
  default; `?theme=` deep link; About and the ◐ header button switch it). Every colour flips through the token custom
  properties, never through per-component overrides.
- **Layout:** mobile-first single column, designed at 390 px and centred up to 480 px. There are no breakpoints in the
  app; its only media query is `prefers-reduced-motion`, which turns off every transition and animation.
- **iPhone safe areas:** `viewport-fit=cover`, with `--safe-top` and `--safe-bottom` from `env(safe-area-inset-*)`
  applied on `.screen`, `.vhead`, the tab bar, the action bar, the sheet footer, the toast and the Welcome form.
- **Motion:** tokens `--ease-*` / `--dur-*` (`design/MOTION.md`): entrance pop 480 ms, sheet 320 ms, the switch →
  re-score morph 700 ms, and count-ups.
- **Verified:** `tests/declutter-scan.js` (static CSS and rendered DOM), `shared/check-contrast.js` (AA: the app's 46 pairs, the website's 33 since 6 Nov),
  `tests/smoke.js` (390 × 844, iPhone 13 / SE, dark, light and reduced motion).

### 2.7 Project structure

```
index.html  styles.css  app.js  engine.js  data.js  ai.js     the app (classic scripts, no build)
shared/     tokens.json → build-tokens.js → tokens.css (the website keeps frozen 3 Nov copies); check-contrast.js; how-it-decides.js
fonts/      assets/img/                                        vendored fonts and photos
tests/      engine, data, golden and invariant tests; smoke.js; declutter-scan.js; preflight.js; demo-record.js
site/       Next.js website (src/app, src/components/{ui,sections,phone,how}, src/generated, public/assets)
design/     designer handoffs and reference pages (*.dc.html: prototypes that load React from unpkg, not part of the app),
            MOTION.md, films/, website/; design/figma/ = the code → Figma pipeline (§5)
docs/       START_HERE.md, NAVIGATION.md (routes), HOW_IT_DECIDES.md (generated), demo/, reports/, this file
DESIGN.md   the visual source of truth · CLAUDE.md the handoff and decisions log · BRIEF.md the demo script
```

Features are organised by screen. A screen is one renderer in `app.js` (`welcome`, `feed`, `detail`, `reqSheet`,
`skipSheet`, `bids`, `company`, `about`), one section in `styles.css`, and one route in `docs/NAVIGATION.md`.

## 3. Figma → code (implementing a design)

1. `create_session` with the file key, then load the `figma-design-to-code` skill before `get_design_context`.
2. Treat the response as a reference. Map it onto what exists:
   - colours → the nine tokens (a bound `color/<token>` variable translates directly; anything else is a question
     for the team, not a new hex);
   - text → the `App/*` text styles / `type.app` roles;
   - radius → `var(--r)`;
   - spacing → the 20 / 16 px gutters and the 44 / 52 / 60 px heights;
   - layer names → selectors (the iPhone pages are named after the real classes, so `a.tcard.v-go` is `.tcard`).
3. Put the code where the screen lives: the renderer in `app.js` and its section in `styles.css`. New tokens go in
   `shared/tokens.json`. Keep every `data-*` hook, the verdict shape + label, the honesty labels and the ES5 syntax.
4. Ignore what the rules forbid even if the design has it: shadows, borders, gradients, extra radii, alpha tints,
   uppercase, extra fonts, CDN images. Say so in the PR.
5. Verify: `npm run preflight` (or at least `npm test`, `node tests/declutter-scan.js`, `node shared/check-contrast.js`)
   and `node tests/smoke.js`. If the design moves a demo number, update `tests/smoke.js`, `tests/demo-golden.test.js`
   and `BRIEF.md` in the same PR (`docs/START_HERE.md` conventions).

## 4. Code → Figma: what each frame is

Each iPhone frame is the real app rendered by Chromium at 390 × 844 with the iPhone 13/14 insets (47 px top, 34 px
bottom), turned into editable layers:
- one frame per DOM element that paints (or carries a class), named with its selector;
- one text layer per run of text, with styled segments (weight, size, token colour, underline with the CSS thickness
  and offset, ellipsis truncation);
- the verdict shapes as a circle, polygon (▲), square or rotated square (◆), and photos as image fills;
- elements that are `position: fixed` (tab bar, action bar, sheet, scrim, toast) as **fixed children**, so long screens
  scroll in prototype mode while the bars stay put;
- the status bar and home indicator as instances of the local components.

Nothing is a screenshot: the reference PNGs from `capture.js` never go into Figma (the figma-generate-design rule).

The 30 frames on each iPhone page, in a 10-per-row grid:

`01 Welcome` · `02 Reading your website` · `03 Check your profile` · `04 Feed` · `05 Feed · Maybe filter` · `06 Bids · empty` ·
`07 Tender · reading the pack` · `08 Tender · Go (Stadt Ellerbach)` · `09 Requirement sheet · Meets` · `10 Tender · Maybe (Stadtwerke Kaltbrunn)` ·
`11 Tender · Maybe (Universidad de Valdemora)` · `12 Tender · No-go (Landkreis Hohenau)` · `13 Requirement sheet · Needs your check` ·
`14 Tender · answer saved` · `15 Ask this tender · answer` · `16 Company` · `17 Company · re-score (No-go → Go)` · `18 Feed · after the re-score` ·
`19 Tender · Go after the change (Landkreis Hohenau)` · `20 Tender · No-go (Gemeente Vlietdam)` · `21 Skip reason sheet` · `22 Feed · skipped` ·
`23 Tender · No-go (Centre Hospitalier de Morlanne)` · `24 Tender · saved to Bids` · `25 Bids` · `26 About` · `27 Tender · Closed` ·
`28 Feed · closed tenders` · `29 Feed · offline` · `30 Not found`

The prototype (`prototype.figma.js`) follows the `BRIEF.md` demo path:
- Welcome → Reading (auto-advances after 2 s) → profile → Feed.
- Each card opens its tender. Ellerbach goes through the "reading the pack" state, which auto-advances after 1.5 s.
- Hohenau's ◆ line → sheet → "We meet it" → answer saved (auto-advances after 2 s) → Ask answer.
- Company → the ISO 27001 switch → re-score → Feed after the re-score.
- Vlietdam → Skip → reasons → skipped Feed → Ellerbach saved → Bids.
- Plus the tab bar (invisible tap areas), Back, ⓘ → About, Closed and Not found.

## 5. Code → Figma: the pipeline

```
node design/figma/capture.js          # renders all 30 states in dark and light → design/figma/out/{dark,light}/*.json + reference PNGs
node design/figma/make-batches.js     # packs them into design/figma/out/figma/NN-*.js (each ≤ 46 kB) + RUN.md
node design/figma/dry-run.js          # runs all of them in order against an in-memory model of the file: script errors, missing prototype targets, photo checksums
```

Always dry-run before spending real calls. On its first run it caught a bug that would have wasted every screen call:
each batch's replace list held all 30 names, so every batch deleted the frames the previous one had built.

Then run each `out/figma/NN-*.js`, in order, as the whole `code` argument of `use_figma` on the file (after one
`create_session`). The current split is 10 calls:

| # | Script | Does |
|---|---|---|
| 1–7 | `NN-screens-dark-*.js` | builds the 30 dark frames on "iPhone screens · dark" (the 7th also wires the prototype) |
| 8 | `08-light-page.js` | copies them onto "iPhone screens · light", rebinds every colour to the light variables, rebuilds About from the light capture, wires the light prototype |
| 9 | `09-photos-1.js` | places the five photos (inline JPEG, checked by length and byte sum) on both pages |
| 10 | `10-overview-page.js` | the design-system section (swatches, `App/*` text styles, Status / Score tile / Button sets), then removes the superseded first-attempt sections |

Properties of the scripts:
- **Re-runnable:** each script replaces only the frames, sections and styles it owns, found by exact name or id from
  `figma.config.json`. It never clears a page.
- **Self-checking:** every screen batch returns the ids it built, a node count, any per-layer errors, and a small
  screenshot of its first frame.
- **Token-checked:** `make-batches.js --check` reports any colour outside the tokens (there are none today), the
  screens whose light rendering differs in more than colour (today only About), and the batch sizes.

**Adding or changing a screen:** add a step to the flow at the bottom of `capture.js` (`await grab('31 …')`), keeping
the two-digit prefix, which sets the grid position. Re-run both scripts and run the batch that contains the screen. If
a new layer should be clickable, add a `link(…)` in `prototype.figma.js`.

**Photos without inline bytes:** if `mcp.figma.com` is reachable, `upload_assets` with `nodeIds` = the
`photo · …` rectangles and the PNGs from `assets/img/` is the simpler route.

## 6. Known gaps

- Photos and the 30-frame rebuild wait on the Starter plan's MCP call cap. The prepared scripts above are the
  complete remaining work. The current iPhone pages hold the first 11 screens.
- The SF Pro font is not reliably available to Figma's renderer, so the status-bar time uses Inter.
- The first 11 frames already in the file (built before the fixes of `CLAUDE.md` §11 item 119) still show the old square ◆, the photo overflow and the doubled top gap on the tender screens; the prepared batches replace them with captures of the fixed app.
- Website screens are not in Figma yet. The same capture approach works on `site/` pages at 390 and 1440 px.
