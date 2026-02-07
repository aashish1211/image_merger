# Image Merger — Project Summary

Use this summary as context for any query related to this project.

---

## What It Is

**Image Merger** is a client-side React (Vite) web app that lets users merge 2+ images into one at a chosen resolution. All processing runs in the browser (Canvas API); no server or third-party image libraries. Images are auto-fitted (scale to fit or crop to fill) in a grid/layout.

---

## Tech Stack

- **React 18** + **JSX**
- **Vite 5** (build tool, dev server on port **5273**)
- **No image libs** — uses native `Image()`, `HTMLCanvasElement`, `CanvasRenderingContext2D` (drawImage, clip, etc.)
- **Fonts**: DM Sans, JetBrains Mono (Google Fonts)

---

## Project Structure

| Path | Purpose |
|------|--------|
| `index.html` | Entry HTML; mounts React via `/src/main.jsx` |
| `src/main.jsx` | React root; renders `<App />` in StrictMode |
| `src/App.jsx` | Main UI: upload zone, resolution/layout/template/fit options, thumbnails, adjust panel, clear. Owns `images`, `resolution`, `layout`, `template`, `colsPerRow`, `fitMode`, `imageSettings`, `adjustIndex`. |
| `src/ImageMerger.jsx` | Core merge logic: loads images, computes grid, draws to canvas with templates, handles PNG/JPEG download. Exports `ImageMerger`, `SingleImagePreview`, `MERGE_TEMPLATES`. |
| `src/App.css` | Styles for app, toolbar, upload, thumbs, adjust panel, merger card, buttons. |
| `src/index.css` | Global styles and CSS variables (dark theme: `--bg`, `--surface`, `--accent`, etc.). |
| `vite.config.js` | Vite + React plugin; `server.port: 5273`. |
| `package.json` | Scripts: `dev`, `build`, `preview`. Deps: react, react-dom; dev: vite, @vitejs/plugin-react. |
| `.cursor/rules/code-standards.mdc` | Rule: optimized code, architecture-aware, concise, minimal comments, change summary each iteration. |
| `CHANGES_SUMMARY.md` | Log of changes per iteration; update at end of each code/config change. |

---

## Features (from App + ImageMerger)

- **Upload**: Drag-and-drop or file picker; 2+ images (capped at 20); image MIME only.
- **Output resolution**: Presets (1080p, 720p, 4K, 5K, 8K, Square 1:1, Portrait 9:16, Instagram) or Custom (1–16384 per side).
- **Layout**: Auto, Horizontal, Vertical, Grid; columns per row: 2–5. Last row fills (no empty cells).
- **Fit**: Global default + per-image: “Stretch to fit” (contain) or “Crop to fill” (cover).
- **Templates** (`MERGE_TEMPLATES` in ImageMerger.jsx): Default, Framed, Polaroid, Chunky, Gallery, Minimal, Overlap (stacked with shadow), Background (first image as dim background, rest in grid), Scrapbook (warm cream/beige), Moodboard (light gray, rounded), Retro (peach/warm), Modern Light (white, thin border).
- **Per-image adjust panel** (◇ on thumbnail): Crop (L/T/R/B 0–90%), Zoom (50–200%), Zoom origin (center, corners), Pan (align), and per-image fit. Live preview via `SingleImagePreview`.
- **Export**: Download merged result as PNG or JPEG at selected resolution (filename: `merged-{width}x{height}.png|jpg`).

---

## Key Data & Limits

- **Max canvas dimension**: 16384 (in both App and ImageMerger).
- **Max images**: 20.
- **Image source**: User-selected files only (blob URLs); no arbitrary URLs. No cross-origin for blob URLs.
- **imageSettings**: `{ [index]: { cropLeft, cropTop, cropRight, cropBottom, zoom, zoomOrigin, panX, panY, fitMode } }`; crop/pan in 0–1; zoom origin: `'center' | 'leftTop' | 'rightTop' | 'bottomLeft' | 'bottomRight'`.

---

## How Merge Works (ImageMerger.jsx)

1. `getGridShape(count, layout, colsPerRow)` → `{ cols, rows }` (auto/horizontal/vertical/grid rules).
2. Load all image URLs with `loadImage()` (Promise + Image()), store in `loaded`.
3. For each cell: compute crop box from imageSettings → apply zoom/origin/pan via `applyZoomToCropBox` → draw with fit or fill into cell (with template padding/gap/border/mat/roundRect). Creative templates: Overlap (stacked), Background (first image dimmed, rest overlay).
4. Canvas size = chosen width×height (capped at MAX_CANVAS_DIMENSION).
5. Download: `canvas.toBlob()` → object URL → `<a download>`.

---

## Run / Build

- Install: `npm install`
- Dev: `npm run dev` → e.g. http://localhost:5273
- Build: `npm run build`; preview: `npm run preview`

---

## Security / Constraints

- Input limits (count, dimensions) to reduce DoS risk.
- No image data sent to server; all processing client-side.

---

*Last updated from project file review. Use this file as the single source of context for project-related questions.*
