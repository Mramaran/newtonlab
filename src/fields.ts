import type { SupportedSpec } from './physics/spec'

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

const PULLEY_FIELDS_ATWOOD: FieldDef[] = [
  { key: 'm1', label: 'Left mass', symbol: 'm₁', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
  { key: 'm2', label: 'Right mass', symbol: 'm₂', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
  { key: 'distance', label: 'Distance moved', symbol: 's', unit: 'm', min: 0.1, max: 20, step: 0.1 },
  { key: 'g', label: 'Gravity', symbol: 'g', unit: 'm/s²', min: 1, max: 25, step: 0.1 },
]

const PULLEY_FIELDS_TABLE: FieldDef[] = [
  { key: 'm1', label: 'Mass on the table', symbol: 'm₁', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
  { key: 'm2', label: 'Hanging mass', symbol: 'm₂', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
  { key: 'mu', label: 'Friction coefficient', symbol: 'μ', unit: '', min: 0, max: 1, step: 0.01 },
  { key: 'distance', label: 'Distance moved', symbol: 's', unit: 'm', min: 0.1, max: 20, step: 0.1 },
  { key: 'g', label: 'Gravity', symbol: 'g', unit: 'm/s²', min: 1, max: 25, step: 0.1 },
]

const COLLISION_FIELDS: FieldDef[] = [
  { key: 'm1', label: 'Mass of body 1', symbol: 'm₁', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
  { key: 'u1', label: 'Velocity of body 1', symbol: 'u₁', unit: 'm/s', min: -20, max: 20, step: 0.5 },
  { key: 'm2', label: 'Mass of body 2', symbol: 'm₂', unit: 'kg', min: 0.1, max: 50, step: 0.1 },
  { key: 'u2', label: 'Velocity of body 2', symbol: 'u₂', unit: 'm/s', min: -20, max: 20, step: 0.5 },
  { key: 'e', label: 'Bounciness (restitution)', symbol: 'e', unit: '', min: 0, max: 1, step: 0.05 },
]

const SPRING_FIELDS: FieldDef[] = [
  { key: 'm', label: 'Mass', symbol: 'm', unit: 'kg', min: 0.05, max: 20, step: 0.05 },
  { key: 'k', label: 'Spring constant', symbol: 'k', unit: 'N/m', min: 1, max: 1000, step: 1 },
  { key: 'A', label: 'Amplitude', symbol: 'A', unit: 'm', min: 0.01, max: 1, step: 0.01 },
]

export function fieldsFor(spec: SupportedSpec): FieldDef[] {
  switch (spec.type) {
    case 'projectile':
      return PROJECTILE_FIELDS
    case 'incline':
      return INCLINE_FIELDS
    case 'pulley':
      return spec.setup === 'table' ? PULLEY_FIELDS_TABLE : PULLEY_FIELDS_ATWOOD
    case 'collision':
      return COLLISION_FIELDS
    case 'spring':
      return SPRING_FIELDS
  }
}

/** "Find" options per problem type. */
export const UNKNOWN_OPTIONS: Record<SupportedSpec['type'], { value: string; label: string }[]> = {
  projectile: [
    { value: 'range', label: 'How far it lands (range)' },
    { value: 'timeOfFlight', label: 'Time in the air' },
    { value: 'maxHeight', label: 'Maximum height' },
    { value: 'impactSpeed', label: 'Landing speed' },
  ],
  incline: [
    { value: 'finalSpeed', label: 'Speed at the bottom' },
    { value: 'timeToBottom', label: 'Time to reach the bottom' },
    { value: 'acceleration', label: 'Acceleration' },
  ],
  pulley: [
    { value: 'acceleration', label: 'Acceleration' },
    { value: 'tension', label: 'Tension in the string' },
    { value: 'time', label: 'Time to move the distance' },
    { value: 'speed', label: 'Speed after the distance' },
  ],
  collision: [
    { value: 'v2', label: 'Velocity of body 2 after' },
    { value: 'v1', label: 'Velocity of body 1 after' },
    { value: 'keLoss', label: 'Kinetic energy lost' },
  ],
  spring: [
    { value: 'period', label: 'Time period' },
    { value: 'frequency', label: 'Frequency' },
    { value: 'maxSpeed', label: 'Maximum speed' },
    { value: 'maxAcceleration', label: 'Maximum acceleration' },
    { value: 'energy', label: 'Total energy' },
  ],
}

export const TYPE_NAMES: Record<SupportedSpec['type'], string> = {
  projectile: 'Projectile motion',
  incline: 'Inclined plane',
  pulley: 'Pulley',
  collision: 'Collision',
  spring: 'Spring (SHM)',
}
