/**
 * The parts of the nav that both the browser suite and every visual treatment
 * agree on: where the controls and the mark sit, how big they are, where the
 * sheet opens and what it is called. Class names, colour and motion are not in
 * here.
 */

/** `bottom`: units and search in the two bottom corners. `left`: the two
 *  stacked at the bottom of a column on the left edge, the mark at its top. */
export type ControlEdge = "bottom" | "left";
/** `sheet` spans the viewport's width; `column` is `PANEL_WIDTH` on the left. */
export type PanelMode = "sheet" | "column";
/** Direction a dismiss drag travels. `null` at ≥ 1280, where there is no drag. */
export type DragAxis = "down" | "left" | null;

export interface NavPlacement {
  edge: ControlEdge;
  panel: PanelMode;
  drag: DragAxis;
}

/** Tailwind's lg and xl. */
export const BREAKPOINT_LG = 1024;
export const BREAKPOINT_XL = 1280;

export const MEDIA_LG = `(min-width: ${BREAKPOINT_LG}px)`;
export const MEDIA_XL = `(min-width: ${BREAKPOINT_XL}px)`;

/** Pixels. */
export const EDGE_INSET = 12;
export const ICON_BUTTON = 44;
/** Height of a floating control, and the width of the search one. */
export const CONTROL = 48;
/** The mark is the same size as the search button. */
export const LOGO_BOX = CONTROL;
/** The ring a floating control leaves around its 44 px cell. */
export const CONTROL_RING = (CONTROL - ICON_BUTTON) / 2;
/** The units capsule's long side: two 44 px cells and the ring. */
export const UNITS_LENGTH = 2 * ICON_BUTTON + 2 * CONTROL_RING;
export const GLYPH_SIZE = 20;
export const GLYPH_STROKE = 1.75;
/** The left column at `lg` and wider: its width, the inset of the mark and the
 *  bottom cell from its ends, and the gap that groups search apart from units. */
export const COLUMN_WIDTH = 56;
export const COLUMN_END_INSET = (COLUMN_WIDTH - ICON_BUTTON) / 2;
export const COLUMN_GROUP_GAP = COLUMN_WIDTH / 2;
/** What `<main>` is padded by beside the left column. */
export const COLUMN_FOOTPRINT = COLUMN_WIDTH + EDGE_INSET;
/** What `<main>` is padded by under the bottom controls. */
export const CONTROL_FOOTPRINT = CONTROL + EDGE_INSET;
/** Width of the `column` panel. */
export const PANEL_WIDTH = 420;
/** The dialog corner the design system gives every overlay surface. */
export const PANEL_RADIUS = 36;

export const NAV_ROOT_ID = "nav-root";
export const NAV_PANEL_ID = "nav-panel";

export const NAV_LABEL_CLOSED = "Main";
export const NAV_LABEL_OPEN = "Search";

export function navPlacement(width: number): NavPlacement {
  if (width < BREAKPOINT_LG) return { edge: "bottom", panel: "sheet", drag: "down" };
  if (width < BREAKPOINT_XL) return { edge: "left", panel: "column", drag: "left" };
  return { edge: "left", panel: "column", drag: null };
}

/** Same table, from the two media queries the hook subscribes to. */
export function placementFromMatches(lg: boolean, xl: boolean): NavPlacement {
  if (xl) return navPlacement(BREAKPOINT_XL);
  if (lg) return navPlacement(BREAKPOINT_LG);
  return navPlacement(0);
}

/** Inline styles rather than Tailwind arbitrary values: the browser suite reads
 *  these numbers back off `getBoundingClientRect()`, so they have to survive
 *  whatever class names a visual treatment puts on the element. */
export interface BoxStyle {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  height?: string;
}

const px = (n: number) => `${n}px`;
const INSET = px(EDGE_INSET);
/** `env()` resolves to 0 everywhere except a notched viewport. */
const SAFE_TOP = "env(safe-area-inset-top, 0px)";
const SAFE_BOTTOM = "env(safe-area-inset-bottom, 0px)";
const INSET_TOP = `calc(${INSET} + ${SAFE_TOP})`;
const INSET_BOTTOM = `calc(${INSET} + ${SAFE_BOTTOM})`;

/** The left column's centre line. Every piece at `lg` and wider is centred on
 *  it. */
const COLUMN_CENTRE = EDGE_INSET + COLUMN_WIDTH / 2;
const COLUMN_PIECE_LEFT = px(COLUMN_CENTRE - CONTROL / 2);
const UNITS_BOTTOM = EDGE_INSET + COLUMN_END_INSET - CONTROL_RING;
/** The search cell sits `COLUMN_GROUP_GAP` above the units cells. */
const SEARCH_BOTTOM = UNITS_BOTTOM + UNITS_LENGTH + COLUMN_GROUP_GAP - 2 * CONTROL_RING;

export function searchGeometry(placement: NavPlacement): BoxStyle {
  const size = { width: px(CONTROL), height: px(CONTROL) };
  if (placement.edge === "bottom") return { right: INSET, bottom: INSET_BOTTOM, ...size };
  return { left: COLUMN_PIECE_LEFT, bottom: px(SEARCH_BOTTOM), ...size };
}

/** A capsule along the bottom edge, stood upright in the left column. */
export function unitsGeometry(placement: NavPlacement): BoxStyle {
  if (placement.edge === "bottom") {
    return { left: INSET, bottom: INSET_BOTTOM, width: px(UNITS_LENGTH), height: px(CONTROL) };
  }
  return {
    left: COLUMN_PIECE_LEFT,
    bottom: px(UNITS_BOTTOM),
    width: px(CONTROL),
    height: px(UNITS_LENGTH),
  };
}

/** The mark at the top of the left column, as far from the top as the units
 *  capsule is from the bottom. Below `lg` it is in the content flow instead;
 *  see `markRow`. */
export function markGeometry(): BoxStyle {
  return {
    left: px(COLUMN_CENTRE - LOGO_BOX / 2),
    top: px(UNITS_BOTTOM),
    width: px(LOGO_BOX),
    height: px(LOGO_BOX),
  };
}

/** Top padding of the centred logo row below `lg`. */
export function markRow(): { paddingTop: string } {
  return { paddingTop: INSET_TOP };
}

/** The open sheet. It leaves a strip of scrim on the side away from its edge. */
export function sheetGeometry(placement: NavPlacement): BoxStyle {
  if (placement.panel === "column") {
    return { left: INSET, top: INSET, bottom: INSET, width: px(PANEL_WIDTH) };
  }
  return { left: "0px", right: "0px", bottom: "0px", top: INSET_TOP };
}

/** Corners on the sides that do not touch a viewport edge, and safe-area
 *  padding on the side that does. */
export function sheetSurface(placement: NavPlacement): {
  borderRadius: string;
  paddingBottom?: string;
} {
  const r = px(PANEL_RADIUS);
  if (placement.panel === "column") return { borderRadius: r };
  return { borderRadius: `${r} ${r} 0 0`, paddingBottom: SAFE_BOTTOM };
}

/** Where the sheet enters from and exits to: past the edge it belongs to. */
export function sheetOffscreen(placement: NavPlacement): { x: number } | { y: string } {
  if (placement.panel === "column") return { x: -(PANEL_WIDTH + EDGE_INSET) };
  return { y: "100%" };
}

export function mainPadding(placement: NavPlacement): {
  paddingBottom?: string;
  paddingLeft?: string;
} {
  if (placement.edge === "bottom") {
    return { paddingBottom: `calc(${px(CONTROL_FOOTPRINT)} + ${SAFE_BOTTOM})` };
  }
  return { paddingLeft: px(COLUMN_FOOTPRINT) };
}
