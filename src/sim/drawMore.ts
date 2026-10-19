// Canvas drawings for the pulley, collision and spring problems. Shares helpers with draw.ts.
import { COLLISION_DURATION, COLLISION_TIME, collisionPositions, solveCollision } from '../physics/collision'
import { pulleyPosition, solvePulley } from '../physics/pulley'
import { fmt } from '../physics/solution'
import type { CollisionSpec, PulleySpec, SpringSpec } from '../physics/spec'
import { solveSpring, springState } from '../physics/spring'
import { arrow, pill, readout, SMALL_FONT, type DrawOptions, type Palette } from './draw'

/** Box size grows gently with mass so heavier bodies look heavier. */
const boxSize = (m: number, heaviest: number) => 34 + 30 * Math.sqrt(m / heaviest)

function box(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string, label: string) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, 6)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '700 12px "Atkinson Hyperlegible", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, x + size / 2, y + size / 2 + 4)
  ctx.textAlign = 'start'
}

function wheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, turn: number, c: Palette) {
  ctx.fillStyle = c.slope
  ctx.strokeStyle = c.ground
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // Spokes rotate with the string so the wheel visibly turns
  ctx.lineWidth = 1.5
  for (let i = 0; i < 3; i++) {
    const a = turn + (i * Math.PI) / 3
    ctx.beginPath()
    ctx.moveTo(cx - Math.cos(a) * (r - 4), cy - Math.sin(a) * (r - 4))
    ctx.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4))
    ctx.stroke()
  }
  ctx.fillStyle = c.ground
  ctx.beginPath()
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
  ctx.fill()
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 2) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

export function drawPulley(ctx: CanvasRenderingContext2D, w: number, h: number, spec: PulleySpec, o: DrawOptions, c: Palette) {
  const sol = solvePulley(spec)
  const t = Math.min(o.t, sol.duration)
  const d = pulleyPosition(spec, t)
  const travel = Math.min(h * 0.28, 130)
  const heaviest = Math.max(spec.m1, spec.m2)
  const s1 = boxSize(spec.m1, heaviest)
  const s2 = boxSize(spec.m2, heaviest)
  const k = 60 / (heaviest * spec.g)
  const v = sol.acceleration * t

  if (spec.setup === 'atwood') {
    // Wheel wide enough that the two hanging boxes never overlap
    const r = Math.max(30, (s1 + s2) / 4 + 8)
    const cx = w / 2
    const ceilingY = 50
    const cy = ceilingY + 40
    // Ceiling and hanger, below the readout text
    ctx.fillStyle = c.slope
    ctx.fillRect(cx - 90, ceilingY - 12, 180, 12)
    line(ctx, cx - 90, ceilingY, cx + 90, ceilingY, c.ground, 2.5)
    line(ctx, cx, ceilingY, cx, cy, c.ground, 2.5)
    // Travel fits the canvas: the rising mass stays below the wheel, the falling one above the bottom edge
    const sMax = Math.max(s1, s2)
    const travelA = Math.min(Math.max((h - cy - r - 150) / 2, 18), 110)
    const dpxA = spec.distance > 0 ? (d / spec.distance) * travelA : 0
    // m2 moves down when direction = +1, m1 moves down when direction = -1
    const down2 = sol.direction >= 0 ? dpxA : -dpxA
    const restY = cy + r + 16 + travelA + sMax / 2
    const y1 = restY - down2 - s1 / 2
    const y2 = restY + down2 - s2 / 2
    line(ctx, cx - r, cy, cx - r, y1, c.ground)
    line(ctx, cx + r, cy, cx + r, y2, c.ground)
    wheel(ctx, cx, cy, r, d / 0.3, c)
    box(ctx, cx - r - s1 / 2, y1, s1, c.block, `${fmt(spec.m1)} kg`)
    box(ctx, cx + r - s2 / 2, y2, s2, c.gravity, `${fmt(spec.m2)} kg`)
    // Forces on each mass: tension up, weight down
    // Tension arrows sit on the outer side of each box so they don't cross between the two masses
    for (const [x, y, s, m, side] of [
      [cx - r, y1, s1, spec.m1, -1],
      [cx + r, y2, s2, spec.m2, 1],
    ] as const) {
      arrow(ctx, x, y + s + 2, x, y + s + 2 + m * spec.g * k, c.friction, 'mg')
      const ax = x + side * (s / 2 + 12)
      arrow(ctx, ax, y + s / 2, ax, y + s / 2 - sol.tension * k, c.normal, 'T')
    }
  } else {
    // Block on a table, string over a corner pulley to a hanging mass
    const tableY = h * 0.42
    const tableRight = w * 0.64
    const r = 18
    const pcx = tableRight + r
    const pcy = tableY - r
    ctx.fillStyle = c.slope
    ctx.fillRect(28, tableY, tableRight - 28, 14)
    line(ctx, 28, tableY, tableRight, tableY, c.ground, 2.5)
    line(ctx, 50, tableY + 14, 50, h - 20, c.ground, 3)
    line(ctx, tableRight - 22, tableY + 14, tableRight - 22, h - 20, c.ground, 3)
    line(ctx, tableRight, tableY, pcx, pcy, c.ground, 2.5)
    // The hanging mass (and its weight arrow) must stay above the bottom edge at the end of the motion
    const travelT = Math.min(Math.max(h - pcy - 44 - s2 - 70, 20), travel)
    const dpxT = spec.distance > 0 ? (d / spec.distance) * travelT : 0
    const startX = Math.max(40, tableRight - 60 - s1 - travelT * 1.3)
    const bx = startX + dpxT
    const by = tableY - s1
    const hy = pcy + 44 + dpxT
    // String: block → top of the wheel → down to the hanging mass
    line(ctx, bx + s1, tableY - s1 / 2, pcx, pcy - r, c.ground)
    line(ctx, pcx + r, pcy, pcx + r, hy, c.ground)
    wheel(ctx, pcx, pcy, r, d / 0.18, c)
    box(ctx, bx, by, s1, c.block, `${fmt(spec.m1)} kg`)
    box(ctx, pcx + r - s2 / 2, hy, s2, c.gravity, `${fmt(spec.m2)} kg`)
    // Forces: tension pulls the block right, friction resists; weight and tension on the hanging mass
    arrow(ctx, bx + s1 + 4, by + s1 * 0.25, bx + s1 + 4 + sol.tension * k, by + s1 * 0.25, c.normal, 'T')
    if (sol.friction > 0.001) arrow(ctx, bx - 4, tableY - 6, bx - 4 - sol.friction * k, tableY - 6, c.friction, 'f')
    const hx = pcx + r + s2 / 2 + 12
    arrow(ctx, hx, hy + s2 / 2, hx, hy + s2 / 2 + spec.m2 * spec.g * k, c.friction, 'mg')
    arrow(ctx, hx, hy + s2 / 2, hx, hy + s2 / 2 - sol.tension * k, c.normal, 'T')
  }

  readout(ctx, o.compact ? 12 : 24, [`t = ${fmt(t)} s`, `d = ${fmt(d)} m`, `v = ${fmt(v)} m/s`, `a = ${fmt(sol.acceleration)} m/s²`], c, o.compact)
  if (o.finished && o.showMarkers) {
    // Top right on wide screens keeps the label clear of the falling mass's weight arrow
    pill(ctx, `a = ${fmt(sol.acceleration)} m/s²   T = ${fmt(sol.tension)} N`, o.compact ? w / 2 : w - 150, o.compact ? h - 22 : 24, c.pill)
  }
}

export function drawCollision(ctx: CanvasRenderingContext2D, w: number, h: number, spec: CollisionSpec, o: DrawOptions, c: Palette) {
  const sol = solveCollision(spec)
  const t = Math.min(o.t, COLLISION_DURATION)
  const { x1, x2 } = collisionPositions(spec, t)
  const heaviest = Math.max(spec.m1, spec.m2)
  const s1 = boxSize(spec.m1, heaviest)
  const s2 = boxSize(spec.m2, heaviest)
  const trackY = h * 0.62
  const cx = w / 2
  // Scale so the furthest either body travels in 1.5 s still fits on screen
  const reach = Math.max(Math.abs(spec.u1), Math.abs(spec.u2), Math.abs(sol.v1), Math.abs(sol.v2), 0.5) * COLLISION_TIME
  const s = (w / 2 - Math.max(s1, s2) - 24) / reach

  line(ctx, 16, trackY, w - 16, trackY, c.ground, 3)
  ctx.strokeStyle = c.grid
  ctx.lineWidth = 1
  for (let x = cx % 40; x < w; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, trackY + 4)
    ctx.lineTo(x, trackY + 10)
    ctx.stroke()
  }

  const b1x = cx + x1 * s - s1
  const b2x = cx + x2 * s
  box(ctx, b1x, trackY - s1, s1, c.block, `${fmt(spec.m1)} kg`)
  box(ctx, b2x, trackY - s2, s2, c.gravity, `${fmt(spec.m2)} kg`)

  // Impact flash
  if (sol.collides && Math.abs(t - COLLISION_TIME) < 0.12) {
    ctx.strokeStyle = c.path
    ctx.lineWidth = 2
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(a) * 10, trackY - 40 + Math.sin(a) * 10)
      ctx.lineTo(cx + Math.cos(a) * 22, trackY - 40 + Math.sin(a) * 22)
      ctx.stroke()
    }
  }

  // Velocity arrows above each body
  const after = sol.collides && t > COLLISION_TIME
  const vel1 = after ? sol.v1 : spec.u1
  const vel2 = after ? sol.v2 : spec.u2
  const vk = 14
  const a1y = trackY - s1 - 22
  const a2y = trackY - s2 - 22
  arrow(ctx, b1x + s1 / 2, a1y, b1x + s1 / 2 + vel1 * vk, a1y, c.vx)
  arrow(ctx, b2x + s2 / 2, a2y, b2x + s2 / 2 + vel2 * vk, a2y, c.vy)
  ctx.font = SMALL_FONT
  ctx.fillStyle = c.muted
  ctx.textAlign = 'center'
  ctx.fillText(`${after ? 'v₁' : 'u₁'} = ${fmt(vel1)} m/s`, b1x + s1 / 2, a1y - 12)
  ctx.fillText(`${after ? 'v₂' : 'u₂'} = ${fmt(vel2)} m/s`, b2x + s2 / 2, a2y - 12)
  ctx.textAlign = 'start'

  const p = after ? sol.momentumAfter : sol.momentumBefore
  const ke = after ? sol.keAfter : sol.keBefore
  readout(ctx, o.compact ? 12 : 24, [`t = ${fmt(t)} s`, `p = ${fmt(p)} kg·m/s`, `KE = ${fmt(ke)} J`, after ? 'after' : 'before'], c, o.compact)

  if (o.finished && o.showMarkers) {
    pill(
      ctx,
      sol.collides ? `Momentum ${fmt(sol.momentumBefore)} → ${fmt(sol.momentumAfter)}   KE lost ${fmt(sol.keLoss)} J` : 'They never collide',
      w / 2,
      h - 22,
      c.pill,
    )
  }
}

export function drawSpring(ctx: CanvasRenderingContext2D, w: number, h: number, spec: SpringSpec, o: DrawOptions, c: Palette) {
  const sol = solveSpring(spec)
  const t = Math.min(o.t, sol.duration)
  const st = springState(spec, t)
  const floorY = h * 0.62
  const wallX = 36
  const size = 58
  const eqX = w * 0.5
  const ampPx = Math.min(w * 0.2, 150)
  const bx = eqX + (st.x / spec.A) * ampPx - size / 2

  // Floor and wall
  line(ctx, 16, floorY, w - 16, floorY, c.ground, 3)
  ctx.fillStyle = c.slope
  ctx.fillRect(wallX - 14, floorY - 110, 14, 110)
  line(ctx, wallX, floorY - 110, wallX, floorY, c.ground, 2.5)

  // Equilibrium and ±A markers
  ctx.setLineDash([4, 5])
  for (const [x, label] of [
    [eqX, 'x = 0'],
    [eqX - ampPx, '−A'],
    [eqX + ampPx, '+A'],
  ] as const) {
    line(ctx, x, floorY - 96, x, floorY + 8, c.ghost, 1.5)
    ctx.fillStyle = c.muted
    ctx.font = SMALL_FONT
    ctx.textAlign = 'center'
    ctx.fillText(label, x, floorY + 24)
  }
  ctx.setLineDash([])
  ctx.textAlign = 'start'

  // Zig-zag spring from the wall to the block
  const springY = floorY - size / 2
  const coils = 12
  const start = wallX
  const end = bx
  ctx.strokeStyle = c.ground
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(start, springY)
  const lead = 12
  ctx.lineTo(start + lead, springY)
  const span = end - start - lead * 2
  for (let i = 0; i < coils; i++) {
    const x = start + lead + ((i + 0.5) / coils) * span
    ctx.lineTo(x, springY + (i % 2 === 0 ? -12 : 12))
  }
  ctx.lineTo(end - lead, springY)
  ctx.lineTo(end, springY)
  ctx.stroke()

  box(ctx, bx, floorY - size, size, c.block, `${fmt(spec.m)} kg`)
  if (!o.finished && Math.abs(st.v) > 1e-3) {
    const vk = Math.min(60 / Math.max(sol.maxSpeed, 1e-6), 60)
    arrow(ctx, bx + size / 2, floorY - size - 16, bx + size / 2 + st.v * vk, floorY - size - 16, c.vx, 'v')
  }

  // Energy bars: kinetic and potential always add up to the same total
  const barX = o.compact ? 16 : w - 220
  const barY = o.compact ? h - 52 : 52
  const barW = o.compact ? w - 32 : 196
  const total = sol.energy || 1
  ctx.font = SMALL_FONT
  for (const [i, label, value, color] of [
    [0, 'KE', st.ke, c.path],
    [1, 'PE', st.pe, c.block],
  ] as const) {
    const y = barY + i * 20
    ctx.fillStyle = c.grid
    ctx.fillRect(barX + 28, y, barW - 28, 10)
    ctx.fillStyle = color
    ctx.fillRect(barX + 28, y, (barW - 28) * Math.min(value / total, 1), 10)
    ctx.fillStyle = c.muted
    ctx.fillText(label, barX, y + 9)
  }

  readout(ctx, o.compact ? 12 : 24, [`t = ${fmt(t)} s`, `x = ${fmt(st.x)} m`, `v = ${fmt(st.v)} m/s`, `T = ${fmt(sol.period)} s`], c, o.compact)
  if (o.finished && o.showMarkers) {
    pill(ctx, `T = ${fmt(sol.period)} s   v max = ${fmt(sol.maxSpeed)} m/s`, w / 2, o.compact ? h - 80 : h - 22, c.pill)
  }
}
