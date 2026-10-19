# NewtonLab

**Turn a physics word problem into a simulation you can play with.**

Paste a Class 11–12 mechanics question from your textbook: a projectile, a slope, a pulley, a collision or a spring. NewtonLab reads it, builds that exact scenario as an animated simulation, shows the worked solution with your numbers substituted in, and lets you drag sliders to see how the answer changes. A "predict first" mode asks you to guess before the reveal, so you build intuition instead of copying answers.

Built for EurekaDev 2026 (Coding track, Math & Physics).

Live demo: https://newtonlab.mrmaran.workers.dev · Demo video: https://youtu.be/JUS3Ko8qBEk

## Why

Students solve mechanics problems by plugging numbers into memorised formulas without ever seeing the motion. Textbooks have static diagrams, solver apps give a final number, and ready-made simulations don't match the problem in front of you. NewtonLab builds the simulation from *your* problem and checks it against *your* textbook answer.

## How it works

1. **Read the problem.** The text goes to a small serverless function (`api/parse.ts`, wrapped for Cloudflare in `functions/api/parse.ts`) that asks Gemini to extract the problem type and values as strict JSON. The API key stays on the server.
2. **Check what was understood.** The values are validated (`src/physics/spec.ts`) and shown on an editable "Here's what I understood" card. Anything outside the supported types gets a clear "not supported yet" message instead of a wrong simulation.
3. **Simulate with real physics.** The motion is computed with closed-form equations (`src/physics/projectile.ts`, `incline.ts`, `pulley.ts`, `collision.ts`, `spring.ts`), not a game engine, so the numbers match the textbook. The canvas renderer (`src/sim/draw.ts`, `drawMore.ts`) animates it.
4. **Explain.** The worked solution (`src/physics/solution.ts`) is rendered with KaTeX, step by step, using the student's own numbers.

The AI only turns words into numbers. Everything you see moving is computed by the app.

### Supported problems

| Type | Inputs | Can solve for |
|---|---|---|
| Projectile motion | launch speed, angle, launch height, g | range, time of flight, maximum height, landing speed |
| Inclined plane | slope angle, friction μ, length, starting speed, mass, g | speed at the bottom, time to the bottom, acceleration |
| Pulley (Atwood, or block on a table) | two masses, friction μ (table), distance, g | acceleration, tension, time, speed |
| 1D collision | two masses and velocities, coefficient of restitution e | final velocities, kinetic energy lost |
| Spring–mass SHM | mass, spring constant k, amplitude | period, frequency, maximum speed and acceleration, energy |

It also handles edge cases: launches from a height (where the best angle is *not* 45°, and the app shows the real optimum), blocks that friction holds still, pushed blocks that stop partway down, equal Atwood masses that balance, table friction that stops the system, bodies that never meet, and questions that ask for two quantities at once.

The example problems are original, written in the style of Class 11 NCERT/CBSE questions.

## Run it locally

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # then add your Gemini API key (free at https://aistudio.google.com/apikey)
npm run dev
```

Open http://localhost:5173. The example problems work without an API key because their parsed values are cached.

## Tests

```bash
npm test
```

75 unit tests cover the physics against textbook answers (e.g. 20 m/s at 35° → 38.4 m range), the validator, every example problem, the problem-text highlighter, and the parser's error handling (with a fake fetch, so no API calls).

## Deploy

### Cloudflare Workers (the dashboard's default for a GitHub import)

`wrangler.jsonc` deploys the built site as static assets, with `worker/index.ts` handling `/api/parse`.

1. **Workers & Pages → Create → Import a repository**, pick this repo.
2. Build command `npm run build`, deploy command `npx wrangler deploy`.
3. In the Worker's **Settings → Variables and Secrets**, add `GEMINI_API_KEY` as a *secret*, then redeploy.
4. The live URL is `https://newtonlab.<your-subdomain>.workers.dev`, shown on the Worker's overview page under **Domains & Routes**. If no URL appears, turn on the `workers.dev` route there.

### Cloudflare Pages

`functions/api/parse.ts` is a Pages Function that wraps the same parser, so `/api/parse` works on Cloudflare with no extra setup.

1. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, and pick this repo.
2. Build settings: framework preset **None** (or Vite), build command `npm run build`, output directory `dist`.
3. **Settings → Variables and Secrets**: add `GEMINI_API_KEY` as a *secret* (encrypted), for Production and Preview.
4. Deploy. Every push to `main` redeploys.

To try the Cloudflare runtime locally: `npm run build && npx wrangler pages dev dist` (put the key in `.dev.vars` as `GEMINI_API_KEY=...`).

### Vercel

Also works as-is: Vite builds the front end and `api/parse.ts` becomes a serverless function. Set `GEMINI_API_KEY` in the project's environment variables.

Server tests live in `tests/`, not `api/` or `functions/`, because both platforms turn every file in those folders into a route.

## Tech

React 19, TypeScript, Vite, HTML Canvas, KaTeX, Vitest, Gemini API (structured JSON output).

## Limits

- Two problem types only (projectile, inclined plane). Pendulums, collisions and pulleys are not supported yet.
- No air resistance.
- Text input only; photo upload is planned.
