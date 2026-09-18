import type { LucideIcon } from "lucide-react";
import type { ComponentProps, Ref } from "react";
import { cn } from "@/lib/utils";
import { GLYPH_SIZE, GLYPH_STROKE, ICON_BUTTON, NAV_PANEL_ID } from "./contract";

/** One control family across the bar and the panel header. Colour and hover
 *  state come from the `nav-icon-button` rules in `index.css`. */
const NAV_ICON_BUTTON = cn(
  "nav-icon-button flex shrink-0 items-center justify-center rounded-full outline-none",
  "transition-[color,transform] duration-150 active:scale-95",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

const NAV_ICON_BOX = { width: ICON_BUTTON, height: ICON_BUTTON } as const;

export function NavIconButton({
  icon: Icon,
  label,
  className,
  ref,
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  ref?: Ref<HTMLButtonElement> | undefined;
} & Omit<ComponentProps<"button">, "ref" | "children">) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(NAV_ICON_BUTTON, className)}
      style={NAV_ICON_BOX}
      {...rest}
    >
      <Icon size={GLYPH_SIZE} strokeWidth={GLYPH_STROKE} aria-hidden="true" className="shrink-0" />
    </button>
  );
}

interface NavTriggerProps {
  icon: LucideIcon;
  label: string;
  isOpen: boolean;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export function NavTrigger({ icon, label, isOpen, onClick, ref }: NavTriggerProps) {
  return (
    <NavIconButton
      ref={ref}
      icon={icon}
      label={label}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={NAV_PANEL_ID}
    />
  );
}
