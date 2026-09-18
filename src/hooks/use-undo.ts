import { useEffect, useRef, useState } from "react";

export interface PendingRemoval<T> {
  items: T[];
  label: string;
}

export interface UseUndoReturn<T> {
  pending: PendingRemoval<T> | null;
  stage: (removal: PendingRemoval<T>) => void;
  undo: () => PendingRemoval<T> | null;
  commit: () => void;
}

const DEFAULT_TIMEOUT_MS = 5000;

/** Holds removed items for `timeoutMs` so a toast can offer Undo before the removal is final. */
export function useUndo<T>(timeoutMs: number = DEFAULT_TIMEOUT_MS): UseUndoReturn<T> {
  const [pending, setPending] = useState<PendingRemoval<T> | null>(null);
  // `undo` runs from a toast callback captured in an earlier render, so it reads
  // the ref instead of the `pending` value that closure captured.
  const pendingRef = useRef<PendingRemoval<T> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const setBoth = (next: PendingRemoval<T> | null) => {
    pendingRef.current = next;
    setPending(next);
  };

  const commit = () => {
    clearTimer();
    setBoth(null);
  };

  const stage = (removal: PendingRemoval<T>) => {
    clearTimer();
    setBoth(removal);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setBoth(null);
    }, timeoutMs);
  };

  const undo = (): PendingRemoval<T> | null => {
    clearTimer();
    const restored = pendingRef.current;
    setBoth(null);
    return restored;
  };

  useEffect(() => clearTimer, []);

  return { pending, stage, undo, commit };
}
