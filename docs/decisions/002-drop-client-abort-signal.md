# 002 — No client-side `AbortSignal` in the API client

**Status:** accepted
**Date:** 2026-04-09

## Context

TanStack Query v5 hands each `queryFn` an `AbortSignal`, and forwarding it into
`fetch` is the idiomatic way to cancel in-flight requests when a query key
changes.

Under Vitest and jsdom on Node 24 that signal is constructed in a different
realm from the one undici brand-checks against. Node 24's undici hardened the
check and rejects the cross-realm signal, failing tests with an opaque
`TypeError` raised inside `fetch`. Node 22 has a looser check and real browsers
have one realm, so the jsdom test environment is the only place it breaks.

## Decision

`request<T>()` in `src/api/weather.ts` takes no `signal`, and the `useWeather*`
hooks destructure none out of the `queryFn` context. Fetch paths resolve against
`window.location.origin` for the same reason: undici under jsdom also stumbles
on relative URLs. `engines` stays at `>=22 <25`.

## Consequences

Cancellation matters when the cancelled work is expensive or contentious. These
`queryFn`s call the app's own Worker, which serves a cached response in roughly
10–50 ms and an uncached one in 200–400 ms — by the time cancellation
propagated, the response has arrived. `placeholderData: keepPreviousData` covers
the user-visible half of the problem, keeping the previous card on screen during
the next fetch, and that needs no network-level cancellation.

The Worker side is unaffected: it still receives `request.signal` and forwards
it upstream, so a cancelled edge request cancels the upstream call.

## Alternatives

- **Patch undici's brand check in tests.** Ties the harness to an undici
  internal.
- **Pin CI to Node 22.** Works today and lets the divergence rot; Node 24 will
  be the floor eventually.
- **Construct the signal in the realm undici expects.** Requires substituting
  the signal at `queryFn` entry, reaching into TanStack Query's internals.

## Revisit if

- TanStack Query exposes a cancellation primitive that is not realm-tied.
- Upstream latency or backpressure changes enough that cancellation buys
  something — cache-busting during typing, for instance.
- A jsdom or undici release fixes the cross-realm check.

Restoring the signal is localized: one parameter through `request()`, one option
on `fetch`, one destructure per `queryFn`.
