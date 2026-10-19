import { useEffect, useRef, useState } from 'react'
import type { SupportedSpec } from '../physics/spec'
import { drawScene, motionDuration } from '../sim/draw'

interface Props {
  spec: SupportedSpec
  ghost?: SupportedSpec | null
  /** change to replay the animation */
  playId: number
  /** draw the final frame immediately (used while dragging sliders) */
  instant: boolean
  showMarkers: boolean
  /** hold the first frame (while the student is predicting) */
  paused?: boolean
  onFinished?: () => void
}

export function SimCanvas({ spec, ghost, playId, instant, showMarkers, paused, onFinished }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const finishedRef = useRef(onFinished)
  const [width, setWidth] = useState(800)

  useEffect(() => {
    finishedRef.current = onFinished
  }, [onFinished])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const w = width
    const h = Math.round(Math.min(Math.max(w * 0.56, 300), 520))
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const duration = motionDuration(spec)
    if (paused) {
      drawScene(ctx, w, h, spec, { t: 0, finished: false, showMarkers: false, ghost: null })
      return
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (instant || duration <= 0 || reducedMotion) {
      drawScene(ctx, w, h, spec, { t: duration, finished: true, showMarkers, ghost })
      finishedRef.current?.()
      return
    }

    // Play real motion in 1.5–4 s of screen time.
    const screenSeconds = Math.min(Math.max(duration, 1.5), 4)
    const start = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const progress = Math.min((now - start) / 1000 / screenSeconds, 1)
      const done = progress >= 1
      drawScene(ctx, w, h, spec, { t: progress * duration, finished: done, showMarkers, ghost })
      if (done) finishedRef.current?.()
      else raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [spec, ghost, playId, instant, showMarkers, paused, width])

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label={`Simulation of the ${spec.type === 'projectile' ? 'projectile' : 'inclined plane'} problem`} />
    </div>
  )
}
