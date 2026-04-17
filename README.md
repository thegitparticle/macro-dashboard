# dashboard-boilerplate

This repo is a dashboard boilerplate demonstrating a Cloudflare Pages Functions backend paired with a lightweight React UI that runs without a build step in local development.

## Demo: Runtime random API

A small Cloudflare Pages Function at `functions/random.ts` returns a runtime JSON payload with a random value. The dashboard demonstrates both:

- A **build-time** random value generated in the client at startup (static for the session).
- A **runtime** random value fetched from the server (`/api/random`) on each page load or on demand.

## Local development

```bash
npm run dev
```

This starts a tiny Node server (`dev-server.js`) that serves the static frontend and local API endpoints.

## Build output for Cloudflare Pages deploy

Use the build command to stage deployable static assets in `dist/` (only `index.html` and `app/`), which avoids uploading large local folders like `node_modules/` as assets:

```bash
npm run build
```

## Cloudflare Pages deployment

Set your project and branch, then run:

```bash
CF_PAGES_PROJECT=<your-pages-project> CF_PAGES_BRANCH=main npm run deploy:pages
```

Equivalent direct command:

```bash
npx wrangler pages deploy dist --project-name <your-pages-project> --branch main
```

`functions/` is still used for Pages Functions at deploy time.

Styling: added orange/green brand tints, dark-mode support and a compact/dense UI toggle for an industrial, information-dense look.

> Deployment note: Pages deploys are triggered from merges to `main`.
