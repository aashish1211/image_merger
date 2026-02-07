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
const COLS_OPTIONS = [2, 3, 4, 5]

function parseDimension(v, fallback) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_DIMENSION) : fallback
}

function UploadZone({ onAddFiles }) {
  return (
    <div
      className="upload-zone"
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
      onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
      onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); onAddFiles(e.dataTransfer.files) }}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        id="file-input"
        onChange={(e) => { onAddFiles(e.target.files); e.target.value = '' }}
      />
      <label htmlFor="file-input">
        <span className="upload-icon">↑</span>
        Drop images or click to add (2 or more)
      </label>
    </div>
  )
}

function ResolutionRow({ resolution, setResolution, customWidth, setCustomWidth, customHeight, setCustomHeight }) {
  return (
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
  )
}

function OptionRow({ label, value, options, onChange, hint, optionClass = 'layout-options', valueKey = 'id', labelKey = 'label', titleKey }) {
  return (
    <div className="layout-row">
      <label>{label}</label>
      <div className={optionClass}>
        {options.map((opt) => (
          <button
            key={opt[valueKey]}
            type="button"
            className={value === opt[valueKey] ? 'active' : ''}
            onClick={() => onChange(opt[valueKey])}
            title={titleKey ? opt[titleKey] : undefined}
          >
            {opt[labelKey] ?? opt.name}
          </button>
        ))}
      </div>
      {hint && <span className="layout-hint">{hint}</span>}
    </div>
  )
}

function ColumnsRow({ colsPerRow, setColsPerRow }) {
  return (
    <div className="layout-row">
      <label>Columns per row</label>
      <div className="layout-options">
        {COLS_OPTIONS.map((n) => (
          <button key={n} type="button" className={colsPerRow === n ? 'active' : ''} onClick={() => setColsPerRow(n)}>{n}</button>
        ))}
      </div>
      <span className="layout-hint">Last row resizes to fill — no empty cells</span>
    </div>
  )
}

function ToolbarOptions(props) {
  return (
    <>
      <ResolutionRow
        resolution={props.resolution}
        setResolution={props.setResolution}
        customWidth={props.customWidth}
        setCustomWidth={props.setCustomWidth}
        customHeight={props.customHeight}
        setCustomHeight={props.setCustomHeight}
      />
      <OptionRow
        label="Default fit (for new images)"
        value={props.fitMode}
        options={FIT_OPTIONS}
        onChange={props.setFitMode}
        hint="Default for each image. Set per image in the adjust panel (◇)."
      />
      <OptionRow
        label="Template (look & feel)"
        value={props.template}
        options={Object.values(MERGE_TEMPLATES)}
        onChange={props.setTemplate}
        hint="Classy and chunky styles for the merged output."
        optionClass="template-options"
        labelKey="name"
        titleKey="name"
      />
      <OptionRow
        label="Layout"
        value={props.layout}
        options={LAYOUT_OPTIONS}
        onChange={props.setLayout}
      />
      <ColumnsRow colsPerRow={props.colsPerRow} setColsPerRow={props.setColsPerRow} />
    </>
  )
}

function Thumbnails({ images, adjustIndex, setAdjustIndex, removeImage }) {
  return (
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
  )
}

function CropSlider({ label, value, onChange }) {
  return (
    <label>
      <span>{label}</span>
      <input type="range" min={0} max={90} value={value * 100} onChange={(e) => onChange(Number(e.target.value) / 100)} />
      <span className="adjust-value">{Math.round(value * 100)}%</span>
    </label>
  )
}

function AdjustPanel({ index, images, getImageSetting, setImageSetting, setAdjustIndex }) {
  const s = getImageSetting(index)
  const patch = (obj) => setImageSetting(index, obj)
  const canCropH = s.cropLeft + s.cropRight < 1
  const canCropV = s.cropTop + s.cropBottom < 1
  return (
    <div className="adjust-panel">
      <h3 className="adjust-panel-title">Image {index + 1} of {images.length} — select region</h3>
      <div className="adjust-panel-layout">
        <div className="adjust-panel-preview">
          <SingleImagePreview url={images[index].url} settings={s} width={380} height={280} />
          <p className="layout-hint">Live preview — changes update as you move sliders.</p>
        </div>
        <div className="adjust-panel-controls">
          <p className="layout-hint">Crop, zoom, and move. This region is fitted in the merged result.</p>
          <div className="adjust-controls">
            <CropSlider label="Crop left" value={s.cropLeft} onChange={(v) => canCropH && patch({ cropLeft: Math.min(v, 1 - s.cropRight) })} />
            <CropSlider label="Crop top" value={s.cropTop} onChange={(v) => canCropV && patch({ cropTop: Math.min(v, 1 - s.cropBottom) })} />
            <CropSlider label="Crop right" value={s.cropRight} onChange={(v) => canCropH && patch({ cropRight: Math.min(v, 1 - s.cropLeft) })} />
            <CropSlider label="Crop bottom" value={s.cropBottom} onChange={(v) => canCropV && patch({ cropBottom: Math.min(v, 1 - s.cropTop) })} />
            <div className="adjust-section">
              <span className="adjust-section-label">Zoom</span>
              <label>
                <span>Level</span>
                <input type="range" min={50} max={200} value={s.zoom * 100} onChange={(e) => patch({ zoom: Number(e.target.value) / 100 })} />
                <span className="adjust-value">{Math.round(s.zoom * 100)}%</span>
              </label>
            </div>
            <div className="adjust-section">
              <span className="adjust-section-label">Zoom from (anchor)</span>
              <div className="zoom-origin-options">
                {ZOOM_ORIGINS.map((opt) => (
                  <button key={opt.id} type="button" className={s.zoomOrigin === opt.id ? 'active' : ''} onClick={() => patch({ zoomOrigin: opt.id })}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div className="adjust-section">
              <span className="adjust-section-label">Move (align)</span>
              <p className="layout-hint" style={{ marginBottom: '0.5rem' }}>Nudge the visible region in any direction. Works with or without zoom.</p>
              <label>
                <span>Left ↔ Right</span>
                <input type="range" min={-100} max={100} value={s.panX * 100} onChange={(e) => patch({ panX: Number(e.target.value) / 100 })} />
                <span className="adjust-value">{Math.round(s.panX * 100)}%</span>
              </label>
              <label>
                <span>Up ↔ Down</span>
                <input type="range" min={-100} max={100} value={s.panY * 100} onChange={(e) => patch({ panY: Number(e.target.value) / 100 })} />
                <span className="adjust-value">{Math.round(s.panY * 100)}%</span>
              </label>
            </div>
            <div className="adjust-section">
              <span className="adjust-section-label">Fit in cell (this image only)</span>
              <div className="zoom-origin-options">
                {FIT_OPTIONS.map((opt) => (
                  <button key={opt.id} type="button" className={s.fitMode === opt.id ? 'active' : ''} onClick={() => patch({ fitMode: opt.id })}>{opt.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="adjust-panel-actions">
        {index > 0 && <button type="button" className="adjust-action-btn prev-adjust-btn" onClick={() => setAdjustIndex(index - 1)}>← Previous</button>}
        {index < images.length - 1 && <button type="button" className="adjust-action-btn next-adjust-btn" onClick={() => setAdjustIndex(index + 1)}>Next →</button>}
        <button type="button" className="adjust-action-btn reset-adjust-btn" onClick={() => patch({ ...DEFAULT_CROP, ...DEFAULT_ZOOM, ...DEFAULT_PAN })} title="Full image, 100% zoom, no move">Reset</button>
        <button type="button" className="adjust-action-btn close-adjust-btn" onClick={() => setAdjustIndex(null)}>Done</button>
      </div>
    </div>
  )
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
        <UploadZone onAddFiles={addFiles} />
        {images.length > 0 && (
          <ToolbarOptions
            resolution={resolution}
            setResolution={setResolution}
            customWidth={customWidth}
            setCustomWidth={setCustomWidth}
            customHeight={customHeight}
            setCustomHeight={setCustomHeight}
            fitMode={fitMode}
            setFitMode={setFitMode}
            template={template}
            setTemplate={setTemplate}
            layout={layout}
            setLayout={setLayout}
            colsPerRow={colsPerRow}
            setColsPerRow={setColsPerRow}
          />
        )}
      </div>

      {images.length > 0 && (
        <div className="preview-section">
          <Thumbnails
            images={images}
            adjustIndex={adjustIndex}
            setAdjustIndex={setAdjustIndex}
            removeImage={removeImage}
          />
          {adjustIndex != null && adjustIndex < images.length && (
            <AdjustPanel
              index={adjustIndex}
              images={images}
              getImageSetting={getImageSetting}
              setImageSetting={setImageSetting}
              setAdjustIndex={setAdjustIndex}
            />
          )}
          {images.length < 2 && <p className="hint">Add at least one more image to merge.</p>}
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
