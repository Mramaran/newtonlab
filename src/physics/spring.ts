export interface SpringParams {
  /** mass on the spring, kg */
  m: number
  /** spring constant, N/m */
  k: number
  /** amplitude: the largest stretch from equilibrium, m */
  A: number
}

export interface SpringSolution {
  /** angular frequency, rad/s */
  omega: number
  period: number
  frequency: number
  maxSpeed: number
  maxAcceleration: number
  /** total mechanical energy, J */
  energy: number
  /** two full oscillations, s */
  duration: number
}

export function solveSpring(p: SpringParams): SpringSolution {
  const omega = Math.sqrt(p.k / p.m)
  const period = (2 * Math.PI) / omega
  return {
    omega,
    period,
    frequency: 1 / period,
    maxSpeed: p.A * omega,
    maxAcceleration: p.A * omega * omega,
    energy: 0.5 * p.k * p.A * p.A,
    duration: 2 * period,
  }
}

/** Displacement from equilibrium at time t, released from x = +A at rest: x = A cos(ωt), m. */
export function springState(p: SpringParams, t: number) {
  const { omega } = solveSpring(p)
  const x = p.A * Math.cos(omega * t)
  const v = -p.A * omega * Math.sin(omega * t)
  return { x, v, ke: 0.5 * p.m * v * v, pe: 0.5 * p.k * x * x }
}
