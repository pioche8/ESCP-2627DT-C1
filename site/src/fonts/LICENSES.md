# The website's vendored fonts

Copied into the repository so the site builds with no CDN and no build-time Google Fonts request (`next/font/local`).
The three shared files are byte-identical to the app's `fonts/` (`node site/scripts/sync-shared.mjs --check` compares them).
The IBM Plex Mono and Hanken Grotesk italic files came back on 6 Nov 2026 with the website's original 3 Nov design
(`CLAUDE.md` §11 item 139); the app does not use them, so they live here only.

| Files | Family | Licence |
|---|---|---|
| `HankenGrotesk-normal-400to800-*.woff2` | Hanken Grotesk, variable 400–800, upright (shared with the app) | SIL Open Font License 1.1 |
| `HankenGrotesk-italic-400-*.woff2` | Hanken Grotesk italic 400 (website only) | SIL Open Font License 1.1 |
| `IBMPlexMono-normal-500-*.woff2`, `IBMPlexMono-normal-600-*.woff2` | IBM Plex Mono 500 and 600 (website only: the mono labels and the map codes) | SIL Open Font License 1.1 |
| `MaterialSymbolsRounded-subset.woff2` | Material Symbols Rounded, the 38-icon subset (shared with the app; see `fonts/LICENSES.md` to add an icon) | Apache License 2.0 |

Latin and Latin Extended subsets as served by Google Fonts. OFL text: https://openfontlicense.org · Apache 2.0 text: https://www.apache.org/licenses/LICENSE-2.0
