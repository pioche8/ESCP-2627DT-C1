# Copilot repository instructions for TenderScout

## Project overview

This repository contains the TenderScout prototype for a workshop / public-tender decision support app.

Primary goal: help a small business quickly decide whether a public tender is worth bidding on.

The app is designed around three outcomes:
- Go
- Maybe
- No-go

The interface must surface:
- a fit score from 0 to 100
- a clear recommendation
- supporting evidence and citations

## Repository conventions

- Treat `DESIGN.md` as the source of truth for all UI decisions.
- Do not rely on legacy CSS as the canonical design reference.
- Keep feature logic and scoring intact unless a task explicitly requests behavioral changes.
- Prefer clear, mobile-first, high-contrast, readability-focused code.
- Keep changes small and purposeful.

## File guidance

- `app.js`: primary app behavior and UI rendering logic
- `engine.js`: scoring / decision logic and evidence calculations
- `data.js`: content and sample tender data
- `styles.css`: legacy styling; only edit if required and only after checking `DESIGN.md`
- `README.md`: onboarding and project description
- `BRIEF.md`: workshop/demo narrative
- `ARCHITECTURE.md`: broader architecture and system notes
- `DESIGN.md`: authoritative visual specification

## Design rules

- Build for a phone-first experience.
- Use a single-column layout when possible.
- Use high-contrast labels and clear hierarchy.
- Favor simple cards, readable spacing, accessible type, and strong semantic color states.
- Keep evidence and recommendation visually distinct from secondary content.
- Preserve trust and clarity: decisions should feel explainable and supported by citations.

## Quality bar

Before concluding work:
- verify the app still loads cleanly
- preserve existing business logic and scoring outputs
- validate that related tests or browser checks still pass if they exist
- confirm the UI matches the approved design direction in `DESIGN.md`

## Scope

This repo is a prototype, not a production enterprise app. Keep solutions practical, understandable, and aligned with the workshop brief.
