# air

A weather app for one question: what is it like in this city right now. Type a
city, get current conditions, the next 24 hours, the next few days, sunrise and
moon phase, and any active hazard warnings. The city lives in the URL, so every
view is a link you can send.

**Live demo:** <https://air.drifting.workers.dev/>

## How it works

One Cloudflare Worker serves everything. It ships the built SPA through the
static-asset binding and answers three `/api/*` routes itself, so there is one
deploy, one origin, no CORS to configure, and the WeatherAPI key never reaches
the browser.

The round trip from a keystroke to a rendered card:

1. Typing in the search field fires `/api/search` 300 ms after you stop, at a
   three-character minimum. Nothing else fetches while you type.
2. Picking a row writes `?city=…` to the URL. That parameter is the only place
   the active city is stored — there is no `useState` shadowing it — and
   `useSearchParam`, a `useSyncExternalStore` over the URL, is what every
   weather fetch reads.
3. The URL change starts two independent queries. `/api/weather` returns current
   conditions and paints the hero; `/api/weather/forecast` returns the days,
   hours, astro block and alerts, and fills the rest of the grid when it lands.
   Splitting them keeps the largest element on screen off the slower call.
4. Both go through the Worker, which resolves the query to an upstream location
   id, fetches, validates the response against a zod schema, reshapes it, and
   caches the result at the edge.
5. On success the city is appended to a `localStorage` history that backs the
   recent list. Removal and clear-all are undoable for five seconds.

Four things in that path are worth a closer look.

**The Worker formats; the client selects.** Every display quantity crosses the
wire as a `MeasurePair` — `{ metric, imperial }`, each holding a formatted
string, a bare value, a suffix and a spoken form for screen readers. Switching
°C to °F is `read(pair, system)`, with no refetch and no arithmetic on the
client. Classifications (the comfort sentence, the Beaufort word) are computed
Worker-side from the metric field for the same reason: the published Beaufort
table is rounded independently per unit, so classifying per display system would
change the word when a viewer flips the toggle.

**Locations resolve once, in ASCII.** WeatherAPI matches its index in ASCII, and
a multi-token accented query drops the accented token: `tromsø, norway` answers
with Norway, Iowa. So the Worker folds the query to ASCII, resolves it through
`search.json` to a numeric id (cached 24 h), and has both weather tiers fetch
`q=id:N`, which has no fuzzy step. The two tiers therefore cannot land on
different cities. The diacritics of the original query are copied back onto the
name for display, so the card still reads `Tromsø`.

**Errors are a closed union end to end.** One table in `src/lib/errors.ts`
derives kind, HTTP status and default message together, and both the Worker and
the client speak it. Vendor error codes are mapped at the Worker boundary and
unlisted ones collapse to `upstream`, so an API-key problem can never surface to
a user as an API-key problem. The retry policy reads the same union: `not_found`,
`invalid_query` and `quota_exceeded` never retry, `network` and `upstream` retry
twice with backoff capped at 5 s.

**The nav bar and the search panel are one element.** A single `position: fixed`
node carries `<nav>` when closed and `role="dialog" aria-modal="true"` when open,
springing between two geometries rather than cross-fading two components. Radix
`Dialog` is not used because it portals its content, which would make the panel a
different element from the bar. `<main>` takes `inert` while the panel is open,
so no focus trap is needed.

[`docs/architecture.md`](./docs/architecture.md) covers the module layout, the
API surface and the rest of the contracts. The comfort vocabulary has its own
page, [`docs/air-comfort.md`](./docs/air-comfort.md), and
[`docs/decisions/`](./docs/decisions/) holds three short records of calls that
were closed off.

## Stack

React 19 with the React Compiler, TypeScript, Vite 6, Tailwind v4 with vendored
shadcn/ui primitives, TanStack Query 5, Motion, and zod. Cloudflare Workers host
it; `@cloudflare/vite-plugin` runs the Worker inside the dev server so local and
production take the same path. Tests run on Vitest.

Two choices that aren't obvious from the dependency list: zod is a runtime
dependency but ships only in the Worker bundle — the frontend imports the DTO
types from the same file, type-only, and ESLint blocks any runtime import — and
the app has no router, because the one piece of navigable state is a query
parameter.

## Getting started

Prerequisites: Node 22 or 23 (`engines` is `>=22 <25`; CI runs 24) and pnpm 10.

```bash
pnpm install
cp .dev.vars.example .dev.vars
```

Put a WeatherAPI.com key in `.dev.vars`. The free tier needs no card and covers
local development; sign up at <https://www.weatherapi.com/signup.aspx>.

```bash
pnpm dev
```

Vite serves the SPA and the Worker together, so `/api/*` is handled locally.
The dev server prints the URL.

## Scripts

| Command          | What it does                                                                   |
| ---------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`       | Vite dev server with the Worker running inside it                              |
| `pnpm build`     | `tsc -b` across the three project references, then Vite                        |
| `pnpm preview`   | Serve the production build                                                     |
| `pnpm test`      | Vitest in watch mode                                                           |
| `pnpm test:run`  | Vitest once, all three projects                                                |
| `pnpm typecheck` | `tsc -b --noEmit`                                                              |
| `pnpm lint`      | ESLint over `**/*.{ts,tsx}`                                                    |
| `pnpm format`    | Prettier write (`format:check` to verify only)                                 |
| `pnpm run ci`    | format:check → lint → typecheck → test:run → build                             |
| `pnpm deploy`    | Build and `wrangler deploy` — see [`docs/deployment.md`](./docs/deployment.md) |

`pnpm test:run` includes a Playwright-driven browser project. Install the
browser once with `pnpm exec playwright install --with-deps chromium`, or scope
the run to a project: `pnpm test:run --project frontend`. See
[`docs/testing.md`](./docs/testing.md).

## Project structure

Frontend and Worker share one `src/` tree and one `tsconfig` solution with three
project references (app, node, worker), so a type can be declared once and used
on both sides.

| Path              | Contents                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `src/worker.ts`   | Worker entry: routes `/api/*`, falls through to the asset binding         |
| `src/worker/`     | Upstream client, DTO shaping, formatting, edge cache, error mapping       |
| `src/lib/`        | Code both sides import — schemas, error table, query normalization, units |
| `src/api/`        | Browser fetch wrappers and type-only DTO re-exports                       |
| `src/hooks/`      | Query hooks, the URL subscription, and the localStorage-backed stores     |
| `src/components/` | The nav/search surface, the weather grid, and the result states           |

## Known limitations

- The free WeatherAPI key caps `forecast.json` at three days, so the forecast
  card shows today plus two. Nothing in the code assumes more than it receives.
- When the monthly quota runs out the app replaces the result area with a state
  that says so and links to the signup page. Edge caching keeps the demo inside
  quota under ordinary load, but a burst of distinct cities will exhaust it.
- A city name that upstream maps to more than one place resolves to upstream's
  first match. `Kufra, Libya` returns Kufra in Siirt, Turkey.
- History is per-browser. There are no accounts and no server-side user data.
- The Worker keeps no state of its own beyond the edge cache, so a cold cache
  costs one extra `search.json` round trip per city per day.

## License

MIT.
