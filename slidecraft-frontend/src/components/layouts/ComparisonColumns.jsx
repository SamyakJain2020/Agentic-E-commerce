import { PALETTE_CYCLE, withAlpha } from './shared'

export default function ComparisonColumns({ data, brand }) {
  const columns = (data.columns || []).slice(0, 4)
  const colors = PALETTE_CYCLE(brand)
  return (
    <div className="grid h-full gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, minmax(0, 1fr))` }}>
      {columns.map((col, i) => (
        <div key={i} className="flex min-w-0 flex-col overflow-hidden rounded-xl border" style={{ borderColor: withAlpha(brand.primaryHex, 0.15) }}>
          <div className="px-3 py-2" style={{ background: colors[i % colors.length] }}>
            <p className="line-clamp-1 text-xs font-bold text-white">{col.heading}</p>
          </div>
          <div className="flex-1 space-y-2 overflow-hidden bg-white/40 p-3">
            {(col.rows || []).slice(0, 6).map((r, j) => (
              <div key={j} className="min-w-0">
                <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: colors[i % colors.length] }}>{r.label}</p>
                <p className="line-clamp-2 text-[11px] text-neutral-700">{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
