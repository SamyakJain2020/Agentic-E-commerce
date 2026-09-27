import { withAlpha } from './shared'

export default function StatGrid({ data, brand }) {
  const stats = data.stats || []
  return (
    <div className="grid h-full grid-cols-2 gap-2.5 content-start sm:grid-cols-4 sm:gap-3">
      {stats.slice(0, 8).map((s, i) => (
        <div
          key={i}
          className={`flex flex-col justify-center rounded-xl border p-3 ${s.hero ? 'col-span-2 row-span-1' : ''}`}
          style={{
            background: i % 2 === 0 ? withAlpha(brand.accentHex, 0.08) : withAlpha(brand.secondaryHex, 0.08),
            borderColor: withAlpha(brand.primaryHex, 0.12),
          }}
        >
          {s.delta && (
            <span className="mb-1 inline-flex w-fit items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: withAlpha(brand.accentHex, 0.15), color: brand.accentHex }}>
              ▲ {s.delta}
            </span>
          )}
          <p className={`font-display font-bold leading-none ${s.hero ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`} style={{ color: brand.primaryHex }}>
            {s.value}
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{s.label}</p>
          {s.caption && <p className="mt-0.5 line-clamp-1 text-[10px] text-neutral-400">{s.caption}</p>}
        </div>
      ))}
    </div>
  )
}
