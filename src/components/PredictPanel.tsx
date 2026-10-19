import { useState } from 'react'
import type { Answer } from '../physics/solution'
import { fmt } from '../physics/solution'

interface Props {
  answer: Answer
  guess: number | null
  revealed: boolean
  onLock: (guess: number) => void
  onSkip: () => void
}

export function PredictPanel({ answer, guess, revealed, onLock, onSkip }: Props) {
  const [draft, setDraft] = useState('')

  if (!revealed) {
    const value = Number(draft)
    const valid = draft.trim() !== '' && Number.isFinite(value)
    return (
      <form
        className="predict"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onLock(value)
        }}
      >
        <h2>Predict first</h2>
        <p>Before you watch, what do you think the {answer.label.toLowerCase()} will be?</p>
        <div className="predict-row">
          <input type="number" step="any" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your guess" aria-label="Your guess" autoFocus />
          <span className="unit">{answer.unit}</span>
          <button className="btn primary" type="submit" disabled={!valid}>
            Lock in
          </button>
        </div>
        <button type="button" className="link" onClick={onSkip}>
          Skip and just show me
        </button>
      </form>
    )
  }

  if (guess === null || answer.value === null) return null
  const error = answer.value === 0 ? Math.abs(guess) : Math.abs((guess - answer.value) / answer.value)
  const pct = Math.round(error * 100)
  const verdict = pct <= 5 ? 'Spot on!' : pct <= 20 ? 'Close!' : 'Interesting — the simulation shows why.'
  return (
    <div className={`predict result ${pct <= 20 ? 'good' : ''}`}>
      <h2>Your prediction</h2>
      <p>
        You guessed <strong>{fmt(guess)} {answer.unit}</strong>. The answer is{' '}
        <strong>{fmt(answer.value)} {answer.unit}</strong> — {pct}% off. {verdict}
      </p>
    </div>
  )
}
