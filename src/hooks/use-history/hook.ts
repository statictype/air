import { addHistoryItem, clearHistory, removeHistoryItem, restoreHistoryItems } from "./reducer";
import { historyStore } from "./store";
import type { HistoryItem } from "./types";

export interface UseHistoryReturn {
  history: HistoryItem[];
  add: (item: Omit<HistoryItem, "id" | "addedAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
  restore: (items: HistoryItem[]) => void;
}

/**
 * Recent searches. Every consumer reads one shared snapshot, persisted to
 * `localStorage` and updated across tabs.
 */
export function useHistory(): UseHistoryReturn {
  const history = historyStore.use();

  return {
    history,
    add: (item) => historyStore.set(addHistoryItem(historyStore.get(), item)),
    remove: (id) => historyStore.set(removeHistoryItem(historyStore.get(), id)),
    clear: () => historyStore.set(clearHistory()),
    restore: (items) => historyStore.set(restoreHistoryItems(historyStore.get(), items)),
  };
}
