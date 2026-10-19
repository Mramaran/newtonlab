import type { SupportedSpec } from './physics/spec'

/** Colour per parameter, shared by the problem highlights and the slider dots (defined in index.css). */
export const FIELD_COLORS: Record<string, string> = {
  speed: 'var(--f-speed)',
  initialSpeed: 'var(--f-speed)',
  angleDeg: 'var(--f-angle)',
  height: 'var(--f-height)',
  length: 'var(--f-height)',
  g: 'var(--f-g)',
  mu: 'var(--f-mu)',
  mass: 'var(--f-mass)',
}

export interface Segment {
  text: string
  /** the spec field this number was read into */
  field?: string
}

type Kind = 'speed' | 'accel' | 'angle' | 'mass' | 'length' | 'none'

// Longest units first so "m/s²" wins over "m/s" and "m".
const UNITS: [string, Kind, number][] = [
  ['m/s²', 'accel', 1],
  ['m/s^2', 'accel', 1],
  ['m/s2', 'accel', 1],
  ['m/s', 'speed', 1],
  ['km/h', 'speed', 1 / 3.6],
  ['kmph', 'speed', 1 / 3.6],
  ['°', 'angle', 1],
  ['degrees', 'angle', 1],
  ['degree', 'angle', 1],
  ['deg', 'angle', 1],
  ['kg', 'mass', 1],
  ['cm', 'length', 0.01],
  ['metres', 'length', 1],
  ['meters', 'length', 1],
  ['m', 'length', 1],
]

const FIELDS_BY_KIND: Record<Kind, string[]> = {
  speed: ['speed', 'initialSpeed'],
  accel: ['g'],
  angle: ['angleDeg'],
  mass: ['mass'],
  length: ['height', 'length'],
  none: ['mu', 'g', 'speed', 'angleDeg', 'height', 'length', 'mass', 'initialSpeed'],
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const UNIT_PATTERN = UNITS.map(([u]) => escape(u)).join('|')
// A number, optionally followed by a unit that is not the start of a longer word ("10 m high" but not "10 minutes").
const TOKEN = new RegExp(`(\\d+(?:\\.\\d+)?)(\\s*(?:${UNIT_PATTERN})(?![A-Za-z]))?`, 'gi')

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 + 0.01 * Math.abs(b)

/** Splits the problem text so each number that was read into a parameter can be coloured to match its slider. */
export function highlightProblem(text: string, spec: SupportedSpec): Segment[] {
  const values = spec as unknown as Record<string, number>
  const segments: Segment[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const index = m.index ?? 0
    const raw = Number(m[1])
    const unitText = (m[2] ?? '').trim().toLowerCase()
    const unit = UNITS.find(([u]) => u.toLowerCase() === unitText)
    const kind: Kind = unit ? unit[1] : 'none'
    const value = raw * (unit ? unit[2] : 1)
    const field = FIELDS_BY_KIND[kind].find(
      (f) => f in values && typeof values[f] === 'number' && close(values[f], value) && !(kind === 'none' && value === 0),
    )
    if (!field) continue
    if (index > last) segments.push({ text: text.slice(last, index) })
    segments.push({ text: m[0], field })
    last = index + m[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  return segments
}
