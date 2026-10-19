import { useCallback, useState, type CSSProperties } from 'react'
import { ParamsPanel } from './components/ParamsPanel'
import { PredictPanel } from './components/PredictPanel'
import { SimCanvas } from './components/SimCanvas'
import { SolutionPanel } from './components/SolutionPanel'
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
          <h1>
            Turn any physics problem into a <em>simulation you can play with.</em>
          </h1>
          <p className="lede">
            Paste a projectile or inclined-plane question from your textbook. NewtonLab reads it, builds the exact scenario, and shows the
            physics working step by step.
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
              <span className="legend">
                {spec.type === 'projectile'
                  ? revealed && JSON.stringify(original) !== JSON.stringify(spec)
                    ? 'Dashed grey = the original problem'
                    : ''
                  : 'Arrows: weight (mg), normal (N), friction (f)'}
              </span>
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

const fieldLabel = (spec: SupportedSpec, key: string) => fieldsFor(spec).find((f) => f.key === key)?.label

function Header({ onHome }: { onHome?: () => void }) {
  return (
    <header className="header">
      <button className="brand" onClick={onHome} disabled={!onHome} aria-label="NewtonLab home">
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <path d="M4 26 Q 14 2 28 26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 5" />
          <circle cx="21" cy="12" r="4" fill="#e4572e" />
        </svg>
        NewtonLab
      </button>
      {onHome && (
        <button className="btn ghost" onClick={onHome}>
          ← New problem
        </button>
      )}
    </header>
  )
}
