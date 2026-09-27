import { PALETTE_CYCLE, withAlpha } from './shared'

function Donut({ segments, colors }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let acc = 0
  const R = 42
  const C = 2 * Math.PI * R
  return (
    <div className="flex h-full items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-40 w-40 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="14" />
        {segments.map((seg, i) => {
          const frac = seg.value / total
          const dash = frac * C
          const offset = -(acc / total) * C
          acc += seg.value
          return (
            <circle
              key={i}
              cx="50" cy="50" r={R} fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={offset}
            />
          )
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="text-neutral-600">{seg.label}</span>
            <span className="font-semibold text-neutral-900">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Bars({ bars, brand }) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {bars.slice(0, 6).map((b, i) => (
        <div key={i} className="min-w-0">
          <div className="flex items-baseline justify-between text-xs">
            <span className="truncate font-medium text-neutral-600">{b.label}</span>
            <span className="font-bold" style={{ color: brand.primaryHex }}>{b.value}{b.isPercent ? '%' : ''}</span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, background: brand.accentHex }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MetricsViz({ data, brand }) {
  const colors = PALETTE_CYCLE(brand)
  if (data.vizType === 'donut') return <Donut segments={data.segments || []} colors={colors} />
  return <Bars bars={data.bars || []} brand={brand} />
}
