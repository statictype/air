import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { page } from "@vitest/browser/context";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { __resetHistoryStoreForTests } from "@/hooks/use-history";
import { __resetUnitSystemForTests } from "@/hooks/use-unit-system";
import {
  COLUMN_FOOTPRINT,
  CONTROL,
  CONTROL_FOOTPRINT,
  EDGE_INSET,
  LOGO_BOX,
  NAV_PANEL_ID,
  NAV_ROOT_ID,
  navPlacement,
  PANEL_WIDTH,
  UNITS_LENGTH,
} from "./contract";

/** Every band the placement table distinguishes, plus a tablet width inside
 *  the first. */
const WIDTHS = [375, 900, 1100, 1440] as const;
const HEIGHT = 800;

function renderApp() {
  __resetHistoryStoreForTests();
  __resetUnitSystemForTests("metric");
  window.history.replaceState(null, "", "/");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

const navRoot = () => document.getElementById(NAV_ROOT_ID)!;
const searchButton = () => screen.getByRole("button", { name: "Search" });
/** The glass piece a control sits in. */
const pieceOf = (el: Element) => el.closest<HTMLElement>(".nav-surface")!.getBoundingClientRect();

/** The sheet springs in from off-screen, so every rect assertion is retried
 *  until the spring has arrived rather than sampled once. */
function whenSettled(read: () => DOMRect, assert: (rect: DOMRect) => void) {
  return waitFor(() => assert(read()), { timeout: 4000, interval: 50 });
}

beforeEach(() => {
  // No MSW in the browser project: the geometry does not depend on a payload.
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/search")) return new Response("[]", { status: 200 });
    return new Response(JSON.stringify({ error: { kind: "not_found", message: "none" } }), {
      status: 404,
    });
  });
});

describe.each(WIDTHS)("nav geometry at %ipx", (width) => {
  const placement = navPlacement(width);

  beforeEach(async () => {
    await page.viewport(width, HEIGHT);
  });

  it.runIf(placement.edge === "bottom")(
    "puts units and search in the bottom corners and centres the mark",
    () => {
      renderApp();
      const search = pieceOf(searchButton());
      const units = pieceOf(screen.getByRole("group", { name: "Units" }));
      const mark = screen.getByRole("heading", { level: 1 }).getBoundingClientRect();

      expect(search.width).toBeCloseTo(CONTROL, 0);
      expect(search.height).toBeCloseTo(CONTROL, 0);
      expect(search.right).toBeCloseTo(width - EDGE_INSET, 0);
      expect(search.bottom).toBeCloseTo(HEIGHT - EDGE_INSET, 0);

      expect(units.width).toBeCloseTo(UNITS_LENGTH, 0);
      expect(units.height).toBeCloseTo(CONTROL, 0);
      expect(units.left).toBeCloseTo(EDGE_INSET, 0);
      expect(units.bottom).toBeCloseTo(HEIGHT - EDGE_INSET, 0);

      expect(mark.left + mark.width / 2).toBeCloseTo(width / 2, 0);
    },
  );

  it.runIf(placement.edge === "left")(
    "stacks search over units at the bottom left, under the mark, with no bar",
    () => {
      renderApp();
      const search = pieceOf(searchButton());
      const units = pieceOf(screen.getByRole("group", { name: "Units" }));
      const mark = screen.getByRole("heading", { level: 1 }).getBoundingClientRect();

      expect(units.width).toBeCloseTo(CONTROL, 0);
      expect(units.height).toBeCloseTo(UNITS_LENGTH, 0);
      expect(search.bottom).toBeLessThan(units.top);
      expect(mark.width).toBeCloseTo(LOGO_BOX, 0);
      expect(mark.top).toBeLessThan(EDGE_INSET * 2);

      const centre = (r: DOMRect) => r.left + r.width / 2;
      expect(centre(search)).toBeCloseTo(centre(units), 0);
      expect(centre(mark)).toBeCloseTo(centre(units), 0);
      expect(document.querySelectorAll("#nav-root .nav-surface")).toHaveLength(2);
    },
  );

  it(`opens a ${placement.panel} from the ${placement.edge} edge`, async () => {
    renderApp();
    searchButton().click();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    const sheet = () => document.getElementById(NAV_PANEL_ID)!.getBoundingClientRect();

    await whenSettled(sheet, (rect) => {
      if (placement.panel === "column") {
        expect(rect.width).toBeCloseTo(PANEL_WIDTH, 0);
        expect(rect.left).toBeCloseTo(EDGE_INSET, 0);
        expect(rect.top).toBeCloseTo(EDGE_INSET, 0);
        expect(rect.height).toBeCloseTo(HEIGHT - EDGE_INSET * 2, 0);
      } else {
        expect(rect.left).toBeCloseTo(0, 0);
        expect(rect.width).toBeCloseTo(width, 0);
        expect(rect.top).toBeCloseTo(EDGE_INSET, 0);
        expect(rect.bottom).toBeCloseTo(HEIGHT, 0);
      }
    });
  });

  it("pads the content column clear of the controls", () => {
    renderApp();
    const column = document.querySelector("main")!.closest<HTMLElement>("[style]")!;
    const style = getComputedStyle(column);
    if (placement.edge === "bottom") {
      expect(parseFloat(style.paddingBottom)).toBeCloseTo(CONTROL_FOOTPRINT, 0);
    } else {
      expect(parseFloat(style.paddingLeft)).toBeCloseTo(COLUMN_FOOTPRINT, 0);
    }
  });

  it("opens the dialog beside <nav>, with <nav> and <main> inert while it is up", async () => {
    renderApp();
    const nav = navRoot();
    const main = document.querySelector("main")!;
    expect(main.hasAttribute("inert")).toBe(false);
    expect(nav.hasAttribute("inert")).toBe(false);

    searchButton().click();
    await waitFor(() => expect(main.hasAttribute("inert")).toBe(true));
    expect(nav.hasAttribute("inert")).toBe(true);
    expect(nav.contains(screen.getByRole("dialog"))).toBe(false);

    screen.getByRole("button", { name: "Close" }).click();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(main.hasAttribute("inert")).toBe(false);
    expect(nav.hasAttribute("inert")).toBe(false);
    expect(navRoot()).toBe(nav);
  });

  it("leaves no horizontal overflow", () => {
    renderApp();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  });
});
