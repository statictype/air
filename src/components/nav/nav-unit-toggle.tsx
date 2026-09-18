import { useUnitSystemControl } from "@/hooks/use-unit-system";
import type { UnitSystem } from "@/lib/units";
import { cn } from "@/lib/utils";
import { ICON_BUTTON } from "./contract";

interface Option {
  system: UnitSystem;
  glyph: string;
  /** Leads with the visible character, so the accessible name contains it. */
  label: string;
}

const METRIC: Option = { system: "metric", glyph: "C", label: "C, metric units" };
const IMPERIAL: Option = { system: "imperial", glyph: "F", label: "F, imperial units" };

/** The same 44 px cell the icon buttons use. */
const LETTER_BOX = { width: ICON_BUTTON, height: ICON_BUTTON } as const;

function UnitLetter({
  option,
  active,
  onSelect,
}: {
  option: Option;
  active: boolean;
  onSelect: (system: UnitSystem) => void;
}) {
  return (
    <button
      type="button"
      aria-label={option.label}
      aria-pressed={active}
      onClick={() => onSelect(option.system)}
      style={LETTER_BOX}
      className={cn(
        "unit-switch-option flex shrink-0 items-center justify-center rounded-full outline-none",
        "text-[17px] leading-none font-normal transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      {option.glyph}
    </button>
  );
}

/**
 * The unit switch, in the bar at every placement. Two letters laid along the
 * bar's long axis — side by side on the top and bottom bars, stacked on the
 * rail.
 */
export function NavUnitToggle({ vertical }: { vertical: boolean }) {
  const [system, setSystem] = useUnitSystemControl();

  return (
    <div
      role="group"
      aria-label="Units"
      className={cn("flex shrink-0 items-center", vertical ? "flex-col" : "flex-row")}
    >
      <UnitLetter option={METRIC} active={system === "metric"} onSelect={setSystem} />
      <UnitLetter option={IMPERIAL} active={system === "imperial"} onSelect={setSystem} />
    </div>
  );
}
