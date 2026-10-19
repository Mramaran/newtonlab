import { inclinePosition, solveIncline } from '../physics/incline'
import { projectilePosition, solveProjectile } from '../physics/projectile'
import { fmt } from '../physics/solution'
import type { InclineSpec, ProjectileSpec, SupportedSpec } from '../physics/spec'

export const COLORS = {
  bg: '#fbfaf5',
  grid: '#ebe6d8',
  axis: '#8b8574',
  ground: '#33312c',
  path: '#e4572e',
  ghost: '#9aa5b1',
  text: '#2a2925',
  muted: '#6f6a5c',
  slope: '#e9e1cc',
  block: '#2e86ab',
  gravity: '#6c5ce7',
  normal: '#0f9d6e',
  friction: '#e4572e',
}

const FONT = '500 13px "JetBrains Mono", ui-monospace, monospace'
const LABEL_FONT = '600 14px "Inter", system-ui, sans-serif'

export interface DrawOptions {
  /** simulation time, s */
  t: number
  finished: boolean
  /** show answer labels (hidden while the student is still predicting) */
  showMarkers: boolean
  /** previous parameters, drawn faintly for comparison */
  ghost?: SupportedSpec | null
}

/** Real-world duration of the motion, s. */
export function motionDuration(spec: SupportedSpec): number {
  return spec.type === 'projectile' ? solveProjectile(spec).timeOfFlight : solveIncline(spec).duration
}

export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, spec: SupportedSpec, o: DrawOptions) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, w, h)
  if (spec.type === 'projectile') drawProjectile(ctx, w, h, spec, o)
  else drawIncline(ctx, w, h, spec, o)
}

function niceStep(span: number): number {
  const raw = span / 8
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label?: string) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 4) return
  const ang = Math.atan2(y2 - y1, x2 - x1)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
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

function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
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

function readout(ctx: CanvasRenderingContext2D, x: number, y: number, parts: string[]) {
  ctx.font = FONT
  ctx.fillStyle = COLORS.muted
  ctx.fillText(parts.join('   '), x, y)
}

function drawProjectile(ctx: CanvasRenderingContext2D, w: number, h: number, spec: ProjectileSpec, o: DrawOptions) {
  const pad = { l: 64, r: 28, t: 40, b: 56 }
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
  ctx.font = FONT
  for (let gx = 0; gx <= visX + 1e-9; gx += step) {
    ctx.strokeStyle = COLORS.grid
    ctx.beginPath()
    ctx.moveTo(X(gx), Y(0))
    ctx.lineTo(X(gx), Y(visY))
    ctx.stroke()
    ctx.fillStyle = COLORS.axis
    ctx.fillText(fmt(gx), X(gx) - 6, oy + 18)
  }
  for (let gy = step; gy <= visY + 1e-9; gy += step) {
    ctx.strokeStyle = COLORS.grid
    ctx.beginPath()
    ctx.moveTo(X(0), Y(gy))
    ctx.lineTo(X(visX), Y(gy))
    ctx.stroke()
    ctx.fillStyle = COLORS.axis
    ctx.fillText(fmt(gy), ox - 22 - 7 * (fmt(gy).length - 1), Y(gy) + 4)
  }
  ctx.fillText('m', w - pad.r - 8, oy + 18)

  // Ground and launch tower
  ctx.strokeStyle = COLORS.ground
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(ox - 40, oy)
  ctx.lineTo(w - pad.r + 10, oy)
  ctx.stroke()
  if (spec.height > 0) {
    ctx.fillStyle = COLORS.slope
    ctx.strokeStyle = COLORS.ground
    ctx.lineWidth = 2
    ctx.fillRect(X(0) - 16, Y(spec.height), 16, spec.height * s)
    ctx.strokeRect(X(0) - 16, Y(spec.height), 16, spec.height * s)
  }

  // Previous path for comparison
  if (ghost && gsol) {
    ctx.strokeStyle = COLORS.ghost
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
    ctx.strokeStyle = COLORS.muted
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(X(0), Y(spec.height), 34, -theta, 0)
    ctx.stroke()
    ctx.fillStyle = COLORS.muted
    ctx.font = LABEL_FONT
    ctx.fillText(`${fmt(spec.angleDeg)}°`, X(0) + 40, Y(spec.height) - 8)
  }

  // Trail up to time t
  const t = Math.min(o.t, sol.timeOfFlight)
  const n = Math.max(2, Math.ceil((160 * t) / Math.max(sol.timeOfFlight, 1e-6)))
  ctx.strokeStyle = COLORS.path
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const p = projectilePosition(spec, (t * i) / n)
    if (i === 0) ctx.moveTo(X(p.x), Y(p.y))
    else ctx.lineTo(X(p.x), Y(p.y))
  }
  ctx.stroke()

  // Ball and velocity arrow
  const pos = projectilePosition(spec, t)
  const vyNow = sol.vy - spec.g * t
  if (!o.finished) {
    const k = Math.min(3, 80 / Math.max(spec.speed, 1))
    arrow(ctx, X(pos.x), Y(pos.y), X(pos.x) + sol.vx * k, Y(pos.y) - vyNow * k, COLORS.gravity, 'v')
  }
  ctx.fillStyle = COLORS.path
  ctx.beginPath()
  ctx.arc(X(pos.x), Y(Math.max(pos.y, 0)), 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.stroke()

  readout(ctx, pad.l, 22, [`t = ${fmt(t)} s`, `x = ${fmt(pos.x)} m`, `y = ${fmt(Math.max(pos.y, 0))} m`, `v = ${fmt(Math.hypot(sol.vx, vyNow))} m/s`])

  if (o.finished && o.showMarkers) {
    // Range bracket under the ground
    const by = oy + 36
    ctx.strokeStyle = COLORS.path
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(X(0), by - 6)
    ctx.lineTo(X(0), by + 6)
    ctx.moveTo(X(0), by)
    ctx.lineTo(X(sol.range), by)
    ctx.moveTo(X(sol.range), by - 6)
    ctx.lineTo(X(sol.range), by + 6)
    ctx.stroke()
    pill(ctx, `R = ${fmt(sol.range)} m`, (X(0) + X(sol.range)) / 2, by, COLORS.path)
    // Peak height
    if (sol.vy > 0.01) {
      const px = sol.vx * sol.timeToPeak
      ctx.strokeStyle = COLORS.muted
      ctx.setLineDash([4, 5])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(X(px), Y(0))
      ctx.lineTo(X(px), Y(sol.maxHeight))
      ctx.stroke()
      ctx.setLineDash([])
      pill(ctx, `H = ${fmt(sol.maxHeight)} m`, X(px), Y(sol.maxHeight) - 18, COLORS.text)
    }
  }
}

function drawIncline(ctx: CanvasRenderingContext2D, w: number, h: number, spec: InclineSpec, o: DrawOptions) {
  const pad = { l: 48, r: 48, t: 56, b: 48 }
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
  ctx.strokeStyle = COLORS.ground
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(16, yBase)
  ctx.lineTo(w - 16, yBase)
  ctx.stroke()
  ctx.fillStyle = COLORS.slope
  ctx.beginPath()
  ctx.moveTo(A.x, A.y)
  ctx.lineTo(B.x, B.y)
  ctx.lineTo(x0, yBase)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = COLORS.ground
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(A.x, A.y)
  ctx.lineTo(B.x, B.y)
  ctx.stroke()

  // Angle arc at the bottom of the slope
  ctx.strokeStyle = COLORS.muted
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(B.x, B.y, 44, Math.PI + 0.001, Math.PI + theta)
  ctx.stroke()
  ctx.fillStyle = COLORS.muted
  ctx.font = LABEL_FONT
  ctx.fillText(`${fmt(spec.angleDeg)}°`, B.x - 88, B.y - 10)
  ctx.font = FONT
  ctx.fillText(`L = ${fmt(spec.length)} m`, (A.x + B.x) / 2 + 14 * Math.sin(theta) + 8, (A.y + B.y) / 2 - 14 * Math.cos(theta) - 8)

  // Block position along the slope
  const t = Math.min(o.t, sol.duration)
  const d = inclinePosition(spec, t)
  const size = 40
  const slopePx = Math.hypot(triW, triH)
  const along = size / 2 + (d / spec.length) * Math.max(slopePx - size, 0)
  const dir = { x: Math.cos(theta), y: Math.sin(theta) }
  const normal = { x: Math.sin(theta), y: -Math.cos(theta) }
  const cx = A.x + dir.x * along + (normal.x * size) / 2
  const cy = A.y + dir.y * along + (normal.y * size) / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(theta)
  ctx.fillStyle = COLORS.block
  ctx.beginPath()
  ctx.roundRect(-size / 2, -size / 2, size, size, 5)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '600 11px "Inter", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${fmt(spec.mass)} kg`, 0, 4)
  ctx.textAlign = 'start'
  ctx.restore()

  // Free-body arrows, scaled so the weight is 70 px long
  const k = 70 / (spec.mass * spec.g)
  arrow(ctx, cx, cy, cx, cy + spec.mass * spec.g * k, COLORS.gravity, 'mg')
  arrow(ctx, cx, cy, cx + normal.x * sol.normal * k, cy + normal.y * sol.normal * k, COLORS.normal, 'N')
  // At rest, static friction balances the slope component of gravity.
  const frictionShown = sol.stopDistance === 0 ? sol.gravityAlong : sol.friction
  if (frictionShown > 0.001) {
    arrow(ctx, cx, cy, cx - dir.x * frictionShown * k, cy - dir.y * frictionShown * k, COLORS.friction, 'f')
  }

  const vNow = sol.stopDistance === 0 ? 0 : Math.max(spec.initialSpeed + sol.acceleration * t, 0)
  readout(ctx, pad.l, 26, [`t = ${fmt(t)} s`, `d = ${fmt(d)} m`, `v = ${fmt(vNow)} m/s`, `a = ${fmt(sol.acceleration)} m/s²`])

  if (o.finished && o.showMarkers) {
    if (sol.reachesBottom) pill(ctx, `v = ${fmt(sol.finalSpeed)} m/s at the bottom`, B.x - 80, B.y + 26, COLORS.block)
    else if (sol.stopDistance === 0) pill(ctx, 'Friction holds it still', cx, cy - 44, COLORS.text)
    else pill(ctx, `Stops after ${fmt(sol.stopDistance ?? 0)} m`, cx, cy - 44, COLORS.text)
  }
}
