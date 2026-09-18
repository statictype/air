import type { Measure, MeasurePair } from "@/lib/schemas";

export function measure(value: string, suffix: string, spokenUnit: string): Measure {
  const alphabetic = /^[a-z]/i.test(suffix);
  return {
    text: alphabetic ? `${value} ${suffix}` : `${value}${suffix}`,
    value,
    suffix,
    spoken: `${value} ${spokenUnit}`,
  };
}

export function fixed(n: number, decimals: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const out = safe.toFixed(decimals);
  // -0.4 rounds to "-0"; print a bare zero instead.
  return out.startsWith("-") && Number(out) === 0 ? out.slice(1) : out;
}

export function temperature(c: number, f: number): MeasurePair {
  return {
    metric: measure(fixed(c, 0), "°", "degrees"),
    imperial: measure(fixed(f, 0), "°", "degrees"),
  };
}

export function speed(kph: number, mph: number): MeasurePair {
  return {
    metric: measure(fixed(kph, 0), "km/h", "kilometres per hour"),
    imperial: measure(fixed(mph, 0), "mph", "miles per hour"),
  };
}

export function distance(km: number, miles: number): MeasurePair {
  return {
    metric: measure(fixed(km, 0), "km", "kilometres"),
    imperial: measure(fixed(miles, 0), "mi", "miles"),
  };
}

export function pressure(mb: number, inHg: number): MeasurePair {
  return {
    metric: measure(fixed(mb, 0), "mb", "millibars"),
    imperial: measure(fixed(inHg, 2), "inHg", "inches of mercury"),
  };
}
