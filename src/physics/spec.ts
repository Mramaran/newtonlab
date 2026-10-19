import type { CollisionParams } from './collision'
import type { InclineParams } from './incline'
import type { ProjectileParams } from './projectile'
import type { PulleyParams, PulleySetup } from './pulley'
import type { SpringParams } from './spring'

export type ProjectileUnknown = 'range' | 'timeOfFlight' | 'maxHeight' | 'impactSpeed'
export type InclineUnknown = 'finalSpeed' | 'timeToBottom' | 'acceleration'
export type PulleyUnknown = 'acceleration' | 'tension' | 'time' | 'speed'
export type CollisionUnknown = 'v1' | 'v2' | 'keLoss'
export type SpringUnknown = 'period' | 'frequency' | 'maxSpeed' | 'maxAcceleration' | 'energy'

export interface PulleySpec extends PulleyParams {
  type: 'pulley'
  unknown: PulleyUnknown
}

export interface CollisionSpec extends CollisionParams {
  type: 'collision'
  unknown: CollisionUnknown
}

export interface SpringSpec extends SpringParams {
  type: 'spring'
  unknown: SpringUnknown
}

export interface ProjectileSpec extends ProjectileParams {
  type: 'projectile'
  unknown: ProjectileUnknown
}

export interface InclineSpec extends InclineParams {
  type: 'incline'
  unknown: InclineUnknown
}

export interface UnsupportedSpec {
  type: 'unsupported'
  reason: string
}

export type SupportedSpec = ProjectileSpec | InclineSpec | PulleySpec | CollisionSpec | SpringSpec
export type ProblemSpec = SupportedSpec | UnsupportedSpec

export type ValidationResult = { ok: true; spec: ProblemSpec } | { ok: false; error: string }

const PROJECTILE_UNKNOWNS: ProjectileUnknown[] = ['range', 'timeOfFlight', 'maxHeight', 'impactSpeed']
const INCLINE_UNKNOWNS: InclineUnknown[] = ['finalSpeed', 'timeToBottom', 'acceleration']
const PULLEY_UNKNOWNS: PulleyUnknown[] = ['acceleration', 'tension', 'time', 'speed']
const COLLISION_UNKNOWNS: CollisionUnknown[] = ['v1', 'v2', 'keLoss']
const SPRING_UNKNOWNS: SpringUnknown[] = ['period', 'frequency', 'maxSpeed', 'maxAcceleration', 'energy']

const pick = <T extends string>(value: unknown, allowed: T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

/** Limits keep slider ranges sane and catch values the parser got badly wrong. */
export const LIMITS = {
  speed: [0, 200],
  angleDeg: [0, 90],
  height: [0, 500],
  g: [1, 30],
  inclineAngleDeg: [1, 89],
  mu: [0, 1.5],
  length: [0.1, 500],
  mass: [0.01, 1000],
  initialSpeed: [0, 100],
  distance: [0.01, 100],
  // Wide enough for bullet problems (hundreds of m/s)
  velocity: [-1000, 1000],
  restitution: [0, 1],
  springK: [0.1, 100000],
  amplitude: [0.001, 10],
} as const

type Raw = Record<string, unknown>

function num(raw: Raw, key: string, fallback?: number): number | undefined {
  const v = raw[key]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return fallback
}

function inRange(name: string, v: number, [lo, hi]: readonly [number, number]): string | null {
  return v < lo || v > hi ? `${name} must be between ${lo} and ${hi} (got ${v})` : null
}

export function validateSpec(input: unknown): ValidationResult {
  if (typeof input !== 'object' || input === null) return { ok: false, error: 'Expected an object' }
  const raw = input as Raw

  if (raw.type === 'unsupported') {
    const reason = typeof raw.reason === 'string' && raw.reason ? raw.reason : 'This kind of problem is not supported yet.'
    return { ok: true, spec: { type: 'unsupported', reason } }
  }

  const g = num(raw, 'g', 9.8)!

  if (raw.type === 'projectile') {
    const speed = num(raw, 'speed')
    const angleDeg = num(raw, 'angleDeg')
    const height = num(raw, 'height', 0)!
    if (speed === undefined) return { ok: false, error: 'Missing launch speed' }
    if (angleDeg === undefined) return { ok: false, error: 'Missing launch angle' }
    const err =
      inRange('Speed', speed, LIMITS.speed) ??
      inRange('Angle', angleDeg, LIMITS.angleDeg) ??
      inRange('Height', height, LIMITS.height) ??
      inRange('g', g, LIMITS.g)
    if (err) return { ok: false, error: err }
    const unknown = PROJECTILE_UNKNOWNS.includes(raw.unknown as ProjectileUnknown)
      ? (raw.unknown as ProjectileUnknown)
      : 'range'
    return { ok: true, spec: { type: 'projectile', speed, angleDeg, height, g, unknown } }
  }

  if (raw.type === 'incline') {
    const angleDeg = num(raw, 'angleDeg')
    const mu = num(raw, 'mu', 0)!
    const length = num(raw, 'length')
    const mass = num(raw, 'mass', 1)!
    const initialSpeed = num(raw, 'initialSpeed', 0)!
    if (angleDeg === undefined) return { ok: false, error: 'Missing slope angle' }
    if (length === undefined) return { ok: false, error: 'Missing slope length' }
    const err =
      inRange('Slope angle', angleDeg, LIMITS.inclineAngleDeg) ??
      inRange('Friction', mu, LIMITS.mu) ??
      inRange('Length', length, LIMITS.length) ??
      inRange('Mass', mass, LIMITS.mass) ??
      inRange('Initial speed', initialSpeed, LIMITS.initialSpeed) ??
      inRange('g', g, LIMITS.g)
    if (err) return { ok: false, error: err }
    const unknown = INCLINE_UNKNOWNS.includes(raw.unknown as InclineUnknown)
      ? (raw.unknown as InclineUnknown)
      : 'finalSpeed'
    return { ok: true, spec: { type: 'incline', angleDeg, mu, length, mass, initialSpeed, g, unknown } }
  }

  if (raw.type === 'pulley') {
    const setup: PulleySetup = raw.setup === 'table' ? 'table' : 'atwood'
    const m1 = num(raw, 'm1')
    const m2 = num(raw, 'm2')
    const mu = setup === 'table' ? num(raw, 'mu', 0)! : 0
    const distance = num(raw, 'distance', 1)!
    if (m1 === undefined || m2 === undefined) return { ok: false, error: 'Missing one of the two masses' }
    const err =
      inRange('Mass 1', m1, LIMITS.mass) ??
      inRange('Mass 2', m2, LIMITS.mass) ??
      inRange('Friction', mu, LIMITS.mu) ??
      inRange('Distance', distance, LIMITS.distance) ??
      inRange('g', g, LIMITS.g)
    if (err) return { ok: false, error: err }
    return { ok: true, spec: { type: 'pulley', setup, m1, m2, mu, distance, g, unknown: pick(raw.unknown, PULLEY_UNKNOWNS, 'acceleration') } }
  }

  if (raw.type === 'collision') {
    const m1 = num(raw, 'm1')
    const m2 = num(raw, 'm2')
    const u1 = num(raw, 'u1')
    const u2 = num(raw, 'u2', 0)!
    const e = num(raw, 'e', 1)!
    if (m1 === undefined || m2 === undefined) return { ok: false, error: 'Missing one of the two masses' }
    if (u1 === undefined) return { ok: false, error: 'Missing the first body’s speed' }
    const err =
      inRange('Mass 1', m1, LIMITS.mass) ??
      inRange('Mass 2', m2, LIMITS.mass) ??
      inRange('Velocity 1', u1, LIMITS.velocity) ??
      inRange('Velocity 2', u2, LIMITS.velocity) ??
      inRange('Coefficient of restitution', e, LIMITS.restitution)
    if (err) return { ok: false, error: err }
    return { ok: true, spec: { type: 'collision', m1, u1, m2, u2, e, unknown: pick(raw.unknown, COLLISION_UNKNOWNS, 'v2') } }
  }

  if (raw.type === 'spring') {
    const m = num(raw, 'm')
    const k = num(raw, 'k')
    const A = num(raw, 'A', 0.1)!
    if (m === undefined) return { ok: false, error: 'Missing the mass' }
    if (k === undefined) return { ok: false, error: 'Missing the spring constant' }
    const err = inRange('Mass', m, LIMITS.mass) ?? inRange('Spring constant', k, LIMITS.springK) ?? inRange('Amplitude', A, LIMITS.amplitude)
    if (err) return { ok: false, error: err }
    return { ok: true, spec: { type: 'spring', m, k, A, unknown: pick(raw.unknown, SPRING_UNKNOWNS, 'period') } }
  }

  return { ok: false, error: `Unknown problem type: ${String(raw.type)}` }
}
