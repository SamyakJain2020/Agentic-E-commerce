import { Fragment } from 'react'
import { PALETTE_CYCLE, withAlpha } from './shared'

export default function DataTable({ data, brand }) {
  const headers = data.headers || []
  const groups = (data.groups || []).slice(0, 5)
  const colors = PALETTE_CYCLE(brand)
  return (
    <div className="h-full overflow-hidden rounded-lg border" style={{ borderColor: withAlpha(brand.primaryHex, 0.15) }}>
      <table className="w-full border-collapse text-[11px]">
        <tbody>
          {groups.map((g, gi) => (
            <Fragment key={gi}>
              <tr>
                <td className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: colors[gi % colors.length] }}>
                  {g.label}
                </td>
                {headers.slice(1).map((h, hi) => (
                  <td key={hi} className="px-2 py-1.5 text-[10px] font-semibold text-white/90" style={{ background: colors[gi % colors.length] }}>{h}</td>
                ))}
              </tr>
              {(g.rows || []).slice(0, 4).map((row, ri) => (
                <tr key={`r-${gi}-${ri}`} style={{ background: ri % 2 === 0 ? withAlpha(colors[gi % colors.length], 0.06) : 'white' }}>
                  {row.slice(0, headers.length || row.length).map((cell, ci) => (
                    <td key={ci} className="max-w-[160px] truncate px-2 py-1 text-neutral-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
