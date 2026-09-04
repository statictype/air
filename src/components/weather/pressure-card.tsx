import type { MeasurePair } from "@/api/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UnitValue } from "@/components/unit-value";
import { useUnitSystem } from "@/hooks/use-unit-system";
import { sweep } from "@/lib/scramble";
import { read } from "@/lib/units";

/** The suffix trails its own value by one step, so a split reading settles
 *  left to right the way an undivided one does. */
const SUFFIX_STEP = 40;

interface PressureCardProps {
  pressureMb: number;
  pressure: MeasurePair;
}

// The scale is centred on the Normal band: (980 + 1050) / 2 lands at 1015.
const PRESSURE_MIN = 980;
const PRESSURE_MAX = 1050;

const CX = 110;
const CY = 104;
const R = 88;

interface PressureBand {
  /** Lower bound, inclusive; the next band's `min` is the exclusive upper bound. */
  min: number;
  label: string;
  color: string;
  health: string;
}

const BANDS: readonly [PressureBand, ...PressureBand[]] = [
  {
    min: 970,
    label: "Severe low",
    color: "#E0574FE6",
    health:
      "High risk of severe migraines, sinus pressure, and intense arthritic joint pain as body tissues expand.",
  },
  {
    min: 995,
    label: "Low",
    color: "#E8A24ACC",
    health:
      "Mild headaches, drowsiness, and low blood pressure or dizziness are possible if you are sensitive to pressure.",
  },
  {
    min: 1009,
    label: "Normal",
    color: "#27B98CFF",
    health: "The comfort zone. No pressure-related symptoms expected.",
  },
  {
    min: 1021.1,
    label: "High",
    color: "#8FC96ACC",
    health: "Clear and stable. If you are prone to dry eyes or dry skin, expect mild irritation.",
  },
  {
    min: 1030.1,
    label: "Extreme high",
    color: "#E8823CE6",
    health:
      "Dense air that can trigger sudden sinus or ear popping, and trap allergens and pollution at ground level.",
  },
];

export function PressureCard({ pressureMb, pressure }: PressureCardProps) {
  const system = useUnitSystem();
  const band = bandFor(pressureMb);
  const reading = read(pressure, system);

  return (
    <section className="swap-in swap-d-8 bento-tile flex flex-col sm:col-span-4 md:order-9 md:col-span-4 xl:order-8 xl:col-span-1">
      <p className="label-section">Pressure</p>
      <div className="flex flex-1 flex-col justify-center">
        <div className="relative mx-auto w-full max-w-[240px]">
          <svg viewBox="0 0 220 116" className="block w-full" aria-hidden="true">
            {BANDS.map((b, i) => (
              <path key={b.label} d={bandArc(i)} fill="none" stroke={b.color} strokeWidth="7" />
            ))}

            <g
              transform={`rotate(${90 - angleFor(pressureMb)} ${CX} ${CY})`}
              className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
            >
              <path d={POINTER} fill="currentColor" fillOpacity="0.8" />
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center">
            <p
              role="img"
              aria-label={reading.spoken}
              className="text-2xl leading-none tracking-tight"
            >
              <UnitValue text={reading.value} delay={sweep(8)} />
              <span className="ml-1 text-sm text-foreground/70">
                <UnitValue text={reading.suffix} delay={sweep(8, SUFFIX_STEP)} />
              </span>
            </p>
            <Tooltip>
              <TooltipTrigger className="label-sub pointer-events-auto mt-1.5 cursor-help underline decoration-dotted underline-offset-4">
                {band.label}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-56">
                {band.health}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </section>
  );
}

function bandFor(mb: number): PressureBand {
  let match = BANDS[0];
  for (const band of BANDS) {
    if (mb >= band.min) match = band;
  }
  return match;
}

/** Degrees counter-clockwise from the +x axis: 180 is the low end, 0 the high end. */
function angleFor(mb: number): number {
  const clamped = Math.max(PRESSURE_MIN, Math.min(PRESSURE_MAX, mb));
  return 180 - ((clamped - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN)) * 180;
}

function pointOn(radius: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function bandArc(i: number): string {
  const GAP = 1;
  const from = angleFor(BANDS[i]?.min ?? PRESSURE_MIN) - (i === 0 ? 0 : GAP);
  const to = angleFor(BANDS[i + 1]?.min ?? PRESSURE_MAX) + (BANDS[i + 1] ? GAP : 0);
  const a = pointOn(R, from);
  const b = pointOn(R, to);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
}

function pointer(): string {
  const tip = pointOn(82, 90);
  const left = pointOn(70, 93.3);
  const right = pointOn(70, 86.7);
  return `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`;
}

const POINTER = pointer();
