# Image Merger

Merge 2 or more images into one at a chosen resolution. Images are **auto-fitted** (scaled to fit while keeping aspect ratio) in the output.

## Features

- **Multiple images** — Add 2 or more images via drag-and-drop or file picker
- **Output resolution** — Presets: 1080p, 720p, 4K, Square 1:1, Portrait 9:16, Instagram
- **Layout** — Auto, Horizontal, Vertical, or Grid
- **Auto-fit** — Each image is scaled to fit its cell (contain), centered
- **Export** — Download as PNG or JPEG at the exact selected resolution

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## How it works

1. Upload images (2+).
2. Choose output resolution (e.g. 1920×1080).
3. Choose layout (Auto picks a sensible grid from image count).
4. Preview updates; each image is fitted inside its cell.
5. Download PNG or JPEG at the selected resolution.

No server required — everything runs in the browser.
