import { useEffect, useId, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import type { Astro } from "@/api/types";
import { ScrambleText } from "@/components/scramble-text";
import { TabButton } from "@/components/tab-button";
import { formatClock, parseClockMinutes } from "@/lib/clock";
import { prefersReducedMotion } from "@/lib/motion";
import { moonGeometry, moonLitPath } from "@/lib/moon";
import { cn } from "@/lib/utils";

type AstroView = "sun" | "moon";

/** Just short of the `.astro-body-set` duration in `index.css`, because the
 *  swap costs a render. By the time it paints, the outgoing body is at the far
 *  end of the arc and all but transparent. */
const SET_MS = 280;

/** Milliseconds after the switch, left to right. The side info is not on the
 *  ladder: its two views are different shapes, so it fades rather than churns. */
const CHURN = { rise: 60, set: 120 } as const;

interface AstroCardProps {
  astro: Astro | undefined;
  /** Viewer latitude. Below the equator the moon's lit side mirrors. */
  lat: number;
  isNight: boolean;
}

export function AstroCard({ astro, lat, isNight }: AstroCardProps) {
  const [view, setView] = useState<AstroView>(isNight ? "moon" : "sun");
  // What the sky currently draws. It trails `view` by one setting, so the
  // switch happens with both bodies out of sight.
  const [drawn, setDrawn] = useState<AstroView>(view);
  // The tile's own entrance is `.swap-in`; the sky only moves once asked to.
  const [switched, setSwitched] = useState(false);
  const leaving = drawn !== view;
  const bodyClass = !switched ? undefined : leaving ? "astro-body-set" : "astro-body-rise";

  function select(next: AstroView) {
    setSwitched(true);
    setView(next);
    // Nothing sets, so nothing has to wait for it.
    if (prefersReducedMotion()) setDrawn(next);
  }

  useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => setDrawn(view), SET_MS);
    return () => window.clearTimeout(id);
  }, [leaving, view]);

  return (
    <section
      className={cn(
        "swap-in swap-d-5 bento-tile relative flex flex-col overflow-hidden sm:col-span-4 md:order-6 md:col-span-4 xl:order-5 xl:col-span-1",
        drawn === "sun" ? "tile-astro" : "tile-astro-moon",
      )}
    >
      <Stars />

      <div className="astro-content relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <TabButton active={view === "sun"} onClick={() => select("sun")} label="Show sun times">
            <SunIcon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          </TabButton>
          <TabButton
            active={view === "moon"}
            onClick={() => select("moon")}
            label="Show moon times and phase"
          >
            {astro ? (
              <MoonGlyph
                illumination={astro.moonIllumination}
                phase={astro.moonPhase}
                lat={lat}
                size={20}
              />
            ) : (
              <MoonIcon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
            )}
          </TabButton>
        </div>

        {/* Fixed height: the sun's two lines measure 34.5px and the moon's
            39.5px, and the difference would move the arc on every switch.
            Reads `drawn`, so the content changes while the block is at zero. */}
        <div className="astro-info h-10 min-w-0 text-right" data-leaving={leaving || undefined}>
          {astro ? <SideInfo view={drawn} astro={astro} /> : <SideInfoSkeleton />}
        </div>
      </div>

      <div className="astro-content relative mt-3 flex w-full flex-1 flex-col">
        <ArcPanel view={view} drawn={drawn} bodyClass={bodyClass} astro={astro} lat={lat} />
      </div>
    </section>
  );
}

function SideInfo({ view, astro }: { view: AstroView; astro: Astro }) {
  if (view === "moon") {
    return (
      <>
        <p className="truncate text-sm leading-tight tracking-tight">{astro.moonPhase}</p>
        <p className="mt-0.5 text-sm text-foreground/70">{astro.moonIllumination}% illuminated</p>
      </>
    );
  }
  return (
    <>
      <p className="label-sub">Daylight</p>
      <p className="mt-0.5 text-sm leading-tight tracking-tight">
        {computeDayLength(astro.sunrise, astro.sunset)}
      </p>
    </>
  );
}

function SideInfoSkeleton() {
  return (
    <>
      <div className="ml-auto h-4 w-24 animate-pulse rounded bg-foreground/10" aria-hidden="true" />
      <div
        className="mt-1.5 ml-auto h-3 w-16 animate-pulse rounded bg-foreground/10"
        aria-hidden="true"
      />
    </>
  );
}

interface ArcPanelProps {
  /** Drives the times and labels, which churn in place from the first frame. */
  view: AstroView;
  /** Drives the sky, which trails by one setting. */
  drawn: AstroView;
  bodyClass: string | undefined;
  lat: number;
  astro: Astro | undefined;
}

function ArcPanel({ view, drawn, bodyClass, lat, astro }: ArcPanelProps) {
  const isSun = view === "sun";
  const rise = isSun ? astro?.sunrise : astro?.moonrise;
  const set = isSun ? astro?.sunset : astro?.moonset;
  const labels = isSun ? { rise: "Sunrise", set: "Sunset" } : { rise: "Moonrise", set: "Moonset" };

  return (
    <div className="flex flex-1 flex-col">
      {/* The arc is capped so its height cannot follow the card's width; the
          times below it are not, and sit on the tile's edges. */}
      <div className="mx-auto w-full max-w-[400px]">
        <Arc kind={drawn} bodyClass={bodyClass} astro={astro} lat={lat} />
      </div>
      <div className="mt-auto flex items-end justify-between pt-2">
        <div>
          {rise ? (
            <p className="text-base leading-none tracking-tight">
              <ScrambleText text={formatClock(rise)} delay={CHURN.rise} />
            </p>
          ) : (
            <Skeleton />
          )}
          <p className="label-sub mt-1">
            <ScrambleText text={labels.rise} delay={CHURN.rise} />
          </p>
        </div>
        <div className="text-right">
          {set ? (
            <p className="text-base leading-none tracking-tight">
              <ScrambleText text={formatClock(set)} delay={CHURN.set} />
            </p>
          ) : (
            <Skeleton />
          )}
          <p className="label-sub mt-1">
            <ScrambleText text={labels.set} delay={CHURN.set} />
          </p>
        </div>
      </div>
    </div>
  );
}

/** Horizon at y=68, control point at y=4. The apex is the curve's midpoint at
 *  (160, 36), which is where a body at `offset-distance: 50%` rests. */
const ARC_D = "M 20 68 Q 160 4 300 68";

function Arc({
  kind,
  bodyClass,
  astro,
  lat,
}: {
  kind: "sun" | "moon";
  bodyClass: string | undefined;
  astro?: Astro | undefined;
  lat: number;
}) {
  const uid = useId();
  const sunArcId = `${uid}-sun-arc`;
  const moonArcId = `${uid}-moon-arc`;
  const sunDiscId = `${uid}-sun-disc`;
  const sunGlowId = `${uid}-sun-glow`;
  const moonLitId = `${uid}-moon-lit`;
  const horizonClipId = `${uid}-horizon`;
  const isSun = kind === "sun";
  const dotColor = isSun ? "oklch(0.85 0.15 65)" : "oklch(0.85 0.04 250)";

  return (
    <svg viewBox="0 0 320 76" className="block aspect-[320/76] w-full" aria-hidden="true">
      <defs>
        {/* Both arcs exist at all times: the switch crossfades them. */}
        <linearGradient id={sunArcId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="oklch(0.85 0.15 65)" stopOpacity="0" />
          <stop offset="0.18" stopColor="oklch(0.85 0.15 65)" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="oklch(0.9 0.18 85)" stopOpacity="1" />
          <stop offset="0.82" stopColor="oklch(0.85 0.15 65)" stopOpacity="0.5" />
          <stop offset="1" stopColor="oklch(0.85 0.15 65)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={moonArcId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="oklch(0.8 0.04 250)" stopOpacity="0" />
          <stop offset="0.18" stopColor="oklch(0.8 0.04 250)" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="oklch(0.95 0.02 250)" stopOpacity="1" />
          <stop offset="0.82" stopColor="oklch(0.8 0.04 250)" stopOpacity="0.45" />
          <stop offset="1" stopColor="oklch(0.8 0.04 250)" stopOpacity="0" />
        </linearGradient>
        {isSun && (
          <>
            <radialGradient id={sunGlowId} cx="0.5" cy="0.5">
              <stop offset="0" stopColor="oklch(0.95 0.18 85)" stopOpacity="0.5" />
              <stop offset="0.55" stopColor="oklch(0.92 0.17 80)" stopOpacity="0.18" />
              <stop offset="1" stopColor="oklch(0.95 0.18 85)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={sunDiscId} cx="0.4" cy="0.35">
              <stop offset="0" stopColor="oklch(0.97 0.13 90)" />
              <stop offset="1" stopColor="oklch(0.85 0.18 65)" />
            </radialGradient>
          </>
        )}
        {!isSun && (
          <radialGradient id={moonLitId} cx="0.4" cy="0.4" r="0.75">
            <stop offset="0" stopColor="oklch(0.98 0.02 80)" />
            <stop offset="1" stopColor="oklch(0.86 0.06 75)" />
          </radialGradient>
        )}
        {/* Ends 0.75 below the horizon — the arc's round cap, and nothing more.
            A body at either end of the path is half under it. */}
        <clipPath id={horizonClipId}>
          <rect x="-40" y="-80" width="400" height="148.75" />
        </clipPath>
      </defs>

      <line
        x1="0"
        y1="68"
        x2="320"
        y2="68"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="0.6"
        strokeDasharray="2 4"
      />
      <circle className="astro-node" cx="20" cy="68" r="3" fill={dotColor} />
      <circle className="astro-node" cx="300" cy="68" r="3" fill={dotColor} />

      <g clipPath={`url(#${horizonClipId})`}>
        <path
          className="astro-arc"
          d={ARC_D}
          fill="none"
          stroke={`url(#${sunArcId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isSun ? 1 : 0}
        />
        <path
          className="astro-arc"
          d={ARC_D}
          fill="none"
          stroke={`url(#${moonArcId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={isSun ? 0 : 1}
        />

        {/* Drawn at the origin: `offset-path` does the placing. */}
        <g
          key={kind}
          className={cn("astro-body", bodyClass)}
          style={{ offsetPath: `path("${ARC_D}")` }}
        >
          {isSun ? (
            <>
              <circle cx="0" cy="0" r="31.5" fill={`url(#${sunGlowId})`} />
              <circle cx="0" cy="0" r="16.5" fill={`url(#${sunDiscId})`} />
            </>
          ) : astro ? (
            <MoonBodyShapes
              cx={0}
              cy={0}
              r={16.5}
              illumination={astro.moonIllumination}
              phase={astro.moonPhase}
              lat={lat}
              litGradId={moonLitId}
            />
          ) : (
            <circle cx="0" cy="0" r="16.5" fill="currentColor" fillOpacity="0.12" />
          )}
        </g>
      </g>
    </svg>
  );
}

function MoonBodyShapes({
  cx,
  cy,
  r,
  illumination,
  phase,
  lat,
  litGradId,
}: {
  cx: number;
  cy: number;
  r: number;
  illumination: number;
  phase: string;
  lat: number;
  litGradId: string;
}) {
  const litPath = moonLitPath(moonGeometry(illumination, phase, lat, r), cx, cy, r);

  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--moon-dark)" />
      <path d={litPath} fill={`url(#${litGradId})`} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.5"
      />
    </g>
  );
}

function MoonGlyph({
  illumination,
  phase,
  lat,
  size = 20,
}: {
  illumination: number;
  phase: string;
  lat: number;
  size?: number;
}) {
  const uid = useId();
  const litGradId = `${uid}-lit`;
  const VB = 44;
  const r = 18;
  const c = VB / 2;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      width={size}
      height={size}
      className="block shrink-0"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={litGradId} cx="0.4" cy="0.4" r="0.75">
          <stop offset="0" stopColor="oklch(0.98 0.02 80)" />
          <stop offset="1" stopColor="oklch(0.86 0.06 75)" />
        </radialGradient>
      </defs>
      <MoonBodyShapes
        cx={c}
        cy={c}
        r={r}
        illumination={illumination}
        phase={phase}
        lat={lat}
        litGradId={litGradId}
      />
    </svg>
  );
}

function Stars() {
  return (
    <svg
      className="astro-content pointer-events-none absolute inset-0 size-full opacity-50"
      aria-hidden="true"
    >
      <circle cx="8%" cy="14%" r="0.8" fill="currentColor" opacity="0.35" />
      <circle cx="22%" cy="6%" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="68%" cy="3%" r="0.7" fill="currentColor" opacity="0.28" />
      <circle cx="86%" cy="11%" r="0.6" fill="currentColor" opacity="0.3" />
      <circle cx="93%" cy="24%" r="0.9" fill="currentColor" opacity="0.22" />
      <circle cx="4%" cy="42%" r="0.5" fill="currentColor" opacity="0.25" />
      <circle cx="97%" cy="58%" r="0.6" fill="currentColor" opacity="0.22" />
    </svg>
  );
}

function Skeleton() {
  return <div className="h-4 w-14 animate-pulse rounded bg-foreground/10" aria-hidden="true" />;
}

function computeDayLength(sunrise: string, sunset: string): string {
  const rise = parseClockMinutes(sunrise);
  const setM = parseClockMinutes(sunset);
  if (rise === null || setM === null) return "—";
  let diff = setM - rise;
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
}
