import { describe, expect, it } from 'vitest'
import { parseProblem } from '../api/parse.ts'

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () => new Response(JSON.stringify(body), { status })) as typeof fetch
}

const geminiReply = (json: unknown) => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] })

describe('parseProblem', () => {
  it('flattens the nested reply and drops nulls', async () => {
    const r = await parseProblem('A ball is kicked at 20 m/s at 35°.', {
      apiKey: 'test',
      fetchImpl: fakeFetch(
        200,
        geminiReply({ type: 'projectile', projectile: { speed: 20, angleDeg: 35, height: 0, unknown: 'range' }, incline: null, g: null, reason: null }),
      ),
    })
    expect(r).toEqual({ ok: true, spec: { type: 'projectile', speed: 20, angleDeg: 35, height: 0, unknown: 'range' } })
  })

  it('keeps a stated g and passes unsupported reasons through', async () => {
    const r = await parseProblem('A stone falls 80 m, g = 10.', {
      apiKey: 'test',
      fetchImpl: fakeFetch(200, geminiReply({ type: 'projectile', projectile: { speed: 0, angleDeg: 0, height: 80, unknown: 'timeOfFlight' }, g: 10 })),
    })
    expect(r).toMatchObject({ ok: true, spec: { height: 80, g: 10 } })
    const u = await parseProblem('A spring oscillates.', {
      apiKey: 'test',
      fetchImpl: fakeFetch(200, geminiReply({ type: 'unsupported', projectile: null, incline: null, reason: 'Springs are not supported.' })),
    })
    expect(u).toEqual({ ok: true, spec: { type: 'unsupported', reason: 'Springs are not supported.' } })
  })

  it('retries once on the fallback model after a rate limit', async () => {
    let calls = 0
    const urls: string[] = []
    const flaky = (async (url: string) => {
      calls++
      urls.push(url)
      return calls === 1
        ? new Response('{}', { status: 429 })
        : new Response(JSON.stringify(geminiReply({ type: 'incline', incline: { angleDeg: 30, mu: 0, length: 10, mass: 1, initialSpeed: 0, unknown: 'finalSpeed' } })), { status: 200 })
    }) as typeof fetch
    const r = await parseProblem('A block slides down a 30° ramp.', { apiKey: 'k', fetchImpl: flaky, retryDelayMs: 0 })
    expect(calls).toBe(2)
    expect(urls[0]).toContain('gemini-3.5-flash-lite:')
    expect(urls[1]).toContain('gemini-flash-latest:')
    expect(r).toMatchObject({ ok: true, spec: { type: 'incline', angleDeg: 30 } })
  })

  it('rejects empty or overlong text without calling the API', async () => {
    const neverCalled = (() => {
      throw new Error('should not be called')
    }) as unknown as typeof fetch
    expect(await parseProblem('  ', { apiKey: 'k', fetchImpl: neverCalled })).toMatchObject({ ok: false, status: 400 })
    expect(await parseProblem('x'.repeat(2001), { apiKey: 'k', fetchImpl: neverCalled })).toMatchObject({ ok: false, status: 400 })
  })

  it('reports a missing API key as not configured', async () => {
    expect(await parseProblem('a problem', { apiKey: undefined })).toMatchObject({ ok: false, status: 503 })
  })

  it('maps rate limits and bad replies to friendly errors', async () => {
    expect(await parseProblem('p', { apiKey: 'k', fetchImpl: fakeFetch(429, {}), retryDelayMs: 0 })).toMatchObject({ ok: false, status: 429 })
    expect(await parseProblem('p', { apiKey: 'k', fetchImpl: fakeFetch(500, {}) })).toMatchObject({ ok: false, status: 502 })
    expect(await parseProblem('p', { apiKey: 'k', fetchImpl: fakeFetch(200, { candidates: [] }) })).toMatchObject({ ok: false })
  })
})
