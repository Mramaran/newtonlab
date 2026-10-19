export interface InclineParams {
  /** slope angle above horizontal, degrees */
  angleDeg: number
  /** coefficient of kinetic friction */
  mu: number
  /** length of the slope, m */
  length: number
  /** mass of the block, kg (does not change the motion, only the forces) */
  mass: number
  /** speed down the slope at t = 0, m/s */
  initialSpeed: number
  /** gravitational acceleration, m/s² */
  g: number
}

export interface InclineSolution {
  /** acceleration down the slope, m/s² (negative = slowing down) */
  acceleration: number
  reachesBottom: boolean
  /** time to reach the bottom, s (null if it never gets there) */
  timeToBottom: number | null
  /** speed at the bottom, or 0 if it stops first, m/s */
  finalSpeed: number
  /** distance travelled before stopping, m (null if it reaches the bottom) */
  stopDistance: number | null
  /** how long the motion lasts, s */
  duration: number
  gravityAlong: number
  normal: number
  friction: number
}

const toRad = (deg: number) => (deg * Math.PI) / 180

export function solveIncline(p: InclineParams): InclineSolution {
  const theta = toRad(p.angleDeg)
  const gravityAlong = p.mass * p.g * Math.sin(theta)
  const normal = p.mass * p.g * Math.cos(theta)
  const friction = p.mu * normal
  const forces = { gravityAlong, normal, friction }
  const a = p.g * (Math.sin(theta) - p.mu * Math.cos(theta))
  const v0 = p.initialSpeed

  if (v0 <= 0 && a <= 0) {
    // Friction holds the block in place.
    return {
      acceleration: 0,
      reachesBottom: false,
      timeToBottom: null,
      finalSpeed: 0,
      stopDistance: 0,
      duration: 0,
      ...forces,
    }
  }

  const vSquaredAtBottom = v0 * v0 + 2 * a * p.length
  if (vSquaredAtBottom >= 0) {
    const finalSpeed = Math.sqrt(vSquaredAtBottom)
    // From L = v0·t + ½at², or t = L / v0 when a = 0
    const t = Math.abs(a) < 1e-12 ? p.length / v0 : (finalSpeed - v0) / a
    return {
      acceleration: a,
      reachesBottom: true,
      timeToBottom: t,
      finalSpeed,
      stopDistance: null,
      duration: t,
      ...forces,
    }
  }

  // Decelerating block stops before the bottom; kinetic friction already beats gravity, so it stays.
  const stopTime = v0 / -a
  return {
    acceleration: a,
    reachesBottom: false,
    timeToBottom: null,
    finalSpeed: 0,
    stopDistance: (v0 * v0) / (2 * -a),
    duration: stopTime,
    ...forces,
  }
}

/** Distance travelled down the slope at time t, m. */
export function inclinePosition(p: InclineParams, t: number): number {
  const s = solveIncline(p)
  const tc = Math.min(Math.max(t, 0), s.duration)
  const d = p.initialSpeed * tc + 0.5 * s.acceleration * tc * tc
  return Math.min(d, p.length)
}
