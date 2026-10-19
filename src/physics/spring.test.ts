import { describe, expect, it } from 'vitest'
import { solveSpring, springState } from './spring'

describe('solveSpring', () => {
  it('0.5 kg on a 50 N/m spring, amplitude 0.1 m', () => {
    const s = solveSpring({ m: 0.5, k: 50, A: 0.1 })
    expect(s.omega).toBeCloseTo(10, 9)
    expect(s.period).toBeCloseTo(0.6283, 4)
    expect(s.frequency).toBeCloseTo(1.5915, 4)
    expect(s.maxSpeed).toBeCloseTo(1, 9)
    expect(s.maxAcceleration).toBeCloseTo(10, 9)
    expect(s.energy).toBeCloseTo(0.25, 9)
  })

  it('period does not depend on amplitude', () => {
    expect(solveSpring({ m: 2, k: 200, A: 0.05 }).period).toBeCloseTo(solveSpring({ m: 2, k: 200, A: 0.3 }).period, 12)
  })
})

describe('springState', () => {
  it('starts at +A at rest, passes equilibrium at max speed a quarter-period later', () => {
    const p = { m: 0.5, k: 50, A: 0.1 }
    const s = solveSpring(p)
    expect(springState(p, 0).x).toBeCloseTo(0.1, 9)
    const quarter = springState(p, s.period / 4)
    expect(quarter.x).toBeCloseTo(0, 9)
    expect(Math.abs(quarter.v)).toBeCloseTo(s.maxSpeed, 9)
  })

  it('kinetic plus potential energy stays constant', () => {
    const p = { m: 1, k: 40, A: 0.2 }
    const total = solveSpring(p).energy
    for (const t of [0.1, 0.37, 0.8, 1.3]) {
      const st = springState(p, t)
      expect(st.ke + st.pe).toBeCloseTo(total, 9)
    }
  })
})
