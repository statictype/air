import { WeatherClientError } from "@/api/weather";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { QuotaExceededState } from "@/components/quota-exceeded-state";
import { WeatherGrid } from "@/components/weather/grid";
import { WeatherSkeleton } from "@/components/weather-skeleton";
import type { UseWeatherResult } from "@/hooks/use-weather";
import type { CitySelectionIntent } from "@/lib/city-selection";

interface WeatherResultProps {
  query: UseWeatherResult;
  activeQuery: string | null;
  onRetry: () => void;
  onSearchRequest: () => void;
  onSelectCity: (intent: CitySelectionIntent) => Promise<string | null>;
}

/**
 * Picks the card grid, the skeleton, or one of the result states.
 *
 * Only `quota_exceeded` and a `network` / `upstream` failure with no data take
 * the screen over. Every other error falls through to the previous city's card,
 * which `keepPreviousData` leaves in `data`, or to the empty state.
 */
export function WeatherResult({
  query,
  activeQuery,
  onRetry,
  onSearchRequest,
  onSelectCity,
}: WeatherResultProps) {
  const { data, error, isLoading, isFetching, isPlaceholderData } = query;

  if (error instanceof WeatherClientError && error.kind === "quota_exceeded") {
    return <QuotaExceededState />;
  }

  if (
    error instanceof WeatherClientError &&
    (error.kind === "network" || error.kind === "upstream") &&
    !data
  ) {
    return (
      <ErrorState
        title="Couldn't reach the weather service"
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

  if (isLoading) {
    return <WeatherSkeleton />;
  }

  if (data) {
    return (
      <WeatherGrid query={activeQuery} current={data} isStale={isFetching || isPlaceholderData} />
    );
  }

  return <EmptyState onSearchRequest={onSearchRequest} onSelectCity={onSelectCity} />;
}
