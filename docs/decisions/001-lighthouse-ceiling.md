# 001 — Stop Lighthouse performance at 99

**Status:** accepted
**Date:** 2026-04-09

## Context

Production Lighthouse on desktop, against `pnpm preview`, is stable across three
runs:

```
Performance 99 · Accessibility 100 · Best Practices 100 · SEO 100
FCP 0.7 s · LCP 0.7 s · TBT 0 ms · CLS 0.004
```

The gap is a single point. FCP and LCP both score 0.98 despite displaying 0.7 s,
because simulated throttling measures a raw value near 0.8 s. Weighted:
`0.1·0.98 + 0.25·0.98 + 0.3 + 0.25 + 0.1 = 0.993`, which rounds to 99.

Render-blocking CSS is the only thing Lighthouse still flags. Everything else is
measurement noise.

## Decision

Ship at 99. Treat it as a floor no change may regress, and do not pursue the
last point.

## Alternatives

- **Inline critical CSS.** Would likely take FCP and LCP to 1.0, but the 57 KB
  Tailwind bundle is hard to subset correctly, and getting it wrong causes a
  flash of unstyled content — worse than a 99.
- **Build-time prerender with `renderToString` + `hydrateRoot`.** Roughly 50
  lines plus a hydration audit of `useSearchParam` and `useHistory` for their
  browser-only reads. Not guaranteed to reach 100 either: the render-blocking
  CSS still has to download before paint.
- **Runtime SSR on the Worker.** The same ceiling as a prerender, with
  streaming, an entry-server and hydration edge cases attached.
- **Move to Next.js.** A rewrite rather than a fix, and it would not reach 100
  for free.
