import { QueryClient } from "@tanstack/react-query";
import { WeatherClientError } from "@/api/weather";

/** 404 / 400 / 429 never retry; network and 5xx retry twice. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof WeatherClientError) {
            if (
              error.kind === "not_found" ||
              error.kind === "invalid_query" ||
              error.kind === "quota_exceeded"
            ) {
              return false;
            }
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      },
    },
  });
}
