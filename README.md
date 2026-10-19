# SimSketch

**Turn a physics word problem into a simulation you can play with.**

Paste a projectile or inclined-plane question from your textbook. SimSketch reads it, builds that exact scenario as an animated simulation, shows the worked solution with your numbers substituted in, and lets you drag sliders to see how the answer changes. A "predict first" mode asks you to guess before the reveal, so you build intuition instead of copying answers.

Built for EurekaDev 2026 (Coding track, Math & Physics).

## Why

Students solve mechanics problems by plugging numbers into memorised formulas without ever seeing the motion. Textbooks have static diagrams, solver apps give a final number, and ready-made simulations don't match the problem in front of you. SimSketch builds the simulation from *your* problem and checks it against *your* textbook answer.

## How it works

1. **Read the problem.** The text goes to a small serverless function (`api/parse.ts`) that asks Gemini to extract the problem type and values as strict JSON. The API key stays on the server.
2. **Check what was understood.** The values are validated (`src/physics/spec.ts`) and shown on an editable "Here's what I understood" card. Anything outside the supported types gets a clear "not supported yet" message instead of a wrong simulation.
3. **Simulate with real physics.** The motion is computed with closed-form equations (`src/physics/projectile.ts`, `src/physics/incline.ts`), not a game engine, so the numbers match the textbook. The canvas renderer (`src/sim/draw.ts`) animates it.
4. **Explain.** The worked solution (`src/physics/solution.ts`) is rendered with KaTeX, step by step, using the student's own numbers.

The AI only turns words into numbers. Everything you see moving is computed by the app.

### Supported problems

| Type | Inputs | Can solve for |
|---|---|---|
| Projectile motion | launch speed, angle, launch height, g | range, time of flight, maximum height, landing speed |
| Inclined plane | slope angle, friction μ, length, starting speed, mass, g | speed at the bottom, time to the bottom, acceleration |

It also handles edge cases: launches from a height (where the best angle is *not* 45°, and the app shows the real optimum), blocks that friction holds still, and pushed blocks that stop partway down.

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

37 unit tests cover the physics against textbook answers (e.g. 20 m/s at 35° → 38.4 m range), the validator, every example problem, and the parser's error handling (with a fake fetch, so no API calls).

## Deploy

The repo deploys to Vercel as-is: Vite builds the front end and `api/parse.ts` becomes a serverless function. Set `GEMINI_API_KEY` in the project's environment variables.

## Tech

React 19, TypeScript, Vite, HTML Canvas, KaTeX, Vitest, Gemini API (structured JSON output).

## Limits

- Two problem types only (projectile, inclined plane). Pendulums, collisions and pulleys are not supported yet.
- No air resistance.
- Text input only; photo upload is planned.
