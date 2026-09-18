import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { page } from "@vitest/browser/context";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { __resetHistoryStoreForTests } from "@/hooks/use-history";
import { __resetUnitSystemForTests } from "@/hooks/use-unit-system";
import {
  BAR_INSET,
  BAR_THICKNESS,
  NAV_ROOT_ID,
  navPlacement,
  PANEL_WIDTH,
  RAIL_FOOTPRINT,
} from "./contract";

/** Every viewport the placement table distinguishes, one width per band. */
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

/** The box springs between the two geometries, so every rect assertion is
 *  retried until the spring has arrived rather than sampled once. */
function whenSettled(assert: (rect: DOMRect) => void) {
  return waitFor(() => assert(navRoot().getBoundingClientRect()), {
    timeout: 4000,
    interval: 50,
  });
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

  it(`puts the closed bar on the ${placement.edge} edge, ${BAR_THICKNESS}px thick`, async () => {
    renderApp();

    await whenSettled((rect) => {
      if (placement.edge === "left") {
        expect(rect.width).toBeCloseTo(BAR_THICKNESS, 0);
        expect(rect.left).toBeCloseTo(BAR_INSET, 0);
        expect(rect.top).toBeCloseTo(BAR_INSET, 0);
        expect(rect.bottom).toBeCloseTo(HEIGHT - BAR_INSET, 0);
      } else {
        expect(rect.height).toBeCloseTo(BAR_THICKNESS, 0);
        expect(rect.left).toBeCloseTo(BAR_INSET, 0);
        expect(rect.right).toBeCloseTo(width - BAR_INSET, 0);
        if (placement.edge === "top") expect(rect.top).toBeCloseTo(BAR_INSET, 0);
        else expect(rect.bottom).toBeCloseTo(HEIGHT - BAR_INSET, 0);
      }
    });
  });

  it("spans the edge it sits on, minus its insets", async () => {
    renderApp();

    await whenSettled((rect) => {
      const span = placement.edge === "left" ? rect.height : rect.width;
      const available = placement.edge === "left" ? HEIGHT : width;
      expect(span).toBeCloseTo(available - BAR_INSET * 2, 0);
    });
  });

  it(`opens to a ${placement.panel} panel`, async () => {
    renderApp();
    screen.getByRole("button", { name: "Search" }).click();

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await whenSettled((rect) => {
      if (placement.panel === "partial") {
        expect(rect.width).toBeCloseTo(PANEL_WIDTH, 0);
        expect(rect.left).toBeCloseTo(BAR_INSET, 0);
        expect(rect.height).toBeCloseTo(HEIGHT - BAR_INSET * 2, 0);
      } else {
        expect(rect.width).toBeCloseTo(width, 0);
        expect(rect.height).toBeCloseTo(HEIGHT, 0);
        expect(rect.left).toBeCloseTo(0, 0);
        expect(rect.top).toBeCloseTo(0, 0);
      }
    });
  });

  it("pads the content column by the bar's footprint on the bar's side", async () => {
    renderApp();
    const column = document.querySelector("main")!.closest<HTMLElement>("[style]")!;
    const style = getComputedStyle(column);
    const side =
      placement.edge === "bottom"
        ? style.paddingBottom
        : placement.edge === "top"
          ? style.paddingTop
          : style.paddingLeft;
    expect(parseFloat(side)).toBeCloseTo(RAIL_FOOTPRINT, 0);
  });

  it("marks <main> inert only while the panel is open, and keeps one node", async () => {
    renderApp();
    const root = navRoot();
    const main = document.querySelector("main")!;
    expect(main.hasAttribute("inert")).toBe(false);
    expect(root.getAttribute("role")).toBe(null);

    screen.getByRole("button", { name: "Search" }).click();
    await waitFor(() => expect(main.hasAttribute("inert")).toBe(true));
    expect(document.getElementById(NAV_ROOT_ID)).toBe(root);
    expect(root.getAttribute("role")).toBe("dialog");

    screen.getByRole("button", { name: "Close" }).click();
    await waitFor(() => expect(main.hasAttribute("inert")).toBe(false));
    expect(document.getElementById(NAV_ROOT_ID)).toBe(root);
    expect(root.getAttribute("role")).toBe(null);
  });

  it("leaves no horizontal overflow", async () => {
    renderApp();
    await whenSettled((rect) => expect(rect.width).toBeGreaterThan(0));
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
  });
});
