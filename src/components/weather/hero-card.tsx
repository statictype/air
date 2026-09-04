import { useEffect, useState } from "react";
import type { CurrentConditions, WeatherLocation } from "@/api/types";
import { formatDate, formatTime } from "@/lib/clock";
import { cn } from "@/lib/utils";
import { ConditionIcon } from "./condition-icon";

interface HeroCardProps {
  location: WeatherLocation;
  current: CurrentConditions;
}

const CONDITION = "text-base sm:text-xl leading-snug";

export function HeroCard({ location, current }: HeroCardProps) {
  const isDay = current.timeOfDay === "day";
  const country = location.country;
  const now = useTicker();

  return (
    <section
      className={cn(
        "swap-in swap-d-1 relative col-span-1 xl:order-1 overflow-hidden rounded-[2rem] p-6 text-white",
        "sm:col-span-4 sm:p-10 md:order-1 md:col-span-8 xl:col-span-3 xl:p-12",
        isDay
          ? "hero-day shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35),0_30px_60px_-25px_rgba(24,102,225,0.55)]"
          : "hero-night shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_30px_60px_-25px_rgba(8,8,24,0.85)]",
      )}
    >
      <div className="flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-center sm:gap-10">
        <div
          className={cn(
            "contents sm:flex sm:h-full sm:min-h-fit sm:min-w-0 sm:flex-col sm:gap-y-4",
            "sm:max-h-52 xl:max-h-64",
          )}
        >
          <div>
            {country && <p className="label-section leading-none text-white">{country}</p>}
            <h2 className="type-display mt-1 text-balance">{location.name}</h2>
          </div>

          <div className="order-1 sm:order-none sm:contents">
            <p className={cn(CONDITION, "sm:my-auto")}>{current.conditionText}</p>
            <p className="label-section mt-2 flex items-center gap-2.5 leading-none text-white sm:mt-0">
              <span>{formatDate(now, location.tz)}</span>
              <span className="h-2.5 w-px shrink-0 bg-white/30" aria-hidden="true" />
              <time dateTime={new Date(now).toISOString()} className="tabular-nums">
                {formatTime(now, location.tz)}
              </time>
            </p>
          </div>
        </div>

        <ConditionIcon
          text={current.conditionText}
          isDay={isDay}
          className={cn(
            "size-36 shrink-0 self-center [stroke-width:0.83]",
            "sm:size-44 sm:[stroke-width:0.68]",
            "xl:size-55 xl:[stroke-width:0.53]",
            isDay ? "text-white/90" : "text-[oklch(0.62_0.03_250)]",
          )}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

function useTicker(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
