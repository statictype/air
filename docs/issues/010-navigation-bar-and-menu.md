# Issue 010 — Navigation bar and menu

**Status:** Done
**Depends on:** —
**Source:** original item 1

Replaces the input-to-menu container transform previously filed under this
number. That brief assumed a search input in the header; this one removes it.

## Problem

`App.tsx:109` is one flex row on every breakpoint: an emoji `h1`, a full-width
`SearchBar`, a `UnitToggle`. Three properties of that arrangement are being
changed.

**The input is the largest element in the chrome and is idle most of the time.**
It occupies the full space between the mark and the unit toggle at every width.

**The chrome scrolls away.** The header is in flow inside the centred
`max-w-[1400px]` column, so search and units leave the viewport as soon as the
grid is scrolled.

**Open state is derived from input focus.** `use-search-menu.ts:70` reads
`isOpen = isFocused || isDialogOpen`. Any click on a control inside the surface
blurs the input and closes the menu — the existing rows work around this with
`onMouseDown` + `preventDefault`. A unit toggle inside the menu is not possible
under that rule.

`SearchBar` also carries a mobile overlay, a backdrop, and the
`SLIDE_XS`/`SLIDE_SM`/`SLIDE_MD` constants (56/80/96 px) that animate the input
leftward over the mark (`search-bar.tsx:56-60`, `:146-231`). All of it is
deleted here.

## Decision

A fixed bar holding three things — the mark, a search trigger, a settings
trigger — that expands into the menu.

### Geometry

Four states, three thresholds. The thresholds are Tailwind's `md`, `lg`, `xl`.

| Viewport  | Bar position | Menu       |
| --------- | ------------ | ---------- |
| < 768     | bottom       | fullscreen |
| 768–1023  | top          | fullscreen |
| 1024–1279 | left rail    | fullscreen |
| ≥ 1280    | left rail    | partial    |

`position: fixed` in all four states, over the sky layer. The bar spans the full
length of the edge it sits on and stays inset from the viewport with fully
rounded ends. `.glass-panel` treatment.

| Property        | Value                                               |
| --------------- | --------------------------------------------------- |
| Bar thickness   | 56 px                                               |
| Inset from edge | 12 px, plus `env(safe-area-inset-bottom)` below 768 |
| Control cell    | 44 × 44 (WCAG 2.5.5 Target Size (Enhanced), AAA)    |
| Cell inset      | 6 px, across the bar and at its ends                |
| Group gap       | 28 px between the search cell and the unit pair     |
| Glyph           | 20 px, `strokeWidth` 1.75                           |
| Unit letter     | 17 px                                               |
| Radius          | `rounded-full`                                      |
| Logo box        | 44 × 44                                             |
| Rail footprint  | 68 px including inset                               |

Within the bar: the mark at the leading edge, the search trigger and the unit
switch grouped at the trailing edge. On the rail that reads top and bottom
respectively.

Every element in the bar — the mark and all three controls — is a 44 px cell
with a 6 px ring inside the 56 px pill. The ring runs at the bar's ends too, so
the mark and the last control are centred on the cap they sit in.

The unit switch is `C` and `F`, two buttons in adjacent cells laid along the
bar's long axis: side by side on the top and bottom bars, stacked on the rail.
Nothing separates them; the 28 px gap to the search cell is what groups them.
No control in the bar has a background in any state; the glyphs and letters
carry `--primary` in day and `#a8c7fa` at night, and the inactive letter drops
to 35 %.

### The bar is the menu

One element with `layout`. Its box springs from the bar's geometry to the
menu's; the mark and the triggers are children that reposition inside it. The
mark stays visible in the open panel.

At ≥ 1280 the rail widens from 56 px to 420 px and keeps its full height and
inset. Below 1280 it grows to fill the viewport. Closing is the same spring
reversed and must be interruptible — reopening mid-close animates from wherever
the container currently is.

This is one node with two roles. Closed it is `<nav aria-label="Main">`. Open it
is a modal surface containing the field, the results and the units. See
Accessibility below — the role changes, the element does not.

### Panel contents

Three regions, in this order:

1. The search field, pinned at the top, with the close control.
2. `<Menu>` — recents, suggestions, location, random, clear-all. Scrolls.
3. The unit toggle, pinned as a footer row. Does not scroll away.

`menu.tsx`, `menu-model.ts`, `section-header.tsx` and `clear-all-button.tsx` are
used unchanged.

### Triggers

Both triggers render the identical panel. The only difference is initial focus:

- Search trigger focuses the field. The mobile keyboard raises.
- Settings trigger focuses the close control and leaves the field alone. The
  keyboard does not raise.

Neither trigger changes what the panel contains, its scroll position, or its
geometry.

### Open state ownership

`useSearchMenu` becomes controlled. It takes `isOpen` and `onClose`; `isFocused`
stops being the open signal and is deleted from the open condition. The nav
shell owns the state, because there are two triggers with different focus
intent and one of them never touches the input.

Blur no longer closes. The `onMouseDown` + `preventDefault` workarounds on the
menu rows can stay — they are harmless — but the unit toggle needs nothing.

The input mounts with the panel and unmounts on close. There is no field in the
closed bar, so there is no caret, selection or IME state to preserve; the
no-remount constraint the previous brief was built around does not apply. The
query value clears on close, as `close()` already does.

### Closing

The panel closes on:

- the close control
- `Escape`
- a click on the scrim outside the panel
- selecting a recent, a suggestion, or an action — subject to the hold policy
  below
- a dismiss drag

Focus returns to the trigger that opened the panel.

### Dismiss drag

Below 1280, a drag pushes the panel back into the bar it came from.

| Viewport  | Drag direction |
| --------- | -------------- |
| < 768     | down           |
| 768–1023  | up             |
| 1024–1279 | left           |
| ≥ 1280    | no drag        |

The drag maps 1:1 onto the collapse. Released past a distance or velocity
threshold it closes; otherwise it springs back open. The panel's own scroll
position takes precedence — a drag that starts on scrolled content scrolls.

### The panel holds open until the fetch settles

Selecting a result does not close the panel. It holds, with the field disabled
and a pending indicator on the selected row, until the weather query settles.

- Success: the panel collapses.
- Any error: the panel holds and renders the message inline, where
  `search-error.tsx` renders it today. `search-error-model.ts` and its tests are
  unchanged.

`not_found`, `invalid_query` and `quota_exceeded` never retry
(`query-client.ts:13-21`). A city that does not exist settles in one round trip
and its message appears immediately.

Two consequences are accepted rather than worked around:

- `network` and `upstream` do retry — twice, with backoff capped at 5 s — so a
  dead connection or a 5xx from WeatherAPI holds the panel for up to roughly
  10 s. This applies to transport failures only, never to a city that was not
  found.
- `quota_exceeded` renders its inline message while `WeatherResult` renders its
  full-page takeover behind. Below 1280 the takeover is covered. At ≥ 1280 both
  are visible; the two messages agree.

Settling is read as `!query.isFetching`. Success is read as
`query.isSuccess && !query.isPlaceholderData` — during the placeholder window
`isSuccess` is true while `data` still points at the previous city. See the
gotcha in `CLAUDE.md`.

### Accessibility

The panel is modal while open. Radix `Dialog` is not used: it portals its
content to `<body>` and owns mount and unmount, which would make the panel a
different node from the bar and reduce the growth to a crossfade between two
boxes. Modal is a behaviour contract, not a DOM structure, so it is declared on
the persistent container instead. No portal, no second element, no focus trap.

- Closed, the container is `<nav aria-label="Main">`. Open, it carries
  `role="dialog"`, `aria-modal="true"` and an accessible name. The element, the
  `layout` spring and the geometry are identical in both states.
- Each trigger carries `aria-expanded` and `aria-controls` pointing at the
  panel.
- `<main>` carries `inert` while the panel is open, so the grid leaves the tab
  order and the accessibility tree. `inert` has no visual effect — the last
  city renders at full opacity throughout, and `keepPreviousData` keeps it on
  screen until the next payload arrives.
- No focus trap is implemented. With `<main>` inert there is nothing else on the
  page to trap focus away from.
- A click anywhere outside the panel closes it. At ≥ 1280 the grid is visible
  beside the panel behind a scrim, so the first click there dismisses and a
  second click reaches the card.
- The mark stays the page's only `<h1>`, non-interactive, `aria-label="Weather"`
  as today. The hero city name stays an `<h2>`.
- `document.body` keeps `overflow-hidden` while the panel is open, as
  `search-bar.tsx:118` does now.
- `<main>` carries `aria-live="polite"` (`App.tsx:135`). While it is `inert` that
  live region is silent, so a result arriving behind the open panel does not
  announce. That is correct here and needs no change. Issue 008 plans to remove
  the `aria-live` and replace it with a dedicated live region; the two are
  compatible in either order.

### Content offset

`<main>` gets padding equal to the bar's footprint on the matching side, and
`max-w-[1400px]` centres within the remaining space rather than the viewport.

No grid breakpoint changes. At a 1280 px window the four-column layout renders
in roughly 1192 px instead of 1280 px. `grid.tsx`, `weather-skeleton.tsx` and
the eight cards are not touched.

### Reduced motion

Under `prefers-reduced-motion: reduce`:

- The panel crossfades in at its final geometry over 150 ms; the bar crossfades
  out. Nothing grows, translates or scales.
- The dismiss drag is not attached.
- The close control, `Escape` and the scrim remain, so nothing becomes
  unreachable.

Gated with `useReducedMotion()` from `motion/react`, which is already a
dependency.

Nothing is needed in `index.css`. It carries four
`prefers-reduced-motion: reduce` blocks — `:348`, `:517`, `:896` and
`:1175-1208` — and the last already disables `.rise` and `.swap-in`, replaces
`.astro-body-set` with a crossfade, and neutralises the dialog, hour-step and
`.start-action` transitions.

### Motion constants

This issue lands `src/lib/motion/constants.ts` — the springs and durations for
the expand, the collapse and the drag release. The four inline configs it
replaces are all in files this issue is already rewriting:
`search-bar.tsx:31-33` (`cancelTransition`, `cancelExitTransition`,
`layoutTransition`) and `menu.tsx:19` (`PILL_TRANSITION`).

Issue 008 adds the stagger step to it later.

### Empty state

`empty-state.tsx` gains a third `StartAction` — "Search a city" — beside "Use my
location" and "Surprise me". It opens the panel with the field focused. Without
it, a first visit with no `?city=` has no visible typing affordance. Reuses the
existing component and row; no new styles.

## Files

New directory `src/components/nav/`:

| File              | Contents                                          |
| ----------------- | ------------------------------------------------- |
| `index.tsx`       | shell, open state, trigger intent, `inert` wiring |
| `nav-bar.tsx`     | the bar, four geometries                          |
| `nav-panel.tsx`   | expanded content: field, `Menu`, units footer     |
| `nav-trigger.tsx` | icon button, `aria-expanded` / `aria-controls`    |

`src/components/search-bar/` keeps its name and its remaining files. RFC 002's
split stands.

| File                    | Change                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `search-bar.tsx`        | becomes `search-field.tsx`; overlay, backdrop, Cancel button and `SLIDE_*` constants deleted |
| `use-search-menu.ts`    | controlled: takes `isOpen` / `onClose`, drops `isFocused` from the open condition            |
| `menu.tsx`              | unchanged                                                                                    |
| `menu-model.ts`         | unchanged                                                                                    |
| `section-header.tsx`    | unchanged                                                                                    |
| `clear-all-button.tsx`  | unchanged                                                                                    |
| `search-error.tsx`      | unchanged, rendered inside the panel                                                         |
| `search-error-model.ts` | unchanged                                                                                    |
| `index.tsx`             | re-export updated                                                                            |

Outside those two directories:

- `App.tsx` — header removed, nav shell mounted, `main` gains padding and
  `inert`, `max-w` centring adjusted.
- `unit-toggle.tsx` — `collapsed` prop removed; the toggle no longer competes
  with an overlay for header width. `unit-toggle.test.tsx:18,27` updated.
- `empty-state.tsx` — third `StartAction`, one new prop.
- `src/lib/motion/constants.ts` — new. Springs and durations; the four inline
  configs at `search-bar.tsx:31-33` and `menu.tsx:19` are folded in.
- `vitest.config.ts` — third project.
- `.github/workflows/ci.yml` — browser install step.

### Documentation

- `docs/architecture.md:33-40` — the `search-bar/` file-tree entry, which still
  describes `search-bar.tsx` as "form + Input (always in flow) + mobile-overlay
  backdrop". Add the `nav/` directory.
- `docs/architecture.md:92` — the "Search bar — one Input, one state machine,
  one renderer" paragraph. Three claims in it stop being true: the input is no
  longer always in flow, the mobile overlay no longer sits below a page header,
  and the Cancel button is gone.
- `docs/rfcs/011-search-menu-unification.md` — add a status note. RFC 011's core
  result survives intact: one `<Input>`, one `useSearchMenu`, one `<Menu>`
  renderer, `buildMenuModel` as a pure ladder. What this issue supersedes is
  narrower — the mobile overlay geometry, the `SLIDE_*` slide, the Cancel
  button, and the focus-derived open model. Record which half is which so the
  RFC is not read as wholly obsolete.

## Tests

### Existing suites

`menu-model.test.ts`, `search-error-model.test.ts` and `use-search-menu.test.tsx`
pass against the controlled hook. `integration.test.tsx` and `App.test.tsx`
updated for the new entry point — searching now starts with a trigger click, not
a click into a visible input.

### New browser project

`vitest.config.ts` gains a third project running in browser mode with the
Playwright provider. Assertions are on real numbers from
`getBoundingClientRect()` and computed styles, not screenshots. No baseline
images.

The frontend project's `include` is `src/**/*.test.{ts,tsx}`, so browser specs
use a distinct suffix (`*.browser.test.tsx`) and the frontend project excludes
it. `pnpm test:run` runs all three projects, so `pnpm ci` covers the browser suite
without a script change. `.github/workflows/ci.yml` gains a
`pnpm exec playwright install --with-deps chromium` step before the existing
`pnpm test:run` at line 34.

At viewports 375, 900, 1100 and 1440:

- the bar's rect is on the expected edge, 56 px thick, inset 12 px
- the bar spans the edge minus its insets
- the panel's rect after opening — fullscreen below 1440, 420 px wide beside the
  rail at 1440
- `main` carries `inert` while the panel is open and not after it closes
- the container is one node across open and close: its `id` is stable and its
  `role` changes from `navigation` to `dialog`

### Behaviour, in jsdom

- The search trigger opens the panel with the field focused.
- The settings trigger opens the panel with the field not focused.
- Clicking the unit toggle inside the panel does not close it. This is the
  `isOpen = isFocused` regression, asserted directly.
- `Escape` closes and focus returns to the trigger that opened it.
- `not_found` produces its message after exactly one request, with no retry.
- Selecting a result holds the panel open until the query settles, then
  collapses on success and holds with an inline message on error.

## Acceptance criteria

- The bar is reachable without scrolling at every viewport.
- Opening, closing and reopening within 100 ms produces no jump.
- No horizontal overflow at 1024, 1280 and 1440; the hero stays legible at all
  three.
- Under reduced motion no element grows, translates or scales; the panel
  crossfades and the drag is absent.
- Focus never lands on content covered by the panel.
- `pnpm ci` passes, including the new browser project.
- Lighthouse stays at 99/100/100/100 (ADR 001). The bar is not in the LCP path.

## Out of scope

Branding. The logo slot renders the existing 😶‍🌫️ placeholder; the `air`
wordmark is not resolved here and `DESIGN.md:134` stays as it is.

Changing `MenuModel`, the menu's sections, or what the rows do. Moving the grid
to container queries. Changing which errors `WeatherResult` handles. Renaming
the worker, package or repository.
