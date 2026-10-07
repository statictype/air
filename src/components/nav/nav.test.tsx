import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { delay, HttpResponse, http } from "msw";
import { App } from "@/App";
import type { WeatherCurrent } from "@/api/types";
import { __resetHistoryStoreForTests } from "@/hooks/use-history";
import { __resetUnitSystemForTests } from "@/hooks/use-unit-system";
import { __resetFirstRunForTests } from "@/lib/first-run";
import { server } from "@/test/msw-server";
import { distance, pressure, speed, temperature } from "@/worker/format";
import { precipAmountPair } from "@/worker/precip";
import { NAV_PANEL_ID, NAV_ROOT_ID } from "./contract";

const paris: WeatherCurrent = {
  location: {
    name: "Paris",
    region: "Ile-de-France",
    country: "France",
    localTime: "",
    tz: "Europe/Paris",
    lat: 48.85,
    lon: 2.35,
  },
  current: {
    temp: temperature(18, 64.4),
    feelsLike: temperature(18, 64.4),
    heatIndex: temperature(18, 64.4),
    windchill: temperature(18, 64.4),
    dewpoint: temperature(9, 48.2),
    conditionText: "Sunny",
    conditionCode: 1000,
    timeOfDay: "day",
    wind: speed(9, 5.6),
    gust: speed(14, 8.7),
    windDir: "NE",
    windDegree: 45,
    humidity: 55,
    pressureMb: 1018,
    pressure: pressure(1018, 30.06),
    visibility: distance(10, 6),
    uv: 5,
    cloud: 5,
    precip: precipAmountPair(0, "mm"),
    comfort: { thermal: "Mild", air: "Comfortable", sentence: "Mild and comfortable" },
    beaufort: "Light breeze",
  },
};

function renderApp(url = "/") {
  __resetHistoryStoreForTests();
  __resetUnitSystemForTests("metric");
  __resetFirstRunForTests();
  window.history.replaceState(null, "", url);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

const searchTrigger = () => screen.getByRole("button", { name: "Search" });
const imperial = () => screen.getByRole("button", { name: /imperial units/i });
const field = () => screen.getByRole("searchbox");

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  server.use(
    http.get("/api/search", ({ request }) => {
      const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? "";
      if (q.includes("par")) {
        return HttpResponse.json([
          {
            id: 1,
            name: "Paris",
            region: "Ile-de-France",
            country: "France",
            lat: 48.85,
            lon: 2.35,
            url: "paris",
          },
        ]);
      }
      return HttpResponse.json([]);
    }),
  );
});

describe("nav shell", () => {
  it("the search trigger opens the panel with the field focused", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(searchTrigger());

    expect(field()).toHaveFocus();
  });

  it("switches units from the closed bar, without opening the panel", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(imperial()).toHaveAttribute("aria-pressed", "false");

    await user.click(imperial());

    expect(imperial()).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Escape closes and focus returns to the trigger that opened it", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(searchTrigger());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(searchTrigger()).toHaveFocus();
  });

  it("opens a modal dialog beside the nav, which stays mounted and goes inert", async () => {
    const user = userEvent.setup();
    renderApp();

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveAttribute("id", NAV_ROOT_ID);

    await user.click(searchTrigger());

    const dialog = screen.getByRole("dialog", { name: "Search" });
    expect(dialog).toHaveAttribute("id", NAV_PANEL_ID);
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(nav).not.toContainElement(dialog);
    expect(nav).toHaveAttribute("inert");
    expect(document.getElementById(NAV_ROOT_ID)).toBe(nav);
  });

  it("marks <main> inert while the panel is open and not after it closes", async () => {
    const user = userEvent.setup();
    renderApp();

    const main = document.querySelector("main");
    expect(main).not.toHaveAttribute("inert");

    await user.click(searchTrigger());
    expect(main).toHaveAttribute("inert");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(main).not.toHaveAttribute("inert"));
  });

  it("the trigger points at the panel and reports its expanded state", async () => {
    const user = userEvent.setup();
    renderApp();

    expect(searchTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(searchTrigger()).toHaveAttribute("aria-controls", "nav-panel");

    await user.click(searchTrigger());
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(searchTrigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("a not_found reaches the panel after one request, with no retry", async () => {
    let calls = 0;
    server.use(
      http.get("/api/weather", () => {
        calls += 1;
        return HttpResponse.json(
          { error: { kind: "not_found", message: "No matching location found." } },
          { status: 404 },
        );
      }),
      http.get("/api/weather/forecast", () =>
        HttpResponse.json(
          { error: { kind: "not_found", message: "No matching location found." } },
          { status: 404 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderApp("/?city=Nowhereville");

    await user.click(searchTrigger());
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/no weather for “Nowhereville”/i),
    );

    expect(calls).toBe(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("holds the panel open until a selected city settles, then collapses", async () => {
    server.use(
      http.get("/api/weather", async () => {
        await delay(40);
        return HttpResponse.json(paris);
      }),
      http.get("/api/weather/forecast", async () => {
        await delay(40);
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const user = userEvent.setup();
    renderApp();

    await user.click(searchTrigger());
    await user.type(field(), "Paris");

    const row = await screen.findByRole("button", { name: /search weather for paris/i });
    await user.click(row);

    // Still open while the request is in flight.
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(new URL(window.location.href).searchParams.get("city")).toContain("Paris");
  });

  it("holds the panel open with the message inline when the selection errors", async () => {
    server.use(
      http.get("/api/weather", () =>
        HttpResponse.json(
          { error: { kind: "not_found", message: "No matching location found." } },
          { status: 404 },
        ),
      ),
      http.get("/api/weather/forecast", () =>
        HttpResponse.json(
          { error: { kind: "not_found", message: "No matching location found." } },
          { status: 404 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderApp();

    await user.click(searchTrigger());
    await user.type(field(), "Paris");
    await user.click(await screen.findByRole("button", { name: /search weather for paris/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/no weather for/i));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Settled, unsuccessfully — the field is live again.
    expect(field()).not.toBeDisabled();
  });
});
