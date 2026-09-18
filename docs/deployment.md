# Deployment

The app is one Cloudflare Worker. `wrangler.jsonc` points `main` at
`src/worker.ts` and binds `./dist/client` as `ASSETS` with
single-page-application fallback, so one deploy ships the SPA and the `/api/*`
routes together.

## Local API key

Copy the example file and paste in a free key from
[WeatherAPI.com](https://www.weatherapi.com/signup.aspx). No card is required
for the free tier.

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` is gitignored. `WEATHER_API_KEY` is the only variable the code
reads, on both sides of the split — locally from `.dev.vars`, in production from
a Worker secret.

## Manual deploy

```bash
pnpm wrangler login
export CLOUDFLARE_ACCOUNT_ID=...          # from the dashboard URL
pnpm wrangler secret put WEATHER_API_KEY
pnpm deploy
```

`wrangler.jsonc` carries no `account_id` on purpose, so the environment supplies
it — the same variable CI uses. Without it wrangler picks whichever account the
login happens to have, and a deploy aimed at the wrong account succeeds
somewhere unexpected instead of failing.

## CI

Two workflows run on every push to `main`. `ci.yml` runs lint, format check,
typecheck, the full test suite and a build on Node 24. `deploy.yml` builds and
runs `wrangler deploy`; it is concurrency-grouped per ref with
`cancel-in-progress: false`, so two pushes deploy in order rather than racing.

The deploy workflow needs two repository secrets:

- `CLOUDFLARE_API_TOKEN` — scoped to "Edit Cloudflare Workers"
- `CLOUDFLARE_ACCOUNT_ID`

The two workflows are independent: `deploy.yml` does not wait for `ci.yml`, so a
failing test does not block a deploy.
