import type { Measure, MeasurePair } from "@/lib/schemas";

export const UNIT_SYSTEMS = ["metric", "imperial"] as const;

export type UnitSystem = (typeof UNIT_SYSTEMS)[number];

export function isUnitSystem(value: unknown): value is UnitSystem {
  return typeof value === "string" && (UNIT_SYSTEMS as readonly string[]).includes(value);
}

const ABSENT: Measure = { text: "—", value: "—", suffix: "", spoken: "—" };

/** A cached body can be missing the pair — `max-age` is 10 min on `current` and
 *  1 h on `forecast`, so a browser can hold one shaped by an older DTO. Every
 *  call site reads through here rather than indexing the pair itself. */
export function read(pair: MeasurePair | null | undefined, system: UnitSystem): Measure {
  return pair?.[system] ?? ABSENT;
}
