# Vendored fonts

These fonts are copied into the repo so the prototype runs from GitHub Pages and from `file://` with no CDN.
Files are the Latin and Latin Extended subsets as served by Google Fonts (downloaded 2 Nov 2026).

| Files | Family | Licence |
|---|---|---|
| `HankenGrotesk-*.woff2` | Hanken Grotesk (variable 400–800, italic 400) | SIL Open Font License 1.1 |
| `IBMPlexMono-*.woff2` | IBM Plex Mono 500, 600 | SIL Open Font License 1.1 |
| `MaterialSymbolsRounded-subset.woff2` | Material Symbols Rounded (variable wght 300–400, FILL 0–1), cut down to the 31 icons the app uses | Apache License 2.0 |

OFL text: https://openfontlicense.org · Apache 2.0 text: https://www.apache.org/licenses/LICENSE-2.0

If you add an icon, re-download the Material Symbols subset with the new name added to `icon_names=` (names sorted alphabetically):

```
https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..400,0..1,0&icon_names=add,arrow_forward,badge,bookmark,bookmark_add,bookmarks,cancel,check,check_circle,chevron_left,close,cloud_off,code,contrast,description,domain,event_busy,help,info,language,lock,menu_book,radar,remove,restart_alt,rule,science,trending_down,trending_up,tune,undo&display=block
```
