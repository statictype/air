/**
 * Nothing in `src/api`, `src/hooks`, or `src/components` may value-import from
 * this file — type imports only, so zod stays out of the client bundle. ESLint
 * enforces it.
 */

import { z } from "zod";
import type { UnitSystem } from "@/lib/units";

export const MeasureSchema = z.object({
  text: z.string(),
  value: z.string(),
  suffix: z.string(),
  spoken: z.string(),
});
export type Measure = z.infer<typeof MeasureSchema>;

export type MeasurePair = Record<UnitSystem, Measure>;

/** Annotated rather than inferred, so a new `UnitSystem` member fails here
 *  until the schema gains its row. */
export const MeasurePairSchema: z.ZodType<MeasurePair> = z.object({
  metric: MeasureSchema,
  imperial: MeasureSchema,
});

export const WeatherLocationSchema = z.object({
  name: z.string(),
  region: z.string(),
  country: z.string(),
  localTime: z.string(),
  tz: z.string(),
  lat: z.number(),
  lon: z.number(),
});
export type WeatherLocation = z.infer<typeof WeatherLocationSchema>;

export const THERMAL_LABELS = [
  "Very cold",
  "Cold",
  "Chilly",
  "Cool",
  "Mild",
  "Warm",
  "Hot",
  "Very hot",
  "Dangerously hot",
] as const;
export type ThermalLabel = (typeof THERMAL_LABELS)[number];

export const AIR_LABELS = [
  "Very dry",
  "Dry",
  "Slightly dry",
  "Comfortable",
  "Slightly humid",
  "Humid",
  "Very humid",
  "Damp",
] as const;
export type AirLabel = (typeof AIR_LABELS)[number];

export const AirComfortSchema = z.object({
  thermal: z.enum(THERMAL_LABELS),
  air: z.enum(AIR_LABELS),
  sentence: z.string(),
});
export type AirComfort = z.infer<typeof AirComfortSchema>;

export const CurrentConditionsSchema = z.object({
  temp: MeasurePairSchema,
  feelsLike: MeasurePairSchema,
  heatIndex: MeasurePairSchema,
  windchill: MeasurePairSchema,
  dewpoint: MeasurePairSchema,
  conditionText: z.string(),
  conditionCode: z.number(),
  timeOfDay: z.enum(["day", "night"]),
  wind: MeasurePairSchema,
  gust: MeasurePairSchema,
  windDir: z.string(),
  /** Compass bearing the wind blows *from*, 0–359. */
  windDegree: z.number(),
  humidity: z.number(),
  pressureMb: z.number(),
  pressure: MeasurePairSchema,
  visibility: MeasurePairSchema,
  uv: z.number(),
  cloud: z.number(),
  precip: MeasurePairSchema,
  comfort: AirComfortSchema,
  beaufort: z.string(),
});
export type CurrentConditions = z.infer<typeof CurrentConditionsSchema>;

export const HourlyForecastSchema = z.object({
  time: z.string(),
  temp: MeasurePairSchema,
  feelsLike: MeasurePairSchema,
  conditionText: z.string(),
  conditionCode: z.number(),
  isDay: z.boolean(),
  chanceOfRain: z.number(),
  chanceOfSnow: z.number(),
  /** Upstream's own call on whether precipitation lands, not a threshold on the chance. */
  willItRain: z.boolean(),
  willItSnow: z.boolean(),
  cloud: z.number(),
});
export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;

/** `totalPrecip` / `totalSnow` are `null` when the figure rounds to zero in
 *  *either* system, so the toggle never adds or removes an element. */
export const DayPrecipSchema = z.object({
  chanceOfRain: z.number(),
  /** Upstream's own call on whether precipitation lands, not a threshold on the chance. */
  willItRain: z.boolean(),
  chanceOfSnow: z.number(),
  willItSnow: z.boolean(),
  totalPrecip: MeasurePairSchema.nullable(),
  totalSnow: MeasurePairSchema.nullable(),
});
export type DayPrecip = z.infer<typeof DayPrecipSchema>;

export const ForecastDaySchema = z.object({
  date: z.string(),
  min: MeasurePairSchema,
  max: MeasurePairSchema,
  ...DayPrecipSchema.shape,
  conditionText: z.string(),
  conditionCode: z.number(),
  isDay: z.boolean(),
});
export type ForecastDay = z.infer<typeof ForecastDaySchema>;

export const AstroSchema = z.object({
  sunrise: z.string(),
  sunset: z.string(),
  moonrise: z.string(),
  moonset: z.string(),
  moonPhase: z.string(),
  moonIllumination: z.number(),
});
export type Astro = z.infer<typeof AstroSchema>;

export const WeatherCurrentSchema = z.object({
  location: WeatherLocationSchema,
  current: CurrentConditionsSchema,
});
export type WeatherCurrent = z.infer<typeof WeatherCurrentSchema>;

export const ALERT_SEVERITIES = ["extreme", "severe", "moderate", "minor", "unknown"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const WeatherAlertSchema = z.object({
  event: z.string(),
  headline: z.string(),
  severity: z.enum(ALERT_SEVERITIES),
  areas: z.string(),
  effective: z.string(),
  expires: z.string(),
  desc: z.string(),
  instruction: z.string(),
});
export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

export const WeatherForecastSchema = z.object({
  airQualityIndex: z.number().nullable(),
  forecast: z.array(ForecastDaySchema),
  astro: AstroSchema,
  hourly: z.array(HourlyForecastSchema),
  alerts: z.array(WeatherAlertSchema),
});
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;
