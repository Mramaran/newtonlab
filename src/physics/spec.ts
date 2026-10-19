import type { InclineParams } from './incline'
import type { ProjectileParams } from './projectile'

export type ProjectileUnknown = 'range' | 'timeOfFlight' | 'maxHeight' | 'impactSpeed'
export type InclineUnknown = 'finalSpeed' | 'timeToBottom' | 'acceleration'

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

export type ProblemSpec = ProjectileSpec | InclineSpec | UnsupportedSpec
export type SupportedSpec = ProjectileSpec | InclineSpec

export type ValidationResult = { ok: true; spec: ProblemSpec } | { ok: false; error: string }

const PROJECTILE_UNKNOWNS: ProjectileUnknown[] = ['range', 'timeOfFlight', 'maxHeight', 'impactSpeed']
const INCLINE_UNKNOWNS: InclineUnknown[] = ['finalSpeed', 'timeToBottom', 'acceleration']

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

  return { ok: false, error: `Unknown problem type: ${String(raw.type)}` }
}
