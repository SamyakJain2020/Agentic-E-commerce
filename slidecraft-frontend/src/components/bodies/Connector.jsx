import { withAlpha } from './shared'

const ARROWS = { right: '→', left: '←', down: '↓', up: '↑' }

export default function Connector({ panel, colors }) {
  const dashed = panel.style === 'dashed'
  const vertical = panel.direction === 'up' || panel.direction === 'down'
  return (
    <div className="flex h-full w-full items-center justify-center">
      {dashed ? (
        <div
          className={`${vertical ? 'h-full w-0 border-l-2' : 'h-0 w-full border-t-2'} border-dashed`}
          style={{ borderColor: withAlpha(colors.accent, 0.6) }}
        />
      ) : (
        <span className="text-2xl font-bold" style={{ color: colors.accent }}>{ARROWS[panel.direction] || '→'}</span>
      )}
    </div>
  )
}
