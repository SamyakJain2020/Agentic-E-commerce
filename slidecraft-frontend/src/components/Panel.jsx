import { BODIES } from './bodies'
import { withAlpha } from './bodies/shared'
import { PanelIcon } from './bodies/icons'

export function resolveColor(token, brand) {
  if (!token) return brand.primaryHex
  if (token.startsWith('#')) return token
  if (token === 'secondary') return brand.secondaryHex
  if (token === 'accent') return brand.accentHex
  return brand.primaryHex
}

export default function Panel({ panel, brand }) {
  const colors = { primary: brand.primaryHex, secondary: brand.secondaryHex, accent: brand.accentHex }
  const Body = BODIES[panel.body?.type]
  const headerColor = resolveColor(panel.headerColor, brand)

  if (panel.emphasize) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-lg" style={{ background: brand.primaryHex }}>
        {Body ? <Body body={panel.body} colors={colors} /> : null}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border" style={{ borderColor: withAlpha(brand.primaryHex, 0.12) }}>
      {panel.headerLabel && (
        <div className="flex shrink-0 items-center gap-1 px-2 py-1" style={{ background: headerColor }}>
          {panel.headerIcon && <PanelIcon name={panel.headerIcon} className="h-3 w-3 shrink-0 text-white" style={{ color: 'white' }} />}
          <p className="line-clamp-1 text-[9px] font-bold uppercase tracking-wide text-white">{panel.headerLabel}</p>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-hidden p-2">
        {Body ? <Body body={panel.body || {}} colors={colors} /> : null}
      </div>
      {panel.footer?.text && (
        <div className="shrink-0 px-2 py-1 text-center" style={{ background: withAlpha(resolveColor(panel.footer.color, brand), 0.12) }}>
          <p className="line-clamp-1 text-[8px] font-bold" style={{ color: resolveColor(panel.footer.color, brand) }}>{panel.footer.text}</p>
        </div>
      )}
    </div>
  )
}
