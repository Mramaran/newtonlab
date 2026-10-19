import { useCallback, useEffect, useRef, useState } from 'react'
import { fmt } from '../physics/solution'
import type { SupportedSpec } from '../physics/spec'
import { drawScene, motionDuration, readPalette, strobeStep } from '../sim/draw'

interface Props {
  spec: SupportedSpec
  ghost?: SupportedSpec | null
  /** change to restart the animation from t = 0 */
  playId: number
  /** jump straight to the final frame (used while dragging sliders) */
  instant: boolean
  showMarkers: boolean
  /** hold the first frame (while the student is predicting) */
  paused?: boolean
  onFinished?: () => void
}

const RATES = [1, 0.5, 0.25]

/** Each restart gets a new run id, so a stale "t = end" from the previous run can't end the new one early. */
interface Clock {
  run: number
  t: number
}

export function SimCanvas({ spec, ghost, playId, instant, showMarkers, paused, onFinished }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const finishedRef = useRef(onFinished)
  const runRef = useRef(0)
  const reportedRun = useRef(-1)
  const [width, setWidth] = useState(800)
  const [clock, setClock] = useState<Clock>({ run: 0, t: 0 })
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [showComponents, setShowComponents] = useState(false)
  const [palette, setPalette] = useState(readPalette)
  const duration = motionDuration(spec)

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
    // Re-read the CSS colours whenever the theme toggle (or the system setting) changes data-theme.
    const mo = new MutationObserver(() => setPalette(readPalette()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])

  const startRun = useCallback((t: number, play: boolean) => {
    runRef.current += 1
    setClock({ run: runRef.current, t })
    setPlaying(play)
  }, [])

  // Restart whenever the parent asks for a new run or the problem changes.
  useEffect(() => {
    if (paused) return startRun(0, false)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (instant || reducedMotion) return startRun(duration, false)
    startRun(0, true)
  }, [playId, paused, instant, spec, duration, startRun])

  // Animation clock: real motion plays in 1.5–4 s of screen time, scaled by the chosen speed.
  useEffect(() => {
    if (!playing) return
    const screenSeconds = Math.min(Math.max(duration, 1.5), 4)
    const simPerSecond = (duration / screenSeconds) * rate
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setClock((c) => ({ ...c, t: Math.min(c.t + dt * simPerSecond, duration) }))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, rate, duration])

  // Stop at the end of the motion and tell the parent once per run.
  useEffect(() => {
    if (paused || clock.run !== runRef.current || clock.t < duration) return
    setPlaying(false)
    if (reportedRun.current !== clock.run) {
      reportedRun.current = clock.run
      finishedRef.current?.()
    }
  }, [clock, duration, paused])

  const t = paused ? 0 : clock.t

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const w = width
    const h = Math.round(Math.min(Math.max(w * 0.56, 300), 520))
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawScene(ctx, w, h, spec, {
      t,
      finished: !paused && t >= duration,
      showMarkers: showMarkers && !paused,
      ghost: paused ? null : ghost,
      showComponents,
      palette,
      compact: w < 560,
    })
  }, [t, spec, ghost, showMarkers, paused, width, showComponents, palette, duration])

  const atEnd = t >= duration
  const togglePlay = () => {
    if (atEnd) startRun(0, true)
    else setPlaying((p) => !p)
  }
  const step = strobeStep(duration)

  return (
    <div className="sim">
      <div className="canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} role="img" aria-label={`Simulation of the ${spec.type === 'projectile' ? 'projectile' : 'inclined plane'} problem at t = ${fmt(t)} s`} />
      </div>
      <div className="sim-controls">
        <button className="btn icon" onClick={togglePlay} disabled={paused || duration <= 0} aria-label={playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}>
          {playing ? '❚❚' : atEnd ? '↻' : '▶'}
        </button>
        <input
          className="scrub"
          type="range"
          min={0}
          max={duration || 1}
          step={duration > 0 ? duration / 500 : 0.01}
          value={t}
          disabled={paused || duration <= 0}
          aria-label="Time"
          onChange={(e) => {
            setPlaying(false)
            setClock((c) => ({ ...c, t: Number(e.target.value) }))
          }}
        />
        <span className="time">
          {fmt(t)} / {fmt(duration)} s
        </span>
        <div className="rates" role="group" aria-label="Playback speed">
          {RATES.map((r) => (
            <button key={r} className={rate === r ? 'on' : ''} aria-pressed={rate === r} onClick={() => setRate(r)}>
              {r}×
            </button>
          ))}
        </div>
        {spec.type === 'projectile' && (
          <label className="toggle small">
            <input
              type="checkbox"
              checked={showComponents}
              aria-label="Show the horizontal and vertical velocity components"
              onChange={(e) => setShowComponents(e.target.checked)}
            />
            {/* One span, so the label's flex gap doesn't split the subscripts apart */}
            <span>
              Show v<sub>x</sub>, v<sub>y</sub>
            </span>
          </label>
        )}
      </div>
      {step > 0 && (spec.type === 'projectile' || spec.type === 'incline') && (
        <p className="sim-caption">
          Dots every {fmt(step)} s{spec.type === 'projectile' ? ': closer together where the ball is slower' : ': further apart as the block speeds up'}.
        </p>
      )}
    </div>
  )
}
