# TenderScout · MOTION.md

The brand motion system for every TenderScout film, loop and in-app animation. It follows the motion-graphics-skills pack (charlie947): one clock, real content, one object changing shape.

## Brand
- **Wordmark:** "TenderScout", Hanken Grotesk 800, −0.03em. There is no logo mark.
- **Type:** Hanken Grotesk (400–800) for everything on screen. IBM Plex Mono 500/600 for page citations, EU sector codes and labels.
- **Story:** we read every new EU tender overnight, and by morning you know which ones you can win, with the page that proves it.

## Two palettes, one story
Harbor is **night** (reading). Sky is **morning** (results). Films travel from Harbor to Sky.

| Role | Harbor (night) | Sky (morning) |
|---|---|---|
| Ground | `#0C1633` navy, harbor-dusk photo | `#EEF3F8` cloud white, sky-clouds photo |
| Surface | `#121A30` | `#FFFFFF` |
| Ink | `#FFFFFF` | `#0E1B2B` |
| Muted | `#BCD7E8` | `#4A5A6D` |
| Accent | `#D81E5B` crimson pink | `#F2643A` amber-red |
| Second accent | `#1A7AA3` sea blue | `#5DB8F5` sky blue |

**Verdicts** (never decorative, always shape + label):
- Go ● `#13724B`
- Maybe ▲ `#F5A524` with `#1A1200` text
- No-go ■ `#D23A2E` (Harbor `#C93A22`)
- Needs your check ◆ `#6145E0`

## Motion rules
1. **One clock.** Every frame is a function of time (`window.seek` / the animations engine's T). There are no free-running CSS animations in films.
2. **Premium = one object changing shape.** A page counter becomes the verdict tiles. A tender card becomes the detail screen. A toggle becomes the re-score card. Never use a plain crossfade between two pictures.
3. **Ghost the start state.** Leave a faint outline where the card or tile began.
4. **Stagger by a beat.** Rows, tiles and letters each start 40–80 ms after the last.
5. **Keep the hold alive.** In every hold something small moves: the sector marquee, a progress tick, a cursor.
6. **Real content only.** Use the six fixture tenders, the 45 EU CPV sectors and the strings in DESIGN.md. Every made-up figure carries "Prototype · fictional data" on the frame.

## Curves and timing
| Name | Curve | Use |
|---|---|---|
| enter | easeOutCubic, 600–900 ms | Text and panels landing |
| morph | easeInOutQuart, 700–1200 ms | Shape changes (card → screen, bars → tiles) |
| pop | easeOutBack, 400–520 ms | Verdict chips, the re-score card, toggles |

Camera: slow push-ins of 2–4% per shot, and never a static frame. Durations: films 2.5–6 s per beat, loops 8 s (move 0–2.2 s, hold to 6.6 s, return by 8.0 s).

## Sizes
- Films: 1920 × 1080, 30 fps.
- Loop cover: 1080 × 1350.
- Text never smaller than 28 px at 1920 × 1080.

## Banned
Typewriter reveals on headlines (typing belongs only in input fields), glow, bouncing on text, gradients on text, stock people, fake testimonials, and any number that isn't in the brief.
