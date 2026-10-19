import { describe, expect, it } from 'vitest'
import { EXAMPLES } from './examples'
import { answerFor, workedSteps } from './physics/solution'
import { validateSpec } from './physics/spec'

describe('example problems', () => {
  for (const ex of EXAMPLES) {
    it(`${ex.title}: cached spec is valid`, () => {
      expect(validateSpec(ex.spec)).toEqual({ ok: true, spec: ex.spec })
    })

    if (ex.textbook && ex.spec.type !== 'unsupported') {
      const spec = ex.spec
      const textbook = ex.textbook
      it(`${ex.title}: matches the textbook answer (${textbook.value} ${textbook.unit})`, () => {
        const answer = answerFor(spec)
        expect(answer.unit).toBe(textbook.unit)
        expect(answer.value).not.toBeNull()
        expect(Math.abs((answer.value! - textbook.value) / textbook.value)).toBeLessThan(0.01)
        expect(workedSteps(spec).length).toBeGreaterThan(0)
      })
    }
  }
})

describe('answerFor edge cases', () => {
  it('explains a block that friction holds still', () => {
    const a = answerFor({ type: 'incline', angleDeg: 10, mu: 0.5, length: 5, mass: 1, initialSpeed: 0, g: 9.8, unknown: 'timeToBottom' })
    expect(a.value).toBeNull()
    expect(a.note).toMatch(/never moves/)
  })
})
