# marketing/

Backup demo video, rendered from the launch film (`design/films/TenderScout Launch Film.dc.html`, 45 s). First rendered on 3 Nov 2026 from the designer's film; re-rendered on 4 Nov 2026 after the film source was restyled to the decluttered token set (the dark scheme's nine colours, one typeface, one 8 px radius, no gradients, shadows, pills, mono or text on photos); re-rendered on 10 Nov 2026 (pass 8) after its phone scenes were redrawn to the app as it is since pass 5.

| File | What |
|---|---|
| `TenderScout-launch-film-1920x1080.mp4` | 45 s, 1920 × 1080, 30 fps, H.264 yuv420p bt709, no audio. The harbour at night, the 777-page read, the phone (the app's Feed with its filter tabs and five-tab bar), the proof beat (the Hohenau card grows into the tender, which opens on "Can you qualify?" with the knock-out first and the citation in the brand colour), the lever (Company's re-score card with the score: ISO 27001 → Landkreis Hohenau 25 → 90, No-go → Maybe; then "We meet it" on the unclear line in the requirement sheet → 25 → 100, Go), the numbers, the CTA. |
| `TenderScout-launch-reel-1080x1920.mp4` | The same film as a 9:16 reel: headline in the safe zone, film at 1080 × 608, silent AAC track so uploads work. |
| `render-frames.js` | Playwright harness: `?render` semantics, `window.seek` per frame through the stage's seek event, fonts loaded before frame 0. React, ReactDOM and Babel are served from local copies (npm registry) because the CDN is not reachable from the build sessions; the film page declares the vendored fonts itself. |
| `reel-overlay.html`, `render-overlay.js` | The reel's headline overlay (a transparent 1080 × 1920 PNG: the wordmark, "Every night, we read every new EU tender.", the line under the film and the real-and-fictional line), committed in pass 8 so the reel can be rebuilt; the 4 Nov overlay was never committed. |
| `encode.sh` | ffmpeg commands for both files. |

Every figure in the film comes from `data.js` and the engine (6 tenders, 777 pages, 4 languages, Hohenau 25 → 90 → 100). Each frame carries "Prototype · real rules, fictional companies and tenders": the decision rules are real code, every company, buyer and tender is fictional.

Rebuild (from the repository root; the CDN is blocked here, so the three libraries come from the npm registry):

```bash
npm install --no-save --prefix /tmp/libs react@18.3.1 react-dom@18.3.1 @babel/standalone@7.29.0
```

Serve the repository root and a `libs/` folder holding `react.production.min.js`, `react-dom.production.min.js` and `babel.min.js` over HTTP, then:

```bash
LIBS=http://127.0.0.1:8125/libs node marketing/render-frames.js "http://127.0.0.1:8126/design/films/TenderScout%20Launch%20Film.dc.html" work/frames 30
```

```bash
node marketing/render-overlay.js work/reel-overlay.png && bash marketing/encode.sh work
```
