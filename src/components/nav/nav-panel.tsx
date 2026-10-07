import { XIcon } from "lucide-react";
import { useEffect, useId } from "react";
import type { SuggestionItem } from "@/api/types";
import { Menu } from "@/components/search-bar/menu";
import type { NavigableItem } from "@/components/search-bar/menu-model";
import { SearchField } from "@/components/search-bar/search-field";
import { useSearchMenu } from "@/components/search-bar/use-search-menu";
import type { HistoryItem } from "@/hooks/use-history";
import { NavIconButton } from "./nav-trigger";
import type { PendingSelection } from "./pending-selection";

interface NavPanelProps {
  recentItems: HistoryItem[];
  suggestions: SuggestionItem[];
  isSuggestionsLoading: boolean;
  errorMessage: string | null;
  pending: PendingSelection | null;
  onValueChange: (next: string) => void;
  onRecentRemove: (item: HistoryItem) => void;
  onRecentClearAll: () => void;
  onSelect: (item: NavigableItem) => void;
  onClose: () => void;
}

export function NavPanel({
  recentItems,
  suggestions,
  isSuggestionsLoading,
  errorMessage,
  pending,
  onValueChange,
  onRecentRemove,
  onRecentClearAll,
  onSelect,
  onClose,
}: NavPanelProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const menu = useSearchMenu({
    recentItems,
    suggestions,
    isSuggestionsLoading,
    onValueChange,
    onSelect,
    onClose,
  });

  // The panel owns the query string. Once it unmounts, nothing outside it
  // should keep fetching suggestions for a field that is gone.
  useEffect(() => {
    return () => onValueChange("");
    // Empty deps: the cleanup has to run on unmount, not whenever
    // `onValueChange` changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="shrink-0 px-3 pt-3">
        <SearchField
          id={inputId}
          errorId={errorId}
          errorMessage={errorMessage}
          disabled={pending !== null}
          autoFocus
          inputRef={menu.inputRef}
          inputProps={menu.inputProps}
          formProps={menu.formProps}
          trailing={<NavIconButton icon={XIcon} label="Close" onClick={onClose} />}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-busy={pending !== null}>
        <Menu
          model={menu.model}
          focusedKey={menu.focusedKey}
          pendingKey={pending?.key ?? null}
          hoverKey={menu.hoverKey}
          selectRecent={menu.selectRecent}
          selectSuggestion={menu.selectSuggestion}
          requestLocation={menu.requestLocation}
          selectRandom={menu.selectRandom}
          onRecentRemove={onRecentRemove}
          onRecentClearAll={onRecentClearAll}
          isDialogOpen={menu.isDialogOpen}
          setDialogOpen={menu.setDialogOpen}
        />
      </div>
    </div>
  );
}
