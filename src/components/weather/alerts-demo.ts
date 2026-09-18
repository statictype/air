/**
 * Dev-only fixtures, selected by `?alerts=one|mixed|sparse|long|full`.
 *
 * Keep every fixture inside the function, below the `import.meta.env.DEV`
 * guard; at module scope they survive tree-shaking and ship to production.
 * Verify: `pnpm build && grep -c PREPAREDNESS dist/client/assets/index-*.js`.
 */

import type { WeatherAlert } from "@/api/types";

export function demoAlerts(): WeatherAlert[] | null {
  if (!import.meta.env.DEV) return null;
  if (typeof window === "undefined") return null;
  const key = new URLSearchParams(window.location.search).get("alerts");
  if (!key) return null;

  const base: WeatherAlert = {
    event: "Wind Warning",
    headline: "Wind Warning issued August 11 at 6:00AM CEST",
    severity: "severe",
    areas: "Greater London; Surrey; Kent",
    effective: "2026-08-11T06:00:00+02:00",
    expires: "2026-08-11T21:00:00+02:00",
    desc: "Southwesterly gusts of 60 to 70 mph are expected across exposed coasts and high ground.",
    instruction: "Secure loose objects outdoors and avoid coastal paths during the warning period.",
  };

  const longDesc = `* WHAT...Damaging winds and large hail are possible.

* WHERE...Portions of central and southeast Kansas.

* WHEN...Until 900 PM CDT.

* IMPACTS...Hail damage to vehicles is expected. Wind damage to roofs, siding, and trees is likely.

PRECAUTIONARY/PREPAREDNESS ACTIONS...

For your protection move to an interior room on the lowest floor of a building.`;

  const scenarios: Record<string, WeatherAlert[]> = {
    one: [base],
    mixed: [
      { ...base, event: "Flood Warning", severity: "extreme", areas: "Thames Valley" },
      { ...base, event: "Thunderstorm Watch", severity: "moderate" },
      { ...base, event: "Coastal Hazard Statement", severity: "unknown", instruction: "" },
    ],
    sparse: [{ ...base, event: "Frost Advisory", severity: "minor", areas: "", instruction: "" }],
    long: [{ ...base, event: "Severe Thunderstorm Warning", severity: "extreme", desc: longDesc }],
    full: [
      { ...base, event: "Extreme Heat Warning for the Metropolitan Area", severity: "extreme" },
      { ...base, event: "Wind Warning", severity: "severe" },
      { ...base, event: "Thunderstorm Watch", severity: "moderate" },
      { ...base, event: "Frost Advisory", severity: "minor" },
      { ...base, event: "Coastal Hazard Statement", severity: "unknown" },
    ],
  };

  return scenarios[key] ?? null;
}
