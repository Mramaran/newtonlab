// Cloudflare Pages Function for POST /api/parse.
// Pages doesn't run Vercel-style api/ handlers, so this adapts the same parser to Web Request/Response.
// Set GEMINI_API_KEY (and optionally GEMINI_MODEL, GEMINI_FALLBACK_MODEL) in the Pages project settings.
import { parseProblem } from '../../api/parse.ts'

interface Env {
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GEMINI_FALLBACK_MODEL?: string
}

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  let body: { text?: unknown }
  try {
    body = (await request.json()) as { text?: unknown }
  } catch {
    return json(400, { error: 'Invalid JSON body.' })
  }
  const result = await parseProblem(body?.text, {
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
    fallbackModel: env.GEMINI_FALLBACK_MODEL,
  })
  return result.ok ? json(200, { spec: result.spec }) : json(result.status, { error: result.error })
}

export const onRequest = () => json(405, { error: 'Use POST.' })
