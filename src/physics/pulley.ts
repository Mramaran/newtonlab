export type PulleySetup = 'atwood' | 'table'

export interface PulleyParams {
  /** "atwood": two masses hanging over one pulley; "table": m1 on a table pulled by hanging m2 */
  setup: PulleySetup
  /** atwood: left hanging mass; table: mass on the table (kg) */
  m1: number
  /** atwood: right hanging mass; table: hanging mass (kg) */
  m2: number
  /** coefficient of kinetic friction between m1 and the table (table only) */
  mu: number
  /** distance the masses move, used for the time and speed questions (m) */
  distance: number
  /** gravitational acceleration, m/s² */
  g: number
}

export interface PulleySolution {
  /** size of the acceleration of both masses, m/s² */
  acceleration: number
  /** atwood: +1 when m2 moves down, -1 when m1 moves down, 0 when balanced; table: +1 moving, 0 stuck */
  direction: number
  /** tension in the string, N */
  tension: number
  /** time to move `distance` from rest, s (null if it never moves) */
  time: number | null
  /** speed after moving `distance` from rest, m/s */
  speed: number
  /** friction force on the table block, N (0 for atwood) */
  friction: number
  /** how long the motion lasts in the simulation, s */
  duration: number
}

export function solvePulley(p: PulleyParams): PulleySolution {
  const total = p.m1 + p.m2
  if (p.setup === 'atwood') {
    const diff = p.m2 - p.m1
    const acceleration = (Math.abs(diff) * p.g) / total
    const tension = (2 * p.m1 * p.m2 * p.g) / total
    return finish(p, acceleration, Math.sign(diff), tension, 0)
  }
  // Table: the hanging weight pulls, kinetic friction on the table block resists.
  const pull = p.m2 * p.g
  const maxFriction = p.mu * p.m1 * p.g
  if (pull <= maxFriction) {
    // Friction holds the system still: the string just holds up the hanging mass.
    return finish(p, 0, 0, pull, pull)
  }
  const acceleration = (pull - maxFriction) / total
  return finish(p, acceleration, 1, p.m2 * (p.g - acceleration), maxFriction)
}

function finish(p: PulleyParams, acceleration: number, direction: number, tension: number, friction: number): PulleySolution {
  const moves = acceleration > 1e-12
  const time = moves ? Math.sqrt((2 * p.distance) / acceleration) : null
  return {
    acceleration,
    direction: moves ? direction : 0,
    tension,
    time,
    speed: moves ? Math.sqrt(2 * acceleration * p.distance) : 0,
    friction,
    duration: time ?? 0,
  }
}

/** Distance moved by the masses at time t, m (capped at `distance`). */
export function pulleyPosition(p: PulleyParams, t: number): number {
  const s = solvePulley(p)
  const tc = Math.min(Math.max(t, 0), s.duration)
  return Math.min(0.5 * s.acceleration * tc * tc, p.distance)
}
