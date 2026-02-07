# Summary of changes (conversation log)

Use this to see what was done so far. Update it at the end of each iteration that changes code or config.

---

## Iteration 1 (scan + optimize + rule)

- **`.cursor/rules/code-standards.mdc`** — New rule: optimized code, architecture-aware changes, concise output, comments only when needed, change summary at end of each iteration.
- **`src/App.jsx`**
  - Top-level constants: `MAX_IMAGES`, `DEFAULT_CROP`, `DEFAULT_ZOOM`, `DEFAULT_PAN`, `FIT_OPTIONS`, `LAYOUT_OPTIONS`, `ZOOM_ORIGINS` (no per-render array/object creation).
  - Replaced inline option arrays with these constants in toolbar and adjust panel.
  - `setImageSetting` and reset button use `DEFAULT_*` instead of `defaultCrop()`/`defaultZoom()`/`defaultPan()`.
  - Adjust panel: single `adjustSettings = getImageSetting(adjustIndex)` in an IIFE; all sliders/buttons use `adjustSettings` (fewer getter calls, clearer JSX).
  - Removed redundant state comments. `addFiles` uses `MAX_IMAGES` and filters with `.slice(0, MAX_IMAGES)`.
- **`src/ImageMerger.jsx`**
  - Replaced block comment with one-line comment. Removed unused `previewRef`.
  - `getDefaultCrop`/`getDefaultZoom`/`getDefaultPan` replaced by constants `DEFAULT_CROP`, `DEFAULT_ZOOM`, `DEFAULT_PAN`; all merge sites use spread of these.
  - Removed redundant blob URL comment in `loadImage`.

No behavior change. Lint: clean.

---

## Iteration 2 (Canva-inspired templates)

- **`src/ImageMerger.jsx`** — Added 4 templates inspired by Canva photo-collage styles:
  - **Scrapbook**: warm cream/beige bg (`#f5f0e8`), mat `#faf8f5`, gap 12, padding 10, borderRadius 8 (album/scrapbook feel).
  - **Moodboard**: light gray bg `#e8e6e1`, gap 8, padding 6, borderRadius 12 (mood-board / vision-board look).
  - **Retro**: peach/warm bg `#f5e6d3`, gap 10, borderRadius 6 (vintage/retro).
  - **Modern Light**: white-ish bg `#fafafa`, thin border `#e0e0e0`, gap 4, padding 4, borderRadius 4 (clean modern frames).
- **`PROJECT_SUMMARY.md`** — Updated template list to include Scrapbook, Moodboard, Retro, Modern Light.
