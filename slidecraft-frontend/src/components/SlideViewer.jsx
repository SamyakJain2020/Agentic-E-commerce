import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { LAYOUTS } from './layouts'
import { withAlpha } from './layouts/shared'

function Slide({ slide, brand, deckTitle, logoUrl, index, total }) {
  const Layout = LAYOUTS[slide.layout] || LAYOUTS['photo-feature']
  const isBig = slide.layout === 'big-statement'

  return (
    <div className="flex aspect-video w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      {!isBig && (
        <div className="mb-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {slide.sectionTag && (
                <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white" style={{ background: brand.secondaryHex }}>
                  {slide.sectionTag}
                </span>
              )}
              <h2 className="mt-1 line-clamp-1 font-display text-lg font-bold leading-tight sm:text-xl" style={{ color: brand.primaryHex }}>
                {slide.title}
              </h2>
              {slide.subtitle && <p className="line-clamp-1 text-xs italic text-neutral-400">{slide.subtitle}</p>}
            </div>
            {logoUrl && <img src={logoUrl} alt="" className="h-7 w-7 shrink-0 rounded object-contain" />}
          </div>
          <div className="mt-2 border-t border-dashed" style={{ borderColor: withAlpha(brand.accentHex, 0.5) }} />
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden">
        <Layout data={slide.data || {}} brand={brand} />
      </div>

      <div className="mt-2 flex shrink-0 items-center justify-between text-[9px] text-neutral-300">
        <span className="line-clamp-1">{deckTitle}</span>
        <span>{index + 1} / {total}</span>
      </div>
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
