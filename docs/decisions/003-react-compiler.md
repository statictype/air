# 003 — React Compiler on, with ESLint as its safety net

**Status:** accepted
**Date:** 2026-04-09

## Context

React 19 ships a compiler that auto-memoizes components at build time, making
most hand-written `useMemo` and `useCallback` redundant. Its correctness checks
are not part of the compiler: they ship as rules in
`eslint-plugin-react-hooks` v7. Running the compiler without them means shipping
build-time transforms whose preconditions nothing verifies.

## Decision

- Enable `babel-plugin-react-compiler` through `@vitejs/plugin-react` in
  `vite.config.ts`.
- Lint with ESLint 10 in flat config — `typescript-eslint`, `react-hooks` v7
  with the compiler rules, `react-refresh` — and format with Prettier. Both run
  in `pnpm ci`.

The lint stack follows from the compiler. Any linter without the v7 hook rules
would leave the compiler's preconditions unchecked, and running two linters that
disagree about import order or unused variables costs more than it saves.

## Consequences

- **Don't hand-roll `useMemo` or `useCallback` for reference equality.** The
  compiler handles it. Add one only with a measured reason — a profiler trace,
  an expensive computation — and say so in a comment.
- **`react-hooks` v7 rejects patterns v6 accepted**: conditional hook ordering,
  mutation during render, identity-unstable component types. Treat its errors as
  correctness signals rather than style.
- Components must have stable identity at module scope, and anything that reads
  "now" has to derive it during render from a reactive source rather than
  calling `Date.now()` inside a hook body.

## Alternatives

- **Skip the compiler.** Cheapest, but leaves the manual memoization chains in
  place as a standing maintenance cost.
- **Compiler on, hook rules run standalone alongside another linter.** Two
  configs, two CLIs, two caches, for no gain.
- **Compiler in opt-in per-file mode.** Scatters the surface area and defeats
  the point of automatic memoization.
