import { useId } from "react";
import type { Measure, MeasurePair } from "@/api/types";
import { UnitValue } from "@/components/unit-value";
import { useUnitSystem } from "@/hooks/use-unit-system";
import { sweep } from "@/lib/scramble";
import { read } from "@/lib/units";

/** The suffix trails its own value by one step, so a split reading settles
 *  left to right the way an undivided one does. */
const SUFFIX_STEP = 40;

interface WindCardProps {
  wind: MeasurePair;
  windDir: string;
  windDegree: number;
  gust: MeasurePair;
}

export function WindCard({ wind, windDir, windDegree, gust }: WindCardProps) {
  const system = useUnitSystem();
  const gusts = read(gust, system);

  return (
    <section className="swap-in swap-d-7 bento-tile flex flex-col sm:col-span-4 md:order-8 md:col-span-4 xl:order-7 xl:col-span-1">
      <div className="flex items-start justify-between gap-3">
        <p className="label-section">Wind</p>
        <div className="text-right">
          <p className="label-sub">Gusts</p>
          <p
            role="img"
            aria-label={gusts.spoken}
            className="mt-0.5 text-sm leading-tight tracking-tight"
          >
            <UnitValue text={gusts.value} delay={sweep(7)} />
            <span className="ml-1 text-foreground/70">
              <UnitValue text={gusts.suffix} delay={sweep(7, SUFFIX_STEP)} />
            </span>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <Compass wind={read(wind, system)} windDir={windDir} windDegree={windDegree} />
      </div>
    </section>
  );
}

const C = 57;
const R_RING = 52;

/** The blade sits inside the ring, tip at the bearing the wind blows *from*. */
function Compass({
  wind,
  windDir,
  windDegree,
}: {
  wind: Measure;
  windDir: string;
  windDegree: number;
}) {
  const uid = useId();
  const gradId = `${uid}-wind-grad`;

  return (
    <div className="relative mx-auto w-full max-w-[160px]">
      <svg viewBox="0 0 114 114" className="block w-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#5D5FE04D" />
            <stop offset="0.45" stopColor="#3C82EAE6" />
            <stop offset="1" stopColor="#22B8E6FF" />
          </linearGradient>
        </defs>

        <circle
          cx={C}
          cy={C}
          r={R_RING}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
        />

        {TICKS.map((deg) => {
          const inner = pointOn(47, deg);
          const outer = pointOn(R_RING, deg);
          return (
            <line
              key={deg}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="currentColor"
              strokeOpacity="0.13"
              strokeWidth="1"
            />
          );
        })}

        {CARDINALS.map(({ letter, deg }) => {
          const p = pointOn(42, deg);
          return (
            <text
              key={letter}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7.5"
              letterSpacing="0.5"
              fill="currentColor"
              fillOpacity="0.45"
            >
              {letter}
            </text>
          );
        })}

        <g
          transform={`rotate(${windDegree} ${C} ${C})`}
          className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
        >
          <path d={MARKER} fill={`url(#${gradId})`} />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p role="img" aria-label={wind.spoken} className="text-2xl leading-none tracking-tight">
          <UnitValue text={wind.value} delay={sweep(7)} />
          <span className="ml-1 text-sm text-foreground/70">
            <UnitValue text={wind.suffix} delay={sweep(7, SUFFIX_STEP)} />
          </span>
        </p>
        <p className="label-sub">{windDir}</p>
      </div>
    </div>
  );
}

const TICKS = Array.from({ length: 16 }, (_, i) => i * 22.5);

const CARDINALS = [
  { letter: "N", deg: 0 },
  { letter: "E", deg: 90 },
  { letter: "S", deg: 180 },
  { letter: "W", deg: 270 },
] as const;

function pointOn(radius: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: C + radius * Math.cos(rad), y: C + radius * Math.sin(rad) };
}

function marker(): string {
  const tip = pointOn(52, 0);
  const left = pointOn(40, -6.5);
  const right = pointOn(40, 6.5);
  const back = pointOn(43.5, 0);
  return `M ${tip.x} ${tip.y} L ${left.x} ${left.y} Q ${back.x} ${back.y} ${right.x} ${right.y} Z`;
}

const MARKER = marker();
