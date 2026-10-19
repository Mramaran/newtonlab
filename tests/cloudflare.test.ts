// Server tests live here, not in api/ or functions/: Vercel and Cloudflare turn every file in those folders into a route.
import { describe, expect, it } from 'vitest'
import { onRequest, onRequestPost } from '../functions/api/parse.ts'

const post = (body: string) => new Request('https://example.test/api/parse', { method: 'POST', body })

describe('Cloudflare /api/parse', () => {
  it('reports a missing key as not configured', async () => {
    const res = await onRequestPost({ request: post(JSON.stringify({ text: 'A ball is thrown at 10 m/s.' })), env: {} })
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('not configured') })
  })

  it('rejects bad JSON and empty text', async () => {
    expect((await onRequestPost({ request: post('{oops'), env: { GEMINI_API_KEY: 'k' } })).status).toBe(400)
    expect((await onRequestPost({ request: post('{"text":""}'), env: { GEMINI_API_KEY: 'k' } })).status).toBe(400)
  })

  it('only accepts POST', async () => {
    expect(onRequest().status).toBe(405)
  })
})
