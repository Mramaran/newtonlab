import { describe, expect, it } from 'vitest'
import { inclinePosition, solveIncline } from './incline'

describe('solveIncline', () => {
  it('frictionless 30° slope, 10 m long, from rest', () => {
    const s = solveIncline({ angleDeg: 30, mu: 0, length: 10, mass: 2, initialSpeed: 0, g: 9.8 })
    expect(s.acceleration).toBeCloseTo(4.9, 6)
    expect(s.reachesBottom).toBe(true)
    expect(s.timeToBottom).toBeCloseTo(2.0203, 3)
    expect(s.finalSpeed).toBeCloseTo(Math.sqrt(98), 6)
  })

  it('30° slope with μ = 0.2', () => {
    const s = solveIncline({ angleDeg: 30, mu: 0.2, length: 10, mass: 2, initialSpeed: 0, g: 9.8 })
    expect(s.acceleration).toBeCloseTo(3.2026, 3)
    expect(s.finalSpeed).toBeCloseTo(8.003, 2)
  })

  it('reports forces on the block', () => {
    const s = solveIncline({ angleDeg: 30, mu: 0.2, length: 10, mass: 2, initialSpeed: 0, g: 10 })
    expect(s.gravityAlong).toBeCloseTo(10, 6) // m g sin30
    expect(s.normal).toBeCloseTo(20 * Math.cos(Math.PI / 6), 6)
    expect(s.friction).toBeCloseTo(0.2 * s.normal, 6)
  })

  it('stays at rest when friction beats gravity (tan θ ≤ μ)', () => {
    const s = solveIncline({ angleDeg: 10, mu: 0.5, length: 5, mass: 1, initialSpeed: 0, g: 9.8 })
    expect(s.reachesBottom).toBe(false)
    expect(s.stopDistance).toBe(0)
    expect(s.acceleration).toBe(0)
  })

  it('a pushed block decelerates and stops partway when friction wins', () => {
    // a = 9.8(sin10° − 0.5 cos10°) ≈ −3.124 m/s²; stops after v²/2|a|
    const s = solveIncline({ angleDeg: 10, mu: 0.5, length: 20, mass: 1, initialSpeed: 4, g: 9.8 })
    expect(s.acceleration).toBeCloseTo(-3.1239, 3)
    expect(s.reachesBottom).toBe(false)
    expect(s.stopDistance).toBeCloseTo(16 / (2 * 3.1239), 2)
  })
})

describe('inclinePosition', () => {
  it('moves from 0 to the full length by the time it reaches the bottom', () => {
    const p = { angleDeg: 30, mu: 0, length: 10, mass: 2, initialSpeed: 0, g: 9.8 }
    const s = solveIncline(p)
    expect(inclinePosition(p, 0)).toBe(0)
    expect(inclinePosition(p, s.duration)).toBeCloseTo(10, 6)
    expect(inclinePosition(p, s.duration + 5)).toBeCloseTo(10, 6)
  })
})
