# marketing/

Backup demo video, rendered from the designer's launch film (`design/films/TenderScout Launch Film.dc.html`, 45 s) on 3 Nov 2026.

| File | What |
|---|---|
| `TenderScout-launch-film-1920x1080.mp4` | 45 s, 1920 × 1080, 30 fps, H.264 yuv420p bt709, no audio. Harbor night → Sky morning, the proof beat, the ISO 27001 lever, the CTA. |
| `TenderScout-launch-reel-1080x1920.mp4` | The same film as a 9:16 reel: headline in the safe zone, film at 1080 × 608, silent AAC track so uploads work. |
| `render-frames.js` | Playwright harness: `?render` semantics, `window.seek` per frame through the stage's seek event, fonts loaded before frame 0. |
| `encode.sh` | ffmpeg commands for both files. |

Every figure in the film comes from `data.js` or `DESIGN.md`; each frame carries "Prototype · fictional data".
