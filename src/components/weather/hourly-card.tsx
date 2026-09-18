import { useEffect, useRef, useState } from "react";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PersonStandingIcon,
  ThermometerIcon,
  UmbrellaIcon,
} from "lucide-react";
import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react";
import type { HourlyForecast } from "@/api/types";
import { UnitValue } from "@/components/unit-value";
import { useUnitSystem } from "@/hooks/use-unit-system";
import { formatHour, formatWeekday, spokenHour } from "@/lib/clock";
import { prefersReducedMotion } from "@/lib/motion";
import { sweep } from "@/lib/scramble";
import { read, type UnitSystem } from "@/lib/units";
import { cn } from "@/lib/utils";
import { ConditionIcon } from "./condition-icon";

interface HourlyCardProps {
  hourly: HourlyForecast[] | undefined;
  tz: string;
}

interface HourRow {
  key: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  name: string;
  lead?: boolean;
  cell: (slot: HourlyForecast, system: UnitSystem, column: number) => ReactNode;
}

/** Per-column step of the unit sweep. 24 columns of it run 184 ms, so the last
 *  one still starts before the first has settled. */
const COLUMN_STEP = 8;

const ROWS: HourRow[] = [
  {
    key: "temp",
    icon: ThermometerIcon,
    name: "Temperature",
    lead: true,
    cell: (slot, system, column) => (
      <UnitValue text={read(slot.temp, system).text} delay={sweep(3, column * COLUMN_STEP)} />
    ),
  },
  {
    key: "feels",
    icon: PersonStandingIcon,
    name: "Feels like",
    cell: (slot, system, column) => (
      <UnitValue text={read(slot.feelsLike, system).text} delay={sweep(3, column * COLUMN_STEP)} />
    ),
  },
  {
    key: "precip",
    icon: UmbrellaIcon,
    name: "Chance of precipitation",
    cell: (slot) => `${precipChance(slot)}%`,
  },
];

/** The chance comparison catches what `willItSnow` misses: upstream reports
 *  `chanceOfRain: 0` for a sub-zero hour with snow falling. */
function precipChance(slot: HourlyForecast): number {
  const snowy = slot.willItSnow || slot.chanceOfSnow > slot.chanceOfRain;
  return snowy ? slot.chanceOfSnow : slot.chanceOfRain;
}

const SKELETON_COLUMNS = 24;

export function HourlyCard({ hourly, tz }: HourlyCardProps) {
  const slots = hourly ? pickSlots(hourly, tz) : undefined;
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      setCanLeft(el.scrollLeft > 1);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [slots?.length]);

  const step = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const col = el.querySelector<HTMLElement>("[data-hour-col]")?.offsetWidth ?? 0;
    const span =
      col > 0 ? Math.max(1, Math.floor((el.clientWidth * 0.8) / col)) * col : el.clientWidth * 0.8;
    el.scrollBy({
      left: dir * span,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  return (
    <section className="swap-in swap-d-3 bento-tile sm:col-span-4 md:order-5 md:col-span-8 lg:order-4 lg:col-span-5 xl:order-3 xl:col-span-2">
      <div className="hour-frame flex">
        <div className="hour-gutter" aria-hidden="true">
          <div className="hour-gutter-head" />
          {ROWS.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.key} className="hour-gutter-cell">
                <Icon className="size-4 text-foreground/70" strokeWidth={1.75} aria-hidden="true" />
              </div>
            );
          })}
        </div>

        {/* The step buttons overlay the two edges they operate on, so the
            table costs no vertical space for its own controls. */}
        <div className="relative min-w-0 flex-1">
          <div
            ref={ref}
            className="hour-fade hour-scroll scrollbar-none overflow-x-auto"
            data-fade-l={canLeft ? "" : undefined}
            data-fade-r={canRight ? "" : undefined}
          >
            {slots ? <HourTable slots={slots} /> : <HourTableSkeleton />}
          </div>

          <StepButton dir={-1} disabled={!canLeft} onClick={() => step(-1)} />
          <StepButton dir={1} disabled={!canRight} onClick={() => step(1)} />
        </div>
      </div>
    </section>
  );
}

interface Column {
  slot: HourlyForecast;
  isBreak: boolean;
}

function HourTable({ slots }: { slots: HourlyForecast[] }) {
  const system = useUnitSystem();
  const columns: Column[] = slots.map((slot, i) => {
    const prev = slots[i - 1];
    return { slot, isBreak: prev !== undefined && dateOf(slot.time) !== dateOf(prev.time) };
  });

  return (
    <table className="hour-table" style={{ "--hour-cols": columns.length } as CSSProperties}>
      <caption className="sr-only">The next 24 hours</caption>
      <thead>
        <tr>
          <td className="hour-gut-cell" />
          {columns.map(({ slot, isBreak }) => (
            <th
              key={slot.time}
              scope="col"
              data-hour-col=""
              className={cn("hour-head-cell", isBreak && "hour-daybreak")}
            >
              <span className="hour-head-inner">
                <span aria-hidden="true" className={cn("label-sub", isBreak && "text-foreground")}>
                  {isBreak ? weekdayLabel(slot.time) : hourLabel(slot.time)}
                </span>
                <ConditionIcon
                  text={slot.conditionText}
                  isDay={slot.isDay}
                  className="size-7 shrink-0 text-foreground/70"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </span>
              <span className="sr-only">
                {spokenColumn(slot.time, isBreak)}, {slot.conditionText}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.key}>
            <th scope="row" className="hour-gut-cell">
              <span className="sr-only">{row.name}</span>
            </th>
            {columns.map(({ slot, isBreak }, i) => (
              <td
                key={slot.time}
                className={cn(
                  "hour-cell",
                  row.lead && "hour-cell-lead",
                  isBreak && "hour-daybreak",
                )}
              >
                {row.cell(slot, system, i)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StepButton({
  dir,
  disabled,
  onClick,
}: {
  dir: -1 | 1;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === -1 ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === -1 ? "Scroll to earlier hours" : "Scroll to later hours"}
      className={cn("hour-step", dir === -1 ? "hour-step-l" : "hour-step-r")}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

function HourTableSkeleton() {
  const columns = Array.from({ length: SKELETON_COLUMNS }, (_, i) => i);
  return (
    <table
      className="hour-table"
      style={{ "--hour-cols": SKELETON_COLUMNS } as CSSProperties}
      aria-hidden="true"
    >
      <tbody>
        <tr>
          <td className="hour-gut-cell" />
          {columns.map((i) => (
            <td key={i} className="hour-head-cell">
              <span className="hour-head-inner">
                <span className="h-2.5 w-6 animate-pulse rounded bg-foreground/10" />
                <span className="size-7 animate-pulse rounded-xl bg-foreground/10" />
              </span>
            </td>
          ))}
        </tr>
        {/* Each bar stands as tall as the type it replaces, so the lead row
            reads as the taller one before the payload lands. */}
        {ROWS.map((row) => (
          <tr key={row.key}>
            <td className="hour-gut-cell" />
            {columns.map((i) => (
              <td key={i} className={cn("hour-cell", row.lead && "hour-cell-lead")}>
                <span
                  className={cn(
                    "mx-auto block animate-pulse rounded bg-foreground/10",
                    row.lead ? "h-3.5 w-7" : "h-3 w-6",
                  )}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function pickSlots(hourly: HourlyForecast[], tz: string): HourlyForecast[] {
  const { hour: nowHour, date: nowDate } = localNow(tz);

  const hourMap = new Map<string, HourlyForecast>();
  for (const h of hourly) {
    const key = h.time.replace(/:00$/, "").trim();
    hourMap.set(key, h);
  }

  const results: HourlyForecast[] = [];

  for (let offset = 1; offset <= 24; offset++) {
    const targetHour = nowHour + offset;
    const { date, hour } = rollForward(nowDate, targetHour);
    const hh = String(hour).padStart(2, "0");
    const key = `${date} ${hh}`;
    const match = hourMap.get(key);
    if (match) results.push(match);
  }

  return results;
}

function localNow(tz: string): { hour: number; date: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  const h = Number(parts.find((p) => p.type === "hour")!.value);
  return { hour: h === 24 ? 0 : h, date: `${y}-${m}-${d}` };
}

/** UTC: these are the city's calendar dates. Viewer-local arithmetic lands on
 *  the wrong day east of UTC+12. */
function rollForward(date: string, hour: number): { date: string; hour: number } {
  if (hour < 24) return { date, hour };
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.floor(hour / 24));
  return { date: d.toISOString().slice(0, 10), hour: hour % 24 };
}

function dateOf(time: string): string {
  return time.split(" ")[0] ?? time;
}

function hourLabel(time: string): string {
  return formatHour(hourOf(time));
}

function weekdayLabel(time: string): string {
  return formatWeekday(dateOf(time)) ?? hourLabel(time);
}

function spokenColumn(time: string, withDay: boolean): string {
  const clock = spokenHour(hourOf(time));
  if (!withDay) return clock;
  const day = formatWeekday(dateOf(time), "long");
  return day ? `${day}, ${clock}` : clock;
}

function hourOf(time: string): number {
  const timePart = time.split(" ")[1] ?? "00:00";
  return Number.parseInt(timePart.split(":")[0] ?? "0", 10);
}
