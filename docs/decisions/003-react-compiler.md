# 003 — React Compiler on, Biome → ESLint + Prettier

**Status:** accepted
**Date:** 2026-04-09

## Context

Two tooling changes shipped together in commit `ae1c17f` because the second
exists to support the first:

1. **React Compiler.** React 19 ships with the new compiler (formerly
   "React Forget") that auto-memoizes components at build time, making
   most hand-rolled `useMemo` / `useCallback` redundant.

2. **Lint stack.** Biome was in place from `phase 2` (tooling baseline)
   for both lint and format. The React Compiler's correctness checks
   ship as `eslint-plugin-react-hooks` v7 rules — there is no Biome
   equivalent. Keeping Biome would mean shipping the compiler without
   its safety net.

## Decision

- Enable `babel-plugin-react-compiler` via `@vitejs/plugin-react` (see
  `vite.config.ts`).
- Replace Biome with **ESLint 10** (flat config, `typescript-eslint`,
  `react-hooks` v7 with the compiler rules, `react-refresh`) for lint,
  and **Prettier** for formatting.
- Drop manual `useCallback` / `useMemo` where they only existed to satisfy
  reference-equality concerns the compiler now handles. App.tsx,
  useHistory, useUndo were the main offenders.

## Compiler-rule violations fixed along the way

The new lint surfaced several patterns the compiler couldn't safely
optimize. Each fix was minor but worth listing because the _shape_ of
these fixes is what the compiler asks of new code:

- **Conditional hooks / non-stable component identity.** `weather-card`
  defined `ConditionIcon` inline; pulled to module scope and renders one
  of the existing lucide icon refs via `createElement`.
- **Reading "now" during render via a non-reactive source.** `useLocalTime`
  previously read `Date.now()` inside a hook; rewritten to derive the time
  during render with a tick counter so the compiler can reason about it.
- **Auto-load effect with derived state.** App.tsx originally seeded
  `activeQuery` / `source` from a `useEffect`; replaced with a lazy
  initializer on `useState` reading `getHistorySnapshot()`. Removed the
  hand-rolled `lastResult` cache in favour of TanStack Query's
  `placeholderData: keepPreviousData`.

## Why not keep Biome and add ESLint just for the compiler rules?

Running two tools that disagree on subtler issues (import ordering, unused
variables, semicolons) is a maintenance tax that surfaces as CI flakes and
auto-fix conflicts. ESLint + Prettier covers everything Biome was doing
plus the compiler rules in one stack, and Prettier's project-wide adoption
makes it the path of least surprise for contributors.

## Day-to-day implications

- **Don't hand-roll `useMemo` / `useCallback` for reference equality.**
  The compiler handles it. Add one only when there's a measured reason
  (profiler trace, expensive computation) and document why inline.
- **`pnpm lint` is ESLint.** `pnpm format` / `pnpm format:check` is
  Prettier. Both run in CI (`pnpm ci`).
- **`react-hooks` v7 with the compiler rules will reject patterns the
  v6 ruleset accepted** — conditional hook ordering, mutation during
  render, identity-unstable component types. Treat its errors as
  correctness signals, not stylistic noise.

## Alternatives considered

- **Stay on Biome, skip the compiler.** Cheapest, but leaves the
  ergonomic wins on the table — the manual `useCallback` chains in
  App.tsx and the hook files were a real maintenance burden.
- **Compiler on, Biome for everything else, run `eslint-plugin-react-hooks`
  standalone.** Possible but odd: two configs, two CLIs, two cache
  directories. Rejected as unnecessary complexity.
- **Compiler in opt-in mode (per-file directive).** The compiler is
  designed to be on by default; opt-in scatters the surface area and
  defeats the auto-memoization story. Rejected.
