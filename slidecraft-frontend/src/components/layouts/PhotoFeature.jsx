import { withAlpha } from './shared'

export default function PhotoFeature({ data, brand }) {
  return (
    <div className="flex h-full gap-4">
      <ul className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        {(data.bullets || []).slice(0, 6).map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-neutral-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: brand.accentHex }} />
            <span className="line-clamp-2">{b}</span>
          </li>
        ))}
      </ul>
      {data.imageUrl && (
        <div className="w-2/5 shrink-0 overflow-hidden rounded-xl" style={{ background: withAlpha(brand.secondaryHex, 0.15) }}>
          <img src={data.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  )
}
