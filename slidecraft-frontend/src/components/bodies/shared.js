export function withAlpha(hex, alpha) {
  if (!hex) return `rgba(0,0,0,${alpha})`
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export const PALETTE_CYCLE = (brand) => [brand.primaryHex, brand.accentHex, brand.secondaryHex]
