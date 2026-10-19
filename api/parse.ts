// Serverless proxy: turns a physics word problem into structured parameters with Gemini.
// The API key lives only in the server environment (GEMINI_API_KEY) and never reaches the browser.
// Kept dependency-free and self-contained so it runs both on Vercel and inside the Vite dev server.
import type { IncomingMessage, ServerResponse } from 'node:http'

const MAX_TEXT_LENGTH = 2000
// Lite answered in 1–2 s in testing; flash-latest was accurate too but reasons by default and once took ~2 min.
const DEFAULT_MODEL = 'gemini-3.5-flash-lite'
// Separate free-tier quota, used when the main model is rate-limited.
const DEFAULT_FALLBACK_MODEL = 'gemini-flash-latest'

export const SYSTEM_PROMPT = `You convert a high school physics word problem into JSON parameters for a simulator.

Set "type", then fill EVERY field of the matching object ("projectile" or "incline") and set the other object to null.

1. "projectile": an object launched, thrown, kicked, fired or dropped, moving under gravity only (no air resistance).
   - speed: launch speed in m/s (dropped from rest = 0)
   - angleDeg: degrees above horizontal (thrown horizontally or dropped = 0; thrown straight up = 90)
   - height: launch height above the ground where it lands, in m (0 if launched from the ground; a cliff, balcony, tower or table height counts)
   - unknown: what the question asks for: "range" (how far horizontally), "timeOfFlight", "maxHeight", or "impactSpeed"
2. "incline": a block, box, sled, skier or object sliding DOWN a straight slope.
   - angleDeg: slope angle above horizontal
   - mu: coefficient of kinetic friction (0 if smooth, frictionless or friction is negligible)
   - length: distance along the slope in m (if only the vertical height h is given, use h / sin(angle))
   - mass: kg (1 if not given)
   - initialSpeed: speed down the slope at the start in m/s (0 if released or starting from rest)
   - unknown: "finalSpeed", "timeToBottom", or "acceleration"

Rules:
- Convert every value to SI units (km/h to m/s by dividing by 3.6, cm to m, grams to kg).
- Set g only if the problem states a value (for example "take g = 10 m/s²"); otherwise null.
- If the problem is anything else (pulleys, springs, circuits, collisions, pendulums, motion up a slope, air resistance,
  or anything you cannot map with confidence), use type "unsupported", both objects null, and a one-sentence "reason" for a student.
- Never invent values that are not stated or clearly implied.`

const PROJECTILE_FIELDS = ['speed', 'angleDeg', 'height', 'unknown']
const INCLINE_FIELDS = ['angleDeg', 'mu', 'length', 'mass', 'initialSpeed', 'unknown']

// Nested objects with required fields stop the model from silently leaving values out.
export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    type: { type: 'STRING', enum: ['projectile', 'incline', 'unsupported'] },
    projectile: {
      type: 'OBJECT',
      nullable: true,
      properties: {
        speed: { type: 'NUMBER' },
        angleDeg: { type: 'NUMBER' },
        height: { type: 'NUMBER' },
        unknown: { type: 'STRING', enum: ['range', 'timeOfFlight', 'maxHeight', 'impactSpeed'] },
      },
      required: PROJECTILE_FIELDS,
      propertyOrdering: PROJECTILE_FIELDS,
    },
    incline: {
      type: 'OBJECT',
      nullable: true,
      properties: {
        angleDeg: { type: 'NUMBER' },
        mu: { type: 'NUMBER' },
        length: { type: 'NUMBER' },
        mass: { type: 'NUMBER' },
        initialSpeed: { type: 'NUMBER' },
        unknown: { type: 'STRING', enum: ['finalSpeed', 'timeToBottom', 'acceleration'] },
      },
      required: INCLINE_FIELDS,
      propertyOrdering: INCLINE_FIELDS,
    },
    g: { type: 'NUMBER', nullable: true },
    reason: { type: 'STRING', nullable: true },
  },
  required: ['type'],
  propertyOrdering: ['type', 'projectile', 'incline', 'g', 'reason'],
}

type Raw = Record<string, unknown>

/** Flattens the model's nested reply into the shape the client validator expects, dropping nulls. */
export function flattenReply(parsed: Raw): Raw {
  const nested = parsed.type === 'projectile' || parsed.type === 'incline' ? (parsed[parsed.type] as Raw | null) : null
  const flat: Raw = { type: parsed.type, ...(nested ?? {}), g: parsed.g, reason: parsed.reason }
  return Object.fromEntries(Object.entries(flat).filter(([, v]) => v !== null && v !== undefined))
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export type ParseResult = { ok: true; spec: unknown } | { ok: false; status: number; error: string }

interface ParseOptions {
  apiKey: string | undefined
  model?: string
  fallbackModel?: string
  fetchImpl?: typeof fetch
  retryDelayMs?: number
  timeoutMs?: number
}

export async function parseProblem(text: unknown, opts: ParseOptions): Promise<ParseResult> {
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, status: 400, error: 'Please enter a problem.' }
  if (text.length > MAX_TEXT_LENGTH) return { ok: false, status: 400, error: 'That problem is too long (max 2000 characters).' }
  if (!opts.apiKey) return { ok: false, status: 503, error: 'The AI parser is not configured. Try one of the example problems.' }

  const model = opts.model || DEFAULT_MODEL
  const fallbackModel = opts.fallbackModel || DEFAULT_FALLBACK_MODEL
  const doFetch = opts.fetchImpl ?? fetch
  const request = (modelName: string) =>
    doFetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
      method: 'POST',
      // Never leave a student staring at a spinner if the API stalls.
      signal: AbortSignal.timeout(opts.timeoutMs ?? 15000),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.apiKey! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          // Extraction doesn't need reasoning tokens; skipping them roughly halves the latency.
          // Only 2.5 models accept thinkingBudget, other models reject the request with a 400.
          ...(modelName.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    })

  let response: Response
  try {
    response = await request(model)
    // The free tier rate-limits bursts; retry once on the fallback model, which has its own quota.
    if (response.status === 429) {
      await sleep(opts.retryDelayMs ?? 1000)
      response = await request(fallbackModel)
    }
  } catch {
    return { ok: false, status: 504, error: 'The AI parser took too long or could not be reached. Try again, or pick an example.' }
  }

  if (response.status === 429) return { ok: false, status: 429, error: 'The AI parser is busy right now. Wait a moment or try an example problem.' }
  if (!response.ok) return { ok: false, status: 502, error: `The AI parser returned an error (${response.status}).` }

  try {
    const data = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) return { ok: false, status: 502, error: 'The AI parser returned an empty answer.' }
    return { ok: true, spec: flattenReply(JSON.parse(raw) as Raw) }
  } catch {
    return { ok: false, status: 502, error: 'The AI parser returned something unreadable.' }
  }
}

async function readJsonBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : {}
}

function send(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' })
  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch {
    return send(res, 400, { error: 'Invalid JSON body.' })
  }
  const result = await parseProblem((body as { text?: unknown })?.text, {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
    fallbackModel: process.env.GEMINI_FALLBACK_MODEL,
  })
  if (result.ok) return send(res, 200, { spec: result.spec })
  return send(res, result.status, { error: result.error })
}
