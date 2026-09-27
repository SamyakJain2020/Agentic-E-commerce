import {
  HeartIcon, ChartBarIcon, ShieldCheckIcon, UsersIcon, ArrowsRightLeftIcon,
  ClockIcon, ExclamationTriangleIcon, CurrencyDollarIcon,
} from '@heroicons/react/24/solid'
import {
  ClockIcon as ClockOutline, GlobeAltIcon, BoltIcon, StarIcon,
} from '@heroicons/react/24/outline'

export const ICONS = {
  heart: HeartIcon,
  chart: ChartBarIcon,
  shield: ShieldCheckIcon,
  users: UsersIcon,
  arrows: ArrowsRightLeftIcon,
  clock: ClockOutline,
  target: ExclamationTriangleIcon,
  star: StarIcon,
  globe: GlobeAltIcon,
  bolt: BoltIcon,
  $: CurrencyDollarIcon,
  '!': ExclamationTriangleIcon,
}

export function PanelIcon({ name, className, style }) {
  const Icon = ICONS[name]
  if (Icon) return <Icon className={className} style={style} />
  if (name) return <span className={className} style={style}>{name.slice(0, 2)}</span>
  return null
}
