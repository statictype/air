import { useState } from "react";
import {
  InfoIcon,
  Maximize2Icon,
  OctagonAlertIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";
import type { AlertSeverity, WeatherAlert } from "@/api/types";
import { DialogScroll } from "@/components/dialog-scroll";
import { formatStamp } from "@/lib/clock";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * `rail` is the card's; `mark` and `badge` are the modal's. The plate itself is
 * `.tile-alert` in `index.css`, because `.bento-tile` sets `background` and
 * `border` unlayered and a utility cannot override those.
 */
const SEVERITY: Record<
  AlertSeverity,
  { icon: LucideIcon; word: string | null; rail: string; mark: string; badge: string }
> = {
  extreme: {
    icon: OctagonAlertIcon,
    word: "Extreme",
    rail: "[--alert-rail:var(--sev-extreme)]",
    mark: "text-[var(--sev-extreme)]",
    badge: "bg-[var(--sev-extreme)] text-[var(--sev-extreme-on)]",
  },
  severe: {
    icon: TriangleAlertIcon,
    word: "Severe",
    rail: "[--alert-rail:var(--sev-severe)]",
    mark: "text-[var(--sev-severe)]",
    badge: "bg-[var(--sev-severe)] text-[var(--sev-severe-on)]",
  },
  moderate: {
    icon: TriangleAlertIcon,
    word: "Moderate",
    rail: "[--alert-rail:var(--sev-moderate)]",
    mark: "text-[var(--sev-moderate)]",
    badge: "bg-[var(--sev-moderate)] text-[var(--sev-moderate-on)]",
  },
  minor: {
    icon: InfoIcon,
    word: "Minor",
    rail: "[--alert-rail:color-mix(in_oklab,var(--foreground)_45%,transparent)]",
    mark: "text-foreground/70",
    badge: "bg-foreground/70 text-background",
  },
  unknown: {
    icon: InfoIcon,
    word: null,
    rail: "[--alert-rail:color-mix(in_oklab,var(--foreground)_45%,transparent)]",
    mark: "text-foreground/70",
    badge: "bg-foreground/70 text-background",
  },
};

interface AlertsCardProps {
  alerts: readonly WeatherAlert[] | undefined;
  tz: string;
  /** The modal portals onto `<body>`, outside the `.night` root, so it needs the class itself. */
  isNight: boolean;
  /** Grid placement, which changes with the breakpoint — see `WeatherGrid`. */
  className?: string;
}

export function AlertsCard({ alerts, tz, isNight, className }: AlertsCardProps) {
  const [open, setOpen] = useState(false);
  const top = alerts?.[0];
  if (!alerts || !top) return null;

  const { word, rail } = SEVERITY[top.severity];
  const extra = alerts.length - 1;
  const until = formatUntil(top.expires, tz);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "swap-in swap-d-2 bento-tile tile-alert group relative flex w-full items-center gap-4",
          "overflow-hidden text-left",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          rail,
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="tile-alert-sweep pointer-events-none absolute inset-0"
        />
        <span
          aria-hidden="true"
          className="tile-alert-rail pointer-events-none absolute inset-y-0 start-0 w-[3px]"
        />

        <span className="relative flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="line-clamp-2 min-w-0 text-xl leading-snug font-light tracking-tight">
            {top.event}
          </span>
          {until && <span className="text-sm tracking-tight">{until}</span>}
        </span>

        <span className="relative flex shrink-0 items-center gap-3">
          {extra > 0 && (
            <>
              <span className="text-sm tabular-nums text-foreground/70" aria-hidden="true">
                +{extra}
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-foreground/10" />
            </>
          )}
          <Maximize2Icon
            className="size-4 shrink-0 text-foreground/70 transition-colors group-hover:text-foreground"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </span>

        <span className="sr-only">
          {word ? `${word} severity. ` : ""}
          {alerts.length === 1 ? "1 active alert" : `${alerts.length} active alerts`}. Show details.
        </span>
      </DialogTrigger>

      <AlertsDialog alerts={alerts} tz={tz} isNight={isNight} />
    </Dialog>
  );
}

function AlertsDialog({
  alerts,
  tz,
  isNight,
}: Omit<AlertsCardProps, "alerts"> & {
  alerts: readonly WeatherAlert[];
}) {
  return (
    <DialogContent
      className={cn(
        "glass-panel dialog-panel dialog-sheet grid max-h-[85svh] grid-rows-[auto_minmax(0,1fr)]",
        "gap-0 rounded-[2.25rem] border-0 p-0 text-foreground sm:max-w-xl",
        isNight && "night",
      )}
    >
      <DialogHeader className="border-b border-foreground/10 px-6 pt-6 pe-16 pb-5 text-left sm:px-8 sm:pt-8 sm:pe-20">
        <DialogTitle className="text-xl font-light tracking-tight">
          {alerts.length === 1 ? "Weather alert" : "Weather alerts"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {alerts.length === 1
            ? "1 active alert for this location, in the location's local time."
            : `${alerts.length} active alerts for this location, worst first, in the location's local time.`}
        </DialogDescription>
      </DialogHeader>

      <DialogScroll className="px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="divide-y divide-foreground/10">
          {alerts.map((alert, i) => (
            <AlertEntry key={`${alert.event}-${alert.effective}-${i}`} alert={alert} tz={tz} />
          ))}
        </div>
      </DialogScroll>
    </DialogContent>
  );
}

function AlertEntry({ alert, tz }: { alert: WeatherAlert; tz: string }) {
  const { icon: Icon, word, mark, badge } = SEVERITY[alert.severity];
  const range = formatRange(alert.effective, alert.expires, tz);

  return (
    <article className="py-5.5 first:pt-5 last:pb-1">
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-1 size-4 shrink-0", mark)} strokeWidth={1.75} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base leading-snug tracking-tight text-balance">
            {alert.event || alert.headline || "Weather alert"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {word && (
              <span className={cn("inline-block rounded-[0.75rem] px-2 py-0.5 text-xs", badge)}>
                {word}
              </span>
            )}
            {range && <span className="text-sm text-foreground/70">{range}</span>}
          </div>

          {alert.areas && <p className="mt-1.5 text-sm text-foreground/70">{alert.areas}</p>}
        </div>
      </div>

      {alert.desc && (
        <p className="mt-4 pl-6.5 text-sm leading-relaxed whitespace-pre-line">{alert.desc}</p>
      )}
      {alert.instruction && (
        <div className="mt-4 ml-6.5">
          <span aria-hidden="true" className="block h-px w-8 bg-foreground/25" />
          <p className="mt-3.5 text-sm leading-relaxed whitespace-pre-line">{alert.instruction}</p>
        </div>
      )}
    </article>
  );
}

function formatRange(effective: string, expires: string, tz: string): string | null {
  const from = parseInstant(effective);
  const to = parseInstant(expires);
  if (from === null && to === null) return null;
  if (from === null) return `Until ${formatStamp(to as number, tz, true)}`;
  if (to === null) return `From ${formatStamp(from, tz, true)}`;
  const sameDay = formatDay(from, tz) === formatDay(to, tz);
  return `${formatStamp(from, tz, true)} – ${formatStamp(to, tz, !sameDay)}`;
}

function formatUntil(expires: string, tz: string): string | null {
  const to = parseInstant(expires);
  if (to === null) return null;
  const sameDay = formatDay(Date.now(), tz) === formatDay(to, tz);
  const stamp = formatStamp(to, tz, !sameDay);
  return stamp === "—" ? null : `Until ${stamp}`;
}

function parseInstant(iso: string): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function formatDay(t: number, tz: string): string {
  try {
    return new Date(t).toLocaleDateString("en-CA", { timeZone: tz });
  } catch {
    return "";
  }
}
