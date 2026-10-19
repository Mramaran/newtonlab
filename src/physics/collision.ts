export interface CollisionParams {
  /** mass of body 1, which starts on the left (kg) */
  m1: number
  /** initial velocity of body 1, m/s (positive = to the right) */
  u1: number
  m2: number
  /** initial velocity of body 2, m/s (positive = to the right; negative = moving left, towards body 1) */
  u2: number
  /** coefficient of restitution: 1 = perfectly elastic, 0 = perfectly inelastic (they stick together) */
  e: number
}

export interface CollisionSolution {
  /** whether body 1 ever catches up with body 2 */
  collides: boolean
  v1: number
  v2: number
  momentumBefore: number
  momentumAfter: number
  keBefore: number
  keAfter: number
  /** kinetic energy turned into heat, sound and deformation, J */
  keLoss: number
}

export function solveCollision(p: CollisionParams): CollisionSolution {
  const { m1, u1, m2, u2, e } = p
  const momentumBefore = m1 * u1 + m2 * u2
  const keBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2
  const collides = u1 > u2
  if (!collides) {
    return { collides, v1: u1, v2: u2, momentumBefore, momentumAfter: momentumBefore, keBefore, keAfter: keBefore, keLoss: 0 }
  }
  // Momentum is conserved and the separation speed is e times the approach speed.
  const total = m1 + m2
  const v1 = (momentumBefore - m2 * e * (u1 - u2)) / total
  const v2 = (momentumBefore + m1 * e * (u1 - u2)) / total
  const keAfter = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2
  return { collides, v1, v2, momentumBefore, momentumAfter: m1 * v1 + m2 * v2, keBefore, keAfter, keLoss: keBefore - keAfter }
}

/** Simulated timeline: the bodies start apart so they meet at t = 1.5 s, then move apart for another 1.5 s. */
export const COLLISION_TIME = 1.5
export const COLLISION_DURATION = 3

/** Positions of the two bodies (their facing edges meet at x = 0 at the moment of impact), m. */
export function collisionPositions(p: CollisionParams, t: number): { x1: number; x2: number } {
  const s = solveCollision(p)
  const tc = Math.min(Math.max(t, 0), COLLISION_DURATION)
  if (!s.collides || tc <= COLLISION_TIME) {
    return { x1: p.u1 * (tc - COLLISION_TIME), x2: p.u2 * (tc - COLLISION_TIME) }
  }
  const after = tc - COLLISION_TIME
  return { x1: s.v1 * after, x2: s.v2 * after }
}
