import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SuggestionItem } from "@/api/types";
import type { HistoryItem } from "@/hooks/use-history";
import { useSearchMenu } from "./use-search-menu";

const recent = (id: string, displayName: string): HistoryItem => ({
  id,
  query: displayName,
  displayName,
  addedAt: 1,
});

const sugg = (id: number, name: string): SuggestionItem => ({
  id,
  name,
  region: "",
  country: "FR",
  lat: 0,
  lon: 0,
  url: "",
});

function makeArgs(overrides: Partial<Parameters<typeof useSearchMenu>[0]> = {}) {
  return {
    recentItems: [],
    suggestions: [],
    isSuggestionsLoading: false,
    onSelect: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

type ChangeArg = Parameters<ReturnType<typeof useSearchMenu>["inputProps"]["onChange"]>[0];
type KeyArg = Parameters<ReturnType<typeof useSearchMenu>["inputProps"]["onKeyDown"]>[0];
type SubmitArg = Parameters<ReturnType<typeof useSearchMenu>["formProps"]["onSubmit"]>[0];

const change = (value: string) => ({ target: { value } }) as unknown as ChangeArg;
const key = (k: string) => ({ key: k, preventDefault: () => {} }) as unknown as KeyArg;
const submit = () => ({ preventDefault: () => {} }) as unknown as SubmitArg;

describe("useSearchMenu", () => {
  it("starts with an empty value", () => {
    const { result } = renderHook(() => useSearchMenu(makeArgs()));
    expect(result.current.value).toBe("");
  });

  it("close clears the value and hands the decision to the owner", () => {
    const onClose = vi.fn();
    const onValueChange = vi.fn();
    const { result } = renderHook(() => useSearchMenu(makeArgs({ onClose, onValueChange })));

    act(() => result.current.inputProps.onChange(change("Par")));
    expect(onValueChange).toHaveBeenLastCalledWith("Par");

    act(() => result.current.close());
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("running a row reports through onSelect and never closes by itself", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const recents = [recent("a", "Paris")];
    const { result } = renderHook(() =>
      useSearchMenu(makeArgs({ recentItems: recents, onSelect, onClose })),
    );

    act(() => result.current.selectRecent(recents[0]!));

    expect(onSelect).toHaveBeenCalledWith({ kind: "recent", key: "recent:a", item: recents[0] });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(result.current.value).toBe("");
  });

  it("toggling the clear-history dialog does not close the panel", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useSearchMenu(makeArgs({ onClose })));

    act(() => result.current.setDialogOpen(true));
    expect(result.current.isDialogOpen).toBe(true);

    act(() => result.current.setDialogOpen(false));
    expect(result.current.isDialogOpen).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("defaults focus to the first city row when value is empty", () => {
    const recents = [recent("a", "Paris"), recent("b", "London")];
    const { result } = renderHook(() => useSearchMenu(makeArgs({ recentItems: recents })));
    expect(result.current.focusedKey).toBe("recent:a");
  });

  it("submit runs the focused row", () => {
    const onSelect = vi.fn();
    const recents = [recent("a", "Paris")];
    const { result } = renderHook(() =>
      useSearchMenu(makeArgs({ recentItems: recents, onSelect })),
    );

    act(() => result.current.formProps.onSubmit(submit()));

    expect(onSelect).toHaveBeenCalledWith({ kind: "recent", key: "recent:a", item: recents[0] });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("submit with no rows does nothing", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useSearchMenu(makeArgs({ onSelect })));

    act(() => result.current.formProps.onSubmit(submit()));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("ArrowDown / ArrowUp move the focused key through the navigable list", () => {
    const recents = [recent("a", "Paris"), recent("b", "London")];
    const { result } = renderHook(() => useSearchMenu(makeArgs({ recentItems: recents })));

    expect(result.current.focusedKey).toBe("recent:a");

    act(() => result.current.inputProps.onKeyDown(key("ArrowDown")));
    expect(result.current.focusedKey).toBe("recent:b");
    act(() => result.current.inputProps.onKeyDown(key("ArrowDown")));
    expect(result.current.focusedKey).toBe("action:location");
    act(() => result.current.inputProps.onKeyDown(key("ArrowUp")));
    expect(result.current.focusedKey).toBe("recent:b");
  });

  it("Escape in the field closes and clears the value", () => {
    const onClose = vi.fn();
    const onValueChange = vi.fn();
    const { result } = renderHook(() => useSearchMenu(makeArgs({ onClose, onValueChange })));

    act(() => result.current.inputProps.onChange(change("Par")));
    act(() => result.current.inputProps.onKeyDown(key("Escape")));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(result.current.value).toBe("");
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("each row kind reports itself, with its own key, down the one channel", () => {
    const onSelect = vi.fn();
    const suggestions = [sugg(1, "Paris")];
    const { result } = renderHook(() => useSearchMenu(makeArgs({ suggestions, onSelect })));

    act(() => result.current.selectSuggestion(suggestions[0]!));
    expect(onSelect).toHaveBeenLastCalledWith({
      kind: "suggestion",
      key: "suggestion:1",
      item: suggestions[0],
    });

    act(() => result.current.requestLocation());
    expect(onSelect).toHaveBeenLastCalledWith({
      kind: "action",
      key: "action:location",
      action: "location",
    });

    act(() => result.current.selectRandom());
    expect(onSelect).toHaveBeenLastCalledWith({
      kind: "action",
      key: "action:random",
      action: "random",
    });
  });

  it("typing clears the explicit selection, so focus falls back to the first row", () => {
    const recents = [recent("a", "Paris"), recent("b", "London")];
    const { result } = renderHook(() => useSearchMenu(makeArgs({ recentItems: recents })));

    act(() => result.current.inputProps.onKeyDown(key("ArrowDown")));
    expect(result.current.focusedKey).toBe("recent:b");

    act(() => result.current.inputProps.onChange(change("P")));
    expect(result.current.focusedKey).toBe("recent:a");
  });
});
