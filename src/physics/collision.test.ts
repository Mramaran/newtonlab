import { describe, expect, it } from 'vitest'
import { COLLISION_DURATION, COLLISION_TIME, collisionPositions, solveCollision } from './collision'

describe('solveCollision', () => {
  it('equal masses, elastic: the moving ball stops and the other takes its velocity', () => {
    const s = solveCollision({ m1: 1, u1: 2, m2: 1, u2: 0, e: 1 })
    expect(s.v1).toBeCloseTo(0, 9)
    expect(s.v2).toBeCloseTo(2, 9)
    expect(s.keLoss).toBeCloseTo(0, 9)
  })

  it('perfectly inelastic: 2 kg at 3 m/s hits 1 kg at rest, they move at 2 m/s and lose 3 J', () => {
    const s = solveCollision({ m1: 2, u1: 3, m2: 1, u2: 0, e: 0 })
    expect(s.v1).toBeCloseTo(2, 9)
    expect(s.v2).toBeCloseTo(2, 9)
    expect(s.keLoss).toBeCloseTo(3, 9)
  })

  it('elastic head-on: 2 kg at 5 m/s and 3 kg at −2 m/s conserve momentum and energy', () => {
    const s = solveCollision({ m1: 2, u1: 5, m2: 3, u2: -2, e: 1 })
    expect(s.v1).toBeCloseTo(-3.4, 9)
    expect(s.v2).toBeCloseTo(3.6, 9)
    expect(s.momentumAfter).toBeCloseTo(s.momentumBefore, 9)
    expect(s.keAfter).toBeCloseTo(s.keBefore, 9)
  })

  it('partly elastic (e = 0.5)', () => {
    // u1 = 4, u2 = 0, equal 1 kg masses: v1 = 1, v2 = 3
    const s = solveCollision({ m1: 1, u1: 4, m2: 1, u2: 0, e: 0.5 })
    expect(s.v1).toBeCloseTo(1, 9)
    expect(s.v2).toBeCloseTo(3, 9)
  })

  it('no collision when body 1 cannot catch body 2', () => {
    const s = solveCollision({ m1: 1, u1: 1, m2: 1, u2: 3, e: 1 })
    expect(s.collides).toBe(false)
    expect(s.v1).toBe(1)
  })
})

describe('collisionPositions', () => {
  it('the bodies meet at the collision time and separate afterwards', () => {
    const p = { m1: 1, u1: 2, m2: 1, u2: 0, e: 1 }
    const at = collisionPositions(p, COLLISION_TIME)
    expect(at.x1).toBeCloseTo(0, 9)
    expect(at.x2).toBeCloseTo(0, 9)
    const end = collisionPositions(p, COLLISION_DURATION)
    expect(end.x2).toBeGreaterThan(end.x1)
  })
})
