# AGENTS.md

## Cursor Cloud specific instructions

**Image Merger** is a fully client-side React (Vite) web app — no backend, no database, no Docker required.

### Services

| Service | Command | URL |
|---------|---------|-----|
| Vite dev server | `npm run dev` | http://localhost:5273 |

### Quick reference

- **Dev**: `npm run dev` (port 5273, configured in `vite.config.js`)
- **Build**: `npm run build` (outputs to `dist/`)
- **Preview**: `npm run preview` (serves `dist/`)
- No linter or test framework is configured in this project.

### Caveats

- The app requires uploading 2+ images before the merge preview appears.
- All image processing is in-browser via Canvas API; no external services needed.
- Google Fonts (DM Sans, JetBrains Mono) load from CDN; the UI degrades gracefully without internet.
