import { useState, useCallback, useRef, useEffect } from 'react'
import { ImageMerger, SingleImagePreview, MERGE_TEMPLATES } from './ImageMerger'
import './App.css'

const RESOLUTION_PRESETS = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: '4K', width: 3840, height: 2160 },
  { label: '5K', width: 5120, height: 2880 },
  { label: '8K', width: 7680, height: 4320 },
  { label: 'Square 1:1', width: 1080, height: 1080 },
  { label: 'Portrait 9:16', width: 1080, height: 1920 },
  { label: 'Instagram', width: 1080, height: 1350 },
]
const MAX_DIMENSION = 16384
const MAX_IMAGES = 20
const DEFAULT_CROP = { cropLeft: 0, cropTop: 0, cropRight: 0, cropBottom: 0 }
const DEFAULT_ZOOM = { zoom: 1, zoomOrigin: 'center' }
const DEFAULT_PAN = { panX: 0, panY: 0 }
const FIT_OPTIONS = [
  { id: 'fit', label: 'Stretch to fit (no crop)' },
  { id: 'fill', label: 'Crop to fill (maintain aspect ratio)' },
]
const LAYOUT_OPTIONS = [
  { id: 'auto', label: 'Auto' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'grid', label: 'Grid' },
]
const ZOOM_ORIGINS = [
  { id: 'center', label: 'Center' },
  { id: 'leftTop', label: 'Left top' },
  { id: 'rightTop', label: 'Right top' },
  { id: 'bottomLeft', label: 'Bottom left' },
  { id: 'bottomRight', label: 'Bottom right' },
]

function parseDimension(v, fallback) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_DIMENSION) : fallback
}

function App() {
  const [images, setImages] = useState([])
  const [resolution, setResolution] = useState(RESOLUTION_PRESETS[0])
  const [customWidth, setCustomWidth] = useState(5120)
  const [customHeight, setCustomHeight] = useState(2880)
  const [layout, setLayout] = useState('auto')
  const [template, setTemplate] = useState('default')
  const [colsPerRow, setColsPerRow] = useState(4)
  const [fitMode, setFitMode] = useState('fit')
  const [imageSettings, setImageSettings] = useState({})
  const [adjustIndex, setAdjustIndex] = useState(null)

  const getImageSetting = useCallback((index) => {
    const s = imageSettings[index]
    return {
      cropLeft: s?.cropLeft ?? 0,
      cropTop: s?.cropTop ?? 0,
      cropRight: s?.cropRight ?? 0,
      cropBottom: s?.cropBottom ?? 0,
      zoom: s?.zoom ?? 1,
      zoomOrigin: s?.zoomOrigin ?? 'center',
      panX: s?.panX ?? 0,
      panY: s?.panY ?? 0,
      fitMode: s?.fitMode ?? fitMode,
    }
  }, [imageSettings, fitMode])

  const setImageSetting = useCallback((index, patch) => {
    setImageSettings((prev) => ({
      ...prev,
      [index]: { ...DEFAULT_CROP, ...DEFAULT_ZOOM, ...DEFAULT_PAN, ...prev[index], ...patch },
    }))
  }, [])

  const addFiles = useCallback((files) => {
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ file: f, url: URL.createObjectURL(f), name: f.name }))
    setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES))
  }, [])

  const prevImagesLengthRef = useRef(0)
  useEffect(() => {
    if (images.length > 0 && prevImagesLengthRef.current === 0) setAdjustIndex(0)
    prevImagesLengthRef.current = images.length
  }, [images.length])

  const removeImage = useCallback((index) => {
    setImages((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].url)
      next.splice(index, 1)
      return next
    })
    setImageSettings((prev) => {
      const next = {}
      Object.keys(prev).forEach((k) => {
        const i = parseInt(k, 10)
        if (i < index) next[i] = prev[i]
        else if (i > index) next[i - 1] = prev[i]
      })
      return next
    })
    if (adjustIndex === index) setAdjustIndex(null)
    else if (adjustIndex != null && adjustIndex > index) setAdjustIndex(adjustIndex - 1)
  }, [adjustIndex])

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.url))
    setImages([])
    setImageSettings({})
    setAdjustIndex(null)
  }, [images])

  return (
    <div className="app">
      <header className="header">
        <h1>Image Merger</h1>
        <p>Upload 2+ images, pick output resolution — they auto-fit.</p>
      </header>

      <div className="toolbar">
        <div
          className="upload-zone"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
          onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); addFiles(e.dataTransfer.files) }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            id="file-input"
            onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
          />
          <label htmlFor="file-input">
            <span className="upload-icon">↑</span>
            Drop images or click to add (2 or more)
          </label>
        </div>

        {images.length > 0 && (
          <>
            <div className="resolution-row">
              <label>Output resolution</label>
              <div className="resolution-options">
                {RESOLUTION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={resolution.label === preset.label ? 'active' : ''}
                    onClick={() => setResolution(preset)}
                  >
                    {preset.label}
                    <span className="res-detail">{preset.width}×{preset.height}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={resolution.label === 'Custom' ? 'active' : ''}
                  onClick={() => setResolution({ label: 'Custom', width: customWidth, height: customHeight })}
                >
                  Custom
                </button>
              </div>
              {resolution.label === 'Custom' && (
                <div className="custom-resolution">
                  <input
                    type="number"
                    min={1}
                    max={MAX_DIMENSION}
                    value={customWidth}
                    onChange={(e) => {
                      const w = parseDimension(e.target.value, customWidth)
                      setCustomWidth(w)
                      setResolution((r) => (r.label === 'Custom' ? { ...r, width: w } : r))
                    }}
                    aria-label="Width"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    min={1}
                    max={MAX_DIMENSION}
                    value={customHeight}
                    onChange={(e) => {
                      const h = parseDimension(e.target.value, customHeight)
                      setCustomHeight(h)
                      setResolution((r) => (r.label === 'Custom' ? { ...r, height: h } : r))
                    }}
                    aria-label="Height"
                  />
                  <span className="layout-hint">Max {MAX_DIMENSION} per side. Higher res = more detail per cell.</span>
                </div>
              )}
              <span className="layout-hint">Not limited to 4K — use 5K, 8K, or Custom for sharper merges and less zoomed look.</span>
            </div>

            <div className="layout-row">
              <label>Default fit (for new images)</label>
              <div className="layout-options">
                {FIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={fitMode === opt.id ? 'active' : ''}
                    onClick={() => setFitMode(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span className="layout-hint">Default for each image. Set per image in the adjust panel (◇).</span>
            </div>

            <div className="layout-row">
              <label>Template (look & feel)</label>
              <div className="template-options">
                {Object.values(MERGE_TEMPLATES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={template === t.id ? 'active' : ''}
                    onClick={() => setTemplate(t.id)}
                    title={t.name}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <span className="layout-hint">Classy and chunky styles for the merged output.</span>
            </div>

            <div className="layout-row">
              <label>Layout</label>
              <div className="layout-options">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={layout === opt.id ? 'active' : ''}
                    onClick={() => setLayout(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="layout-row">
              <label>Columns per row</label>
              <div className="layout-options">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={colsPerRow === n ? 'active' : ''}
                    onClick={() => setColsPerRow(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <span className="layout-hint">Last row resizes to fill — no empty cells</span>
            </div>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="preview-section">
          <div className="thumbnails">
            {images.map((img, i) => (
              <div
                key={i}
                className={`thumb-wrap ${adjustIndex === i ? 'thumb-wrap-active' : ''}`}
                title={adjustIndex === i ? `Editing image ${i + 1}` : `Image ${i + 1} — click ◇ to adjust`}
              >
                {adjustIndex === i && <span className="thumb-wrap-badge">Editing</span>}
                <img src={img.url} alt={img.name} />
                <div className="thumb-actions">
                  <button type="button" className="adjust-thumb" onClick={() => setAdjustIndex(adjustIndex === i ? null : i)} aria-label="Select region for merge" title="Select region">◇</button>
                  <button type="button" className="remove-thumb" onClick={() => removeImage(i)} aria-label="Remove">×</button>
                </div>
              </div>
            ))}
          </div>
          {adjustIndex != null && adjustIndex < images.length && (() => {
            const adjustSettings = getImageSetting(adjustIndex)
            return (
            <div className="adjust-panel">
              <h3 className="adjust-panel-title">Image {adjustIndex + 1} of {images.length} — select region</h3>
              <div className="adjust-panel-layout">
                <div className="adjust-panel-preview">
                  <SingleImagePreview url={images[adjustIndex].url} settings={adjustSettings} width={380} height={280} />
                  <p className="layout-hint">Live preview — changes update as you move sliders.</p>
                </div>
                <div className="adjust-panel-controls">
                  <p className="layout-hint">Crop, zoom, and move. This region is fitted in the merged result.</p>
                  <div className="adjust-controls">
                    <label>
                      <span>Crop left</span>
                      <input
                        type="range" min={0} max={90} value={adjustSettings.cropLeft * 100}
                        onChange={(e) => {
                          const v = Number(e.target.value) / 100
                          if (adjustSettings.cropLeft + adjustSettings.cropRight < 1) setImageSetting(adjustIndex, { cropLeft: Math.min(v, 1 - adjustSettings.cropRight) })
                        }}
                      />
                      <span className="adjust-value">{Math.round(adjustSettings.cropLeft * 100)}%</span>
                    </label>
                    <label>
                      <span>Crop top</span>
                      <input
                        type="range" min={0} max={90} value={adjustSettings.cropTop * 100}
                        onChange={(e) => {
                          const v = Number(e.target.value) / 100
                          if (adjustSettings.cropTop + adjustSettings.cropBottom < 1) setImageSetting(adjustIndex, { cropTop: Math.min(v, 1 - adjustSettings.cropBottom) })
                        }}
                      />
                      <span className="adjust-value">{Math.round(adjustSettings.cropTop * 100)}%</span>
                    </label>
                    <label>
                      <span>Crop right</span>
                      <input
                        type="range" min={0} max={90} value={adjustSettings.cropRight * 100}
                        onChange={(e) => {
                          const v = Number(e.target.value) / 100
                          if (adjustSettings.cropLeft + adjustSettings.cropRight < 1) setImageSetting(adjustIndex, { cropRight: Math.min(v, 1 - adjustSettings.cropLeft) })
                        }}
                      />
                      <span className="adjust-value">{Math.round(adjustSettings.cropRight * 100)}%</span>
                    </label>
                    <label>
                      <span>Crop bottom</span>
                      <input
                        type="range" min={0} max={90} value={adjustSettings.cropBottom * 100}
                        onChange={(e) => {
                          const v = Number(e.target.value) / 100
                          if (adjustSettings.cropTop + adjustSettings.cropBottom < 1) setImageSetting(adjustIndex, { cropBottom: Math.min(v, 1 - adjustSettings.cropTop) })
                        }}
                      />
                      <span className="adjust-value">{Math.round(adjustSettings.cropBottom * 100)}%</span>
                    </label>
                    <div className="adjust-section">
                      <span className="adjust-section-label">Zoom</span>
                      <label>
                        <span>Level</span>
                        <input type="range" min={50} max={200} value={adjustSettings.zoom * 100} onChange={(e) => setImageSetting(adjustIndex, { zoom: Number(e.target.value) / 100 })} />
                        <span className="adjust-value">{Math.round(adjustSettings.zoom * 100)}%</span>
                      </label>
                    </div>
                    <div className="adjust-section">
                      <span className="adjust-section-label">Zoom from (anchor)</span>
                      <div className="zoom-origin-options">
                        {ZOOM_ORIGINS.map((opt) => (
                          <button key={opt.id} type="button" className={adjustSettings.zoomOrigin === opt.id ? 'active' : ''} onClick={() => setImageSetting(adjustIndex, { zoomOrigin: opt.id })}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="adjust-section">
                      <span className="adjust-section-label">Move (align)</span>
                      <p className="layout-hint" style={{ marginBottom: '0.5rem' }}>Nudge the visible region in any direction. Works with or without zoom.</p>
                      <label>
                        <span>Left ↔ Right</span>
                        <input type="range" min={-100} max={100} value={adjustSettings.panX * 100} onChange={(e) => setImageSetting(adjustIndex, { panX: Number(e.target.value) / 100 })} />
                        <span className="adjust-value">{Math.round(adjustSettings.panX * 100)}%</span>
                      </label>
                      <label>
                        <span>Up ↔ Down</span>
                        <input type="range" min={-100} max={100} value={adjustSettings.panY * 100} onChange={(e) => setImageSetting(adjustIndex, { panY: Number(e.target.value) / 100 })} />
                        <span className="adjust-value">{Math.round(adjustSettings.panY * 100)}%</span>
                      </label>
                    </div>
                    <div className="adjust-section">
                      <span className="adjust-section-label">Fit in cell (this image only)</span>
                      <div className="zoom-origin-options">
                        {FIT_OPTIONS.map((opt) => (
                          <button key={opt.id} type="button" className={adjustSettings.fitMode === opt.id ? 'active' : ''} onClick={() => setImageSetting(adjustIndex, { fitMode: opt.id })}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="adjust-panel-actions">
                {adjustIndex > 0 && <button type="button" className="adjust-action-btn prev-adjust-btn" onClick={() => setAdjustIndex(adjustIndex - 1)}>← Previous</button>}
                {adjustIndex < images.length - 1 && <button type="button" className="adjust-action-btn next-adjust-btn" onClick={() => setAdjustIndex(adjustIndex + 1)}>Next →</button>}
                <button type="button" className="adjust-action-btn reset-adjust-btn" onClick={() => setImageSetting(adjustIndex, { ...DEFAULT_CROP, ...DEFAULT_ZOOM, ...DEFAULT_PAN })} title="Full image, 100% zoom, no move">Reset</button>
                <button type="button" className="adjust-action-btn close-adjust-btn" onClick={() => setAdjustIndex(null)}>Done</button>
              </div>
            </div>
            )
          })()}
          {images.length < 2 && (
            <p className="hint">Add at least one more image to merge.</p>
          )}
          {images.length >= 2 && (
            <ImageMerger
              images={images}
              width={resolution.width}
              height={resolution.height}
              layout={layout}
              colsPerRow={colsPerRow}
              fitMode={fitMode}
              imageSettings={imageSettings}
              template={template}
            />
          )}
          <button type="button" className="clear-btn" onClick={clearAll}>Clear all</button>
        </div>
      )}
    </div>
  )
}

export default App
