# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Commands

| Command                             | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `pnpm typecheck`                    | Type-check all three project references (app, node, worker)   |
| `pnpm lint` / `pnpm lint:fix`       | ESLint over `**/*.{ts,tsx}`                                   |
| `pnpm format` / `pnpm format:check` | Prettier                                                      |
| `pnpm test:run`                     | Vitest single run across all three projects                   |
| `pnpm test`                         | Vitest watch                                                  |
| `pnpm build`                        | `tsc -b && vite build`                                        |
| `pnpm ci`                           | Full gate: format:check → lint → typecheck → test:run → build |

**Do not run `pnpm dev`.** The user runs the dev server themselves; verify with
`typecheck` / `lint` / `build`.

### Running a single test

Vitest is configured as three projects, so target one with `--project`:

```bash
pnpm test:run --project frontend src/hooks/use-history.test.ts
pnpm test:run --project worker -t "cache hit"
pnpm test:run --project browser
```

`frontend` runs in jsdom with MSW at the network boundary. `worker` runs in
workerd via `@cloudflare/vitest-pool-workers`, with a real Cache API and real
bindings. `browser` runs in headless Chromium via Playwright and asserts nav
geometry against `getBoundingClientRect()`; it needs
`pnpm exec playwright install --with-deps chromium` once.

## Architecture

A single Cloudflare Worker ships both the SPA (static-asset binding) and three
`/api/*` endpoints. One `wrangler deploy`, one origin, no CORS, and the
WeatherAPI key never leaves the server.

The weather pipeline is split into two independently cacheable tiers so the hero
can paint without waiting for the full payload:

- `GET /api/weather` → current conditions, LCP-critical (10 min edge TTL)
- `GET /api/weather/forecast` → days, hourly, astro, alerts and AQI (1 h edge
  TTL). Asks upstream for `days=3`, which is the free-key cap, so `forecast`
  carries up to 3 days starting with today and `ForecastCard` renders whatever
  arrives — one column per day, each with its own precipitation line.
- `GET /api/search` → autocomplete (no edge cache; 60 s client-side `staleTime`
  in `useSuggestions`)

Contracts that span multiple files:

- **`WeatherTier` is named once, in `src/lib/tiers.ts`.** The union
  `"current" | "forecast"` plus `WEATHER_TIER_PATHS` is the only shared spine.
  `SERVER_TIERS` (`src/worker/tiers.ts`) keys per-tier TTL and upstream fetch;
  `CLIENT_TIERS` (`src/hooks/use-weather.ts`) keys stale/gc/refetch. Both are
  `Record<WeatherTier, …>`, so adding or renaming a tier is a one-row change on
  each side that TypeScript propagates. One `createTierHandler(tier)` factory
  produces both Worker handlers.
- **DTO shapes defined once, in zod.** `src/lib/schemas.ts` is the single source
  of truth. The Worker value-imports the schemas to validate the two weather
  responses; the frontend type-imports only, so zod is tree-shaken out of the
  client bundle. The frontend never sees the vendor's schema — swapping
  providers is one file in the Worker.
- **Display strings are formatted on the Worker, in both unit systems.** Every
  display quantity is a `MeasurePair` — `{ metric, imperial }`, each a
  `{ text, value, suffix, spoken }`. The client picks one with
  `read(pair, system)` from `src/lib/units.ts`; it does no conversion and no
  arithmetic. `airComfort` and `beaufort` run Worker-side too
  (`src/worker/air-comfort.ts`), because a classification must read one
  canonical field — the published Beaufort tables are rounded independently per
  unit, so classifying per display system would change the word when a viewer
  flips the toggle. What stays client-side is what feeds a colour, a bar width
  or an SVG angle: `pressureMb`, `uv`, `airQualityIndex`, `windDegree`,
  `humidity`, `cloud`.
- **`UnitSystem` is named once, in `src/lib/units.ts`.** The union
  `"metric" | "imperial"` keys `MeasurePair` in `schemas.ts` and the store in
  `src/hooks/use-unit-system.ts` (a persistent store over localStorage,
  defaulting from `navigator.language`'s region). Not the URL — a shared
  `?city=` link should read in the recipient's units.
- **The Worker formats what comes from the payload; the client formats what
  comes from the clock.** Every time and date in `src/components` goes through
  `src/lib/clock.ts`. Its only input is the viewer's locale —
  `navigator.language`, defaulted per function so call sites pass nothing; the
  unit system is not an input. `Intl` decides the hour cycle (`h11`/`h12` →
  `3:45 PM`, otherwise `15:45`), the day/month order and the weekday names.
  Tests pass an explicit locale as the last argument.
- **Closed error union end-to-end.** `src/lib/errors.ts` is a single table
  deriving the kind ↔ status ↔ default-message mappings. Adding a kind is a
  one-row change that TypeScript propagates. `WeatherResult` special-cases only
  `quota_exceeded` (full takeover) and `network`/`upstream`-without-data (retry
  CTA); other kinds fall through to previous-or-empty.
- **Retry policy is encoded in `src/lib/query-client.ts`.** User-meaningful
  kinds (`not_found`, `invalid_query`, `quota_exceeded`) never retry, so they
  reach the UI instantly. `network` and `upstream` retry up to 2 times with
  exponential backoff capped at 5 s. `CLIENT_TIERS` carries no per-tier `retry`
  override, so this file is the whole policy.
- **Every upstream lookup resolves through one step.** `src/worker/fold.ts`
  folds a multi-token query to ASCII before it goes upstream — WeatherAPI
  matches its index in ASCII, and `tromsø, norway` otherwise returns Norway,
  Iowa — and copies the query's diacritics back onto the name upstream returns,
  so the card still reads `Tromsø`. `src/worker/locate.ts` resolves that query
  through `search.json` to a location id once (24 h cache) and both weather
  tiers fetch `q=id:N`, so `current` and `forecast` cannot land on different
  cities. `lat,lon` from geolocation skips both steps.
- **Shared query normalization.** `normalizeQuery` in `src/lib/query.ts` is used
  by both the Worker's edge-cache key and the frontend's TanStack Query key.
  Trimmed, lowercased, internal whitespace collapsed — so `London`, `london` and
  `LONDON ` share one cache entry per endpoint, and the two sides can't drift.
- **URL is the source of truth for the active city.** `?city=…` drives every
  weather fetch via `useSearchParam` (a `useSyncExternalStore` over the URL), and
  `selectCity` in `src/lib/city-selection.ts` is its only writer. `main.tsx`
  seeds the URL from history with `replaceState` on cold load. Autocomplete is
  the only debounced surface (300 ms, in `useSuggestions`); weather fetches fire
  only on URL change.
- **`keepPreviousData` keeps the previous card visible** during a new fetch —
  see the gotcha below.
- **History via `useSyncExternalStore`** over localStorage. Every `useHistory()`
  consumer subscribes to the same in-module pub/sub; cross-tab updates ride the
  native `storage` event.
- **One persistent store, three adapters.** `createPersistentStore` in
  `src/lib/persistent-store.ts` owns the cached snapshot, the `storage` listener
  filtered on the key, the `typeof window` guards and the storage failure
  policy. History (`src/hooks/use-history/store.ts`), the unit system
  (`src/hooks/use-unit-system.ts`) and the first-run flag
  (`src/lib/first-run.ts`) each supply only a key, `decode` / `encode` and a
  `fallback`. `serverValue` is a separate option because units serve `metric`
  but default to the viewer's region.
- **The nav bar is the menu.** One `position: fixed` node carries `<nav>` when
  closed and `role="dialog" aria-modal="true"` when open, springing between the
  two geometries in `src/components/nav/contract.ts`. `<main>` takes `inert`
  while the panel is open, so there is no focus trap. The placement table and
  the pixel geometry in that file are what the `browser` project asserts.

Full design narrative lives in [`docs/architecture.md`](./docs/architecture.md);
the comfort vocabulary in [`docs/air-comfort.md`](./docs/air-comfort.md).

## Conventions enforced by tooling

- **Path alias `@/*` → `src/*`** (both Vite and TS).
- **React Compiler is on** (`babel-plugin-react-compiler`). Avoid hand-rolled
  `useMemo`/`useCallback` unless there's a measured reason — the compiler
  handles memoization.
- **Strict TS** including `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. Array/record indexing yields `T | undefined`;
  optional props can't be set to `undefined` explicitly.
- **Zod is banned from the frontend bundle.** ESLint blocks `import "zod"` in
  `src/api`, `src/hooks`, `src/components`. Shared DTO types come from
  `@/lib/schemas` via **type-only** imports; the runtime schemas and zod itself
  live on the Worker side. The rule does not catch a value import from
  `@/lib/schemas`, which pulls zod in transitively — that one is on you.
- **`src/components/ui/`** is vendored shadcn primitives — ESLint ignores it;
  don't reformat or refactor wholesale.

## Gotcha: bump `CACHE_VERSION` when changing DTO shapes

`src/worker/cache.ts` includes `CACHE_VERSION` (currently `"11"`) in every edge
cache key. If you change a shape in `src/lib/schemas.ts` without bumping it, the
previously-cached entries — still valid against the _old_ upstream schema — keep
serving from `caches.default` and render against new client expectations as
`undefined` fields. There's no automated guard; bumping is a discipline thing
whenever the DTO surface changes.

## Gotcha: `keepPreviousData` + commit-on-success effects

Both weather hooks (`useWeather`, `useWeatherForecast`) use
`placeholderData: keepPreviousData`. After a query-key change there's a window
where `query.isSuccess === true` but `query.data` still points at the
**previous** city's payload (`query.isPlaceholderData === true`). Any
`useEffect` that correlates `query.data` with the current query key during that
window will write stale data under a fresh key.

**Rule:** when gating on `query.isSuccess`, also gate on
`!query.isPlaceholderData` (or wait for `isFetching === false`). The
history-commit effect in `App.tsx` is the canonical example.
