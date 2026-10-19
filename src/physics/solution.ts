import { solveCollision } from './collision'
import { solveIncline } from './incline'
import { solveProjectile } from './projectile'
import { solvePulley } from './pulley'
import type { CollisionSpec, InclineSpec, ProjectileSpec, PulleySpec, SpringSpec, SupportedSpec } from './spec'
import { solveSpring } from './spring'

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

const PULLEY_LABELS = {
  acceleration: { label: 'Acceleration of the masses', symbol: 'a', unit: 'm/s²' },
  tension: { label: 'Tension in the string', symbol: 'T', unit: 'N' },
  time: { label: 'Time to move the distance', symbol: 't', unit: 's' },
  speed: { label: 'Speed after moving the distance', symbol: 'v', unit: 'm/s' },
} as const

const COLLISION_LABELS = {
  v1: { label: 'Velocity of body 1 after', symbol: 'v_1', unit: 'm/s' },
  v2: { label: 'Velocity of body 2 after', symbol: 'v_2', unit: 'm/s' },
  keLoss: { label: 'Kinetic energy lost', symbol: '\\Delta KE', unit: 'J' },
} as const

const SPRING_LABELS = {
  period: { label: 'Time period', symbol: 'T', unit: 's' },
  frequency: { label: 'Frequency', symbol: 'f', unit: 'Hz' },
  maxSpeed: { label: 'Maximum speed', symbol: 'v_{max}', unit: 'm/s' },
  maxAcceleration: { label: 'Maximum acceleration', symbol: 'a_{max}', unit: 'm/s²' },
  energy: { label: 'Total energy', symbol: 'E', unit: 'J' },
} as const

export function answerFor(spec: SupportedSpec): Answer {
  switch (spec.type) {
    case 'projectile': {
      const s = solveProjectile(spec)
      return { ...PROJECTILE_LABELS[spec.unknown], value: s[spec.unknown] }
    }
    case 'incline':
      return inclineAnswer(spec)
    case 'pulley': {
      const s = solvePulley(spec)
      const base = PULLEY_LABELS[spec.unknown]
      if (s.acceleration === 0 && (spec.unknown === 'time' || spec.unknown === 'speed')) {
        return { ...base, value: spec.unknown === 'speed' ? 0 : null, note: stuckNote(spec) }
      }
      return { ...base, value: s[spec.unknown], note: s.acceleration === 0 ? stuckNote(spec) : undefined }
    }
    case 'collision': {
      const s = solveCollision(spec)
      const note = s.collides ? undefined : 'Body 1 is not moving faster than body 2, so they never collide.'
      return { ...COLLISION_LABELS[spec.unknown], value: s[spec.unknown], note }
    }
    case 'spring': {
      const s = solveSpring(spec)
      return { ...SPRING_LABELS[spec.unknown], value: s[spec.unknown] }
    }
  }
}

const stuckNote = (spec: PulleySpec) =>
  spec.setup === 'atwood' ? 'The masses are equal, so they balance and nothing moves.' : 'Friction is strong enough to hold the block, so nothing moves.'

function inclineAnswer(spec: InclineSpec): Answer {
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

function projectileSteps(spec: ProjectileSpec): Step[] {
  const s = solveProjectile(spec)
  const { speed: v, angleDeg: a, height: h, g } = spec
  const steps: Step[] = [
    { label: 'Horizontal part of the launch velocity', tex: `v_x = v\\cos\\theta = ${fmt(v)}\\cos ${deg(a)} = ${fmt(s.vx)}\\ \\text{m/s}` },
    { label: 'Vertical part of the launch velocity', tex: `v_y = v\\sin\\theta = ${fmt(v)}\\sin ${deg(a)} = ${fmt(s.vy)}\\ \\text{m/s}` },
  ]
  const timeStep: Step = {
    label: h > 0 ? 'Time in the air: when its height drops from h to 0' : 'Time in the air',
    tex: `t = \\frac{v_y + \\sqrt{v_y^2 + 2gh}}{g} = \\frac{${fmt(s.vy)} + \\sqrt{${fmt(s.vy)}^2 + 2(${fmt(g)})(${fmt(h)})}}{${fmt(g)}} = ${fmt(s.timeOfFlight)}\\ \\text{s}`,
  }
  switch (spec.unknown) {
    case 'range':
      return [
        ...steps,
        timeStep,
        { label: 'Horizontal speed never changes, so range = speed × time', tex: `R = v_x t = ${fmt(s.vx)} \\times ${fmt(s.timeOfFlight)} = ${fmt(s.range)}\\ \\text{m}` },
      ]
    case 'timeOfFlight':
      return [...steps, timeStep]
    case 'maxHeight':
      return [
        ...steps,
        { label: 'At the top the vertical speed is zero', tex: `H = h + \\frac{v_y^2}{2g} = ${fmt(h)} + \\frac{${fmt(s.vy)}^2}{2(${fmt(g)})} = ${fmt(s.maxHeight)}\\ \\text{m}` },
      ]
    case 'impactSpeed': {
      const vyEnd = s.vy - g * s.timeOfFlight
      return [
        ...steps,
        timeStep,
        { label: 'Vertical speed when it lands', tex: `v_{y,f} = v_y - gt = ${fmt(s.vy)} - ${fmt(g)}(${fmt(s.timeOfFlight)}) = ${fmt(vyEnd)}\\ \\text{m/s}` },
        { label: 'Combine both parts (Pythagoras)', tex: `v_f = \\sqrt{v_x^2 + v_{y,f}^2} = ${fmt(s.impactSpeed)}\\ \\text{m/s}` },
      ]
    }
  }
}

function inclineSteps(spec: InclineSpec): Step[] {
  const s = solveIncline(spec)
  const { angleDeg: a, mu, g, length: L, initialSpeed: v0 } = spec
  const rawA = g * (Math.sin((a * Math.PI) / 180) - mu * Math.cos((a * Math.PI) / 180))
  const steps: Step[] = [
    {
      label: mu > 0 ? 'Acceleration: gravity along the slope minus friction' : 'Acceleration: gravity along the slope',
      tex: `a = g(\\sin\\theta - \\mu\\cos\\theta) = ${fmt(g)}(\\sin ${deg(a)} - ${fmt(mu)}\\cos ${deg(a)}) = ${fmt(rawA)}\\ \\text{m/s}^2`,
    },
  ]
  if (s.stopDistance === 0) {
    return [...steps, { label: 'Friction wins', tex: `a \\le 0 \\text{ and the block starts at rest, so friction holds it: } a = 0` }]
  }
  if (spec.unknown === 'acceleration') return steps
  if (!s.reachesBottom) {
    return [
      ...steps,
      {
        label: 'It slows down and stops before the bottom',
        tex: `d_{stop} = \\frac{v_0^2}{2|a|} = \\frac{${fmt(v0)}^2}{2(${fmt(Math.abs(rawA))})} = ${fmt(s.stopDistance ?? 0)}\\ \\text{m} < L = ${fmt(L)}\\ \\text{m}`,
      },
    ]
  }
  const speedStep: Step = {
    label: 'Speed at the bottom (v² = v₀² + 2aL)',
    tex: `v = \\sqrt{v_0^2 + 2aL} = \\sqrt{${fmt(v0)}^2 + 2(${fmt(rawA)})(${fmt(L)})} = ${fmt(s.finalSpeed)}\\ \\text{m/s}`,
  }
  if (spec.unknown === 'finalSpeed') return [...steps, speedStep]
  const timeStep: Step =
    Math.abs(rawA) < 1e-12
      ? { label: 'Constant speed, so time = distance ÷ speed', tex: `t = \\frac{L}{v_0} = \\frac{${fmt(L)}}{${fmt(v0)}} = ${fmt(s.timeToBottom ?? 0)}\\ \\text{s}` }
      : {
          label: 'Time from the change in speed',
          tex: `t = \\frac{v - v_0}{a} = \\frac{${fmt(s.finalSpeed)} - ${fmt(v0)}}{${fmt(rawA)}} = ${fmt(s.timeToBottom ?? 0)}\\ \\text{s}`,
        }
  return [...steps, speedStep, timeStep]
}

/** One line of the worked solution: a plain-English label and the LaTeX working. */
export interface Step {
  label: string
  tex: string
}

function pulleySteps(spec: PulleySpec): Step[] {
  const s = solvePulley(spec)
  const { m1, m2, mu, g, distance: d } = spec
  const steps: Step[] = []
  if (spec.setup === 'atwood') {
    steps.push({
      label: 'The heavier side pulls; both masses share one acceleration',
      tex: `a = \\frac{|m_2 - m_1|\\,g}{m_1 + m_2} = \\frac{|${fmt(m2)} - ${fmt(m1)}|(${fmt(g)})}{${fmt(m1)} + ${fmt(m2)}} = ${fmt(s.acceleration)}\\ \\text{m/s}^2`,
    })
    steps.push({
      label: 'Tension, from Newton’s second law on either mass',
      tex: `T = \\frac{2 m_1 m_2 g}{m_1 + m_2} = \\frac{2(${fmt(m1)})(${fmt(m2)})(${fmt(g)})}{${fmt(m1)} + ${fmt(m2)}} = ${fmt(s.tension)}\\ \\text{N}`,
    })
  } else {
    const pull = m2 * g
    const friction = mu * m1 * g
    steps.push({
      label: 'Compare the hanging weight with the friction on the table',
      tex: `m_2 g = ${fmt(pull)}\\ \\text{N},\\quad \\mu m_1 g = ${fmt(mu)}(${fmt(m1)})(${fmt(g)}) = ${fmt(friction)}\\ \\text{N}`,
    })
    if (s.acceleration === 0) {
      steps.push({ label: 'Friction wins', tex: `m_2 g \\le \\mu m_1 g \\Rightarrow a = 0,\\ T = m_2 g = ${fmt(s.tension)}\\ \\text{N}` })
      return steps
    }
    steps.push({
      label: 'Net force over the total mass',
      tex: `a = \\frac{m_2 g - \\mu m_1 g}{m_1 + m_2} = \\frac{${fmt(pull)} - ${fmt(friction)}}{${fmt(m1 + m2)}} = ${fmt(s.acceleration)}\\ \\text{m/s}^2`,
    })
    steps.push({ label: 'Tension, from the hanging mass', tex: `T = m_2 (g - a) = ${fmt(m2)}(${fmt(g)} - ${fmt(s.acceleration)}) = ${fmt(s.tension)}\\ \\text{N}` })
  }
  if (s.acceleration === 0) return steps
  if (spec.unknown === 'time') {
    steps.push({ label: 'Starting from rest, s = ½at²', tex: `t = \\sqrt{\\frac{2s}{a}} = \\sqrt{\\frac{2(${fmt(d)})}{${fmt(s.acceleration)}}} = ${fmt(s.time ?? 0)}\\ \\text{s}` })
  }
  if (spec.unknown === 'speed') {
    steps.push({ label: 'Starting from rest, v² = 2as', tex: `v = \\sqrt{2as} = \\sqrt{2(${fmt(s.acceleration)})(${fmt(d)})} = ${fmt(s.speed)}\\ \\text{m/s}` })
  }
  return steps
}

function collisionSteps(spec: CollisionSpec): Step[] {
  const s = solveCollision(spec)
  const { m1, u1, m2, u2, e } = spec
  const steps: Step[] = [
    {
      label: 'Momentum before the collision',
      tex: `p = m_1 u_1 + m_2 u_2 = ${fmt(m1)}(${fmt(u1)}) + ${fmt(m2)}(${fmt(u2)}) = ${fmt(s.momentumBefore)}\\ \\text{kg·m/s}`,
    },
  ]
  if (!s.collides) return [...steps, { label: 'Body 1 never catches body 2', tex: `u_1 \\le u_2 \\Rightarrow \\text{no collision}` }]
  if (e === 0) {
    steps.push({ label: 'Perfectly inelastic: they stick and move together', tex: `v = \\frac{p}{m_1 + m_2} = \\frac{${fmt(s.momentumBefore)}}{${fmt(m1 + m2)}} = ${fmt(s.v1)}\\ \\text{m/s}` })
  } else {
    steps.push({
      label: e === 1 ? 'Elastic: momentum and kinetic energy are both conserved' : `Coefficient of restitution e = ${fmt(e)}: separation speed = e × approach speed`,
      tex: `v_1 = \\frac{p - m_2 e (u_1 - u_2)}{m_1 + m_2} = ${fmt(s.v1)}\\ \\text{m/s},\\quad v_2 = \\frac{p + m_1 e (u_1 - u_2)}{m_1 + m_2} = ${fmt(s.v2)}\\ \\text{m/s}`,
    })
  }
  steps.push({
    label: 'Kinetic energy before and after',
    tex: `KE_i = ${fmt(s.keBefore)}\\ \\text{J},\\quad KE_f = ${fmt(s.keAfter)}\\ \\text{J},\\quad \\Delta KE = ${fmt(s.keLoss)}\\ \\text{J}`,
  })
  return steps
}

function springSteps(spec: SpringSpec): Step[] {
  const s = solveSpring(spec)
  const { m, k, A } = spec
  const steps: Step[] = [
    { label: 'Angular frequency', tex: `\\omega = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{${fmt(k)}}{${fmt(m)}}} = ${fmt(s.omega)}\\ \\text{rad/s}` },
  ]
  switch (spec.unknown) {
    case 'period':
      return [...steps, { label: 'Period does not depend on the amplitude', tex: `T = 2\\pi\\sqrt{\\frac{m}{k}} = \\frac{2\\pi}{${fmt(s.omega)}} = ${fmt(s.period)}\\ \\text{s}` }]
    case 'frequency':
      return [...steps, { label: 'Frequency is one over the period', tex: `f = \\frac{\\omega}{2\\pi} = ${fmt(s.frequency)}\\ \\text{Hz}` }]
    case 'maxSpeed':
      return [...steps, { label: 'Fastest at the centre', tex: `v_{max} = A\\omega = ${fmt(A)}(${fmt(s.omega)}) = ${fmt(s.maxSpeed)}\\ \\text{m/s}` }]
    case 'maxAcceleration':
      return [...steps, { label: 'Largest at the ends', tex: `a_{max} = A\\omega^2 = ${fmt(A)}(${fmt(s.omega)})^2 = ${fmt(s.maxAcceleration)}\\ \\text{m/s}^2` }]
    case 'energy':
      return [{ label: 'All potential energy at the end of the swing', tex: `E = \\tfrac{1}{2} k A^2 = \\tfrac{1}{2}(${fmt(k)})(${fmt(A)})^2 = ${fmt(s.energy)}\\ \\text{J}` }]
  }
}

/** Worked solution with the student's numbers substituted. */
export function workedSteps(spec: SupportedSpec): Step[] {
  switch (spec.type) {
    case 'projectile':
      return projectileSteps(spec)
    case 'incline':
      return inclineSteps(spec)
    case 'pulley':
      return pulleySteps(spec)
    case 'collision':
      return collisionSteps(spec)
    case 'spring':
      return springSteps(spec)
  }
}
