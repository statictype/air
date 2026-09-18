import { defaultMessage, kindForStatus, type WeatherErrorKind } from "@/lib/errors";
import { WEATHER_TIER_PATHS, type WeatherTier } from "@/lib/tiers";
import type { SuggestionItem, WeatherCurrent, WeatherForecast } from "./types";

export class WeatherClientError extends Error {
  constructor(
    public readonly kind: WeatherErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "WeatherClientError";
  }
}

interface ErrorBody {
  error?: { kind?: WeatherErrorKind; message?: string };
}

async function request<T>(path: string): Promise<T> {
  // Absolute URL: undici rejects a relative one under jsdom.
  const url = new URL(path, window.location.origin);
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new WeatherClientError("network", "Could not reach the weather service.");
  }

  if (!res.ok) {
    let body: ErrorBody = {};
    try {
      body = (await res.json()) as ErrorBody;
    } catch {
      // Not JSON — fall through to the status-based fallback.
    }
    const kind = body.error?.kind ?? kindForStatus(res.status);
    const message = body.error?.message ?? defaultMessage(kind);
    throw new WeatherClientError(kind, message);
  }

  return (await res.json()) as T;
}

export function fetchTier<T>(tier: WeatherTier, query: string): Promise<T> {
  return request<T>(`${WEATHER_TIER_PATHS[tier]}?q=${encodeURIComponent(query)}`);
}

export function fetchCurrent(query: string): Promise<WeatherCurrent> {
  return fetchTier<WeatherCurrent>("current", query);
}

export function fetchForecast(query: string): Promise<WeatherForecast> {
  return fetchTier<WeatherForecast>("forecast", query);
}

export function fetchSearch(query: string): Promise<SuggestionItem[]> {
  return request<SuggestionItem[]>(`/api/search?q=${encodeURIComponent(query)}`);
}
