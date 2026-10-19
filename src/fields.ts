import type { InclineUnknown, ProjectileUnknown, SupportedSpec } from './physics/spec'

export interface FieldDef {
  key: string
  label: string
  symbol: string
  unit: string
  min: number
  max: number
  step: number
}

export const PROJECTILE_FIELDS: FieldDef[] = [
  { key: 'speed', label: 'Launch speed', symbol: 'v', unit: 'm/s', min: 0, max: 60, step: 0.5 },
  { key: 'angleDeg', label: 'Launch angle', symbol: 'θ', unit: '°', min: 0, max: 90, step: 1 },
  { key: 'height', label: 'Launch height', symbol: 'h', unit: 'm', min: 0, max: 100, step: 0.5 },
  { key: 'g', label: 'Gravity', symbol: 'g', unit: 'm/s²', min: 1, max: 25, step: 0.1 },
]

export const INCLINE_FIELDS: FieldDef[] = [
  { key: 'angleDeg', label: 'Slope angle', symbol: 'θ', unit: '°', min: 1, max: 89, step: 1 },
  { key: 'mu', label: 'Friction coefficient', symbol: 'μ', unit: '', min: 0, max: 1, step: 0.01 },
  { key: 'length', label: 'Slope length', symbol: 'L', unit: 'm', min: 0.5, max: 100, step: 0.5 },
  { key: 'initialSpeed', label: 'Starting speed', symbol: 'v₀', unit: 'm/s', min: 0, max: 30, step: 0.5 },
  { key: 'mass', label: 'Mass', symbol: 'm', unit: 'kg', min: 0.1, max: 100, step: 0.1 },
  { key: 'g', label: 'Gravity', symbol: 'g', unit: 'm/s²', min: 1, max: 25, step: 0.1 },
]

export const PROJECTILE_UNKNOWN_OPTIONS: { value: ProjectileUnknown; label: string }[] = [
  { value: 'range', label: 'How far it lands (range)' },
  { value: 'timeOfFlight', label: 'Time in the air' },
  { value: 'maxHeight', label: 'Maximum height' },
  { value: 'impactSpeed', label: 'Landing speed' },
]

export const INCLINE_UNKNOWN_OPTIONS: { value: InclineUnknown; label: string }[] = [
  { value: 'finalSpeed', label: 'Speed at the bottom' },
  { value: 'timeToBottom', label: 'Time to reach the bottom' },
  { value: 'acceleration', label: 'Acceleration' },
]

export const fieldsFor = (spec: SupportedSpec) => (spec.type === 'projectile' ? PROJECTILE_FIELDS : INCLINE_FIELDS)
