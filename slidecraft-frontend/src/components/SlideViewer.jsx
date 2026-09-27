import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Panel from './Panel'
import Connector from './bodies/Connector'
import { withAlpha } from './bodies/shared'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/** Defensive layout pass: clamps every panel into grid bounds and drops any
 * panel that would overlap an already-placed one, guaranteeing zero overlap
 * even if the model's coordinates are ever wrong. */
function placePanels(panels, cols, rows) {
  const occupied = new Set()
  const placed = []
  for (const p of panels || []) {
    const col = clamp(p.col || 1, 1, cols)
    const row = clamp(p.row || 1, 1, rows)
    const colSpan = clamp(p.colSpan || 1, 1, cols - col + 1)
    const rowSpan = clamp(p.rowSpan || 1, 1, rows - row + 1)
    const cells = []
    let ok = true
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        const key = `${r}-${c}`
        if (occupied.has(key)) ok = false
        cells.push(key)
      }
    }
    if (!ok) continue
    cells.forEach((k) => occupied.add(k))
    placed.push({ ...p, col, row, colSpan, rowSpan })
  }
  return placed
}

function Slide({ slide, brand, deckTitle, logoUrl, index, total }) {
  const grid = slide.grid || { cols: 1, rows: 1 }
  const cols = clamp(grid.cols || 1, 1, 4)
  const rows = clamp(grid.rows || 1, 1, 3)
  const panels = placePanels(slide.panels, cols, rows)
  const colors = { primary: brand.primaryHex, secondary: brand.secondaryHex, accent: brand.accentHex }
  const isFullStatement = panels.length === 1 && panels[0].emphasize

  return (
    <div className="flex aspect-video w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      {!isFullStatement && (
        <div className="mb-2 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {slide.sectionTag && (
                <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white" style={{ background: brand.secondaryHex }}>
                  {slide.sectionTag}
                </span>
              )}
              <h2 className="mt-1 line-clamp-1 font-display text-base font-bold leading-tight sm:text-lg" style={{ color: brand.primaryHex }}>
                {slide.title}
              </h2>
              {slide.subtitle && <p className="line-clamp-1 text-[11px] italic text-neutral-400">{slide.subtitle}</p>}
            </div>
            {logoUrl && <img src={logoUrl} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />}
          </div>
          <div className="mt-1.5 border-t border-dashed" style={{ borderColor: withAlpha(brand.accentHex, 0.5) }} />
        </div>
      )}

      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, gap: '8px' }}
      >
        {panels.map((p, i) => (
          <div key={i} style={{ gridColumn: `${p.col} / span ${p.colSpan}`, gridRow: `${p.row} / span ${p.rowSpan}` }}>
            {p.kind === 'connector' ? <Connector panel={p} colors={colors} /> : <Panel panel={p} brand={brand} />}
          </div>
        ))}
      </div>

      {!isFullStatement && (
        <div className="mt-1.5 flex shrink-0 items-center justify-between text-[9px] text-neutral-300">
          <span className="line-clamp-1">{deckTitle}</span>
          <span>{index + 1} / {total}</span>
        </div>
      )}
    </div>
  )
}

export default function SlideViewer({ slides, brand, deckTitle, logoUrl }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index >= slides.length) setIndex(0)
  }, [slides.length, index])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, slides.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  const slide = slides[index]
  if (!slide) return null

  return (
    <div className="w-full min-w-0">
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <Slide slide={slide} brand={brand} deckTitle={deckTitle} logoUrl={logoUrl} index={index} total={slides.length} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="flex flex-1 items-center justify-center gap-1.5 overflow-x-auto">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 shrink-0 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/25'}`}
            />
          ))}
        </div>

        <button
          onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
          disabled={index === slides.length - 1}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {slide.speakerNotes && (
        <p className="mt-3 rounded-xl bg-white/[0.03] px-4 py-2.5 text-xs italic leading-relaxed text-white/45">
          <span className="not-italic font-medium text-white/60">Speaker notes · </span>{slide.speakerNotes}
        </p>
      )}
      {slide.transition && (
        <p className="mt-1.5 px-1 text-[11px] text-white/30">→ {slide.transition}</p>
      )}
    </div>
  )
}
