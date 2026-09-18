import { useQuery } from "@tanstack/react-query";
import type { SuggestionItem } from "@/api/types";
import type { WeatherClientError } from "@/api/weather";
import { fetchSearch } from "@/api/weather";
import { normalizeQuery } from "@/lib/query";
import { useDebouncedValue } from "./use-debounced-value";

const DEBOUNCE_MS = 300;
const MIN_LENGTH = 3;

export interface UseSuggestionsResult {
  data: SuggestionItem[];
  isLoading: boolean;
  isPending: boolean;
}

/**
 * Autocomplete for the search field. `isLoading` covers the request; `isPending`
 * covers the debounce, where the input is long enough but the fetch has not started.
 */
export function useSuggestions(input: string): UseSuggestionsResult {
  const debounced = useDebouncedValue(input, DEBOUNCE_MS);
  const normalized = normalizeQuery(debounced) ?? "";
  const enabled = normalized.length >= MIN_LENGTH;

  const rawNormalized = normalizeQuery(input) ?? "";
  const isPending = rawNormalized.length >= MIN_LENGTH && rawNormalized !== normalized;

  const result = useQuery<SuggestionItem[], WeatherClientError>({
    queryKey: ["search", normalized],
    queryFn: () => fetchSearch(normalized),
    enabled,
    staleTime: 60_000,
  });

  return {
    data: result.data ?? [],
    isLoading: enabled && result.isFetching,
    isPending,
  };
}
