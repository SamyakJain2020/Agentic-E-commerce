import { withAlpha } from './shared'
import { PanelIcon } from './icons'

export function StatPair({ body, colors }) {
  const stats = (body.stats || []).slice(0, 3)
  return (
    <div className="flex h-full items-center justify-around gap-2">
      {stats.map((s, i) => (
        <div key={i} className="min-w-0 text-center">
          {s.delta && (
            <span className="mb-0.5 inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: withAlpha(colors.accent, 0.15), color: colors.accent }}>
              ▲ {s.delta}
            </span>
          )}
          <p className="font-display text-xl font-bold leading-none" style={{ color: colors.primary }}>{s.value}</p>
          <p className="mt-0.5 line-clamp-1 text-[8px] font-semibold uppercase text-neutral-400">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

export function BeforeAfter({ body, colors }) {
  const up = body.direction !== 'down'
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-400">{body.label}</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-400 line-through">{body.before}</span>
        <span style={{ color: colors.accent }}>→</span>
        <span className="font-display text-xl font-bold" style={{ color: colors.primary }}>{body.after}</span>
      </div>
      {body.delta && (
        <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: up ? '#16a34a' : '#dc2626' }}>
          {up ? '▲' : '▼'} {body.delta}
        </span>
      )}
    </div>
  )
}

export function IconGrid({ body, colors }) {
  const items = (body.items || []).slice(0, 4)
  return (
    <div className="grid h-full grid-cols-2 gap-1.5 content-center">
      {items.map((it, i) => (
        <div key={i} className="flex min-w-0 items-center gap-1.5 rounded-md border p-1.5" style={{ borderColor: withAlpha(colors.primary, 0.12) }}>
          <PanelIcon name={it.icon} className="h-3.5 w-3.5 shrink-0" style={{ color: colors.accent }} />
          <div className="min-w-0">
            <p className="truncate text-[9px] font-bold text-neutral-800">{it.label}</p>
            {it.caption && <p className="truncate text-[8px] text-neutral-400">{it.caption}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
