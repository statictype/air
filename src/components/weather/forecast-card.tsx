import type { ForecastDay } from "@/api/types";
import { UnitValue } from "@/components/unit-value";
import { useUnitSystem } from "@/hooks/use-unit-system";
import { formatWeekday } from "@/lib/clock";
import { sweep } from "@/lib/scramble";
import { read, type UnitSystem } from "@/lib/units";
import { cn } from "@/lib/utils";
import { ConditionIcon } from "./condition-icon";
import { PrecipStrip } from "./precip-strip";

interface ForecastCardProps {
  forecast: ForecastDay[] | undefined;
}

/** Index 0 of the upstream array is today, which the card leads with. */
const MAX_DAYS = 4;

/** Free keys cap the payload at 3 days total, so today plus 2 future days is
 *  what lands; a plan upgrade brings a fourth, and the columns tighten to fit
 *  it. Every column carries the same padding on both sides and the grid hands
 *  the outer half back with a matching negative margin, so all columns measure
 *  the same width. Static strings, because Tailwind scans source text and
 *  cannot see an interpolated column count. */
const LAYOUTS: Record<number, string> = {
  1: "fc-wide:-mx-6 fc-wide:grid-cols-1 fc-wide:[&>*]:px-6",
  2: "fc-wide:-mx-6 fc-wide:grid-cols-2 fc-wide:[&>*]:px-6",
  3: "fc-wide:-mx-4 fc-wide:grid-cols-3 fc-wide:[&>*]:px-4",
  4: "fc-wide:-mx-3 fc-wide:grid-cols-4 fc-wide:[&>*]:px-3",
};

/** Matches the current plan's 3 days, so the common case does not reflow. */
const SKELETON_DAYS = 3;

export function ForecastCard({ forecast }: ForecastCardProps) {
  const system = useUnitSystem();
  const days = forecast?.slice(0, MAX_DAYS);
  const layout = LAYOUTS[days?.length ?? SKELETON_DAYS] ?? LAYOUTS[MAX_DAYS];

  return (
    <section className="swap-in swap-d-4 bento-tile flex flex-col justify-center sm:col-span-4 md:order-4 md:col-span-4 lg:order-5 lg:col-span-5 xl:order-4 xl:col-span-2">
      {/* Days are a divided list outside `fc-wide` and a column matrix inside
          it, so the rule between them turns and the row padding folds away.
          `-my-3` cancels the outer rows' own `py-3`. */}
      <div
        className={cn(
          "-my-3 grid grid-cols-1 divide-y divide-foreground/10",
          "fc-wide:my-0 fc-wide:divide-y-0",
          "fc-wide:[&>*:not(:last-child)]:border-r fc-wide:[&>*:not(:last-child)]:border-foreground/10",
          layout,
        )}
      >
        {days
          ? days.map((day, i) => (
              <div key={day.date} className="fc-col min-w-0 py-3 fc-wide:py-0">
                <DayColumn
                  day={day}
                  label={forecastLabel(day.date, i)}
                  system={system}
                  delay={sweep(4, i * 40)}
                />
              </div>
            ))
          : Array.from({ length: SKELETON_DAYS }, (_, i) => (
              <div key={i} className="fc-col min-w-0 py-3 fc-wide:py-0">
                <DayColumnSkeleton />
              </div>
            ))}
      </div>
    </section>
  );
}

function DayColumn({
  day,
  label,
  system,
  delay,
}: {
  day: ForecastDay;
  label: string;
  system: UnitSystem;
  delay: number;
}) {
  return (
    <div className="fc-day min-w-0">
      <span className="fc-name label-section truncate">{label}</span>
      {/* 1.05 at 40px draws the same 1.75px line as the hourly icons at
          28px/1.5. */}
      <ConditionIcon
        text={day.conditionText}
        isDay={day.isDay}
        className="fc-icon size-10 shrink-0 text-foreground/70"
        strokeWidth={1.05}
        aria-hidden="true"
      />
      <span className="fc-temp text-lg leading-none tracking-tight tabular-nums whitespace-nowrap">
        <UnitValue text={read(day.max, system).text} delay={delay} />
        <span className="ml-1 text-sm text-foreground/70">
          / <UnitValue text={read(day.min, system).text} delay={delay + 20} />
        </span>
      </span>
      <span className="fc-cond truncate text-sm text-foreground/70">{day.conditionText}</span>
      <PrecipStrip day={day} className="fc-prec" delay={delay + 40} />
    </div>
  );
}

/** Each bar is the height of the line box it stands in — 18 / 40 / 24 / 20 / 20
 *  — so a day measures the same as a row and as a column either way, and the
 *  tile does not resize when the payload lands. */
function DayColumnSkeleton() {
  return (
    <div aria-hidden="true" className="fc-day min-w-0">
      <div className="fc-name h-[18px] w-16 animate-pulse rounded bg-foreground/10" />
      <div className="fc-icon size-10 shrink-0 animate-pulse rounded-xl bg-foreground/10" />
      <div className="fc-temp h-6 w-20 animate-pulse rounded bg-foreground/10" />
      <div className="fc-cond h-5 w-24 animate-pulse rounded bg-foreground/10" />
      <div className="fc-prec h-5 w-14 animate-pulse rounded bg-foreground/10" />
    </div>
  );
}

/** `index` counts from today, so 0 is today and 1 is tomorrow. */
function forecastLabel(date: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return formatWeekday(date) ?? date;
}
