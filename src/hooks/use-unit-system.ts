import { createPersistentStore } from "@/lib/persistent-store";
import { isUnitSystem, type UnitSystem } from "@/lib/units";

export const UNIT_STORAGE_KEY = "air:units";

// United States, Liberia, Myanmar.
const IMPERIAL_REGIONS = new Set(["US", "LR", "MM"]);

function deriveFromLocale(): UnitSystem {
  try {
    const region = new Intl.Locale(navigator.language).region;
    return region && IMPERIAL_REGIONS.has(region) ? "imperial" : "metric";
  } catch {
    return "metric";
  }
}

const unitStore = createPersistentStore<UnitSystem>({
  key: UNIT_STORAGE_KEY,
  // The stored string indexes the DTO, so a hand-edited value would make
  // `d.temp[system]` `undefined` at every call site.
  decode: (raw) => (isUnitSystem(raw) ? raw : null),
  encode: (next) => next,
  fallback: deriveFromLocale,
  serverValue: "metric",
});

export function useUnitSystem(): UnitSystem {
  return unitStore.use();
}

export function useUnitSystemControl(): [UnitSystem, (next: UnitSystem) => void] {
  return [useUnitSystem(), unitStore.set];
}

export function __resetUnitSystemForTests(system?: UnitSystem): void {
  unitStore.reset(system);
}
