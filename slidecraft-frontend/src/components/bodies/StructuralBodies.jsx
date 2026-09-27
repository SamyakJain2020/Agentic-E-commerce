import { withAlpha } from './shared'

export function Flow({ body, colors }) {
  const steps = (body.steps || []).slice(0, 5)
  const vertical = body.direction === 'vertical'
  return (
    <div className={`flex h-full items-center ${vertical ? 'flex-col justify-center' : 'flex-row justify-center'} gap-1`}>
      {steps.map((s, i) => (
        <div key={i} className={`flex items-center ${vertical ? 'flex-col' : 'flex-row'} gap-1`}>
          <div className="min-w-0 rounded-md px-2 py-1 text-center text-white" style={{ background: colors.primary }}>
            <p className="line-clamp-1 text-[9px] font-bold">{s.label}</p>
            {s.sublabel && <p className="line-clamp-1 text-[8px] text-white/70">{s.sublabel}</p>}
          </div>
          {i < steps.length - 1 && (
            <span className="shrink-0 text-sm font-bold" style={{ color: colors.accent }}>{vertical ? '↓' : '→'}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function HubSpoke({ body, colors }) {
  const spokes = (body.spokes || []).slice(0, 6)
  const n = spokes.length || 1
  const R = 38
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {spokes.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2
          const x = 50 + R * Math.cos(angle)
          const y = 50 + R * Math.sin(angle)
          return <line key={i} x1="50" y1="50" x2={x} y2={y} stroke={withAlpha(colors.primary, 0.35)} strokeWidth="1" />
        })}
      </svg>
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full p-1 text-center" style={{ background: colors.primary }}>
        <span className="line-clamp-2 text-[8px] font-bold text-white">{body.center}</span>
      </div>
      {spokes.map((label, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const x = 50 + R * Math.cos(angle)
        const y = 50 + R * Math.sin(angle)
        return (
          <span
            key={i}
            className="absolute z-10 max-w-[64px] truncate rounded-full px-1.5 py-0.5 text-[8px] font-semibold text-white"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', background: colors.accent }}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}

export function ChevronPhases({ body, colors }) {
  const phases = (body.phases || []).slice(0, 4)
  return (
    <div className="flex h-full items-stretch gap-0.5">
      {phases.map((p, i) => (
        <div
          key={i}
          className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 text-center text-white"
          style={{ background: p.active ? colors.accent : colors.secondary, clipPath: i < phases.length - 1 ? 'polygon(0 0,88% 0,100% 50%,88% 100%,0 100%,10% 50%)' : 'polygon(0 0,100% 0,100% 100%,0 100%,10% 50%)' }}
        >
          <p className="line-clamp-1 text-[8px] font-bold">{p.label}</p>
          <p className="line-clamp-2 text-[7px] text-white/70">{p.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function Timeline({ body, colors }) {
  const milestones = (body.milestones || []).slice(0, 7)
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="flex items-center">
        {milestones.map((m, i) => (
          <div key={i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <span className="mb-0.5 text-[8px] font-bold" style={{ color: colors.secondary }}>{m.dateLabel}</span>
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ background: colors.accent }}>
                {m.marker || i + 1}
              </span>
            </div>
            {i < milestones.length - 1 && <div className="mx-0.5 h-0 flex-1 border-t border-dashed" style={{ borderColor: withAlpha(colors.primary, 0.3) }} />}
          </div>
        ))}
      </div>
      <div className="mt-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}>
        {milestones.map((m, i) => (
          <div key={i} className="min-w-0">
            <p className="line-clamp-1 text-[8px] font-bold" style={{ color: colors.primary }}>{m.title}</p>
            <p className="line-clamp-2 text-[7px] leading-tight text-neutral-500">{m.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Matrix({ body, colors }) {
  const quadrants = (body.quadrants || []).slice(0, 4)
  while (quadrants.length < 4) quadrants.push({ title: '', bullets: [] })
  const palette = [colors.primary, colors.accent, colors.secondary]
  return (
    <div className="relative grid h-full grid-cols-2 grid-rows-2 overflow-hidden rounded border" style={{ borderColor: withAlpha(colors.primary, 0.15) }}>
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 border-t border-dashed" style={{ borderColor: withAlpha(colors.primary, 0.35) }} />
      <div className="pointer-events-none absolute bottom-0 top-0 left-1/2 z-10 border-l border-dashed" style={{ borderColor: withAlpha(colors.primary, 0.35) }} />
      {quadrants.map((q, i) => (
        <div key={i} className="min-w-0 overflow-hidden p-1.5" style={{ background: withAlpha(palette[i % 3], 0.06) }}>
          <p className="line-clamp-1 text-[9px] font-bold" style={{ color: palette[i % 3] }}>{q.title}</p>
          {(q.bullets || []).slice(0, 2).map((b, j) => (
            <p key={j} className="line-clamp-1 text-[8px] text-neutral-600">• {b}</p>
          ))}
        </div>
      ))}
    </div>
  )
}
