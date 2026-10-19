import { useCallback, useState, type CSSProperties } from 'react'
import { ParamsPanel } from './components/ParamsPanel'
import { PredictPanel } from './components/PredictPanel'
import { SimCanvas } from './components/SimCanvas'
import { SolutionPanel } from './components/SolutionPanel'
import { ThemeToggle } from './components/ThemeToggle'
import { EXAMPLES, type Example } from './examples'
import { fieldsFor } from './fields'
import { FIELD_COLORS, highlightProblem } from './highlight'
import { answerFor } from './physics/solution'
import { validateSpec, type ProblemSpec, type SupportedSpec } from './physics/spec'

type Phase = 'predict' | 'playing' | 'revealed'

export default function App() {
  const [text, setText] = useState('')
  const [predictMode, setPredictMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unsupported, setUnsupported] = useState<string | null>(null)

  const [problemText, setProblemText] = useState('')
  const [example, setExample] = useState<Example | null>(null)
  const [spec, setSpec] = useState<SupportedSpec | null>(null)
  const [original, setOriginal] = useState<SupportedSpec | null>(null)
  const [phase, setPhase] = useState<Phase>('predict')
  const [guess, setGuess] = useState<number | null>(null)
  const [playId, setPlayId] = useState(0)
  const [instant, setInstant] = useState(false)

  const load = (parsed: ProblemSpec, source: string, ex: Example | null) => {
    setError(null)
    if (parsed.type === 'unsupported') {
      setUnsupported(parsed.reason)
      return
    }
    setUnsupported(null)
    setProblemText(source)
    setExample(ex)
    setSpec(parsed)
    setOriginal(parsed)
    setGuess(null)
    setInstant(false)
    setPhase(predictMode ? 'predict' : 'playing')
    setPlayId((p) => p + 1)
  }

  const simulate = async (input: string) => {
    const cached = EXAMPLES.find((e) => e.text.trim() === input.trim())
    if (cached) return load(cached.spec, cached.text, cached)
    setLoading(true)
    setError(null)
    setUnsupported(null)
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      })
      const data = (await res.json().catch(() => ({}))) as { spec?: unknown; error?: string }
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
      const v = validateSpec(data.spec)
      if (!v.ok) throw new Error(`I couldn't read that problem: ${v.error}. Try rewording it, or pick an example.`)
      load(v.spec, input, null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const onFinished = useCallback(() => {
    setPhase((p) => (p === 'playing' ? 'revealed' : p))
    // Redraw the last frame with answer markers instead of replaying the motion.
    setInstant(true)
  }, [])

  const updateSpec = (next: SupportedSpec) => {
    if (phase === 'predict') {
      // Corrections to "what I understood" become the new baseline.
      setSpec(next)
      setOriginal(next)
      return
    }
    setSpec(next)
    setInstant(true)
  }

  const replay = () => {
    setInstant(false)
    setPlayId((p) => p + 1)
  }

  const reset = () => {
    setSpec(null)
    setOriginal(null)
    setExample(null)
    setGuess(null)
  }

  if (!spec) {
    return (
      <div className="page">
        <Header />
        <main className="home">
          <span className="eyebrow">For Class 11–12 mechanics · projectiles, slopes, pulleys, collisions, springs</span>
          <h1>
            Turn any physics problem into a <em>simulation you can <span className="scribble">play with.</span></em>
          </h1>
          <p className="lede">
            Paste a mechanics question from your textbook: a projectile, a slope, a pulley, a collision or a spring. NewtonLab reads it,
            builds the exact scenario, and shows the physics working step by step.
          </p>
          <form
            className="ask"
            onSubmit={(e) => {
              e.preventDefault()
              if (text.trim()) void simulate(text)
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. A ball is thrown at 15 m/s at 40° above the horizontal from a 10 m high balcony. How far from the building does it land?"
              rows={4}
              aria-label="Physics problem"
            />
            <div className="ask-row">
              <label className="toggle">
                <input type="checkbox" checked={predictMode} onChange={(e) => setPredictMode(e.target.checked)} />
                Let me predict the answer first
              </label>
              <button className="btn primary" type="submit" disabled={loading || !text.trim()}>
                {loading ? 'Reading the problem…' : 'Simulate'}
              </button>
            </div>
          </form>

          {error && <div className="alert error" role="alert">{error}</div>}
          {unsupported && (
            <div className="alert" role="status">
              <strong>Not supported yet.</strong> {unsupported}
            </div>
          )}

          <h2 className="examples-title">Or try a textbook problem</h2>
          <div className="examples">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                className={`example ${ex.spec.type === 'unsupported' ? 'muted' : ''}`}
                onClick={() => {
                  setText(ex.text)
                  load(ex.spec, ex.text, ex)
                }}
              >
                <ExampleKind type={ex.spec.type} />
                <span className="example-title">{ex.title}</span>
                <span className="example-text">{ex.text}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const revealed = phase === 'revealed'
  // The guess is always graded against the problem as it was when the student locked it in.
  const answer = answerFor(phase === 'predict' ? spec : (original ?? spec))

  return (
    <div className="page">
      <Header onHome={reset} />
      <main className="workspace">
        <blockquote className="problem">
          {highlightProblem(problemText, original ?? spec).map((seg, i) =>
            seg.field ? (
              <mark key={i} className="hl" style={{ '--hl': FIELD_COLORS[seg.field] } as CSSProperties} title={fieldLabel(original ?? spec, seg.field)}>
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </blockquote>
        <div className="grid">
          <aside className="side">
            <section className="card">
              <h2>Here’s what I understood</h2>
              <p className="hint">{phase === 'predict' ? 'Fix anything that is wrong before you predict.' : 'Drag the sliders and watch the answer change.'}</p>
              <ParamsPanel spec={spec} onChange={updateSpec} disabled={phase === 'playing'} />
            </section>
            {(phase === 'predict' || guess !== null) && (
              <section className="card">
                <PredictPanel
                  answer={answer}
                  guess={guess}
                  revealed={phase !== 'predict'}
                  onLock={(g) => {
                    setGuess(g)
                    setPhase('playing')
                    replay()
                  }}
                  onSkip={() => {
                    setPhase('playing')
                    replay()
                  }}
                />
              </section>
            )}
          </aside>
          <div className="main">
            <SimCanvas
              spec={spec}
              ghost={revealed && JSON.stringify(original) !== JSON.stringify(spec) ? original : null}
              playId={playId}
              instant={instant}
              paused={phase === 'predict'}
              showMarkers={revealed}
              onFinished={onFinished}
            />
            <div className="toolbar">
              {revealed && JSON.stringify(original) !== JSON.stringify(spec) && (
                <button
                  className="btn ghost"
                  onClick={() => {
                    if (original) setSpec(original)
                    setInstant(true)
                  }}
                >
                  Reset to the original problem
                </button>
              )}
              <span className="legend">{legendFor(spec, revealed && JSON.stringify(original) !== JSON.stringify(spec))}</span>
            </div>
            <SolutionPanel
              spec={spec}
              revealed={revealed}
              textbook={example?.textbook}
              original={original}
              onTryAngle={(angleDeg) => {
                if (spec.type !== 'projectile') return
                setSpec({ ...spec, angleDeg })
                replay()
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

/** Small label on each example card: what kind of problem it is. */
function ExampleKind({ type }: { type: ProblemSpec['type'] }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, 'aria-hidden': true }
  if (type === 'projectile')
    return (
      <span className="example-kind">
        <svg {...common}>
          <path d="M3 20 Q 10 2 21 20" strokeDasharray="2 3.5" />
          <circle cx="15" cy="9" r="2.2" fill="currentColor" stroke="none" />
        </svg>
        Projectile
      </span>
    )
  if (type === 'incline')
    return (
      <span className="example-kind slope">
        <svg {...common} strokeLinejoin="round">
          <path d="M3 20 L21 20 L3 7 Z" />
          <rect x="8" y="8.5" width="4.5" height="4.5" transform="rotate(36 10 11)" fill="currentColor" stroke="none" />
        </svg>
        Inclined plane
      </span>
    )
  if (type === 'pulley')
    return (
      <span className="example-kind pulley">
        <svg {...common}>
          <circle cx="12" cy="6" r="3.5" />
          <path d="M8.5 6v8M15.5 6v5" />
          <rect x="6" y="14" width="5" height="5" fill="currentColor" stroke="none" />
          <rect x="13" y="11" width="5" height="5" fill="currentColor" stroke="none" />
        </svg>
        Pulley
      </span>
    )
  if (type === 'collision')
    return (
      <span className="example-kind collision">
        <svg {...common}>
          <path d="M2 19h20" />
          <rect x="4" y="11" width="7" height="7" fill="currentColor" stroke="none" />
          <rect x="13" y="12" width="6" height="6" />
          <path d="M12 5v3M9.5 6.5l1 1.5M14.5 6.5l-1 1.5" />
        </svg>
        Collision
      </span>
    )
  if (type === 'spring')
    return (
      <span className="example-kind spring">
        <svg {...common} strokeLinejoin="round">
          <path d="M3 6v13M3 13h2l1.5-3 2 6 2-6 2 6 1.5-3h1" />
          <rect x="15.5" y="9.5" width="6" height="7" fill="currentColor" stroke="none" />
        </svg>
        Spring
      </span>
    )
  return (
    <span className="example-kind unsupported">
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M6 18 L18 6" />
      </svg>
      Not supported yet
    </span>
  )
}

/** One line under the simulation explaining what the drawing shows. */
function legendFor(spec: SupportedSpec, changed: boolean): string {
  switch (spec.type) {
    case 'projectile':
      return changed ? 'Dashed grey = the original problem' : ''
    case 'incline':
      return 'Arrows: weight (mg), normal (N), friction (f)'
    case 'pulley':
      return spec.setup === 'table' ? 'Arrows: tension (T), friction (f), weight (mg)' : 'Arrows: tension (T) up, weight (mg) down'
    case 'collision':
      return 'Arrows show each body’s velocity before and after'
    case 'spring':
      return 'Bars: kinetic (KE) and potential (PE) energy, which always add up to the same total'
  }
}

const fieldLabel =(spec: SupportedSpec, key: string) => fieldsFor(spec).find((f) => f.key === key)?.label

function Header({ onHome }: { onHome?: () => void }) {
  return (
    <header className="header">
      <button className="brand" onClick={onHome} disabled={!onHome} aria-label="NewtonLab home">
        {/* A falling apple, drawn like a notebook sketch */}
        <svg className="brand-mark" viewBox="0 0 32 32" width="32" height="32" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="motion" d="M9.2 2.8 9.4 7.6M12.6 1.8l.1 3.6" strokeWidth="1.5" />
          <path className="apple" d="M16 13.4c-3-2-8.4-1-8.3 5.1.1 5.7 3.9 10 6.7 9.6.9-.1 1.3-.6 1.7-.6.4 0 .9.5 1.8.6 2.8.3 6.6-4 6.6-9.6 0-6-5.4-7.1-8.5-5.1Z" strokeWidth="1.6" />
          <path className="shine" d="M11.1 17.2c.3-1.4 1.2-2.2 2.2-2.4" strokeWidth="1.3" />
          <path d="M16 13.5c.2-2.1.8-3.6 2-4.8" stroke="currentColor" strokeWidth="1.6" />
          <path className="leaf" d="M17.3 10.3c1.4-3.2 4.7-3.6 6.3-2.8-1 2.8-4 3.8-6.3 2.8Z" strokeWidth="1.2" />
        </svg>
        NewtonLab
      </button>
      <div className="header-actions">
        {onHome && (
          <button className="btn ghost" onClick={onHome}>
            ← New<span className="wide-only"> problem</span>
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
