import { cn } from "@/lib/utils";

interface ExposureCardProps {
  uv: number;
  airQualityIndex: number | null;
  isDay: boolean;
}

export function ExposureCard({ uv, airQualityIndex, isDay }: ExposureCardProps) {
  return (
    <section className="swap-in swap-d-6 bento-tile flex flex-col justify-center gap-5 sm:col-span-4 md:order-7 md:col-span-4 xl:order-6 xl:col-span-1">
      <MetricRow
        label="UV Index"
        value={isDay ? Math.round(uv) : null}
        tag={isDay ? uvLabel(uv) : "Nighttime"}
        scale={isDay ? uvScale(uv) : null}
        dim={!isDay}
      />
      <div aria-hidden="true" className="h-px w-full bg-foreground/10" />
      <MetricRow
        label="Air Quality"
        value={airQualityIndex}
        tag={airQualityIndex == null ? "Not available" : aqiLabel(airQualityIndex)}
        scale={airQualityIndex == null ? null : aqiScale(airQualityIndex)}
        dim={airQualityIndex == null}
      />
    </section>
  );
}

interface Scale {
  pct: number;
  gradient: string;
}

function MetricRow({
  label,
  value,
  tag,
  scale,
  dim,
}: {
  label: string;
  value: number | null;
  tag: string;
  scale: Scale | null;
  dim: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", dim && "opacity-55")}>
      <p className="label-section">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl leading-none tracking-tight">{value ?? "—"}</span>
        <span className="text-sm tracking-tight text-foreground/70">{tag}</span>
      </div>
      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/6">
        {scale && (
          <div
            className="absolute inset-0 rounded-full transition-[clip-path] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              background: scale.gradient,
              clipPath: `inset(0 ${100 - scale.pct}% 0 0)`,
            }}
          />
        )}
      </div>
    </div>
  );
}

function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function uvScale(uv: number): Scale {
  const pct = (Math.min(uv, 11) / 11) * 100;
  return {
    pct,
    gradient:
      "linear-gradient(to right, oklch(0.8003 0.1821 151.71) 0%, oklch(0.8493 0.2073 128.85) 20%, oklch(0.8606 0.1731 91.94) 40%, oklch(0.7576 0.1590 55.93) 60%, oklch(0.6368 0.2078 25.33) 88%, oklch(0.3958 0.1331 25.72) 100%)",
  };
}

function aqiLabel(epa: number): string {
  switch (epa) {
    case 1:
      return "Good";
    case 2:
      return "Moderate";
    case 3:
      return "Sensitive";
    case 4:
      return "Unhealthy";
    case 5:
      return "Very unhealthy";
    case 6:
      return "Hazardous";
    default:
      return "—";
  }
}

function aqiScale(epa: number): Scale {
  const clamped = Math.max(1, Math.min(6, epa));
  const pct = ((clamped - 0.5) / 6) * 100;
  return {
    pct,
    gradient:
      "linear-gradient(to right, oklch(0.8003 0.1821 151.71) 0%, oklch(0.8606 0.1731 91.94) 25%, oklch(0.7576 0.1590 55.93) 50%, oklch(0.6368 0.2078 25.33) 75%, oklch(0.5054 0.1905 27.52) 90%, oklch(0.3958 0.1331 25.72) 100%)",
  };
}
