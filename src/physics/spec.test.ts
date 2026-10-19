import { describe, expect, it } from 'vitest'
import { validateSpec } from './spec'

describe('validateSpec', () => {
  it('accepts a projectile and fills defaults', () => {
    const r = validateSpec({ type: 'projectile', speed: 20, angleDeg: 35 })
    expect(r).toEqual({
      ok: true,
      spec: { type: 'projectile', speed: 20, angleDeg: 35, height: 0, g: 9.8, unknown: 'range' },
    })
  })

  it('coerces numeric strings from the parser', () => {
    const r = validateSpec({ type: 'projectile', speed: '15', angleDeg: '40', height: '2', unknown: 'maxHeight' })
    expect(r.ok && r.spec.type === 'projectile' && r.spec.speed).toBe(15)
    expect(r.ok && r.spec.type === 'projectile' && r.spec.unknown).toBe('maxHeight')
  })

  it('accepts an incline and fills defaults', () => {
    const r = validateSpec({ type: 'incline', angleDeg: 30, length: 10 })
    expect(r).toEqual({
      ok: true,
      spec: { type: 'incline', angleDeg: 30, mu: 0, length: 10, mass: 1, initialSpeed: 0, g: 9.8, unknown: 'finalSpeed' },
    })
  })

  it('passes unsupported problems through with a reason', () => {
    const r = validateSpec({ type: 'unsupported', reason: 'Pulley systems are not supported yet.' })
    expect(r).toEqual({ ok: true, spec: { type: 'unsupported', reason: 'Pulley systems are not supported yet.' } })
  })

  it('accepts the new problem types and fills defaults', () => {
    expect(validateSpec({ type: 'pulley', m1: 3, m2: 5 })).toEqual({
      ok: true,
      spec: { type: 'pulley', setup: 'atwood', m1: 3, m2: 5, mu: 0, distance: 1, g: 9.8, unknown: 'acceleration' },
    })
    // A bullet: 10 g at 400 m/s into a 2 kg block
    expect(validateSpec({ type: 'collision', m1: 0.01, u1: 400, m2: 2, e: 0, unknown: 'v2' })).toEqual({
      ok: true,
      spec: { type: 'collision', m1: 0.01, u1: 400, m2: 2, u2: 0, e: 0, unknown: 'v2' },
    })
    expect(validateSpec({ type: 'spring', m: 2, k: 800 })).toEqual({ ok: true, spec: { type: 'spring', m: 2, k: 800, A: 0.1, unknown: 'period' } })
    expect(validateSpec({ type: 'collision', m1: 1, u1: 2, m2: 1, e: 1.5 }).ok).toBe(false)
  })

  it('rejects missing or out-of-range values', () => {
    expect(validateSpec({ type: 'projectile', angleDeg: 30 }).ok).toBe(false)
    expect(validateSpec({ type: 'projectile', speed: 20, angleDeg: 120 }).ok).toBe(false)
    expect(validateSpec({ type: 'incline', angleDeg: 30, length: 10, mu: -1 }).ok).toBe(false)
    expect(validateSpec({ type: 'spring' }).ok).toBe(false)
    expect(validateSpec(null).ok).toBe(false)
  })
})
