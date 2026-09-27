import { PALETTE_CYCLE, withAlpha } from './shared'

export default function Matrix2x2({ data, brand }) {
  const quadrants = (data.quadrants || []).slice(0, 4)
  while (quadrants.length < 4) quadrants.push({ title: '', bullets: [] })
  const colors = PALETTE_CYCLE(brand)

  return (
    <div className="relative flex h-full flex-col">
      {(data.xLabel || data.yLabel) && (
        <div className="mb-1 flex justify-between text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
          <span>{data.yLabel}</span>
          <span>{data.xLabel}</span>
        </div>
      )}
      <div
        className="relative grid flex-1 grid-cols-2 grid-rows-2 gap-0 overflow-hidden rounded-lg border"
        style={{ borderColor: withAlpha(brand.primaryHex, 0.15) }}
      >
        <div className="pointer-events-none absolute left-0 right-0 z-10 top-1/2 border-t-2 border-dashed" style={{ borderColor: withAlpha(brand.primaryHex, 0.35) }} />
        <div className="pointer-events-none absolute top-0 bottom-0 z-10 left-1/2 border-l-2 border-dashed" style={{ borderColor: withAlpha(brand.primaryHex, 0.35) }} />
        {quadrants.map((q, i) => (
          <div key={i} className="min-w-0 overflow-hidden p-3" style={{ background: withAlpha(colors[i % colors.length], 0.07) }}>
            <p className="line-clamp-1 text-xs font-bold" style={{ color: colors[i % colors.length] }}>{q.title}</p>
            <ul className="mt-1.5 space-y-1">
              {(q.bullets || []).slice(0, 4).map((b, j) => (
                <li key={j} className="line-clamp-1 text-[10px] text-neutral-600">• {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
