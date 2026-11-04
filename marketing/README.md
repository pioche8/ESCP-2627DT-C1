# marketing/

Backup demo video, rendered from the launch film (`design/films/TenderScout Launch Film.dc.html`, 45 s). First rendered on 3 Nov 2026 from the designer's film; re-rendered on 4 Nov 2026 after the film source was restyled to the decluttered token set (the dark scheme's nine colours, one typeface, one 8 px radius, no gradients, shadows, pills, mono or text on photos).

| File | What |
|---|---|
| `TenderScout-launch-film-1920x1080.mp4` | 45 s, 1920 × 1080, 30 fps, H.264 yuv420p bt709, no audio. The harbour at night, the 777-page read, the phone, the proof beat, the ISO 27001 lever (No-go → Maybe → Go after "We meet it"), the CTA. |
| `TenderScout-launch-reel-1080x1920.mp4` | The same film as a 9:16 reel: headline in the safe zone, film at 1080 × 608, silent AAC track so uploads work. |
| `render-frames.js` | Playwright harness: `?render` semantics, `window.seek` per frame through the stage's seek event, fonts loaded before frame 0. React, ReactDOM and Babel are served from local copies (npm registry) because the CDN is not reachable from the build sessions; the film page declares the vendored fonts itself. |
| `encode.sh` | ffmpeg commands for both files. |

Every figure in the film comes from `data.js` (6 tenders, 777 pages, 4 languages, Hohenau 25 → 90 → 100); each frame carries "Prototype · fictional data".
