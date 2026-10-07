import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { SuggestionItem } from "@/api/types";
import type { WeatherClientError } from "@/api/weather";
import { itemIntent, type NavigableItem } from "@/components/search-bar/menu-model";
import { searchErrorMessage } from "@/components/search-bar/search-error-model";
import type { HistoryItem } from "@/hooks/use-history";
import type { CitySelectionIntent } from "@/lib/city-selection";
import { REDUCED_MOTION_FADE, SCRIM_FADE, SHEET_SPRING } from "@/lib/motion/constants";
import {
  NAV_LABEL_CLOSED,
  NAV_LABEL_OPEN,
  NAV_PANEL_ID,
  NAV_ROOT_ID,
  sheetGeometry,
  sheetOffscreen,
  sheetSurface,
} from "./contract";
import { NavBar } from "./nav-bar";
import { NavPanel } from "./nav-panel";
import { type PendingSelection, resolveHold, type SettleState } from "./pending-selection";
import { useDismissDrag } from "./use-dismiss-drag";
import { useNavPlacement } from "./use-nav-placement";

interface NavProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  activeQuery: string | null;
  settle: SettleState;
  error: WeatherClientError | null;
  recentItems: HistoryItem[];
  suggestions: SuggestionItem[];
  isSuggestionsLoading: boolean;
  onValueChange: (next: string) => void;
  onRecentRemove: (item: HistoryItem) => void;
  onRecentClearAll: () => void;
  /** Resolves the row to a city and writes `?city=`. Its result is the query
   *  the hold waits for; `null` means the row produced no city. */
  onSelectCity: (intent: CitySelectionIntent) => Promise<string | null>;
}

/**
 * `<nav aria-label="Main">` holds the controls and stays mounted. Search opens
 * a sibling `role="dialog"` sheet that travels in from the controls' edge and
 * leaves the same way.
 *
 * Modal is declared, not portalled. `<main>` and `<nav>` both carry `inert`
 * while the sheet is open, so there is nothing to trap focus away from and no
 * focus trap is implemented.
 */
export function Nav(props: NavProps) {
  const placement = useNavPlacement();
  const reduced = useReducedMotion();
  const isOpen = props.isOpen;

  const searchRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const [pending, setPending] = useState<PendingSelection | null>(null);

  const status = resolveHold(pending, props.activeQuery, props.settle);
  const errorMessage = searchErrorMessage(props.error, props.activeQuery);

  useEffect(() => {
    if (status === "settled") {
      setPending(null);
      props.onClose();
    } else if (status === "failed") {
      // Settled, unsuccessfully. The panel stays up and renders the message
      // inline; the field goes live again so the next query can be typed.
      setPending(null);
    }
    // A status transition is the only trigger. `props.onClose` is a fresh
    // closure on every parent render, so it stays out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Focus returns to whatever opened the sheet — the search trigger, or the
  // empty state's "Search a city" row.
  useEffect(() => {
    if (isOpen) {
      // The field's autofocus has already landed by the time this runs, so
      // anything inside the nav or the sheet is never the opener — the trigger
      // is covered by the fallback below.
      const active = document.activeElement as HTMLElement | null;
      openerRef.current = active?.closest(`#${NAV_ROOT_ID}, #${NAV_PANEL_ID}`) ? null : active;
      return;
    }
    setPending(null);
    const opener = openerRef.current;
    openerRef.current = null;
    const target = opener?.isConnected ? opener : searchRef.current;
    target?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        props.onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // The listener is bound once per open. `props.onClose` is a fresh closure on
    // every parent render, and adding it would rebind on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /** The hold opens before the query is known — every intent resolves on a
   *  promise — and is patched with what `onSelectCity` committed. */
  const commit = (item: NavigableItem) => {
    setPending({ key: item.key, query: null, startQuery: props.activeQuery });
    void props.onSelectCity(itemIntent(item)).then((query) => {
      setPending((p) => {
        if (!p || p.key !== item.key) return p;
        return query === null ? null : { ...p, query };
      });
    });
  };

  const offscreen = sheetOffscreen(placement);
  const hidden = reduced ? { opacity: 0 } : offscreen;
  const shown = reduced ? { opacity: 1 } : { x: 0, y: 0 };

  const dismiss = useDismissDrag({
    axis: placement.drag,
    enabled: isOpen && !reduced,
    onDismiss: props.onClose,
  });

  return (
    <>
      <nav id={NAV_ROOT_ID} aria-label={NAV_LABEL_CLOSED} inert={isOpen}>
        <NavBar
          placement={placement}
          isOpen={isOpen}
          onOpenSearch={props.onOpen}
          searchRef={searchRef}
        />
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nav-scrim"
            className="nav-scrim fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduced ? REDUCED_MOTION_FADE : SCRIM_FADE}
            onClick={props.onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nav-sheet"
            id={NAV_PANEL_ID}
            role="dialog"
            aria-modal="true"
            aria-label={NAV_LABEL_OPEN}
            data-open="true"
            className="nav-surface fixed z-50 overflow-hidden"
            style={{ ...sheetGeometry(placement), ...sheetSurface(placement) }}
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={reduced ? REDUCED_MOTION_FADE : SHEET_SPRING}
            onPointerDown={dismiss.onPointerDown}
            {...dismiss.containerProps}
          >
            <NavPanel
              recentItems={props.recentItems}
              suggestions={props.suggestions}
              isSuggestionsLoading={props.isSuggestionsLoading}
              errorMessage={errorMessage}
              pending={pending}
              onValueChange={props.onValueChange}
              onRecentRemove={props.onRecentRemove}
              onRecentClearAll={props.onRecentClearAll}
              onSelect={commit}
              onClose={props.onClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
