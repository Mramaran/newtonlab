import { describe, expect, it } from 'vitest'
import { optimalAngleDeg, projectilePosition, solveProjectile } from './projectile'

describe('solveProjectile', () => {
  it('matches the textbook answer for a ground launch (20 m/s at 35°)', () => {
    const s = solveProjectile({ speed: 20, angleDeg: 35, height: 0, g: 9.8 })
    expect(s.range).toBeCloseTo(38.36, 1)
    expect(s.timeOfFlight).toBeCloseTo(2.341, 2)
    expect(s.maxHeight).toBeCloseTo(6.71, 2)
  })

  it('gives maximum ground range at 45°', () => {
    const at45 = solveProjectile({ speed: 15, angleDeg: 45, height: 0, g: 9.8 }).range
    const at40 = solveProjectile({ speed: 15, angleDeg: 40, height: 0, g: 9.8 }).range
    const at50 = solveProjectile({ speed: 15, angleDeg: 50, height: 0, g: 9.8 }).range
    expect(at45).toBeGreaterThan(at40)
    expect(at45).toBeGreaterThan(at50)
    expect(at45).toBeCloseTo((15 * 15) / 9.8, 6)
  })

  it('handles a horizontal launch from a cliff (10 m/s from 45 m)', () => {
    const s = solveProjectile({ speed: 10, angleDeg: 0, height: 45, g: 10 })
    expect(s.timeOfFlight).toBeCloseTo(3, 6)
    expect(s.range).toBeCloseTo(30, 6)
    expect(s.maxHeight).toBeCloseTo(45, 6)
  })

  it('handles a launch from a height at an angle', () => {
    // 25 m/s at 30° from a 20 m tower, g = 9.8
    const s = solveProjectile({ speed: 25, angleDeg: 30, height: 20, g: 9.8 })
    expect(s.timeOfFlight).toBeCloseTo(3.665, 2)
    expect(s.range).toBeCloseTo(79.35, 1)
  })

  it('reports the landing speed', () => {
    const s = solveProjectile({ speed: 10, angleDeg: 0, height: 45, g: 10 })
    // vx = 10, vy = 30 at impact
    expect(s.impactSpeed).toBeCloseTo(Math.sqrt(1000), 6)
  })
})

describe('optimalAngleDeg', () => {
  it('is 45° from the ground', () => {
    expect(optimalAngleDeg(20, 0, 9.8)).toBeCloseTo(45, 6)
  })

  it('is below 45° from a height', () => {
    const best = optimalAngleDeg(20, 30, 9.8)
    expect(best).toBeLessThan(45)
    const rangeAt = (a: number) => solveProjectile({ speed: 20, angleDeg: a, height: 30, g: 9.8 }).range
    expect(rangeAt(best)).toBeGreaterThan(rangeAt(best - 2))
    expect(rangeAt(best)).toBeGreaterThan(rangeAt(best + 2))
  })
})

describe('projectilePosition', () => {
  it('starts at the launch point and lands at the range', () => {
    const p = { speed: 20, angleDeg: 35, height: 0, g: 9.8 }
    const s = solveProjectile(p)
    expect(projectilePosition(p, 0)).toEqual({ x: 0, y: 0 })
    const end = projectilePosition(p, s.timeOfFlight)
    expect(end.x).toBeCloseTo(s.range, 6)
    expect(end.y).toBeCloseTo(0, 6)
  })
})
