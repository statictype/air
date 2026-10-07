import { describe, expect, it } from "vitest";
import {
  COLUMN_FOOTPRINT,
  CONTROL,
  CONTROL_FOOTPRINT,
  EDGE_INSET,
  LOGO_BOX,
  mainPadding,
  markGeometry,
  navPlacement,
  PANEL_WIDTH,
  placementFromMatches,
  searchGeometry,
  sheetGeometry,
  sheetOffscreen,
  UNITS_LENGTH,
  unitsGeometry,
} from "./contract";

const px = (n: number) => `${n}px`;

describe("navPlacement", () => {
  it("reads the three states off the two thresholds", () => {
    expect(navPlacement(375)).toEqual({ edge: "bottom", panel: "sheet", drag: "down" });
    expect(navPlacement(900)).toEqual({ edge: "bottom", panel: "sheet", drag: "down" });
    expect(navPlacement(1023)).toEqual({ edge: "bottom", panel: "sheet", drag: "down" });
    expect(navPlacement(1024)).toEqual({ edge: "left", panel: "column", drag: "left" });
    expect(navPlacement(1279)).toEqual({ edge: "left", panel: "column", drag: "left" });
    expect(navPlacement(1280)).toEqual({ edge: "left", panel: "column", drag: null });
    expect(navPlacement(1920)).toEqual({ edge: "left", panel: "column", drag: null });
  });

  it("agrees with the media-query form at every band", () => {
    expect(placementFromMatches(false, false)).toEqual(navPlacement(375));
    expect(placementFromMatches(true, false)).toEqual(navPlacement(1100));
    expect(placementFromMatches(true, true)).toEqual(navPlacement(1440));
  });
});

describe("controls", () => {
  it("puts units and search in the two bottom corners below lg", () => {
    const placement = navPlacement(375);
    const units = unitsGeometry(placement);
    expect(units).toMatchObject({
      left: px(EDGE_INSET),
      width: px(UNITS_LENGTH),
      height: px(CONTROL),
    });
    expect(units.bottom).toContain("safe-area-inset-bottom");

    const search = searchGeometry(placement);
    expect(search).toMatchObject({
      right: px(EDGE_INSET),
      width: px(CONTROL),
      height: px(CONTROL),
    });
    expect(search.bottom).toContain("safe-area-inset-bottom");
  });

  it("stands units upright under search, on the mark's centre line, at lg and wider", () => {
    const placement = navPlacement(1440);
    const units = unitsGeometry(placement);
    const search = searchGeometry(placement);
    const mark = markGeometry();

    expect(units).toMatchObject({ width: px(CONTROL), height: px(UNITS_LENGTH) });
    expect(units.left).toBe(search.left);
    expect(parseFloat(search.bottom!)).toBeGreaterThan(parseFloat(units.bottom!) + UNITS_LENGTH);

    const centre = (box: { left?: string; width?: string }) =>
      parseFloat(box.left!) + parseFloat(box.width!) / 2;
    expect(centre(units)).toBe(centre(mark));
    expect(mark).toMatchObject({ width: px(LOGO_BOX), height: px(LOGO_BOX) });
  });
});

describe("sheetGeometry", () => {
  it("runs edge to edge from the bottom below lg", () => {
    const sheet = sheetGeometry(navPlacement(900));
    expect(sheet).toMatchObject({ left: "0px", right: "0px", bottom: "0px" });
    expect(sheet.top).toContain(px(EDGE_INSET));
  });

  it("is a column at the edge inset at lg and wider", () => {
    for (const width of [1100, 1440]) {
      expect(sheetGeometry(navPlacement(width))).toEqual({
        left: px(EDGE_INSET),
        top: px(EDGE_INSET),
        bottom: px(EDGE_INSET),
        width: px(PANEL_WIDTH),
      });
    }
  });

  it("enters and leaves past its edge", () => {
    expect(sheetOffscreen(navPlacement(375))).toEqual({ y: "100%" });
    expect(sheetOffscreen(navPlacement(1440))).toEqual({ x: -(PANEL_WIDTH + EDGE_INSET) });
  });
});

describe("mainPadding", () => {
  it("clears the bottom controls below lg and the left column above it", () => {
    expect(mainPadding(navPlacement(375)).paddingBottom).toContain(px(CONTROL_FOOTPRINT));
    expect(mainPadding(navPlacement(1100))).toEqual({ paddingLeft: px(COLUMN_FOOTPRINT) });
    expect(mainPadding(navPlacement(1440))).toEqual({ paddingLeft: px(COLUMN_FOOTPRINT) });
  });
});
