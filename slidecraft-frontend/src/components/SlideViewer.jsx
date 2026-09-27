import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeftIcon, ChevronRightIcon, PhotoIcon } from '@heroicons/react/24/outline'

function ChartFallback({ points, accent }) {
  const max = Math.max(1, ...points.map((p) => p.value))
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2.5 p-4">
      {points.map((p, i) => (
        <div key={i} className="min-w-0">
          <div className="flex items-baseline justify-between gap-2 text-[11px] text-white/60">
            <span className="truncate">{p.label}</span>
            <span className="shrink-0 font-semibold text-white">{p.value}{p.isPercent ? '%' : ''}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${(p.value / max) * 100}%`, background: accent }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function IconFallback({ visual, accent }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center">
      <PhotoIcon className="h-10 w-10" style={{ color: accent }} />
      <p className="text-xs text-white/40">{visual}</p>
    </div>
  )
}

function Slide({ slide, brand }) {
  return (
    <div
      className="flex aspect-video w-full flex-col overflow-hidden rounded-2xl border border-white/10 sm:flex-row"
      style={{ background: brand.primaryHex }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-7">
        <div className="min-w-0">
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80"
            style={{ background: `${brand.accentHex}33` }}
          >
            {slide.visual}
          </span>
          <h2 className="mt-3 line-clamp-2 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
            {slide.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm text-white/70">{slide.takeaway}</p>
        </div>

        <ul className="mt-4 space-y-1.5 overflow-hidden">
          {(slide.bullets || []).slice(0, 6).map((b, i) => (
            <li key={i} className="flex gap-2 text-xs text-white/85 sm:text-sm">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: brand.accentHex }} />
              <span className="line-clamp-2 break-words">{b}</span>
            </li>
          ))}
        </ul>

        {slide.transition && (
          <p className="mt-4 line-clamp-1 border-t border-white/10 pt-2.5 text-[11px] italic text-white/35">
            {slide.transition}
          </p>
        )}
      </div>

      <div className="h-32 w-full shrink-0 border-t border-white/10 sm:h-auto sm:w-2/5 sm:border-l sm:border-t-0" style={{ background: `${brand.secondaryHex}55` }}>
        {slide.imageUrl ? (
          <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : slide.chartPoints?.length > 0 ? (
          <ChartFallback points={slide.chartPoints} accent={brand.accentHex} />
        ) : (
          <IconFallback visual={slide.visual} accent={brand.accentHex} />
        )}
      </div>
    </div>
  )
}

export default function SlideViewer({ slides, brand }) {
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
            <Slide slide={slide} brand={brand} />
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
    </div>
  )
}
