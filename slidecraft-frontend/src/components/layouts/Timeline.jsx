import { withAlpha } from './shared'

export default function Timeline({ data, brand }) {
  const milestones = (data.milestones || []).slice(0, 8)
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center">
        {milestones.map((m, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <span className="mb-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: brand.secondaryHex }}>
                {m.dateLabel}
              </span>
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: brand.accentHex }}
              >
                {m.marker || i + 1}
              </span>
            </div>
            {i < milestones.length - 1 && (
              <div className="mx-1 h-0 flex-1 border-t-2 border-dashed" style={{ borderColor: withAlpha(brand.primaryHex, 0.3) }} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}>
        {milestones.map((m, i) => (
          <div key={i} className="min-w-0 rounded-lg border p-2" style={{ borderColor: withAlpha(brand.primaryHex, 0.15) }}>
            <p className="line-clamp-2 text-[10px] font-bold" style={{ color: brand.primaryHex }}>{m.title}</p>
            <p className="mt-0.5 line-clamp-4 text-[9px] leading-tight text-neutral-500">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
