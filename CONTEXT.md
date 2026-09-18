# Ubiquitous language

The terms this codebase uses in names, comments and docs. One meaning each. If
you need the mechanism rather than the definition, follow the pointer —
[`docs/architecture.md`](./docs/architecture.md) holds the contracts,
[`docs/air-comfort.md`](./docs/air-comfort.md) the labeling vocabulary.

## Data

**Weather tier** — one of two independently cacheable slices of the weather
payload, `current` and `forecast`. The `WeatherTier` union in `src/lib/tiers.ts`
names them; `SERVER_TIERS` and `CLIENT_TIERS` are both records keyed by it.

**Measure pair** — `{ metric, imperial }`, each side a
`{ text, value, suffix, spoken }`. Every display quantity crosses the wire as
one. `read(pair, system)` picks a side and returns an em dash when the pair is
absent.

**Normalized query** — a city query trimmed, lowercased, and with internal
whitespace collapsed. Produced by `normalizeQuery` in `src/lib/query.ts` and
used as both the Worker's edge-cache key and the client's TanStack Query key.

**Resolved location** — the `id:N` string both weather tiers fetch, produced by
`resolveLocation` from a folded query and cached 24 h. Distinct from the query,
which is what the viewer typed.

**Suggestion** — an autocomplete row from `/api/search`. Distinct from a history
item, which is a city that was actually selected.

**History item** — a previously selected city, persisted to `localStorage` as
`{ id, query, displayName, addedAt }`. `displayName` exists so the recent list
can read `Berlin, Germany` rather than whatever string was typed.

## State and flow

**Active city** — the city currently rendered. It lives in the URL's `?city=`
parameter and nowhere else; `useSearchParam("city")` reads it and every weather
fetch keys off it.

**City selection** — turning an intent into the active city. `selectCity` in
`src/lib/city-selection.ts` is the only writer of `?city=`. It takes a
`CitySelectionIntent` — `recent | suggestion | random | location | starter` —
resolves it to a query, writes the URL, and returns what it committed, or `null`
when the intent produced no city.

**Pending selection** — the nav panel's hold on a selected row, in
`src/components/nav/pending-selection.ts`. The panel stays open until the URL
catches up with the selection and the query behind it settles.

**Placeholder-data window** — the window between a query-key change and the new
fetch resolving, during which `query.isSuccess` is `true` while `query.data`
still holds the previous city's payload.

**Commit-on-success** — any effect that derives state from `query.data` once
`isSuccess` flips. Every one must also gate on `!isPlaceholderData`. The
history-commit effect in `App.tsx` is the only live instance.

**Reversible history** — the destructive-action pattern in
`useReversibleHistory`: mutate, stage for undo, fire the toast, wire the restore
callback. App.tsx gets one function per action. Sonner is hard-wired here and in
`city-selection.ts`; nothing else in the app raises a toast.

**Persistent store** — a `localStorage`-backed `useSyncExternalStore` source
built by `createPersistentStore`. Three exist: history, the unit system, and the
first-run flag.

## Errors

**Kind** — a member of the closed union in `src/lib/errors.ts`:
`invalid_query | not_found | quota_exceeded | upstream | network`. Every error
the Worker emits or the client renders carries one.

**Vendor code** — a WeatherAPI.com numeric error code such as `1006` or `2007`,
mapped to a kind by `UPSTREAM_CODE_TO_KIND` in `src/worker/weather-api.ts`.
Unknown codes collapse to `upstream`, so no vendor-specific kind leaves the
Worker.

## Vocabulary

**Thermal label** — one of nine labels driven by feels-like temperature, from
`Very cold` to `Dangerously hot`.

**Air label** — one of seven labels driven by dew point, from `Very dry` to
`Very humid`, plus the damp override.

**Damp override** — when `tempC < 12` and `humidity > 80`, strict on both, the
air label becomes `Damp` whatever the dew point says.

**Comfort sentence** — the joined pair, `Warm and slightly humid`. `Comfortable`
is the one evaluative word and is spoken only where the thermal band licenses
it.

## Surfaces

**Hero** — `HeroCard`. City, temperature, condition, and the location's local
date and time. It is the LCP element and paints from the `current` tier alone.

**Now card** — `NowCard`. The comfort sentence, then the readings behind it.

**Nav** — one `position: fixed` element that is the bar when closed and the
search panel when open. **Placement** is its resolved position for a viewport
width: the `NavPlacement` record of bar edge, panel mode and drag axis.

**Menu model** — the pure `buildMenuModel` ladder in
`src/components/search-bar/menu-model.ts`: recents, keep-typing, suggestions,
no-results, actions. `<Menu>` renders it; breakpoint differences are CSS, not a
variant prop.

**Label vocabulary** — the two small-uppercase classes in `src/index.css`.
`.label-section` for tile headers, `.label-sub` for subordinate labels inside a
tile. They differ by size alone and both sit at 70% foreground, which is the
floor that holds against the day tile gradients. Add a label by using one of
them, not by writing a third inline treatment.

## Infrastructure

**Edge cache** — Cloudflare's `caches.default`, used by the Worker to memoize
successful weather responses per tier, keyed by
`buildCacheKey(path, normalizedQuery)`.

**Cache version** — the `CACHE_VERSION` string in `src/worker/cache.ts`,
included in every edge-cache key. Bump it whenever a DTO shape changes.

**Wire boundary** — the network seam between Worker and frontend. DTOs are
defined once in `src/lib/schemas.ts`; the Worker value-imports the schemas, the
frontend type-imports only.
