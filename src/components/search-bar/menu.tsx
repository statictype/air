import {
  ClockIcon,
  LocateFixedIcon,
  MapPinIcon,
  SearchXIcon,
  ShuffleIcon,
  XIcon,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { LayoutGroup, motion } from "motion/react";
import type { SuggestionItem } from "@/api/types";
import type { HistoryItem } from "@/hooks/use-history";
import { PILL_SPRING } from "@/lib/motion/constants";
import { cn } from "@/lib/utils";
import type { MenuModel, MenuSection, NavigableItem } from "./menu-model";
import { SectionHeader } from "./section-header";

const ClearAllButton = lazy(() => import("./clear-all-button"));

interface MenuProps {
  model: MenuModel;
  focusedKey: string | null;
  /** Row the panel is holding open for. Its well carries the indicator. */
  pendingKey: string | null;
  hoverKey: (key: string | null) => void;
  selectRecent: (item: HistoryItem) => void;
  selectSuggestion: (item: SuggestionItem) => void;
  requestLocation: () => void;
  selectRandom: () => void;
  onRecentRemove: (item: HistoryItem) => void;
  onRecentClearAll: () => void;
  isDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export function Menu(props: MenuProps) {
  return (
    <LayoutGroup id="search-menu">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-4 pb-3">
          {props.model.sections.map((section, idx) => (
            <SectionRenderer key={sectionKey(section, idx)} section={section} {...props} />
          ))}
        </div>
        <ActionFooter {...props} />
      </div>
    </LayoutGroup>
  );
}

function SectionRenderer({ section, ...props }: { section: MenuSection } & MenuProps) {
  if (section.kind === "recent") {
    return (
      <section className="mb-3">
        <div className="mb-2 flex items-center justify-between px-3 py-2">
          <SectionHeader label="Recent" />
          <Suspense fallback={null}>
            <ClearAllButton
              onConfirm={props.onRecentClearAll}
              open={props.isDialogOpen}
              onOpenChange={props.setDialogOpen}
            />
          </Suspense>
        </div>
        <ul className="flex flex-col">
          {section.items.map((item) => (
            <RecentRow
              key={item.id}
              item={item}
              focused={props.focusedKey === `recent:${item.id}`}
              pending={props.pendingKey === `recent:${item.id}`}
              hoverKey={props.hoverKey}
              onSelect={props.selectRecent}
              onRemove={props.onRecentRemove}
            />
          ))}
        </ul>
      </section>
    );
  }

  if (section.kind === "suggestions-loading") {
    return (
      <section>
        <div className="mb-1.5 px-3">
          <SectionHeader label="Suggestions" />
        </div>
        <ul className="flex flex-col">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10">
                <MapPinIcon
                  className="size-3.5 text-foreground/10"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </span>
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="h-3.5 w-40 animate-pulse rounded-md bg-foreground/10" />
                <span className="h-2.5 w-24 animate-pulse rounded-md bg-foreground/10" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (section.kind === "suggestions") {
    return (
      <section>
        {section.showHeader && (
          <div className="mb-1.5 px-3">
            <SectionHeader label="Suggestions" />
          </div>
        )}
        <ul className="flex flex-col">
          {section.items.map((item) => (
            <SuggestionRow
              key={item.id}
              item={item}
              focused={props.focusedKey === `suggestion:${item.id}`}
              pending={props.pendingKey === `suggestion:${item.id}`}
              hoverKey={props.hoverKey}
              onSelect={props.selectSuggestion}
            />
          ))}
        </ul>
      </section>
    );
  }

  if (section.kind === "empty-results") {
    return (
      <MenuEmpty
        icon={SearchXIcon}
        title="No cities found"
        hint="Try a different spelling, or fewer words."
      />
    );
  }

  if (section.kind === "no-history") {
    return (
      <MenuEmpty
        icon={ClockIcon}
        title="Cities you look up show up here"
        hint="Type three letters to search, or take a shortcut below."
      />
    );
  }

  return (
    <div className="px-3 py-2">
      <p className="text-sm text-foreground/70">Keep typing for city suggestions…</p>
    </div>
  );
}

/**
 * The two states where the panel would otherwise be blank. `m-auto` centres the
 * block in the scroll area instead of pinning it to the top.
 */
function MenuEmpty({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof ClockIcon;
  title: string;
  hint: string;
}) {
  return (
    <div className="m-auto flex flex-col items-center gap-4 px-6 py-10 text-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-foreground/6">
        <Icon className="size-5 text-foreground/70" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-base tracking-tight">{title}</p>
        <p className="max-w-[26ch] text-sm text-balance text-foreground/70">{hint}</p>
      </div>
    </div>
  );
}

/** While the panel holds for a selection the row's well carries the wait, so
 *  the indicator sits where the row's own icon was rather than beside it. */
function RowWell({ icon: Icon, pending }: { icon: typeof ClockIcon; pending: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150",
        pending ? "bg-foreground/10" : "bg-foreground/6 group-hover:bg-foreground/10",
      )}
    >
      {pending ? (
        <span
          className="border-foreground/10 border-t-foreground size-3.5 rounded-full border-2 motion-safe:animate-spin"
          aria-hidden="true"
        />
      ) : (
        <Icon className="text-foreground/70 size-3.5" strokeWidth={1.75} aria-hidden="true" />
      )}
    </span>
  );
}

function FocusPill() {
  return (
    <motion.div
      layoutId="search-focus-pill"
      className="search-focus-pill absolute inset-0 rounded-xl"
      transition={PILL_SPRING}
      aria-hidden="true"
    />
  );
}

function RecentRow({
  item,
  focused,
  pending,
  hoverKey,
  onSelect,
  onRemove,
}: {
  item: HistoryItem;
  focused: boolean;
  pending: boolean;
  hoverKey: (key: string | null) => void;
  onSelect: (item: HistoryItem) => void;
  onRemove: (item: HistoryItem) => void;
}) {
  const navKey = `recent:${item.id}`;
  return (
    <li className="group relative" onMouseEnter={() => hoverKey(navKey)}>
      {focused && <FocusPill />}
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelect(item);
        }}
        className="relative flex w-full items-center gap-3 px-3 py-3 pr-11 text-left focus-visible:outline-none"
        aria-label={`Load weather for ${item.displayName}`}
        aria-busy={pending || undefined}
      >
        <RowWell icon={ClockIcon} pending={pending} />
        <span
          className={cn(
            "flex-1 truncate text-base tracking-tight transition-colors duration-150",
            focused || pending ? "text-foreground" : "text-foreground/70",
          )}
        >
          {item.displayName}
        </span>
      </motion.button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item);
        }}
        className={cn(
          "absolute right-2 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-foreground/70 transition-all duration-150 hover:bg-foreground/10 hover:text-foreground/70 focus-visible:outline-none active:scale-90",
          // Always visible on touch; hover-to-reveal on desktop.
          "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
          focused && "lg:opacity-100",
          pending && "pointer-events-none opacity-0",
        )}
        aria-label={`Remove ${item.displayName} from history`}
      >
        <XIcon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      </button>
    </li>
  );
}

function SuggestionRow({
  item,
  focused,
  pending,
  hoverKey,
  onSelect,
}: {
  item: SuggestionItem;
  focused: boolean;
  pending: boolean;
  hoverKey: (key: string | null) => void;
  onSelect: (item: SuggestionItem) => void;
}) {
  const navKey = `suggestion:${item.id}`;
  const rest = [item.region, item.country].filter(Boolean).join(", ");
  return (
    <li className="group relative">
      {focused && <FocusPill />}
      <motion.button
        type="button"
        whileTap={{ scale: 0.985 }}
        onMouseEnter={() => hoverKey(navKey)}
        onMouseDown={(e) => {
          e.preventDefault();
          onSelect(item);
        }}
        className="relative flex w-full items-center gap-3 px-3 py-3 text-left focus-visible:outline-none"
        aria-label={`Search weather for ${item.name}`}
        aria-busy={pending || undefined}
      >
        <RowWell icon={MapPinIcon} pending={pending} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate text-base tracking-tight transition-colors duration-150",
              focused || pending ? "text-foreground" : "text-foreground/70",
            )}
          >
            {item.name}
          </span>
          {rest && <span className="truncate text-sm text-foreground/70">{rest}</span>}
        </span>
      </motion.button>
    </li>
  );
}

function ActionFooter(props: MenuProps) {
  return (
    <ul className="search-action-footer flex shrink-0 items-stretch">
      {props.model.actions.map((nav, idx) => (
        <ActionButton
          key={nav.key}
          nav={nav}
          focused={props.focusedKey === nav.key}
          pending={props.pendingKey === nav.key}
          hoverKey={props.hoverKey}
          requestLocation={props.requestLocation}
          selectRandom={props.selectRandom}
          withDivider={idx > 0}
        />
      ))}
    </ul>
  );
}

function ActionButton({
  nav,
  focused,
  pending,
  hoverKey,
  requestLocation,
  selectRandom,
  withDivider,
}: {
  nav: NavigableItem;
  focused: boolean;
  pending: boolean;
  hoverKey: (key: string | null) => void;
  requestLocation: () => void;
  selectRandom: () => void;
  withDivider: boolean;
}) {
  if (nav.kind !== "action") return null;
  const handler = nav.action === "location" ? requestLocation : selectRandom;
  const Icon = nav.action === "location" ? LocateFixedIcon : ShuffleIcon;
  const label = nav.action === "location" ? "My location" : "Surprise me";

  return (
    <li className="relative flex flex-1">
      {withDivider && (
        <span
          aria-hidden="true"
          className="search-action-divider absolute left-0 top-1/2 h-5 w-px -translate-y-1/2"
        />
      )}
      <button
        type="button"
        onMouseEnter={() => hoverKey(nav.key)}
        onMouseDown={(e) => {
          e.preventDefault();
          handler();
        }}
        className="group flex h-full w-full items-center justify-center gap-2 px-3 py-4 focus-visible:outline-none lg:py-3.5"
        aria-busy={pending || undefined}
      >
        {pending ? (
          <span
            className="border-foreground/10 border-t-foreground size-4 shrink-0 rounded-full border-2 motion-safe:animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Icon
            className={cn(
              "text-foreground/70 size-4 shrink-0 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-safe:group-hover:rotate-180",
              focused && "motion-safe:rotate-180",
            )}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "text-sm tracking-tight transition-colors duration-150",
            pending ? "text-foreground" : "text-foreground/70",
          )}
        >
          {label}
        </span>
      </button>
    </li>
  );
}

function sectionKey(section: MenuSection, idx: number): string {
  return `${section.kind}-${idx}`;
}
