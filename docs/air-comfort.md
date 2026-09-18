# Air comfort

The Now card leads with a sentence — `Warm and slightly humid`,
`Hot but comfortable`, `Chilly and damp` — rather than a comfort score. This is
the vocabulary behind it. It is computed on the Worker, in
`src/worker/air-comfort.ts`, from the metric fields, so the words do not change
when a viewer switches to °F.

## Two axes

Two readings that vary independently: how hot it feels, and what the air is
like. They come from different inputs and are shown together.

The air axis is driven by dew point rather than relative humidity, because RH on
its own misleads — 80% at 10 °C feels nothing like 70% at 30 °C. Dew point is an
absolute measure of moisture. RH enters only through the damp override below.

All ranges are lower-inclusive and upper-exclusive: "a to b" means `a ≤ x < b`.
The top and bottom bands run to infinity.

### Thermal, from feels-like temperature

| Feels like (°C) | Label           |
| --------------- | --------------- |
| ≥ 40            | Dangerously hot |
| 35 to 40        | Very hot        |
| 29 to 35        | Hot             |
| 22 to 29        | Warm            |
| 16 to 22        | Mild            |
| 10 to 16        | Cool            |
| 4 to 10         | Chilly          |
| −5 to 4         | Cold            |
| < −5            | Very cold       |

### Air, from dew point

| Dew point (°C) | Label          |
| -------------- | -------------- |
| ≥ 24           | Very humid     |
| 21 to 24       | Humid          |
| 16 to 21       | Slightly humid |
| 10 to 16       | Comfortable    |
| 4 to 10        | Slightly dry   |
| −4 to 4        | Dry            |
| < −4           | Very dry       |

### The damp override

When `tempC < 12` and `humidity > 80` — strict on both — the air label becomes
`Damp` whatever the dew point says. A 7 °C dew point classifies as
`Slightly dry`, but at 10 °C with 82% RH the air reads as damp, not dry. The
strictness of both operators is pinned by tests.

## Building the sentence

Every air label except `Comfortable` joins with `and`, at any thermal extreme:
`Dangerously hot and very humid`, `Very cold and damp`.

`Comfortable` is the one evaluative word in either vocabulary — it describes the
person, not the air — so the sentence speaks it only where the thermal label
leaves room for a person to be comfortable. The rule is `COMFORT_JOIN`, an
exhaustive `Record<ThermalLabel, …>`:

| Thermal         | Join  | Sentence at dew point 10 to 16 |
| --------------- | ----- | ------------------------------ |
| Dangerously hot | —     | `Dangerously hot`              |
| Very hot        | —     | `Very hot`                     |
| Hot (< 32)      | `but` | `Hot but comfortable`          |
| Hot (≥ 32)      | —     | `Hot`                          |
| Warm            | `and` | `Warm and comfortable`         |
| Mild            | `and` | `Mild and comfortable`         |
| Cool            | `but` | `Cool but comfortable`         |
| Chilly          | —     | `Chilly`                       |
| Cold            | —     | `Cold`                         |
| Very cold       | —     | `Very cold`                    |

A dash drops the air clause and the sentence is the thermal label alone; the
reading is unchanged, and `air` is still `Comfortable` on the wire. `Hot` spans
29 to 35, wide enough that its halves differ, so the concession holds below 32
and is dropped at or above it. That is the only numeric guard in the rule —
every other row is a function of the label alone.

## Beaufort

`beaufort(kph)` in the same file returns the Beaufort force word for the wind
card. It also reads km/h rather than the display system: the published table is
rounded independently per unit — force 3 is 12–19 km/h and 8–12 mph — so a wind
between 12 mph and 13 mph would change word when a viewer flipped the toggle.

## Not covered

Hourly and daily forecasts carry no comfort sentence. Upstream does not return
dew point on the forecast endpoint, so the labeler cannot run there.
