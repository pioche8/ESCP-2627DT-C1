# The website's vendored fonts

Copied into the repository so the site builds with no CDN and no build-time Google Fonts request (`next/font/local`).
They are byte-identical to the app's `fonts/` (`node site/scripts/sync-shared.mjs --check` compares them). Since 7 Nov 2026
the website uses one typeface again, upright only (`CLAUDE.md` §11, pass 5): the IBM Plex Mono and Hanken Grotesk italic files
that came back with the 3 Nov design on 6 Nov were removed.

| Files | Family | Licence |
|---|---|---|
| `HankenGrotesk-normal-400to800-*.woff2` | Hanken Grotesk, variable 400–800, upright (shared with the app) | SIL Open Font License 1.1 |
| `MaterialSymbolsRounded-subset.woff2` | Material Symbols Rounded, the icon subset (shared with the app; see `fonts/LICENSES.md` to add an icon) | Apache License 2.0 |

Latin and Latin Extended subsets as served by Google Fonts. OFL text: https://openfontlicense.org · Apache 2.0 text: https://www.apache.org/licenses/LICENSE-2.0
