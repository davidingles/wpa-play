---
description: "PWA Play — Code conventions and rules for this project"
applyTo: "**/*.{js,css,html,json,md}"
---

# PWA Play — Coding Conventions

## Project Rules
- **No frameworks** — pure HTML/CSS/JS only (no Tailwind, no React, no build tools)
- **No backend** — all data is client-side only (IndexedDB for persistence)
- **Mobile-first** design with safe-area-inset support
- Dark mode with `#0f172a` base, `#8b5cf6` (violet) accent

## File Conventions
- **Line endings**: LF only (`.gitattributes` enforces this)
- **Indentation**: 2 spaces (no tabs)
- **JS style**: IIFE wrapping, `'use strict'`, no semicolons after function declarations
- **CSS**: External `styles.css` with CSS custom properties (`--var`)

## Architecture
- `index.html` — Semantic HTML, PWA meta tags, no inline styles
- `styles.css` — External CSS, custom properties, dark theme
- `app.js` — IIFE, file picker, playlist, playback logic
- `sw.js` — Service Worker (cache-first static, network-first navigation)
- `manifest.json` — PWA manifest (standalone, dark theme)
- `vercel.json` — Vercel hosting config

## Persistence
- **IndexedDB** (`pwa-play-db`) for storing audio files as ArrayBuffers
- Songs have `id` field (`song_<timestamp>_<random>`) for IDB keying
- `restoreSongs()` loads from IDB on startup
- `addSongs()` saves to IDB after file picker
- `removeSong()` deletes from both array and IDB

## CSS Variables (Colors)
- `--surface-900: #0f172a` (background)
- `--surface-800: #1e293b`
- `--accent: #8b5cf6` (violet)
- `--accent-light: #a78bfa`

## Deployment
- Static site on Vercel — no build step needed
- Service Worker registered in `app.js`
- Icons: `icons/icon-192.png` and `icons/icon-512.png`

## Important Notes
- Never use `URL.createObjectURL()` without IndexedDB backup
- Always revoke blob URLs with `URL.revokeObjectURL()` when removing songs
- Test on mobile devices — this is a mobile-first PWA
