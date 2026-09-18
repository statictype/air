import { keepPreviousData, type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { WeatherCurrent, WeatherForecast } from "@/api/types";
import { fetchTier, type WeatherClientError } from "@/api/weather";
import { normalizeQuery } from "@/lib/query";
import type { WeatherTier } from "@/lib/tiers";

interface ClientTier {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
}

const CLIENT_TIERS: Record<WeatherTier, ClientTier> = {
  current: {
    staleTime: 120_000, // 2 min — matches the 10 min edge TTL / 5
    gcTime: 600_000, // 10 min
    refetchOnWindowFocus: true,
  },
  forecast: {
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  },
};

export interface UseWeatherOptions {
  query: string | null;
  minLength?: number;
}

export type UseWeatherResult = UseQueryResult<WeatherCurrent, WeatherClientError>;

function useWeatherTier<T>(
  tier: WeatherTier,
  query: string | null,
  minLength: number,
): UseQueryResult<T, WeatherClientError> {
  const normalized = normalizeQuery(query) ?? "";
  const enabled = normalized.length >= minLength;
  const config = CLIENT_TIERS[tier];

  return useQuery<T, WeatherClientError>({
    queryKey: ["weather", tier, normalized],
    queryFn: () => fetchTier<T>(tier, normalized),
    enabled,
    // Until a new key settles, `isSuccess` is true while `data` still holds the
    // previous city's payload. Anything correlating `data` with the current key
    // has to gate on `isPlaceholderData` too.
    placeholderData: keepPreviousData,
    staleTime: config.staleTime,
    gcTime: config.gcTime,
    refetchOnWindowFocus: config.refetchOnWindowFocus,
  });
}

export function useWeather(options: UseWeatherOptions): UseWeatherResult {
  const { query, minLength = 3 } = options;
  return useWeatherTier<WeatherCurrent>("current", query, minLength);
}

export function useWeatherForecast(
  query: string | null,
  minLength = 3,
): UseQueryResult<WeatherForecast, WeatherClientError> {
  return useWeatherTier<WeatherForecast>("forecast", query, minLength);
}
