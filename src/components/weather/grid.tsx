import type { WeatherCurrent } from "@/api/types";
import { cn } from "@/lib/utils";
import { useWeatherForecast } from "@/hooks/use-weather";
import { AlertsCard } from "./alerts-card";
import { demoAlerts } from "./alerts-demo";
import { AstroCard } from "./astro-card";
import { ExposureCard } from "./exposure-card";
import { ForecastCard } from "./forecast-card";
import { HeroCard } from "./hero-card";
import { HourlyCard } from "./hourly-card";
import { NowCard } from "./now-card";
import { PressureCard } from "./pressure-card";
import { WindCard } from "./wind-card";

interface WeatherGridProps {
  query: string | null;
  current: WeatherCurrent;
  isStale: boolean;
}

export function WeatherGrid({ query, current: c, isStale }: WeatherGridProps) {
  const forecast = useWeatherForecast(query);

  const swapKey = `${c.location.name}-${c.location.country}`;

  const alerts = demoAlerts() ?? forecast.data?.alerts;
  const hasAlerts = alerts !== undefined && alerts.length > 0;

  return (
    <div
      key={swapKey}
      aria-busy={isStale}
      className={cn(
        // 8 columns from `md` to `xl`. The Now column takes 4 of them beside an
        // equal forecast, and 3 from `lg`, where the hourly card sits beside it.
        "grid w-full auto-rows-[minmax(150px,auto)] grid-cols-1 gap-5 transition-opacity duration-300 sm:grid-cols-4 sm:gap-6 md:grid-cols-8 xl:grid-cols-4",
        hasAlerts && "md:grid-rows-[auto_auto] xl:grid-rows-none",
        isStale && "opacity-60",
      )}
    >
      <HeroCard location={c.location} current={c.current} />

      <div className="flex flex-col gap-5 sm:col-span-4 sm:gap-6 md:contents xl:order-2 xl:col-span-1 xl:row-span-1 xl:flex">
        <AlertsCard
          alerts={alerts}
          tz={c.location.tz}
          isNight={c.current.timeOfDay === "night"}
          className="md:order-2 md:col-span-8"
        />
        <NowCard
          current={c.current}
          className="md:order-3 md:col-span-4 lg:col-span-3 lg:row-span-2"
        />
      </div>
      <HourlyCard hourly={forecast.data?.hourly} tz={c.location.tz} />
      <ForecastCard forecast={forecast.data?.forecast} />
      <AstroCard
        astro={forecast.data?.astro}
        lat={c.location.lat}
        isNight={c.current.timeOfDay === "night"}
      />
      <ExposureCard
        uv={c.current.uv}
        airQualityIndex={forecast.data?.airQualityIndex ?? null}
        isDay={c.current.timeOfDay === "day"}
      />
      <WindCard
        wind={c.current.wind}
        windDir={c.current.windDir}
        windDegree={c.current.windDegree}
        gust={c.current.gust}
      />
      <PressureCard pressureMb={c.current.pressureMb} pressure={c.current.pressure} />
    </div>
  );
}
