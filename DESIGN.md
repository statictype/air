---
name: air
description: A view onto one city's sky, read through frosted panes that track that city's local time.
colors:
  # The spine — light to dark.
  frosted-pane: "oklch(0.9750 0.0180 235)"
  sky-day-zenith: "#D2EEF9"
  sky-day-horizon: "#B4D9EF"
  lamp: "#00C4FF"
  azure: "#0080FF"
  primary: "#1866E1"
  hero-deep: "#1E4ABB"
  hero-night: "oklch(0.1871 0.0557 253.85)"
  hero-night-deep: "oklch(0.1176 0.0289 243.78)"
  sky-night-zenith: "oklch(0.1350 0.0100 250)"
  sky-night-horizon: "oklch(0.1150 0.0080 245)"
  # The Now pane.
  now-day: "#BFEAFF"
  now-day-deep: "#A4D6FF"
  now-night: "oklch(0.2200 0.0500 210)"
  now-night-deep: "oklch(0.1500 0.0600 218)"
  # The four astro skies.
  sun-day-sky: "oklch(0.9000 0.0700 280)"
  sun-day-horizon: "oklch(0.9600 0.0500 80)"
  sun-day-bloom: "oklch(0.9600 0.0900 60)"
  moon-day-sky: "oklch(0.9000 0.0500 280)"
  moon-day-horizon: "oklch(0.9700 0.0120 250)"
  moon-day-bloom: "oklch(0.9700 0.0150 250)"
  sun-night-sky: "oklch(0.2000 0.0400 270)"
  sun-night-horizon: "oklch(0.1300 0.0300 260)"
  sun-night-bloom: "oklch(0.3200 0.0600 270)"
  moon-night-sky: "oklch(0.1900 0.0220 258)"
  moon-night-horizon: "oklch(0.1250 0.0180 250)"
  moon-night-bloom: "oklch(0.3400 0.0250 250)"
  # Ink, rules, focus.
  wet-slate: "oklch(0.2600 0.0700 245)"
  night-ink: "oklch(0.9500 0.0080 240)"
  smoked-glass: "oklch(0.1300 0.0080 250)"
  hairline: "oklch(0.9288 0.0126 255.5078)"
  focus-violet: "oklch(0.5854 0.2041 277.1173)"
  # Warm.
  signal-red: "oklch(0.6368 0.2078 25.3313)"
  sev-extreme: "oklch(0.4850 0.2150 22)"
  sev-severe: "oklch(0.5650 0.2150 32)"
  sev-moderate: "oklch(0.7340 0.1790 56)"
typography:
  display:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "2.125rem → 3.5rem"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 300
    lineHeight: 1.25
    letterSpacing: "-0.055em"
  title:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 300
    lineHeight: 1.375
    letterSpacing: "-0.055em"
  figure:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.055em"
  body:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.03em"
  caption:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.03em"
  label:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.18em"
  label-sub:
    fontFamily: "Work Sans, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  well: "0.75rem"
  control: "1rem"
  tile: "1.75rem"
  hero: "2rem"
  panel: "2.25rem"
  pill: "999px"
spacing:
  base: "0.25rem"
  tile-pad: "1.25rem"
  tile-pad-sm: "1.5rem"
  hero-pad: "1.5rem"
  hero-pad-xl: "3rem"
  page-x: "1.25rem"
  page-x-sm: "2rem"
components:
  tile:
    textColor: "{colors.wet-slate}"
    rounded: "{rounded.tile}"
    padding: "{spacing.tile-pad}"
  tile-now:
    backgroundColor: "{colors.now-day}"
    textColor: "{colors.wet-slate}"
    rounded: "{rounded.tile}"
    padding: "{spacing.tile-pad}"
  hero:
    backgroundColor: "{colors.azure}"
    textColor: "#ffffff"
    rounded: "{rounded.hero}"
    padding: "{spacing.hero-pad}"
    typography: "display"
  search-surface:
    textColor: "{colors.wet-slate}"
    rounded: "{rounded.tile}"
    padding: "0.75rem 1.25rem"
    typography: "title"
  panel:
    textColor: "{colors.wet-slate}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-ghost:
    textColor: "{colors.wet-slate}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  tab-button:
    textColor: "{colors.wet-slate}"
    rounded: "{rounded.pill}"
    height: "2.25rem"
---

# Design System: air

> **The mark.** The nav carries a drawn wordmark: a filled disc with `air` set in
> white lowercase and a bank of clouds
> across the bottom third. It ships as two raster assets, `src/assets/logo.webp`
> and `logo-night.webp`, at 189 × 192 — the day disc runs `#55BDFC` → `#79DAFE`
> with white clouds, the night disc `#0E111C` → `#0E182D` with clouds at
> `#2F3644`, and the wordmark is white in both. `.nav-mark-day` /
> `.nav-mark-night` crossfade them over `0.42s` on the same easing the nav
> surface uses. They are two assets rather than one under a filter because
> reaching the night bar's L 0.16–0.22 needs `brightness(.2)`, which drags the
> white wordmark down to L 0.28.
>
> The mark sits in a 48 px box, the size of the search button (`LOGO_BOX` in
> `components/nav/contract.ts`), which the nav geometry reads — changing the box
> changes the layout. It is the page's `<h1>`, labelled `air`. Below `lg` it is
> the centred first row of the content column; at `lg` and wider it is fixed at
> the top-left, on the controls' centre line.

## Overview

**Creative North Star: "The Window Seat"**

The page is a view onto one city's actual sky. A fixed, full-bleed gradient sits
behind everything and crossfades over 1.2 s between a day and a night
composition, driven by that city's local time — never the viewer's OS
preference. That layer is the subject. Everything above it is the pane you read
the subject through.

Every surface therefore admits some of what is behind it: the tiles, the nav
bar, the search panel and every dialog are translucent, blurred and
saturated (`backdrop-filter: blur(20–28px) saturate(140–160%)`). Two surfaces
are exempt, and both because they are pictures rather than panes — the hero,
which is the view itself, and the astro tile, which draws a sky of its own.

**Key Characteristics:**

- One typeface (Work Sans) at 300, 400 and 500, on eight size rungs.
- Two ink levels: `foreground` and `foreground/70`. Nothing between them.
- Hierarchy is size, then weight. Never opacity.
- One blue ladder of eleven steps; `#0080FF` is the brand step and holds the hero.
- Cool blue-violet is the only hue family; severity and the sun's astro sky are the exceptions.
- The hero is lit from the lower right. Night is lit by a diagonal sheen.

## Colors

The palette is one blue read from the top of a daylit sky to the bottom of a
night one, plus four small skies drawn inside the astro tile and one warm ramp
for hazard. Nothing else. Every value below is OKLCH or its exact hex; the
frontmatter is normative and no value is restated here.

### The spine

Eleven steps of a single blue, ordered by lightness. The whole app is cut from
this ladder, so a new surface picks a step rather than mixing a colour.

| Step                | L     | Where it lands                                        |
| ------------------- | ----- | ----------------------------------------------------- |
| `frosted-pane`      | 0.975 | The day page ground and the `background` token        |
| `sky-day-zenith`    | 0.932 | Day sky, at the radial's origin above the fold        |
| `sky-day-horizon`   | 0.866 | Day sky, at its outer edge                            |
| `lamp`              | 0.767 | The single day light (see below)                      |
| `azure`             | 0.615 | The hero's lit face — the largest colour in the app   |
| `primary`           | 0.541 | The hero's lower-left radial, and the `primary` token |
| `hero-deep`         | 0.455 | The hero's upper-left corner, under the city name     |
| `hero-night`        | 0.187 | Night hero, lower right                               |
| `hero-night-deep`   | 0.118 | Night hero, upper left                                |
| `sky-night-zenith`  | 0.135 | Night sky, top                                        |
| `sky-night-horizon` | 0.115 | Night sky, bottom                                     |

`azure` is `#0080FF` exactly. It is the colour the app is recognised by: it holds
most of the hero, and the hero is the widest element at every breakpoint. Treat
it as the brand colour and `primary` as the contrast-safe step below it.

The logo's disc sits higher on the ladder, at the lamp's lightness (`#55BDFC` →
`#79DAFE`, L 0.76 → 0.84) — a 44 px mark needs the blue that reads at 44 px, not
the one that reads across a hero.

**Primary is a step of the spine, not a colour beside it.** `primary`
(`#1866E1`) is the same radial that already sits in the hero's lower-left
corner. It carries the `primary` token — filled buttons, links, selection — and
white on it measures 5.22:1. `azure` cannot take that job: white on `#0080FF` is
3.80:1, under the AA floor. One ramp, two jobs, one step apart.

`primary` fills exactly one control in the shipped app, the error state's retry.
The only other filled button is the clear-history confirm, which takes
`destructive`.

### The lamp

**One day light, at one value.** `lamp` (`#00C4FF`) is parked past the hero's
lower-right corner as a radial at `0.46` peak alpha. It lights the hero and
nothing else. Panes are lit by their own gradient and by the 1 px white rim,
not by the lamp.

### The panes

Panes are near-colourless: `.bento-tile` runs white → `oklch(0.97 0.03 230)` in
day and `oklch(0.17 0.012 255)` → `oklch(0.15 0.015 260)` at night. Chroma at or
below 0.04, in both cascades.

**The Now tile is the one pane with a hue of its own**, because it carries the
answer. It is built the same way in both cascades — a single `160deg` gradient,
the same geometry `.bento-tile` uses, with no lamp and no second layer:

- **Day** `now-day` → `now-day-deep`. Lightness 0.92 → 0.86, hue 246 → 252, so
  the pane sits in the hero's own family at pane lightness. The far stop is the
  binding one: the metric row labels print over it at 70% ink and measure
  4.68:1.
- **Night** `now-night` → `now-night-deep`, then `filter: grayscale(20%)` over
  the whole tile. Lightness 0.22 → 0.15, hue 210 → 218. It reads as a lit pane
  because it is brighter than the plain night tiles at the top and sinks past
  them at the bottom.

**The Now tile is the plain tile with the hue turned up and the fall made
steeper.** Against its own cascade's `.bento-tile` it triples the chroma and
opens the lightness travel from ~0.02 to ~0.06. Which way the hue turns is not
symmetric: night pulls 45° toward cyan, day pulls 20° toward the hero. At L 0.2
a cyan pull reads as lit; at L 0.9 the same pull reads as mint, so day turns the
other way.

### The astro skies

The astro tile draws a sky of its own rather than admitting the page's, so it
carries twelve values: four skies (sun and moon, day and night) at three stops
each — `-sky` at the top, `-horizon` at the bottom, `-bloom` for the radial that
follows the body along its arc.

The day sun sky is **the one warm surface in the app**: it runs from a lilac top
(`sun-day-sky`, hue 280) to a cream horizon (`sun-day-horizon`, hue 80) under an
amber bloom (`sun-day-bloom`, hue 60). The day moon sky holds the same lilac top
and replaces the horizon and bloom with a near-neutral cool white — the same
picture at the same hour with the light taken out. Both night skies drop to
L 0.13–0.20 and keep only a small bloom above the horizon: violet for the sun,
neutral for the moon.

The four skies are stacked layers that crossfade over 0.9 s, because no browser
interpolates a gradient. The arriving layer eases out and the leaving one eases
in so their sum stays near one and the pane does not brighten as they cross.

### Ink and rules

**Day.** `wet-slate` text on `frosted-pane` ground, `hairline` borders.

**Night.** The same roles under `.night` on the app root: `night-ink` text,
`smoked-glass` ground, every border white at 6–10% alpha.

**The hover wash carries no hue.** `accent` — the ghost and outline hover
background — is the foreground at 8% alpha in each cascade, matching the idiom
`.start-city` and `.search-focus-pill` already use. It is never a text colour.

**Focus** is `focus-violet`, the one token outside the 195–280 band. It stays
because it is the vendored shadcn primitives' `--ring`.

### Warm

`signal-red` for destructive confirmation, and the three severity steps.
Nothing else in the app is warm except the day sun's astro sky.

### Named Rules

**The Colorless Encoding Rule.** Color never carries a reading that words are
not already carrying. Not comfort, not temperature, not air quality. The
severity ramp is the single exception, and even there the hue never carries the
severity alone. Binding.

**The One Ladder Rule.** A new surface takes a step of the spine. If none fits,
the surface is wrong before the colour is — there is no license to mix a value
between two steps, and a colour that is not on the ladder and not one of the
twelve astro stops does not exist in this system.

**The One Hue Family Rule.** Every surface, border, text and shadow colour lands
between 195° and 280°. Warm hues are licensed for three things only: destructive
confirmation, severe-weather alerts, and the day sun's astro sky.

**The Chroma Budget.** Panes stay at or below 0.04 chroma; pictures spend it.
The Now tile is the only pane allowed past that, up to 0.10, and only because it
carries the answer.

**The Severity Ramp.** Three hues, not three intensities of one — crimson at
`extreme`, red at `severe`, orange at `moderate`; `minor` and `unknown` take no
warm colour. The icon shape separates the two red steps, the word prints on the
modal chip, and the card speaks it.

**The Two Inks Rule.** Text and icons are `foreground` or `foreground/70`.
Rules and dividers are `foreground/10`; tracks, wells and icon plates are
`foreground/6`. One emphasis mark exists at `foreground/25`.

**The 70% Floor.** Text over glass is never faded below 70% of `foreground`.
`.label-section`, `.label-sub` and `.hour-cell` set it with `color-mix`; every
other faded string is `foreground/70`. Contrast over a `backdrop-filter` surface
has to be measured by hand — the composited ground is not a value a checker can
read off the element.

## Typography

**One family: Work Sans** (300, 400, 500), loaded from Google Fonts with a
`media="print"` / `onload` swap. No display face, no serif, no monospace.

**Character:** a grotesque with slightly humanist proportions, set light and
tight. Global tracking is `-0.03em`; every rung at 20 px and up tightens to
`-0.055em`. The personality is the gap between very large light type and very
small wide-tracked uppercase labels. There is no third voice.

### Hierarchy

| Role      | Weight | Size       | Where                                                                                 |
| --------- | ------ | ---------- | ------------------------------------------------------------------------------------- |
| Display   | 300    | 34 → 56 px | Hero city, empty state. Class `.type-display`                                         |
| Headline  | 300    | 24 px      | The comfort sentence                                                                  |
| Title     | 300    | 20 px      | Hazard name, dialog titles, error/quota headings, hero condition. Search input at 400 |
| Figure    | 400    | 24 px      | Forecast highs, UV, AQI, wind, pressure. Tabular                                      |
| Body      | 400    | 16 px      | Readings, astro times, menu rows                                                      |
| Caption   | 400    | 14 px      | All supporting text                                                                   |
| Label     | 500    | 12 px      | Section headers. Class `.label-section`                                               |
| Label Sub | 500    | 10 px      | Metric row names. Class `.label-sub`                                                  |

Display is declared in CSS rather than utilities: `cn` drops a `leading-`
written before a `text-`.

### Named Rules

**Words Outrank Figures.** One rung at 24 px holds both the sentence that
answers the question (300) and the numbers supporting it (400). Never a figure
above a word.

**The Step-Down Rule.** Every drop in the hierarchy is a size change; the weight
step at 24 px is the sole exception. Opacity is not a hierarchy tool.

**One Size Per Role, At Every Width.** A rung may change across breakpoints only
if it changes monotonically. A size that steps down at one breakpoint and back
up at the next is drift, not response.

**The Two Labels Rule.** `.label-section` and `.label-sub` differ by size alone,
never by tracking or alpha. A third is a regression.

## Layout

**Container.** `max-w-[1400px]`, centered, `px-5 py-6` rising to `px-8 py-8` at
`sm`. Full viewport height minimum; horizontal overflow hidden so the sky layer
cannot introduce a scrollbar.

**Grid.** One column on mobile, 4 from `sm`, 8 from `md`, back to 4 at `xl` —
the container declares no `lg` step. `auto-rows-[minmax(150px,auto)]`, with a
`1.25rem` gap rising to `1.5rem`. From `md` the hero runs full width above an
alerts strip, and the Now tile takes 4 of 8 columns, narrowing to 3 and spanning
two rows from `lg` so the hourly strip can sit beside it. At `xl` the hero takes
3 of 4 beside a one-wide right column holding the alerts strip above the Now
tile — what is urgent, then what is current. The alerts strip is the only tile
that can be absent.

**Document order is the mobile reading order** — the answer, then the next
hours, then the next days. Desktop composition is restored with `xl:order-*`
only. Place a new tile in the reading order first, then give it a desktop order.

**Density.** Tile padding comes from `--tile-pad` on `.bento-tile`, so the tiles
cannot drift apart: `1.25rem`, rising to `1.5rem` at `sm`. The hero runs
`1.5rem` → `2.5rem` at `sm` → `3rem` at `xl`. Interior rhythm is a `0.25rem`
base scale. Breakpoints are Tailwind defaults. The nav's units capsule and
round search button float in the bottom corners below `lg`; at `lg` and wider
they stack at the bottom-left, with no bar behind them. Its search sheet spans
the width below `lg` and is a 420 px column on the left above it. One `<Menu>`
renders inside it at every placement — there is no variant prop and no second
component.

## Elevation & Depth

Depth comes from the edge of the glass first — a `1px` white rim at 70–80% alpha
in day and 6–10% in night, a `0 1px 0 0 inset` highlight along the top edge, and
the atmosphere going soft through the pane. Shadows are ambient, not structural:
every resting tile casts a short one, and the difference between resting and
overlapping is the shadow's reach, not its presence.

- **Tile** `0 12px 30px -18px oklch(0.4 0.15 240 / 0.25)`; night `oklch(0 0 0 / 0.6)`.
- **Hero** `0 30px 60px -25px` — deeper, because it is the largest surface.
- **Overlay** `0 40px 80px -24px` + `0 16px 32px -10px` — the search panel and
  every dialog. Surfaces over content the reader was already looking at.
- **Focus ring** `0 0 0 3px oklch(0.7 0.12 230 / 0.12)` on `:focus-within`. A
  state response, not elevation.

### Named Rules

**The Two Lights Rule.** The lamp belongs to the hero. `.hero-day` takes a cyan
radial (`{colors.lamp}`) parked past the lower-right corner at `0.46` peak
alpha; `.hero-night` takes a 45° white sheen at `0.08` instead. A new lit
surface picks the rule for its cascade rather than inventing a third light.

**Panes light themselves.** A pane's depth comes from its own `160deg` gradient
and the 1 px white rim, never from the lamp. The astro tiles are the exception
that proves it: they are pictures, not panes, and their bloom sits at
`80% 100%` in day and `78% 0%` in night, following the body on the arc.

## Shapes

Rectangles with generous, uniform corners. No cut corners, no asymmetric radii,
no clipping paths, no non-rectangular silhouettes.

Icon wells and badges `0.75rem`, buttons and inputs `1rem`, every tile
`1.75rem`, the hero `2rem`, dialogs and the search panel `2.25rem`, tab and
step buttons `999px`.

Borders are one of two things: a white-alpha rim on a glass surface, or a
`foreground/10` hairline dividing content inside a tile. Solid opaque borders do
not appear.

**The Soft Container Rule.** Precise content, forgiving container: wide-tracked
uppercase labels and exact numerals inside high-radius translucent panes. Every
tile is `1.75rem` whatever its height — a short tile does not get a smaller
corner.

## Components

### Tiles

The primary surface: `.bento-tile` plus an optional variant. `1.75rem` radius,
transparent 1px border, padding from `--tile-pad`. Day fill
`linear-gradient(160deg, oklch(1 0 0 / 0.9), oklch(0.97 0.03 230 / 0.5))`; night
the same geometry at `oklch(0.17 0.012 255 / 0.9)` → `oklch(0.15 0.015 260 / 0.6)`
with a white 6% rim. Anatomy is a `.label-section` header, then content.

Variants: `.tile-now` (the same `160deg` geometry with the hue turned up — see
Colors), `.tile-astro` / `.tile-astro-moon` (a drawn sky; sun and moon share the
layer geometry and the crossfade, and differ at all three stops), `.tile-alert`
(the severity plate).

**A variant is declared in `index.css`, never as a utility.** `.bento-tile` sets
`background`, `border` and `padding` in an unlayered rule, so those three
properties beat any utility whatever the source order.

### Hero

Not a tile. Full-bleed saturated gradient, white text at full opacity, `2rem`
radius. Two blocks — place on the left, sky on the right — a row from `sm` up
and stacked below it, where the words column is too narrow to hold the city name
on one line.

The condition icon sets `stroke-width` from its size, so the drawn line is
constant: `0.83` at `size-36`, `0.68` at `sm:size-44`, `0.53` at `xl:size-56`,
all ≈5 px on a 24-unit viewBox. Card-sized condition icons hold ≈1.75 px the
same way — `1.05` at `size-10` in the forecast, `1.5` at `size-7` in the hourly.

### The two tiles that are buttons

The Now tile and the alerts strip are the only tiles that are controls, and they
respond alike: the surface lifts on hover and focus, over 150–420 ms.

- **Now** carries the answer — the comfort sentence at Headline, then
  temperature, feels-like and wind as a `foreground/10`-divided list.
- **Alerts** carries a 3 px severity rail on the leading edge, the hazard name at
  Title with `line-clamp-2`, the window end at Caption, and a `+N` count at the
  right. No section label; the hazard names the tile. Hover also underlines it.

### Search surface and dialogs

The search field is a `1.75rem` pill, `px-5 py-3`, white at 45% in day and 6% in
night; on `:focus-within` fill and rim step up ~0.15 alpha and a 3 px ring
appears, over `0.3s`. Inside: a 20 px icon at `foreground/70`, then a borderless
transparent input at Title size.

The search panel and every dialog share one chrome — `2.25rem` radius,
`blur(28px) saturate(160%)`, the Overlay shadow — and become bottom sheets below
`sm`. The dialog scrim is a tinted blur, not a black slab:
`oklch(0.34 0.055 250 / 0.34)` with `blur(6px) saturate(105%)`, and
`oklch(0.09 0.02 255 / 0.58)` in night. Menu rows are `px-3 py-3` with a
`size-8` well at `foreground/6` and a focus pill that springs between rows.

### Buttons and icons

Buttons are vendored shadcn primitives in `src/components/ui/` — do not refactor
them wholesale. `1rem` radius, `h-9 px-4`; primary takes the `{colors.primary}`
fill with white at 5.22:1, ghost the 8% ink hover wash, focus a 3 px ring at
`{colors.focus-violet}` (the one token outside the hue band, kept because it is
the primitives' `--ring`). The unit toggle and astro switch are a separate
family: a 36 px round control, `foreground/10` when active.

Icons are Lucide at `1.75` stroke and `size-4` unless the surface says
otherwise. Condition icons set stroke from size instead.

## Do's and Don'ts

### Do:

- **Do** take a step of the spine for a new surface. Eleven are declared;
  mixing a twelfth is how the ladder stops being one.
- **Do** build hierarchy with the size step. Eight rungs are declared; use one.
- **Do** keep text over glass at or above 70% `foreground`, and verify by
  measurement. Every app surface sits on a `backdrop-filter`, so the composited
  ground is not a value a checker can read off the element.
- **Do** place a new tile in the correct mobile reading order first, then give it
  an `xl:order-*`.
- **Do** let a new surface be translucent. `blur(20–28px) saturate(140–160%)`
  with a white-alpha rim is the material.
- **Do** define every state a variant has. In a two-cascade system a two-state
  tile is four rules, not three.
- **Do** treat the day/night switch as driven by the located city's local time.
  `@custom-variant dark` is scoped to a `.dark` class this app never applies.
- **Do** guard new motion with `prefers-reduced-motion`, as every existing
  animation does.

### Don't:

- **Don't** encode a reading in color.
- **Don't** add a second interactive blue. `{colors.primary}` and
  `{colors.azure}` are one step apart on purpose: the first is the contrast-safe
  fill, the second is the brand face. A third is drift.
- **Don't** light a pane with the lamp. It belongs to the hero.
- **Don't** introduce a second typeface, a serif, or a monospace face.
- **Don't** add a size, weight, ink level or radius that is not on the scales
  above. A one-off `text-[15px]` or `foreground/55` is drift by default.
- **Don't** fade text to create hierarchy.
- **Don't** reach for a raw Tailwind palette color (`sky-500`, `rose-300`).
- **Don't** build generic SaaS card UI — opaque white cards, gray hairlines,
  8 px radius. The large radius and the translucency are the system.
- **Don't** illustrate weather in the card layer. Condition is a line icon and a
  sentence. This binds the card layer only; the sky layer behind the composition
  is free to move, and the glass keeps its tint and its contrast floors over
  whatever it shows.
- **Don't** treat night as a dark mode. It is a full second cascade, equal in
  standing to day — the same room at a different hour.
