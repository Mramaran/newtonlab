import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import handler from './api/parse.ts'

/** Serves the /api/parse serverless function during `npm run dev`. */
function apiDevServer(env: Record<string, string>): Plugin {
  return {
    name: 'newtonlab-api-dev',
    configureServer(server) {
      // process.env stores strings, so copy only keys that exist (undefined would become "undefined").
      for (const key of ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL']) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }
      server.middlewares.use('/api/parse', (req, res) => {
        void handler(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), apiDevServer(loadEnv(mode, process.cwd(), ''))],
}))
