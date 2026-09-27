import { withAlpha } from './shared'

export function MiniCards({ body, colors }) {
  const cards = (body.cards || []).slice(0, 4)
  return (
    <div className="grid h-full grid-cols-1 gap-1.5 content-start sm:grid-cols-2">
      {cards.map((c, i) => (
        <div key={i} className="min-w-0 rounded-md border p-1.5" style={{ borderColor: withAlpha(colors.primary, 0.15) }}>
          <p className="line-clamp-1 text-[9px] font-bold uppercase tracking-wide" style={{ color: colors.primary }}>{c.label}</p>
          <p className="line-clamp-2 text-[10px] text-neutral-600">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

export function Bullets({ body, colors }) {
  return (
    <ul className="flex h-full flex-col justify-center gap-1">
      {(body.bullets || []).slice(0, 5).map((b, i) => (
        <li key={i} className="flex gap-1.5 text-[10px] text-neutral-700">
          <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: colors.accent }} />
          <span className="line-clamp-1">{b}</span>
        </li>
      ))}
    </ul>
  )
}

export function Bars({ body, colors }) {
  const bars = (body.bars || []).slice(0, 5)
  const max = Math.max(1, ...bars.map((b) => b.value))
  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {bars.map((b, i) => (
        <div key={i} className="min-w-0">
          <div className="flex items-baseline justify-between text-[9px]">
            <span className="truncate text-neutral-500">{b.label}</span>
            <span className="font-bold" style={{ color: colors.primary }}>{b.value}{b.isPercent ? '%' : ''}</span>
          </div>
          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, background: colors.accent }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Donut({ body, colors }) {
  const segments = body.segments || []
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let acc = 0
  const R = 38
  const C = 2 * Math.PI * R
  const palette = [colors.accent, colors.primary, colors.secondary]
  return (
    <div className="flex h-full items-center gap-3">
      <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="13" />
        {segments.map((seg, i) => {
          const frac = seg.value / total
          const dash = frac * C
          const offset = -(acc / total) * C
          acc += seg.value
          return <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={palette[i % 3]} strokeWidth="13" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={offset} />
        })}
      </svg>
      <div className="space-y-1 overflow-hidden">
        {segments.slice(0, 4).map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[9px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: palette[i % 3] }} />
            <span className="truncate text-neutral-500">{seg.label}</span>
            <span className="font-bold text-neutral-800">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DataTable({ body, colors }) {
  const headers = body.headers || []
  const rows = (body.rows || []).slice(0, 4)
  return (
    <table className="w-full border-collapse text-[9px]">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="truncate px-1.5 py-1 text-left font-bold text-white" style={{ background: colors.primary }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? withAlpha(colors.accent, 0.06) : 'white' }}>
            {row.map((cell, ci) => <td key={ci} className="max-w-[90px] truncate px-1.5 py-0.5 text-neutral-600">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
