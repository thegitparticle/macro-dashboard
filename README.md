# dashboard-boilerplate

This repo is a dashboard boilerplate using a Cloudflare **Worker** backend plus a lightweight React UI that runs without a frontend build step in local development.

## Demo: Runtime random API

A runtime endpoint at `/api/random` returns JSON with a random value. The dashboard demonstrates both:

- A **build-time** random value generated in the client at startup (static for the session).
- A **runtime** random value fetched from the server (`/api/random`) on each page load or on demand.

## Local development

```bash
npm run dev
```

This starts a tiny Node server (`dev-server.js`) that serves the static frontend and local API endpoints.

## Build output

Use the build command to stage deployable static assets in `dist/` (only `index.html` and `app/`):

```bash
npm run build
```

## Cloudflare Workers deployment

This project now deploys as a Worker with static assets from `dist/` and API routes served by `src/worker.ts`.

Deploy command:

```bash
npm run deploy
```

Equivalent direct command:

```bash
npm run build && npx wrangler deploy
```

## Required environment variables for CI

- `CLOUDFLARE_API_TOKEN` (**required**)
- `CLOUDFLARE_ACCOUNT_ID` (**recommended**)

No `CF_PAGES_PROJECT` or `CF_PAGES_BRANCH` variables are needed for this Worker-based deployment flow.

## Required API token scope

For this repo's deploy command (`wrangler deploy`):

- **Account / Workers Scripts: Edit** (required)

If deploy auth fails, validate credentials with:

```bash
npx wrangler whoami
```

## Why Worker-only works here

- `wrangler.toml` defines a Worker entrypoint (`main = "src/worker.ts"`).
- `wrangler.toml` also defines static assets (`[assets] directory = "dist"`).
- `src/worker.ts` routes API paths (`/api/dashboard`, `/api/random`) and serves frontend assets for all other paths.

Styling: orange/green brand tints, dark-mode support and a compact/dense UI toggle for an industrial, information-dense look.

## Dashboard UI inventory

The UI currently renders:

- Last updated timestamp.
- Dashboard feed status summary.
- Source check count and fallback count.
- Key macro risk this week.
- Policy context text.
- Source health board rows (source, status, message).
- Regime cards (Growth, Inflation, Perp risk tone, Policy).
- Macro regime monitor rows (latest, delta, trend, next release, rationale).
- Perp structure rows (name/link, funding, open interest, tag).
- Onchain stablecoin market cap daily mini-chart.
- Stablecoin ecosystem concentration by chain.
- Bridge flows daily mini-chart.
- Bridge flow shifts (24h) by chain.
- Spot prices rows (symbol, price, 24h change).
- Per-symbol 7-day spot mini-charts.

## Scanline background effect source

The looping background line is the **scanline overlay**:

- Rendered by `<div className="scanline" aria-hidden="true"></div>` in `app/main.js`.
- Animated by `.scanline { animation: scan 4s linear infinite; }` in `app/styles/app.css`.
- Motion defined by `@keyframes scan` moving `top` from `0` to `100%`.
- Documented in the design system as "**Scanline: Animated horizontal gradient overlay**" in `STYLING_SPEC.md`.
