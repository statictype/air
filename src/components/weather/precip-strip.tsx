import { SnowflakeIcon, UmbrellaIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { DayPrecip, Measure } from "@/api/types";
import { UnitValue } from "@/components/unit-value";
import { useUnitSystem } from "@/hooks/use-unit-system";
import { cn } from "@/lib/utils";

interface PrecipStripProps {
  day: DayPrecip | undefined;
  className?: string;
  /** This day's place in the unit sweep. See `sweep`. */
  delay?: number;
}

/** One line per kind of precipitation, under the day column it belongs to.
 *  The rain line always renders, so a day's height does not depend on whether
 *  it snows. Each line carries its amount whenever the Worker sends one. */
export function PrecipStrip({ day, className, delay = 0 }: PrecipStripProps) {
  const system = useUnitSystem();
  const snow = day?.totalSnow?.[system] ?? null;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {day === undefined ? (
        <span className="h-5 w-16 animate-pulse rounded bg-foreground/10" aria-hidden="true" />
      ) : (
        <>
          <Line
            icon={UmbrellaIcon}
            name="Chance of rain"
            chance={day.chanceOfRain}
            amount={day.totalPrecip?.[system] ?? null}
            delay={delay}
          />
          {(day.willItSnow || snow) && (
            <Line
              icon={SnowflakeIcon}
              name="Chance of snow"
              chance={day.chanceOfSnow}
              amount={snow}
              delay={delay + 20}
            />
          )}
        </>
      )}
    </div>
  );
}

function Line({
  icon: Icon,
  name,
  chance,
  amount,
  delay,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  name: string;
  chance: number;
  amount: Measure | null;
  delay: number;
}) {
  return (
    // `role="img"` gives the line one accessible name instead of per-glyph output.
    <span
      role="img"
      aria-label={`${name}, ${chance} percent${amount ? `, ${amount.spoken}` : ""}`}
      className="flex min-h-5 items-center gap-1.5 text-sm text-foreground/70 tabular-nums"
    >
      <span className="flex h-5 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {chance}%
      </span>
      {amount && (
        <>
          <span className="flex h-5 items-center text-foreground/40" aria-hidden="true">
            ·
          </span>
          {/* The amount is one token: it stacks under the chance rather than
              breaking between the number and its suffix. */}
          <span className="flex h-5 items-center whitespace-nowrap">
            <UnitValue text={amount.text} delay={delay} />
          </span>
        </>
      )}
    </span>
  );
}
