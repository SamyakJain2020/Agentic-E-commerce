import { withAlpha } from './shared'

export default function BulletPanels({ data, brand }) {
  const panels = (data.panels || []).slice(0, 4)
  const factRows = data.factRows || []
  const imageUrl = data.imageUrl

  return (
    <div className="flex h-full gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {factRows.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 rounded-lg border p-2" style={{ borderColor: withAlpha(brand.primaryHex, 0.15) }}>
            {factRows.slice(0, 6).map((r, i) => (
              <div key={i} className="min-w-0 text-[10px]">
                <span className="font-semibold text-neutral-400">{r.label}: </span>
                <span className="text-neutral-700">{r.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className={`grid flex-1 gap-2 ${panels.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {panels.map((p, i) => (
            <div key={i} className="min-w-0 overflow-hidden rounded-lg border" style={{ borderColor: withAlpha(brand.primaryHex, 0.15) }}>
              <div className="px-2.5 py-1.5" style={{ background: withAlpha(brand.primaryHex, 0.9) }}>
                <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-wide text-white">{p.heading}</p>
              </div>
              <ul className="space-y-1 p-2.5">
                {(p.bullets || []).slice(0, 5).map((b, j) => (
                  <li key={j} className="line-clamp-1 text-[10px] text-neutral-600">• {b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {imageUrl && (
        <div className="hidden w-1/3 shrink-0 overflow-hidden rounded-lg sm:block">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  )
}
