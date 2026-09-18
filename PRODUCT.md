# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A person who wants to know the weather in a named city — their own, or one they
are curious about. They arrive with no account, no setup, and usually one
question. Typical session: type a city, read the answer, leave. Returning visits
reopen the last city automatically.

## Product Purpose

Answer "what is the weather like in X" quickly and completely, then get out of
the way. Success is a correct, legible answer on first paint with no
configuration step, and enough depth — forecast, hourly, astro, air comfort —
that the user does not need a second app.

## Positioning

Two things a neighboring weather app could not truthfully copy:

- **Two-axis air comfort.** Conditions are described as a sentence built from
  thermal (feels-like temperature, 9 labels) × air (dew point, 7 labels, plus a
  damp override at `tempC < 12 AND humidity > 80`). The sentence leads the Now
  card — it is the answer, not a caption on it. `Comfortable` is the one
  evaluative word and is spoken only where the thermal band allows it:
  `Warm and comfortable`, `Hot but comfortable`, and at the extremes the thermal
  label alone. See `docs/air-comfort.md` and `src/worker/air-comfort.ts`.
- **A URL that is the state.** `?city=…` is the single source of truth for the
  active city. Every view is linkable and shareable; there is no internal
  "current city" that the address bar lags behind.

## Operating Context

- One-shot lookups from a search field. Autocomplete fires 300 ms after idle
  typing at a 3-character minimum; the weather fetch fires only on an explicit
  selection — a suggestion, a recent city, geolocation, or "surprise me".
- Both mobile and desktop are first-class. One nav element carries the bar and
  the search panel at four placements, and the menu inside it is one component
  whose breakpoint differences are CSS rather than a variant prop.
- The rendered surface changes with the location's local time: a `night` class
  on the root swaps the sky and the tile surfaces.
- Recent cities persist in `localStorage` and sync across tabs via the native
  `storage` event. Removal and clear-all are undoable via toast.

## Capabilities and Constraints

Shipped: current conditions, future-day forecast, next-24h hourly strip,
sunrise/sunset/moon phase, pressure/UV/AQI, hazard alerts, location-local time,
city autocomplete, geolocation lookup, random-city pick, recent-city history
with undo, and a metric/imperial switch.

Constraints:

- **No accounts, no server-side user data.** History lives in `localStorage`;
  the URL carries the active city. Binding.
- **Free WeatherAPI.com tier.** The key caps `forecast.json` at 3 days total,
  so the forecast card shows today plus 2. Edge caching — 10 min on `current`,
  1 h on `forecast` — keeps the deployment inside quota. When quota is exhausted
  the app shows a dedicated explanatory state rather than an error page, which
  is a state real users can hit.
- Single Cloudflare Worker serves both the SPA and the three `/api/*` endpoints;
  one origin, no CORS, upstream key never reaches the browser.
- Stack is fixed by the existing codebase: React 19 with the React Compiler on,
  Vite, Tailwind v4, vendored shadcn primitives in `src/components/ui/`, TanStack
  Query, Motion, Sonner, and zod on the Worker side only — it is banned from the
  client bundle.
- Terminology is defined once in `CONTEXT.md`. Use those words.

## Brand Commitments

Binding:

- **The day/night sky treatment is the product's signature**, not decoration. It
  is driven by the location's local time, not the viewer's OS preference.
- **Color never carries a reading that words are not already carrying.** Not
  comfort, not temperature, not air quality. Air comfort is expressed in words.
  The severity ramp on hazard alerts is the single exception, and even there the
  hue never carries the severity alone.
- **Lighthouse 99 / 100 / 100 / 100** (performance / accessibility / best
  practices / SEO, desktop, `pnpm preview`) is a standing floor. No design
  change may regress it. The one missing performance point is accepted and
  closed — see `docs/decisions/001-lighthouse-ceiling.md`.

**The name is `air`**, with a drawn wordmark as the mark. `DESIGN.md` holds the
visual specification.

Voice, as written today: plain, lowercase-leaning, mildly self-aware, never cute
about data. "What's the weather like?" / "Search a city to find out" / "Free
tier exhausted". This is incumbent evidence rather than a stated commitment.

## Evidence on Hand

- Live deployment: `air.drifting.workers.dev`
- Measured Lighthouse run with per-metric values:
  `docs/decisions/001-lighthouse-ceiling.md`
- Architecture: `docs/architecture.md`; glossary: `CONTEXT.md`
- Test suite across three Vitest projects: jsdom, headless Chromium, and real
  workerd

Absent — do not fabricate: users, usage numbers, testimonials, press, customers,
pricing, uptime or reliability claims, and any team beyond the single author.

## Product Principles

1. **The answer arrives before the interface does.** Current conditions are
   LCP-critical and paint from their own endpoint; forecast and hourly stream in
   behind. Nothing that can wait may block the first answer.
2. **The URL is the state.** Every view is linkable. No hidden active-city
   state, no address bar that lags the screen.
3. **Degrade honestly, at the right layer.** The server reports failures
   truthfully; the render layer decides what is fatal. Quota exhaustion gets its
   own explained state. No silent fallbacks, no invented data.
4. **Describe the weather, don't just report it.** The two-axis comfort sentence
   is the product's point of view; raw numbers stay available alongside, never
   instead. The sentence says only what the reading supports: it never calls
   40 °C comfortable.
5. **One source of truth per concept.** Tiers, DTOs, error kinds, query
   normalization and the unit system are each named once and propagated by
   TypeScript. Design work that duplicates one of them is wrong even if it looks
   right.

## Accessibility & Inclusion

- **WCAG 2.2 AA** is the target. The Lighthouse accessibility score of 100 is a
  floor of automated checks, not the requirement.
- **`prefers-reduced-motion` is a hard requirement** given the animated sky and
  the nav transition. It is honored in three layers: a trailing media block in
  `src/index.css`, `MotionConfig reducedMotion="user"` at the app root, and
  `prefersReducedMotion()` for the JavaScript-driven character churn. New motion
  extends that pattern rather than bypassing it.
- Contrast must hold in both the day and night cascades, including text
  composited over the sky layer. Every app surface sits on a `backdrop-filter`,
  so the composited ground is not a value an automated checker can read off the
  element — measure by hand.
