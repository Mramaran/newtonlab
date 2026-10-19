export interface ProjectileParams {
  /** launch speed, m/s */
  speed: number
  /** launch angle above horizontal, degrees */
  angleDeg: number
  /** launch height above the landing ground, m */
  height: number
  /** gravitational acceleration, m/s² */
  g: number
}

export interface ProjectileSolution {
  vx: number
  vy: number
  timeOfFlight: number
  range: number
  maxHeight: number
  timeToPeak: number
  impactSpeed: number
}

const toRad = (deg: number) => (deg * Math.PI) / 180

export function solveProjectile(p: ProjectileParams): ProjectileSolution {
  const theta = toRad(p.angleDeg)
  const vx = p.speed * Math.cos(theta)
  const vy = p.speed * Math.sin(theta)
  // Positive root of h + vy·t − ½gt² = 0
  const timeOfFlight = (vy + Math.sqrt(vy * vy + 2 * p.g * p.height)) / p.g
  const timeToPeak = Math.max(vy, 0) / p.g
  const maxHeight = p.height + (Math.max(vy, 0) ** 2) / (2 * p.g)
  const vyImpact = vy - p.g * timeOfFlight
  return {
    vx,
    vy,
    timeOfFlight,
    range: vx * timeOfFlight,
    maxHeight,
    timeToPeak,
    impactSpeed: Math.hypot(vx, vyImpact),
  }
}

export function projectilePosition(p: ProjectileParams, t: number) {
  const theta = toRad(p.angleDeg)
  return {
    x: p.speed * Math.cos(theta) * t,
    y: p.height + p.speed * Math.sin(theta) * t - 0.5 * p.g * t * t,
  }
}

/** Angle that maximises range for a launch from height h (45° when h = 0). */
export function optimalAngleDeg(speed: number, height: number, g: number): number {
  const rad = Math.atan(speed / Math.sqrt(speed * speed + 2 * g * height))
  return (rad * 180) / Math.PI
}
