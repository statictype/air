# Testing

```bash
pnpm test         # watch
pnpm test:run     # once
```

The browser project drives a real Chromium through Playwright. Install it once:

```bash
pnpm exec playwright install --with-deps chromium
```

## The three projects

Vitest is configured as three projects in `vitest.config.ts`, so a single run
covers three environments. Target one with `--project`:

```bash
pnpm test:run --project frontend src/hooks/use-history.test.ts
pnpm test:run --project worker -t "cache hit"
pnpm test:run --project browser
```

**`frontend`** runs in jsdom and covers the React app, the hooks and the API
client. Mocking happens at the network boundary through MSW, so the real fetch
path is exercised. The shared server (`src/test/msw-server.ts`) starts with
`onUnhandledRequest: "error"`, which means any code path that fetches without a
matching handler in `src/test/msw-handlers.ts` fails loudly instead of hanging —
add a handler when you add a fetch.

**`worker`** runs in workerd through `@cloudflare/vitest-pool-workers`: real
runtime, real Cache API, real bindings, no Node-side simulation. It uses
`wrangler.test.jsonc`, which mirrors `wrangler.jsonc` but omits the static-asset
binding so tests don't need a prior `pnpm build`.

**`browser`** runs in headless Chromium and exists for the nav geometry, which
is the one thing jsdom cannot answer. Assertions read numbers back off
`getBoundingClientRect()` and computed styles. There are no screenshots and no
baseline images, so the suite doesn't break when a colour changes.

## What's covered

- **Worker endpoints**, per route. `/api/weather` carries the bulk: happy path
  with the shaped DTO and `X-Air-Cache: MISS`, upstream code 1006 →
  `not_found` / 404, code 2007 → `quota_exceeded` / 429, a structurally broken
  body → `upstream` / 502 with no vendor field names leaked, unknown upstream
  codes → generic `upstream` / 502, empty query → `invalid_query` / 400 with no
  upstream call, a `HIT` on the second call, and casing and whitespace
  normalization. `/api/weather/forecast` repeats the shape, cache, empty-query
  and schema-rejection paths and asserts the `days=3` upstream request. An
  unmatched `/api/` path 404s without calling upstream.
- **Worker pure modules**: ASCII folding and diacritic restoration, the two-axis
  comfort labeler, alert severity normalization, precipitation pair rounding,
  and the `MeasurePair` formatters.
- **Hooks that hold branching logic**, exhaustively: `useHistory`, `useUndo`,
  `useDebouncedValue`, `useSearchParam`, `useUnitSystem`, `useWeather` and
  `useWeatherForecast`.
- **Shared lib modules**: the error table's status round trip, query
  normalization, schema parsing, clock formatting against explicit locales, the
  persistent store's failure policy, moon geometry, and the scramble frame.
- **The frontend API client**, per error kind, through MSW.
- **Integration** (`src/integration.test.tsx`) runs the URL → fetch → render →
  history → undo flow against the real composition. Most render assertions
  navigate by setting `?city=` rather than clicking through autocomplete —
  that mirrors how people actually arrive, through a link or a bookmark, and
  keeps the tests decoupled from the search UI. One test covers the
  suggestion-click path.
- **Nav geometry**, in the browser project, against the placement table in
  `src/components/nav/contract.ts`.

## What isn't

Per-component unit tests are mostly avoided: they tend to re-implement the
component in the test and then break on every refactor without catching a real
bug. The hook tests, the lib tests and the integration test cover the behavior.
The exceptions are components whose logic is a lookup table or a pure model —
`condition-icon`, `alerts-card`, `forecast-card`, `hourly-card`, `precip-strip`,
`unit-value`, `menu-model` and `pending-selection`.

Nothing tests against the live WeatherAPI. Every upstream response in the suite
is a fixture.

## Dev-only fixtures

The alerts card only appears when a city has an active hazard warning, which
makes it hard to look at. In a dev build, `?alerts=one|mixed|sparse|long|full`
substitutes a hand-written set covering the severity range, missing fields and a
long multi-paragraph description. The fixtures live in
`src/components/weather/alerts-demo.ts` behind an `import.meta.env.DEV` guard and
ship no bytes to production.
