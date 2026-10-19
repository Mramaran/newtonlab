import { describe, expect, it } from 'vitest'
import { pulleyPosition, solvePulley } from './pulley'

const atwood = { setup: 'atwood' as const, mu: 0, distance: 1 }
const table = { setup: 'table' as const, distance: 1 }

describe('solvePulley: Atwood machine', () => {
  it('3 kg and 5 kg: a = 2.45 m/s², T = 36.75 N', () => {
    const s = solvePulley({ ...atwood, m1: 3, m2: 5, g: 9.8 })
    expect(s.acceleration).toBeCloseTo(2.45, 6)
    expect(s.tension).toBeCloseTo(36.75, 6)
    expect(s.direction).toBe(1)
  })

  it('the heavier side goes down', () => {
    expect(solvePulley({ ...atwood, m1: 6, m2: 2, g: 10 }).direction).toBe(-1)
  })

  it('equal masses balance', () => {
    const s = solvePulley({ ...atwood, m1: 4, m2: 4, g: 9.8 })
    expect(s.acceleration).toBe(0)
    expect(s.tension).toBeCloseTo(4 * 9.8, 6)
    expect(s.time).toBeNull()
  })

  it('time and speed over a distance from rest', () => {
    // a = 2 m/s² (g = 10, 2 kg vs 3 kg); 4 m → t = 2 s, v = 4 m/s
    const s = solvePulley({ ...atwood, m1: 2, m2: 3, g: 10, distance: 4 })
    expect(s.time).toBeCloseTo(2, 6)
    expect(s.speed).toBeCloseTo(4, 6)
  })
})

describe('solvePulley: block on a table', () => {
  it('4 kg on the table, 2 kg hanging, μ = 0.2, g = 10: a = 2 m/s², T = 16 N', () => {
    const s = solvePulley({ ...table, m1: 4, m2: 2, mu: 0.2, g: 10 })
    expect(s.acceleration).toBeCloseTo(2, 6)
    expect(s.tension).toBeCloseTo(16, 6)
    expect(s.friction).toBeCloseTo(8, 6)
  })

  it('frictionless table: a = m2 g / (m1 + m2)', () => {
    expect(solvePulley({ ...table, m1: 3, m2: 1, mu: 0, g: 9.8 }).acceleration).toBeCloseTo(2.45, 6)
  })

  it('stays still when friction beats the hanging weight', () => {
    const s = solvePulley({ ...table, m1: 10, m2: 1, mu: 0.3, g: 9.8 })
    expect(s.acceleration).toBe(0)
    expect(s.tension).toBeCloseTo(9.8, 6)
    expect(s.duration).toBe(0)
  })
})

describe('pulleyPosition', () => {
  it('reaches the full distance at the end of the motion', () => {
    const p = { ...atwood, m1: 3, m2: 5, g: 9.8, distance: 2 }
    const s = solvePulley(p)
    expect(pulleyPosition(p, 0)).toBe(0)
    expect(pulleyPosition(p, s.duration)).toBeCloseTo(2, 6)
    expect(pulleyPosition(p, s.duration + 3)).toBeCloseTo(2, 6)
  })
})
