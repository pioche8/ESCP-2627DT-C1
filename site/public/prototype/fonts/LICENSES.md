# Vendored fonts

These fonts are copied into the repo so the prototype runs from GitHub Pages and from `file://` with no CDN.
Files are the Latin and Latin Extended subsets as served by Google Fonts (downloaded 2 Nov 2026).

| Files | Family | Licence |
|---|---|---|
| `HankenGrotesk-*.woff2` | Hanken Grotesk (variable 400–800, upright only: the italic and the IBM Plex Mono files were removed on 4 Nov 2026) | SIL Open Font License 1.1 |
| `MaterialSymbolsRounded-subset.woff2` | Material Symbols Rounded (variable wght 300–400, FILL 0–1), cut down to the 38 icons the app and the website use (re-cut 3 Nov 2026, shared with `site/src/fonts/`) | Apache License 2.0 |

OFL text: https://openfontlicense.org · Apache 2.0 text: https://www.apache.org/licenses/LICENSE-2.0

If you add an icon, re-download the Material Symbols subset with the new name added to `icon_names=` (names sorted alphabetically), then run `npm run sync` in `site/` so the website gets the same file:

```
https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,300..400,0..1,0&icon_names=add,apps,arrow_back,arrow_downward,arrow_forward,badge,bookmark,bookmark_add,bookmarks,cancel,check,check_circle,chevron_left,close,cloud_off,code,contrast,description,domain,event_busy,help,info,language,light_mode,lock,menu_book,north_east,play_arrow,radar,remove,restart_alt,rule,science,trending_down,trending_up,tune,undo,warning&display=block
```
