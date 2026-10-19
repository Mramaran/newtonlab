// Cloudflare Workers entry (used when the repo is deployed as a Worker rather than a Pages project).
// /api/parse goes to the shared parser; everything else is served from the built site in dist/.
import { onRequest, onRequestPost } from '../functions/api/parse.ts'

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  GEMINI_FALLBACK_MODEL?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/parse') return request.method === 'POST' ? onRequestPost({ request, env }) : onRequest()
    return env.ASSETS.fetch(request)
  },
}
