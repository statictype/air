/**
 * The parts of the nav that both the browser suite and every visual treatment
 * agree on: where the bar sits, how big it is, and what the panel is called.
 * Class names, colour and motion are not in here.
 */

export type BarEdge = "bottom" | "top" | "left";
export type PanelMode = "fullscreen" | "partial";
/** Direction a dismiss drag travels. `null` at ≥ 1280, where there is no drag. */
export type DragAxis = "down" | "up" | "left" | null;

export interface NavPlacement {
  edge: BarEdge;
  panel: PanelMode;
  drag: DragAxis;
}

/** Tailwind's md, lg and xl. */
export const BREAKPOINT_MD = 768;
export const BREAKPOINT_LG = 1024;
export const BREAKPOINT_XL = 1280;

export const MEDIA_MD = `(min-width: ${BREAKPOINT_MD}px)`;
export const MEDIA_LG = `(min-width: ${BREAKPOINT_LG}px)`;
export const MEDIA_XL = `(min-width: ${BREAKPOINT_XL}px)`;

/** Pixels. */
export const BAR_THICKNESS = 56;
export const BAR_INSET = 12;
export const ICON_BUTTON = 44;
/** The ring left when a 44 px cell is centred across the 56 px bar. Also the
 *  cluster's padding at the bar's ends. */
export const BAR_END_INSET = (BAR_THICKNESS - ICON_BUTTON) / 2;
export const LOGO_BOX = 44;
export const GLYPH_SIZE = 20;
export const GLYPH_STROKE = 1.75;
/** What `<main>` is padded by on the bar's side. */
export const RAIL_FOOTPRINT = BAR_THICKNESS + BAR_INSET;
/** Panel width when the panel is `partial`. */
export const PANEL_WIDTH = 420;
/** The dialog corner the design system gives every overlay surface. */
export const PANEL_RADIUS = 36;

/** Stable across open and close — the container is one node. */
export const NAV_ROOT_ID = "nav-root";
export const NAV_PANEL_ID = "nav-panel";

export const NAV_LABEL_CLOSED = "Main";
export const NAV_LABEL_OPEN = "Search";

export function navPlacement(width: number): NavPlacement {
  if (width < BREAKPOINT_MD) return { edge: "bottom", panel: "fullscreen", drag: "down" };
  if (width < BREAKPOINT_LG) return { edge: "top", panel: "fullscreen", drag: "up" };
  if (width < BREAKPOINT_XL) return { edge: "left", panel: "fullscreen", drag: "left" };
  return { edge: "left", panel: "partial", drag: null };
}

/** Same table, from the three media queries the hook subscribes to. */
export function placementFromMatches(md: boolean, lg: boolean, xl: boolean): NavPlacement {
  if (xl) return navPlacement(BREAKPOINT_XL);
  if (lg) return navPlacement(BREAKPOINT_LG);
  if (md) return navPlacement(BREAKPOINT_MD);
  return navPlacement(0);
}

/** Inline styles rather than Tailwind arbitrary values: the browser suite reads
 *  these numbers back off `getBoundingClientRect()`, so they have to survive
 *  whatever class names a visual treatment puts on the container. */
export interface BoxStyle {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  height?: string;
}

const INSET = `${BAR_INSET}px`;
/** `env()` resolves to 0 everywhere except a notched viewport. */
const INSET_BOTTOM = `calc(${BAR_INSET}px + env(safe-area-inset-bottom, 0px))`;

export function barGeometry(placement: NavPlacement): BoxStyle {
  if (placement.edge === "bottom") {
    return { left: INSET, right: INSET, bottom: INSET_BOTTOM, height: `${BAR_THICKNESS}px` };
  }
  if (placement.edge === "top") {
    return { left: INSET, right: INSET, top: INSET, height: `${BAR_THICKNESS}px` };
  }
  return { left: INSET, top: INSET, bottom: INSET, width: `${BAR_THICKNESS}px` };
}

export function panelGeometry(placement: NavPlacement): BoxStyle {
  if (placement.panel === "partial") {
    return { left: INSET, top: INSET, bottom: INSET, width: `${PANEL_WIDTH}px` };
  }
  return { left: "0px", right: "0px", top: "0px", bottom: "0px" };
}

export function mainPadding(placement: NavPlacement): BoxStyle & {
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
} {
  const pad = `${RAIL_FOOTPRINT}px`;
  if (placement.edge === "bottom") {
    return { paddingBottom: `calc(${pad} + env(safe-area-inset-bottom, 0px))` };
  }
  if (placement.edge === "top") return { paddingTop: pad };
  return { paddingLeft: pad };
}

export const PANEL_PAD = 12;
export const HEADER_ROW = 52;

const SAFE_TOP = "env(safe-area-inset-top, 0px)";
const FULL = { top: "0px", right: "0px", bottom: "0px", left: "0px" } as const;

export function barLayer(placement: NavPlacement, containerIsPanel: boolean): BoxStyle {
  if (!containerIsPanel) return { ...FULL };
  if (placement.panel === "partial") {
    return { left: "0px", top: "0px", bottom: "0px", width: `${BAR_THICKNESS}px` };
  }
  return barGeometry(placement);
}

export function panelLayer(placement: NavPlacement, containerIsPanel: boolean): BoxStyle {
  if (containerIsPanel) return { ...FULL };
  if (placement.panel === "partial") {
    return { left: "0px", top: "0px", bottom: "0px", width: `${PANEL_WIDTH}px` };
  }
  const size = { width: "100dvw", height: "100dvh" };
  if (placement.edge === "bottom") {
    return { left: `-${INSET}`, bottom: `calc(-1 * ${INSET_BOTTOM})`, ...size };
  }
  return { left: `-${INSET}`, top: `-${INSET}`, ...size };
}

export function markSlot(placement: NavPlacement, isOpen: boolean): BoxStyle {
  const size = { width: `${LOGO_BOX}px`, height: `${LOGO_BOX}px` };
  if (!isOpen) {
    const inset = `${BAR_END_INSET}px`;
    return { left: inset, top: inset, ...size };
  }
  const left = `${PANEL_PAD}px`;
  const top = `${PANEL_PAD + (HEADER_ROW - LOGO_BOX) / 2}px`;
  if (placement.panel === "partial") return { left, top, ...size };
  return { left, top: `calc(${top} + ${SAFE_TOP})`, ...size };
}

export function panelSafeArea(placement: NavPlacement): {
  paddingTop?: string;
  paddingBottom?: string;
} {
  if (placement.panel === "partial") return {};
  return { paddingTop: SAFE_TOP, paddingBottom: "env(safe-area-inset-bottom, 0px)" };
}
