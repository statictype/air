import { useState } from "react";
import {
  BubblesIcon,
  CloudIcon,
  CloudRainIcon,
  DropletsIcon,
  EyeIcon,
  Maximize2Icon,
  PersonStandingIcon,
  ThermometerIcon,
  ThermometerSnowflakeIcon,
  ThermometerSunIcon,
  WindIcon,
  type LucideIcon,
} from "lucide-react";
import type { CurrentConditions } from "@/api/types";
import { DialogScroll } from "@/components/dialog-scroll";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UnitValue } from "@/components/unit-value";
import { useUnitSystem } from "@/hooks/use-unit-system";
import { sweep } from "@/lib/scramble";
import { read, type UnitSystem } from "@/lib/units";
import { cn } from "@/lib/utils";

interface Reading {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Which readings reach the tile, and in what order — the dialog keeps `readingsOf`'s. */
const FACE: readonly string[] = ["temp", "feels", "wind", "cloud"];

function readingsOf(c: CurrentConditions, system: UnitSystem): Reading[] {
  return [
    { key: "temp", icon: ThermometerIcon, label: "Temperature", value: read(c.temp, system).text },
    {
      key: "feels",
      icon: PersonStandingIcon,
      label: "Feels like",
      value: read(c.feelsLike, system).text,
    },
    { key: "wind", icon: WindIcon, label: "Wind", value: c.beaufort ?? "—" },
    {
      key: "windchill",
      icon: ThermometerSnowflakeIcon,
      label: "Wind chill",
      value: read(c.windchill, system).text,
    },
    {
      key: "heatindex",
      icon: ThermometerSunIcon,
      label: "Heat index",
      value: read(c.heatIndex, system).text,
    },
    { key: "dew", icon: BubblesIcon, label: "Dew", value: read(c.dewpoint, system).text },
    { key: "humidity", icon: DropletsIcon, label: "Humidity", value: `${c.humidity}%` },
    { key: "cloud", icon: CloudIcon, label: "Cloud cover", value: `${c.cloud}%` },
    {
      key: "precip",
      icon: CloudRainIcon,
      label: "Precipitation",
      value: read(c.precip, system).text,
    },
    {
      key: "visibility",
      icon: EyeIcon,
      label: "Visibility",
      value: read(c.visibility, system).text,
    },
  ];
}

interface NowCardProps {
  current: CurrentConditions;
  /** Grid placement, which changes with the breakpoint — see `WeatherGrid`. */
  className?: string;
}

export function NowCard({ current, className }: NowCardProps) {
  const [open, setOpen] = useState(false);
  const system = useUnitSystem();
  const sentence = current.comfort?.sentence ?? "—";
  const readings = readingsOf(current, system);
  const face = readings
    .filter((r) => FACE.includes(r.key))
    .sort((a, b) => FACE.indexOf(a.key) - FACE.indexOf(b.key));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "swap-in swap-d-2 bento-tile tile-now group relative w-full overflow-hidden text-left",
            "flex flex-col gap-5",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "md:flex-1",
            className,
          )}
        >
          <span
            aria-hidden="true"
            className="tile-now-sweep pointer-events-none absolute inset-0"
          />

          <span className="relative flex items-center justify-between gap-3">
            <span className="label-section">Now</span>
            <Maximize2Icon
              className="size-4 shrink-0 text-foreground/70 transition-colors group-hover:text-foreground"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </span>

          <span className="relative flex flex-1 flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-10 md:flex-col md:items-stretch md:gap-5">
            <span className="block text-2xl leading-tight font-light text-balance sm:flex-1 md:my-auto md:flex-initial xl:my-0">
              {sentence}
            </span>

            {/* `-mb-3` cancels the last row's own `py-3` against the tile padding. */}
            <span className="-mb-3 block divide-y divide-foreground/10 sm:w-[340px] sm:shrink-0 md:w-auto">
              {face.map((r, i) => (
                <FaceRow key={r.key} reading={r} delay={sweep(2, i * 20)} />
              ))}
            </span>
          </span>

          <span className="sr-only">Show all current readings</span>
        </button>
      </DialogTrigger>

      <NowDialog sentence={sentence} readings={readings} isNight={current.timeOfDay === "night"} />
    </Dialog>
  );
}

function FaceRow({ reading, delay }: { reading: Reading; delay: number }) {
  const { icon: Icon, label, value } = reading;
  return (
    <span className="flex items-center justify-between gap-3 py-3">
      <span className="flex items-center gap-2.5">
        <Icon
          className="size-4 shrink-0 text-foreground/70"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className="label-sub">{label}</span>
      </span>
      <span className="text-base tracking-tight">
        <UnitValue text={value} delay={delay} />
      </span>
    </span>
  );
}

function NowDialog({
  sentence,
  readings,
  isNight,
}: {
  sentence: string;
  readings: Reading[];
  isNight: boolean;
}) {
  return (
    <DialogContent
      className={cn(
        "glass-panel dialog-panel dialog-sheet grid max-h-[85svh] grid-rows-[auto_minmax(0,1fr)]",
        "gap-0 rounded-[2.25rem] border-0 p-0 text-foreground sm:max-w-md",
        isNight && "night",
      )}
    >
      {/* The end padding clears the close control's 36px pane. */}
      <DialogHeader className="border-b border-foreground/10 px-6 pt-6 pe-16 pb-5 text-left sm:px-8 sm:pt-8 sm:pe-20">
        <DialogTitle className="text-xl font-light tracking-tight text-balance">
          {sentence}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Every current reading for this location.
        </DialogDescription>
      </DialogHeader>

      <DialogScroll className="px-6 pt-2 pb-6 sm:px-8 sm:pb-8">
        <dl className="divide-y divide-foreground/10">
          {readings.map(({ key, icon: Icon, label, value }, i) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3.5">
              <dt className="flex items-center gap-2.5">
                <Icon
                  className="size-4 shrink-0 text-foreground/70"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="label-sub">{label}</span>
              </dt>
              <dd className="text-right text-base tracking-tight">
                <UnitValue text={value} delay={i * 20} />
              </dd>
            </div>
          ))}
        </dl>
      </DialogScroll>
    </DialogContent>
  );
}
