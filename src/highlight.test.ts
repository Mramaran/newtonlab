import { describe, expect, it } from 'vitest'
import { highlightProblem } from './highlight'

const fieldsOf = (segments: ReturnType<typeof highlightProblem>) =>
  segments.filter((s) => s.field).map((s) => `${s.text.trim()}→${s.field}`)

describe('highlightProblem', () => {
  it('maps each number to its parameter by unit', () => {
    const text = 'A ball is thrown at 15 m/s at 40° from a 10 m high balcony.'
    const segs = highlightProblem(text, { type: 'projectile', speed: 15, angleDeg: 40, height: 10, g: 9.8, unknown: 'range' })
    expect(fieldsOf(segs)).toEqual(['15 m/s→speed', '40°→angleDeg', '10 m→height'])
    expect(segs.map((s) => s.text).join('')).toBe(text)
  })

  it('converts km/h before matching', () => {
    const segs = highlightProblem('A car leaves a 20 m cliff at 72 km/h.', {
      type: 'projectile',
      speed: 20,
      angleDeg: 0,
      height: 20,
      g: 9.8,
      unknown: 'range',
    })
    expect(fieldsOf(segs)).toEqual(['20 m→height', '72 km/h→speed'])
  })

  it('matches g, friction and mass on a slope', () => {
    const segs = highlightProblem('A 5 kg box slides down a 37° incline 8 m long with μ = 0.25. Take g = 10 m/s².', {
      type: 'incline',
      angleDeg: 37,
      mu: 0.25,
      length: 8,
      mass: 5,
      initialSpeed: 0,
      g: 10,
      unknown: 'acceleration',
    })
    expect(fieldsOf(segs)).toEqual(['5 kg→mass', '37°→angleDeg', '8 m→length', '0.25→mu', '10 m/s²→g'])
  })

  it('leaves numbers it cannot match as plain text', () => {
    const segs = highlightProblem('The top of the 30° ramp is 3 m high.', {
      type: 'incline',
      angleDeg: 30,
      mu: 0,
      length: 6,
      mass: 1,
      initialSpeed: 0,
      g: 9.8,
      unknown: 'finalSpeed',
    })
    expect(fieldsOf(segs)).toEqual(['30°→angleDeg'])
  })
})
