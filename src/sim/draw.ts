import { COLLISION_DURATION } from '../physics/collision'
import { inclinePosition, solveIncline } from '../physics/incline'
import { projectilePosition, solveProjectile } from '../physics/projectile'
import { solvePulley } from '../physics/pulley'
import { solveSpring } from '../physics/spring'
import { drawCollision, drawPulley, drawSpring } from './drawMore'
import { fmt } from '../physics/solution'
import type { InclineSpec, ProjectileSpec, SupportedSpec } from '../physics/spec'

export interface Palette {
  bg: string
  grid: string
  axis: string
  ground: string
  path: string
  ghost: string
  text: string
  muted: string
  slope: string
  block: string
  gravity: string
  normal: string
  friction: string
  pill: string
  vx: string
  vy: string
}

export const DEFAULT_PALETTE: Palette = {
  bg: '#fbf8f0',
  grid: '#dce6ee',
  axis: '#7a8594',
  ground: '#2b3440',
  path: '#b84a33',
  ghost: '#a3adb8',
  text: '#1f2a37',
  muted: '#5e6573',
  slope: '#ebe2cd',
  block: '#3a6ea5',
  gravity: '#7a4e86',
  normal: '#3f7550',
  friction: '#b84a33',
  pill: '#1f2a37',
  vx: '#3a6ea5',
  vy: '#3f7550',
}

/** Canvas colours come from the --sim-* CSS variables so the simulation follows light and dark mode. */
export function readPalette(): Palette {
  if (typeof document === 'undefined') return DEFAULT_PALETTE
  const cs = getComputedStyle(document.documentElement)
  const out = { ...DEFAULT_PALETTE }
  for (const key of Object.keys(out) as (keyof Palette)[]) {
    const v = cs.getPropertyValue(`--sim-${key}`).trim()
    if (v) out[key] = v
  }
  return out
}

export const FONT = '500 13px "JetBrains Mono", ui-monospace, monospace'
export const SMALL_FONT = '500 11px "JetBrains Mono", ui-monospace, monospace'
export const LABEL_FONT = '700 14px "Atkinson Hyperlegible", system-ui, sans-serif'

export interface DrawOptions {
  /** simulation time, s */
  t: number
  finished: boolean
  /** show answer labels (hidden while the student is still predicting) */
  showMarkers: boolean
  /** previous parameters, drawn faintly for comparison */
  ghost?: SupportedSpec | null
  /** draw the horizontal and vertical velocity components (projectile only) */
  showComponents?: boolean
  palette?: Palette
  /** narrow screens: smaller readout split over two lines */
  compact?: boolean
}

/** Real-world duration of the motion, s. */
export function motionDuration(spec: SupportedSpec): number {
  switch (spec.type) {
    case 'projectile':
      return solveProjectile(spec).timeOfFlight
    case 'incline':
      return solveIncline(spec).duration
    case 'pulley':
      return solvePulley(spec).duration
    case 'collision':
      return COLLISION_DURATION
    case 'spring':
      return solveSpring(spec).duration
  }
}

/** Time between strobe dots: a round number giving roughly a dozen dots over the motion. */
export function strobeStep(duration: number): number {
  if (duration <= 0) return 0
  const target = duration / 12
  return [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20].find((c) => c >= target) ?? 50
}

export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, spec: SupportedSpec, o: DrawOptions) {
  const c = o.palette ?? DEFAULT_PALETTE
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, w, h)
  switch (spec.type) {
    case 'projectile':
      return drawProjectile(ctx, w, h, spec, o, c)
    case 'incline':
      return drawIncline(ctx, w, h, spec, o, c)
    case 'pulley':
      return drawPulley(ctx, w, h, spec, o, c)
    case 'collision':
      return drawCollision(ctx, w, h, spec, o, c)
    case 'spring':
      return drawSpring(ctx, w, h, spec, o, c)
  }
}

export function niceStep(span: number): number {
  const raw = span / 8
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label?: string, dashed = false) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 4) return
  const ang = Math.atan2(y2 - y1, x2 - x1)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.5
  if (dashed) ctx.setLineDash([5, 4])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 10 * Math.cos(ang - 0.4), y2 - 10 * Math.sin(ang - 0.4))
  ctx.lineTo(x2 - 10 * Math.cos(ang + 0.4), y2 - 10 * Math.sin(ang + 0.4))
  ctx.closePath()
  ctx.fill()
  if (label) {
    ctx.font = LABEL_FONT
    ctx.fillText(label, x2 + 6 * Math.cos(ang) + 4, y2 + 6 * Math.sin(ang) + 4)
  }
}

export function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = LABEL_FONT
  const tw = ctx.measureText(text).width
  const pw = tw + 16
  const px = Math.min(Math.max(x - pw / 2, 4), ctx.canvas.clientWidth - pw - 4)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(px, y - 13, pw, 26, 13)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText(text, px + 8, y + 5)
}

/** Live values at the top of the canvas; split over two lines on narrow screens. */
export function readout(ctx: CanvasRenderingContext2D, x: number, parts: string[], c: Palette, compact?: boolean) {
  ctx.fillStyle = c.muted
  if (compact) {
    ctx.font = SMALL_FONT
    ctx.fillText(parts.slice(0, 2).join('   '), x, 18)
    ctx.fillText(parts.slice(2).join('   '), x, 34)
  } else {
    ctx.font = FONT
    ctx.fillText(parts.join('   '), x, 22)
  }
}

function strobeDot(ctx: CanvasRenderingContext2D, x: number, y: number, c: Palette) {
  ctx.fillStyle = c.bg
  ctx.strokeStyle = c.path
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawProjectile(ctx: CanvasRenderingContext2D, w: number, h: number, spec: ProjectileSpec, o: DrawOptions, c: Palette) {
  const pad = { l: o.compact ? 44 : 64, r: o.compact ? 16 : 28, t: o.compact ? 52 : 40, b: 56 }
  const sol = solveProjectile(spec)
  const ghost = o.ghost?.type === 'projectile' ? o.ghost : null
  const gsol = ghost ? solveProjectile(ghost) : null
  const xMax = Math.max(sol.range, gsol?.range ?? 0, 1) * 1.08
  const yMax = Math.max(sol.maxHeight, gsol?.maxHeight ?? 0, 1) * 1.18
  const plotW = w - pad.l - pad.r
  const plotH = h - pad.t - pad.b
  // Equal scale on both axes so angles look true to life.
  const s = Math.min(plotW / xMax, plotH / yMax)
  const ox = pad.l
  const oy = h - pad.b
  const X = (x: number) => ox + x * s
  const Y = (y: number) => oy - y * s

  // Grid and axis labels
  const visX = plotW / s
  const visY = plotH / s
  const step = niceStep(Math.max(visX, visY))
  ctx.lineWidth = 1
  ctx.font = o.compact ? SMALL_FONT : FONT
  for (let gx = 0; gx <= visX + 1e-9; gx += step) {
    ctx.strokeStyle = c.grid
    ctx.beginPath()
    ctx.moveTo(X(gx), Y(0))
    ctx.lineTo(X(gx), Y(visY))
    ctx.stroke()
    ctx.fillStyle = c.axis
    ctx.fillText(fmt(gx), X(gx) - 6, oy + 18)
  }
  for (let gy = step; gy <= visY + 1e-9; gy += step) {
    ctx.strokeStyle = c.grid
    ctx.beginPath()
    ctx.moveTo(X(0), Y(gy))
    ctx.lineTo(X(visX), Y(gy))
    ctx.stroke()
    ctx.fillStyle = c.axis
    ctx.fillText(fmt(gy), ox - 22 - 7 * (fmt(gy).length - 1), Y(gy) + 4)
  }
  ctx.fillText('m', w - pad.r - 8, oy + 18)

  // Ground and launch tower
  ctx.strokeStyle = c.ground
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(ox - 40, oy)
  ctx.lineTo(w - pad.r + 10, oy)
  ctx.stroke()
  if (spec.height > 0) {
    ctx.fillStyle = c.slope
    ctx.strokeStyle = c.ground
    ctx.lineWidth = 2
    ctx.fillRect(X(0) - 16, Y(spec.height), 16, spec.height * s)
    ctx.strokeRect(X(0) - 16, Y(spec.height), 16, spec.height * s)
  }

  // Previous path for comparison
  if (ghost && gsol) {
    ctx.strokeStyle = c.ghost
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    for (let i = 0; i <= 120; i++) {
      const p = projectilePosition(ghost, (gsol.timeOfFlight * i) / 120)
      if (i === 0) ctx.moveTo(X(p.x), Y(p.y))
      else ctx.lineTo(X(p.x), Y(p.y))
    }
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Launch angle arc
  const theta = (spec.angleDeg * Math.PI) / 180
  if (spec.angleDeg > 0.5) {
    ctx.strokeStyle = c.muted
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(X(0), Y(spec.height), 34, -theta, 0)
    ctx.stroke()
    ctx.fillStyle = c.muted
    ctx.font = LABEL_FONT
    ctx.fillText(`${fmt(spec.angleDeg)}°`, X(0) + 40, Y(spec.height) - 8)
  }

  // Trail up to time t
  const t = Math.min(o.t, sol.timeOfFlight)
  const n = Math.max(2, Math.ceil((160 * t) / Math.max(sol.timeOfFlight, 1e-6)))
  ctx.strokeStyle = c.path
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const p = projectilePosition(spec, (t * i) / n)
    if (i === 0) ctx.moveTo(X(p.x), Y(p.y))
    else ctx.lineTo(X(p.x), Y(p.y))
  }
  ctx.stroke()

  // Strobe dots at equal time steps: spacing shows where the ball is fast or slow
  const dt = strobeStep(sol.timeOfFlight)
  for (let k = 1; dt > 0 && k * dt < t - 1e-9; k++) {
    const p = projectilePosition(spec, k * dt)
    strobeDot(ctx, X(p.x), Y(p.y), c)
  }

  // Ball and velocity arrows
  const pos = projectilePosition(spec, t)
  const vyNow = sol.vy - spec.g * t
  const bx = X(pos.x)
  const by = Y(Math.max(pos.y, 0))
  if (!o.finished) {
    const k = Math.min(3, 80 / Math.max(spec.speed, 1))
    if (o.showComponents) {
      arrow(ctx, bx, by, bx + sol.vx * k, by, c.vx, 'vx', true)
      arrow(ctx, bx, by, bx, by - vyNow * k, c.vy, 'vy', true)
    }
    arrow(ctx, bx, by, bx + sol.vx * k, by - vyNow * k, c.gravity, 'v')
  }
  ctx.fillStyle = c.path
  ctx.beginPath()
  ctx.arc(bx, by, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = c.bg
  ctx.lineWidth = 2
  ctx.stroke()

  const parts = [`t = ${fmt(t)} s`, `x = ${fmt(pos.x)} m`, `y = ${fmt(Math.max(pos.y, 0))} m`, `v = ${fmt(Math.hypot(sol.vx, vyNow))} m/s`]
  if (o.showComponents) parts.push(`vx = ${fmt(sol.vx)}`, `vy = ${fmt(vyNow)} m/s`)
  // On narrow screens the component values are already labelled on the arrows.
  readout(ctx, pad.l, o.compact ? parts.slice(0, 4) : parts, c, o.compact)

  if (o.finished && o.showMarkers) {
    // Range bracket under the ground
    const ry = oy + 36
    ctx.strokeStyle = c.path
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(X(0), ry - 6)
    ctx.lineTo(X(0), ry + 6)
    ctx.moveTo(X(0), ry)
    ctx.lineTo(X(sol.range), ry)
    ctx.moveTo(X(sol.range), ry - 6)
    ctx.lineTo(X(sol.range), ry + 6)
    ctx.stroke()
    pill(ctx, `R = ${fmt(sol.range)} m`, (X(0) + X(sol.range)) / 2, ry, c.path)
    // Peak height
    if (sol.vy > 0.01) {
      const px = sol.vx * sol.timeToPeak
      ctx.strokeStyle = c.muted
      ctx.setLineDash([4, 5])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(X(px), Y(0))
      ctx.lineTo(X(px), Y(sol.maxHeight))
      ctx.stroke()
      ctx.setLineDash([])
      pill(ctx, `H = ${fmt(sol.maxHeight)} m`, X(px), Y(sol.maxHeight) - 18, c.pill)
    }
  }
}

function drawIncline(ctx: CanvasRenderingContext2D, w: number, h: number, spec: InclineSpec, o: DrawOptions, c: Palette) {
  const pad = { l: o.compact ? 20 : 48, r: o.compact ? 20 : 48, t: o.compact ? 64 : 56, b: 48 }
  const sol = solveIncline(spec)
  const theta = (spec.angleDeg * Math.PI) / 180
  const run = spec.length * Math.cos(theta)
  const rise = spec.length * Math.sin(theta)
  const s = Math.min((w - pad.l - pad.r) / run, (h - pad.t - pad.b) / rise)
  const triW = run * s
  const triH = rise * s
  const x0 = (w - triW) / 2
  const yBase = h - pad.b
  const A = { x: x0, y: yBase - triH }
  const B = { x: x0 + triW, y: yBase }

  // Ground and slope
  ctx.strokeStyle = c.ground
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(8, yBase)
  ctx.lineTo(w - 8, yBase)
  ctx.stroke()
  ctx.fillStyle = c.slope
  ctx.beginPath()
  ctx.moveTo(A.x, A.y)
  ctx.lineTo(B.x, B.y)
  ctx.lineTo(x0, yBase)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = c.ground
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(A.x, A.y)
  ctx.lineTo(B.x, B.y)
  ctx.stroke()

  // Angle arc at the bottom of the slope
  ctx.strokeStyle = c.muted
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(B.x, B.y, 44, Math.PI + 0.001, Math.PI + theta)
  ctx.stroke()
  ctx.fillStyle = c.muted
  ctx.font = LABEL_FONT
  ctx.fillText(`${fmt(spec.angleDeg)}°`, B.x - 88, B.y - 10)
  ctx.font = o.compact ? SMALL_FONT : FONT
  ctx.fillText(`L = ${fmt(spec.length)} m`, (A.x + B.x) / 2 + 14 * Math.sin(theta) + 8, (A.y + B.y) / 2 - 14 * Math.cos(theta) - 8)

  // Block geometry along the slope
  const size = 40
  const slopePx = Math.hypot(triW, triH)
  const dir = { x: Math.cos(theta), y: Math.sin(theta) }
  const normal = { x: Math.sin(theta), y: -Math.cos(theta) }
  /** Point at distance d down the slope, raised `lift` px off the surface. */
  const pointAt = (d: number, lift: number) => {
    const along = size / 2 + (d / spec.length) * Math.max(slopePx - size, 0)
    return { x: A.x + dir.x * along + normal.x * lift, y: A.y + dir.y * along + normal.y * lift }
  }

  const t = Math.min(o.t, sol.duration)
  const d = inclinePosition(spec, t)

  // Strobe dots at equal time steps: the gaps grow as the block speeds up
  const dt = strobeStep(sol.duration)
  for (let k = 1; dt > 0 && k * dt < t - 1e-9; k++) {
    const p = pointAt(inclinePosition(spec, k * dt), 7)
    strobeDot(ctx, p.x, p.y, c)
  }

  const { x: cx, y: cy } = pointAt(d, size / 2)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(theta)
  ctx.fillStyle = c.block
  ctx.beginPath()
  ctx.roundRect(-size / 2, -size / 2, size, size, 5)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 11px "Atkinson Hyperlegible", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${fmt(spec.mass)} kg`, 0, 4)
  ctx.textAlign = 'start'
  ctx.restore()

  // Free-body arrows, scaled so the weight arrow fits below the block (shorter on narrow screens)
  const k = (o.compact ? 40 : 70) / (spec.mass * spec.g)
  arrow(ctx, cx, cy, cx, cy + spec.mass * spec.g * k, c.gravity, 'mg')
  arrow(ctx, cx, cy, cx + normal.x * sol.normal * k, cy + normal.y * sol.normal * k, c.normal, 'N')
  // At rest, static friction balances the slope component of gravity.
  const frictionShown = sol.stopDistance === 0 ? sol.gravityAlong : sol.friction
  if (frictionShown > 0.001) {
    arrow(ctx, cx, cy, cx - dir.x * frictionShown * k, cy - dir.y * frictionShown * k, c.friction, 'f')
  }

  const vNow = sol.stopDistance === 0 ? 0 : Math.max(spec.initialSpeed + sol.acceleration * t, 0)
  readout(ctx, o.compact ? 12 : pad.l, [`t = ${fmt(t)} s`, `d = ${fmt(d)} m`, `v = ${fmt(vNow)} m/s`, `a = ${fmt(sol.acceleration)} m/s²`], c, o.compact)

  if (o.finished && o.showMarkers) {
    if (sol.reachesBottom) pill(ctx, `v = ${fmt(sol.finalSpeed)} m/s at the bottom`, cx - 60, cy - 56, c.block)
    else if (sol.stopDistance === 0) pill(ctx, 'Friction holds it still', cx, cy - 44, c.pill)
    else pill(ctx, `Stops after ${fmt(sol.stopDistance ?? 0)} m`, cx, cy - 44, c.pill)
  }
}
