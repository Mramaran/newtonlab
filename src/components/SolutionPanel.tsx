import type { Example } from '../examples'
import { optimalAngleDeg } from '../physics/projectile'
import { answerFor, fmt, workedSteps } from '../physics/solution'
import type { SupportedSpec } from '../physics/spec'
import { Tex } from './Tex'

interface Props {
  spec: SupportedSpec
  revealed: boolean
  /** the textbook answer, when the problem came from an example */
  textbook?: Example['textbook']
  /** the spec the student started with, to show how the answer changed */
  original?: SupportedSpec | null
  onTryAngle?: (angle: number) => void
}

export function SolutionPanel({ spec, revealed, textbook, original, onTryAngle }: Props) {
  const answer = answerFor(spec)
  const steps = workedSteps(spec)
  const changed = original && JSON.stringify(original) !== JSON.stringify(spec)
  const originalAnswer = changed && original && original.unknown === spec.unknown ? answerFor(original) : null
  const matchesTextbook =
    textbook && !changed && answer.value !== null && Math.abs((answer.value - textbook.value) / textbook.value) < 0.01

  if (!revealed) {
    return (
      <section className="solution locked" aria-live="polite">
        <h2>Worked solution</h2>
        <p>Lock in your prediction to reveal the answer and the working.</p>
      </section>
    )
  }

  const best = spec.type === 'projectile' && spec.unknown === 'range' ? optimalAngleDeg(spec.speed, spec.height, spec.g) : null

  return (
    <section className="solution" aria-live="polite">
      <div className="answer">
        <span className="answer-label">{answer.label}</span>
        <span className="answer-value">
          {answer.value === null ? '—' : <Tex tex={`${answer.symbol} = ${fmt(answer.value)}\\ \\text{${answer.unit}}`} />}
        </span>
        {answer.note && <p className="note">{answer.note}</p>}
      </div>

      {textbook && !changed && (
        <p className={matchesTextbook ? 'check ok' : 'check'}>
          Textbook answer: {textbook.value} {textbook.unit} {matchesTextbook ? '— matches ✓' : ''}
        </p>
      )}
      {originalAnswer && originalAnswer.value !== null && answer.value !== null && (
        <p className="check">
          Original problem: {fmt(originalAnswer.value)} {originalAnswer.unit} → now {fmt(answer.value)} {answer.unit} (
          {answer.value >= originalAnswer.value ? '+' : ''}
          {fmt(answer.value - originalAnswer.value)})
        </p>
      )}

      <h2>Worked solution</h2>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={i}>
            <Tex tex={s} block />
          </li>
        ))}
      </ol>

      {best !== null && spec.type === 'projectile' && Math.abs(best - spec.angleDeg) > 0.5 && (
        <div className="insight">
          <p>
            From a height of {fmt(spec.height)} m, the angle that throws furthest is <strong>{fmt(best)}°</strong>
            {spec.height > 0 ? ', not 45°.' : '.'}
          </p>
          {onTryAngle && (
            <button className="btn ghost" onClick={() => onTryAngle(Math.round(best * 10) / 10)}>
              Try {fmt(best)}°
            </button>
          )}
        </div>
      )}
    </section>
  )
}
