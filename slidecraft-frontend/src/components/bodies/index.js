import { MiniCards, Bullets, Bars, Donut, DataTable } from './DataBodies'
import { StatPair, BeforeAfter, IconGrid } from './StatBodies'
import { Flow, HubSpoke, ChevronPhases, Timeline, Matrix } from './StructuralBodies'
import { Photo, Statement } from './FeatureBodies'

export const BODIES = {
  'mini-cards': MiniCards,
  bullets: Bullets,
  bars: Bars,
  donut: Donut,
  table: DataTable,
  'stat-pair': StatPair,
  'before-after': BeforeAfter,
  'icon-grid': IconGrid,
  flow: Flow,
  'hub-spoke': HubSpoke,
  'chevron-phases': ChevronPhases,
  timeline: Timeline,
  matrix: Matrix,
  photo: Photo,
  statement: Statement,
}
