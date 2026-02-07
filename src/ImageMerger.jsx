import { useState, useEffect, useRef } from 'react'

// Client-only merge via Canvas API; blob URLs only; dimension/count limits enforced.
const MAX_CANVAS_DIMENSION = 16384

export const MERGE_TEMPLATES = {
  default: {
    id: 'default',
    name: 'Default',
    gap: 0,
    padding: 0,
    borderWidth: 0,
    borderColor: '#333',
    backgroundColor: '#0a0c10',
    matColor: null,
    borderRadius: 0,
  },
  framed: {
    id: 'framed',
    name: 'Framed',
    gap: 0,
    padding: 12,
    borderWidth: 3,
    borderColor: '#2a2a2a',
    backgroundColor: '#0a0c10',
    matColor: '#1a1a1a',
    borderRadius: 0,
  },
  polaroid: {
    id: 'polaroid',
    name: 'Polaroid',
    gap: 16,
    padding: 14,
    borderWidth: 0,
    borderColor: '#eee',
    backgroundColor: '#f0ebe0',
    matColor: '#fafaf8',
    borderRadius: 2,
  },
  chunky: {
    id: 'chunky',
    name: 'Chunky',
    gap: 14,
    padding: 0,
    borderWidth: 0,
    borderColor: '#111',
    backgroundColor: '#0d0d0d',
    matColor: null,
    borderRadius: 0,
  },
  gallery: {
    id: 'gallery',
    name: 'Gallery',
    gap: 6,
    padding: 4,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#141414',
    matColor: null,
    borderRadius: 8,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    gap: 3,
    padding: 0,
    borderWidth: 0,
    borderColor: '#333',
    backgroundColor: '#0a0c10',
    matColor: null,
    borderRadius: 0,
  },
  overlap: {
    id: 'overlap',
    name: 'Overlap',
    creative: true,
    overlapOffset: 48,
    shadowOffset: 8,
  },
  background: {
    id: 'background',
    name: 'Background',
    creative: true,
    backgroundOpacity: 0.35,
    overlayGap: 8,
    overlayPadding: 6,
    overlayRadius: 12,
  },
  scrapbook: {
    id: 'scrapbook',
    name: 'Scrapbook',
    gap: 12,
    padding: 10,
    borderWidth: 0,
    borderColor: '#d4c4a8',
    backgroundColor: '#f5f0e8',
    matColor: '#faf8f5',
    borderRadius: 8,
  },
  moodboard: {
    id: 'moodboard',
    name: 'Moodboard',
    gap: 8,
    padding: 6,
    borderWidth: 0,
    borderColor: '#ddd',
    backgroundColor: '#e8e6e1',
    matColor: null,
    borderRadius: 12,
  },
  retro: {
    id: 'retro',
    name: 'Retro',
    gap: 10,
    padding: 0,
    borderWidth: 0,
    borderColor: '#e8d5c4',
    backgroundColor: '#f5e6d3',
    matColor: null,
    borderRadius: 6,
  },
  modernLight: {
    id: 'modernLight',
    name: 'Modern Light',
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    matColor: null,
    borderRadius: 4,
  },
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.src = url
  })
}

function getGridShape(count, layout, colsPerRow = null) {
  if (layout === 'horizontal') return { cols: count, rows: 1 }
  if (layout === 'vertical') return { cols: 1, rows: count }
  if (colsPerRow != null) {
    const cols = Math.min(colsPerRow, count)
    const rows = Math.ceil(count / cols)
    return { cols, rows }
  }
  if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    return { cols, rows }
  }
  // auto
  if (count <= 2) return { cols: count, rows: 1 }
  if (count === 3) return { cols: 3, rows: 1 }
  if (count <= 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  return { cols, rows }
}

const DEFAULT_CROP = { cropLeft: 0, cropTop: 0, cropRight: 0, cropBottom: 0 }
const DEFAULT_ZOOM = { zoom: 1, zoomOrigin: 'center' }
const DEFAULT_PAN = { panX: 0, panY: 0 }

function applyZoomToCropBox(sx0, sy0, sw0, sh0, zoom, zoomOrigin, panX = 0, panY = 0, imgW = 0, imgH = 0) {
  const visibleW = Math.min(sw0, Math.max(1, sw0 / zoom))
  const visibleH = Math.min(sh0, Math.max(1, sh0 / zoom))
  let sx = sx0
  let sy = sy0
  switch (zoomOrigin) {
    case 'center':
      sx = sx0 + (sw0 - visibleW) / 2
      sy = sy0 + (sh0 - visibleH) / 2
      break
    case 'leftTop':
      sx = sx0
      sy = sy0
      break
    case 'rightTop':
      sx = sx0 + sw0 - visibleW
      sy = sy0
      break
    case 'bottomLeft':
      sx = sx0
      sy = sy0 + sh0 - visibleH
      break
    case 'bottomRight':
      sx = sx0 + sw0 - visibleW
      sy = sy0 + sh0 - visibleH
      break
    default:
      sx = sx0 + (sw0 - visibleW) / 2
      sy = sy0 + (sh0 - visibleH) / 2
  }
  sx = Math.max(sx0, Math.min(sx0 + sw0 - visibleW, sx))
  sy = Math.max(sy0, Math.min(sy0 + sh0 - visibleH, sy))
  let maxShiftX = Math.max(0, sw0 - visibleW)
  let maxShiftY = Math.max(0, sh0 - visibleH)
  if (maxShiftX === 0 && zoom >= 1) maxShiftX = sw0 * 0.5
  if (maxShiftY === 0 && zoom >= 1) maxShiftY = sh0 * 0.5
  sx += panX * maxShiftX
  sy += panY * maxShiftY
  const clampMinX = imgW > 0 ? 0 : sx0
  const clampMaxX = imgW > 0 ? Math.max(0, imgW - visibleW) : sx0 + sw0 - visibleW
  const clampMinY = imgH > 0 ? 0 : sy0
  const clampMaxY = imgH > 0 ? Math.max(0, imgH - visibleH) : sy0 + sh0 - visibleH
  sx = Math.max(clampMinX, Math.min(clampMaxX, sx))
  sy = Math.max(clampMinY, Math.min(clampMaxY, sy))
  return { sx, sy, visibleW, visibleH }
}

function getSourceRect(img, settings) {
  const imgW = img.naturalWidth || img.width
  const imgH = img.naturalHeight || img.height
  if (!imgW || !imgH) return null
  const { cropLeft, cropTop, cropRight, cropBottom, zoom, zoomOrigin, panX, panY } = settings
  const sx0 = cropLeft * imgW
  const sy0 = cropTop * imgH
  const sw0 = Math.max(1, (1 - cropLeft - cropRight) * imgW)
  const sh0 = Math.max(1, (1 - cropTop - cropBottom) * imgH)
  return applyZoomToCropBox(sx0, sy0, sw0, sh0, zoom, zoomOrigin, panX, panY, imgW, imgH)
}

function drawImageInCell(ctx, img, sx, sy, visibleW, visibleH, x, y, w, h, isFit) {
  if (isFit) {
    ctx.drawImage(img, sx, sy, visibleW, visibleH, x, y, w, h)
  } else {
    const scale = Math.max(w / visibleW, h / visibleH)
    const drawW = visibleW * scale
    const drawH = visibleH * scale
    ctx.drawImage(img, sx, sy, visibleW, visibleH, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH)
  }
}

export function SingleImagePreview({ url, settings, width = 360, height = 240 }) {
  const canvasRef = useRef(null)
  const [img, setImg] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    loadImage(url)
      .then((loaded) => { if (!cancelled) setImg(loaded) })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Failed to load') })
    return () => { cancelled = true }
  }, [url])

  useEffect(() => {
    if (!img || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const s = { ...DEFAULT_CROP, ...DEFAULT_ZOOM, ...DEFAULT_PAN, ...settings }
    const rect = getSourceRect(img, s)
    if (!rect) return
    const { sx, sy, visibleW, visibleH } = rect

    const w = Math.min(width, MAX_CANVAS_DIMENSION)
    const h = Math.min(height, MAX_CANVAS_DIMENSION)
    canvas.width = w
    canvas.height = h
    ctx.fillStyle = '#0a0c10'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, sx, sy, visibleW, visibleH, 0, 0, w, h)
  }, [img, settings, width, height])

  if (error) return <div className="single-image-preview single-image-preview-error">{error}</div>
  if (!img) return <div className="single-image-preview single-image-preview-loading">Loading…</div>
  return (
    <div className="single-image-preview" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} aria-label="Live preview" />
    </div>
  )
}

function drawOverlapTemplate(ctx, imageElements, safeW, safeH, fitMode, imageSettings) {
  const count = imageElements.length
  const t = MERGE_TEMPLATES.overlap
  const offset = t.overlapOffset ?? 48
  const shadowOffset = t.shadowOffset ?? 8

  ctx.fillStyle = '#0f1216'
  ctx.fillRect(0, 0, safeW, safeH)

  for (let i = 0; i < count; i++) {
    const img = imageElements[i]
    const settings = { ...DEFAULT_CROP, ...DEFAULT_ZOOM, ...DEFAULT_PAN, ...imageSettings[i] }
    const rect = getSourceRect(img, settings)
    if (!rect) continue
    const { sx, sy, visibleW, visibleH } = rect
    const isFit = (settings.fitMode ?? fitMode) === 'fit'

    const x = i * offset
    const y = i * offset
    const w = Math.max(1, safeW - i * offset * 2)
    const h = Math.max(1, safeH - i * offset * 2)

    ctx.save()
    if (shadowOffset > 0 && i < count - 1) {
      ctx.shadowColor = 'rgba(0,0,0,0.45)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = shadowOffset
      ctx.shadowOffsetY = shadowOffset
    }
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    drawImageInCell(ctx, img, sx, sy, visibleW, visibleH, x, y, w, h, isFit)
    ctx.restore()
  }
}

function drawBackgroundTemplate(ctx, imageElements, safeW, safeH, layout, colsPerRow, fitMode, imageSettings) {
  const count = imageElements.length
  const t = MERGE_TEMPLATES.background
  const bgOpacity = t.backgroundOpacity ?? 0.35
  const gap = t.overlayGap ?? 8
  const padding = t.overlayPadding ?? 6
  const radius = t.overlayRadius ?? 12

  if (count === 0) return
  const bgImg = imageElements[0]
  const imgW0 = bgImg.naturalWidth || bgImg.width
  const imgH0 = bgImg.naturalHeight || bgImg.height
  ctx.fillStyle = '#0a0c10'
  ctx.fillRect(0, 0, safeW, safeH)
  if (imgW0 && imgH0) {
    ctx.globalAlpha = bgOpacity
    const scale = Math.max(safeW / imgW0, safeH / imgH0)
    const dw = imgW0 * scale
    const dh = imgH0 * scale
    ctx.drawImage(bgImg, 0, 0, imgW0, imgH0, (safeW - dw) / 2, (safeH - dh) / 2, dw, dh)
    ctx.globalAlpha = 1
  }

  if (count === 1) return
  const rest = imageElements.slice(1)
  const n = rest.length
  const { cols, rows } = getGridShape(n, layout, colsPerRow)
  const totalGapW = gap * (cols - 1)
  const totalGapH = gap * (rows - 1)
  const cellWidth = (safeW - totalGapW) / cols
  const cellHeight = (safeH - totalGapH) / rows
  const roundRect = typeof ctx.roundRect === 'function' ? ctx.roundRect.bind(ctx) : null

  rest.forEach((img, idx) => {
    const i = idx + 1
    const row = Math.floor(idx / cols)
    const col = idx % cols
    const isLastRow = row === rows - 1
    const cellsInRow = isLastRow ? n - row * cols : cols
    const cw = (safeW - gap * (cellsInRow - 1)) / cellsInRow
    const ch = (safeH - gap * (rows - 1)) / rows
    const x = col * (cw + gap)
    const y = row * (ch + gap)

    const settings = { ...DEFAULT_CROP, ...DEFAULT_ZOOM, ...DEFAULT_PAN, ...imageSettings[i] }
    const rect = getSourceRect(img, settings)
    if (!rect) return
    const { sx, sy, visibleW, visibleH } = rect
    const isFit = (settings.fitMode ?? fitMode) === 'fit'

    const innerX = x + padding
    const innerY = y + padding
    const innerW = cw - padding * 2
    const innerH = ch - padding * 2

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetX = 4
    ctx.shadowOffsetY = 4
    if (roundRect && radius > 0) {
      ctx.beginPath()
      roundRect(x, y, cw, ch, radius)
      ctx.clip()
    }
    ctx.fillStyle = 'rgba(20,20,24,0.92)'
    ctx.fillRect(x, y, cw, ch)
    if (innerW > 0 && innerH > 0) {
      if (roundRect && radius > 0) {
        ctx.save()
        ctx.beginPath()
        roundRect(innerX, innerY, innerW, innerH, Math.max(0, radius - 4))
        ctx.clip()
      }
      drawImageInCell(ctx, img, sx, sy, visibleW, visibleH, innerX, innerY, innerW, innerH, isFit)
      if (roundRect && radius > 0) ctx.restore()
    }
    ctx.restore()
  })
}

function drawMergedCanvas(canvas, imageElements, width, height, layout, colsPerRow = null, fitMode = 'fit', imageSettings = {}, template = null) {
  const ctx = canvas.getContext('2d')
  const count = imageElements.length
  if (count === 0) return

  const t = template && MERGE_TEMPLATES[template] ? MERGE_TEMPLATES[template] : MERGE_TEMPLATES.default

  if (t.creative) {
    ctx.save()
    if (t.id === 'overlap') drawOverlapTemplate(ctx, imageElements, Math.min(width, MAX_CANVAS_DIMENSION), Math.min(height, MAX_CANVAS_DIMENSION), fitMode, imageSettings)
    else if (t.id === 'background') drawBackgroundTemplate(ctx, imageElements, Math.min(width, MAX_CANVAS_DIMENSION), Math.min(height, MAX_CANVAS_DIMENSION), layout, colsPerRow, fitMode, imageSettings)
    ctx.restore()
    return
  }

  const gap = t.gap ?? 0
  const padding = t.padding ?? 0
  const borderWidth = t.borderWidth ?? 0
  const borderColor = t.borderColor ?? '#333'
  const matColor = t.matColor ?? null
  const borderRadius = t.borderRadius ?? 0
  const roundRect = typeof ctx.roundRect === 'function' ? ctx.roundRect.bind(ctx) : null

  const safeW = Math.min(Math.max(1, Math.floor(width)), MAX_CANVAS_DIMENSION)
  const safeH = Math.min(Math.max(1, Math.floor(height)), MAX_CANVAS_DIMENSION)

  const { cols, rows } = getGridShape(count, layout, colsPerRow)

  ctx.fillStyle = t.backgroundColor ?? '#0a0c10'
  ctx.fillRect(0, 0, safeW, safeH)

  imageElements.forEach((img, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    const isLastRow = row === rows - 1
    const cellsInThisRow = isLastRow ? count - row * cols : cols

    const totalGapW = gap * (cellsInThisRow - 1)
    const totalGapH = gap * (rows - 1)
    const cellWidth = (safeW - totalGapW) / cellsInThisRow
    const cellHeight = (safeH - totalGapH) / rows
    const x = col * (cellWidth + gap)
    const y = row * (cellHeight + gap)

    const settings = { ...DEFAULT_CROP, ...DEFAULT_ZOOM, ...DEFAULT_PAN, ...imageSettings[i] }
    const rect = getSourceRect(img, settings)
    if (!rect) return
    const { sx, sy, visibleW, visibleH } = rect
    const isFit = (settings.fitMode ?? fitMode) === 'fit'

    const innerX = x + padding
    const innerY = y + padding
    const innerW = cellWidth - padding * 2
    const innerH = cellHeight - padding * 2

    ctx.save()

    if (roundRect && borderRadius > 0) {
      ctx.beginPath()
      roundRect(x, y, cellWidth, cellHeight, borderRadius)
      ctx.clip()
    } else {
      ctx.beginPath()
      ctx.rect(x, y, cellWidth, cellHeight)
      ctx.clip()
    }

    if (matColor && padding > 0) {
      ctx.fillStyle = matColor
      ctx.fillRect(x, y, cellWidth, cellHeight)
    }

    if (innerW > 0 && innerH > 0) {
      if (roundRect && borderRadius > 0) {
        ctx.save()
        ctx.beginPath()
        roundRect(innerX, innerY, innerW, innerH, Math.max(0, borderRadius - 2))
        ctx.clip()
      }
      drawImageInCell(ctx, img, sx, sy, visibleW, visibleH, innerX, innerY, innerW, innerH, isFit)
      if (roundRect && borderRadius > 0) ctx.restore()
    }

    ctx.restore()

    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.beginPath()
      if (roundRect && borderRadius > 0) {
        roundRect(x, y, cellWidth, cellHeight, borderRadius)
      } else {
        ctx.rect(x + borderWidth / 2, y + borderWidth / 2, cellWidth - borderWidth, cellHeight - borderWidth)
      }
      ctx.stroke()
    }
  })
}

export function ImageMerger({ images, width, height, layout, colsPerRow, fitMode = 'fit', imageSettings = {}, template = 'default' }) {
  const [loaded, setLoaded] = useState([])
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    Promise.all(images.map((img) => loadImage(img.url)))
      .then((imgs) => {
        if (!cancelled) setLoaded(imgs)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load images')
      })
    return () => { cancelled = true }
  }, [images])

  useEffect(() => {
    if (loaded.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const safeW = Math.min(Math.max(1, Math.floor(width)), MAX_CANVAS_DIMENSION)
    const safeH = Math.min(Math.max(1, Math.floor(height)), MAX_CANVAS_DIMENSION)
    canvas.width = safeW
    canvas.height = safeH
    drawMergedCanvas(canvas, loaded, safeW, safeH, layout, colsPerRow ?? null, fitMode, imageSettings, template)
  }, [loaded, width, height, layout, colsPerRow, fitMode, imageSettings, template])

  const handleDownload = (format = 'png') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `merged-${width}x${height}.${ext}`
        a.click()
        URL.revokeObjectURL(url)
      },
      mime,
      format === 'jpeg' ? 0.92 : undefined
    )
  }

  if (error) {
    return (
      <div className="merger-card">
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    )
  }

  if (loaded.length === 0) {
    return (
      <div className="merger-card">
        <p className="merger-info">Loading images…</p>
      </div>
    )
  }

  return (
    <div className="merger-card">
      <div className="merger-preview-wrap">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ maxHeight: '70vh' }}
          aria-label="Merged preview"
        />
      </div>
      <p className="merger-info">
        Output: {width}×{height} — per-image fit (stretch or crop to fill)
      </p>
      <div className="merger-actions">
        <button type="button" className="download-btn" onClick={() => handleDownload('png')}>
          Download PNG
        </button>
        <button type="button" className="download-btn" onClick={() => handleDownload('jpeg')}>
          Download JPEG
        </button>
      </div>
    </div>
  )
}
