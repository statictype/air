import { motion } from "motion/react";
import { useId } from "react";
import { useUnitSystemControl } from "@/hooks/use-unit-system";
import { PILL_SPRING } from "@/lib/motion/constants";
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
  pillId,
  onSelect,
}: {
  option: Option;
  active: boolean;
  /** Shared by both letters, so the pill slides from one to the other. */
  pillId: string;
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
        "unit-switch-option relative flex shrink-0 items-center justify-center rounded-full outline-none",
        "text-[17px] leading-none font-normal transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      {active && (
        <motion.span
          layoutId={pillId}
          transition={PILL_SPRING}
          className="unit-switch-pill absolute inset-0 rounded-full"
          aria-hidden="true"
        />
      )}
      <span className="relative">{option.glyph}</span>
    </button>
  );
}

/**
 * The unit switch, at every placement. Two letters side by side in the
 * capsule below `lg`, stacked at `lg` and wider. A pill sits behind the active
 * one.
 */
export function NavUnitToggle({ vertical }: { vertical: boolean }) {
  const [system, setSystem] = useUnitSystemControl();
  const pillId = useId();

  return (
    <div
      role="group"
      aria-label="Units"
      className={cn("flex shrink-0 items-center", vertical ? "flex-col" : "flex-row")}
    >
      <UnitLetter
        option={METRIC}
        active={system === "metric"}
        pillId={pillId}
        onSelect={setSystem}
      />
      <UnitLetter
        option={IMPERIAL}
        active={system === "imperial"}
        pillId={pillId}
        onSelect={setSystem}
      />
    </div>
  );
}
