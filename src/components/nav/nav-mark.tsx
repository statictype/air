import logoNightUrl from "@/assets/logo-night.webp";
import logoUrl from "@/assets/logo.webp";
import { LOGO_BOX } from "./contract";

const MARK_BOX = { width: LOGO_BOX, height: LOGO_BOX } as const;

/** The page's `<h1>`. At `lg` and wider it heads the left column; below that
 *  it is the centred first row of the content column. */
export function NavMark() {
  return (
    <h1 style={MARK_BOX} className="relative shrink-0 leading-none select-none" aria-label="air">
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="nav-mark-day absolute inset-0 size-full object-cover"
      />
      <img
        src={logoNightUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="nav-mark-night absolute inset-0 size-full object-cover"
      />
    </h1>
  );
}
