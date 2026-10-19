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

  it('rejects missing or out-of-range values', () => {
    expect(validateSpec({ type: 'projectile', angleDeg: 30 }).ok).toBe(false)
    expect(validateSpec({ type: 'projectile', speed: 20, angleDeg: 120 }).ok).toBe(false)
    expect(validateSpec({ type: 'incline', angleDeg: 30, length: 10, mu: -1 }).ok).toBe(false)
    expect(validateSpec({ type: 'spring' }).ok).toBe(false)
    expect(validateSpec(null).ok).toBe(false)
  })
})
