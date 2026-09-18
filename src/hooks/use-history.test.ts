import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetHistoryStoreForTests,
  addHistoryItem,
  clearHistory,
  type HistoryItem,
  MAX_HISTORY,
  removeHistoryItem,
  restoreHistoryItems,
  useHistory,
} from "./use-history";
import { STORAGE_KEY as HISTORY_STORAGE_KEY } from "./use-history/types";

beforeEach(() => {
  __resetHistoryStoreForTests();
});

afterEach(() => {
  __resetHistoryStoreForTests();
});

describe("addHistoryItem (pure)", () => {
  it("prepends a new item to an empty list", () => {
    const result = addHistoryItem([], { query: "London", displayName: "London, UK" });
    expect(result).toHaveLength(1);
    expect(result[0]?.query).toBe("London");
  });

  it("dedupes case-insensitively, replacing the existing entry at the top", () => {
    const seed: HistoryItem[] = [
      { id: "a", query: "Paris", displayName: "Paris, FR", addedAt: 1 },
      { id: "b", query: "London", displayName: "London, UK", addedAt: 2 },
      { id: "c", query: "Berlin", displayName: "Berlin, DE", addedAt: 3 },
    ];
    const result = addHistoryItem(seed, { query: "london", displayName: "London, UK" });
    expect(result).toHaveLength(3);
    expect(result[0]?.query.toLowerCase()).toBe("london");
    expect(result[0]?.id).not.toBe("b");
    expect(result.map((i) => i.query)).toEqual(["london", "Paris", "Berlin"]);
  });

  it("dedupes on the canonical query, collapsing internal whitespace runs", () => {
    // These share one edge-cache entry, so History must not split them.
    const seed: HistoryItem[] = [
      { id: "a", query: "New  York", displayName: "New York, US", addedAt: 1 },
    ];
    const result = addHistoryItem(seed, { query: "New York", displayName: "New York, US" });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).not.toBe("a");
    expect(result[0]?.query).toBe("New York");
  });

  it("caps the list at MAX_HISTORY entries, dropping the oldest", () => {
    const seed: HistoryItem[] = Array.from({ length: MAX_HISTORY }, (_, i) => ({
      id: `id-${i}`,
      query: `City${i}`,
      displayName: `City${i}`,
      addedAt: MAX_HISTORY - i,
    }));
    const result = addHistoryItem(seed, { query: "Newest", displayName: "Newest" });
    expect(result).toHaveLength(MAX_HISTORY);
    expect(result[0]?.query).toBe("Newest");
    expect(result.find((i) => i.query === `City${MAX_HISTORY - 1}`)).toBeUndefined();
    expect(result.find((i) => i.query === `City${MAX_HISTORY - 2}`)).toBeDefined();
  });

  it("rejects empty/whitespace queries without mutating the list", () => {
    const seed: HistoryItem[] = [{ id: "a", query: "Paris", displayName: "Paris", addedAt: 1 }];
    expect(addHistoryItem(seed, { query: "   ", displayName: "" })).toEqual(seed);
  });
});

describe("removeHistoryItem (pure)", () => {
  it("removes the item with the matching id", () => {
    const seed: HistoryItem[] = [
      { id: "a", query: "Paris", displayName: "Paris", addedAt: 1 },
      { id: "b", query: "London", displayName: "London", addedAt: 2 },
    ];
    expect(removeHistoryItem(seed, "a")).toEqual([
      { id: "b", query: "London", displayName: "London", addedAt: 2 },
    ]);
  });

  it("is a no-op when the id is absent", () => {
    const seed: HistoryItem[] = [{ id: "a", query: "Paris", displayName: "Paris", addedAt: 1 }];
    expect(removeHistoryItem(seed, "missing")).toEqual(seed);
  });
});

describe("clearHistory (pure)", () => {
  it("returns an empty list", () => {
    expect(clearHistory()).toEqual([]);
  });
});

describe("restoreHistoryItems (pure)", () => {
  it("prepends restored items in order", () => {
    const seed: HistoryItem[] = [{ id: "x", query: "Berlin", displayName: "Berlin", addedAt: 5 }];
    const removed: HistoryItem[] = [
      { id: "a", query: "Lisbon", displayName: "Lisbon", addedAt: 1 },
      { id: "b", query: "Madrid", displayName: "Madrid", addedAt: 2 },
    ];
    expect(restoreHistoryItems(seed, removed).map((i) => i.query)).toEqual([
      "Lisbon",
      "Madrid",
      "Berlin",
    ]);
  });

  it("skips items whose id is already present (defensive against double-undo)", () => {
    const seed: HistoryItem[] = [{ id: "a", query: "Paris", displayName: "Paris", addedAt: 1 }];
    const removed: HistoryItem[] = [
      { id: "a", query: "Paris", displayName: "Paris", addedAt: 1 },
      { id: "b", query: "London", displayName: "London", addedAt: 2 },
    ];
    expect(restoreHistoryItems(seed, removed).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("respects the cap when prepending would overflow", () => {
    const seed: HistoryItem[] = Array.from({ length: MAX_HISTORY }, (_, i) => ({
      id: `id-${i}`,
      query: `City${i}`,
      displayName: `City${i}`,
      addedAt: MAX_HISTORY - i,
    }));
    const removed: HistoryItem[] = [
      { id: "r1", query: "Restored1", displayName: "Restored1", addedAt: 999 },
      { id: "r2", query: "Restored2", displayName: "Restored2", addedAt: 998 },
    ];
    const result = restoreHistoryItems(seed, removed);
    expect(result).toHaveLength(MAX_HISTORY);
    expect(result[0]?.id).toBe("r1");
    expect(result[1]?.id).toBe("r2");
    expect(result.find((i) => i.id === `id-${MAX_HISTORY - 1}`)).toBeUndefined();
    expect(result.find((i) => i.id === `id-${MAX_HISTORY - 2}`)).toBeUndefined();
  });
});

describe("useHistory", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.history).toEqual([]);
  });

  it("adds, removes, and clears items", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.add({ query: "London", displayName: "London, UK" });
      result.current.add({ query: "Paris", displayName: "Paris, FR" });
    });
    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0]?.query).toBe("Paris");

    const idToRemove = result.current.history[0]?.id;
    if (!idToRemove) throw new Error("expected an id");
    act(() => result.current.remove(idToRemove));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]?.query).toBe("London");

    act(() => result.current.clear());
    expect(result.current.history).toEqual([]);
  });

  it("drops malformed entries when reading the stored array", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify([
          { id: "a", query: "Paris", displayName: "Paris, FR", addedAt: 1 },
          { id: "b", query: "London" },
          "not an object",
        ]),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: HISTORY_STORAGE_KEY }));
    });

    expect(result.current.history.map((i) => i.id)).toEqual(["a"]);
  });

  it("persists across hook unmount/remount via localStorage", () => {
    const first = renderHook(() => useHistory());
    act(() => {
      first.result.current.add({ query: "London", displayName: "London, UK" });
    });
    first.unmount();

    const second = renderHook(() => useHistory());
    expect(second.result.current.history).toHaveLength(1);
    expect(second.result.current.history[0]?.query).toBe("London");
  });

  it("restore prepends items and respects the cap", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.add({ query: "Berlin", displayName: "Berlin" });
    });

    const removed: HistoryItem[] = [
      { id: "x1", query: "Lisbon", displayName: "Lisbon", addedAt: 999 },
      { id: "x2", query: "Madrid", displayName: "Madrid", addedAt: 998 },
    ];

    act(() => result.current.restore(removed));

    expect(result.current.history.map((i) => i.query)).toEqual(["Lisbon", "Madrid", "Berlin"]);
  });
});
