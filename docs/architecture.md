# Architecture

The README covers the request path end to end. This file covers the module
layout, the contracts that span more than one file, and the traps.

## Module layout

```
src/
├── worker.ts                 Worker entry: routes /api/*, falls through to ASSETS
├── worker/
│   ├── tiers.ts              SERVER_TIERS table + createTierHandler(tier)
│   ├── search-handler.ts     GET /api/search
│   ├── weather-api.ts        Upstream client, zod validation, DTO shaping
│   ├── locate.ts             Query → upstream location id, resolved once per city
│   ├── fold.ts               ASCII folding for the match, diacritic restoration for display
│   ├── format.ts             Temperature / speed / distance / pressure → MeasurePair
│   ├── precip.ts             Precipitation pairs, and the joint zero both systems share
│   ├── air-comfort.ts        Thermal × air labeler, and the Beaufort word
│   ├── alerts.ts             Severity normalization, sort, and cap
│   ├── cache.ts              Cache API helpers and the TTL constants
│   ├── respond.ts            JSON error responses
│   ├── errors.ts             WeatherApiError
│   └── types.ts              Env binding, ErrorResponse, DTO re-exports
├── lib/                      Imported by both sides
│   ├── schemas.ts            Zod DTOs — the wire boundary
│   ├── errors.ts             Error table: kind ↔ status ↔ default message
│   ├── tiers.ts              WeatherTier union + route paths
│   ├── units.ts              UnitSystem union + read(pair, system)
│   ├── query.ts              normalizeQuery, shared by both cache keys
│   ├── query-client.ts       TanStack Query defaults and the retry policy
│   ├── clock.ts              Every time and date the client renders
│   ├── persistent-store.ts   localStorage over useSyncExternalStore
│   ├── external-store.ts     The listener primitive underneath it
│   ├── first-run.ts          The visited flag
│   ├── city-selection.ts     Intent → query → ?city=
│   ├── random-cities.ts      Pools for "surprise me" and the first-run row
│   ├── moon.ts               Moon-phase SVG geometry
│   ├── scramble.ts           The character churn played when a reading changes
│   └── motion/               Springs and durations for the nav transition
├── api/
│   ├── weather.ts            fetch wrappers; throws WeatherClientError
│   └── types.ts              Type-only re-exports + SuggestionItem
├── hooks/
│   ├── use-weather.ts        CLIENT_TIERS + useWeather / useWeatherForecast
│   ├── use-suggestions.ts    Autocomplete query, debounced
│   ├── use-search-param.ts   ?city= as a useSyncExternalStore source
│   ├── use-unit-system.ts    Persistent store, defaulted from the locale's region
│   ├── use-history/          Reducer + persistent store + hook
│   ├── use-undo.ts           Timeout-bounded pending removal
│   ├── use-reversible-history.ts  useHistory + useUndo + the toast
│   ├── use-debounced-value.ts
│   └── use-media-query.ts
├── components/
│   ├── nav/                  The bar and the panel it expands into
│   │   ├── index.tsx             Role swap, focus return, Escape, scrim, hold
│   │   ├── contract.ts           Placement table, geometry, element ids
│   │   ├── nav-bar.tsx           Mark, search trigger, unit switch
│   │   ├── nav-panel.tsx         Field + menu; mounts and unmounts with open
│   │   ├── nav-layers.tsx        The bar and panel layers, and the mark
│   │   ├── nav-unit-toggle.tsx   °C / °F
│   │   ├── pending-selection.ts  Pure: hold, close, or show the error inline
│   │   ├── use-dismiss-drag.ts   Drag-to-close
│   │   └── use-nav-placement.ts  Three matchMedia subscriptions → NavPlacement
│   ├── search-bar/           One input, one state machine, one menu renderer
│   │   ├── use-search-menu.ts     Value, selected key, commit; controlled open
│   │   ├── menu-model.ts         Pure buildMenuModel — the branching ladder
│   │   ├── menu.tsx              Renders the model; CSS-driven across breakpoints
│   │   └── search-field.tsx      Form + input + inline error
│   ├── weather/              The card grid, composed in grid.tsx
│   │   ├── hero-card.tsx         City, temperature, condition, local date and time
│   │   ├── now-card.tsx          The comfort sentence and the readings behind it
│   │   ├── hourly-card.tsx       The next 24 hours
│   │   ├── forecast-card.tsx     One column per day upstream returns
│   │   ├── astro-card.tsx        Sunrise, sunset, moon phase
│   │   ├── exposure-card.tsx     UV and AQI
│   │   ├── wind-card.tsx         Compass, speed, Beaufort, bearing
│   │   ├── pressure-card.tsx     Half-circle gauge
│   │   ├── alerts-card.tsx       Hazard warnings, absent when there are none
│   │   └── condition-icon.tsx    Condition code → icon
│   ├── weather-result.tsx    Chooses between grid, skeleton, error and empty
│   ├── ui/                   Vendored shadcn primitives; ESLint ignores this folder
│   └── …                     Empty, error and quota states; shared small pieces
├── App.tsx                   Composition, and the history-commit effect
├── main.tsx                  Root, QueryClient, URL bootstrap
└── index.css                 Tailwind v4 theme, the day and night cascades
```

## API

Three GET routes. Anything else under `/api/` returns a 404 with the same error
envelope; everything outside `/api/` goes to the asset binding, which is
configured for single-page-application fallback.

| Route                   | Query | Returns                                                | Edge TTL |
| ----------------------- | ----- | ------------------------------------------------------ | -------- |
| `/api/weather`          | `q`   | `{ location, current }`                                | 10 min   |
| `/api/weather/forecast` | `q`   | `{ forecast, hourly, astro, alerts, airQualityIndex }` | 1 h      |
| `/api/search`           | `q`   | `SuggestionItem[]`                                     | none     |

`q` is required; an empty or whitespace-only value returns `invalid_query` /
400 without calling upstream. Weather responses carry `X-Air-Cache: HIT` or
`MISS`. Errors are always `{ error: { kind, message } }` with the status the
error table gives the kind:

| Kind             | Status | Retried |
| ---------------- | ------ | ------- |
| `invalid_query`  | 400    | no      |
| `not_found`      | 404    | no      |
| `quota_exceeded` | 429    | no      |
| `upstream`       | 502    | yes     |
| `network`        | 504    | yes     |

`/api/search` is deliberately not edge-cached. The client already debounces it
and holds results for 60 s, so the upstream call rate is low, and suggestion
lists are short-lived.

## Contracts across files

**`WeatherTier` is named once, in `src/lib/tiers.ts`.** The union
`"current" | "forecast"` plus `WEATHER_TIER_PATHS` is the whole shared spine.
`SERVER_TIERS` in `src/worker/tiers.ts` keys TTL and upstream fetch;
`CLIENT_TIERS` in `src/hooks/use-weather.ts` keys stale time, gc time and
refetch-on-focus. Both are `Record<WeatherTier, …>`, so adding or renaming a
tier is one row on each side and TypeScript finds the rest. One
`createTierHandler(tier)` factory produces both Worker handlers.

**DTO shapes are defined once, in zod.** `src/lib/schemas.ts` is the source of
truth for every wire shape. The Worker value-imports the schemas to validate the
two weather responses from upstream — the search endpoint's response is passed
through unvalidated — while the frontend type-imports the inferred types only, so zod is
tree-shaken out of the client bundle and an ESLint rule blocks any runtime
import under `src/api`, `src/hooks` or `src/components`. The frontend never sees
the vendor's own schema, so changing providers is a change to the Worker alone.

**Display strings are formatted on the Worker, in both systems.** Upstream sends
imperial beside metric in one response, so the Worker formats both. Every
display quantity is a `MeasurePair` — `{ metric, imperial }`, each a
`{ text, value, suffix, spoken }`. `read(pair, system)` picks one, and returns an
em dash when the pair is absent. What stays a raw number on the wire is what
feeds a colour, a bar width or an SVG angle: `pressureMb`, `uv`,
`airQualityIndex`, `windDegree`, `humidity`, `cloud`.

**A classification reads one canonical field.** `airComfort` and `beaufort` run
Worker-side, against °C and km/h. The published Beaufort table is rounded
independently per unit — force 3 is 12–19 km/h and 8–12 mph — so a wind in the
gap between 12 mph and 13 mph would read "Gentle breeze" to one viewer and
"Moderate breeze" to another if each classified in their own display system.

**The Worker formats what comes from the payload; the client formats what comes
from the clock.** The hero ticks every second, and a string baked into a body
cached for ten minutes cannot show the current time, so every time and date in
`src/components` goes through `src/lib/clock.ts`. Its only input is the viewer's
locale, defaulted per function from `navigator.language`; the unit system is not
an input, because a °C/°F preference says nothing about whether someone reads
15:45 or 3:45 PM. `Intl` decides the hour cycle (`h11`/`h12` take `3:45 PM`,
everything else `15:45`), the day/month order and the weekday names. A locale
`Intl` rejects falls back to the runtime default rather than dashing every
string on the page. Tests pass an explicit locale as the last argument.

**`UnitSystem` is named once, in `src/lib/units.ts`.** The union keys
`MeasurePair` in `schemas.ts` and the store in `src/hooks/use-unit-system.ts`,
which defaults from `new Intl.Locale(navigator.language).region` — `US`, `LR`
and `MM` get imperial. It is not in the URL, because a shared `?city=` link
should read in the recipient's units, not the sender's. The stored string
indexes the DTO, so it is validated against the union on read.

**One normalization, two cache keys.** `normalizeQuery` in `src/lib/query.ts`
trims, lowercases and collapses internal whitespace. The Worker builds its edge
cache key from it and the client builds its TanStack Query key from it, so
`London`, `london` and `LONDON ` are one entry per endpoint on both sides and
the two cannot drift.

**The URL is the source of truth for the active city.** `selectCity` in
`src/lib/city-selection.ts` is the only writer of `?city=`. It takes a
`CitySelectionIntent` — `recent | suggestion | random | location | starter` —
resolves it to a query, writes the URL, and returns the string it committed.
Every intent resolves on a promise, including the four that are synchronous, so
callers have one ordering to handle. Because the URL write and the caller's
return value come out of one call, the query the nav panel waits for and the
query in the URL are the same string. `main.tsx` seeds the URL from history with
`replaceState` before React mounts, so a returning visitor lands on their last
city with the address bar already correct.

**One persistent store, three adapters.** History, the unit system and the
first-run flag are all `localStorage` under `useSyncExternalStore`.
`createPersistentStore` owns the parts that would otherwise be written three
times: the cached snapshot, the `storage` listener filtered on the key, the
`typeof window` guards, and the failure policy — a corrupt or rejected value
reads as absent and falls back, a failed write keeps the in-memory value. An
adapter supplies a key, `decode`/`encode`, and a `fallback`. `serverValue` is a
separate option because the two differ for units: the server snapshot is
`metric` while the client default is derived from the viewer's region.

Storage keys: `air:history:v1` (capped at 10 entries, deduped by normalized
query), `air:units`, `air:visited`. The visited flag exists because history
alone cannot distinguish a first visit from a visit that cleared its history —
both read as an empty list.

**The nav bar is the menu.** One `position: fixed` element sits on the bottom
edge below 768px, the top edge to 1023px, and a left rail above that; the panel
is fullscreen below 1280px and a 420px rail beside the grid above it. Opening
springs the box from `barGeometry` to `panelGeometry` and swaps
`<nav aria-label="Main">` for `role="dialog" aria-modal="true"` on the same node.
The placement table, the pixel geometry and the element ids live in
`src/components/nav/contract.ts` and are asserted against real
`getBoundingClientRect()` numbers by the browser test project, so a visual
treatment can change class names without invalidating them.

**Selecting a city holds the panel open until the query settles.** `resolveHold`
in `src/components/nav/pending-selection.ts` is pure: it waits for the URL to
catch up with the selection, then for the query behind it. Success collapses the
panel; any error keeps it up and renders the message inline. Because
`not_found`, `invalid_query` and `quota_exceeded` never retry, a city that does
not exist settles in one round trip.

## Styling

Tailwind v4, with one stylesheet: `src/index.css`. There are no CSS modules and
no `tailwind.config`. An `@theme inline` block maps Tailwind's `--color-*`,
`--radius-*` and `--shadow-*` names onto plain custom properties, so the palette
is edited in the `:root` block below it rather than in the theme.

Day and night are two full cascades, not a dark mode. `.night` redefines about a
dozen tokens, and which cascade is active follows the located city's local time
(`current.timeOfDay`), never `prefers-color-scheme`. `App.tsx` sets the class on
the app root _and_ mirrors it onto `<html>`, because dialogs, the scrim and the
toaster portal to `<body>` and would otherwise read the day palette on a night
page. The `dark` custom variant Tailwind expects is declared but never applied.

Anything that is a repeated surface — `.bento-tile` and its variants, the hero,
the nav surface, the hourly table, the forecast grid, the dialog chrome — is a
named class in that file rather than a utility string, because several of them
set `background`, `border` and `padding` in an unlayered rule so those
properties beat any utility regardless of source order. One custom variant,
`fc-wide`, is a two-range media query (640–767.98px or ≥1024px) marking the
widths at which a forecast day renders as a column.

Reduced motion is handled in two places: a trailing
`@media (prefers-reduced-motion: reduce)` block neutralizes the page-level
animations, and components with their own motion carry a block next to the rule
it modifies. `prefersReducedMotion()` in `src/lib/motion` covers the
JavaScript-driven paths, and it reads `matchMedia` at call time rather than at
module load because the setting can change mid-session.

## Build and type configuration

`tsconfig.json` is a solution file with three references:

- `tsconfig.app.json` — `src`, minus the Worker
- `tsconfig.worker.json` — the Worker, plus an explicit `include` list of the
  `src/lib` modules it may share: `errors.ts`, `query.ts`, `schemas.ts`. Sharing
  a fourth module means editing that list, which is what keeps browser-only code
  out of the Worker bundle.
- `tsconfig.node.json` — the two Vite config files, under looser rules than the
  other two

`vite.config.ts` runs `babel-plugin-react-compiler` through
`@vitejs/plugin-react`, mounts the Worker with `@cloudflare/vite-plugin` so dev
and production take the same path, and splits `@tanstack/react-query` and
`radix-ui` into their own vendor chunks.

## Traps

### `keepPreviousData` and any commit-on-success effect

Both weather hooks use `placeholderData: keepPreviousData` so the previous card
stays on screen while a new fetch is in flight. That leaves a window in which
the tuple `(isSuccess, data, activeQuery)` is inconsistent:

- `activeQuery` has already flipped to the new city, because the URL changed
- `query.isSuccess` is still `true`
- `query.data` still points at the **previous** city's payload
- `query.isPlaceholderData` is `true` until the new fetch resolves

Any code that commits a derived value from `query.data` keyed by `activeQuery`
during that window writes stale data under a fresh key — the new city's query
alongside the old city's display name.

**Rule:** when gating a `useEffect` on `query.isSuccess`, also gate on
`!query.isPlaceholderData`, or wait for `isFetching === false`. `isSuccess`
alone is not enough. The history-commit effect in `App.tsx` is the one live
instance.

### `CACHE_VERSION` and DTO changes

`src/worker/cache.ts` puts `CACHE_VERSION` in every edge cache key. Change a
shape in `src/lib/schemas.ts` without bumping it and entries cached against the
old shape keep serving from `caches.default` for up to their TTL, rendering as
`undefined` fields against the new client. Nothing enforces this; bump it
whenever the DTO surface changes.

### Zod in the frontend bundle

The ESLint rule catches a direct `import "zod"` under `src/api`, `src/hooks` and
`src/components`, but nothing catches a _value_ import from `@/lib/schemas`,
which pulls zod in transitively. Imports from that file must be `import type`.
There is no automated bundle-size check.
