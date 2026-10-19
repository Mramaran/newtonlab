import { solveIncline } from './incline'
import { solveProjectile } from './projectile'
import type { InclineSpec, ProjectileSpec, SupportedSpec } from './spec'

export interface Answer {
  label: string
  /** LaTeX symbol, e.g. R */
  symbol: string
  /** null when the quantity does not exist (e.g. the block never reaches the bottom) */
  value: number | null
  unit: string
  note?: string
}

/** Rounds for display: at most 2 decimals, no trailing zeros. */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const r = Math.round(n * 100) / 100
  return (Object.is(r, -0) ? 0 : r).toString()
}

const PROJECTILE_LABELS = {
  range: { label: 'Horizontal range', symbol: 'R', unit: 'm' },
  timeOfFlight: { label: 'Time of flight', symbol: 't', unit: 's' },
  maxHeight: { label: 'Maximum height', symbol: 'H', unit: 'm' },
  impactSpeed: { label: 'Landing speed', symbol: 'v_f', unit: 'm/s' },
} as const

const INCLINE_LABELS = {
  finalSpeed: { label: 'Speed at the bottom', symbol: 'v', unit: 'm/s' },
  timeToBottom: { label: 'Time to reach the bottom', symbol: 't', unit: 's' },
  acceleration: { label: 'Acceleration down the slope', symbol: 'a', unit: 'm/s²' },
} as const

export function answerFor(spec: SupportedSpec): Answer {
  if (spec.type === 'projectile') {
    const s = solveProjectile(spec)
    return { ...PROJECTILE_LABELS[spec.unknown], value: s[spec.unknown] }
  }
  const s = solveIncline(spec)
  const base = INCLINE_LABELS[spec.unknown]
  if (spec.unknown === 'acceleration') return { ...base, value: s.acceleration }
  if (s.reachesBottom) return { ...base, value: spec.unknown === 'finalSpeed' ? s.finalSpeed : s.timeToBottom }
  const note =
    s.stopDistance === 0
      ? 'Friction is strong enough to hold the block still, so it never moves.'
      : `The block stops after ${fmt(s.stopDistance ?? 0)} m and never reaches the bottom.`
  return { ...base, value: spec.unknown === 'finalSpeed' ? 0 : null, note }
}

const deg = (n: number) => `${fmt(n)}^\\circ`

function projectileSteps(spec: ProjectileSpec): string[] {
  const s = solveProjectile(spec)
  const { speed: v, angleDeg: a, height: h, g } = spec
  const steps = [
    `v_x = v\\cos\\theta = ${fmt(v)}\\cos ${deg(a)} = ${fmt(s.vx)}\\ \\text{m/s}`,
    `v_y = v\\sin\\theta = ${fmt(v)}\\sin ${deg(a)} = ${fmt(s.vy)}\\ \\text{m/s}`,
  ]
  const timeStep = `t = \\frac{v_y + \\sqrt{v_y^2 + 2gh}}{g} = \\frac{${fmt(s.vy)} + \\sqrt{${fmt(s.vy)}^2 + 2(${fmt(g)})(${fmt(h)})}}{${fmt(g)}} = ${fmt(s.timeOfFlight)}\\ \\text{s}`
  switch (spec.unknown) {
    case 'range':
      return [...steps, timeStep, `R = v_x t = ${fmt(s.vx)} \\times ${fmt(s.timeOfFlight)} = ${fmt(s.range)}\\ \\text{m}`]
    case 'timeOfFlight':
      return [...steps, timeStep]
    case 'maxHeight':
      return [...steps, `H = h + \\frac{v_y^2}{2g} = ${fmt(h)} + \\frac{${fmt(s.vy)}^2}{2(${fmt(g)})} = ${fmt(s.maxHeight)}\\ \\text{m}`]
    case 'impactSpeed': {
      const vyEnd = s.vy - g * s.timeOfFlight
      return [
        ...steps,
        timeStep,
        `v_{y,f} = v_y - gt = ${fmt(s.vy)} - ${fmt(g)}(${fmt(s.timeOfFlight)}) = ${fmt(vyEnd)}\\ \\text{m/s}`,
        `v_f = \\sqrt{v_x^2 + v_{y,f}^2} = ${fmt(s.impactSpeed)}\\ \\text{m/s}`,
      ]
    }
  }
}

function inclineSteps(spec: InclineSpec): string[] {
  const s = solveIncline(spec)
  const { angleDeg: a, mu, g, length: L, initialSpeed: v0 } = spec
  const rawA = g * (Math.sin((a * Math.PI) / 180) - mu * Math.cos((a * Math.PI) / 180))
  const steps = [`a = g(\\sin\\theta - \\mu\\cos\\theta) = ${fmt(g)}(\\sin ${deg(a)} - ${fmt(mu)}\\cos ${deg(a)}) = ${fmt(rawA)}\\ \\text{m/s}^2`]
  if (s.stopDistance === 0) {
    return [...steps, `a \\le 0 \\text{ and the block starts at rest, so friction holds it: } a = 0`]
  }
  if (spec.unknown === 'acceleration') return steps
  if (!s.reachesBottom) {
    return [...steps, `d_{stop} = \\frac{v_0^2}{2|a|} = \\frac{${fmt(v0)}^2}{2(${fmt(Math.abs(rawA))})} = ${fmt(s.stopDistance ?? 0)}\\ \\text{m} < L = ${fmt(L)}\\ \\text{m}`]
  }
  const speedStep = `v = \\sqrt{v_0^2 + 2aL} = \\sqrt{${fmt(v0)}^2 + 2(${fmt(rawA)})(${fmt(L)})} = ${fmt(s.finalSpeed)}\\ \\text{m/s}`
  if (spec.unknown === 'finalSpeed') return [...steps, speedStep]
  const timeStep =
    Math.abs(rawA) < 1e-12
      ? `t = \\frac{L}{v_0} = \\frac{${fmt(L)}}{${fmt(v0)}} = ${fmt(s.timeToBottom ?? 0)}\\ \\text{s}`
      : `t = \\frac{v - v_0}{a} = \\frac{${fmt(s.finalSpeed)} - ${fmt(v0)}}{${fmt(rawA)}} = ${fmt(s.timeToBottom ?? 0)}\\ \\text{s}`
  return [...steps, speedStep, timeStep]
}

/** Worked solution as LaTeX lines, with the student's numbers substituted. */
export function workedSteps(spec: SupportedSpec): string[] {
  return spec.type === 'projectile' ? projectileSteps(spec) : inclineSteps(spec)
}
